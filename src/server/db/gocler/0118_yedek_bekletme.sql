-- ══ 0118 · SUPABASE'TE 1 YIL, ASIL YEDEK DRIVE'DA (2026-11-04; reisim: "biz yedek olarak sadece 1 yıllık yedek tutalım supabase de yani sadece
-- daha eski raporlar olmasın ama bu şu demek değil: ben firmaya gidince ekipmanlara rapor oluştur diyince rapor için gerekli eski bilgiler
-- silinmesin … yedeklemeyi büyük ölçüde drive ile şirket kendisi yapacak" · K1 belgeler silinmez · K2 "müşteri sadece en son onaylı raporu
-- görsün" · K3 probata arşivi son 12 ay) ══
-- (1) GÜNCEL RAPOR (rapor_guncel_mu): ekipmanın en son olağan (takip olmayan) raporu — revizyonu aşılmamış imzalı sürümler arasında en yeni
--     kontrol, eşitse en son imza (önceki rapor kuralı, raporlar/server/onceki.ts) — ve o raporun takip raporları. Güncel raporun dosyası hiç
--     silinmez; müşteri yalnız güncel raporu görür.
-- (2) DRIVE'A TAŞIMA (bekletme_sil): son imzası 1 yıldan eski, güncel olmayan raporun imzalı PDF'leri, imzaya hazırlanan PDF'leri ve fotoğrafları
--     Supabase'ten silinir — YALNIZ firmanın Drive'ı bağlıyken ve her sürümün imzalı PDF'i (ayrıca gönderilen okuma fotoğrafı / form dahil) son
--     bir saat içinde Drive'da bulunduysa (bulut_kuyruk.denetlendi). Raporda görünen fotoğraflar imzalı PDF'in içinde. Kayıt (künye, içerik, ölçüm,
--     uygunsuzluk) KALIR; silme saklama_silme'ye neden = 'drive' ile yazılır. Drive'ı bağlı olmayan firmada hiçbir şey silinmez (saklama süresi
--     kuralı — 0073 — aynen). Sözleşme, sertifika, özlük gibi belgeler silinmez (K1).
-- (3) DRIVE DENETİMİ: gönderilen dosyanın Drive'da en son bulunduğu an (bulut_kuyruk.denetlendi); bağlantının son denetim / taşıma koşusu.
-- (4) YÖNETİM: firmaların yedek durumu (yonetim_yedek_durumlari) — yalnız sayılar ve zamanlar.
-- Kilit: tests/yedek.test.ts (gerçek PostgreSQL); olumsuz kanıt tests/bozan/yedek.bozan.ts. ⛔ Her göç IDEMPOTENT.

ALTER TABLE saklama_silme ADD COLUMN IF NOT EXISTS neden text NOT NULL DEFAULT 'sure';
ALTER TABLE saklama_silme DROP CONSTRAINT IF EXISTS saklama_silme_neden;
ALTER TABLE saklama_silme ADD CONSTRAINT saklama_silme_neden CHECK (neden IN ('sure', 'drive'));
ALTER TABLE saklama_silme DROP CONSTRAINT IF EXISTS saklama_silme_dosya_check;
ALTER TABLE saklama_silme ADD CONSTRAINT saklama_silme_dosya_check CHECK (dosya >= 0);

ALTER TABLE bulut_kuyruk ADD COLUMN IF NOT EXISTS denetlendi timestamptz;
ALTER TABLE bulut_baglanti ADD COLUMN IF NOT EXISTS denetim timestamptz;
ALTER TABLE bulut_baglanti ADD COLUMN IF NOT EXISTS tasima timestamptz;
CREATE INDEX IF NOT EXISTS bulut_kuyruk_denetim ON bulut_kuyruk (firma_id, durum, (coalesce(denetlendi, gonderildi)));
CREATE INDEX IF NOT EXISTS rapor_surumu_ekipman ON rapor_surumu (firma_id, ekipman_id);

/* (1) sürüm güncel raporun mu (oturumdaki firmada; sahibin haklarıyla — müşteri rolü raporun öteki sürümlerine bakamaz) */
CREATE OR REPLACE FUNCTION rapor_guncel_mu(p_surum uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH s AS (SELECT x.id, x.rapor_id, x.revizyon, x.ekipman_id FROM rapor_surumu x WHERE x.firma_id = gecerli_firma() AND x.id = p_surum),
  son AS (
    SELECT z.rapor_id FROM rapor_surumu z JOIN rapor r ON r.firma_id = z.firma_id AND r.id = z.rapor_id
    WHERE z.firma_id = gecerli_firma() AND z.ekipman_id = (SELECT ekipman_id FROM s) AND r.takip_kaynak IS NULL
      AND NOT EXISTS (SELECT 1 FROM rapor_surumu y WHERE y.firma_id = z.firma_id AND y.rapor_id = z.rapor_id AND y.revizyon > z.revizyon)
    ORDER BY z.kontrol_tarihi DESC NULLS LAST, z.imzalandi DESC LIMIT 1)
  SELECT EXISTS (
    SELECT 1 FROM s JOIN rapor r ON r.firma_id = gecerli_firma() AND r.id = s.rapor_id
    WHERE s.revizyon = (SELECT max(y.revizyon) FROM rapor_surumu y WHERE y.firma_id = gecerli_firma() AND y.rapor_id = s.rapor_id)
      AND coalesce(r.takip_kaynak, r.id) = (SELECT rapor_id FROM son))
$$;
ALTER FUNCTION rapor_guncel_mu(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_guncel_mu(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rapor_guncel_mu(uuid) TO probata_uygulama, probata_musteri;

/* K2: müşteri yalnız güncel raporu görür (uygunsuzluk ve PDF politikaları bu politikadan geçen sürüme bakar — 0030, 0033) */
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapor_surumu' AND policyname = 'rapor_surumu_musteri') THEN
    DROP POLICY rapor_surumu_musteri ON rapor_surumu;
  END IF;
  CREATE POLICY rapor_surumu_musteri ON rapor_surumu AS RESTRICTIVE FOR SELECT TO probata_musteri
    USING (musteri_id = (SELECT gecerli_musteri()) AND musteri_tesis_gorur(tesis_id) AND rapor_guncel_mu(id));
END $$;

/* (2) Drive'a taşınabilir mi: rapor güncel değil, son imzası 1 yıldan eski, Drive bağlı, her sürümün imzalı PDF'i son bir saatte Drive'da bulundu */
CREATE OR REPLACE FUNCTION drive_tasinabilir(p_firma uuid, p_rapor uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM bulut_baglanti b WHERE b.firma_id = p_firma AND b.durum = 'bagli')
    AND EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.firma_id = p_firma AND s.rapor_id = p_rapor)
    AND NOT EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.firma_id = p_firma AND s.rapor_id = p_rapor AND s.imzalandi > now() - interval '1 year')
    AND NOT EXISTS (
      SELECT 1 FROM rapor_surumu s WHERE s.firma_id = p_firma AND s.rapor_id = p_rapor
        AND NOT EXISTS (SELECT 1 FROM saklama_silme k WHERE k.firma_id = p_firma AND k.surum_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM bulut_kuyruk q WHERE q.firma_id = p_firma AND q.dosya_id = s.imzali_dosya AND q.durum = 'gonderildi'
                          AND q.denetlendi > now() - interval '1 hour'))
    AND p_firma = gecerli_firma()
    AND NOT EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.firma_id = p_firma AND s.rapor_id = p_rapor AND rapor_guncel_mu(s.id))
$$;
ALTER FUNCTION drive_tasinabilir(uuid, uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION drive_tasinabilir(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION drive_tasinabilir(uuid, uuid) TO probata_uygulama;

/* imzalı sürümün PDF'i: çöpe alınamaz; süresi dolmadan silinemez — Drive'a taşınan raporunki hariç (aynı işlemde saklama_silme 'drive' yazılır;
   o tabloya uygulama rolü yazamaz) */
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
  IF EXISTS (SELECT 1 FROM rapor_surumu s JOIN saklama_silme k ON k.firma_id = s.firma_id AND k.surum_id = s.id AND k.neden = 'drive'
             WHERE s.firma_id = OLD.firma_id AND (s.imzali_dosya = OLD.id OR s.imzasiz_dosya = OLD.id)) THEN
    RETURN OLD;
  END IF;
  IF saklama_bitisi(OLD.firma_id, i) > now() THEN
    RAISE EXCEPTION 'imzalı raporun PDF''i saklama süresi dolmadan silinemez' USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END $$;
ALTER FUNCTION dosya_saklama_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION dosya_saklama_koru() FROM PUBLIC;

/* raporun dosyalarını Supabase'ten siler (oturumdaki firmada). Silinen: her sürümün imzalı + imzaya hazırlanan PDF'i, raporun fotoğrafları
   (görünenler PDF'in içinde; ayrıca gönderilen okuma fotoğrafı son bir saatte Drive'da bulunduysa) ve işaretli form (aynı koşulla). Dönen: depo
   anahtarları (çağıran depodan siler); taşınamazsa NULL. */
CREATE OR REPLACE FUNCTION bekletme_sil(p_rapor uuid) RETURNS text[]
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  a text[];
  s record;
  b bigint;
  n integer;
  ids uuid[];
BEGIN
  IF f IS NULL THEN RAISE EXCEPTION 'Drive taşıması firma işleminde koşar' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM rapor WHERE firma_id = f AND id = p_rapor FOR UPDATE;
  IF NOT FOUND OR NOT drive_tasinabilir(f, p_rapor) THEN RETURN NULL; END IF;
  a := '{}';
  /* sürümlerin PDF'leri */
  FOR s IN SELECT x.id, x.imzali_dosya, x.imzasiz_dosya FROM rapor_surumu x WHERE x.firma_id = f AND x.rapor_id = p_rapor
             AND NOT EXISTS (SELECT 1 FROM saklama_silme k WHERE k.firma_id = f AND k.surum_id = x.id) LOOP
    INSERT INTO saklama_silme (firma_id, surum_id, rapor_id, dosya, bayt, neden)
      SELECT f, s.id, p_rapor, count(*), coalesce(sum(d.boyut), 0), 'drive' FROM dosya d WHERE d.firma_id = f AND d.id IN (s.imzali_dosya, s.imzasiz_dosya);
    WITH d AS (DELETE FROM dosya WHERE firma_id = f AND id IN (s.imzali_dosya, s.imzasiz_dosya) RETURNING anahtar)
      SELECT a || coalesce(array_agg(d.anahtar), '{}') INTO a FROM d;
  END LOOP;
  /* fotoğraflar: görünenler (PDF'in içinde) her zaman; okuma fotoğrafı yalnız Drive'da bulunduysa */
  SELECT coalesce(array_agg(d.id), '{}') INTO ids FROM rapor r CROSS JOIN LATERAL jsonb_array_elements(r.fotolar) AS x(o)
    JOIN dosya d ON d.firma_id = f AND d.id::text = x.o ->> 'dosya'
    WHERE r.firma_id = f AND r.id = p_rapor
      AND ((x.o ->> 'okuma')::boolean IS NOT TRUE
           OR EXISTS (SELECT 1 FROM bulut_kuyruk q WHERE q.firma_id = f AND q.dosya_id = d.id AND q.durum = 'gonderildi' AND q.denetlendi > now() - interval '1 hour'));
  /* işaretli form (dosya kaydı rapora bağlı) — Drive'da bulunduysa */
  SELECT ids || coalesce(array_agg(d.id), '{}') INTO ids FROM dosya d
    WHERE d.firma_id = f AND d.kayit_id = p_rapor AND d.modul NOT IN ('rapor', 'rapor_imzali', 'rapor_pdf')
      AND EXISTS (SELECT 1 FROM bulut_kuyruk q WHERE q.firma_id = f AND q.dosya_id = d.id AND q.durum = 'gonderildi' AND q.denetlendi > now() - interval '1 hour');
  WITH d AS (DELETE FROM dosya WHERE firma_id = f AND id = ANY (ids) RETURNING anahtar, boyut)
    SELECT a || coalesce(array_agg(d.anahtar), '{}'), coalesce(sum(d.boyut), 0), count(*) INTO a, b, n FROM d;
  IF n > 0 THEN
    UPDATE saklama_silme SET dosya = dosya + n, bayt = bayt + b
      WHERE id = (SELECT k.id FROM saklama_silme k JOIN rapor_surumu x ON x.firma_id = k.firma_id AND x.id = k.surum_id
                  WHERE k.firma_id = f AND k.rapor_id = p_rapor ORDER BY x.revizyon DESC LIMIT 1);
  END IF;
  RETURN a;
END $$;
ALTER FUNCTION bekletme_sil(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION bekletme_sil(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bekletme_sil(uuid) TO probata_uygulama;

/* (4) Yönetim: firmaların yedek durumu (yalnız durum, sayı, zaman — hesap adresi yok) */
CREATE OR REPLACE FUNCTION yonetim_yedek_durumlari()
  RETURNS TABLE (firma_id uuid, saglayici text, durum text, son_kopya timestamptz, denetim timestamptz, tasima timestamptz,
                 bekleyen integer, gonderilen integer, tasinan integer)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  PERFORM yonetim_kim();
  RETURN QUERY
    SELECT b.firma_id, b.saglayici, b.durum, b.son_kopya, b.denetim, b.tasima,
      (SELECT count(*)::integer FROM bulut_kuyruk q WHERE q.firma_id = b.firma_id AND q.durum = 'bekliyor'),
      (SELECT count(*)::integer FROM bulut_kuyruk q WHERE q.firma_id = b.firma_id AND q.durum = 'gonderildi'),
      (SELECT count(*)::integer FROM saklama_silme k WHERE k.firma_id = b.firma_id AND k.neden = 'drive')
    FROM bulut_baglanti b;
END $$;
REVOKE EXECUTE ON FUNCTION yonetim_yedek_durumlari() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yonetim_yedek_durumlari() TO probata_yonetim;
