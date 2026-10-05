-- ══ 0029 · REVİZYON — Revize iste, reddet, geri çek; Revizeye gönder (KOD-GECIS §4 rapor_revizeye_gonder / rapor_revize_iste, §5 Rapor;
-- pkproje §11 131 V1, 141 W4 / 192, 142 W5 / 193; maket onaylar.html "Revize istekleri", raporlar.html "Revize iste") ══
-- REVİZE İSTEĞİ: raporu yazan, tamamlanan raporunda hata görürse gerekçeyle (≥ 10) ister; teknik yöneticinin önüne düşer. Rapor başına tek
-- bekleyen istek. Kapanış: yazan geri çeker · yönetici reddeder (gerekçe isteğe bağlı, denetçi görür) · rapor revizeye gönderilince kendiliğinden
-- "revize" (tetik). Kim ve ne zaman veritabanından; isteği yalnız raporu yazan açar ve geri çeker (veritabanı da ister).
-- REVİZEYE GÖNDER: Tamamlandı → Yeni, revizyon bir artar (R1, R2 …), gerekçe ≥ 10; imzalı sürüm (R0'ın PDF'i, künyesi, içeriği) rapor_surumu'nda
-- DEĞİŞMEDEN kalır; rapor yeniden onay ve imzadan geçer, yeni imzalı sürüm no-R1 olarak yazılır ve öncekinin uygunsuzluklarını "revizyon" diye
-- kapatır (0027, 0028). Müşteri revize sürerken önceki imzalı sürümü, yenisi imzalanınca yalnız onu görür (193; müşteri paneli kalemi).
-- ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS rapor_revize_istegi (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id         uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  rapor_id         uuid NOT NULL,
  revizyon         integer NOT NULL DEFAULT 0,
  gerekce          text NOT NULL CHECK (length(btrim(gerekce)) BETWEEN 10 AND 400),
  durum            text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'geri_cekildi', 'reddedildi', 'revize')),
  hesap_id         uuid,
  kapatan_hesap    uuid,
  kapanis_gerekce  text CHECK (kapanis_gerekce IS NULL OR length(kapanis_gerekce) <= 400),
  kapandi          timestamptz,
  surum            integer NOT NULL DEFAULT 0,
  olustu           timestamptz NOT NULL DEFAULT now(),
  degisti          timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, rapor_id) REFERENCES rapor (firma_id, id),
  UNIQUE (firma_id, id),
  CHECK ((durum = 'bekliyor') = (kapandi IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS rapor_revize_istegi_bekleyen ON rapor_revize_istegi (firma_id, rapor_id) WHERE durum = 'bekliyor';
CREATE INDEX IF NOT EXISTS rapor_revize_istegi_rapor ON rapor_revize_istegi (firma_id, rapor_id, olustu DESC);
ALTER TABLE rapor_revize_istegi ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_revize_istegi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapor_revize_istegi' AND policyname = 'rapor_revize_istegi_kiraci') THEN
    CREATE POLICY rapor_revize_istegi_kiraci ON rapor_revize_istegi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
CREATE OR REPLACE FUNCTION rapor_revize_istegi_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE hesap uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'bekliyor' OR NEW.kapatan_hesap IS NOT NULL OR NEW.kapanis_gerekce IS NOT NULL OR NEW.kapandi IS NOT NULL THEN
      RAISE EXCEPTION 'revize isteği bekliyor açılır' USING ERRCODE = '23514';
    END IF;
    -- yalnız raporu yazan, tamamlanmış raporun şimdiki revizyonu için
    IF hesap IS NULL OR NOT EXISTS (SELECT 1 FROM rapor r WHERE r.firma_id = NEW.firma_id AND r.id = NEW.rapor_id AND r.durum = 'imzali'
                   AND r.revizyon = NEW.revizyon AND r.silindi IS NULL AND r.hesap_id = hesap) THEN
      RAISE EXCEPTION 'revize isteğini yalnız raporu yazan, tamamlanan raporda açar' USING ERRCODE = '23514';
    END IF;
    NEW.hesap_id := hesap; NEW.olustu := now();
    RETURN NEW;
  END IF;
  IF NEW.rapor_id IS DISTINCT FROM OLD.rapor_id OR NEW.revizyon IS DISTINCT FROM OLD.revizyon OR NEW.gerekce IS DISTINCT FROM OLD.gerekce
    OR NEW.hesap_id IS DISTINCT FROM OLD.hesap_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.olustu IS DISTINCT FROM OLD.olustu THEN
    RAISE EXCEPTION 'revize isteğinin raporu, gerekçesi ve sahibi değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum <> 'bekliyor' THEN RAISE EXCEPTION 'kapanmış revize isteği değişmez' USING ERRCODE = '23514'; END IF;
  IF NEW.durum = 'bekliyor' THEN RAISE EXCEPTION 'revize isteği yalnız kapanır' USING ERRCODE = '23514'; END IF;
  IF NEW.durum = 'geri_cekildi' AND (hesap IS NULL OR hesap <> OLD.hesap_id) THEN
    RAISE EXCEPTION 'revize isteğini yalnız isteyen geri çeker' USING ERRCODE = '23514';
  END IF;
  -- "revize" yalnız rapor revizeye gönderildiyse (revizyon arttı): istemci isteği yerine getirilmiş gibi gösteremez
  IF NEW.durum = 'revize' AND NOT EXISTS (SELECT 1 FROM rapor r WHERE r.firma_id = OLD.firma_id AND r.id = OLD.rapor_id AND r.revizyon > OLD.revizyon) THEN
    RAISE EXCEPTION 'revize isteği yalnız rapor revizeye gönderilince yerine gelir' USING ERRCODE = '23514';
  END IF;
  IF NEW.durum <> 'reddedildi' THEN NEW.kapanis_gerekce := NULL; END IF;
  NEW.kapandi := now(); NEW.kapatan_hesap := hesap;
  RETURN NEW;
END $$;
ALTER FUNCTION rapor_revize_istegi_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_revize_istegi_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_revize_istegi_koru BEFORE INSERT OR UPDATE ON rapor_revize_istegi FOR EACH ROW EXECUTE FUNCTION rapor_revize_istegi_koru();
GRANT SELECT, INSERT, UPDATE ON rapor_revize_istegi TO probata_uygulama;

-- RAPOR AKIŞI (0027'nin işlevi + revizyon): Tamamlandı → Yeni yalnız revizeye gönderirken ve revizyon TAM BİR artarak (gerekçe ≥ 10, Yeni'ye
-- dönen her rapor gibi); revizyon başka hiçbir yoldan değişmez, tamamlanan rapor başka hiçbir yoldan değişmez. İçerik aynı kalır; denetçi Yeni
-- raporda düzeltir, rapor yeniden onay ve imzadan geçer, imzalı sürüm yeni revizyonla (no-R1) yazılır.
CREATE OR REPLACE FUNCTION rapor_akis() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE hesap uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  revize boolean := false;
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
    OR NEW.kopya_kaynak IS DISTINCT FROM OLD.kopya_kaynak THEN
    RAISE EXCEPTION 'raporun numarası, planı, ekipmanı, türü ve yazanı değişmez' USING ERRCODE = '23514';
  END IF;
  revize := OLD.durum = 'imzali' AND NEW.durum = 'taslak' AND NEW.revizyon = OLD.revizyon + 1;
  IF NEW.revizyon IS DISTINCT FROM OLD.revizyon AND NOT revize THEN
    RAISE EXCEPTION 'revizyon yalnız tamamlanan rapor revizeye gönderilirken bir artar' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'imzali' AND NOT revize THEN
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
    -- açılan geçişler: Yeni · onayda · onaylandı arasında (0026), onaylandı → Tamamlandı (imza, yalnız imzalı sürümle), Tamamlandı → Yeni (revize)
    IF NOT ((OLD.durum IN ('taslak', 'onayda', 'onaylandi') AND NEW.durum IN ('taslak', 'onayda', 'onaylandi'))
            OR (OLD.durum = 'onaylandi' AND NEW.durum = 'imzali') OR revize) THEN
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

-- HAREKET KAYDI (0028'in işlevi + revize): Tamamlandı → Yeni hareketi "revize" (gerekçesiyle); bekleyen revize isteği yerine gelir
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
             WHEN OLD.durum = 'imzali' AND NEW.durum = 'taslak' THEN 'revize'
             WHEN NEW.durum = 'imzali' THEN 'imza'
             WHEN NEW.durum = 'taslak' THEN 'geri'
             ELSE 'durum' END, g);
    -- onaylanmış rapor onaydan çıkınca (onayı geri al, durumu değiştir) o revizyonun bekleyen imza isteği iptal: hazırlanan PDF eski içeriği
    -- taşır, yeniden onaylanınca İmzala yeni PDF üretir
    IF OLD.durum = 'onaylandi' AND NEW.durum IN ('taslak', 'onayda') THEN
      UPDATE imza_istegi SET durum = 'iptal', surum = surum + 1, degisti = now()
        WHERE firma_id = NEW.firma_id AND rapor_id = NEW.id AND revizyon = NEW.revizyon AND durum = 'bekliyor';
    END IF;
    -- revizeye gönderilince raporun bekleyen revize isteği kapanır (istek yerine getirildi)
    IF OLD.durum = 'imzali' AND NEW.durum = 'taslak' THEN
      UPDATE rapor_revize_istegi SET durum = 'revize', surum = surum + 1, degisti = now()
        WHERE firma_id = NEW.firma_id AND rapor_id = NEW.id AND durum = 'bekliyor';
    END IF;
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_hareket_yaz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_hareket_yaz() FROM PUBLIC;
