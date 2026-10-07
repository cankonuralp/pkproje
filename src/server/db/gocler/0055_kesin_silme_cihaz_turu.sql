-- ══ 0055 · KESİN SİLME — cihaz türü (359; §9 elli üçüncü tur, 0054 deseni; maket olcum-cihazlari.html T7 "Cihaz türleri": "cihazı olmayan tür
-- silinir; ekipman türlerinin kullanacağı cihazlardan da çıkar" — maket-cihazlar.js tur-sil, pkproje §11 120) ══
-- Kullanım: türün cihazı (pasif dahil; yabancı anahtar olcum_cihazi.tur_id) · raporun cihaz listesinde tür olarak geçmesi (rapor.cihazlar JSON; cihaz
-- sonradan başka türe alınmış olabilir — silinmiş taslak dahil). Silinince AYNI işlemde bütün ekipman türlerinin cihaz_turleri dizisinden çıkar (sürüm
-- artar, her değişen tür için denetim izi) — çıkmasaydı rapor doldurulamayan bir "Ölçüm cihazı" satırı ister, onaya gönderi kalıcı olarak takılırdı.
-- Kullanılmış tür için pasif yok (yalnız ad düzenlenir). ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION cihaz_turu_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t.id, jsonb_strip_nulls(jsonb_build_object(
    'cihaz', NULLIF((SELECT count(*) FROM olcum_cihazi c WHERE c.firma_id = t.firma_id AND c.tur_id = t.id), 0),
    'rapor', NULLIF((SELECT count(*) FROM rapor r WHERE r.firma_id = t.firma_id AND position(t.id::text IN r.cihazlar::text) > 0), 0)))
  FROM cihaz_turu t
  WHERE t.firma_id = gecerli_firma() AND t.id = ANY (p_idler)
$$;
ALTER FUNCTION cihaz_turu_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION cihaz_turu_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cihaz_turu_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION cihaz_turu_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  t cihaz_turu%ROWTYPE;
  k jsonb; e record; ekipman jsonb := '[]'::jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO t FROM cihaz_turu WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM cihaz_turu_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  BEGIN
    FOR e IN SELECT id, kod, cihaz_turleri FROM ekipman_turu WHERE firma_id = f AND p_id = ANY (cihaz_turleri) ORDER BY kod FOR UPDATE LOOP
      UPDATE ekipman_turu SET cihaz_turleri = array_remove(cihaz_turleri, p_id), surum = surum + 1, degisti = now() WHERE firma_id = f AND id = e.id;
      INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, yeni, gerekce)
        VALUES (p_kim, 'ekipman_turu.baglanti', 'ekipman_turu', e.id::text, jsonb_build_object('cihaz_turleri', to_jsonb(e.cihaz_turleri)),
          jsonb_build_object('cihaz_turleri', to_jsonb(array_remove(e.cihaz_turleri, p_id))), 'cihaz türü silindi: ' || t.ad);
      ekipman := ekipman || to_jsonb(e.kod);
    END LOOP;
    DELETE FROM cihaz_turu WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'cihaz_turu.sil', 'cihaz_turu', p_id::text, to_jsonb(t) - 'firma_id', jsonb_build_object('ekipman_turlerinden_cikti', ekipman));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', t.ad);
END $$;
ALTER FUNCTION cihaz_turu_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION cihaz_turu_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cihaz_turu_sil(uuid, text) TO probata_uygulama;
