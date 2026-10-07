-- ══ 0064 · KESİN SİLME — imza bekleyen iş sözleşmesi (369; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli
-- üçüncü tur; 0054 deseni; 0017'nin "silme yok"u imzalanmış sözleşme için geçerli kalır) ══
-- Yalnız müşteri imzası hiç yüklenmemiş (imzalı tarama bir kez bile yüklenmemiş — kaldırılmışı dahil) ve faturası olmayan sözleşme kesin silinir:
-- yanlış müşteri / tesis / tarihle hazırlanmış taslak. Birlikte silinen: kapsam tesisleri. İSG-KATİP ID'leri tesis × denetçiye bağlıdır, sözleşmeyle
-- gitmez. Sözleşme numarası yeniden verilmez (sayaç geri gitmez). ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION is_sozlesmesi_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT s.id, jsonb_strip_nulls(jsonb_build_object(
    'imzali', CASE WHEN s.musteri_imza IS NOT NULL OR EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = s.firma_id AND d.modul = 'is_sozlesmesi' AND d.kayit_id = s.id)
      THEN 1 END,
    'fatura_kaydi', NULLIF((SELECT count(*) FROM fatura x WHERE x.firma_id = s.firma_id AND x.sozlesme_id = s.id), 0)))
  FROM is_sozlesmesi s
  WHERE s.firma_id = gecerli_firma() AND s.id = ANY (p_idler)
$$;
ALTER FUNCTION is_sozlesmesi_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION is_sozlesmesi_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_sozlesmesi_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION is_sozlesmesi_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  s is_sozlesmesi%ROWTYPE;
  k jsonb; tes jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO s FROM is_sozlesmesi WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM is_sozlesmesi_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(x.tesis_id::text ORDER BY x.olustu), '[]'::jsonb) INTO tes FROM is_sozlesmesi_tesis x WHERE x.firma_id = f AND x.sozlesme_id = p_id;
  BEGIN
    DELETE FROM is_sozlesmesi_tesis WHERE firma_id = f AND sozlesme_id = p_id;
    DELETE FROM is_sozlesmesi WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'sozlesme.sil', 'is_sozlesmesi', p_id::text, to_jsonb(s) - 'firma_id', jsonb_build_object('tesisler', tes));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', s.no);
END $$;
ALTER FUNCTION is_sozlesmesi_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION is_sozlesmesi_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_sozlesmesi_sil(uuid, text) TO probata_uygulama;
