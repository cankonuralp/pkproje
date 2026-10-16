-- 0098 — KURULUM: FİRMA VERİTABANINDA FİRMA + İLK YÖNETİCİ; BAŞTAN ALMA (FIRMA-VT §5.12; FV10 — 2026-10-16). Bütün veritabanlarında aynı göç.
--   · firma_kur (0097'de yalnız vt_kimlik + firma satırıydı) — kurulumun "firma" adımı, YALNIZ sahip (Yönetim API'siyle): vt_kimlik 'firma' + firma
--     satırı + ilk firma yöneticisi (personel + hesap, rol firma_yoneticisi, durum 'ilk', parola özeti RASTGELE — bilinmeyen parolanın özeti: kimse
--     giremez; ilk parola "Yöneticiye geçici parola" ile, FV9 firma_yonetim_gecici_parola) + firma.ilk_hesap + firmanın denetim izi. İdempotent:
--     yeniden çağrı aynı firmada hiçbir şeyi bozmaz (kurulum adımı kesilip sürdürülebilir); başka firması olan veritabanında (merkez) red.
--   · firma_kurulum_bastan (MERKEZ, yönetim rolü): hiç etkin olmamış kurulumu "proje" adımına döndürür (Supabase projesi açılamadıysa — INIT_FAILED;
--     "Projeyi kaldır ve yeniden dene"): yalnız kirayı tutan, yalnız proje / hazır adımında, bağlantı kaydı boşalır (sürüm artar), iz yazılır.
-- Kilit tests/firma-kurulum.test.ts.

DROP FUNCTION IF EXISTS firma_kur(uuid, text, text, text);

CREATE OR REPLACE FUNCTION firma_kur(p_firma uuid, p_kisa_ad text, p_ad text, p_rapor_kodu text, p_yon_ad text, p_yon_eposta text,
  p_parola_ozeti text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_personel uuid;
  v_hesap uuid;
BEGIN
  IF p_firma IS NULL OR p_kisa_ad IS NULL OR p_kisa_ad !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' OR p_rapor_kodu IS NULL OR p_rapor_kodu !~ '^[A-Z]{2}$'
     OR p_ad IS NULL OR length(btrim(p_ad)) NOT BETWEEN 1 AND 160 OR p_yon_ad IS NULL OR length(p_yon_ad) NOT BETWEEN 3 AND 80
     OR p_yon_eposta IS NULL OR p_yon_eposta <> lower(p_yon_eposta) OR position('@' in p_yon_eposta) < 2 OR length(p_yon_eposta) > 254
     OR p_parola_ozeti IS NULL OR p_parola_ozeti NOT LIKE 'scrypt$%' THEN
    RAISE EXCEPTION 'kurulum girdisi geçersiz' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM firma WHERE id <> p_firma) THEN
    RAISE EXCEPTION 'veritabanında başka firma var — firma veritabanı değil' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma' AND firma_id <> p_firma) THEN
    RAISE EXCEPTION 'veritabanı başka firmaya bağlı' USING ERRCODE = '42501';
  END IF;
  UPDATE vt_kimlik SET tur = 'firma', firma_id = p_firma WHERE tur = 'ortak';
  PERFORM set_config('app.firma_id', p_firma::text, true);
  INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES (p_firma, p_kisa_ad, btrim(p_ad), p_rapor_kodu, 'kendi') ON CONFLICT (id) DO NOTHING;
  IF (SELECT ilk_hesap FROM firma WHERE id = p_firma) IS NULL THEN
    SELECT id INTO v_hesap FROM hesap WHERE firma_id = p_firma AND eposta = p_yon_eposta;
    IF v_hesap IS NULL THEN
      INSERT INTO personel (firma_id, ad, eposta, basla, meslek, meslek_metin)
        VALUES (p_firma, p_yon_ad, p_yon_eposta, (now() AT TIME ZONE 'Europe/Istanbul')::date, 'diger', 'Firma yöneticisi') RETURNING personel.id INTO v_personel;
      INSERT INTO hesap (firma_id, eposta, ad, parola_ozeti, roller, durum, personel_id)
        VALUES (p_firma, p_yon_eposta, p_yon_ad, p_parola_ozeti, ARRAY['firma_yoneticisi'], 'ilk', v_personel) RETURNING hesap.id INTO v_hesap;
      INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id, ayrinti)
        VALUES (p_firma, 'probata yönetim (kurulum)', 'firma.acildi', 'firma', p_firma::text, jsonb_build_object('kisa_ad', p_kisa_ad, 'yonetici', p_yon_eposta));
    END IF;
    UPDATE firma SET ilk_hesap = v_hesap WHERE id = p_firma;
  END IF;
  PERFORM set_config('app.firma_id', '', true);
  RETURN jsonb_build_object('firma', p_firma, 'ilk_hesap', (SELECT ilk_hesap FROM firma WHERE id = p_firma));
END $$;

-- ── merkez: kurulumu baştan al (proje açılamadı) ─────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_kurulum_bastan(p_firma uuid, p_kira uuid) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_kim();
  k firma_kurulum%ROWTYPE;
BEGIN
  PERFORM vt_merkez_dogrula();
  SELECT * INTO k FROM firma_kurulum WHERE firma_id = p_firma FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF p_kira IS NULL OR k.kira IS DISTINCT FROM p_kira OR k.kira_bitis < now() THEN RETURN jsonb_build_object('hata', 'kira'); END IF;
  IF k.adim NOT IN ('proje', 'hazir') OR NOT EXISTS (SELECT 1 FROM firma WHERE id = p_firma AND durum = 'kurulum') THEN
    RETURN jsonb_build_object('hata', 'adim');
  END IF;
  UPDATE firma_vt SET ref = NULL, surum = surum + 1, degisti = now() WHERE firma_id = p_firma;
  -- eski projenin sahip parolası düşer; kurulumda girilen yapay zekâ anahtarı kalır (yeni projede "yz" adımı yazar)
  UPDATE firma_kurulum SET adim = 'proje', durum = 'bekliyor', deneme = 0, hata = NULL, hata_kodu = NULL,
    girdi = NULLIF(coalesce(girdi, '{}'::jsonb) - 'kurulum_sahip', '{}'::jsonb), degisti = now()
    WHERE firma_id = p_firma;
  INSERT INTO yonetim_izi (kim, ne, hedef_firma) VALUES (v_kim, 'firma.kurulum_bastan', p_firma);
  RETURN jsonb_build_object('adim', 'proje', 'durum', 'bekliyor');
END $$;

REVOKE ALL ON FUNCTION firma_kur(uuid, text, text, text, text, text, text), firma_kurulum_bastan(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_kurulum_bastan(uuid, uuid) TO probata_yonetim;
