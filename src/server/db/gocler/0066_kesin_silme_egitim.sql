-- ══ 0066 · KESİN SİLME — eğitim türü ve eğitim kaydı (371; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli
-- üçüncü tur; 0054 deseni) ══
-- EĞİTİM TÜRÜ: hiç eğitim kaydı olmayan tür silinir. EĞİTİM KAYDI: sertifikası yüklü değilse ve katılım formu hiç imzaya gönderilmediyse silinir
-- (yanlış kişi / tarih). Silinen kayıt güncelse aynı kişi × eğitimin en son ÖNCEKİ kaydı yeniden güncel olur (tekrar tarihi ondan okunur). Kaldırılmış
-- sertifika dosyaları çöpe. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION egitim_turu_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t.id, jsonb_strip_nulls(jsonb_build_object(
    'egitim', NULLIF((SELECT count(*) FROM egitim_kaydi x WHERE x.firma_id = t.firma_id AND x.tur_id = t.id), 0)))
  FROM egitim_turu t
  WHERE t.firma_id = gecerli_firma() AND t.id = ANY (p_idler)
$$;
ALTER FUNCTION egitim_turu_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION egitim_turu_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION egitim_turu_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION egitim_turu_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  t egitim_turu%ROWTYPE;
  k jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO t FROM egitim_turu WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM egitim_turu_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  BEGIN
    DELETE FROM egitim_turu WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'egitim_turu.sil', 'egitim_turu', p_id::text, to_jsonb(t) - 'firma_id', '{}'::jsonb);
  RETURN jsonb_build_object('durum', 'tamam', 'ad', t.ad);
END $$;
ALTER FUNCTION egitim_turu_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION egitim_turu_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION egitim_turu_sil(uuid, text) TO probata_uygulama;

CREATE OR REPLACE FUNCTION egitim_kaydi_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT e.id, jsonb_strip_nulls(jsonb_build_object(
    'sertifika', CASE WHEN e.dosya_id IS NOT NULL THEN 1 END,
    'belge', NULLIF((SELECT count(*) FROM belge_onay b WHERE b.firma_id = e.firma_id AND b.tur = 'egitim' AND b.kaynak_id = e.id), 0)))
  FROM egitim_kaydi e
  WHERE e.firma_id = gecerli_firma() AND e.id = ANY (p_idler)
$$;
ALTER FUNCTION egitim_kaydi_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION egitim_kaydi_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION egitim_kaydi_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION egitim_kaydi_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  e egitim_kaydi%ROWTYPE;
  k jsonb; d jsonb; geri uuid;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  -- aynı kişi × eğitimin kayıtları birlikte kilitlenir (yeni kayıt / tekrar ile aynı anda koşmasın)
  PERFORM 1 FROM egitim_kaydi x WHERE x.firma_id = f AND (x.personel_id, x.tur_id) = (SELECT y.personel_id, y.tur_id FROM egitim_kaydi y WHERE y.firma_id = f AND y.id = p_id)
    ORDER BY x.id FOR UPDATE;
  SELECT * INTO e FROM egitim_kaydi WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM egitim_kaydi_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  BEGIN
    DELETE FROM egitim_kaydi WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  IF NOT e.onceki THEN
    SELECT x.id INTO geri FROM egitim_kaydi x WHERE x.firma_id = f AND x.personel_id = e.personel_id AND x.tur_id = e.tur_id AND x.onceki
      ORDER BY x.tarih DESC, x.olustu DESC LIMIT 1;
    IF geri IS NOT NULL THEN
      UPDATE egitim_kaydi SET onceki = false, surum = surum + 1, degisti = now() WHERE firma_id = f AND id = geri;
    END IF;
  END IF;
  WITH cop AS (UPDATE dosya SET cop = now() WHERE firma_id = f AND modul = 'egitim' AND kayit_id = p_id AND cop IS NULL RETURNING id)
    SELECT coalesce(jsonb_agg(id::text), '[]'::jsonb) INTO d FROM cop;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'egitim_kaydi.sil', 'egitim_kaydi', p_id::text, to_jsonb(e) - 'firma_id', jsonb_build_object('guncel_olan', geri, 'cope_dosyalar', d));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', 'Eğitim kaydı');
END $$;
ALTER FUNCTION egitim_kaydi_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION egitim_kaydi_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION egitim_kaydi_sil(uuid, text) TO probata_uygulama;
