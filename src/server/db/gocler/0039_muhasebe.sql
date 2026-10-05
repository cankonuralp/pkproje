-- ══ 0039 · MUHASEBE › FATURA VE TAHSİLAT (327; modül 18; maket muhasebe.html M14; pkproje §3 akış "… müşteriye açıldı → fatura → tahsilat → iş
-- kapandı → arşiv", §3.1 modül 18, §3.2 madde 5 "her rapor teklif kalemine bağlanır; birim fiyat oradan"; KOD-GECIS §3 Muhasebe: "fatura no ·
-- tahsilat kalanı aşmaz · ileri tarih yok · fatura tarihi son imzadan önce olamaz") ══
-- İŞ = plan. Fatura firmanın muhasebe programında kesilir (e-Fatura / e-Arşiv); buraya DIŞ numarası (3 harf / rakam + yıl + 9 hane, 16 karakter,
-- firmada eşsiz) ve tarihi yazılır. Faturaya yalnız imzalı raporlar girer; bir rapor tek faturaya. Her raporun birim fiyatı, kaynağı (teklif ·
-- teklif dışı · fiyat listesi) ve teklifi KAYIT ANINDA yazılır (sonra fiyat listesi değişse de fatura değişmez); toplamlar faturada (KURUŞ) ve
-- işlem sonunda raporların toplamıyla tutarlı olmalı (ertelenen denetim). Fatura ve satırları sonradan değişmez, silinmez. Vade = tarih + vade
-- günü (tesisin o günkü iş sözleşmesinden, yoksa 30). Tahsilat: tarih fatura tarihinden önce ve ileri olamaz; toplamı faturayı aşamaz; değişmez.
-- Kaydeden veritabanında oturumdan.
-- ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS fatura (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no           text NOT NULL CHECK (no ~ '^[A-Z0-9]{3}20[0-9]{2}[0-9]{9}$'),
  musteri_id   uuid NOT NULL,
  tarih        date NOT NULL,
  vade_gun     integer NOT NULL CHECK (vade_gun BETWEEN 0 AND 365),
  vade         date NOT NULL,
  sozlesme_id  uuid,
  kdv          integer NOT NULL DEFAULT 20 CHECK (kdv BETWEEN 0 AND 99),
  -- KURUŞ
  ara          bigint NOT NULL CHECK (ara >= 0),
  kdv_tutar    bigint NOT NULL CHECK (kdv_tutar >= 0),
  toplam       bigint NOT NULL CHECK (toplam > 0),
  kaydeden     uuid,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, musteri_id) REFERENCES musteri (firma_id, id),
  FOREIGN KEY (firma_id, sozlesme_id) REFERENCES is_sozlesmesi (firma_id, id),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id),
  CHECK (vade = tarih + vade_gun),
  CHECK (toplam = ara + kdv_tutar)
);
CREATE INDEX IF NOT EXISTS fatura_tarih ON fatura (firma_id, tarih DESC);
ALTER TABLE fatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatura FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS fatura_rapor (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  fatura_id   uuid NOT NULL,
  rapor_id    uuid NOT NULL,
  plan_id     uuid NOT NULL,
  tur_id      uuid NOT NULL,
  -- KURUŞ, KDV hariç birim fiyat (kayıt anındaki)
  fiyat       bigint NOT NULL CHECK (fiyat >= 0),
  kaynak      text NOT NULL CHECK (kaynak IN ('teklif', 'disi', 'liste')),
  teklif_id   uuid,
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, fatura_id) REFERENCES fatura (firma_id, id),
  FOREIGN KEY (firma_id, rapor_id) REFERENCES rapor (firma_id, id),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id),
  FOREIGN KEY (firma_id, teklif_id) REFERENCES teklif (firma_id, id),
  UNIQUE (firma_id, rapor_id),
  CHECK ((kaynak = 'liste') = (teklif_id IS NULL))
);
CREATE INDEX IF NOT EXISTS fatura_rapor_fatura ON fatura_rapor (firma_id, fatura_id);
CREATE INDEX IF NOT EXISTS fatura_rapor_plan ON fatura_rapor (firma_id, plan_id);
ALTER TABLE fatura_rapor ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatura_rapor FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tahsilat (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  fatura_id   uuid NOT NULL,
  tarih       date NOT NULL,
  -- KURUŞ
  tutar       bigint NOT NULL CHECK (tutar > 0),
  yontem      text NOT NULL CHECK (yontem IN ('havale', 'cek', 'kart', 'nakit')),
  aciklama    text CHECK (aciklama IS NULL OR length(aciklama) <= 120),
  kaydeden    uuid,
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, fatura_id) REFERENCES fatura (firma_id, id),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS tahsilat_fatura ON tahsilat (firma_id, fatura_id);
ALTER TABLE tahsilat ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahsilat FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fatura' AND policyname = 'fatura_kiraci') THEN
    CREATE POLICY fatura_kiraci ON fatura USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fatura_rapor' AND policyname = 'fatura_rapor_kiraci') THEN
    CREATE POLICY fatura_rapor_kiraci ON fatura_rapor USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tahsilat' AND policyname = 'tahsilat_kiraci') THEN
    CREATE POLICY tahsilat_kiraci ON tahsilat USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- FATURA: ileri tarih yok; kaydeden oturumdan; değişmez, silinmez
