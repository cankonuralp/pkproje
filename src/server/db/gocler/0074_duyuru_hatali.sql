-- ══ 0074 · DUYURU: OKUNAMAYAN KAYNAĞIN ADI (390; 379'un devamı, 0070) ══
-- Canlıdaki ilk okumada (2026-10-08) İSGGM ve İSGÜM okundu, iş ekipmanları portalı Vercel'den (Frankfurt) okunamadı; Ana sayfa "Duyurular
-- alınamadı" diyordu — hepsi alınamamış gibi. Okuma işi okunamayan kaynakların kodunu iş kaydının özetine yazar (ozet.hatali); duyuru_durumu
-- son biten koşununkini döner (yalnız bilinen kaynak kodları — özetteki başka değer ekrana gitmez). Öteki alanlar 0070 ile aynı.
-- Kilit: tests/duyuru.test.ts; olumsuz kanıt tests/bozan/duyuru.bozan.ts. ⛔ Her göç IDEMPOTENT.

/* okuma durumu: guncellendi = en az bir kaynağı okunan son koşunun bitişi · hata = biten son koşu düştü / takıldı mı · hatali = biten son
   koşuda okunamayan kaynaklar (kod, sıralı; takılan koşuda boş) · son = son denemenin başlangıcı */
CREATE OR REPLACE FUNCTION duyuru_durumu() RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH sonuncu AS (
    SELECT k.durum, k.ozet FROM is_calisma k WHERE k.ad = 'duyuru_okuma' AND k.durum IN ('tamam', 'hata', 'takildi') ORDER BY k.basladi DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'guncellendi', (SELECT max(k.bitti) FROM is_calisma k WHERE k.ad = 'duyuru_okuma' AND k.durum IN ('tamam', 'hata')
                     AND coalesce((k.ozet ->> 'okunan_kaynak')::int, 0) > 0),
    'hata', coalesce((SELECT s.durum IN ('hata', 'takildi') FROM sonuncu s), false),
    'hatali', coalesce((SELECT jsonb_agg(DISTINCT x.k ORDER BY x.k) FROM sonuncu s,
                          jsonb_array_elements_text(CASE WHEN jsonb_typeof(s.ozet -> 'hatali') = 'array' THEN s.ozet -> 'hatali' ELSE '[]'::jsonb END) AS x(k)
                        WHERE x.k IN ('isggm', 'isgum', 'isekipman')), '[]'::jsonb),
    'son', (SELECT max(k.basladi) FROM is_calisma k WHERE k.ad = 'duyuru_okuma'))
$$;
ALTER FUNCTION duyuru_durumu() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION duyuru_durumu() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION duyuru_durumu() TO probata_uygulama;
