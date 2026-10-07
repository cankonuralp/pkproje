-- ══ 0061 · KESİN SİLME — personel (366; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü tur: karar 43
-- "ayrılan personel silinmez" KULLANILMIŞ personel için geçerli kalır — o "Ayrıldı" olur; deneme / yanlış girilen personel silinir; 0054 deseni) ══
-- Kullanım: zimmet hareketi (teslim eden ya da alan) · haftalık kilometre · ETKİN İSG-KATİP ID'si · eğitim kaydı · özlük belgesi (kaldırılmış dahil —
-- özlük dosyası) · ekipman ataması · bordro · imzalı zimmet formu · plan ekibi · rapor · gider · izin talebi · imza belgesi · GİRİŞ YAPILMIŞ hesap (ya
-- da firmanın ilk hesabı). Birlikte silinen: hiç girilmemiş giriş hesabı (oturumları zincirle; parola özeti ize yazılmaz), kaldırılmış ve önceki İSG
-- kayıtları (belgeleri çöpe). E-posta serbest kalır. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION personel_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id, jsonb_strip_nulls(jsonb_build_object(
    'zimmet', NULLIF((SELECT count(*) FROM zimmet_hareket x WHERE x.firma_id = p.firma_id AND (x.eden_personel = p.id OR x.alan_personel = p.id)), 0),
    'km', NULLIF((SELECT count(*) FROM arac_km x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'isg', NULLIF((SELECT count(*) FROM isg_katip x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id AND NOT x.onceki AND x.kaldirildi IS NULL), 0),
    'egitim', NULLIF((SELECT count(*) FROM egitim_kaydi x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'ozluk', NULLIF((SELECT count(*) FROM ozluk_belgesi x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'atama', NULLIF((SELECT count(*) FROM ekipman_atamasi x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'bordro', NULLIF((SELECT count(*) FROM bordro x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'zimmet_formu', NULLIF((SELECT count(*) FROM zimmet_formu x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'plan', NULLIF((SELECT count(*) FROM plan_ekip x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'rapor', NULLIF((SELECT count(*) FROM rapor x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'gider', NULLIF((SELECT count(*) FROM gider x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'izin', NULLIF((SELECT count(*) FROM izin_talebi x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'belge', NULLIF((SELECT count(*) FROM belge_onay x WHERE x.firma_id = p.firma_id AND x.personel_id = p.id), 0),
    'hesap', NULLIF((SELECT count(*) FROM hesap h WHERE h.firma_id = p.firma_id AND h.personel_id = p.id AND (
      EXISTS (SELECT 1 FROM denetim_izi d WHERE d.firma_id = h.firma_id AND d.nesne = 'hesap' AND d.nesne_id = h.id::text AND d.ne = 'giris.yapildi')
      OR EXISTS (SELECT 1 FROM firma fi WHERE fi.ilk_hesap = h.id))), 0)))
  FROM personel p
  WHERE p.firma_id = gecerli_firma() AND p.id = ANY (p_idler)
$$;
ALTER FUNCTION personel_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION personel_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION personel_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION personel_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  p personel%ROWTYPE;
  k jsonb; hes jsonb; isg jsonb; d jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO p FROM personel WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  -- kişi kendini silmez (oturumu kendi hesabına bağlı)
  IF EXISTS (SELECT 1 FROM hesap h WHERE h.firma_id = f AND h.id = ben AND h.personel_id = p_id) THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', jsonb_build_object('hesap', 1));
  END IF;
  PERFORM 1 FROM hesap WHERE firma_id = f AND personel_id = p_id FOR UPDATE;
  SELECT u.kullanim INTO k FROM personel_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' - 'parola_ozeti' ORDER BY x.olustu), '[]'::jsonb) INTO hes FROM hesap x WHERE x.firma_id = f AND x.personel_id = p_id;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.olustu), '[]'::jsonb) INTO isg FROM isg_katip x WHERE x.firma_id = f AND x.personel_id = p_id;
  BEGIN
    DELETE FROM hesap WHERE firma_id = f AND personel_id = p_id;
    DELETE FROM isg_katip WHERE firma_id = f AND personel_id = p_id;
    DELETE FROM personel WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  WITH cop AS (UPDATE dosya SET cop = now() WHERE firma_id = f AND modul = 'isg_katip' AND cop IS NULL
                 AND kayit_id IN (SELECT (e->>'id')::uuid FROM jsonb_array_elements(isg) e) RETURNING id)
    SELECT coalesce(jsonb_agg(id::text), '[]'::jsonb) INTO d FROM cop;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'personel.sil', 'personel', p_id::text, to_jsonb(p) - 'firma_id', jsonb_build_object('hesaplar', hes, 'isg', isg, 'cope_dosyalar', d));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', p.ad);
END $$;
ALTER FUNCTION personel_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION personel_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION personel_sil(uuid, text) TO probata_uygulama;
