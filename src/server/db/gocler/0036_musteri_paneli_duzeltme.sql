-- ══ 0036 · MÜŞTERİ PANELİ DÜZELTMESİ (320–323 çapraz incelemesi, 2026-10-05; doğrulanmış bulgular) ══
-- (1) Uygunsuzluğun KRİTERİ ayrı sütunda: müşterinin Uygunsuzluklar listesi ve Excel'i Kriter / Açıklama sütunlarını metinden ilk ": " ile
--     bölüyordu; kriterin kendisinde ": " olabilir (ör. kilitli Bakanlık maddesi "Kablo renk kodları Nötr: Mavi Toprak: …"). Kriter metnin
--     başıdır (metin = kriter ya da "kriter: açıklama" — CHECK); imzayla yazılır, sonra değişmez. Eski satırlarda boş (ekran eski ayrıştırmaya
--     düşer).
-- (2) musteri_surum_raporu(sürüm): bir imzalı sürümün RAPORU. Müşteri listesindeki "Giderildi · <tarih> kontrolünde" tarihi kapatan raporun
--     müşteriye açık SON sürümünden okunur: gideren rapor revize edilince kapatan eski sürüm müşteriye görünmüyor, tarih kayboluyordu (yerini
--     yeni revizyona bırakmış sürümün tarihi zaten geçersiz — 0031 ilkesi). Yalnız rapor kimliği döner (başka alan yok); firma ve müşteri süzgeci
--     açık yazılı (musteri_son_surum gibi). Son sürümün kendisi müşteri politikasından geçer: kapsam dışı tesisinse tarih yok.
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE uygunsuzluk ADD COLUMN IF NOT EXISTS kriter text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uygunsuzluk_kriter') THEN
    ALTER TABLE uygunsuzluk ADD CONSTRAINT uygunsuzluk_kriter CHECK (kriter IS NULL OR (length(kriter) BETWEEN 1 AND 1000
      AND (metin = kriter OR left(metin, length(kriter) + 2) = kriter || ': ')));
  END IF;
END $$;

-- kriter de içeriktir: imzadan sonra değişmez (öteki sütunlar uygunsuzluk_koru'da — 0031)
CREATE OR REPLACE FUNCTION uygunsuzluk_kriter_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kriter IS DISTINCT FROM OLD.kriter THEN RAISE EXCEPTION 'uygunsuzluğun içeriği değişmez' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION uygunsuzluk_kriter_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION uygunsuzluk_kriter_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER uygunsuzluk_kriter_koru BEFORE UPDATE ON uygunsuzluk FOR EACH ROW EXECUTE FUNCTION uygunsuzluk_kriter_koru();

CREATE OR REPLACE FUNCTION musteri_surum_raporu(p_surum uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT s.rapor_id FROM rapor_surumu s
      WHERE s.id = p_surum AND s.firma_id = gecerli_firma() AND gecerli_musteri() IS NOT NULL AND s.musteri_id = gecerli_musteri() $$;
ALTER FUNCTION musteri_surum_raporu(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_surum_raporu(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION musteri_surum_raporu(uuid) TO probata_musteri;
