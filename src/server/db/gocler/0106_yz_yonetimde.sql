-- ══ 0106 · YAPAY ZEKÂ AYARLARI YALNIZ YÖNETİMDE (2026-10-25; reisim: "Yapay zekâ ayarları Firma ayarlarından kalksın, yalnız Yönetim panelinden
--    yönetilsin; firmalar kendileri değiştiremesin" — maket onaylı, K1–K7; varsayılan kişi başı sınır 5 $) ══
-- 1. K5 VERİTABANI KİLİDİ: uygulama rolü (probata_uygulama) firma_ayar'daki 'yapay_zeka' bölümünü yazamaz / değiştiremez / silemez; firma_sir'deki
--    'yapay_zeka_anahtari'nı da (0099'daki e-posta anahtarı kilidinin aynısı — firma_sir_k3 iki ada genişler). Okuma serbest (fotoğraftan okuma, S.A.Y).
-- 2. firma_yonetim_yz: yönetim aç / kapa ve kişi başı aylık sınırı yazar (SECURITY DEFINER — kilit yalnız uygulama rolüne); firmanın denetim izine
--    "probata yönetim (ad)", ortak firmada yönetim izine; kendi projeli firmada iz merkezde sonra (yonetim_firmada_iz 'ayar.yz').
-- 3. firma_yonetim_ozet: yz'ye kayıtlı ayar (ham — başlangıç değerleri uygulamanın şemasından, ayar.ts ayarCoz) ve bu ayın kişi kişi kullanımı
--    (kişi, okuma, mesaj, maliyet) eklenir.
-- ⛔ Her göç IDEMPOTENT.

-- ── 1. kilit ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_ayar_yz_kilidi() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF current_user = 'probata_uygulama'
     AND ((TG_OP <> 'DELETE' AND NEW.bolum = 'yapay_zeka') OR (TG_OP <> 'INSERT' AND OLD.bolum = 'yapay_zeka')) THEN
    RAISE EXCEPTION 'Yapay zekâ ayarları probata yönetiminden değiştirilir.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS firma_ayar_yz_kilidi ON firma_ayar;
CREATE TRIGGER firma_ayar_yz_kilidi BEFORE INSERT OR UPDATE OR DELETE ON firma_ayar FOR EACH ROW EXECUTE FUNCTION firma_ayar_yz_kilidi();

CREATE OR REPLACE FUNCTION firma_sir_k3() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF current_user = 'probata_uygulama'
     AND ((TG_OP <> 'DELETE' AND NEW.ad IN ('eposta_anahtari', 'yapay_zeka_anahtari'))
       OR (TG_OP <> 'INSERT' AND OLD.ad IN ('eposta_anahtari', 'yapay_zeka_anahtari'))) THEN
    RAISE EXCEPTION 'Bu anahtar probata yönetiminden kurulur; firma ayarlarından değiştirilmez.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

-- ── 2. yönetim yazar ─────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_yz(p_firma uuid, p_acik boolean, p_sinir numeric) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_firma_kimi(p_firma);
  v_firmada boolean := EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma');
  v_deger jsonb;
BEGIN
  IF p_acik IS NULL OR (p_sinir IS NOT NULL AND (p_sinir < 0 OR p_sinir > 10000)) THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  v_deger := jsonb_build_object('acik', p_acik, 'model', 'haiku', 'sinir', p_sinir);
  PERFORM set_config('app.firma_id', p_firma::text, true);
  INSERT INTO firma_ayar (firma_id, bolum, deger) VALUES (p_firma, 'yapay_zeka', v_deger)
    ON CONFLICT (firma_id, bolum) DO UPDATE SET deger = firma_ayar.deger || EXCLUDED.deger, surum = firma_ayar.surum + 1;
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id, ayrinti)
    VALUES (p_firma, 'probata yönetim (' || v_kim || ')', 'ayar.yapay_zeka', 'firma_ayar', 'yapay_zeka', jsonb_build_object('acik', p_acik, 'sinir', p_sinir));
  PERFORM set_config('app.firma_id', '', true);
  IF NOT v_firmada THEN
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti) VALUES (v_kim, 'ayar.yz', p_firma, jsonb_build_object('acik', p_acik, 'sinir', p_sinir));
  END IF;
  RETURN jsonb_build_object('durum', 'tamam');
END $$;

CREATE OR REPLACE FUNCTION yonetim_firmada_iz(p_firma uuid, p_ne text, p_ayrinti jsonb) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_kim text := yonetim_kim();
BEGIN
  IF EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma') THEN RAISE EXCEPTION 'merkez değil' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM firma WHERE id = p_firma AND vt = 'kendi') THEN RAISE EXCEPTION 'kendi projeli firma değil' USING ERRCODE = '42501'; END IF;
  IF p_ne NOT IN ('hesap.gecici_parola', 'ayar.yz_anahtari', 'ayar.eposta_gonderim', 'ayar.yz') THEN RAISE EXCEPTION 'bilinmeyen iz' USING ERRCODE = '22023'; END IF;
  INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti) VALUES (v_kim, p_ne, p_firma, coalesce(p_ayrinti, '{}'::jsonb));
END $$;

-- ── 3. özet: açık / sınır ve kişi kişi kullanım ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_ozet(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_ay text := to_char(now() AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM');
  v_ilk uuid;
  s firma_sir%ROWTYPE;
  a jsonb;
BEGIN
  PERFORM yonetim_firma_kimi(p_firma);
  SELECT ilk_hesap INTO v_ilk FROM firma WHERE id = p_firma;
  SELECT * INTO s FROM firma_sir WHERE firma_id = p_firma AND ad = 'yapay_zeka_anahtari';
  SELECT deger INTO a FROM firma_ayar WHERE firma_id = p_firma AND bolum = 'yapay_zeka';
  RETURN jsonb_build_object(
    'durum', (SELECT durum FROM firma WHERE id = p_firma),
    'kullanici', (SELECT count(*)::int FROM hesap WHERE firma_id = p_firma AND durum <> 'pasif'),
    'yonetici', (SELECT jsonb_build_object('ad', h.ad, 'eposta', h.eposta, 'durum', h.durum) FROM hesap h
                 WHERE h.firma_id = p_firma AND h.durum <> 'pasif' AND 'firma_yoneticisi' = ANY (h.roller)
                 ORDER BY (h.id = v_ilk) DESC NULLS LAST, h.olustu LIMIT 1),
    'yz', jsonb_build_object(
      'ayar', coalesce(a, '{}'::jsonb),
      'tanimli', s.sifreli IS NOT NULL,
      'son4', CASE WHEN s.sifreli IS NOT NULL THEN s.son4 END,
      'ay', v_ay,
      'okuma', (SELECT coalesce(sum(okuma), 0)::int FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay),
      'mesaj', (SELECT coalesce(sum(mesaj), 0)::int FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay),
      'maliyet', (SELECT coalesce(sum(maliyet), 0)::bigint FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay),
      'kisiler', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'ad', h.ad, 'okuma', k.okuma, 'mesaj', k.mesaj, 'maliyet', k.maliyet)
                    ORDER BY k.maliyet DESC, h.ad), '[]'::jsonb)
                  FROM yz_kullanim k JOIN hesap h ON h.id = k.hesap_id
                  WHERE k.firma_id = p_firma AND k.ay = v_ay AND (k.okuma > 0 OR k.mesaj > 0 OR k.maliyet > 0))));
END $$;

-- ── haklar ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION firma_ayar_yz_kilidi(), firma_yonetim_yz(uuid, boolean, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_yonetim_yz(uuid, boolean, numeric) TO probata_yonetim;
