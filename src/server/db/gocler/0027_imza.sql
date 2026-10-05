-- ══ 0027 · SON İMZA — indir, imzala, yükle (KOD-GECIS §5 Rapor; karar 99 her rapor ayrı, 104 imzalanınca müşteriye açılır, 114 sonraki imzalı
-- rapor öncekinin uygunsuzluklarını kapatır, 187 / 09-F1 imzalı sürüm değişmez; §3.2-8 imzalı raporda bağlam KOPYALANIR) ══
-- İMZA İSTEĞİ: muayene uzmanı "İmzala" deyince onaylanmış raporun KESİN İMZASIZ PDF'i üretilir ve saklanır (dosya modülü rapor_pdf, kayıt =
-- rapor), SHA-256'sı istekte. Rapor × revizyon başına tek bekleyen istek. İMZALI SÜRÜM (rapor_surumu): yüklenen imzalı PDF (rapor_imzali) +
-- imza anının kopyaları (künye, yazan, cihazlar, içerik) — DEĞİŞMEZ: güncelleme ve silme reddedilir, uygulamanın yalnız okuma ve ekleme hakkı
-- var; bağlam (plan, ekipman, tür, format, tesis, müşteri, sonuç, tarihler) raporun kendisinden TETİKLE yazılır, istemci uyduramaz. Rapor
-- Tamamlandı'ya (imzali) yalnız o revizyonun imzalı sürümü varsa geçer. UYGUNSUZLUK: imzalı ve "Uygun" olmayan rapordan doğar; aynı ekipmanın
-- sonraki imzalı sürümü açık olanları "giderildi" diye kapatır (tetik). Mobil imza ve e-imza aracı sonraki faz (yontem şimdiden taşınır).
-- ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS imza_istegi (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  rapor_id      uuid NOT NULL,
  revizyon      integer NOT NULL DEFAULT 0,
  yontem        text NOT NULL DEFAULT 'dosya' CHECK (yontem IN ('dosya', 'mobil', 'e_imza')),
  durum         text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'tamam', 'iptal', 'sure_doldu')),
  pdf_dosya     uuid NOT NULL,
  pdf_sha256    text NOT NULL CHECK (pdf_sha256 ~ '^[0-9a-f]{64}$'),
  imzali_dosya  uuid,
  hesap_id      uuid,
  kapandi       timestamptz,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, rapor_id) REFERENCES rapor (firma_id, id),
  UNIQUE (firma_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS imza_istegi_bekleyen ON imza_istegi (firma_id, rapor_id, revizyon) WHERE durum = 'bekliyor';
ALTER TABLE imza_istegi ENABLE ROW LEVEL SECURITY;
ALTER TABLE imza_istegi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'imza_istegi' AND policyname = 'imza_istegi_kiraci') THEN
    CREATE POLICY imza_istegi_kiraci ON imza_istegi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
