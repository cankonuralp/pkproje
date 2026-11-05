-- ══ 0122 · PROBATA SIGN BAĞLANTISI (2026-11-05; reisim: "bu api keyi ve webhook kodunu girdiğimde imza sisteminin firma için aktif olacağı bir tasarım …
--    ben yönetim kısmından gireyim ve o firma için imzalama probata sign üzerinden yapılsın ve ayarlarda imza yöntemi kısmında probata sign işaretlensin
--    otomatik olarak, şimdilik e imza üzerinden gidelim"; tasarım https://claude.ai/artifact/59EF1ZZAJZdg6BztvuiWbr — "önerilerin ve sunumun uygun") ══
-- · Sırlar: firma_sir 'sign_anahtari' (sign API anahtarı) ve 'sign_webhook_sirri' (sign'ın verdiği HMAC sırrı) — YALNIZ probata yönetimi yazar
--   (firma_yonetim_sir), uygulama rolü yazamaz / silemez (firma_sir_k3 genişler). İkisi de varsa firma sign ile imzalar (K1: firma kapatamaz).
-- · imza_istegi'ne sign alanları: sign'daki belge ve istek kimliği, imza bağlantısı (şifreli — yalnız isteğin sahibine açılır), durum (bekliyor ·
--   reddedildi · iptal · hata) ve nedeni. İsteğin bugünkü kuralları (koruma tetiği) aynen: bu alanlar yalnız bekleyen istekte yazılır.
-- · sign_bildirim: işlenen webhook gönderimleri (X-Probata-Gonderim) — aynı bildirim iki kez işlenmez.
-- Kilit tests/sign-baglanti.test.ts (PG) + sign-saf. ⛔ Her göç IDEMPOTENT.

ALTER TABLE imza_istegi ADD COLUMN IF NOT EXISTS sign_belge text;
ALTER TABLE imza_istegi ADD COLUMN IF NOT EXISTS sign_istek text;
ALTER TABLE imza_istegi ADD COLUMN IF NOT EXISTS sign_baglanti text;
ALTER TABLE imza_istegi ADD COLUMN IF NOT EXISTS sign_durum text;
ALTER TABLE imza_istegi ADD COLUMN IF NOT EXISTS sign_neden text;
ALTER TABLE imza_istegi DROP CONSTRAINT IF EXISTS imza_istegi_sign;
ALTER TABLE imza_istegi ADD CONSTRAINT imza_istegi_sign CHECK (
  (sign_belge IS NULL OR sign_belge ~ '^[0-9a-f-]{36}$') AND (sign_istek IS NULL OR sign_istek ~ '^[0-9a-f-]{36}$')
  AND (sign_baglanti IS NULL OR sign_baglanti ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$')
  AND (sign_durum IS NULL OR sign_durum IN ('bekliyor', 'reddedildi', 'iptal', 'hata'))
  AND (sign_neden IS NULL OR length(sign_neden) <= 400));
CREATE INDEX IF NOT EXISTS imza_istegi_sign_belge ON imza_istegi (firma_id, sign_belge) WHERE sign_belge IS NOT NULL;

CREATE TABLE IF NOT EXISTS sign_bildirim (
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  id        text NOT NULL CHECK (id ~ '^[A-Za-z0-9_-]{8,80}$'),
  olay      text NOT NULL CHECK (olay ~ '^[a-z_.]{3,40}$'),
  zaman     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firma_id, id)
);
ALTER TABLE sign_bildirim ENABLE ROW LEVEL SECURITY;
ALTER TABLE sign_bildirim FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sign_bildirim' AND policyname = 'sign_bildirim_kiraci') THEN
    CREATE POLICY sign_bildirim_kiraci ON sign_bildirim USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;
REVOKE ALL ON sign_bildirim FROM PUBLIC;
GRANT SELECT, INSERT ON sign_bildirim TO probata_uygulama;

-- ── K1: sign sırlarını uygulama yazamaz (0099 / 0106 kilidinin aynısı, iki ad daha) ──
CREATE OR REPLACE FUNCTION firma_sir_k3() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF current_user = 'probata_uygulama'
     AND ((TG_OP <> 'DELETE' AND NEW.ad IN ('eposta_anahtari', 'yapay_zeka_anahtari', 'sign_anahtari', 'sign_webhook_sirri'))
       OR (TG_OP <> 'INSERT' AND OLD.ad IN ('eposta_anahtari', 'yapay_zeka_anahtari', 'sign_anahtari', 'sign_webhook_sirri'))) THEN
    RAISE EXCEPTION 'Bu anahtar probata yönetiminden kurulur; firma ayarlarından değiştirilmez.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

-- ── yönetim: sır yazar / kaldırır (0099'un işlevi; iki ad daha) ──
CREATE OR REPLACE FUNCTION firma_yonetim_sir(p_firma uuid, p_ad text, p_sifreli text, p_son4 text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_firma_kimi(p_firma);
  v_firmada boolean := EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma');
  v_son4 text := CASE WHEN p_sifreli IS NULL THEN NULL ELSE p_son4 END;
BEGIN
  IF p_ad IS NULL OR p_ad NOT IN ('yapay_zeka_anahtari', 'eposta_anahtari', 'sign_anahtari', 'sign_webhook_sirri') THEN RETURN jsonb_build_object('hata', 'ad'); END IF;
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
      VALUES (v_kim, CASE p_ad WHEN 'eposta_anahtari' THEN 'ayar.eposta_anahtari' WHEN 'sign_anahtari' THEN 'ayar.sign_anahtari'
        WHEN 'sign_webhook_sirri' THEN 'ayar.sign_webhook_sirri' ELSE 'ayar.yz_anahtari' END, p_firma,
        jsonb_build_object('son4', v_son4, 'kaldirildi', p_sifreli IS NULL));
  END IF;
  RETURN jsonb_build_object('durum', 'tamam', 'son4', v_son4);
END $$;
REVOKE ALL ON FUNCTION firma_yonetim_sir(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_yonetim_sir(uuid, text, text, text) TO probata_yonetim;

-- ── yönetim: firmanın sign bağlantısı — iki sırrın son 4 hanesi ve son bildirim (sırrın kendisi dönmez) ──
CREATE OR REPLACE FUNCTION firma_yonetim_sign(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  PERFORM yonetim_firma_kimi(p_firma);
  RETURN jsonb_build_object(
    'anahtar', (SELECT CASE WHEN s.sifreli IS NOT NULL THEN s.son4 END FROM firma_sir s WHERE s.firma_id = p_firma AND s.ad = 'sign_anahtari'),
    'sir', (SELECT CASE WHEN s.sifreli IS NOT NULL THEN s.son4 END FROM firma_sir s WHERE s.firma_id = p_firma AND s.ad = 'sign_webhook_sirri'),
    'degisti', (SELECT max(s.degisti) FROM firma_sir s WHERE s.firma_id = p_firma AND s.ad IN ('sign_anahtari', 'sign_webhook_sirri')),
    'son_bildirim', (SELECT max(b.zaman) FROM sign_bildirim b WHERE b.firma_id = p_firma),
    'kisa_ad', (SELECT f.kisa_ad FROM firma f WHERE f.id = p_firma));
END $$;
REVOKE ALL ON FUNCTION firma_yonetim_sign(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_yonetim_sign(uuid) TO probata_yonetim;
