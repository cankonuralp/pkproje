-- ══ 0058 · KESİN SİLME — demirbaş (362; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü tur, 0054 deseni;
-- maket yok — en yakın onaylı desen ölçüm cihazı Sil / Pasife al, 357–358) ══
-- Kullanım: zimmet hareketi (her teslim değişmez kayıt — yabancı anahtar) · imzalı zimmet formunun kapsamı ('d:<id>'). Birlikte silinen yok (demirbaşın
-- kendi dosyası yok; teslim fotoğrafları harekete bağlı ve hareketi olan demirbaş silinmez). Kod serbest kalır. Kullanılmış demirbaş pasife alınır
-- (sütun 0015'te vardı; ekranı 362'de). ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION demirbas_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT d.id, jsonb_strip_nulls(jsonb_build_object(
    'zimmet', NULLIF((SELECT count(*) FROM zimmet_hareket z WHERE z.firma_id = d.firma_id AND z.demirbas_id = d.id), 0),
    'zimmet_formu', NULLIF((SELECT count(*) FROM zimmet_formu zf WHERE zf.firma_id = d.firma_id AND ('d:' || d.id::text) = ANY (zf.kapsam)), 0)))
  FROM demirbas d
  WHERE d.firma_id = gecerli_firma() AND d.id = ANY (p_idler)
$$;
ALTER FUNCTION demirbas_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION demirbas_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION demirbas_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION demirbas_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  d demirbas%ROWTYPE;
  k jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO d FROM demirbas WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM demirbas_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  BEGIN
    DELETE FROM demirbas WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'demirbas.sil', 'demirbas', p_id::text, to_jsonb(d) - 'firma_id', '{}'::jsonb);
  RETURN jsonb_build_object('durum', 'tamam', 'ad', d.kod);
END $$;
ALTER FUNCTION demirbas_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION demirbas_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION demirbas_sil(uuid, text) TO probata_uygulama;
