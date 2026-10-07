-- ══ 0063 · KESİN SİLME — teklif taslağı (368; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü tur; 0054
-- deseni) ══
-- Yalnız TASLAK (hiç gönderilmemiş) teklif kesin silinir; gönderilmiş teklif müşteriye verilmiş belgedir — silinmez (red / süresi doldu kalır, yenisi
-- kopyalanır). Kullanım: gönderildi · bu tekliften kopyalanan teklif (kopya_kaynak) · dayanak olduğu iş sözleşmesi · fatura satırı (yalnız kabul
-- edilmişte olur). Birlikte silinen: kalemleri ve tesisleri (0037 parça tetiği taslakta silmeye izin verir). Teklif numarası yeniden verilmez
-- (sayaç geri gitmez; arada boşluk kalır — iz numarayı tutar). ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION teklif_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t.id, jsonb_strip_nulls(jsonb_build_object(
    'gonderildi', CASE WHEN t.durum <> 'taslak' THEN 1 END,
    'kopya', NULLIF((SELECT count(*) FROM teklif x WHERE x.firma_id = t.firma_id AND x.kopya_kaynak = t.id), 0),
    'sozlesme', NULLIF((SELECT count(*) FROM is_sozlesmesi x WHERE x.firma_id = t.firma_id AND x.teklif_id = t.id), 0),
    'fatura', NULLIF((SELECT count(*) FROM fatura_rapor x WHERE x.firma_id = t.firma_id AND x.teklif_id = t.id), 0)))
  FROM teklif t
  WHERE t.firma_id = gecerli_firma() AND t.id = ANY (p_idler)
$$;
ALTER FUNCTION teklif_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION teklif_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION teklif_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION teklif_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  t teklif%ROWTYPE;
  k jsonb; kal jsonb; tes jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO t FROM teklif WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM teklif_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.sira), '[]'::jsonb) INTO kal FROM teklif_kalem x WHERE x.firma_id = f AND x.teklif_id = p_id;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.sira), '[]'::jsonb) INTO tes FROM teklif_tesis x WHERE x.firma_id = f AND x.teklif_id = p_id;
  BEGIN
    DELETE FROM teklif_kalem WHERE firma_id = f AND teklif_id = p_id;
    DELETE FROM teklif_tesis WHERE firma_id = f AND teklif_id = p_id;
    DELETE FROM teklif WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'teklif.sil', 'teklif', p_id::text, to_jsonb(t) - 'firma_id', jsonb_build_object('kalemler', kal, 'tesisler', tes));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', t.no);
END $$;
ALTER FUNCTION teklif_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION teklif_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION teklif_sil(uuid, text) TO probata_uygulama;
