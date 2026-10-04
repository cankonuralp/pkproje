-- ══ 0004 · NUMARA SAYACI (pkproje §3.5 · KOD-GECIS §6) ═══════════════════════════════════════════════════════════════════
-- Proje, rapor, teklif, sözleşme, gider, izin numaralarının sırası. Sayaç işlemin içinde artar: kaydı oluşturan işlem geri alınırsa sıra da geri
-- alınır (rapor sırası KESİNTİSİZ — §3.5); aynı anda iki kayıt aynı sırayı alamaz (satır kilidi). Dönem: '' = hiç sıfırlanmaz (rapor),
-- 'AAYY' = ay başında 1'den (proje, teklif …). Sayaç geri alınamaz, silinemez (uygulama rolünde DELETE yok; azaltma CHECK'e takılır).
-- ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS numara_sayaci (
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tur       text NOT NULL CHECK (tur ~ '^[a-z_]{1,30}$'),
  donem     text NOT NULL CHECK (donem = '' OR donem ~ '^[0-9]{4}$'),
  son       integer NOT NULL CHECK (son >= 1),
  PRIMARY KEY (firma_id, tur, donem)
);
ALTER TABLE numara_sayaci ENABLE ROW LEVEL SECURITY;
ALTER TABLE numara_sayaci FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'numara_sayaci' AND policyname = 'numara_sayaci_kiraci') THEN
    CREATE POLICY numara_sayaci_kiraci ON numara_sayaci USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- sayaç yalnız ileri gider (verilmiş numara yeniden verilmez)
CREATE OR REPLACE FUNCTION numara_sayaci_ileri() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.son <= OLD.son OR NEW.firma_id <> OLD.firma_id OR NEW.tur <> OLD.tur OR NEW.donem <> OLD.donem THEN
    RAISE EXCEPTION 'numara sayacı geri alınamaz' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS numara_sayaci_ileri ON numara_sayaci;
CREATE TRIGGER numara_sayaci_ileri BEFORE UPDATE ON numara_sayaci FOR EACH ROW EXECUTE FUNCTION numara_sayaci_ileri();

GRANT SELECT, INSERT, UPDATE ON numara_sayaci TO probata_uygulama;
