-- ══ 0057 · KESİN SİLME — ekipman türü (361; reisim 2026-10-07 "ekipman türü … silinemiyor"; §9 elli üçüncü tur, 0054 deseni; maket yok — en yakın onaylı
-- desen cihaz türü T7 ve İSG ID "hiçbir planda kullanılmamış ID silinir") ══
-- Kullanım: ekipmanı (pasif dahil) · raporu (silinmiş taslak dahil; imzalı sürüm ancak raporla) · personel ekipman ataması (kaldırılmış dahil — kişinin
-- özlük kaydı) · teklif kalemi · fatura satırı. Birlikte silinen: fiyat listesi satırı, rapor formatı sürümleri (taslak ve yayınlanmış — tür hiç rapor
-- üretmediği için bu sürümlerle çizilmiş belge yok; 0022 "yayınlanan sürüm silinmez" kuralının tek istisnası), yüklenen format PDF kayıtları (tur_format)
-- ve türün dosyaları çöpe. Kod serbest kalır. Kullanılmış tür için pasif yok: yalnız düzenlenir. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION ekipman_turu_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t.id, jsonb_strip_nulls(jsonb_build_object(
    'ekipman', NULLIF((SELECT count(*) FROM ekipman x WHERE x.firma_id = t.firma_id AND x.tur_id = t.id), 0),
    'rapor', NULLIF((SELECT count(*) FROM rapor x WHERE x.firma_id = t.firma_id AND x.tur_id = t.id), 0),
    'atama', NULLIF((SELECT count(*) FROM ekipman_atamasi x WHERE x.firma_id = t.firma_id AND x.tur_id = t.id), 0),
    'teklif', NULLIF((SELECT count(*) FROM teklif_kalem x WHERE x.firma_id = t.firma_id AND x.tur_id = t.id), 0),
    'fatura', NULLIF((SELECT count(*) FROM fatura_rapor x WHERE x.firma_id = t.firma_id AND x.tur_id = t.id), 0)))
  FROM ekipman_turu t
  WHERE t.firma_id = gecerli_firma() AND t.id = ANY (p_idler)
$$;
ALTER FUNCTION ekipman_turu_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ekipman_turu_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ekipman_turu_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION ekipman_turu_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  t ekipman_turu%ROWTYPE;
  k jsonb; formatlar jsonb; pdfler jsonb; fiyat jsonb; d jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO t FROM ekipman_turu WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM ekipman_turu_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'sira', x.sira, 'durum', x.durum) ORDER BY x.sira), '[]'::jsonb) INTO formatlar
    FROM rapor_format x WHERE x.firma_id = f AND x.tur_id = p_id;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id'), '[]'::jsonb) INTO pdfler FROM tur_format x WHERE x.firma_id = f AND x.tur_id = p_id;
  SELECT to_jsonb(x) - 'firma_id' INTO fiyat FROM fiyat_listesi x WHERE x.firma_id = f AND x.tur_id = p_id;
  BEGIN
    DELETE FROM fiyat_listesi WHERE firma_id = f AND tur_id = p_id;
    DELETE FROM rapor_format WHERE firma_id = f AND tur_id = p_id;
    DELETE FROM tur_format WHERE firma_id = f AND tur_id = p_id;
    DELETE FROM ekipman_turu WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  WITH cop AS (UPDATE dosya SET cop = now() WHERE firma_id = f AND modul = 'ekipman_turu' AND kayit_id = p_id AND cop IS NULL RETURNING id)
    SELECT coalesce(jsonb_agg(id::text), '[]'::jsonb) INTO d FROM cop;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'ekipman_turu.sil', 'ekipman_turu', p_id::text, to_jsonb(t) - 'firma_id',
      jsonb_build_object('formatlar', formatlar, 'pdfler', pdfler, 'fiyat', fiyat, 'cope_dosyalar', d));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', t.kod || ' · ' || t.ad);
END $$;
ALTER FUNCTION ekipman_turu_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ekipman_turu_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ekipman_turu_sil(uuid, text) TO probata_uygulama;
