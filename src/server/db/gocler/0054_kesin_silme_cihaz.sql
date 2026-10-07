-- ══ 0054 · KESİN SİLME — ortak desen + ölçüm cihazı (357; reisim 2026-10-07: "ekipman, cihaz, ekipman türü vb eklenebilen şeylerin silinemediğini
-- tespit ettim; denemek için bir kaç cihaz ekledim ama silemedim, bunu da düzeltmeliyiz") ══
-- İLKE (pkproje §9 kırk birinci tur, KOD-GECIS §3): hiç KULLANILMAMIŞ kayıt kesin silinir (deneme / yanlış giriş); kullanılmış kayıt pasife alınır ya da
-- (yasal kayıt) silinmez. "Kullanılmış" tanımı TEK yerde, veritabanında: <tablo>_kullanim(uuid[]) → kayıt başına yalnız sıfır olmayan sayımlar (ekran
-- "Sil" tuşunu ve silme işlevi aynı yerden okur). Kesin silme <tablo>_sil(uuid, text): tanımlayıcı-yetkili (0047 ice_aktarim_geri_al deseni) —
-- uygulama rolüne DELETE hakkı VERİLMEZ; yalnız oturumdaki firmada ve hesapla (yoksa 42501); satır kilitlenir; kullanılmışsa {durum:"kullanildi",
-- kullanim}; kayıtla birlikte gidenler aynı işlemde; kaydın dosyaları çöpe (09-A5; kalıcı silinmez); denetim izine ESKİ değerle (hesap ve zaman 0003
-- tetiğinden). Yabancı anahtar ihlali emniyet ağı: "kullanildi". Yetki (yalnız yöneticiler — reisim pkproje §9 / 1490) sunucuda: canDo kayit_sil.
-- ÖLÇÜM CİHAZI: kullanım = zimmet hareketi (FK) · raporun cihaz listesi (rapor.cihazlar JSON; silinmiş taslak dahil — 0047 ile aynı) · zimmet formu
-- kapsamı ('c:<id>'). Birlikte silinen: kalibrasyon kayıtları (kaldırılmışlar dahil; yalnız o cihaza ait, cihaz hiçbir raporda geçmedi), sertifika
-- dosyaları çöpe. Kilit: tests/kesin-silme.test.ts, tests/silme-kapsami.test.ts (her yabancı anahtar "kullanım" ya da "birlikte"). ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION olcum_cihazi_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT c.id, jsonb_strip_nulls(jsonb_build_object(
    'zimmet', NULLIF((SELECT count(*) FROM zimmet_hareket z WHERE z.firma_id = c.firma_id AND z.cihaz_id = c.id), 0),
    'rapor', NULLIF((SELECT count(*) FROM rapor r WHERE r.firma_id = c.firma_id AND position(c.id::text IN r.cihazlar::text) > 0), 0),
    'zimmet_formu', NULLIF((SELECT count(*) FROM zimmet_formu zf WHERE zf.firma_id = c.firma_id AND ('c:' || c.id::text) = ANY (zf.kapsam)), 0)))
  FROM olcum_cihazi c
  WHERE c.firma_id = gecerli_firma() AND c.id = ANY (p_idler)
$$;
ALTER FUNCTION olcum_cihazi_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION olcum_cihazi_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION olcum_cihazi_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION olcum_cihazi_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  c olcum_cihazi%ROWTYPE;
  k jsonb; kal jsonb; d jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO c FROM olcum_cihazi WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM olcum_cihazi_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) - 'firma_id' ORDER BY x.tarih, x.olustu), '[]'::jsonb) INTO kal FROM kalibrasyon x WHERE x.firma_id = f AND x.cihaz_id = p_id;
  BEGIN
    DELETE FROM kalibrasyon WHERE firma_id = f AND cihaz_id = p_id;
    DELETE FROM olcum_cihazi WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  WITH cop AS (UPDATE dosya SET cop = now() WHERE firma_id = f AND modul = 'olcum_cihazi' AND kayit_id = p_id AND cop IS NULL RETURNING id)
    SELECT coalesce(jsonb_agg(id::text), '[]'::jsonb) INTO d FROM cop;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'cihaz.sil', 'olcum_cihazi', p_id::text, to_jsonb(c) - 'firma_id', jsonb_build_object('kalibrasyonlar', kal, 'cope_dosyalar', d));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', c.kod);
END $$;
ALTER FUNCTION olcum_cihazi_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION olcum_cihazi_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION olcum_cihazi_sil(uuid, text) TO probata_uygulama;
