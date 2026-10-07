-- ══ 0067 · KESİN SİLME — raporsuz plan (372; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü tur; 0054
-- deseni; 0023'ün "silme hakkı yok"u kullanılmış plan için geçerli kalır) ══
-- Hiç raporu (silinmiş taslak dahil) olmayan, tamamlanmamış, faturası ve gideri olmayan plan kesin silinir: yanlış tesis / tarih / ekiple açılmış
-- plan. Birlikte silinen: plan ekibi, plan ekipman satırları (ekipmanlar tesiste kalır), proje notları. Planın kullandığı İSG-KATİP ID'si başka bir
-- planda kullanılmıyorsa yeniden "kullanılmamış" olur (kaldırılabilir). Proje numarası yeniden verilmez. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION plan_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id, jsonb_strip_nulls(jsonb_build_object(
    'rapor', NULLIF((SELECT count(*) FROM rapor x WHERE x.firma_id = p.firma_id AND x.plan_id = p.id), 0),
    'tamamlandi', CASE WHEN p.durum = 'tamamlandi' THEN 1 END,
    'fatura', NULLIF((SELECT count(*) FROM fatura_rapor x WHERE x.firma_id = p.firma_id AND x.plan_id = p.id), 0),
    'gider', NULLIF((SELECT count(*) FROM gider x WHERE x.firma_id = p.firma_id AND x.plan_id = p.id), 0)))
  FROM plan p
  WHERE p.firma_id = gecerli_firma() AND p.id = ANY (p_idler)
$$;
ALTER FUNCTION plan_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION plan_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION plan_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION plan_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  p plan%ROWTYPE;
  k jsonb; ekip jsonb; ekp jsonb; notlar jsonb; isgler uuid[]; serbest jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  -- plan kilitlenir: rapor oluşturma ve ekipman ekleme planı paylaşımlı kilitler (aynı anda koşmaz)
  SELECT * INTO p FROM plan WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM plan_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.olustu), '[]'::jsonb), coalesce(array_agg(x.isg_id) FILTER (WHERE x.isg_id IS NOT NULL), '{}')
    INTO ekip, isgler FROM plan_ekip x WHERE x.firma_id = f AND x.plan_id = p_id;
  SELECT coalesce(jsonb_agg(x.ekipman_id::text ORDER BY x.olustu), '[]'::jsonb) INTO ekp FROM plan_ekipman x WHERE x.firma_id = f AND x.plan_id = p_id;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.olustu), '[]'::jsonb) INTO notlar FROM plan_not x WHERE x.firma_id = f AND x.plan_id = p_id;
  BEGIN
    DELETE FROM plan_not WHERE firma_id = f AND plan_id = p_id;
    DELETE FROM plan_ekipman WHERE firma_id = f AND plan_id = p_id;
    DELETE FROM plan_ekip WHERE firma_id = f AND plan_id = p_id;
    DELETE FROM plan WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  -- başka planda kullanılmayan İSG-KATİP ID'si yeniden kullanılmamış olur
  WITH s AS (UPDATE isg_katip i SET kullanildi = NULL, surum = surum + 1, degisti = now()
               WHERE i.firma_id = f AND i.id = ANY (isgler) AND i.kullanildi IS NOT NULL
                 AND NOT EXISTS (SELECT 1 FROM plan_ekip pe WHERE pe.firma_id = f AND pe.isg_id = i.id) RETURNING i.id)
    SELECT coalesce(jsonb_agg(s.id::text), '[]'::jsonb) INTO serbest FROM s;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'plan.sil', 'plan', p_id::text, to_jsonb(p) - 'firma_id',
      jsonb_build_object('ekip', ekip, 'ekipmanlar', ekp, 'notlar', notlar, 'serbest_isg', serbest));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', p.no);
END $$;
ALTER FUNCTION plan_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION plan_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION plan_sil(uuid, text) TO probata_uygulama;
