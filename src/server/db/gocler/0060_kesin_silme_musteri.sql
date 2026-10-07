-- ══ 0060 · KESİN SİLME — müşteri ve tesis (364; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü tur:
-- karar 48 "müşteri silinmez" KULLANILMIŞ müşteri için geçerli kalır, kullanılmamış — deneme — müşteri silinir; 0054 deseni) ══
-- TESİS kullanımı: ekipmanı (pasif dahil) · planı · iş sözleşmesi kapsamı · ETKİN İSG-KATİP ID'si (kaldırılmış ve önceki sürümler yasal iz değil:
-- tesisle birlikte silinir, belgeleri çöpe) · teklif kapsamı · müşteri girişinin tesis kapsamı (yabancı anahtarsız dizi).
-- MÜŞTERİ kullanımı: iş sözleşmesi · teklif (müşteriye ya da tesisine) · fatura · GİRİLMİŞ müşteri girişi (son_giris dolu: müşteri panele girdi) ·
-- tesislerinin ekipmanı, planı ve etkin İSG ID'si. Birlikte silinen: tesisleri, hiç girilmemiş girişleri (oturumları zincirle), kaldırılmış İSG
-- kayıtları. Kod / vergi no / e-posta serbest kalır. Kullanılmış müşteri ve tesis pasife alınır (karar 48). ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION tesis_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t.id, jsonb_strip_nulls(jsonb_build_object(
    'ekipman', NULLIF((SELECT count(*) FROM ekipman x WHERE x.firma_id = t.firma_id AND x.tesis_id = t.id), 0),
    'plan', NULLIF((SELECT count(*) FROM plan x WHERE x.firma_id = t.firma_id AND x.tesis_id = t.id), 0),
    'sozlesme', NULLIF((SELECT count(*) FROM is_sozlesmesi_tesis x WHERE x.firma_id = t.firma_id AND x.tesis_id = t.id), 0),
    'isg', NULLIF((SELECT count(*) FROM isg_katip x WHERE x.firma_id = t.firma_id AND x.tesis_id = t.id AND NOT x.onceki AND x.kaldirildi IS NULL), 0),
    'teklif_belgesi', NULLIF((SELECT count(*) FROM teklif_tesis x WHERE x.firma_id = t.firma_id AND x.tesis_id = t.id), 0),
    'giris', NULLIF((SELECT count(*) FROM musteri_hesap x WHERE x.firma_id = t.firma_id AND x.tesisler @> ARRAY[t.id]), 0)))
  FROM tesis t
  WHERE t.firma_id = gecerli_firma() AND t.id = ANY (p_idler)
$$;
ALTER FUNCTION tesis_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION tesis_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tesis_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION musteri_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT m.id, jsonb_strip_nulls(jsonb_build_object(
    'sozlesme', NULLIF((SELECT count(*) FROM is_sozlesmesi x WHERE x.firma_id = m.firma_id AND (x.musteri_id = m.id OR EXISTS (
      SELECT 1 FROM is_sozlesmesi_tesis st JOIN tesis t ON t.firma_id = st.firma_id AND t.id = st.tesis_id
       WHERE st.firma_id = x.firma_id AND st.sozlesme_id = x.id AND t.musteri_id = m.id))), 0),
    'teklif_belgesi', NULLIF((SELECT count(*) FROM teklif x WHERE x.firma_id = m.firma_id AND (x.musteri_id = m.id OR EXISTS (
      SELECT 1 FROM teklif_tesis tt JOIN tesis t ON t.firma_id = tt.firma_id AND t.id = tt.tesis_id
       WHERE tt.firma_id = x.firma_id AND tt.teklif_id = x.id AND t.musteri_id = m.id))), 0),
    'fatura_kaydi', NULLIF((SELECT count(*) FROM fatura x WHERE x.firma_id = m.firma_id AND x.musteri_id = m.id), 0),
    'giris', NULLIF((SELECT count(*) FROM musteri_hesap x WHERE x.firma_id = m.firma_id AND x.musteri_id = m.id AND x.son_giris IS NOT NULL), 0),
    'ekipman', NULLIF((SELECT count(*) FROM ekipman x JOIN tesis t ON t.firma_id = x.firma_id AND t.id = x.tesis_id
       WHERE x.firma_id = m.firma_id AND t.musteri_id = m.id), 0),
    'plan', NULLIF((SELECT count(*) FROM plan x JOIN tesis t ON t.firma_id = x.firma_id AND t.id = x.tesis_id
       WHERE x.firma_id = m.firma_id AND t.musteri_id = m.id), 0),
    'isg', NULLIF((SELECT count(*) FROM isg_katip x JOIN tesis t ON t.firma_id = x.firma_id AND t.id = x.tesis_id
       WHERE x.firma_id = m.firma_id AND t.musteri_id = m.id AND NOT x.onceki AND x.kaldirildi IS NULL), 0)))
  FROM musteri m
  WHERE m.firma_id = gecerli_firma() AND m.id = ANY (p_idler)
