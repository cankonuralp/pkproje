-- ══ 0050 · probata YÖNETİM — firma aç / dondur / geçici parola, yönetici hesabı ve iki adımlı giriş (348; maket yonetim.html, pkproje §11 247;
-- KOD-GECIS Y1 karar 2026-10-03, reisim: "Yönetim sayfa önerini kabul ediyorum") ══
-- Firmaların görmediği, YALNIZ probata ekibinin sayfası; ayrı adreste (PROBATA_YONETIM_ALAN) ve iki adımlı girişle (parola + doğrulama kodu,
-- RFC 6238). Yönetici hesapları kiracı DEĞİL (firma_id taşımaz); yalnız biz açarız (uygulamada yönetici ekleme yok).
-- İKİNCİ KATMAN: yönetim işlemleri veritabanında probata_yonetim rolüyle koşar (SET LOCAL ROLE; uygulama rolü bu role GEÇER ama hakkını DEVRALMAZ —
-- 0030 deseni). Bu rolün firmaların tablolarına (hesap, personel, rapor …) doğrudan hakkı YOK: firmalar listesi, firma açma, dondurma ve geçici
-- parola yalnız aşağıdaki işlevlerle (tanımlayıcının haklarıyla; her biri hem firmanın denetim izine hem yönetim izine yazar, yöneticisi işlemin
-- bağlamından — app.yonetici_id; yoksa reddedilir). Uygulama rolü (firma işlemleri) bu işlevleri çağıramaz.
-- DONDURMA tek bayrak (07, 09-E6): firma.durum = 'dondu' → firma_bul NULL döner (alt alan adı firma bulmaz: kullanıcı ve müşteri giremez) ve açık
-- oturumlar silinir. Veri silinmez; etkinleştirilince firma aynen açılır. ⛔ Her göç IDEMPOTENT.

-- ── firma: durum + ilk firma yöneticisi ───────────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE firma ADD COLUMN IF NOT EXISTS durum text NOT NULL DEFAULT 'etkin';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'firma_durum_check' AND conrelid = 'firma'::regclass) THEN
    ALTER TABLE firma ADD CONSTRAINT firma_durum_check CHECK (durum IN ('etkin', 'dondu'));
  END IF;
END $$;
-- açılışta kurulan ilk firma yöneticisinin hesabı ("Yöneticiye yeni geçici parola" ona); eski firmalarda boş → en eski firma yöneticisi
ALTER TABLE firma ADD COLUMN IF NOT EXISTS ilk_hesap uuid REFERENCES hesap(id);

-- dondurulmuş firma alt alan adından bulunmaz (tek giriş noktası: src/server/kiraci/istek.ts → firma_bul)
CREATE OR REPLACE FUNCTION firma_bul(p_kisa_ad text) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT id FROM firma WHERE kisa_ad = p_kisa_ad AND durum = 'etkin' $$;

