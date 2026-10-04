-- ══ 0005 · DOSYA: kapalı depo kaydı (09-A1–A5) ══════════════════════════════════════════════════════════════════════════
-- Veritabanında BAĞLANTI değil ANAHTAR tutulur; anahtar tek üreticiden (src/server/dosya/anahtar.ts): firma/{firma_id}/{modül}/{kayıt_id}/{dosya_id}
-- — okunur bilgi yok. Görünen ad yalnız burada. Dosya silinmez, çöpe alınır (cop: zaman); depodan silme çöp süresi dolunca (A5, C4).
-- Bir dosya bir modül kaydına bağlıdır: indirme, o kaydı görebilen kişiye açılır (A2, src/server/dosya/dosya.ts).
-- ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS dosya (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  modul      text NOT NULL CHECK (modul ~ '^[a-z_]{1,30}$'),
  kayit_id   uuid NOT NULL,
  anahtar    text NOT NULL CHECK (anahtar ~ '^firma/[0-9a-f-]{36}/[a-z_]{1,30}/[0-9a-f-]{36}/[0-9a-f-]{36}$'),
  ad         text NOT NULL CHECK (length(ad) BETWEEN 1 AND 200),
  tur        text NOT NULL CHECK (tur IN ('image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv')),
  boyut      bigint NOT NULL CHECK (boyut > 0),
  sha256     text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  yukleyen   uuid,
  cop        timestamptz,
  surum      integer NOT NULL DEFAULT 0,
  olustu     timestamptz NOT NULL DEFAULT now(),
  degisti    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (anahtar),
  -- anahtar kaydın kendisine bağlı: başka firmanın / kaydın anahtarı yazılamaz
  CHECK (anahtar = 'firma/' || firma_id::text || '/' || modul || '/' || kayit_id::text || '/' || id::text)
);
CREATE INDEX IF NOT EXISTS dosya_kayit ON dosya (firma_id, modul, kayit_id);
ALTER TABLE dosya ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosya FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dosya' AND policyname = 'dosya_kiraci') THEN
    CREATE POLICY dosya_kiraci ON dosya USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- yükleme sonrası içerik değişmez: anahtar, tür, boyut, özet ve bağlı kayıt güncellenemez (yalnız ad ve çöp)
CREATE OR REPLACE FUNCTION dosya_icerik_degismez() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.anahtar <> OLD.anahtar OR NEW.tur <> OLD.tur OR NEW.boyut <> OLD.boyut OR NEW.sha256 <> OLD.sha256
     OR NEW.modul <> OLD.modul OR NEW.kayit_id <> OLD.kayit_id OR NEW.firma_id <> OLD.firma_id OR NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'dosya içeriği değiştirilemez' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS dosya_icerik_degismez ON dosya;
CREATE TRIGGER dosya_icerik_degismez BEFORE UPDATE ON dosya FOR EACH ROW EXECUTE FUNCTION dosya_icerik_degismez();

GRANT SELECT, INSERT, UPDATE ON dosya TO probata_uygulama;