$$;
ALTER FUNCTION musteri_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION musteri_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION tesis_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  t tesis%ROWTYPE;
  k jsonb; isg jsonb; d jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  -- müşteri önce kilitlenir (musteri_sil ile aynı sıra: müşteri → tesis)
  PERFORM 1 FROM musteri m WHERE m.firma_id = f AND m.id = (SELECT x.musteri_id FROM tesis x WHERE x.firma_id = f AND x.id = p_id) FOR UPDATE;
  SELECT * INTO t FROM tesis WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM tesis_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.olustu), '[]'::jsonb) INTO isg FROM isg_katip x WHERE x.firma_id = f AND x.tesis_id = p_id;
  BEGIN
    DELETE FROM isg_katip WHERE firma_id = f AND tesis_id = p_id;
    DELETE FROM tesis WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  WITH cop AS (UPDATE dosya SET cop = now() WHERE firma_id = f AND modul = 'isg_katip' AND cop IS NULL
                 AND kayit_id IN (SELECT (e->>'id')::uuid FROM jsonb_array_elements(isg) e) RETURNING id)
    SELECT coalesce(jsonb_agg(id::text), '[]'::jsonb) INTO d FROM cop;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'tesis.sil', 'tesis', p_id::text, to_jsonb(t) - 'firma_id', jsonb_build_object('isg', isg, 'cope_dosyalar', d));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', t.ad);
END $$;
ALTER FUNCTION tesis_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION tesis_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tesis_sil(uuid, text) TO probata_uygulama;

CREATE OR REPLACE FUNCTION musteri_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  m musteri%ROWTYPE;
  k jsonb; tes jsonb; gir jsonb; isg jsonb; d jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO m FROM musteri WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  PERFORM 1 FROM tesis WHERE firma_id = f AND musteri_id = p_id FOR UPDATE;
  SELECT u.kullanim INTO k FROM musteri_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.olustu), '[]'::jsonb) INTO tes FROM tesis x WHERE x.firma_id = f AND x.musteri_id = p_id;
  -- girişin parola özeti ize yazılmaz
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' - 'parola_ozeti' ORDER BY x.olustu), '[]'::jsonb) INTO gir FROM musteri_hesap x WHERE x.firma_id = f AND x.musteri_id = p_id;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.olustu), '[]'::jsonb) INTO isg FROM isg_katip x
    WHERE x.firma_id = f AND x.tesis_id IN (SELECT y.id FROM tesis y WHERE y.firma_id = f AND y.musteri_id = p_id);
  BEGIN
    DELETE FROM musteri_hesap WHERE firma_id = f AND musteri_id = p_id;
    DELETE FROM isg_katip WHERE firma_id = f AND tesis_id IN (SELECT y.id FROM tesis y WHERE y.firma_id = f AND y.musteri_id = p_id);
    DELETE FROM tesis WHERE firma_id = f AND musteri_id = p_id;
    DELETE FROM musteri WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  WITH cop AS (UPDATE dosya SET cop = now() WHERE firma_id = f AND modul = 'isg_katip' AND cop IS NULL
                 AND kayit_id IN (SELECT (e->>'id')::uuid FROM jsonb_array_elements(isg) e) RETURNING id)
    SELECT coalesce(jsonb_agg(id::text), '[]'::jsonb) INTO d FROM cop;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'musteri.sil', 'musteri', p_id::text, to_jsonb(m) - 'firma_id',
      jsonb_build_object('tesisler', tes, 'girisler', gir, 'isg', isg, 'cope_dosyalar', d));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', m.kisa);
END $$;
ALTER FUNCTION musteri_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION musteri_sil(uuid, text) TO probata_uygulama;
