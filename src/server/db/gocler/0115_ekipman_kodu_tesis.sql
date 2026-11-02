-- 0115 · EKİPMAN KODU TESİS BAZLI (2026-11-02; reisim: "tesise göre değişsin kodlar, aynı firmada başka tesiste olan ekipmanlar bizi ilgilendirmez, aynı
-- tesiste ise zaten raporun içerisinde gözükür ve devam olarak yazılır, kullanıcı belirtirse kod aralığını sorun yok"): kodun eşsizliği ve kod geçmişi
-- ("eski kod başkasına verilmez") FİRMA yerine TESİS kapsamında — iki tesiste aynı kod olabilir; aynı tesiste kod tek, eski kod aynı tesiste başkasına
-- verilmez. Eldeki kayıtlar değişmez (hepsi zaten tesis içinde tek). Numara üretimi sunucuda (planlar/sema.ts siradakiKod: tesisin kodları, düzen firmanın).
-- Kilit tests/planlar.test.ts, plan-ici.test.ts. ⛔ Her göç IDEMPOTENT.

ALTER TABLE ekipman_kodu ADD COLUMN IF NOT EXISTS tesis_id uuid;
UPDATE ekipman_kodu k SET tesis_id = e.tesis_id FROM ekipman e WHERE e.id = k.ekipman_id AND k.tesis_id IS NULL;
ALTER TABLE ekipman_kodu ALTER COLUMN tesis_id SET NOT NULL;
ALTER TABLE ekipman_kodu DROP CONSTRAINT IF EXISTS ekipman_kodu_pkey;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ekipman_kodu_tesis_kod') THEN
    ALTER TABLE ekipman_kodu ADD CONSTRAINT ekipman_kodu_tesis_kod PRIMARY KEY (firma_id, tesis_id, kod);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ekipman_kodu_tesis_fk') THEN
    ALTER TABLE ekipman_kodu ADD CONSTRAINT ekipman_kodu_tesis_fk FOREIGN KEY (firma_id, tesis_id) REFERENCES tesis (firma_id, id);
  END IF;
END $$;

ALTER TABLE ekipman DROP CONSTRAINT IF EXISTS ekipman_firma_id_kod_key;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ekipman_tesis_kod') THEN
    ALTER TABLE ekipman ADD CONSTRAINT ekipman_tesis_kod UNIQUE (firma_id, tesis_id, kod);
  END IF;
END $$;

-- her verilen kod TESİSİN geçmişine yazılır; kod aynı tesiste BAŞKA bir ekipmana verilmişse (eski kodu dahil) reddedilir
CREATE OR REPLACE FUNCTION ekipman_kodu_kaydet() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE sahibi uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.kod = OLD.kod AND NEW.tesis_id = OLD.tesis_id THEN RETURN NEW; END IF;
  INSERT INTO ekipman_kodu (firma_id, tesis_id, kod, ekipman_id) VALUES (NEW.firma_id, NEW.tesis_id, NEW.kod, NEW.id) ON CONFLICT (firma_id, tesis_id, kod) DO NOTHING;
  SELECT ekipman_id INTO sahibi FROM ekipman_kodu WHERE firma_id = NEW.firma_id AND tesis_id = NEW.tesis_id AND kod = NEW.kod;
  IF sahibi IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'ekipman kodu % bu tesiste başka bir ekipmana verilmiş', NEW.kod USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION ekipman_kodu_kaydet() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ekipman_kodu_kaydet() FROM PUBLIC;
DROP TRIGGER IF EXISTS ekipman_kodu_kaydet ON ekipman;
CREATE TRIGGER ekipman_kodu_kaydet AFTER INSERT OR UPDATE OF kod, tesis_id ON ekipman FOR EACH ROW EXECUTE FUNCTION ekipman_kodu_kaydet();
