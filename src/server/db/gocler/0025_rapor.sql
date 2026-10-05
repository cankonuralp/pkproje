-- ══ 0025 · RAPOR (saha raporu; modül 14 Raporlar; maket rapor.html M8; KOD-GECIS §3 "Saha ve rapor", §5 Rapor, §6, §9 ENGEL 1–7; RAPOR-FORMAT §7) ══
-- Rapor, plandaki bir ekipmanın o plandaki muayenesidir: plan × ekipman başına TEK etkin rapor (2026-09-30, 203; silinen sayılmaz). Numara
-- XX-AAYY-SIRA-EK sunucuda (numara.ts), firmada eşsiz; revizyon eki rapor no'da değil (R1 … revizyon sütununda, imzalı sürümde). Rapor açıldığı FORMAT
-- SÜRÜMÜNÜ taşır — açılışta türün YAYINDAKİ sürümü (RAPOR-FORMAT §5, §7); cevaplar bölüm / alan kimlikleriyle JSON (tanim.ts Cevaplar). Künye (firma
-- adı, adres, SGK, İSG-KATİP ID, e-posta, telefon) raporun KENDİ kopyası (§3.4 "Plan künyesi": denetçinin gördüğü künyeyle açılır; planlamacının
-- değişikliği Güncelle ile gelir). Ölçüm cihazları (tür × cihaz) ve fotoğraflar raporda JSON. Başlangıç zamanı rapor açılınca yazılır; bitiş,
-- sonraki kontrol ve rapor tarihi elle seçilmediyse Onaya gönderde (sunucu).
-- DURUM kodları sabit tanımlarla aynı (src/tanim/veri.ts durumlar.rapor): taslak "Yeni" → onayda "Teknik yönetici onayında" → onaylandi "Muayene uzmanı
-- imzası" → imzada "İmzaya gönderildi" → imzali "Tamamlandı". Bu göç YALNIZ uygulanan geçişi açar (taslak → onayda); Onaylar / imza / revizyon
-- kalemleri kendi geçişlerini kendi göçleriyle ekler. İçerik yalnız taslakta değişir; tamamlanan değişmez (ENGEL 6). Yazan hesap, gönderme zamanı ve
-- silme zamanı VERİTABANINDA; her geçiş rapor_hareket'e tetikle yazılır (elle yazılamaz). Raporda pasif yok (N11): Sil = "silindi" damgası (yalnız
-- Yeni, revizyonsuz). ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS rapor (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no            text NOT NULL CHECK (no ~ '^[A-Z]{2}-[0-9]{4}-[0-9]{3,}-[0-9a-f]{5}$'),
  revizyon      integer NOT NULL DEFAULT 0 CHECK (revizyon BETWEEN 0 AND 999),
  plan_id       uuid NOT NULL,
  ekipman_id    uuid NOT NULL,
  tur_id        uuid NOT NULL,
  format_id     uuid NOT NULL,
  personel_id   uuid NOT NULL,
  hesap_id      uuid,
  durum         text NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak', 'onayda', 'onaylandi', 'imzada', 'imzali')),
  kunye         jsonb NOT NULL CHECK (jsonb_typeof(kunye) = 'object' AND pg_column_size(kunye) <= 4000),
  kunye_surum   integer NOT NULL DEFAULT 0 CHECK (kunye_surum >= 0),
  ekipman_bilgi jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(ekipman_bilgi) = 'object' AND pg_column_size(ekipman_bilgi) <= 4000),
  bas           timestamptz NOT NULL DEFAULT now(),
  bit           timestamptz,
  sonraki       date,
  takip         date,
  rapor_tarihi  date,
  cevaplar      jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(cevaplar) = 'object' AND pg_column_size(cevaplar) <= 2000000),
  cihazlar      jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(cihazlar) = 'array' AND jsonb_array_length(cihazlar) <= 50),
  fotolar       jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(fotolar) = 'array' AND jsonb_array_length(fotolar) <= 200),
  sonuc         text CHECK (sonuc IS NULL OR sonuc IN ('uygun', 'uygun_degil')),
  sonuc_oto     boolean NOT NULL DEFAULT false,
  kopya_kaynak  uuid,
  ilk_gonderim  timestamptz,
  gonderildi    timestamptz,
  silindi       timestamptz,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id),
  FOREIGN KEY (firma_id, ekipman_id) REFERENCES ekipman (firma_id, id),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id),
  FOREIGN KEY (firma_id, format_id) REFERENCES rapor_format (firma_id, id),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id),
  CHECK (bit IS NULL OR bit >= bas),
  CHECK (silindi IS NULL OR (durum = 'taslak' AND revizyon = 0))
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rapor_kopya_kaynak') THEN
    ALTER TABLE rapor ADD CONSTRAINT rapor_kopya_kaynak FOREIGN KEY (firma_id, kopya_kaynak) REFERENCES rapor (firma_id, id);
  END IF;
