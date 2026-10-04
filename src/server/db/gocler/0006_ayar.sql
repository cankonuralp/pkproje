-- ══ 0006 · FİRMA AYARLARI + ŞİFRELİ SIRLAR (KOD-GECIS §7 · ARKA-UC §8) ═══════════════════════════════════════════════════════
-- Ayar: bölüm başına tek satır (JSON); biçim ve başlangıç değerleri kodda (src/server/ayar/ayar.ts, ortak şema). Yazma güvenli yazıcıdan (sürüm kilidi + iz).
-- Sır (yapay zekâ API anahtarı, bulut erişimi, imza sağlayıcı): veritabanında YALNIZ şifreli (AES-256-GCM; anahtar ortam değişkeninde, veritabanında
-- değil). Şifreli metin firma + sır adına bağlıdır (ek doğrulama verisi): başka firmanın / başka adın satırına kopyalanırsa çözülmez. Ekranda yalnız
-- son 4 hane. ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS firma_ayar (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  bolum     text NOT NULL CHECK (bolum ~ '^[a-z_]{1,40}$'),
  deger     jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(deger) = 'object'),
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  degisti   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, bolum)
);
ALTER TABLE firma_ayar ENABLE ROW LEVEL SECURITY;
ALTER TABLE firma_ayar FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firma_ayar' AND policyname = 'firma_ayar_kiraci') THEN
    CREATE POLICY firma_ayar_kiraci ON firma_ayar USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS firma_sir (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  ad        text NOT NULL CHECK (ad ~ '^[a-z_]{1,40}$'),
  -- "v1.<iv>.<etiket>.<şifreli>" (base64url); NULL = sır kaldırıldı
  sifreli   text CHECK (sifreli IS NULL OR sifreli ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$'),
  son4      text CHECK (son4 IS NULL OR length(son4) <= 4),
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  degisti   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, ad)
);
ALTER TABLE firma_sir ENABLE ROW LEVEL SECURITY;
ALTER TABLE firma_sir FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firma_sir' AND policyname = 'firma_sir_kiraci') THEN
    CREATE POLICY firma_sir_kiraci ON firma_sir USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON firma_ayar TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON firma_sir TO probata_uygulama;
