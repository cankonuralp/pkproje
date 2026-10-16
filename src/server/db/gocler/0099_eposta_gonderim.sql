-- 0099 — E-POSTA GÖNDERİMİ PANELDEN (FIRMA-VT §5.8; FV11 — 2026-10-16; K2 + K3). Bütün veritabanlarında aynı göç.
--   Reisim (579): "resend için tek seçenek var ve o da firmaların kendi mail adresleri ile mail atılması … resend ve supabase ayarları firma ayarları
--   kısmından değiştirilemesin". probata'nın TEK Resend hesabı; firmanın alan adı Yönetim'den eklenir ve doğrulanır, gönderme anahtarı o alan adına bağlı.
--   · eposta_alan (MERKEZ kaydı; tablo her veritabanında, satır yalnız merkezde): firmanın gönderen alan adı, genel adresin yerel kısmı, Resend'deki
--     kimliği, DNS kayıtları, durum, gönderme anahtarının KİMLİĞİ (anahtarın kendisi değil — o firma tarafında şifreli sır). Yalnız yönetim rolü
--     okur; yazma yalnız yonetim_eposta_alan_yaz ile (yönetim izi). Bir alan adı tek firmanın.
--   · firma_gonderim (FİRMA tarafı, kilitli kopya): alan, genel adres (<yerel>@<alan>), doğrulandı mı. Uygulama yalnız OKUR (kendi firması); yazma yalnız
--     firma_yonetim_gonderim ile (yönetim — merkezde ortak firma, firma veritabanında yalnız kendi firması; firmanın denetim izi + merkezde yönetim izi).
--   · firma_yonetim_sir artık 'eposta_anahtari'nı da yazar (anahtarı yönetim koyar).
--   · K3 VERİTABANI KİLİDİ: uygulama rolü 'eposta_anahtari' sırrını yazamaz / değiştiremez / silemez (Firma ayarlarından değiştirilmez).
--   · yonetim_firmada_iz (0097) 'ayar.eposta_gonderim' olayını da yazar (kendi projeli firmada merkezin izi).
-- Kilit tests/eposta-gonderim.test.ts.

