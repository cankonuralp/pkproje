-- ══ 0013 · EKİPMAN TÜRLERİ (modül 5; maket ekipman-turleri.html, onaylı 2026-09-26; AA5 branş sekmeleri) ═══════════════════════════════
-- Tür: firmada eşsiz 2–3 harflik kod (ekipman kodlarının öneki; değişmez), Ek-III grubu (sabit tanım; denetim uygulamada), branş (gruptan; Ek-III
-- dışında seçilir — onaylayan yönetici branştan), periyot 1–120 ay, tahmini süre isteğe bağlı. Rapor formatı: firmanın yüklediği PDF'ler, sürümlü
-- (en yeni kullanımda; eski raporlar kendi sürümüyle). Sürüm kaldırılır, silinmez (kaldirildi). Dosya kendi kapalı deposunda (0005), tür ve
-- dosya AYNI firmada bağlı. ⛔ Her göç IDEMPOTENT.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dosya_firma_kimlik') THEN
    ALTER TABLE dosya ADD CONSTRAINT dosya_firma_kimlik UNIQUE (firma_id, id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ekipman_turu (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  kod       text NOT NULL CHECK (kod ~ '^[A-Z]{2,3}$'),
  ad        text NOT NULL CHECK (length(ad) BETWEEN 3 AND 60),
  grup      text NOT NULL CHECK (grup ~ '^[a-z]{1,20}$'),
  brans     text NOT NULL CHECK (brans IN ('m', 'e')),
  periyot   integer NOT NULL CHECK (periyot BETWEEN 1 AND 120),
  sure      integer CHECK (sure IS NULL OR sure BETWEEN 1 AND 999),
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  degisti   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, kod),
  UNIQUE (firma_id, id)
);
ALTER TABLE ekipman_turu ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_turu FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ekipman_turu' AND policyname = 'ekipman_turu_kiraci') THEN
    CREATE POLICY ekipman_turu_kiraci ON ekipman_turu USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
-- kod değişmez (ekipman kodlarında kullanılır): uygulama yazmaz, veritabanı da izin vermez
CREATE OR REPLACE FUNCTION ekipman_turu_kod_degismez() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kod IS DISTINCT FROM OLD.kod THEN RAISE EXCEPTION 'ekipman türü kodu değişmez' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION ekipman_turu_kod_degismez() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ekipman_turu_kod_degismez() FROM PUBLIC;
CREATE OR REPLACE TRIGGER ekipman_turu_kod_degismez BEFORE UPDATE ON ekipman_turu FOR EACH ROW EXECUTE FUNCTION ekipman_turu_kod_degismez();

CREATE TABLE IF NOT EXISTS tur_format (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tur_id      uuid NOT NULL,
  sira        integer NOT NULL CHECK (sira >= 1),
  dosya_id    uuid NOT NULL,
  notu        text CHECK (notu IS NULL OR length(notu) <= 120),
  kaldirildi  timestamptz,
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id),
  FOREIGN KEY (firma_id, dosya_id) REFERENCES dosya (firma_id, id),
  UNIQUE (firma_id, tur_id, sira)
);
ALTER TABLE tur_format ENABLE ROW LEVEL SECURITY;
ALTER TABLE tur_format FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tur_format' AND policyname = 'tur_format_kiraci') THEN
    CREATE POLICY tur_format_kiraci ON tur_format USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON ekipman_turu, tur_format TO probata_uygulama;
