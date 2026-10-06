-- ══ 0049 · VERİTABANI DEPOSU (dosya içeriği) — deneme yayını için kalıcı depo (347) ══
-- Yayında dosyalar (fotoğraf, PDF, logo) Vercel'in geçici klasöründe (/tmp) duruyordu: işlev örnekleri arasında kayboluyordu (imzasız PDF hazırlanıp
-- sonra imzalısı yüklenince bulunamıyordu). Kalıcı çözüm firmanın kendi S3 deposu (KOD-GECIS Y2b, K7); o bağlanana kadar içerik bu tabloda durur
-- (PROBATA_DEPO=vt). Anahtar depo anahtarı üreticisinin biçiminde (firma/<firma>/<modül>/<kayıt>/<dosya>) ve anahtardaki firma satırın firmasıdır;
-- kiracı süzgeçli (RLS). Yazılan değişmez: uygulama rolünde güncelleme ve silme yok (aynı anahtara ikinci kez yazılmaz — klasör deposuyla aynı);
-- silme çöp süresi dolunca ayrı işte (09-A5, C4). İçerik en çok 30 MB (yükleme sınırı 25 MB). ⛔ IDEMPOTENT.

CREATE TABLE IF NOT EXISTS depo_nesne (
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  anahtar   text PRIMARY KEY CHECK (anahtar ~ '^firma/[0-9a-f-]{36}/[a-z_]{1,30}/[0-9a-f-]{36}/[0-9a-f-]{36}$'),
  bayt      bytea NOT NULL CHECK (octet_length(bayt) BETWEEN 1 AND 31457280),
  olustu    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT depo_nesne_firma CHECK (split_part(anahtar, '/', 2) = firma_id::text)
);
CREATE INDEX IF NOT EXISTS depo_nesne_firma_i ON depo_nesne (firma_id);
ALTER TABLE depo_nesne ENABLE ROW LEVEL SECURITY;
ALTER TABLE depo_nesne FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'depo_nesne' AND policyname = 'depo_nesne_kiraci') THEN
    CREATE POLICY depo_nesne_kiraci ON depo_nesne USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT ON depo_nesne TO probata_uygulama;