END $$;
-- plan × ekipman başına tek etkin rapor (silinen sayılmaz; silinince "Rapor oluştur" geri gelir)
CREATE UNIQUE INDEX IF NOT EXISTS rapor_plan_ekipman ON rapor (firma_id, plan_id, ekipman_id) WHERE silindi IS NULL;
CREATE INDEX IF NOT EXISTS rapor_plan ON rapor (firma_id, plan_id);
CREATE INDEX IF NOT EXISTS rapor_personel ON rapor (firma_id, personel_id, durum);
CREATE INDEX IF NOT EXISTS rapor_durum_tur ON rapor (firma_id, durum, tur_id);
CREATE INDEX IF NOT EXISTS rapor_ekipman ON rapor (firma_id, ekipman_id);
ALTER TABLE rapor ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapor' AND policyname = 'rapor_kiraci') THEN
    CREATE POLICY rapor_kiraci ON rapor USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- RAPOR HAREKETİ: oluştur, gönder, sil … (yalnız tetik yazar; geri gönderme geçmişi, durum şeridi ve Performans buradan)
CREATE TABLE IF NOT EXISTS rapor_hareket (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  rapor_id  uuid NOT NULL,
  revizyon  integer NOT NULL DEFAULT 0,
  eski      text,
  yeni      text,
  ne        text NOT NULL CHECK (ne ~ '^[a-z_]{2,20}$'),
  gerekce   text CHECK (gerekce IS NULL OR length(gerekce) <= 400),
  hesap_id  uuid,
  zaman     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, rapor_id) REFERENCES rapor (firma_id, id)
);
CREATE INDEX IF NOT EXISTS rapor_hareket_rapor ON rapor_hareket (firma_id, rapor_id, zaman);
ALTER TABLE rapor_hareket ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_hareket FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapor_hareket' AND policyname = 'rapor_hareket_kiraci') THEN
    CREATE POLICY rapor_hareket_kiraci ON rapor_hareket USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
CREATE OR REPLACE FUNCTION rapor_hareket_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF pg_trigger_depth() < 2 THEN RAISE EXCEPTION 'rapor hareketi elle yazılmaz' USING ERRCODE = '42501'; END IF;
  NEW.hesap_id := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  NEW.zaman := now();
  RETURN NEW;
END $$;
ALTER FUNCTION rapor_hareket_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_hareket_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_hareket_koru BEFORE INSERT ON rapor_hareket FOR EACH ROW EXECUTE FUNCTION rapor_hareket_koru();

