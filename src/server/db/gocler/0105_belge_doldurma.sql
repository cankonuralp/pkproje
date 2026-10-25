-- ══ 0105 · BELGE DOLDURMA + SÖZLEŞME BELGESİ + E-POSTA EKİ (2026-10-25; reisim: "Sözleşmeyi belge formatlarına bağla ve ön bilgilendirme formunu plan
--    açılınca müşteriye e-postayla gönder", "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri için
--    sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim") ══
-- 1. belge_format: belge listesine "sozlesme" (src/belge/katalog.ts BELGE_TURLERI ile aynı — tests/belge-format-saf.test.ts).
-- 2. belge_doldurma: bir belgenin (sözleşme, teklif, zimmet … — kayit_id o belgenin kaydı) elle doldurulan yerlerinin değerleri: formatın "alan"
--    hücreleri (hücre kimliği → değer). Kayıt başına tek satır; sürüm kilidiyle güncellenir; silinmez. Hangi format sürümüyle doldurulduğu format_id.
-- 3. eposta: tek PDF eki (ek_dosya — tek dosya yolundaki dosyanın kimliği, ek_ad — ekin adı); ek de metin gibi yazıldığı gibi kalır (tetik).
-- Politikalar "(SELECT gecerli_firma())" (0091); yabancı anahtarlar dizinli. ⛔ Her göç IDEMPOTENT.

ALTER TABLE belge_format DROP CONSTRAINT IF EXISTS belge_format_belge_check;
ALTER TABLE belge_format ADD CONSTRAINT belge_format_belge_check
  CHECK (belge IN ('zimmet', 'arac', 'egitim', 'izin', 'masraf', 'teklif', 'fatura', 'saha', 'onbilgi', 'sozlesme'));

CREATE TABLE IF NOT EXISTS belge_doldurma (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  belge       text NOT NULL,
  kayit_id    uuid NOT NULL,
  format_id   uuid,
  degerler    jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(degerler) = 'object' AND octet_length(degerler::text) <= 200000),
  dolduran    text NOT NULL CHECK (length(dolduran) BETWEEN 1 AND 200),
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, belge, kayit_id),
  UNIQUE (firma_id, id),
  FOREIGN KEY (firma_id, format_id) REFERENCES belge_format (firma_id, id)
);
ALTER TABLE belge_doldurma DROP CONSTRAINT IF EXISTS belge_doldurma_belge_check;
ALTER TABLE belge_doldurma ADD CONSTRAINT belge_doldurma_belge_check
  CHECK (belge IN ('zimmet', 'arac', 'egitim', 'izin', 'masraf', 'teklif', 'fatura', 'saha', 'onbilgi', 'sozlesme'));
CREATE INDEX IF NOT EXISTS belge_doldurma_format ON belge_doldurma (firma_id, format_id);
ALTER TABLE belge_doldurma ENABLE ROW LEVEL SECURITY;
ALTER TABLE belge_doldurma FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'belge_doldurma' AND policyname = 'belge_doldurma_kiraci') THEN
    CREATE POLICY belge_doldurma_kiraci ON belge_doldurma USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;
/* belge ve kaydı değişmez; silinmez */
CREATE OR REPLACE FUNCTION belge_doldurma_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'belge doldurma kaydı silinmez' USING ERRCODE = '23514'; END IF;
  IF NEW.belge IS DISTINCT FROM OLD.belge OR NEW.kayit_id IS DISTINCT FROM OLD.kayit_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'belge doldurmanın belgesi değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION belge_doldurma_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION belge_doldurma_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER belge_doldurma_koru BEFORE UPDATE OR DELETE ON belge_doldurma FOR EACH ROW EXECUTE FUNCTION belge_doldurma_koru();
REVOKE ALL ON belge_doldurma FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON belge_doldurma TO probata_uygulama;

ALTER TABLE eposta ADD COLUMN IF NOT EXISTS ek_dosya uuid;
ALTER TABLE eposta ADD COLUMN IF NOT EXISTS ek_ad text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eposta_ek_bicim') THEN
    ALTER TABLE eposta ADD CONSTRAINT eposta_ek_bicim CHECK ((ek_dosya IS NULL) = (ek_ad IS NULL) AND (ek_ad IS NULL OR length(ek_ad) BETWEEN 1 AND 200));
  END IF;
END $$;
/* gönderilen metin, GÖNDEREN ve EK değişmez; gönderilmiş e-posta yeniden "bekliyor" olmaz */
CREATE OR REPLACE FUNCTION eposta_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'e-posta kaydı silinmez' USING ERRCODE = '23514'; END IF;
  IF NEW.kime IS DISTINCT FROM OLD.kime OR NEW.konu IS DISTINCT FROM OLD.konu OR NEW.govde IS DISTINCT FROM OLD.govde
     OR NEW.kaynak IS DISTINCT FROM OLD.kaynak OR NEW.kaynak_id IS DISTINCT FROM OLD.kaynak_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id
     OR NEW.gonderen_ad IS DISTINCT FROM OLD.gonderen_ad OR NEW.gonderen_eposta IS DISTINCT FROM OLD.gonderen_eposta
     OR NEW.ek_dosya IS DISTINCT FROM OLD.ek_dosya OR NEW.ek_ad IS DISTINCT FROM OLD.ek_ad THEN
    RAISE EXCEPTION 'gönderilecek e-postanın metni, göndereni ve eki değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'gonderildi' AND NEW.durum <> 'gonderildi' THEN RAISE EXCEPTION 'gönderilmiş e-posta geri alınmaz' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION eposta_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION eposta_koru() FROM PUBLIC;