CREATE OR REPLACE FUNCTION imza_istegi_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'bekliyor' OR NEW.imzali_dosya IS NOT NULL OR NEW.kapandi IS NOT NULL THEN RAISE EXCEPTION 'imza isteği bekliyor açılır' USING ERRCODE = '23514'; END IF;
    IF NOT EXISTS (SELECT 1 FROM rapor r WHERE r.firma_id = NEW.firma_id AND r.id = NEW.rapor_id AND r.durum = 'onaylandi' AND r.revizyon = NEW.revizyon AND r.silindi IS NULL) THEN
      RAISE EXCEPTION 'imza isteği yalnız onaylanmış rapora açılır' USING ERRCODE = '23514';
    END IF;
    -- imzasız PDF bu firmanın, bu raporun kesin PDF'i (dosya kimliği istemciden uydurulamaz)
    IF NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.pdf_dosya AND d.modul = 'rapor_pdf' AND d.kayit_id = NEW.rapor_id
                   AND d.sha256 = NEW.pdf_sha256 AND d.cop IS NULL) THEN
      RAISE EXCEPTION 'imzasız PDF bu raporun değil' USING ERRCODE = '23514';
    END IF;
    NEW.hesap_id := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
    RETURN NEW;
  END IF;
  IF NEW.rapor_id IS DISTINCT FROM OLD.rapor_id OR NEW.revizyon IS DISTINCT FROM OLD.revizyon OR NEW.yontem IS DISTINCT FROM OLD.yontem
    OR NEW.pdf_dosya IS DISTINCT FROM OLD.pdf_dosya OR NEW.pdf_sha256 IS DISTINCT FROM OLD.pdf_sha256 OR NEW.hesap_id IS DISTINCT FROM OLD.hesap_id
    OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'imza isteğinin raporu, PDF''i ve sahibi değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum <> 'bekliyor' THEN RAISE EXCEPTION 'kapanmış imza isteği değişmez' USING ERRCODE = '23514'; END IF;
  IF NEW.durum = 'tamam' AND (NEW.imzali_dosya IS NULL OR NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.imzali_dosya
    AND d.modul = 'rapor_imzali' AND d.kayit_id = NEW.rapor_id AND d.cop IS NULL)) THEN
    RAISE EXCEPTION 'imzalı PDF bu raporun değil' USING ERRCODE = '23514';
  END IF;
  IF NEW.durum <> 'bekliyor' THEN NEW.kapandi := now(); END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION imza_istegi_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION imza_istegi_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER imza_istegi_koru BEFORE INSERT OR UPDATE ON imza_istegi FOR EACH ROW EXECUTE FUNCTION imza_istegi_koru();
GRANT SELECT, INSERT, UPDATE ON imza_istegi TO probata_uygulama;

CREATE TABLE IF NOT EXISTS rapor_surumu (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id         uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  rapor_id         uuid NOT NULL,
  revizyon         integer NOT NULL DEFAULT 0,
  no               text NOT NULL,
  plan_id          uuid NOT NULL,
  ekipman_id       uuid NOT NULL,
  tur_id           uuid NOT NULL,
  format_id        uuid NOT NULL,
  tesis_id         uuid NOT NULL,
  musteri_id       uuid NOT NULL,
  imzasiz_dosya    uuid NOT NULL,
  imzali_dosya     uuid NOT NULL,
  imzali_sha256    text NOT NULL CHECK (imzali_sha256 ~ '^[0-9a-f]{64}$'),
  imza_yontem      text NOT NULL CHECK (imza_yontem IN ('dosya', 'mobil', 'e_imza')),
  imzalandi        timestamptz NOT NULL DEFAULT now(),
  imzalayan_hesap  uuid,
  sonuc            text CHECK (sonuc IS NULL OR sonuc IN ('uygun', 'uygun_degil')),
  kontrol_tarihi   date,
  sonraki          date,
  kunye            jsonb NOT NULL CHECK (jsonb_typeof(kunye) = 'object'),
  personel         jsonb NOT NULL CHECK (jsonb_typeof(personel) = 'object'),
  cihazlar         jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(cihazlar) = 'array'),
  icerik           jsonb NOT NULL CHECK (jsonb_typeof(icerik) = 'object' AND pg_column_size(icerik) <= 2000000),
  surum            integer NOT NULL DEFAULT 0,
  olustu           timestamptz NOT NULL DEFAULT now(),
  degisti          timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, rapor_id) REFERENCES rapor (firma_id, id),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, rapor_id, revizyon),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS rapor_surumu_ekipman ON rapor_surumu (firma_id, ekipman_id, imzalandi DESC);
CREATE INDEX IF NOT EXISTS rapor_surumu_musteri ON rapor_surumu (firma_id, musteri_id, tesis_id);
ALTER TABLE rapor_surumu ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_surumu FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapor_surumu' AND policyname = 'rapor_surumu_kiraci') THEN
    CREATE POLICY rapor_surumu_kiraci ON rapor_surumu USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
