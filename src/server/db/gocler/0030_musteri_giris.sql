-- ══ 0030 · MÜŞTERİ GİRİŞİ + MÜŞTERİ PANELİNİN İKİNCİ KATMANI (modül 17; maket musteri.html M11, musteriler.html "Müşteri girişi"; karar 33, 35,
-- 44; 09-E5: "müşteri kullanıcısı için RLS'de firma + müşteri + müşteriye açık — kilit: iki müşterili gerçek PostgreSQL testi") ══
-- HESAP: müşteri kullanıcısı ayrı tür (personel hesabı değil). Müşteri başına bir ANA giriş (kullanıcı adı müşterinin e-postası, bütün
-- tesisler) + kişiye özel EK girişler (bütün ya da seçili tesisler — tesis müşterinin kendi tesisi olmalı, tetik). Parola düz tutulmaz
-- (scrypt özeti); geçici parola personel "Geçici parola" deyince üretilir, bir kez gösterilir. Durum: hazir (parola yok) · ilk (geçici parola,
-- girince değiştirebilir) · etkin · pasif. Kullanıcı adı (e-posta) firmada personel hesabıyla da çakışmaz (iki tabloda tek — tetik).
-- Oturum ayrı tabloda; parola / durum / e-posta / tesis kapsamı değişince açık oturumlar hemen düşer (09-E4 gibi).
-- İKİNCİ KATMAN: müşteri işlemleri veritabanında probata_musteri rolüyle koşar (SET LOCAL ROLE; uygulama rolü bu role GEÇEBİLİR ama onun
-- kısıtlarını DEVRALMAZ — INHERIT FALSE). Bu rol yalnız panelin okuduğu tabloları okur (yazma hakkı yok) ve her birinde kiracı politikasına EK
-- olarak KISITLAYICI politika vardır: kendi müşterisi, kendi tesis kapsamı, "müşteriye açık" (imzalı, son sürüm; revizyonla kapanan
-- uygunsuzluk değil). Uygulama kodunda bir süzgeç unutulsa da başka müşterinin satırı dönmez.
-- ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS musteri_hesap (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id        uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  musteri_id      uuid NOT NULL,
  ana             boolean NOT NULL DEFAULT false,
  eposta          text NOT NULL CHECK (eposta = lower(eposta) AND length(eposta) BETWEEN 3 AND 254 AND position('@' in eposta) > 1),
  ad              text NOT NULL CHECK (length(ad) BETWEEN 1 AND 200),
  -- bütün tesisler: NULL; seçili tesisler: kimlik dizisi (ana giriş her zaman bütün tesisler)
  tesisler        uuid[] CHECK (tesisler IS NULL OR cardinality(tesisler) BETWEEN 1 AND 500),
  parola_ozeti    text CHECK (parola_ozeti IS NULL OR parola_ozeti LIKE 'scrypt$%'),
  durum           text NOT NULL DEFAULT 'hazir' CHECK (durum IN ('hazir', 'ilk', 'etkin', 'pasif')),
  hatali_deneme   integer NOT NULL DEFAULT 0 CHECK (hatali_deneme >= 0),
  kilit_bitis     timestamptz,
  son_giris       timestamptz,
  parola_verildi  timestamptz,
  surum           integer NOT NULL DEFAULT 0,
  olustu          timestamptz NOT NULL DEFAULT now(),
  degisti         timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, musteri_id) REFERENCES musteri (firma_id, id),
  UNIQUE (firma_id, eposta),
  UNIQUE (firma_id, id),
  CHECK (NOT ana OR tesisler IS NULL),
  CHECK (durum NOT IN ('ilk', 'etkin') OR parola_ozeti IS NOT NULL),
  CHECK (durum <> 'hazir' OR parola_ozeti IS NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS musteri_hesap_ana ON musteri_hesap (firma_id, musteri_id) WHERE ana;
CREATE INDEX IF NOT EXISTS musteri_hesap_musteri ON musteri_hesap (firma_id, musteri_id);
ALTER TABLE musteri_hesap ENABLE ROW LEVEL SECURITY;
ALTER TABLE musteri_hesap FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'musteri_hesap' AND policyname = 'musteri_hesap_kiraci') THEN
    CREATE POLICY musteri_hesap_kiraci ON musteri_hesap USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS musteri_oturum (
  -- çerezdeki belirtecin SHA-256 özeti (hex); belirtecin kendisi saklanmaz
  ozet              text PRIMARY KEY CHECK (ozet ~ '^[0-9a-f]{64}$'),
  firma_id          uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  musteri_hesap_id  uuid NOT NULL REFERENCES musteri_hesap(id) ON DELETE CASCADE,
  olustu            timestamptz NOT NULL DEFAULT now(),
  son_kullanim      timestamptz NOT NULL DEFAULT now(),
  bitis             timestamptz NOT NULL,
  hatirla           boolean NOT NULL DEFAULT false,
  ip                text,
  tarayici          text CHECK (tarayici IS NULL OR length(tarayici) <= 300)
);
CREATE INDEX IF NOT EXISTS musteri_oturum_hesap ON musteri_oturum (firma_id, musteri_hesap_id);
ALTER TABLE musteri_oturum ENABLE ROW LEVEL SECURITY;
ALTER TABLE musteri_oturum FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'musteri_oturum' AND policyname = 'musteri_oturum_kiraci') THEN
    CREATE POLICY musteri_oturum_kiraci ON musteri_oturum USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- kullanıcı adı firmada TEK: personel hesabı ve müşteri girişi aynı e-postayı taşıyamaz (aynı giriş ekranı — karar 35)
