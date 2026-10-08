-- ══ 0073 · SAKLAMA SÜRESİ — imzalı rapor PDF'i süre dolunca silinir (387; KOD-GECIS ENGEL 11, ARKA-UC §7 "Arşiv / silme (5 yıl, firma seçimi),
-- 30 gün önce liste"; reisim 2026-10-03: "depoda 5 sene sonra silcek şekilde kodla") ══
-- Saklama süresi Firma ayarları › Rapor saklama süresi (yıl); kayıt yoksa ya da bozuksa 5; her durumda 5–20 (en az 5 yıl VERİTABANINDA).
-- SİLİNME ZAMANI (saklama_bitisi): imza anı + süre; firma süreyi değiştirdiyse en erken değişiklikten 30 gün sonra — süre kısaltılınca bile her
-- silinecek rapor 30 gün önce listede görünür. Silinen: o imzalı sürümün imzalı PDF'i ve imzaya hazırlanan PDF'i (dosya satırı + depodaki nesne,
-- gece işi). İmzalı sürümün kaydı (künye, içerik, uygunsuzluklar) KALIR; silme saklama_silme'ye yazılır (ekranda "saklama süresi doldu").
-- KORUMA (dosya_saklama_koru): imzalı sürümün PDF'i çöpe alınamaz; süresi dolmadan hiçbir yoldan (tanımlayıcı-yetkili işlevler dahil) silinemez.
-- firma_ayar.degisti veritabanında damgalanır (silinme zamanı ondan hesaplanır; uygulama geçmiş tarih yazamaz).
-- Kilit: tests/saklama.test.ts; olumsuz kanıt tests/bozan/saklama.bozan.ts. ⛔ Her göç IDEMPOTENT.

/* firmanın saklama süresi (yıl), 5–20 */
CREATE OR REPLACE FUNCTION saklama_yili(p_firma uuid) RETURNS integer
  LANGUAGE sql STABLE AS $$
  SELECT LEAST(20, GREATEST(5, coalesce((
    SELECT CASE WHEN jsonb_typeof(a.deger -> 'yil') = 'number' AND (a.deger ->> 'yil') ~ '^[0-9]{1,2}$' THEN (a.deger ->> 'yil')::integer END
      FROM firma_ayar a WHERE a.firma_id = p_firma AND a.bolum = 'saklama'), 5)))