CREATE OR REPLACE FUNCTION rapor_surumu_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'imzalı sürüm değişmez (düzeltme revizyonla)' USING ERRCODE = '23514'; END IF;
  -- bağlam raporun kendisinden: istemci plan / ekipman / müşteri / sonuç uyduramaz
  SELECT x.no, x.plan_id, x.ekipman_id, x.tur_id, x.format_id, x.durum, x.revizyon, x.sonuc, x.rapor_tarihi, x.sonraki, p.tesis_id, t.musteri_id INTO r
    FROM rapor x JOIN plan p ON p.firma_id = x.firma_id AND p.id = x.plan_id JOIN tesis t ON t.firma_id = p.firma_id AND t.id = p.tesis_id
    WHERE x.firma_id = NEW.firma_id AND x.id = NEW.rapor_id AND x.silindi IS NULL FOR UPDATE OF x;
  IF r IS NULL OR r.durum NOT IN ('onaylandi', 'imzada') OR r.revizyon <> NEW.revizyon THEN
    RAISE EXCEPTION 'imzalı sürüm yalnız onaylanmış raporun kendi revizyonuna yazılır' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.imzali_dosya AND d.modul = 'rapor_imzali' AND d.kayit_id = NEW.rapor_id
                 AND d.sha256 = NEW.imzali_sha256 AND d.cop IS NULL)
    OR NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.imzasiz_dosya AND d.modul = 'rapor_pdf' AND d.kayit_id = NEW.rapor_id AND d.cop IS NULL) THEN
    RAISE EXCEPTION 'imzalı sürümün dosyaları bu raporun değil' USING ERRCODE = '23514';
  END IF;
  NEW.no := CASE WHEN r.revizyon = 0 THEN r.no ELSE r.no || '-R' || r.revizyon END;
  NEW.plan_id := r.plan_id; NEW.ekipman_id := r.ekipman_id; NEW.tur_id := r.tur_id; NEW.format_id := r.format_id;
  NEW.tesis_id := r.tesis_id; NEW.musteri_id := r.musteri_id; NEW.sonuc := r.sonuc; NEW.kontrol_tarihi := r.rapor_tarihi; NEW.sonraki := r.sonraki;
  NEW.imzalandi := now(); NEW.imzalayan_hesap := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  RETURN NEW;
END $$;
ALTER FUNCTION rapor_surumu_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_surumu_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_surumu_koru BEFORE INSERT OR UPDATE OR DELETE ON rapor_surumu FOR EACH ROW EXECUTE FUNCTION rapor_surumu_koru();
GRANT SELECT, INSERT ON rapor_surumu TO probata_uygulama;

CREATE TABLE IF NOT EXISTS uygunsuzluk (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id       uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  surum_id       uuid NOT NULL,
  rapor_id       uuid NOT NULL,
  ekipman_id     uuid NOT NULL,
  tesis_id       uuid NOT NULL,
  musteri_id     uuid NOT NULL,
  kaynak         text NOT NULL CHECK (kaynak IN ('madde', 'olcum', 'test')),
  ref            text NOT NULL CHECK (length(ref) BETWEEN 1 AND 60),
  metin          text NOT NULL CHECK (length(metin) BETWEEN 1 AND 1200),
  agir           boolean NOT NULL DEFAULT false,
  tarih          date,
  kapanis        text CHECK (kapanis IS NULL OR kapanis IN ('giderildi', 'revizyon')),
  kapatan_surum  uuid,
  kapandi        timestamptz,
  surum          integer NOT NULL DEFAULT 0,
  olustu         timestamptz NOT NULL DEFAULT now(),
  degisti        timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, surum_id) REFERENCES rapor_surumu (firma_id, id),
  CHECK ((kapanis IS NULL) = (kapandi IS NULL))
);
CREATE INDEX IF NOT EXISTS uygunsuzluk_acik ON uygunsuzluk (firma_id, ekipman_id) WHERE kapanis IS NULL;
CREATE INDEX IF NOT EXISTS uygunsuzluk_musteri ON uygunsuzluk (firma_id, musteri_id, tesis_id);
ALTER TABLE uygunsuzluk ENABLE ROW LEVEL SECURITY;
ALTER TABLE uygunsuzluk FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uygunsuzluk' AND policyname = 'uygunsuzluk_kiraci') THEN
    CREATE POLICY uygunsuzluk_kiraci ON uygunsuzluk USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