CREATE OR REPLACE FUNCTION giris_eposta_essiz() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.eposta IS NOT DISTINCT FROM OLD.eposta THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('probata:giris_eposta:' || NEW.firma_id::text || ':' || NEW.eposta));
  IF (TG_TABLE_NAME = 'hesap' AND EXISTS (SELECT 1 FROM musteri_hesap m WHERE m.firma_id = NEW.firma_id AND m.eposta = NEW.eposta))
     OR (TG_TABLE_NAME = 'musteri_hesap' AND EXISTS (SELECT 1 FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.eposta = NEW.eposta)) THEN
    RAISE EXCEPTION 'bu e-posta firmada başka bir girişte kayıtlı' USING ERRCODE = '23505', CONSTRAINT = 'giris_eposta';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION giris_eposta_essiz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION giris_eposta_essiz() FROM PUBLIC;
CREATE OR REPLACE TRIGGER hesap_eposta_essiz BEFORE INSERT OR UPDATE OF eposta ON hesap FOR EACH ROW EXECUTE FUNCTION giris_eposta_essiz();
CREATE OR REPLACE TRIGGER musteri_hesap_eposta_essiz BEFORE INSERT OR UPDATE OF eposta ON musteri_hesap FOR EACH ROW EXECUTE FUNCTION giris_eposta_essiz();

-- müşteri girişi: tesis kapsamı müşterinin KENDİ tesisleri; müşteri değişmez; parola / durum / e-posta / kapsam değişince oturumlar düşer
CREATE OR REPLACE FUNCTION musteri_hesap_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.musteri_id IS DISTINCT FROM OLD.musteri_id OR NEW.ana IS DISTINCT FROM OLD.ana OR NEW.firma_id IS DISTINCT FROM OLD.firma_id) THEN
    RAISE EXCEPTION 'müşteri girişinin müşterisi ve türü değişmez' USING ERRCODE = '23514';
  END IF;
  IF NEW.tesisler IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(NEW.tesisler) AS x(t)
       WHERE NOT EXISTS (SELECT 1 FROM tesis s WHERE s.firma_id = NEW.firma_id AND s.id = x.t AND s.musteri_id = NEW.musteri_id)) THEN
    RAISE EXCEPTION 'giriş yalnız müşterinin kendi tesislerini görür' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.parola_ozeti IS DISTINCT FROM OLD.parola_ozeti OR NEW.durum IS DISTINCT FROM OLD.durum OR NEW.eposta IS DISTINCT FROM OLD.eposta
       OR NEW.tesisler IS DISTINCT FROM OLD.tesisler THEN
      DELETE FROM musteri_oturum WHERE musteri_hesap_id = NEW.id AND firma_id = NEW.firma_id;
    END IF;
    NEW.degisti := now();
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION musteri_hesap_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_hesap_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER musteri_hesap_koru BEFORE INSERT OR UPDATE ON musteri_hesap FOR EACH ROW EXECUTE FUNCTION musteri_hesap_koru();

GRANT SELECT, INSERT, UPDATE ON musteri_hesap TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE, DELETE ON musteri_oturum TO probata_uygulama;

-- ── İKİNCİ KATMAN: müşteri rolü ──────────────────────────────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'probata_musteri') THEN
    CREATE ROLE probata_musteri NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;
