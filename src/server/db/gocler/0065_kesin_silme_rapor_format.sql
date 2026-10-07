-- ══ 0065 · KESİN SİLME — rapor formatı taslağı (370; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü
-- tur; 0054 deseni; 0022 "yayınlanan sürüm silinmez" aynen) ══
-- Yalnız TASLAK (hiç yayınlanmamış) sürüm kesin silinir — vazgeçilen deneme; yayınlanmış ya da eski sürüm silinmez (raporlar onunla çizilir). Rapor
-- yalnız yayındaki sürümle açılır; yine de raporun format bağı da kullanım sayılır. Taslağın tanımı izde eski değeriyle kalır. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION rapor_format_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT r.id, jsonb_strip_nulls(jsonb_build_object(
    'yayinlandi', CASE WHEN r.durum <> 'taslak' THEN 1 END,
    'rapor', NULLIF((SELECT count(*) FROM rapor x WHERE x.firma_id = r.firma_id AND x.format_id = r.id), 0)))
  FROM rapor_format r
  WHERE r.firma_id = gecerli_firma() AND r.id = ANY (p_idler)
$$;
ALTER FUNCTION rapor_format_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_format_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rapor_format_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION rapor_format_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  r rapor_format%ROWTYPE;
  k jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  -- tür önce kilitlenir (format işlemleri — taslak başlat, yayınla — türü kilitler: aynı sıra)
  PERFORM 1 FROM ekipman_turu t WHERE t.firma_id = f AND t.id = (SELECT x.tur_id FROM rapor_format x WHERE x.firma_id = f AND x.id = p_id) FOR UPDATE;
  SELECT * INTO r FROM rapor_format WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM rapor_format_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  BEGIN
    DELETE FROM rapor_format WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'rapor_format.sil', 'rapor_format', p_id::text, to_jsonb(r) - 'firma_id', '{}'::jsonb);
  RETURN jsonb_build_object('durum', 'tamam', 'ad', 'Taslak');
END $$;
ALTER FUNCTION rapor_format_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_format_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rapor_format_sil(uuid, text) TO probata_uygulama;
