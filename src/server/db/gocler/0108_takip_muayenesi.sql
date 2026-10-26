-- ══ 0108 · TAKİP MUAYENESİ (2026-10-26; reisim: "birisi daha önce muayene yapmışsa ve o muayeneye başka bir denetçi gidecekse onun için takip
--    muayenesi açılabilmeli önceki metinler gelmeli"; maket + dört karar onaylı: "Takip muayenesi maketi ve kararlar uygun, başla") ══
-- · rapor.takip_kaynak: takip edilen (ana) rapor — açık uygunsuzluğu olan imzalı rapor, aynı ekipman. Numara ana numara + -T1, -T2 (revizyon -R gibi;
--   rapor_no_check sonekli numarayı kabul eder). Bağ değişmez.
-- · Aynı planda takip raporu açılabilir: plan × ekipman başına tek etkin OLAĞAN rapor (rapor_plan_ekipman, takipler sayılmaz) + ana rapor başına
--   planda tek etkin takip (rapor_plan_takip).
-- · Kapanış "devam": yeni imzalı sürümde HÂLÂ uygunsuz olan madde (aynı ref) "giderildi" değil "devam" kapanır — kusur yeni raporun uygunsuzluğu
--   olarak sürer. Uygulama imzalı sürümü yazmadan hemen önce o sürümün kusur ref'lerini app.devam_ref'e (JSON dizi, işlem içi) koyar; tetik okur ve
--   boşaltır. Ayar yoksa eski kural (hepsi "giderildi").
-- Kilit: tests/onaylar.test.ts "takip muayenesi" (gerçek PostgreSQL) + tests/takip-muayenesi.test.ts. ⛔ Her göç IDEMPOTENT.

ALTER TABLE rapor ADD COLUMN IF NOT EXISTS takip_kaynak uuid;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rapor_takip_kaynak') THEN
    ALTER TABLE rapor ADD CONSTRAINT rapor_takip_kaynak FOREIGN KEY (firma_id, takip_kaynak) REFERENCES rapor (firma_id, id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS rapor_takip ON rapor (firma_id, takip_kaynak);

ALTER TABLE rapor DROP CONSTRAINT IF EXISTS rapor_no_check;
ALTER TABLE rapor ADD CONSTRAINT rapor_no_check CHECK (no ~ '^[A-Z]{2}-[0-9]{4}-[0-9]{3,}-[0-9a-f]{5}(-T[0-9]{1,3})?$');
ALTER TABLE rapor DROP CONSTRAINT IF EXISTS rapor_takip_no;
ALTER TABLE rapor ADD CONSTRAINT rapor_takip_no CHECK ((takip_kaynak IS NULL) = (no !~ '-T[0-9]{1,3}$'));

DROP INDEX IF EXISTS rapor_plan_ekipman;
CREATE UNIQUE INDEX IF NOT EXISTS rapor_plan_ekipman ON rapor (firma_id, plan_id, ekipman_id) WHERE silindi IS NULL AND takip_kaynak IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS rapor_plan_takip ON rapor (firma_id, plan_id, takip_kaynak) WHERE silindi IS NULL AND takip_kaynak IS NOT NULL;

/* takip bağı: açılırken ana rapor aynı ekipmanın, imzalı sürümü olan raporu; sonra değişmez */
CREATE OR REPLACE FUNCTION rapor_takip_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.takip_kaynak IS DISTINCT FROM OLD.takip_kaynak THEN RAISE EXCEPTION 'takip raporunun ana raporu değişmez' USING ERRCODE = '23514'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.takip_kaynak IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM rapor a JOIN rapor_surumu s ON s.firma_id = a.firma_id AND s.rapor_id = a.id
    WHERE a.firma_id = NEW.firma_id AND a.id = NEW.takip_kaynak AND a.ekipman_id = NEW.ekipman_id AND a.id <> NEW.id) THEN
    RAISE EXCEPTION 'takip muayenesi aynı ekipmanın imzalı raporuna açılır' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION rapor_takip_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_takip_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_takip_koru BEFORE INSERT OR UPDATE ON rapor FOR EACH ROW EXECUTE FUNCTION rapor_takip_koru();

ALTER TABLE uygunsuzluk DROP CONSTRAINT IF EXISTS uygunsuzluk_kapanis_check;
ALTER TABLE uygunsuzluk ADD CONSTRAINT uygunsuzluk_kapanis_check CHECK (kapanis IS NULL OR kapanis IN ('giderildi', 'revizyon', 'devam'));

-- aynı ekipmanın yeni imzalı sürümü öncekilerin açık uygunsuzluklarını kapatır (114, 0028): aynı raporun önceki revizyonu "revizyon"; yeni sürümde
-- aynı ref hâlâ uygunsuzsa "devam" (0108); öteki "giderildi"
CREATE OR REPLACE FUNCTION rapor_surumu_sonra() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE
  ham text := NULLIF(current_setting('app.devam_ref', true), '');
  d text[] := '{}';
BEGIN
  IF ham IS NOT NULL THEN
    SELECT coalesce(array_agg(x), '{}') INTO d FROM jsonb_array_elements_text(ham::jsonb) x;
    PERFORM set_config('app.devam_ref', '', true);
  END IF;
  UPDATE uygunsuzluk u SET kapanis = CASE WHEN u.rapor_id = NEW.rapor_id THEN 'revizyon' WHEN u.ref = ANY (d) THEN 'devam' ELSE 'giderildi' END,
      kapatan_surum = NEW.id, surum = u.surum + 1, degisti = now()
    WHERE u.firma_id = NEW.firma_id AND u.ekipman_id = NEW.ekipman_id AND u.kapanis IS NULL AND u.surum_id <> NEW.id
      AND (u.rapor_id = NEW.rapor_id OR u.tarih IS NULL OR NEW.kontrol_tarihi IS NULL OR u.tarih <= NEW.kontrol_tarihi);
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_surumu_sonra() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_surumu_sonra() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_surumu_sonra AFTER INSERT ON rapor_surumu FOR EACH ROW EXECUTE FUNCTION rapor_surumu_sonra();
