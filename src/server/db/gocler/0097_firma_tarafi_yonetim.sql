-- 0097 — FİRMA TARAFI YÖNETİM (FIRMA-VT §5.10, §5.11; FV9 — 2026-10-16). Bütün veritabanlarında aynı göç (merkez + her firma veritabanı); işlevler
-- veritabanının türüne göre davranır (vt_kimlik):
--   · yonetim_kim_firmada(): FİRMA veritabanında yönetim kimliği — yönetici tablosu merkezde; yöneticinin e-postası işlemin bağlamından
--     (app.yonetici_eposta — kiraci.ts yonetimFirmadaIcinde koyar, değer merkezdeki yönetim oturumundan). Güven düzeyi bugünkünün aynısı (§5.11, §8 açık
--     soru 9): EXECUTE yalnız yönetim rolünde (uygulama rolü SET ROLE ile geçer — 0050'den beri böyle); merkezde ÇALIŞMAZ (42501).
--   · firma_kur(): kurulumda (FV10) yeni projenin veritabanını firmaya bağlar — vt_kimlik 'firma' + firma satırı. YALNIZ sahip (EXECUTE kimseye
--     verilmez); başka firması olan veritabanında (merkez) reddedilir.
--   · firma_yonetim_durum(): firma veritabanında durum kopyası + dondurulunca oturumlar silinir + firmanın denetim izi; merkezdeki yonetim_firma_durum
--     (0096) yalnız durum + iz yazar. Sıra kapalı yönde: dondurmada önce firma tarafı, etkinleştirmede önce merkez (uygulama sırayı tutar); aynı
--     duruma ikinci çağrı hata değil (yeniden denenebilir).
--   · firma_yonetim_gecici_parola(): firma veritabanında yöneticinin parolası (0096'da kendi projeli firmada merkez hiçbir şey yazmıyordu); merkezin izi
--     ANCAK bu başarılı olunca (yonetim_firmada_iz).
--   · firma_yonetim_sir() (K4): yapay zekâ anahtarı yönetimden yazılır / kaldırılır — iki veritabanı türünde: merkezde ortak firma (yonetim_kim),
--     firma veritabanında yalnız kendi firması (yonetim_kim_firmada). Şifreleme uygulamada (sir.ts sifrele — firma + ad ek verisi); değer asla ize
--     düşmez, yalnız son 4. Firmanın denetim izine "probata yönetim (<e-posta>)"; merkezde ortak firmada yonetim_izi burada, kendi projelide
--     yonetim_firmada_iz ile.
--   · firma_yonetim_ozet(): yönetim panelinin firma özeti (durum, kullanıcı sayısı, yönetici, yapay zekâ anahtarı tanımlı mı + son 4, bu ayın kullanımı)
--     — iki veritabanı türünde, aynı kimlik kuralıyla.
--   · yonetim_firmada_iz(): MERKEZDE kendi projeli firmanın yönetim izi (firma tarafı başarıdan sonra) — yalnız bilinen işler.
-- Kilit tests/yonetim-firmada.test.ts (merkez + iki kendi projeli firma; merkezde reddedilir, uygulama rolü doğrudan çağıramaz, iz iki tarafta).

-- ── yönetim kimliği: firma veritabanında ──────────────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION yonetim_kim_firmada() RETURNS text
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v text := lower(NULLIF(current_setting('app.yonetici_eposta', true), ''));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma') THEN
    RAISE EXCEPTION 'firma veritabanı değil' USING ERRCODE = '42501';
  END IF;
  IF v IS NULL OR length(v) > 254 OR v !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'yönetim işlemi değil' USING ERRCODE = '42501';
  END IF;
  RETURN v;
END $$;

-- veritabanı bu firmanın mı (firma veritabanında); değilse 42501
CREATE OR REPLACE FUNCTION firma_vt_mi(p_firma uuid) RETURNS void
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF p_firma IS NULL OR NOT EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma' AND firma_id = p_firma) THEN
    RAISE EXCEPTION 'bu veritabanı o firmanın değil' USING ERRCODE = '42501';
  END IF;
END $$;

-- ── kurulum: veritabanını firmaya bağla (yalnız sahip) ────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_kur(p_firma uuid, p_kisa_ad text, p_ad text, p_rapor_kodu text) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF p_firma IS NULL THEN RAISE EXCEPTION 'firma kimliği yok' USING ERRCODE = '22004'; END IF;
  IF EXISTS (SELECT 1 FROM firma WHERE id <> p_firma) THEN
    RAISE EXCEPTION 'veritabanında başka firma var — firma veritabanı değil' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma' AND firma_id <> p_firma) THEN
    RAISE EXCEPTION 'veritabanı başka firmaya bağlı' USING ERRCODE = '42501';
  END IF;
  UPDATE vt_kimlik SET tur = 'firma', firma_id = p_firma WHERE tur = 'ortak';
  INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES (p_firma, p_kisa_ad, p_ad, p_rapor_kodu, 'kendi') ON CONFLICT (id) DO NOTHING;
END $$;

-- ── dondur / etkinleştir: firma tarafı ────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_durum(p_firma uuid, p_durum text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_kim_firmada();
  v_eski text;
BEGIN
  PERFORM firma_vt_mi(p_firma);
  IF p_durum NOT IN ('etkin', 'dondu') THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  SELECT durum INTO v_eski FROM firma WHERE id = p_firma FOR NO KEY UPDATE;
  IF v_eski IS NULL THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  -- aynı durum: hata değil (sıra kapalı yönde; merkez adımı düştüyse yeniden denenir)
  IF v_eski = p_durum THEN RETURN jsonb_build_object('durum', p_durum, 'ayni', true); END IF;
  UPDATE firma SET durum = p_durum WHERE id = p_firma;
  IF p_durum = 'dondu' THEN
    DELETE FROM oturum WHERE firma_id = p_firma;
    DELETE FROM musteri_oturum WHERE firma_id = p_firma;
  END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id)
    VALUES (p_firma, 'probata yönetim (' || v_kim || ')', CASE p_durum WHEN 'dondu' THEN 'firma.donduruldu' ELSE 'firma.etkinlestirildi' END,
      'firma', p_firma::text);
  PERFORM set_config('app.firma_id', '', true);
  RETURN jsonb_build_object('durum', p_durum);
END $$;

-- ── yöneticiye yeni geçici parola: firma tarafı ───────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_gecici_parola(p_firma uuid, p_parola_ozeti text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_kim_firmada();
  v_durum text;
  v_ilk uuid;
  v_hesap uuid;
  v_eposta text;
  v_ad text;
BEGIN
  PERFORM firma_vt_mi(p_firma);
  IF p_parola_ozeti IS NULL OR p_parola_ozeti NOT LIKE 'scrypt$%' THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  SELECT durum, ilk_hesap INTO v_durum, v_ilk FROM firma WHERE id = p_firma FOR NO KEY UPDATE;
  IF v_durum IS NULL THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF v_durum <> 'etkin' THEN RETURN jsonb_build_object('hata', 'dondu'); END IF;
  SELECT h.id, h.eposta, h.ad INTO v_hesap, v_eposta, v_ad FROM hesap h
    WHERE h.firma_id = p_firma AND h.durum <> 'pasif' AND 'firma_yoneticisi' = ANY (h.roller)
    ORDER BY (h.id = v_ilk) DESC NULLS LAST, h.olustu LIMIT 1 FOR UPDATE;
  IF v_hesap IS NULL THEN RETURN jsonb_build_object('hata', 'hesap_yok'); END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  -- açık oturumları hesap_oturum_dusur tetiği düşürür (0002)
  UPDATE hesap SET parola_ozeti = p_parola_ozeti, durum = 'ilk', hatali_deneme = 0, kilit_bitis = NULL WHERE id = v_hesap;
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id)
    VALUES (p_firma, 'probata yönetim (' || v_kim || ')', 'hesap.gecici_parola', 'hesap', v_hesap::text);
  PERFORM set_config('app.firma_id', '', true);
  RETURN jsonb_build_object('eposta', v_eposta, 'ad', v_ad);
END $$;

-- ── yönetimin kimliği ve hedef firma, iki veritabanı türünde (sır ve özet için) ──────────────────────────────────────────────────────────
-- merkezde: yonetim_kim() + firma ORTAK olmalı (kendi projelinin verisi merkezde değil); firma veritabanında: yonetim_kim_firmada() + kendi firması
CREATE OR REPLACE FUNCTION yonetim_firma_kimi(p_firma uuid) RETURNS text
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma') THEN
    PERFORM firma_vt_mi(p_firma);
    RETURN yonetim_kim_firmada();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM firma WHERE id = p_firma AND vt = 'ortak') THEN
    RAISE EXCEPTION 'firma bu veritabanında değil' USING ERRCODE = '42501';
  END IF;
  RETURN yonetim_kim();
END $$;

-- ── K4: yapay zekâ anahtarı yönetimden (yaz / kaldır) ─────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_sir(p_firma uuid, p_ad text, p_sifreli text, p_son4 text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_firma_kimi(p_firma);
  v_firmada boolean := EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma');
  v_son4 text := CASE WHEN p_sifreli IS NULL THEN NULL ELSE p_son4 END;
BEGIN
  IF p_ad IS DISTINCT FROM 'yapay_zeka_anahtari' THEN RETURN jsonb_build_object('hata', 'ad'); END IF;
  IF p_sifreli IS NOT NULL AND (p_sifreli !~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$' OR v_son4 IS NULL OR length(v_son4) <> 4) THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  INSERT INTO firma_sir (firma_id, ad, sifreli, son4) VALUES (p_firma, p_ad, p_sifreli, v_son4)
    ON CONFLICT (firma_id, ad) DO UPDATE SET sifreli = EXCLUDED.sifreli, son4 = EXCLUDED.son4, surum = firma_sir.surum + 1, degisti = now();
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id, ayrinti)
    VALUES (p_firma, 'probata yönetim (' || v_kim || ')', CASE WHEN p_sifreli IS NULL THEN 'ayar.sir_kaldirildi' ELSE 'ayar.sir_degisti' END,
      'firma_sir', p_ad, jsonb_build_object('son4', v_son4));
  PERFORM set_config('app.firma_id', '', true);
  IF NOT v_firmada THEN
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
      VALUES (v_kim, 'ayar.yz_anahtari', p_firma, jsonb_build_object('son4', v_son4, 'kaldirildi', p_sifreli IS NULL));
  END IF;
  RETURN jsonb_build_object('durum', 'tamam', 'son4', v_son4);
END $$;

-- ── yönetim panelinin firma özeti ──────────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_ozet(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_ay text := to_char(now() AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM');
  v_ilk uuid;
  s firma_sir%ROWTYPE;
BEGIN
  PERFORM yonetim_firma_kimi(p_firma);
  SELECT ilk_hesap INTO v_ilk FROM firma WHERE id = p_firma;
  SELECT * INTO s FROM firma_sir WHERE firma_id = p_firma AND ad = 'yapay_zeka_anahtari';
  RETURN jsonb_build_object(
    'durum', (SELECT durum FROM firma WHERE id = p_firma),
    'kullanici', (SELECT count(*)::int FROM hesap WHERE firma_id = p_firma AND durum <> 'pasif'),
    'yonetici', (SELECT jsonb_build_object('ad', h.ad, 'eposta', h.eposta, 'durum', h.durum) FROM hesap h
                 WHERE h.firma_id = p_firma AND h.durum <> 'pasif' AND 'firma_yoneticisi' = ANY (h.roller)
                 ORDER BY (h.id = v_ilk) DESC NULLS LAST, h.olustu LIMIT 1),
    'yz', jsonb_build_object(
      'tanimli', s.sifreli IS NOT NULL,
      'son4', CASE WHEN s.sifreli IS NOT NULL THEN s.son4 END,
      'ay', v_ay,
      'okuma', (SELECT coalesce(sum(okuma), 0)::int FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay),
      'mesaj', (SELECT coalesce(sum(mesaj), 0)::int FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay),
      'maliyet', (SELECT coalesce(sum(maliyet), 0)::bigint FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay)));
END $$;

-- ── merkezde: kendi projeli firmanın yönetim izi (firma tarafı başarıdan sonra) ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION yonetim_firmada_iz(p_firma uuid, p_ne text, p_ayrinti jsonb) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_kim text := yonetim_kim();
BEGIN
  IF EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma') THEN RAISE EXCEPTION 'merkez değil' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM firma WHERE id = p_firma AND vt = 'kendi') THEN RAISE EXCEPTION 'kendi projeli firma değil' USING ERRCODE = '42501'; END IF;
  IF p_ne NOT IN ('hesap.gecici_parola', 'ayar.yz_anahtari') THEN RAISE EXCEPTION 'bilinmeyen iz' USING ERRCODE = '22023'; END IF;
  INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti) VALUES (v_kim, p_ne, p_firma, coalesce(p_ayrinti, '{}'::jsonb));
END $$;

-- ── haklar: yönetim rolü; firma_kur yalnız sahip; denetim yardımcıları dışarı kapalı ───────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION yonetim_kim_firmada(), firma_vt_mi(uuid), firma_kur(uuid, text, text, text), firma_yonetim_durum(uuid, text),
  firma_yonetim_gecici_parola(uuid, text), yonetim_firma_kimi(uuid), firma_yonetim_sir(uuid, text, text, text), firma_yonetim_ozet(uuid),
  yonetim_firmada_iz(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_yonetim_durum(uuid, text), firma_yonetim_gecici_parola(uuid, text), firma_yonetim_sir(uuid, text, text, text),
  firma_yonetim_ozet(uuid), yonetim_firmada_iz(uuid, text, jsonb) TO probata_yonetim;