$$;
ALTER FUNCTION saklama_yili(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION saklama_yili(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION saklama_yili(uuid) TO probata_uygulama;

/* imza anından silinme zamanı: imza + süre; ayar değiştiyse en erken değişiklik + 30 gün */
CREATE OR REPLACE FUNCTION saklama_bitisi(p_firma uuid, p_imzalandi timestamptz) RETURNS timestamptz
  LANGUAGE sql STABLE AS $$
  SELECT GREATEST(p_imzalandi + make_interval(years => saklama_yili(p_firma)),
    coalesce((SELECT a.degisti + interval '30 days' FROM firma_ayar a WHERE a.firma_id = p_firma AND a.bolum = 'saklama'), '-infinity'::timestamptz))
$$;
ALTER FUNCTION saklama_bitisi(uuid, timestamptz) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION saklama_bitisi(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION saklama_bitisi(uuid, timestamptz) TO probata_uygulama;

/* ayarın değişme zamanı veritabanında (uygulama eski tarih yazıp silinmeyi öne çekemez) */
CREATE OR REPLACE FUNCTION firma_ayar_damga() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NEW.degisti := now();
  IF TG_OP = 'INSERT' THEN NEW.olustu := now(); ELSE NEW.olustu := OLD.olustu; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION firma_ayar_damga() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION firma_ayar_damga() FROM PUBLIC;
CREATE OR REPLACE TRIGGER firma_ayar_damga BEFORE INSERT OR UPDATE ON firma_ayar FOR EACH ROW EXECUTE FUNCTION firma_ayar_damga();

-- imzalı sürümün dosyası sırayla aranır (dosya güncellemesi ve silmesi korumada)
CREATE INDEX IF NOT EXISTS rapor_surumu_imzali_dosya ON rapor_surumu (firma_id, imzali_dosya);
CREATE INDEX IF NOT EXISTS rapor_surumu_imzasiz_dosya ON rapor_surumu (firma_id, imzasiz_dosya);
CREATE INDEX IF NOT EXISTS rapor_surumu_imza ON rapor_surumu (firma_id, imzalandi);

CREATE TABLE IF NOT EXISTS saklama_silme (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  surum_id  uuid NOT NULL,
  rapor_id  uuid NOT NULL,
  dosya     integer NOT NULL CHECK (dosya BETWEEN 0 AND 2),
  bayt      bigint NOT NULL CHECK (bayt >= 0),
  silindi   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, surum_id) REFERENCES rapor_surumu (firma_id, id),
  UNIQUE (firma_id, surum_id)
);
ALTER TABLE saklama_silme ENABLE ROW LEVEL SECURITY;
ALTER TABLE saklama_silme FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saklama_silme' AND policyname = 'saklama_silme_kiraci') THEN
    CREATE POLICY saklama_silme_kiraci ON saklama_silme USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
REVOKE ALL ON saklama_silme FROM PUBLIC;
GRANT SELECT ON saklama_silme TO probata_uygulama;

/* imzalı sürümün PDF'i: çöpe alınamaz; süresi dolmadan silinemez (kim çağırırsa çağırsın) */
CREATE OR REPLACE FUNCTION dosya_saklama_koru() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE i timestamptz;
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.cop IS NULL OR OLD.cop IS NOT NULL) THEN RETURN NEW; END IF;
  IF OLD.modul NOT IN ('rapor_imzali', 'rapor_pdf') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  SELECT min(s.imzalandi) INTO i FROM rapor_surumu s
    WHERE s.firma_id = OLD.firma_id AND (s.imzali_dosya = OLD.id OR s.imzasiz_dosya = OLD.id);
  IF i IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'imzalı raporun PDF''i çöpe alınamaz (saklama süresi dolunca kendiliğinden silinir)' USING ERRCODE = '23514';
  END IF;
  IF saklama_bitisi(OLD.firma_id, i) > now() THEN
    RAISE EXCEPTION 'imzalı raporun PDF''i saklama süresi dolmadan silinemez' USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END $$;
ALTER FUNCTION dosya_saklama_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION dosya_saklama_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER dosya_saklama_koru BEFORE UPDATE OR DELETE ON dosya FOR EACH ROW EXECUTE FUNCTION dosya_saklama_koru();

/* süresi dolan imzalı sürümün PDF'lerini siler (oturumdaki firmada): dosya satırları gider, silme kaydı yazılır. Dönen: silinen dosyaların depo
   anahtarları (çağıran depodan siler; veritabanı deposunda depo_nesne_sil) — süresi dolmamış / başka firmanın / bulunmayan sürümde NULL, daha önce
   silinmişse boş dizi */
CREATE OR REPLACE FUNCTION saklama_sil(p_surum uuid) RETURNS text[]
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  s record;
  a text[];
  b bigint;
  n integer;
BEGIN
  IF f IS NULL THEN RAISE EXCEPTION 'saklama silmesi firma işleminde koşar' USING ERRCODE = '42501'; END IF;
  SELECT x.id, x.rapor_id, x.imzali_dosya, x.imzasiz_dosya, x.imzalandi INTO s FROM rapor_surumu x WHERE x.firma_id = f AND x.id = p_surum FOR SHARE;
  IF NOT FOUND OR saklama_bitisi(f, s.imzalandi) > now() THEN RETURN NULL; END IF;
  PERFORM 1 FROM saklama_silme k WHERE k.firma_id = f AND k.surum_id = p_surum;
  IF FOUND THEN RETURN '{}'; END IF;
  WITH d AS (DELETE FROM dosya WHERE firma_id = f AND id IN (s.imzali_dosya, s.imzasiz_dosya) RETURNING anahtar, boyut)
    SELECT coalesce(array_agg(d.anahtar ORDER BY d.anahtar), '{}'), coalesce(sum(d.boyut), 0), count(*) INTO a, b, n FROM d;
  INSERT INTO saklama_silme (firma_id, surum_id, rapor_id, dosya, bayt) VALUES (f, p_surum, s.rapor_id, n, b);
  RETURN a;
END $$;
ALTER FUNCTION saklama_sil(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION saklama_sil(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION saklama_sil(uuid) TO probata_uygulama;