-- ── yönetici (probata ekibi) ──────────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yonetici (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eposta         text NOT NULL UNIQUE CHECK (eposta = lower(eposta) AND length(eposta) BETWEEN 3 AND 254 AND position('@' in eposta) > 1),
  ad             text NOT NULL CHECK (length(ad) BETWEEN 1 AND 200),
  -- scrypt$N$r$p$tuz$ozet (src/server/kimlik/parola.ts); düz parola hiçbir yerde yok
  parola_ozeti   text NOT NULL CHECK (parola_ozeti LIKE 'scrypt$%'),
  -- doğrulama kodu anahtarı: uygulamanın ana anahtarıyla şifreli (AES-256-GCM, yöneticiye bağlı — src/server/yonetim/giris.ts); kurulmadıysa boş
  totp_sir       text CHECK (totp_sir IS NULL OR totp_sir LIKE 'v1.%'),
  -- son kabul edilen kodun zaman adımı: aynı kod (ya da daha eskisi) ikinci kez geçmez
  totp_son       bigint NOT NULL DEFAULT 0 CHECK (totp_son >= 0),
  -- ilk: geçici parola, anahtar kurulmadı (ilk girişte kurulur, parola değişir) · etkin · kapali (giremez)
  durum          text NOT NULL DEFAULT 'ilk' CHECK (durum IN ('ilk', 'etkin', 'kapali')),
  hatali_deneme  integer NOT NULL DEFAULT 0 CHECK (hatali_deneme >= 0),
  kilit_bitis    timestamptz,
  olustu         timestamptz NOT NULL DEFAULT now(),
  CHECK (durum <> 'etkin' OR totp_sir IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS yonetim_oturum (
  -- çerezdeki belirtecin SHA-256 özeti (hex); belirtecin kendisi saklanmaz
  ozet          text PRIMARY KEY CHECK (ozet ~ '^[0-9a-f]{64}$'),
  yonetici_id   uuid NOT NULL REFERENCES yonetici(id) ON DELETE CASCADE,
  -- parola: yalnız ikinci adım (kod) ya da ilk kurulum açılır, kısa ömürlü · tamam: yönetim sayfası
  adim          text NOT NULL CHECK (adim IN ('parola', 'tamam')),
  -- ilk kurulumda gösterilen anahtar (şifreli); kod doğrulanınca yöneticiye taşınır
  kurulum_sir   text CHECK (kurulum_sir IS NULL OR kurulum_sir LIKE 'v1.%'),
  olustu        timestamptz NOT NULL DEFAULT now(),
  son_kullanim  timestamptz NOT NULL DEFAULT now(),
  bitis         timestamptz NOT NULL,
  ip            text CHECK (ip IS NULL OR length(ip) <= 64)
);
CREATE INDEX IF NOT EXISTS yonetim_oturum_yonetici ON yonetim_oturum (yonetici_id);
-- aynı IP'den hatalı deneme kilidi (hesap kilidi yöneticide)
CREATE TABLE IF NOT EXISTS yonetim_kilit (
  ip             text PRIMARY KEY CHECK (length(ip) BETWEEN 1 AND 64),
  hatali_deneme  integer NOT NULL DEFAULT 0 CHECK (hatali_deneme >= 0),
  kilit_bitis    timestamptz,
  son            timestamptz NOT NULL DEFAULT now()
);
-- yönetim izi: yalnız eklenir (güncelleme / silme / boşaltma tetikle reddedilir); zaman ve yönetici veritabanından damgalanır
CREATE TABLE IF NOT EXISTS yonetim_izi (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zaman        timestamptz NOT NULL DEFAULT now(),
  yonetici_id  uuid REFERENCES yonetici(id),
  kim          text NOT NULL CHECK (length(kim) BETWEEN 1 AND 254),
  ne           text NOT NULL CHECK (ne ~ '^[a-z_]{1,40}\.[a-z_]{1,40}$'),
  hedef_firma  uuid REFERENCES firma(id),
  ayrinti      jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS yonetim_izi_zaman ON yonetim_izi (zaman DESC);
CREATE OR REPLACE FUNCTION yonetim_izi_damga() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NEW.zaman := now();
  NEW.yonetici_id := NULLIF(current_setting('app.yonetici_id', true), '')::uuid;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION yonetim_izi_degismez() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'yönetim izi değiştirilemez' USING ERRCODE = '42501';
END $$;
ALTER FUNCTION yonetim_izi_damga() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION yonetim_izi_degismez() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yonetim_izi_damga(), yonetim_izi_degismez() FROM PUBLIC;
DROP TRIGGER IF EXISTS yonetim_izi_damga ON yonetim_izi;
CREATE TRIGGER yonetim_izi_damga BEFORE INSERT ON yonetim_izi FOR EACH ROW EXECUTE FUNCTION yonetim_izi_damga();
DROP TRIGGER IF EXISTS yonetim_izi_degismez ON yonetim_izi;
CREATE TRIGGER yonetim_izi_degismez BEFORE UPDATE OR DELETE ON yonetim_izi FOR EACH ROW EXECUTE FUNCTION yonetim_izi_degismez();
DROP TRIGGER IF EXISTS yonetim_izi_bosaltilmaz ON yonetim_izi;
CREATE TRIGGER yonetim_izi_bosaltilmaz BEFORE TRUNCATE ON yonetim_izi FOR EACH STATEMENT EXECUTE FUNCTION yonetim_izi_degismez();

-- ── yönetim rolü ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'probata_yonetim') THEN
    CREATE ROLE probata_yonetim NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;
GRANT probata_yonetim TO probata_uygulama WITH INHERIT FALSE, SET TRUE;
GRANT USAGE ON SCHEMA public TO probata_yonetim;

-- yönetim tablolarında RLS: yalnız yönetim rolü görür (uygulama rolünün zaten hakkı yok; ikinci kilit)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['yonetici', 'yonetim_oturum', 'yonetim_kilit', 'yonetim_izi'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_yonetim') THEN
      EXECUTE format('CREATE POLICY %I ON %I TO probata_yonetim USING (true) WITH CHECK (true)', t || '_yonetim', t);
    END IF;
  END LOOP;
END $$;
-- yönetici satırı uygulamadan EKLENMEZ / SİLİNMEZ (biz açarız); yalnız giriş alanları güncellenir
GRANT SELECT ON yonetici TO probata_yonetim;
GRANT UPDATE (parola_ozeti, totp_sir, totp_son, durum, hatali_deneme, kilit_bitis) ON yonetici TO probata_yonetim;
GRANT SELECT, INSERT, DELETE ON yonetim_oturum TO probata_yonetim;
GRANT UPDATE (adim, kurulum_sir, son_kullanim, bitis) ON yonetim_oturum TO probata_yonetim;
GRANT SELECT, INSERT, UPDATE, DELETE ON yonetim_kilit TO probata_yonetim;
GRANT SELECT, INSERT ON yonetim_izi TO probata_yonetim;

-- işlemin yöneticisi: bağlamda yoksa (yönetim işlemi değil) reddedilir; kapalı yönetici de reddedilir
CREATE OR REPLACE FUNCTION yonetim_kim() RETURNS text
  LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v text;
BEGIN
  SELECT eposta INTO v FROM yonetici WHERE id = NULLIF(current_setting('app.yonetici_id', true), '')::uuid AND durum = 'etkin';
  IF v IS NULL THEN RAISE EXCEPTION 'yönetim işlemi değil' USING ERRCODE = '42501'; END IF;
  RETURN v;
END $$;

-- ── firmalar listesi ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION yonetim_firmalar()
  RETURNS TABLE (id uuid, ad text, kisa_ad text, rapor_kodu text, durum text, olusturuldu timestamptz, kullanici integer,
                 yon_ad text, yon_eposta text, yon_durum text)
  LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  PERFORM yonetim_kim();
  RETURN QUERY
    SELECT f.id, f.ad, f.kisa_ad, f.rapor_kodu, f.durum, f.olusturuldu,
      (SELECT count(*)::integer FROM hesap h WHERE h.firma_id = f.id AND h.durum <> 'pasif'),
      y.ad, y.eposta, y.durum
    FROM firma f
    LEFT JOIN LATERAL (
      SELECT h.ad, h.eposta, h.durum FROM hesap h
      WHERE h.firma_id = f.id AND (h.id = f.ilk_hesap OR (f.ilk_hesap IS NULL AND 'firma_yoneticisi' = ANY (h.roller)))
      ORDER BY (h.id = f.ilk_hesap) DESC, h.olustu LIMIT 1) y ON true
    ORDER BY f.olusturuldu DESC, f.kisa_ad;
END $$;

-- ── firma aç: firma + ilk firma yöneticisinin personel kaydı ve hesabı (geçici parola, durum "ilk") ─────────────────────────────────────
-- Dönen: {"id": …} ya da {"hata": "kisa_ad" | "rapor_kodu" | "ayrilmis" | "gecersiz"}. Ayrılmış adlar (www, yonetim, api …) ve biçim
-- uygulamadaki şemayla aynı (src/modules/yonetim/sema.ts — kilit testi); ayrıca burada.
CREATE OR REPLACE FUNCTION yonetim_firma_ac(p_ad text, p_kisa_ad text, p_rapor_kodu text, p_yon_ad text, p_yon_eposta text, p_parola_ozeti text)
  RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_kim text := yonetim_kim();
  v_id uuid := gen_random_uuid();
  v_personel uuid;
  v_hesap uuid;
BEGIN
  IF p_kisa_ad IS NULL OR p_kisa_ad !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' OR p_rapor_kodu IS NULL OR p_rapor_kodu !~ '^[A-Z]{2}$'
     OR p_ad IS NULL OR length(btrim(p_ad)) NOT BETWEEN 1 AND 160 OR p_yon_ad IS NULL OR length(p_yon_ad) NOT BETWEEN 3 AND 80 OR p_yon_ad !~ '\S+\s+\S+'
     OR p_yon_eposta IS NULL OR p_yon_eposta <> lower(p_yon_eposta) OR position('@' in p_yon_eposta) < 2 OR length(p_yon_eposta) > 254
     OR p_parola_ozeti IS NULL OR p_parola_ozeti NOT LIKE 'scrypt$%' THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  IF p_kisa_ad = ANY (ARRAY['www', 'yonetim', 'api', 'mail', 'destek', 'probata', 'test', 'demo']) THEN
    RETURN jsonb_build_object('hata', 'ayrilmis');
  END IF;
  -- eşzamanlı iki açılış aynı adı / kodu almasın
  LOCK TABLE firma IN SHARE ROW EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM firma WHERE kisa_ad = p_kisa_ad) THEN RETURN jsonb_build_object('hata', 'kisa_ad'); END IF;
  IF EXISTS (SELECT 1 FROM firma WHERE rapor_kodu = p_rapor_kodu) THEN RETURN jsonb_build_object('hata', 'rapor_kodu'); END IF;
  -- yeni firmanın bağlamı (varsayılan firma_id, e-posta tekliği tetiği); işlev bitince boşaltılır
  PERFORM set_config('app.firma_id', v_id::text, true);
  INSERT INTO firma (id, kisa_ad, ad, rapor_kodu) VALUES (v_id, p_kisa_ad, btrim(p_ad), p_rapor_kodu);
  INSERT INTO personel (firma_id, ad, eposta, basla, meslek, meslek_metin)
    VALUES (v_id, p_yon_ad, p_yon_eposta, current_date, 'diger', 'Firma yöneticisi') RETURNING personel.id INTO v_personel;
  INSERT INTO hesap (firma_id, eposta, ad, parola_ozeti, roller, durum, personel_id)
    VALUES (v_id, p_yon_eposta, p_yon_ad, p_parola_ozeti, ARRAY['firma_yoneticisi'], 'ilk', v_personel) RETURNING hesap.id INTO v_hesap;
  UPDATE firma SET ilk_hesap = v_hesap WHERE firma.id = v_id;
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id, ayrinti)
    VALUES (v_id, 'probata yönetim', 'firma.acildi', 'firma', v_id::text, jsonb_build_object('kisa_ad', p_kisa_ad, 'yonetici', p_yon_eposta));
  INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
    VALUES (v_kim, 'firma.acildi', v_id, jsonb_build_object('kisa_ad', p_kisa_ad, 'rapor_kodu', p_rapor_kodu, 'yonetici', p_yon_eposta));
  PERFORM set_config('app.firma_id', '', true);
  RETURN jsonb_build_object('id', v_id);
END $$;

-- ── dondur / etkinleştir: dondurulunca firmanın kullanıcı ve müşteri oturumları silinir ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION yonetim_firma_durum(p_firma uuid, p_durum text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_kim text := yonetim_kim();
  v_eski text;
BEGIN
  IF p_durum NOT IN ('etkin', 'dondu') THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  SELECT durum INTO v_eski FROM firma WHERE id = p_firma FOR UPDATE;
  IF v_eski IS NULL THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF v_eski = p_durum THEN RETURN jsonb_build_object('hata', 'ayni'); END IF;
  UPDATE firma SET durum = p_durum WHERE id = p_firma;
  IF p_durum = 'dondu' THEN
    DELETE FROM oturum WHERE firma_id = p_firma;
    DELETE FROM musteri_oturum WHERE firma_id = p_firma;
  END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id)
    VALUES (p_firma, 'probata yönetim', CASE p_durum WHEN 'dondu' THEN 'firma.donduruldu' ELSE 'firma.etkinlestirildi' END, 'firma', p_firma::text);
  PERFORM set_config('app.firma_id', '', true);
  INSERT INTO yonetim_izi (kim, ne, hedef_firma)
    VALUES (v_kim, CASE p_durum WHEN 'dondu' THEN 'firma.donduruldu' ELSE 'firma.etkinlestirildi' END, p_firma);
  RETURN jsonb_build_object('durum', p_durum);
END $$;

-- ── ilk firma yöneticisine yeni geçici parola (durum "ilk"; açık oturumları 0002 tetiğiyle düşer). Dondurulmuş firmada ve ayrılmış kişide yok.
CREATE OR REPLACE FUNCTION yonetim_gecici_parola(p_firma uuid, p_parola_ozeti text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_kim text := yonetim_kim();
  v_durum text;
  v_ilk uuid;
  v_hesap uuid;
  v_eposta text;
  v_ad text;
BEGIN
  IF p_parola_ozeti IS NULL OR p_parola_ozeti NOT LIKE 'scrypt$%' THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  SELECT durum, ilk_hesap INTO v_durum, v_ilk FROM firma WHERE id = p_firma FOR UPDATE;
  IF v_durum IS NULL THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF v_durum <> 'etkin' THEN RETURN jsonb_build_object('hata', 'dondu'); END IF;
  SELECT h.id, h.eposta, h.ad INTO v_hesap, v_eposta, v_ad FROM hesap h
    WHERE h.firma_id = p_firma AND (h.id = v_ilk OR (v_ilk IS NULL AND 'firma_yoneticisi' = ANY (h.roller)))
    ORDER BY (h.id = v_ilk) DESC, h.olustu LIMIT 1 FOR UPDATE;
  IF v_hesap IS NULL THEN RETURN jsonb_build_object('hata', 'hesap_yok'); END IF;
  IF EXISTS (SELECT 1 FROM hesap WHERE id = v_hesap AND durum = 'pasif') THEN RETURN jsonb_build_object('hata', 'pasif'); END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  UPDATE hesap SET parola_ozeti = p_parola_ozeti, durum = 'ilk', hatali_deneme = 0, kilit_bitis = NULL WHERE id = v_hesap;
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id)
    VALUES (p_firma, 'probata yönetim', 'hesap.gecici_parola', 'hesap', v_hesap::text);
  PERFORM set_config('app.firma_id', '', true);
  INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti) VALUES (v_kim, 'hesap.gecici_parola', p_firma, jsonb_build_object('eposta', v_eposta));
  RETURN jsonb_build_object('eposta', v_eposta, 'ad', v_ad);
END $$;

ALTER FUNCTION yonetim_kim() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION yonetim_firmalar() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION yonetim_firma_ac(text, text, text, text, text, text) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION yonetim_firma_durum(uuid, text) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION yonetim_gecici_parola(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yonetim_kim(), yonetim_firmalar(), yonetim_firma_ac(text, text, text, text, text, text), yonetim_firma_durum(uuid, text),
  yonetim_gecici_parola(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yonetim_kim(), yonetim_firmalar(), yonetim_firma_ac(text, text, text, text, text, text), yonetim_firma_durum(uuid, text),
  yonetim_gecici_parola(uuid, text) TO probata_yonetim;
