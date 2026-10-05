-- ══ 0024 · PLAN İÇİ (maket planlarim.html 4.–5. tur; pkproje §3.4 "Plan içi bir akıştır", "Plan künyesi"; karar 26–28) ══
-- AKIŞ: Kabul bekliyor → (Kabul et: tarafsızlık beyanı | Reddet: gerekçe) → Kabul edildi → (ilk rapor) Denetimde → kontrol listesi tamamlandı →
-- Tamamlandı ⇄ (Tamamlamayı geri al) Denetimde. Geçişler ve zaman damgaları VERİTABANINDA: kod başka geçiş yapamaz, tarih / kişi uyduramaz
-- (kabul eden ve reddeden hesap işlem bağlamından — 0003 deseni). Kabul anındaki beyan METNİ plana yazılır ve değişmez (karar 26: firma metni
-- sonradan değişse de kabul edilen sürüm kayıtta). Red gerekçesi değişmez.
-- PLAN EKİPMANI: planın baktığı ekipman (tesisin kalıcı kaydından); plan açılırken tesisin etkin ekipmanı, denetimde eklenenler "sonradan".
-- Ekipman planın tesisinde olmalı; tamamlanmış / reddedilmiş plana eklenmez. Silinmez.
-- KÜNYE SÜRÜMÜ: planlamacı künyeyi (firma adı, adres, SGK, İSG-KATİP ID) değiştirince sürüm artar; denetçinin gördüğü künye plan_ekip.gorulen'de
-- kalır, denetçi Güncelle'ye basınca yeni künyeye geçer (kendiliğinden geçmez).
-- PROJE NOTLARI: plandaki denetçiler ve planlama ekibi yazar; not değişmez, silinmez (yalnız SELECT, INSERT). ⛔ Her göç IDEMPOTENT.
ALTER TABLE plan ADD COLUMN IF NOT EXISTS kabul timestamptz;
ALTER TABLE plan ADD COLUMN IF NOT EXISTS kabul_eden text CHECK (kabul_eden IS NULL OR length(kabul_eden) BETWEEN 1 AND 200);
ALTER TABLE plan ADD COLUMN IF NOT EXISTS kabul_hesap uuid;
ALTER TABLE plan ADD COLUMN IF NOT EXISTS beyan text CHECK (beyan IS NULL OR length(beyan) BETWEEN 20 AND 4000);
ALTER TABLE plan ADD COLUMN IF NOT EXISTS red timestamptz;
ALTER TABLE plan ADD COLUMN IF NOT EXISTS red_eden text CHECK (red_eden IS NULL OR length(red_eden) BETWEEN 1 AND 200);
ALTER TABLE plan ADD COLUMN IF NOT EXISTS red_hesap uuid;
ALTER TABLE plan ADD COLUMN IF NOT EXISTS red_gerekce text CHECK (red_gerekce IS NULL OR length(red_gerekce) BETWEEN 3 AND 500);
ALTER TABLE plan ADD COLUMN IF NOT EXISTS basladi timestamptz;
ALTER TABLE plan ADD COLUMN IF NOT EXISTS kontrol_tamam timestamptz;
ALTER TABLE plan ADD COLUMN IF NOT EXISTS bitti timestamptz;
ALTER TABLE plan ADD COLUMN IF NOT EXISTS kunye_surum integer NOT NULL DEFAULT 0 CHECK (kunye_surum >= 0);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_kabul_tutarli') THEN
    ALTER TABLE plan ADD CONSTRAINT plan_kabul_tutarli
      CHECK (durum IN ('bekliyor', 'reddedildi') OR (kabul IS NOT NULL AND kabul_eden IS NOT NULL AND beyan IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_red_tutarli') THEN
    ALTER TABLE plan ADD CONSTRAINT plan_red_tutarli
      CHECK (durum <> 'reddedildi' OR (red IS NOT NULL AND red_eden IS NOT NULL AND red_gerekce IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_bitis_tutarli') THEN
    ALTER TABLE plan ADD CONSTRAINT plan_bitis_tutarli
      CHECK ((durum = 'tamamlandi') = (bitti IS NOT NULL) AND (durum <> 'tamamlandi' OR kontrol_tamam IS NOT NULL)
        AND (kontrol_tamam IS NULL OR durum IN ('denetimde', 'tamamlandi')));
  END IF;
END $$;

-- geçişler ve damgalar: yeni plan yalnız "kabul bekliyor"; damgalar elle yazılmaz; beyan / kabul eden / red gerekçesi değişmez
CREATE OR REPLACE FUNCTION plan_akis() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE hesap uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'bekliyor' OR NEW.kabul IS NOT NULL OR NEW.red IS NOT NULL OR NEW.basladi IS NOT NULL OR NEW.kontrol_tamam IS NOT NULL
      OR NEW.bitti IS NOT NULL OR NEW.beyan IS NOT NULL OR NEW.kabul_eden IS NOT NULL OR NEW.red_eden IS NOT NULL OR NEW.red_gerekce IS NOT NULL OR NEW.kunye_surum <> 0 THEN
      RAISE EXCEPTION 'yeni plan "kabul bekliyor" açılır' USING ERRCODE = '23514';
    END IF;
    NEW.kabul_hesap := NULL; NEW.red_hesap := NULL;
    RETURN NEW;
  END IF;
  IF (OLD.beyan IS NOT NULL AND NEW.beyan IS DISTINCT FROM OLD.beyan) OR (OLD.kabul_eden IS NOT NULL AND NEW.kabul_eden IS DISTINCT FROM OLD.kabul_eden)
    OR (OLD.red_gerekce IS NOT NULL AND NEW.red_gerekce IS DISTINCT FROM OLD.red_gerekce) OR (OLD.red_eden IS NOT NULL AND NEW.red_eden IS DISTINCT FROM OLD.red_eden)
    OR NEW.kunye_surum < OLD.kunye_surum THEN
    RAISE EXCEPTION 'kabul beyanı, red gerekçesi ve künye geçmişi değişmez' USING ERRCODE = '23514';
  END IF;
  NEW.kabul := OLD.kabul; NEW.red := OLD.red; NEW.basladi := OLD.basladi; NEW.bitti := OLD.bitti;
  NEW.kabul_hesap := OLD.kabul_hesap; NEW.red_hesap := OLD.red_hesap;
  -- beyan ve kabul eden yalnız kabul geçişinde, red bilgisi yalnız red geçişinde yazılır (geçişsiz uydurulamaz)
  IF (NEW.beyan IS DISTINCT FROM OLD.beyan OR NEW.kabul_eden IS DISTINCT FROM OLD.kabul_eden) AND NOT (OLD.durum = 'bekliyor' AND NEW.durum = 'kabul') THEN
    RAISE EXCEPTION 'tarafsızlık beyanı yalnız kabulde yazılır' USING ERRCODE = '23514';
  END IF;
  IF (NEW.red_gerekce IS DISTINCT FROM OLD.red_gerekce OR NEW.red_eden IS DISTINCT FROM OLD.red_eden) AND NOT (OLD.durum = 'bekliyor' AND NEW.durum = 'reddedildi') THEN
    RAISE EXCEPTION 'red gerekçesi yalnız redde yazılır' USING ERRCODE = '23514';
  END IF;
  -- plan yalnız kontrol listesi ÖNCEDEN tamamlanmışsa tamamlanır (aynı yazmada ikisi birden olmaz)
  IF NEW.durum = 'tamamlandi' AND OLD.durum = 'denetimde' AND OLD.kontrol_tamam IS NULL THEN
    RAISE EXCEPTION 'önce kontrol listesi tamamlanmalı' USING ERRCODE = '23514';
  END IF;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF NOT ((OLD.durum = 'bekliyor' AND NEW.durum IN ('kabul', 'reddedildi')) OR (OLD.durum = 'kabul' AND NEW.durum = 'denetimde')
      OR (OLD.durum = 'denetimde' AND NEW.durum = 'tamamlandi') OR (OLD.durum = 'tamamlandi' AND NEW.durum = 'denetimde')) THEN
      RAISE EXCEPTION 'plan % durumundan % durumuna geçemez', OLD.durum, NEW.durum USING ERRCODE = '23514';
    END IF;
    IF NEW.durum = 'kabul' THEN NEW.kabul := now(); NEW.kabul_hesap := hesap;
    ELSIF NEW.durum = 'reddedildi' THEN NEW.red := now(); NEW.red_hesap := hesap;
    ELSIF NEW.durum = 'tamamlandi' THEN NEW.bitti := now();
    ELSIF OLD.durum = 'kabul' THEN NEW.basladi := now();
    ELSE NEW.bitti := NULL; NEW.kontrol_tamam := NULL;   -- tamamlama geri alındı: plan yeniden denetime, kontrol listesi yeniden açık
    END IF;
  END IF;
  -- kontrol listesi: işaretlenince zaman veritabanından; işaretliyken zamanı değişmez
  IF NEW.kontrol_tamam IS NOT NULL THEN
    IF OLD.kontrol_tamam IS NULL THEN NEW.kontrol_tamam := now(); ELSE NEW.kontrol_tamam := OLD.kontrol_tamam; END IF;
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION plan_akis() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION plan_akis() FROM PUBLIC;
CREATE OR REPLACE TRIGGER plan_akis BEFORE INSERT OR UPDATE ON plan FOR EACH ROW EXECUTE FUNCTION plan_akis();

ALTER TABLE plan_ekip ADD COLUMN IF NOT EXISTS kunye_surum integer NOT NULL DEFAULT 0 CHECK (kunye_surum >= 0);
ALTER TABLE plan_ekip ADD COLUMN IF NOT EXISTS gorulen jsonb CHECK (gorulen IS NULL OR (jsonb_typeof(gorulen) = 'object' AND pg_column_size(gorulen) <= 4000));

CREATE TABLE IF NOT EXISTS plan_ekipman (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  plan_id      uuid NOT NULL,
  ekipman_id   uuid NOT NULL,
  sonradan     boolean NOT NULL DEFAULT false,
  ekleyen      text NOT NULL CHECK (length(ekleyen) BETWEEN 1 AND 200),
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id),
  FOREIGN KEY (firma_id, ekipman_id) REFERENCES ekipman (firma_id, id),
  UNIQUE (firma_id, plan_id, ekipman_id),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS plan_ekipman_ekipman ON plan_ekipman (firma_id, ekipman_id);
ALTER TABLE plan_ekipman ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_ekipman FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_ekipman' AND policyname = 'plan_ekipman_kiraci') THEN
    CREATE POLICY plan_ekipman_kiraci ON plan_ekipman USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
-- ekipman planın tesisinde olmalı; tamamlanmış ya da reddedilmiş plana ekipman eklenmez
CREATE OR REPLACE FUNCTION plan_ekipman_denetle() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE d text;
BEGIN
  -- plan satırı paylaşımlı kilitle okunur: aynı anda süren tamamlama bitene dek beklenir, sonra güncel durum görülür
  SELECT p.durum INTO d FROM plan p JOIN ekipman e ON e.firma_id = p.firma_id AND e.tesis_id = p.tesis_id
    WHERE p.firma_id = NEW.firma_id AND p.id = NEW.plan_id AND e.id = NEW.ekipman_id FOR SHARE OF p;
  IF d IS NULL THEN RAISE EXCEPTION 'ekipman planın tesisinde değil' USING ERRCODE = '23514'; END IF;
  IF d IN ('tamamlandi', 'reddedildi') THEN RAISE EXCEPTION 'tamamlanmış ya da reddedilmiş plana ekipman eklenmez' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION plan_ekipman_denetle() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION plan_ekipman_denetle() FROM PUBLIC;
CREATE OR REPLACE TRIGGER plan_ekipman_denetle BEFORE INSERT OR UPDATE OF plan_id, ekipman_id ON plan_ekipman FOR EACH ROW EXECUTE FUNCTION plan_ekipman_denetle();
-- 0023 ile açılmış ve henüz ekipman satırı olmayan planlara tesisin etkin ekipmanı (yalnız bir kez: satırı olan plana dokunulmaz)
INSERT INTO plan_ekipman (firma_id, plan_id, ekipman_id, ekleyen)
  SELECT p.firma_id, p.id, e.id, p.acan FROM plan p JOIN ekipman e ON e.firma_id = p.firma_id AND e.tesis_id = p.tesis_id AND e.pasif IS NULL
  WHERE p.durum NOT IN ('tamamlandi', 'reddedildi') AND NOT EXISTS (SELECT 1 FROM plan_ekipman x WHERE x.firma_id = p.firma_id AND x.plan_id = p.id)
  ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS plan_not (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  plan_id      uuid NOT NULL,
  metin        text NOT NULL CHECK (length(metin) BETWEEN 1 AND 500),
  yazan        text NOT NULL CHECK (length(yazan) BETWEEN 1 AND 200),
  yazan_hesap  uuid,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS plan_not_plan ON plan_not (firma_id, plan_id, olustu DESC);
ALTER TABLE plan_not ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_not FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_not' AND policyname = 'plan_not_kiraci') THEN
    CREATE POLICY plan_not_kiraci ON plan_not USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
-- yazan hesap ve zaman işlem bağlamından; kod uyduramaz
CREATE OR REPLACE FUNCTION plan_not_damga() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NEW.yazan_hesap := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  NEW.olustu := now(); NEW.degisti := now();
  RETURN NEW;
END $$;
ALTER FUNCTION plan_not_damga() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION plan_not_damga() FROM PUBLIC;
CREATE OR REPLACE TRIGGER plan_not_damga BEFORE INSERT ON plan_not FOR EACH ROW EXECUTE FUNCTION plan_not_damga();

GRANT SELECT, INSERT ON plan_ekipman, plan_not TO probata_uygulama;