-- ── merkez: firmanın gönderen alan adı ────────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eposta_alan (
  firma_id     uuid PRIMARY KEY REFERENCES firma(id),
  alan         text NOT NULL CHECK (length(alan) BETWEEN 3 AND 100
                                    AND alan ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'),
  genel_yerel  text NOT NULL CHECK (genel_yerel ~ '^[a-z0-9]([a-z0-9._-]{0,62}[a-z0-9])?$'),
  resend_id    text NOT NULL CHECK (resend_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  -- bekliyor (DNS kayıtları girilmedi / Resend henüz doğrulamadı) · dogrulandi (gönderme anahtarı firma tarafında) · hata (Resend doğrulayamadı)
  durum        text NOT NULL CHECK (durum IN ('bekliyor', 'dogrulandi', 'hata')),
  -- Resend'in verdiği DNS kayıtları (ekranda gösterilir): [{tur, ad, deger, oncelik, durum, kayit}]
  kayitlar     jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(kayitlar) = 'array' AND jsonb_array_length(kayitlar) <= 20),
  anahtar_id   text CHECK (anahtar_id IS NULL OR anahtar_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT eposta_alan_anahtar CHECK (durum <> 'dogrulandi' OR anahtar_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS eposta_alan_alan ON eposta_alan (alan);
ALTER TABLE eposta_alan ENABLE ROW LEVEL SECURITY;
ALTER TABLE eposta_alan FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eposta_alan' AND policyname = 'eposta_alan_yonetim') THEN
    CREATE POLICY eposta_alan_yonetim ON eposta_alan TO probata_yonetim USING (true) WITH CHECK (true);
  END IF;
END $$;
REVOKE ALL ON eposta_alan FROM PUBLIC;
GRANT SELECT ON eposta_alan TO probata_yonetim;

-- ── firma tarafı: kilitli gönderim kopyası ─────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS firma_gonderim (
  firma_id    uuid PRIMARY KEY DEFAULT gecerli_firma() REFERENCES firma(id),
  alan        text NOT NULL CHECK (length(alan) BETWEEN 3 AND 100
                                   AND alan ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'),
  genel       text NOT NULL CHECK (length(genel) <= 254 AND genel ~ '^[a-z0-9]([a-z0-9._-]{0,62}[a-z0-9])?@[a-z0-9.-]+$'),
  dogrulandi  boolean NOT NULL DEFAULT false,
  surum       integer NOT NULL DEFAULT 0,
  degisti     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT firma_gonderim_genel_alanda CHECK (split_part(genel, '@', 2) = alan)
);
ALTER TABLE firma_gonderim ENABLE ROW LEVEL SECURITY;
ALTER TABLE firma_gonderim FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firma_gonderim' AND policyname = 'firma_gonderim_kiraci') THEN
    CREATE POLICY firma_gonderim_kiraci ON firma_gonderim USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;
REVOKE ALL ON firma_gonderim FROM PUBLIC;
GRANT SELECT ON firma_gonderim TO probata_uygulama;

-- ── K3: uygulama rolü e-posta gönderim anahtarına dokunamaz ────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_sir_k3() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF current_user = 'probata_uygulama'
     AND ((TG_OP <> 'DELETE' AND NEW.ad = 'eposta_anahtari') OR (TG_OP <> 'INSERT' AND OLD.ad = 'eposta_anahtari')) THEN
    RAISE EXCEPTION 'E-posta gönderim anahtarı probata yönetiminden kurulur; firma ayarlarından değiştirilmez.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS firma_sir_k3 ON firma_sir;
CREATE TRIGGER firma_sir_k3 BEFORE INSERT OR UPDATE OR DELETE ON firma_sir FOR EACH ROW EXECUTE FUNCTION firma_sir_k3();

-- ── yönetim: sır (yapay zekâ anahtarı — 0097; e-posta gönderim anahtarı — FV11) ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_sir(p_firma uuid, p_ad text, p_sifreli text, p_son4 text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_firma_kimi(p_firma);
  v_firmada boolean := EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma');
  v_son4 text := CASE WHEN p_sifreli IS NULL THEN NULL ELSE p_son4 END;
BEGIN
  IF p_ad IS NULL OR p_ad NOT IN ('yapay_zeka_anahtari', 'eposta_anahtari') THEN RETURN jsonb_build_object('hata', 'ad'); END IF;
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
      VALUES (v_kim, CASE p_ad WHEN 'eposta_anahtari' THEN 'ayar.eposta_anahtari' ELSE 'ayar.yz_anahtari' END, p_firma,
        jsonb_build_object('son4', v_son4, 'kaldirildi', p_sifreli IS NULL));
  END IF;
  RETURN jsonb_build_object('durum', 'tamam', 'son4', v_son4);
END $$;

-- ── yönetim: firma tarafındaki gönderim kopyası (alan NULL: kaldır) ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_gonderim(p_firma uuid, p_alan text, p_genel text, p_dogrulandi boolean) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_firma_kimi(p_firma);
  v_firmada boolean := EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma');
BEGIN
  IF p_alan IS NOT NULL AND (p_genel IS NULL OR p_dogrulandi IS NULL OR split_part(lower(p_genel), '@', 2) <> lower(p_alan)) THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  IF p_alan IS NULL THEN
    DELETE FROM firma_gonderim WHERE firma_id = p_firma;
  ELSE
    INSERT INTO firma_gonderim (firma_id, alan, genel, dogrulandi) VALUES (p_firma, lower(p_alan), lower(p_genel), p_dogrulandi)
      ON CONFLICT (firma_id) DO UPDATE SET alan = EXCLUDED.alan, genel = EXCLUDED.genel, dogrulandi = EXCLUDED.dogrulandi,
        surum = firma_gonderim.surum + 1, degisti = now();
  END IF;
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id, ayrinti)
    VALUES (p_firma, 'probata yönetim (' || v_kim || ')', 'ayar.eposta_gonderim', 'firma_gonderim', p_firma::text,
      jsonb_build_object('alan', lower(p_alan), 'dogrulandi', p_dogrulandi));
  PERFORM set_config('app.firma_id', '', true);
  IF NOT v_firmada THEN
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
      VALUES (v_kim, 'ayar.eposta_gonderim', p_firma, jsonb_build_object('alan', lower(p_alan), 'dogrulandi', p_dogrulandi));
  END IF;
  RETURN jsonb_build_object('durum', 'tamam');
END $$;

-- ── merkez: alan adı kaydı ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
-- Dönen {"durum": "tamam"} ya da {"hata": "yok" | "alan_baska" | "gecersiz"}. Bir alan adı tek firmanın (başka firmada kayıtlıysa red).
CREATE OR REPLACE FUNCTION yonetim_eposta_alan_yaz(p_firma uuid, p_alan text, p_genel_yerel text, p_resend_id text, p_durum text, p_kayitlar jsonb,
  p_anahtar_id text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_kim();
  v_eski eposta_alan%ROWTYPE;
BEGIN
  PERFORM vt_merkez_dogrula();
  IF NOT EXISTS (SELECT 1 FROM firma WHERE id = p_firma) THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF p_alan IS NULL OR p_genel_yerel IS NULL OR p_resend_id IS NULL OR p_durum IS NULL OR p_kayitlar IS NULL THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  IF EXISTS (SELECT 1 FROM eposta_alan WHERE alan = lower(p_alan) AND firma_id <> p_firma) THEN RETURN jsonb_build_object('hata', 'alan_baska'); END IF;
  SELECT * INTO v_eski FROM eposta_alan WHERE firma_id = p_firma FOR UPDATE;
  INSERT INTO eposta_alan (firma_id, alan, genel_yerel, resend_id, durum, kayitlar, anahtar_id)
    VALUES (p_firma, lower(p_alan), lower(p_genel_yerel), p_resend_id, p_durum, p_kayitlar, p_anahtar_id)
    ON CONFLICT (firma_id) DO UPDATE SET alan = EXCLUDED.alan, genel_yerel = EXCLUDED.genel_yerel, resend_id = EXCLUDED.resend_id,
      durum = EXCLUDED.durum, kayitlar = EXCLUDED.kayitlar, anahtar_id = EXCLUDED.anahtar_id, degisti = now();
  -- iz yalnız değişince (Doğrula her basışta aynı durumu yazabilir)
  IF v_eski.firma_id IS NULL OR v_eski.alan IS DISTINCT FROM lower(p_alan) OR v_eski.durum IS DISTINCT FROM p_durum
     OR v_eski.genel_yerel IS DISTINCT FROM lower(p_genel_yerel) OR v_eski.anahtar_id IS DISTINCT FROM p_anahtar_id THEN
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
      VALUES (v_kim, 'eposta.alan', p_firma, jsonb_build_object('alan', lower(p_alan), 'genel', lower(p_genel_yerel) || '@' || lower(p_alan), 'durum', p_durum));
  END IF;
  RETURN jsonb_build_object('durum', 'tamam');
END $$;

-- ── merkez: kendi projeli firmanın yönetim izi (0097) — e-posta gönderimi de (firma tarafı başarıdan sonra) ─────────────────────────────────
CREATE OR REPLACE FUNCTION yonetim_firmada_iz(p_firma uuid, p_ne text, p_ayrinti jsonb) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_kim text := yonetim_kim();
BEGIN
  IF EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma') THEN RAISE EXCEPTION 'merkez değil' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM firma WHERE id = p_firma AND vt = 'kendi') THEN RAISE EXCEPTION 'kendi projeli firma değil' USING ERRCODE = '42501'; END IF;
  IF p_ne NOT IN ('hesap.gecici_parola', 'ayar.yz_anahtari', 'ayar.eposta_gonderim') THEN RAISE EXCEPTION 'bilinmeyen iz' USING ERRCODE = '22023'; END IF;
  INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti) VALUES (v_kim, p_ne, p_firma, coalesce(p_ayrinti, '{}'::jsonb));
END $$;

REVOKE ALL ON FUNCTION firma_sir_k3(), firma_yonetim_gonderim(uuid, text, text, boolean),
  yonetim_eposta_alan_yaz(uuid, text, text, text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_yonetim_gonderim(uuid, text, text, boolean), yonetim_eposta_alan_yaz(uuid, text, text, text, text, jsonb, text)
  TO probata_yonetim;
