-- ══ 0079 · TALEP KARARI: DÜZELTMEYE GERİ GÖNDER, ONAYLAYAN DEĞİŞTİREMEZ (477; reisim 2026-10-10, Talepler ve Onaylar sunumu — karar formu:
-- T1 "evet" onay bekleyen her şey Onaylar'da · T2 "hayır" onaylayan talebin içeriğini değiştiremez: Onayla · Düzeltmeye geri gönder · Reddet ·
-- T4 "kalksın" Personel / Muhasebe'deki onay tuşları · T5 "muhasebe" Ödendi Muhasebe'de; hata listesi 35: "masraf formu isteği vb onaylarken
-- değişiklikte yapmama izin veriyor bu vb şeyler onaya düşmeli direk bu olayları düzgün kurgula") ══
-- İzin talebi ve masraf formu (gider, kaynak "form") yeni durum alır: "duzeltme" — onaylayan gerekçeyle (10–200, "geri") talep edene geri gönderir;
-- talep eden içeriği düzeltip yeniden gönderir (duzeltme → bekliyor; yalnız talep eden; karar damgası silinir, son düzeltme notu kalır). Düzeltmedeki
-- talebe karar verilmez; talep eden geri çekebilir. Onaylayan talebin İÇERİĞİNİ hiçbir durumda değiştiremez (izinde zaten yoktu; masraf formunda
-- muhasebe tutar / tür / açıklama / iş düzeltebiliyordu — kalktı); fişi / belgeyi yalnız talep eden, onay beklerken ya da düzeltmedeyken değiştirir.
-- İşlevler (izin_talebi_koru, gider_koru) bütünüyle yenilenir; 0042 / 0043'teki satırlar aynı kalır (olumsuz kanıtlar bu göçü bozar).
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE izin_talebi ADD COLUMN IF NOT EXISTS geri text;
ALTER TABLE gider ADD COLUMN IF NOT EXISTS geri text;
DO $$ BEGIN
  ALTER TABLE izin_talebi DROP CONSTRAINT IF EXISTS izin_talebi_durum_check;
  ALTER TABLE izin_talebi ADD CONSTRAINT izin_talebi_durum_check CHECK (durum IN ('bekliyor', 'onaylandi', 'red', 'duzeltme'));
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'izin_talebi_geri_check') THEN
    ALTER TABLE izin_talebi ADD CONSTRAINT izin_talebi_geri_check CHECK (geri IS NULL OR length(btrim(geri)) BETWEEN 10 AND 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'izin_talebi_duzeltme_geri') THEN
    ALTER TABLE izin_talebi ADD CONSTRAINT izin_talebi_duzeltme_geri CHECK (durum <> 'duzeltme' OR geri IS NOT NULL);
  END IF;
  ALTER TABLE gider DROP CONSTRAINT IF EXISTS gider_durum_check;
  ALTER TABLE gider ADD CONSTRAINT gider_durum_check CHECK (durum IN ('bekliyor', 'onaylandi', 'odendi', 'red', 'duzeltme'));
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gider_geri_check') THEN
    ALTER TABLE gider ADD CONSTRAINT gider_geri_check CHECK (geri IS NULL OR length(btrim(geri)) BETWEEN 10 AND 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gider_duzeltme') THEN
    ALTER TABLE gider ADD CONSTRAINT gider_duzeltme CHECK (durum <> 'duzeltme' OR (kaynak = 'form' AND geri IS NOT NULL));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION izin_talebi_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.durum IN ('bekliyor', 'duzeltme') AND ben IS NOT NULL AND OLD.kaydeden = ben THEN RETURN OLD; END IF;
    RAISE EXCEPTION 'izin talebini yalnız talep eden, onay beklerken geri çeker' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'bekliyor' THEN RAISE EXCEPTION 'izin talebi onay bekler' USING ERRCODE = '23514'; END IF;
    IF NEW.personel_id IS DISTINCT FROM (SELECT h.personel_id FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.id = ben) THEN
      RAISE EXCEPTION 'izin talebi yalnız kendi adına gönderilir' USING ERRCODE = '23514';
    END IF;
    NEW.kaydeden := ben; NEW.onaylayan := NULL; NEW.karar := NULL; NEW.red := NULL; NEW.geri := NULL;
    RETURN NEW;
  END IF;
  IF NEW.no IS DISTINCT FROM OLD.no OR NEW.personel_id IS DISTINCT FROM OLD.personel_id OR NEW.kaydeden IS DISTINCT FROM OLD.kaydeden
    OR NEW.olustu IS DISTINCT FROM OLD.olustu OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'izin talebinin numarası, sahibi ve kaydedeni değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum IN ('onaylandi', 'red') THEN RAISE EXCEPTION 'karar verilmiş izin talebi değişmez' USING ERRCODE = '23514'; END IF;
  -- içerik yalnız talep eden tarafından, düzeltmeye geri gönderilmişken değişir — onaylayan hiçbir durumda değiştiremez (477, T2)
  IF (NEW.tur IS DISTINCT FROM OLD.tur OR NEW.bas IS DISTINCT FROM OLD.bas OR NEW.bit IS DISTINCT FROM OLD.bit OR NEW.gun IS DISTINCT FROM OLD.gun
    OR NEW.aciklama IS DISTINCT FROM OLD.aciklama) AND (OLD.durum <> 'duzeltme' OR ben IS NULL OR OLD.kaydeden IS DISTINCT FROM ben) THEN
    RAISE EXCEPTION 'gönderilen izin talebinin içeriği değişmez (düzeltmeye geri gönderilince talep eden düzeltir)' USING ERRCODE = '23514';
  END IF;
  -- belge: yalnız talep eden; karar anında hiç değişmez (329–332 incelemesi), düzeltip yeniden gönderirken değişebilir
  IF NEW.belge IS DISTINCT FROM OLD.belge AND (ben IS NULL OR OLD.kaydeden IS DISTINCT FROM ben OR (NEW.durum IS DISTINCT FROM OLD.durum AND NOT (OLD.durum = 'duzeltme' AND NEW.durum = 'bekliyor'))) THEN
    RAISE EXCEPTION 'talebin belgesini yalnız talep eden değiştirir' USING ERRCODE = '23514';
  END IF;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF NEW.durum = 'bekliyor' THEN
      -- düzeltip yeniden gönder: yalnız talep eden; karar damgası silinir, son düzeltme notu kalır
      IF OLD.durum <> 'duzeltme' OR ben IS NULL OR OLD.kaydeden IS DISTINCT FROM ben THEN
        RAISE EXCEPTION 'düzeltilen izin talebini yalnız talep eden yeniden gönderir' USING ERRCODE = '23514';
      END IF;
      IF NEW.geri IS DISTINCT FROM OLD.geri OR NEW.red IS DISTINCT FROM OLD.red THEN RAISE EXCEPTION 'düzeltme notu yeniden gönderirken değişmez' USING ERRCODE = '23514'; END IF;
      NEW.onaylayan := NULL; NEW.karar := NULL;
    ELSIF NEW.durum IN ('onaylandi', 'red', 'duzeltme') THEN
      IF OLD.durum = 'duzeltme' THEN RAISE EXCEPTION 'düzeltmedeki izin talebine karar verilmez' USING ERRCODE = '23514'; END IF;
      IF NEW.durum = 'duzeltme' AND NEW.geri IS NOT DISTINCT FROM OLD.geri THEN RAISE EXCEPTION 'düzeltme gerekçesi yazılmalı' USING ERRCODE = '23514'; END IF;
      IF NEW.durum <> 'duzeltme' AND NEW.geri IS DISTINCT FROM OLD.geri THEN RAISE EXCEPTION 'düzeltme notu yalnız geri gönderirken yazılır' USING ERRCODE = '23514'; END IF;
      NEW.onaylayan := ben; NEW.karar := now();
    ELSE
      RAISE EXCEPTION 'izin talebi % durumuna geçemez', NEW.durum USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.onaylayan IS DISTINCT FROM OLD.onaylayan OR NEW.karar IS DISTINCT FROM OLD.karar OR NEW.red IS DISTINCT FROM OLD.red OR NEW.geri IS DISTINCT FROM OLD.geri THEN
    RAISE EXCEPTION 'karar yalnız durum değişirken yazılır' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION izin_talebi_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION izin_talebi_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER izin_talebi_koru BEFORE INSERT OR UPDATE OR DELETE ON izin_talebi FOR EACH ROW EXECUTE FUNCTION izin_talebi_koru();

CREATE OR REPLACE FUNCTION gider_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE bugun date := (now() AT TIME ZONE 'Europe/Istanbul')::date; ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  icerik boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.kaynak = 'form' AND OLD.durum IN ('bekliyor', 'duzeltme') AND ben IS NOT NULL AND OLD.kaydeden = ben THEN RETURN OLD; END IF;
    RAISE EXCEPTION 'gider silinmez' USING ERRCODE = '23514';
  END IF;
  IF NEW.tarih > bugun THEN RAISE EXCEPTION 'ileri tarihli gider kaydedilmez' USING ERRCODE = '23514'; END IF;
  IF NEW.odeme > bugun THEN RAISE EXCEPTION 'ileri tarihli ödeme kaydedilmez' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.kaydeden := ben; NEW.onaylayan := NULL; NEW.karar := NULL; NEW.geri := NULL;
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
  -- masraf formunun kişisi değişmez (329–332 incelemesi: muhasebe düzenlemesinde değişince form gönderenin Talepler'inden düşüyordu)
  IF OLD.kaynak = 'form' AND NEW.personel_id IS DISTINCT FROM OLD.personel_id THEN
    RAISE EXCEPTION 'masraf formunun personeli değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'red' THEN RAISE EXCEPTION 'reddedilen gider değişmez' USING ERRCODE = '23514'; END IF;
  -- 477 (T2): masraf formunun içeriğini onaylayan değiştiremez — yalnız talep eden, düzeltmeye geri gönderilmişken; fişi talep eden onay beklerken
  -- ya da düzeltmedeyken
  icerik := NEW.tarih IS DISTINCT FROM OLD.tarih OR NEW.tur IS DISTINCT FROM OLD.tur OR NEW.tutar IS DISTINCT FROM OLD.tutar OR NEW.oran IS DISTINCT FROM OLD.oran
    OR NEW.aciklama IS DISTINCT FROM OLD.aciklama OR NEW.plan_id IS DISTINCT FROM OLD.plan_id;
  IF OLD.kaynak = 'form' AND OLD.durum IN ('bekliyor', 'onaylandi', 'odendi') AND icerik THEN
    RAISE EXCEPTION 'masraf formunun içeriği değişmez (düzeltmeye geri gönderilince talep eden düzeltir)' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'duzeltme' AND icerik AND (ben IS NULL OR OLD.kaydeden IS DISTINCT FROM ben) THEN
    RAISE EXCEPTION 'düzeltmedeki masraf formunu yalnız talep eden düzeltir' USING ERRCODE = '23514';
  END IF;
  IF OLD.kaynak = 'form' AND NEW.belge IS DISTINCT FROM OLD.belge AND (ben IS NULL OR OLD.kaydeden IS DISTINCT FROM ben OR OLD.durum NOT IN ('bekliyor', 'duzeltme')) THEN
    RAISE EXCEPTION 'masraf formunun fişini yalnız talep eden, karar verilmeden değiştirir' USING ERRCODE = '23514';
  END IF;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF OLD.durum = 'bekliyor' AND NEW.durum IN ('onaylandi', 'red', 'duzeltme') THEN
      IF NEW.durum = 'duzeltme' AND NEW.geri IS NOT DISTINCT FROM OLD.geri THEN RAISE EXCEPTION 'düzeltme gerekçesi yazılmalı' USING ERRCODE = '23514'; END IF;
      IF NEW.durum <> 'duzeltme' AND NEW.geri IS DISTINCT FROM OLD.geri THEN RAISE EXCEPTION 'düzeltme notu yalnız geri gönderirken yazılır' USING ERRCODE = '23514'; END IF;
      NEW.onaylayan := ben; NEW.karar := now();
    ELSIF OLD.durum = 'duzeltme' AND NEW.durum = 'bekliyor' THEN
      -- düzeltip yeniden gönder: yalnız talep eden; karar damgası silinir, son düzeltme notu kalır
      IF ben IS NULL OR OLD.kaydeden IS DISTINCT FROM ben THEN RAISE EXCEPTION 'düzeltilen masraf formunu yalnız talep eden yeniden gönderir' USING ERRCODE = '23514'; END IF;
      IF NEW.geri IS DISTINCT FROM OLD.geri OR NEW.red IS DISTINCT FROM OLD.red THEN RAISE EXCEPTION 'düzeltme notu yeniden gönderirken değişmez' USING ERRCODE = '23514'; END IF;
      NEW.onaylayan := NULL; NEW.karar := NULL;
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
    IF NEW.onaylayan IS DISTINCT FROM OLD.onaylayan OR NEW.karar IS DISTINCT FROM OLD.karar OR NEW.odeme IS DISTINCT FROM OLD.odeme OR NEW.red IS DISTINCT FROM OLD.red
      OR NEW.geri IS DISTINCT FROM OLD.geri THEN
      RAISE EXCEPTION 'onay, ödeme ve red yalnız durum değişirken yazılır' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION gider_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION gider_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER gider_koru BEFORE INSERT OR UPDATE OR DELETE ON gider FOR EACH ROW EXECUTE FUNCTION gider_koru();
