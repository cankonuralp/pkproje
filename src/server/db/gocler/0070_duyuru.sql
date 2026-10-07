-- ══ 0070 · DUYURULAR (379; KOD-GECIS K5 "İSGGM duyuru okuma", ARKA-UC §7, pkproje §3 Ana sayfa "Duyurular" — yirmi yedinci / sekizinci tur) ══
-- Bakanlığın herkese açık duyuruları (İSGGM, İSGÜM, iş ekipmanları portalı) sunucuda okunur, Ana sayfada en yeni üstte gösterilir: başlık, kaynak,
-- yayım tarihi, yeni sekmede bağlantı. FİRMA VERİSİ DEĞİL (bütün firmalar aynı listeyi görür; firma_id yok). Tarihi doğrulanamayan duyuru girmez
-- (tarih zorunlu); bağlantı yalnız Bakanlığın iki adresine (başka siteye bağlantı yazılamaz). Kaynak başına en yeni 50 tutulur.
-- Uygulama rolü tabloya doğrudan erişemez: duyuru_yaz (okuma işi) · duyuru_listesi · duyuru_durumu (Ana sayfa). Okuma işinin kaydı is_calisma
-- ('duyuru_okuma', 0069): son başarılı okuma zamanı, son okuma düştü mü ("alınamadı; son alınan liste gösteriliyor"), son deneme (tazelik).
-- Kilit: tests/duyuru.test.ts, tests/duyuru-ayristir.test.ts; olumsuz kanıt tests/bozan/duyuru.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS duyuru (
  url     text PRIMARY KEY CHECK (length(url) <= 300 AND url ~ '^https://(www\.csgb\.gov\.tr|isekipmanlari\.csgb\.gov\.tr)/[A-Za-z0-9/._?=&%-]*$'),
  kaynak  text NOT NULL CHECK (kaynak IN ('isggm', 'isgum', 'isekipman')),
  baslik  text NOT NULL CHECK (length(baslik) BETWEEN 3 AND 300),
  tarih   date NOT NULL CHECK (tarih >= DATE '2000-01-01'),
  alindi  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS duyuru_kaynak_tarih ON duyuru (kaynak, tarih DESC);
ALTER TABLE duyuru ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON duyuru FROM PUBLIC;

/* okuma işi yazar: bir kaynağın okunan listesi (dizi: url, baslik, tarih) eklenir / güncellenir; kaynak başına en yeni 50 kalır. Gelecekteki
   tarih (1 günden ileri) reddedilir. Dönen: yeni eklenen sayısı. */
CREATE OR REPLACE FUNCTION duyuru_yaz(p_kaynak text, p jsonb) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE yeni integer;
BEGIN
  IF p_kaynak IS NULL OR p_kaynak NOT IN ('isggm', 'isgum', 'isekipman') THEN RAISE EXCEPTION 'duyuru kaynağı geçersiz' USING ERRCODE = '23514'; END IF;
  IF p IS NULL OR jsonb_typeof(p) <> 'array' OR jsonb_array_length(p) > 200 THEN RAISE EXCEPTION 'duyuru listesi geçersiz' USING ERRCODE = '23514'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p) AS x(url text, baslik text, tarih date) WHERE x.tarih IS NULL OR x.tarih > current_date + 1) THEN
    RAISE EXCEPTION 'duyurunun tarihi geçersiz' USING ERRCODE = '23514';
  END IF;
  WITH girdi AS (
    SELECT DISTINCT ON (x.url) x.url, btrim(x.baslik) AS baslik, x.tarih FROM jsonb_to_recordset(p) AS x(url text, baslik text, tarih date) ORDER BY x.url
  ), yaz AS (
    INSERT INTO duyuru (url, kaynak, baslik, tarih) SELECT g.url, p_kaynak, g.baslik, g.tarih FROM girdi g
    ON CONFLICT (url) DO UPDATE SET baslik = EXCLUDED.baslik, tarih = EXCLUDED.tarih
      WHERE duyuru.kaynak = EXCLUDED.kaynak AND (duyuru.baslik, duyuru.tarih) IS DISTINCT FROM (EXCLUDED.baslik, EXCLUDED.tarih)
    RETURNING (xmax = 0) AS eklendi
  ) SELECT count(*) FILTER (WHERE eklendi) INTO yeni FROM yaz;
  DELETE FROM duyuru d WHERE d.kaynak = p_kaynak
    AND d.url NOT IN (SELECT e.url FROM duyuru e WHERE e.kaynak = p_kaynak ORDER BY e.tarih DESC, e.url LIMIT 50);
  RETURN yeni;
END $$;
ALTER FUNCTION duyuru_yaz(text, jsonb) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION duyuru_yaz(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION duyuru_yaz(text, jsonb) TO probata_uygulama;

/* Ana sayfa: kaynak başına en yeni p_adet, hepsi en yeni üstte (bir kaynağın sık duyuruları ötekileri gizlemesin) */
CREATE OR REPLACE FUNCTION duyuru_listesi(p_adet integer) RETURNS TABLE (url text, kaynak text, baslik text, tarih date)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT x.url, x.kaynak, x.baslik, x.tarih FROM (
    SELECT d.*, row_number() OVER (PARTITION BY d.kaynak ORDER BY d.tarih DESC, d.url) AS n FROM duyuru d
  ) x WHERE x.n <= least(greatest(coalesce(p_adet, 0), 0), 20) ORDER BY x.tarih DESC, x.kaynak, x.url
$$;
ALTER FUNCTION duyuru_listesi(integer) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION duyuru_listesi(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION duyuru_listesi(integer) TO probata_uygulama;

/* okuma durumu: guncellendi = en az bir kaynağı okunan son koşunun bitişi · hata = biten son koşu düştü / takıldı mı · son = son denemenin
   başlangıcı */
CREATE OR REPLACE FUNCTION duyuru_durumu() RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'guncellendi', (SELECT max(k.bitti) FROM is_calisma k WHERE k.ad = 'duyuru_okuma' AND k.durum IN ('tamam', 'hata')
                     AND coalesce((k.ozet ->> 'okunan_kaynak')::int, 0) > 0),
    'hata', coalesce((SELECT k.durum IN ('hata', 'takildi') FROM is_calisma k WHERE k.ad = 'duyuru_okuma' AND k.durum IN ('tamam', 'hata', 'takildi')
                       ORDER BY k.basladi DESC LIMIT 1), false),
    'son', (SELECT max(k.basladi) FROM is_calisma k WHERE k.ad = 'duyuru_okuma'))
$$;
ALTER FUNCTION duyuru_durumu() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION duyuru_durumu() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION duyuru_durumu() TO probata_uygulama;
