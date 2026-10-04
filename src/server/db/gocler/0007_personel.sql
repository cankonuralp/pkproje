-- ══ 0007 · PERSONEL (modül 2; maket personel.html, onaylı 2026-09-25) ═════════════════════════════════════════════════════════
-- Karar 33: giriş hesabı HER ZAMAN bir personele bağlı (hesap.personel_id). Karar 39: zorunlu yalnız ad, işe başlama, meslek; mesleki numaralar boş
-- kalabilir (uyarı). Karar 43: ayrılan personel silinmez (durum "ayrildi" + tarih); ayrılana hesap açılmaz (ENGEL 8).
-- Mobil imza telefonu (195) yalnız imza isteği içindir (KVKK: amaçla sınırlı). ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS personel (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  ad            text NOT NULL CHECK (length(ad) BETWEEN 3 AND 80 AND ad ~ '\S+\s+\S+'),
  eposta        text CHECK (eposta IS NULL OR (eposta = lower(eposta) AND length(eposta) <= 254 AND position('@' in eposta) > 1)),
  imza_tel      text CHECK (imza_tel IS NULL OR imza_tel ~ '^05[0-9]{9}$'),
  basla         date NOT NULL,
  ayrildi       date,
  durum         text NOT NULL DEFAULT 'etkin' CHECK (durum IN ('etkin', 'ayrildi')),
  meslek        text NOT NULL CHECK (meslek ~ '^[a-z-]{1,20}$'),
  meslek_metin  text CHECK (meslek_metin IS NULL OR length(meslek_metin) BETWEEN 1 AND 60),
  diploma       text CHECK (diploma IS NULL OR length(diploma) <= 20),
  oda           text CHECK (oda IS NULL OR length(oda) <= 20),
  ekipnet       text CHECK (ekipnet IS NULL OR length(ekipnet) <= 20),
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  CHECK ((durum = 'ayrildi') = (ayrildi IS NOT NULL)),
  CHECK (ayrildi IS NULL OR ayrildi >= basla),
  CHECK (meslek <> 'diger' OR meslek_metin IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS personel_firma_ad ON personel (firma_id, ad);
-- iş e-postası firmada tek kişide (giriş hesabı bu adresle açılır)
CREATE UNIQUE INDEX IF NOT EXISTS personel_eposta ON personel (firma_id, eposta) WHERE eposta IS NOT NULL;
ALTER TABLE personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE personel FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personel' AND policyname = 'personel_kiraci') THEN
    CREATE POLICY personel_kiraci ON personel USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- hesap → personel (karar 33). Eski hesaplar (geliştirme / deneme tohumları) için boş kalabilir; yeni hesap yalnız personelden açılır (uygulama).
ALTER TABLE hesap ADD COLUMN IF NOT EXISTS personel_id uuid REFERENCES personel(id);
CREATE UNIQUE INDEX IF NOT EXISTS hesap_personel ON hesap (personel_id) WHERE personel_id IS NOT NULL;

-- ayrılan personelin hesabı açık kalamaz: personel ayrıldı olunca hesabı pasife alınır (oturumları 0002 tetiğiyle düşer)
CREATE OR REPLACE FUNCTION personel_ayrilinca_hesap_kapat() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.durum = 'ayrildi' AND OLD.durum IS DISTINCT FROM 'ayrildi' THEN
    UPDATE hesap SET durum = 'pasif' WHERE personel_id = NEW.id AND firma_id = NEW.firma_id AND durum <> 'pasif';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS personel_ayrilinca_hesap_kapat ON personel;
CREATE TRIGGER personel_ayrilinca_hesap_kapat AFTER UPDATE ON personel FOR EACH ROW EXECUTE FUNCTION personel_ayrilinca_hesap_kapat();

GRANT SELECT, INSERT, UPDATE ON personel TO probata_uygulama;
