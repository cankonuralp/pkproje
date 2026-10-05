-- ══ 0043 · GİDER KURALLARI (328 incelemesi + 330 Talepler; 0040 Supabase'e uygulandı — uygulanmış göç değişmez, kurallar burada) ══
-- 328 incelemesi: ödeme günü eklemede de ileri olamaz ve gider tarihinden önce olamaz; onaylandı → ödendi geçişinde onaylayan / karar değişmez.
-- 330 Talepler: masraf formu yalnız gönderenin kendi adına (personeli hesabının personeli); onay bekleyen masraf formunu GÖNDEREN geri çekebilir
-- (tek silme istisnası). gider_koru işlevi bütünüyle yenilenir. ⛔ Her göç IDEMPOTENT.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gider_odeme_tarih') THEN
    ALTER TABLE gider ADD CONSTRAINT gider_odeme_tarih CHECK (odeme IS NULL OR odeme >= tarih);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION gider_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE bugun date := (now() AT TIME ZONE 'Europe/Istanbul')::date; ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.kaynak = 'form' AND OLD.durum = 'bekliyor' AND ben IS NOT NULL AND OLD.kaydeden = ben THEN RETURN OLD; END IF;
    RAISE EXCEPTION 'gider silinmez' USING ERRCODE = '23514';
  END IF;
  IF NEW.tarih > bugun THEN RAISE EXCEPTION 'ileri tarihli gider kaydedilmez' USING ERRCODE = '23514'; END IF;
  IF NEW.odeme > bugun THEN RAISE EXCEPTION 'ileri tarihli ödeme kaydedilmez' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.kaydeden := ben; NEW.onaylayan := NULL; NEW.karar := NULL;
    IF NEW.kaynak = 'form' THEN
      IF NEW.durum <> 'bekliyor' THEN RAISE EXCEPTION 'masraf formu onay bekler' USING ERRCODE = '23514'; END IF;
      IF NEW.personel_id IS DISTINCT FROM (SELECT h.personel_id FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.id = ben) THEN
        RAISE EXCEPTION 'masraf formu yalnız kendi adına gönderilir' USING ERRCODE = '23514';
      END IF;
    ELSIF NEW.durum NOT IN ('odendi', 'onaylandi') THEN
      RAISE EXCEPTION 'elle girilen gider ödendi ya da ödenecek doğar' USING ERRCODE = '23514';
    ELSE
      NEW.onaylayan := ben; NEW.karar := now();
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.no IS DISTINCT FROM OLD.no OR NEW.kaynak IS DISTINCT FROM OLD.kaynak OR NEW.kaydeden IS DISTINCT FROM OLD.kaydeden OR NEW.olustu IS DISTINCT FROM OLD.olustu
    OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'giderin numarası, kaynağı ve kaydedeni değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'red' THEN RAISE EXCEPTION 'reddedilen gider değişmez' USING ERRCODE = '23514'; END IF;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF OLD.durum = 'bekliyor' AND NEW.durum IN ('onaylandi', 'red') THEN
      NEW.onaylayan := ben; NEW.karar := now();
    ELSIF OLD.durum = 'onaylandi' AND NEW.durum = 'odendi' THEN
      -- onay damgası korunur (328 incelemesi: bu geçişte onaylayan / karar değiştirilebiliyordu)
      IF NEW.onaylayan IS DISTINCT FROM OLD.onaylayan OR NEW.karar IS DISTINCT FROM OLD.karar OR NEW.red IS DISTINCT FROM OLD.red THEN
        RAISE EXCEPTION 'onay damgası ödemede değişmez' USING ERRCODE = '23514';
      END IF;
      NEW.odeme := coalesce(NEW.odeme, bugun);
      IF NEW.odeme > bugun THEN RAISE EXCEPTION 'ileri tarihli ödeme kaydedilmez' USING ERRCODE = '23514'; END IF;
    ELSE
      RAISE EXCEPTION 'gider % durumundan % durumuna geçemez', OLD.durum, NEW.durum USING ERRCODE = '23514';
    END IF;
  ELSE
    IF NEW.onaylayan IS DISTINCT FROM OLD.onaylayan OR NEW.karar IS DISTINCT FROM OLD.karar OR NEW.odeme IS DISTINCT FROM OLD.odeme OR NEW.red IS DISTINCT FROM OLD.red THEN
      RAISE EXCEPTION 'onay, ödeme ve red yalnız durum değişirken yazılır' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION gider_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION gider_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER gider_koru BEFORE INSERT OR UPDATE OR DELETE ON gider FOR EACH ROW EXECUTE FUNCTION gider_koru();

GRANT SELECT, INSERT, UPDATE, DELETE ON gider TO probata_uygulama;