CREATE OR REPLACE FUNCTION uygunsuzluk_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE s record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- bağlam imzalı sürümden; uygunsuzluk ancak o sürüm yazıldığı işlemde, "Uygun" olmayan sürüme açılır
    SELECT x.rapor_id, x.ekipman_id, x.tesis_id, x.musteri_id, x.kontrol_tarihi, x.sonuc, x.imzalandi INTO s
      FROM rapor_surumu x WHERE x.firma_id = NEW.firma_id AND x.id = NEW.surum_id;
    IF s IS NULL OR s.imzalandi <> now() THEN RAISE EXCEPTION 'uygunsuzluk yalnız imzalanan sürümle birlikte açılır' USING ERRCODE = '23514'; END IF;
    NEW.rapor_id := s.rapor_id; NEW.ekipman_id := s.ekipman_id; NEW.tesis_id := s.tesis_id; NEW.musteri_id := s.musteri_id; NEW.tarih := s.kontrol_tarihi;
    NEW.kapanis := NULL; NEW.kapatan_surum := NULL; NEW.kapandi := NULL;
    RETURN NEW;
  END IF;
  IF NEW.surum_id IS DISTINCT FROM OLD.surum_id OR NEW.rapor_id IS DISTINCT FROM OLD.rapor_id OR NEW.ekipman_id IS DISTINCT FROM OLD.ekipman_id
    OR NEW.tesis_id IS DISTINCT FROM OLD.tesis_id OR NEW.musteri_id IS DISTINCT FROM OLD.musteri_id OR NEW.kaynak IS DISTINCT FROM OLD.kaynak
    OR NEW.ref IS DISTINCT FROM OLD.ref OR NEW.metin IS DISTINCT FROM OLD.metin OR NEW.agir IS DISTINCT FROM OLD.agir OR NEW.tarih IS DISTINCT FROM OLD.tarih THEN
    RAISE EXCEPTION 'uygunsuzluğun içeriği değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.kapanis IS NOT NULL THEN RAISE EXCEPTION 'kapanmış uygunsuzluk değişmez' USING ERRCODE = '23514'; END IF;
  IF NEW.kapanis IS NOT NULL THEN NEW.kapandi := now(); ELSE NEW.kapandi := NULL; NEW.kapatan_surum := NULL; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION uygunsuzluk_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION uygunsuzluk_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER uygunsuzluk_koru BEFORE INSERT OR UPDATE ON uygunsuzluk FOR EACH ROW EXECUTE FUNCTION uygunsuzluk_koru();
GRANT SELECT, INSERT, UPDATE ON uygunsuzluk TO probata_uygulama;

-- aynı ekipmanın yeni imzalı sürümü öncekilerin açık uygunsuzluklarını kapatır (114): aynı raporun önceki revizyonu "revizyon", öteki "giderildi"
CREATE OR REPLACE FUNCTION rapor_surumu_sonra() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  UPDATE uygunsuzluk u SET kapanis = CASE WHEN u.rapor_id = NEW.rapor_id THEN 'revizyon' ELSE 'giderildi' END, kapatan_surum = NEW.id, surum = u.surum + 1, degisti = now()
    WHERE u.firma_id = NEW.firma_id AND u.ekipman_id = NEW.ekipman_id AND u.kapanis IS NULL AND u.surum_id <> NEW.id;
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_surumu_sonra() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_surumu_sonra() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_surumu_sonra AFTER INSERT ON rapor_surumu FOR EACH ROW EXECUTE FUNCTION rapor_surumu_sonra();

