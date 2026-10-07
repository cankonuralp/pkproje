-- ══ 0059 · KESİN SİLME — araç (363; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü tur, 0054 deseni;
-- maket yok — en yakın onaylı desen ölçüm cihazı Sil / Pasife al, 357–358) ══
-- Kullanım: zimmet hareketi (her teslim tutanağı bir harekete bağlı; değişmez kayıt) · haftalık kilometre kaydı. Birlikte silinen yok (aracın kendi
-- dosyası yok; açı fotoğrafları harekete bağlı ve hareketi olan araç silinmez). Plaka serbest kalır. Kullanılmış araç pasife alınır (sütun 0016'da
-- vardı; ekranı 363'te). ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION arac_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT a.id, jsonb_strip_nulls(jsonb_build_object(
    'km', NULLIF((SELECT count(*) FROM arac_km k WHERE k.firma_id = a.firma_id AND k.arac_id = a.id), 0),
    'zimmet', NULLIF((SELECT count(*) FROM zimmet_hareket z WHERE z.firma_id = a.firma_id AND z.arac_id = a.id), 0)))
  FROM arac a
  WHERE a.firma_id = gecerli_firma() AND a.id = ANY (p_idler)
$$;
ALTER FUNCTION arac_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION arac_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arac_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION arac_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  a arac%ROWTYPE;
  k jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO a FROM arac WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM arac_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  BEGIN
    DELETE FROM arac WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'arac.sil', 'arac', p_id::text, to_jsonb(a) - 'firma_id' - 'plaka_duz', '{}'::jsonb);
  RETURN jsonb_build_object('durum', 'tamam', 'ad', a.plaka);
END $$;
ALTER FUNCTION arac_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION arac_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arac_sil(uuid, text) TO probata_uygulama;
