-- ══ 0012 · MÜŞTERİ VE TESİS (modül 3; maket musteriler.html, onaylı 2026-09-26) ═══════════════════════════════════════════════
-- Karar 45 / 46: vergi no ve SGK DETSİS NO ZORUNLU DEĞİL; biçimi tutar (10–11 · 26 hane), tekrarı UYARI (benzersiz kısıt YOK, "Yine de kaydet").
-- Karar 47: tesis tek müşteriye ait (firma + müşteri birlikte bağlı: başka firmanın müşterisine tesis yazılamaz). Karar 48: silme yok, PASİF
-- (tarih); müşteri pasif olunca etkin tesisleri onunla pasif olur (musteriyle = true), müşteri dönünce onlar da döner. Karar 50: il / ilçe
-- sabit listeden (src/tanim/iller.ts; denetim uygulamada). Müşteri e-postası müşteri girişinin kullanıcı adı → firmada tek. ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS musteri (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  unvan     text NOT NULL CHECK (length(unvan) BETWEEN 3 AND 160),
  kisa      text NOT NULL CHECK (length(kisa) BETWEEN 1 AND 40),
  vd        text CHECK (vd IS NULL OR length(vd) <= 40),
  vno       text CHECK (vno IS NULL OR vno ~ '^[0-9]{10,11}$'),
  eposta    text CHECK (eposta IS NULL OR (eposta = lower(eposta) AND length(eposta) <= 254 AND position('@' in eposta) > 1)),
  tel       text CHECK (tel IS NULL OR length(tel) <= 20),
  ilgili    text CHECK (ilgili IS NULL OR length(ilgili) <= 80),
  acilis    date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Istanbul')::date,
  pasif     date,
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  degisti   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS musteri_firma_unvan ON musteri (firma_id, unvan);
CREATE INDEX IF NOT EXISTS musteri_vno ON musteri (firma_id, vno) WHERE vno IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS musteri_eposta ON musteri (firma_id, eposta) WHERE eposta IS NOT NULL;
ALTER TABLE musteri ENABLE ROW LEVEL SECURITY;
ALTER TABLE musteri FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'musteri' AND policyname = 'musteri_kiraci') THEN
    CREATE POLICY musteri_kiraci ON musteri USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tesis (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  musteri_id  uuid NOT NULL,
  ad          text NOT NULL CHECK (length(ad) BETWEEN 2 AND 80),
  adres       text CHECK (adres IS NULL OR length(adres) <= 160),
  il          text CHECK (il IS NULL OR length(il) <= 40),
  ilce        text CHECK (ilce IS NULL OR length(ilce) <= 40),
  sgk         text CHECK (sgk IS NULL OR sgk ~ '^[0-9]{26}$'),
  pasif       date,
  musteriyle  boolean NOT NULL DEFAULT false,
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, musteri_id) REFERENCES musteri (firma_id, id),
  CHECK (ilce IS NULL OR il IS NOT NULL),
  CHECK (NOT musteriyle OR pasif IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS tesis_musteri ON tesis (firma_id, musteri_id);
CREATE INDEX IF NOT EXISTS tesis_sgk ON tesis (firma_id, sgk) WHERE sgk IS NOT NULL;
ALTER TABLE tesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tesis FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tesis' AND policyname = 'tesis_kiraci') THEN
    CREATE POLICY tesis_kiraci ON tesis USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON musteri, tesis TO probata_uygulama;