-- geçişler, damgalar, değişmezlik
CREATE OR REPLACE FUNCTION rapor_akis() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE hesap uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'taslak' OR NEW.revizyon <> 0 OR NEW.gonderildi IS NOT NULL OR NEW.ilk_gonderim IS NOT NULL OR NEW.silindi IS NOT NULL THEN
      RAISE EXCEPTION 'yeni rapor "Yeni" açılır' USING ERRCODE = '23514';
    END IF;
    -- format: raporun türünün YAYINDAKİ sürümü
    IF NOT EXISTS (SELECT 1 FROM rapor_format f WHERE f.firma_id = NEW.firma_id AND f.id = NEW.format_id AND f.tur_id = NEW.tur_id AND f.durum = 'yayinda') THEN
      RAISE EXCEPTION 'rapor türün yayındaki formatıyla açılır' USING ERRCODE = '23514';
    END IF;
    -- ekipman planda, etkin ve türü raporun türü
    IF NOT EXISTS (SELECT 1 FROM plan_ekipman pe JOIN ekipman e ON e.firma_id = pe.firma_id AND e.id = pe.ekipman_id
                   WHERE pe.firma_id = NEW.firma_id AND pe.plan_id = NEW.plan_id AND pe.ekipman_id = NEW.ekipman_id AND e.tur_id = NEW.tur_id AND e.pasif IS NULL) THEN
      RAISE EXCEPTION 'ekipman planda değil, pasif ya da türü uymuyor' USING ERRCODE = '23514';
    END IF;
    -- plan kabul edilmiş (Kabul edildi, Denetimde, Tamamlandı) ve yazan planın ekibinde
    IF NOT EXISTS (SELECT 1 FROM plan p JOIN plan_ekip k ON k.firma_id = p.firma_id AND k.plan_id = p.id
                   WHERE p.firma_id = NEW.firma_id AND p.id = NEW.plan_id AND p.durum IN ('kabul', 'denetimde', 'tamamlandi') AND k.personel_id = NEW.personel_id) THEN
      RAISE EXCEPTION 'rapor yalnız kabul edilmiş planda, ekipteki denetçi adına açılır' USING ERRCODE = '23514';
    END IF;
    NEW.hesap_id := hesap;
    RETURN NEW;
  END IF;
  IF NEW.no IS DISTINCT FROM OLD.no OR NEW.plan_id IS DISTINCT FROM OLD.plan_id OR NEW.ekipman_id IS DISTINCT FROM OLD.ekipman_id
    OR NEW.tur_id IS DISTINCT FROM OLD.tur_id OR NEW.personel_id IS DISTINCT FROM OLD.personel_id OR NEW.hesap_id IS DISTINCT FROM OLD.hesap_id
    OR NEW.kopya_kaynak IS DISTINCT FROM OLD.kopya_kaynak OR NEW.revizyon IS DISTINCT FROM OLD.revizyon THEN
    RAISE EXCEPTION 'raporun numarası, planı, ekipmanı, türü ve yazanı değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'imzali' THEN
    RAISE EXCEPTION 'tamamlanan rapor değişmez (düzeltme revizyonla)' USING ERRCODE = '23514';
  END IF;
  IF OLD.silindi IS NOT NULL THEN
    RAISE EXCEPTION 'silinen rapor değişmez' USING ERRCODE = '23514';
  END IF;
  -- içerik yalnız taslakta değişir
  IF OLD.durum <> 'taslak' AND (NEW.cevaplar IS DISTINCT FROM OLD.cevaplar OR NEW.ekipman_bilgi IS DISTINCT FROM OLD.ekipman_bilgi OR NEW.kunye IS DISTINCT FROM OLD.kunye
    OR NEW.kunye_surum IS DISTINCT FROM OLD.kunye_surum OR NEW.bas IS DISTINCT FROM OLD.bas OR NEW.bit IS DISTINCT FROM OLD.bit OR NEW.sonraki IS DISTINCT FROM OLD.sonraki
    OR NEW.takip IS DISTINCT FROM OLD.takip OR NEW.rapor_tarihi IS DISTINCT FROM OLD.rapor_tarihi OR NEW.cihazlar IS DISTINCT FROM OLD.cihazlar
    OR NEW.fotolar IS DISTINCT FROM OLD.fotolar OR NEW.sonuc IS DISTINCT FROM OLD.sonuc OR NEW.sonuc_oto IS DISTINCT FROM OLD.sonuc_oto
    OR NEW.format_id IS DISTINCT FROM OLD.format_id) THEN
    RAISE EXCEPTION 'yalnız Yeni rapor düzenlenir' USING ERRCODE = '23514';
  END IF;
  -- format yalnız aynı türün daha yeni YAYINLANMIŞ sürümüne geçer ("Formatı güncelle", 211)
  IF NEW.format_id IS DISTINCT FROM OLD.format_id AND NOT EXISTS (
    SELECT 1 FROM rapor_format y JOIN rapor_format e ON e.firma_id = y.firma_id AND e.id = OLD.format_id
    WHERE y.firma_id = NEW.firma_id AND y.id = NEW.format_id AND y.tur_id = NEW.tur_id AND y.durum IN ('yayinda', 'eski') AND y.sira > e.sira) THEN
    RAISE EXCEPTION 'rapor formatı yalnız türün daha yeni yayınlanmış sürümüne geçer' USING ERRCODE = '23514';
  END IF;
  NEW.gonderildi := OLD.gonderildi; NEW.ilk_gonderim := OLD.ilk_gonderim;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF NOT (OLD.durum = 'taslak' AND NEW.durum = 'onayda') THEN
      RAISE EXCEPTION 'rapor % durumundan % durumuna geçemez', OLD.durum, NEW.durum USING ERRCODE = '23514';
    END IF;
    NEW.gonderildi := now(); NEW.ilk_gonderim := coalesce(OLD.ilk_gonderim, now());
  END IF;
  -- silme yalnız Yeni ve revizyonsuz raporda, zamanı veritabanından
  IF NEW.silindi IS NOT NULL THEN
    IF NEW.durum <> 'taslak' OR NEW.revizyon <> 0 THEN RAISE EXCEPTION 'yalnız Yeni rapor silinir' USING ERRCODE = '23514'; END IF;
    NEW.silindi := now();
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION rapor_akis() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_akis() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_akis BEFORE INSERT OR UPDATE ON rapor FOR EACH ROW EXECUTE FUNCTION rapor_akis();

-- her açılış, geçiş ve silme hareket kaydına (kod uyduramaz)
CREATE OR REPLACE FUNCTION rapor_hareket_yaz() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne) VALUES (NEW.firma_id, NEW.id, NEW.revizyon, NULL, NEW.durum, 'olustur');
  ELSIF NEW.silindi IS NOT NULL AND OLD.silindi IS NULL THEN
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne) VALUES (NEW.firma_id, NEW.id, NEW.revizyon, OLD.durum, NEW.durum, 'sil');
  ELSIF NEW.durum IS DISTINCT FROM OLD.durum THEN
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne)
      VALUES (NEW.firma_id, NEW.id, NEW.revizyon, OLD.durum, NEW.durum, CASE WHEN OLD.durum = 'taslak' AND NEW.durum = 'onayda' THEN 'gonder' ELSE 'durum' END);
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_hareket_yaz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_hareket_yaz() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_hareket_yaz AFTER INSERT OR UPDATE ON rapor FOR EACH ROW EXECUTE FUNCTION rapor_hareket_yaz();

GRANT SELECT, INSERT, UPDATE ON rapor TO probata_uygulama;
GRANT SELECT, INSERT ON rapor_hareket TO probata_uygulama;