-- RAPOR AKIŞI: onaylandı → Tamamlandı yalnız o revizyonun imzalı sürümü varsa; onay damgası tamamlanınca da kalır (0026'nın işlevi + imza)
CREATE OR REPLACE FUNCTION rapor_akis() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE hesap uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'taslak' OR NEW.revizyon <> 0 OR NEW.gonderildi IS NOT NULL OR NEW.ilk_gonderim IS NOT NULL OR NEW.silindi IS NOT NULL
      OR NEW.onay IS NOT NULL OR NEW.onay_hesap IS NOT NULL THEN
      RAISE EXCEPTION 'yeni rapor "Yeni" açılır' USING ERRCODE = '23514';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM rapor_format f WHERE f.firma_id = NEW.firma_id AND f.id = NEW.format_id AND f.tur_id = NEW.tur_id AND f.durum = 'yayinda') THEN
      RAISE EXCEPTION 'rapor türün yayındaki formatıyla açılır' USING ERRCODE = '23514';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM plan_ekipman pe JOIN ekipman e ON e.firma_id = pe.firma_id AND e.id = pe.ekipman_id
                   WHERE pe.firma_id = NEW.firma_id AND pe.plan_id = NEW.plan_id AND pe.ekipman_id = NEW.ekipman_id AND e.tur_id = NEW.tur_id AND e.pasif IS NULL
                   FOR SHARE OF e) THEN
      RAISE EXCEPTION 'ekipman planda değil, pasif ya da türü uymuyor' USING ERRCODE = '23514';
    END IF;
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
  IF OLD.durum <> 'taslak' AND (NEW.cevaplar IS DISTINCT FROM OLD.cevaplar OR NEW.ekipman_bilgi IS DISTINCT FROM OLD.ekipman_bilgi OR NEW.kunye IS DISTINCT FROM OLD.kunye
    OR NEW.kunye_surum IS DISTINCT FROM OLD.kunye_surum OR NEW.bas IS DISTINCT FROM OLD.bas OR NEW.bit IS DISTINCT FROM OLD.bit OR NEW.sonraki IS DISTINCT FROM OLD.sonraki
    OR NEW.takip IS DISTINCT FROM OLD.takip OR NEW.rapor_tarihi IS DISTINCT FROM OLD.rapor_tarihi OR NEW.cihazlar IS DISTINCT FROM OLD.cihazlar
    OR NEW.fotolar IS DISTINCT FROM OLD.fotolar OR NEW.sonuc IS DISTINCT FROM OLD.sonuc OR NEW.sonuc_oto IS DISTINCT FROM OLD.sonuc_oto
    OR NEW.format_id IS DISTINCT FROM OLD.format_id) THEN
    RAISE EXCEPTION 'yalnız Yeni rapor düzenlenir' USING ERRCODE = '23514';
  END IF;
  IF NEW.durum IS DISTINCT FROM OLD.durum AND (NEW.cevaplar IS DISTINCT FROM OLD.cevaplar OR NEW.ekipman_bilgi IS DISTINCT FROM OLD.ekipman_bilgi
    OR NEW.kunye IS DISTINCT FROM OLD.kunye OR NEW.bas IS DISTINCT FROM OLD.bas OR NEW.cihazlar IS DISTINCT FROM OLD.cihazlar OR NEW.fotolar IS DISTINCT FROM OLD.fotolar
    OR NEW.format_id IS DISTINCT FROM OLD.format_id) AND NOT (OLD.durum = 'taslak' AND NEW.durum = 'onayda') THEN
    RAISE EXCEPTION 'durum değişirken rapor içeriği değişmez' USING ERRCODE = '23514';
  END IF;
  IF NEW.format_id IS DISTINCT FROM OLD.format_id AND NOT EXISTS (
    SELECT 1 FROM rapor_format y JOIN rapor_format e ON e.firma_id = y.firma_id AND e.id = OLD.format_id
    WHERE y.firma_id = NEW.firma_id AND y.id = NEW.format_id AND y.tur_id = NEW.tur_id AND y.durum IN ('yayinda', 'eski') AND y.sira > e.sira) THEN
    RAISE EXCEPTION 'rapor formatı yalnız türün daha yeni yayınlanmış sürümüne geçer' USING ERRCODE = '23514';
  END IF;
  NEW.gonderildi := OLD.gonderildi; NEW.ilk_gonderim := OLD.ilk_gonderim; NEW.onay := OLD.onay; NEW.onay_hesap := OLD.onay_hesap;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    -- açılan geçişler: Yeni · onayda · onaylandı arasında (0026) ve onaylandı → Tamamlandı (imza, yalnız imzalı sürümle)
    IF NOT ((OLD.durum IN ('taslak', 'onayda', 'onaylandi') AND NEW.durum IN ('taslak', 'onayda', 'onaylandi'))
            OR (OLD.durum = 'onaylandi' AND NEW.durum = 'imzali')) THEN
      RAISE EXCEPTION 'rapor % durumundan % durumuna geçemez', OLD.durum, NEW.durum USING ERRCODE = '23514';
    END IF;
    IF NEW.durum = 'imzali' AND NOT EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.firma_id = NEW.firma_id AND s.rapor_id = NEW.id AND s.revizyon = NEW.revizyon) THEN
      RAISE EXCEPTION 'imzalı sürüm olmadan rapor tamamlanmaz' USING ERRCODE = '23514';
    END IF;
    IF NEW.durum = 'taslak' AND length(btrim(coalesce(current_setting('app.gerekce', true), ''))) < 10 THEN
      RAISE EXCEPTION 'denetçiye dönen raporda gerekçe en az 10 karakter' USING ERRCODE = '23514';
    END IF;
    IF NEW.durum = 'taslak' THEN
      NEW.gonderildi := NULL;
    ELSIF OLD.durum = 'taslak' THEN
      NEW.gonderildi := now(); NEW.ilk_gonderim := coalesce(OLD.ilk_gonderim, now());
    END IF;
    IF NEW.durum = 'onaylandi' THEN NEW.onay := now(); NEW.onay_hesap := hesap;
    ELSIF NEW.durum IN ('taslak', 'onayda') THEN NEW.onay := NULL; NEW.onay_hesap := NULL; END IF;
  END IF;
  IF NEW.silindi IS NOT NULL THEN
    IF NEW.durum <> 'taslak' OR NEW.revizyon <> 0 THEN RAISE EXCEPTION 'yalnız Yeni rapor silinir' USING ERRCODE = '23514'; END IF;
    NEW.silindi := now();
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION rapor_akis() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_akis() FROM PUBLIC;