-- uygulama rolü müşteri işleminde bu role GEÇER (SET LOCAL ROLE) ama kısıtlarını DEVRALMAZ: politika "TO probata_musteri" personel işlemine
-- uygulanmaz (devralsaydı kısıtlayıcı politikalar uygulama rolüne de uygulanırdı)
GRANT probata_musteri TO probata_uygulama WITH INHERIT FALSE, SET TRUE;
GRANT USAGE ON SCHEMA public TO probata_musteri;

-- işlemin müşterisi ve tesis kapsamı (src/server/db/kiraci.ts kiraciIcinde musteri seçeneği yazar; işlem bitince düşer)
CREATE OR REPLACE FUNCTION gecerli_musteri() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.musteri_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION musteri_tesis_gorur(p_tesis uuid) RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT CASE WHEN coalesce(current_setting('app.musteri_tesisler', true), '') = '' THEN true
                ELSE p_tesis = ANY (string_to_array(current_setting('app.musteri_tesisler', true), ',')::uuid[]) END $$;
-- raporun son imzalı sürümü (müşteri yalnız sonu görür — 193). Sahibin haklarıyla koşar (müşteri rolü raporun öteki sürümlerine bakamaz);
-- kiracı süzgeci açık yazılı
CREATE OR REPLACE FUNCTION musteri_son_surum(p_rapor uuid) RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT max(s.revizyon) FROM rapor_surumu s WHERE s.firma_id = gecerli_firma() AND s.rapor_id = p_rapor $$;
ALTER FUNCTION gecerli_musteri() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION musteri_tesis_gorur(uuid) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION musteri_son_surum(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION gecerli_musteri() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION musteri_tesis_gorur(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION musteri_son_surum(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION gecerli_firma(), gecerli_musteri(), musteri_tesis_gorur(uuid), musteri_son_surum(uuid) TO probata_musteri;
GRANT EXECUTE ON FUNCTION gecerli_musteri(), musteri_tesis_gorur(uuid) TO probata_uygulama;

-- panelin okuduğu tablolar: yalnız okuma
GRANT SELECT ON firma, musteri, tesis, ekipman, ekipman_turu, rapor_surumu, uygunsuzluk, dosya TO probata_musteri;

-- kısıtlayıcı politikalar (kiracı politikasıyla VE'lenir): kendi müşterisi · kendi tesis kapsamı · müşteriye açık
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'musteri' AND policyname = 'musteri_musteri') THEN
    CREATE POLICY musteri_musteri ON musteri AS RESTRICTIVE FOR SELECT TO probata_musteri USING (id = gecerli_musteri());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tesis' AND policyname = 'tesis_musteri') THEN
    CREATE POLICY tesis_musteri ON tesis AS RESTRICTIVE FOR SELECT TO probata_musteri USING (musteri_id = gecerli_musteri() AND musteri_tesis_gorur(id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ekipman' AND policyname = 'ekipman_musteri') THEN
    -- tesis alt sorgusu da müşteri politikasından geçer (kendi tesis kapsamı)
    CREATE POLICY ekipman_musteri ON ekipman AS RESTRICTIVE FOR SELECT TO probata_musteri USING (EXISTS (SELECT 1 FROM tesis t WHERE t.id = ekipman.tesis_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapor_surumu' AND policyname = 'rapor_surumu_musteri') THEN
    CREATE POLICY rapor_surumu_musteri ON rapor_surumu AS RESTRICTIVE FOR SELECT TO probata_musteri
      USING (musteri_id = gecerli_musteri() AND musteri_tesis_gorur(tesis_id) AND revizyon = musteri_son_surum(rapor_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uygunsuzluk' AND policyname = 'uygunsuzluk_musteri') THEN
    CREATE POLICY uygunsuzluk_musteri ON uygunsuzluk AS RESTRICTIVE FOR SELECT TO probata_musteri
      USING (musteri_id = gecerli_musteri() AND musteri_tesis_gorur(tesis_id) AND kapanis IS DISTINCT FROM 'revizyon');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dosya' AND policyname = 'dosya_musteri') THEN
    -- yalnız görebildiği imzalı sürümün imzalı PDF'i (rapor_surumu alt sorgusu müşteri politikasından geçer)
    CREATE POLICY dosya_musteri ON dosya AS RESTRICTIVE FOR SELECT TO probata_musteri
      USING (modul = 'rapor_imzali' AND cop IS NULL AND EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.imzali_dosya = dosya.id));
  END IF;
END $$;
