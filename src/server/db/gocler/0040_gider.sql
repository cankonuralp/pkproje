-- ══ 0040 · MUHASEBE › GİDERLER (328; maket muhasebe.html #/giderler, gider penceresi; 2026-09-27 reisim: "Giderleri ekle", "denetçi masraf formu
-- ekleyebilsin … muhasebe tarafında onaylanır ödenince ödendi olur, ekstradan muhasebe el ile de masraf ekleyebilir"; KOD-GECIS §3 Muhasebe "gider
-- (masraf formu + elle)", §5 "Gider / masraf: onay bekliyor → onaylandı (ödenecek) → ödendi · reddedildi (gerekçe ≥ 5). Elle girilen: ödendi /
-- ödenecek") ══
-- Gider: no G-AAYY-SIRA (numara üreticisi; önek firma ayarı), tarih (ileri değil), tür (başlangıç türleri: yakıt, konaklama, yol, kalibrasyon, sarf
-- malzeme, diğer — tür başına varsayılan KDV oranı), tutar (fişteki KDV DAHİL tutar, KURUŞ) + KDV oranı, açıklama, isteğe bağlı iş (plan) ve
-- personel, belge (fiş / fatura dosyası; yoksa uyarı, engel değil). Kaynak: "muhasebe" (elle — ödendi ya da ödenecek doğar) ya da "form" (denetçinin
-- masraf formu — onay bekler; Talepler kalemiyle). Geçişler: bekliyor → onaylandı → ödendi; bekliyor → reddedildi (gerekçe 5–200). Reddedilen
-- değişmez; ödenen yalnız içerik düzeltmesi alır. Onaylayan, karar ve ödeme günü, kaydeden veritabanında (oturumdan). Silinmez.
-- ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS gider (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no           text NOT NULL CHECK (no ~ '^[A-Z]{1,4}-[0-9]{4}-[0-9]{3,6}$'),
  tarih        date NOT NULL,
  tur          text NOT NULL CHECK (tur ~ '^[a-z0-9_]{2,20}$'),
  -- KURUŞ, KDV dahil
  tutar        bigint NOT NULL CHECK (tutar > 0 AND tutar <= 100000000000),
  oran         integer NOT NULL CHECK (oran BETWEEN 0 AND 99),
  aciklama     text CHECK (aciklama IS NULL OR length(aciklama) <= 120),
  plan_id      uuid,
  personel_id  uuid,
  belge        uuid,
  kaynak       text NOT NULL CHECK (kaynak IN ('muhasebe', 'form')),
  durum        text NOT NULL CHECK (durum IN ('bekliyor', 'onaylandi', 'odendi', 'red')),
  red          text CHECK (red IS NULL OR length(btrim(red)) BETWEEN 5 AND 200),
  odeme        date,
  onaylayan    uuid,
  karar        timestamptz,
  kaydeden     uuid,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  FOREIGN KEY (firma_id, belge) REFERENCES dosya (firma_id, id),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id),
  CHECK ((durum = 'red') = (red IS NOT NULL)),
  CHECK ((durum = 'odendi') = (odeme IS NOT NULL)),
  CHECK (odeme IS NULL OR odeme >= tarih)
);
CREATE INDEX IF NOT EXISTS gider_tarih ON gider (firma_id, tarih DESC);
CREATE INDEX IF NOT EXISTS gider_plan ON gider (firma_id, plan_id);
ALTER TABLE gider ENABLE ROW LEVEL SECURITY;
ALTER TABLE gider FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gider' AND policyname = 'gider_kiraci') THEN
    CREATE POLICY gider_kiraci ON gider USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION gider_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE bugun date := (now() AT TIME ZONE 'Europe/Istanbul')::date; ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'gider silinmez' USING ERRCODE = '23514'; END IF;
  IF NEW.tarih > bugun THEN RAISE EXCEPTION 'ileri tarihli gider kaydedilmez' USING ERRCODE = '23514'; END IF;
  IF NEW.odeme > bugun THEN RAISE EXCEPTION 'ileri tarihli ödeme kaydedilmez' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.kaydeden := ben; NEW.onaylayan := NULL; NEW.karar := NULL;
    IF NEW.kaynak = 'form' THEN
      IF NEW.durum <> 'bekliyor' THEN RAISE EXCEPTION 'masraf formu onay bekler' USING ERRCODE = '23514'; END IF;
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

GRANT SELECT, INSERT, UPDATE ON gider TO probata_uygulama;