CREATE OR REPLACE FUNCTION rapor_hareket_yaz() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE g text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne) VALUES (NEW.firma_id, NEW.id, NEW.revizyon, NULL, NEW.durum, 'olustur');
  ELSIF NEW.silindi IS NOT NULL AND OLD.silindi IS NULL THEN
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne) VALUES (NEW.firma_id, NEW.id, NEW.revizyon, OLD.durum, NEW.durum, 'sil');
  ELSIF NEW.durum IS DISTINCT FROM OLD.durum THEN
    g := left(NULLIF(btrim(coalesce(current_setting('app.gerekce', true), '')), ''), 400);
    PERFORM set_config('app.gerekce', '', true);
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne, gerekce)
      VALUES (NEW.firma_id, NEW.id, NEW.revizyon, OLD.durum, NEW.durum,
        CASE WHEN OLD.durum = 'taslak' AND NEW.durum = 'onayda' THEN 'gonder'
             WHEN OLD.durum = 'onayda' AND NEW.durum = 'onaylandi' THEN 'onay'
             WHEN OLD.durum = 'onaylandi' AND NEW.durum = 'onayda' THEN 'onay_geri'
             WHEN NEW.durum = 'imzali' THEN 'imza'
             WHEN NEW.durum = 'taslak' THEN 'geri'
             ELSE 'durum' END, g);
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_hareket_yaz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_hareket_yaz() FROM PUBLIC;