CREATE OR REPLACE FUNCTION fatura_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'fatura değişmez, silinmez' USING ERRCODE = '23514'; END IF;
  IF NEW.tarih > (now() AT TIME ZONE 'Europe/Istanbul')::date THEN RAISE EXCEPTION 'ileri tarihli fatura kaydedilmez' USING ERRCODE = '23514'; END IF;
  NEW.kaydeden := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  NEW.olustu := now();
  RETURN NEW;
END $$;
ALTER FUNCTION fatura_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION fatura_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER fatura_koru BEFORE INSERT OR UPDATE OR DELETE ON fatura FOR EACH ROW EXECUTE FUNCTION fatura_koru();

-- FATURA SATIRI: yalnız faturayla aynı işlemde; rapor imzalı (imzalı sürümü var), faturanın müşterisinin tesisinde, planı doğru; fatura tarihi
-- raporun (ilk) imza gününden önce olamaz; değişmez, silinmez
CREATE OR REPLACE FUNCTION fatura_rapor_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE f record; r record; imza date;
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'fatura değişmez, silinmez' USING ERRCODE = '23514'; END IF;
  SELECT x.musteri_id, x.tarih, x.olustu INTO f FROM fatura x WHERE x.firma_id = NEW.firma_id AND x.id = NEW.fatura_id;
  IF f IS NULL OR f.olustu <> now() THEN RAISE EXCEPTION 'faturaya rapor yalnız fatura kaydedilirken eklenir' USING ERRCODE = '23514'; END IF;
  SELECT p.id AS plan_id, t.musteri_id, r0.tur_id INTO r FROM rapor r0 JOIN plan p ON p.firma_id = r0.firma_id AND p.id = r0.plan_id
    JOIN tesis t ON t.firma_id = p.firma_id AND t.id = p.tesis_id WHERE r0.firma_id = NEW.firma_id AND r0.id = NEW.rapor_id;
  IF r IS NULL OR r.musteri_id <> f.musteri_id OR r.plan_id <> NEW.plan_id OR r.tur_id <> NEW.tur_id THEN
    RAISE EXCEPTION 'rapor faturanın müşterisinin olmalı' USING ERRCODE = '23514';
  END IF;
  SELECT min((s.imzalandi AT TIME ZONE 'Europe/Istanbul')::date) INTO imza FROM rapor_surumu s WHERE s.firma_id = NEW.firma_id AND s.rapor_id = NEW.rapor_id;
  IF imza IS NULL THEN RAISE EXCEPTION 'faturaya yalnız imzalı rapor girer' USING ERRCODE = '23514'; END IF;
  IF f.tarih < imza THEN RAISE EXCEPTION 'fatura tarihi faturaya giren raporun imzasından önce olamaz' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION fatura_rapor_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION fatura_rapor_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER fatura_rapor_koru BEFORE INSERT OR UPDATE OR DELETE ON fatura_rapor FOR EACH ROW EXECUTE FUNCTION fatura_rapor_koru();

-- işlem sonunda: faturanın en az bir raporu var ve ara toplam raporların fiyatlarının toplamı
CREATE OR REPLACE FUNCTION fatura_tutarli() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE n integer; t bigint;
BEGIN
  SELECT count(*), coalesce(sum(fiyat), 0) INTO n, t FROM fatura_rapor WHERE firma_id = NEW.firma_id AND fatura_id = NEW.id;
  IF n = 0 OR t <> NEW.ara THEN RAISE EXCEPTION 'faturanın raporları ve tutarı tutarsız' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION fatura_tutarli() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION fatura_tutarli() FROM PUBLIC;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'fatura_tutarli') THEN
    CREATE CONSTRAINT TRIGGER fatura_tutarli AFTER INSERT ON fatura DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fatura_tutarli();
  END IF;
END $$;

-- TAHSİLAT: tarih fatura tarihinden önce ve ileri olamaz; toplam faturayı aşamaz (fatura satırı kilitlenir); kaydeden oturumdan; değişmez
CREATE OR REPLACE FUNCTION tahsilat_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE f record; odenen bigint;
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'tahsilat değişmez, silinmez' USING ERRCODE = '23514'; END IF;
  SELECT x.tarih, x.toplam INTO f FROM fatura x WHERE x.firma_id = NEW.firma_id AND x.id = NEW.fatura_id FOR UPDATE;
  IF f IS NULL THEN RAISE EXCEPTION 'fatura yok' USING ERRCODE = '23503'; END IF;
  IF NEW.tarih > (now() AT TIME ZONE 'Europe/Istanbul')::date THEN RAISE EXCEPTION 'ileri tarihli tahsilat kaydedilmez' USING ERRCODE = '23514'; END IF;
  IF NEW.tarih < f.tarih THEN RAISE EXCEPTION 'tahsilat fatura tarihinden önce olamaz' USING ERRCODE = '23514'; END IF;
  SELECT coalesce(sum(t.tutar), 0) INTO odenen FROM tahsilat t WHERE t.firma_id = NEW.firma_id AND t.fatura_id = NEW.fatura_id;
  IF odenen + NEW.tutar > f.toplam THEN RAISE EXCEPTION 'tahsilat faturanın kalanını aşamaz' USING ERRCODE = '23514'; END IF;
  NEW.kaydeden := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  RETURN NEW;
END $$;
ALTER FUNCTION tahsilat_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION tahsilat_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER tahsilat_koru BEFORE INSERT OR UPDATE OR DELETE ON tahsilat FOR EACH ROW EXECUTE FUNCTION tahsilat_koru();

GRANT SELECT, INSERT ON fatura, fatura_rapor, tahsilat TO probata_uygulama;
