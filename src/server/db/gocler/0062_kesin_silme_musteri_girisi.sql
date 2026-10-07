-- ══ 0062 · KESİN SİLME — müşteri girişi (367; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü tur;
-- 0054 deseni) ══
-- Yalnız EK giriş ve yalnız müşteri bu girişle panele HİÇ girmediyse (son_giris boş) kesin silinir — yanlış adres, deneme. Ana giriş müşterinin
-- e-postasına bağlıdır (silinmez; pasife alınır ya da e-posta değişir). Girilmiş giriş pasife alınır. Birlikte silinen: oturumları (hiç girilmediği
-- için yok; zincir). Parola özeti ize yazılmaz. Kullanıcı adı serbest kalır. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION musteri_hesap_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT h.id, jsonb_strip_nulls(jsonb_build_object(
    'ana', CASE WHEN h.ana THEN 1 END,
    'panel', CASE WHEN h.son_giris IS NOT NULL THEN 1 END))
  FROM musteri_hesap h
  WHERE h.firma_id = gecerli_firma() AND h.id = ANY (p_idler)
$$;
ALTER FUNCTION musteri_hesap_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_hesap_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION musteri_hesap_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION musteri_hesap_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  h musteri_hesap%ROWTYPE;
  k jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  -- müşteri önce kilitlenir (giriş işlemleriyle aynı sıra: müşteri → giriş)
  PERFORM 1 FROM musteri m WHERE m.firma_id = f AND m.id = (SELECT x.musteri_id FROM musteri_hesap x WHERE x.firma_id = f AND x.id = p_id) FOR UPDATE;
  SELECT * INTO h FROM musteri_hesap WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM musteri_hesap_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  BEGIN
    DELETE FROM musteri_hesap WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'musteri_giris.sil', 'musteri_hesap', p_id::text, to_jsonb(h) - 'firma_id' - 'parola_ozeti', '{}'::jsonb);
  RETURN jsonb_build_object('durum', 'tamam', 'ad', h.ad);
END $$;
ALTER FUNCTION musteri_hesap_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_hesap_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION musteri_hesap_sil(uuid, text) TO probata_uygulama;
