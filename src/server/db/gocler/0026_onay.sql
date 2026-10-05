-- ══ 0026 · ONAY (Onaylar, modül 15; maket onaylar.html M9; KOD-GECIS §5 Rapor; karar 102, 190, 191; N7 vekil yok) ══
-- Teknik yönetici (türün branş yöneticisi) onay kuyruğundaki raporu ONAYLAR (onayda → onaylandi: "Muayene uzmanı imzası"), GERİ GÖNDERİR
-- (onayda → taslak, gerekçe zorunlu ≥ 10), onayı GERİ ALIR (onaylandi → onayda, 102) ya da tamamlanmamış raporun DURUMUNU DEĞİŞTİRİR (190:
-- Yeni / onayda / onaylandı arasında; Tamamlandı'ya yalnız imzayla, imzalı rapor yalnız revizeyle — 0027). Onaylandı'ya almak onay sayılır (191).
-- Yeni'ye dönen rapor denetçiye döner: gerekçe ZORUNLU (denetçi neyi düzelteceğini bilmeli), ilk gönderim korunur (performans: yazım süresi).
-- Onay zamanı ve onaylayan hesap VERİTABANINDA damgalanır; kod yazamaz. Gerekçe işlemin "app.gerekce" ayarından okunur (yalnız bu işlem için,
-- SET LOCAL karşılığı), hareket kaydına yazılır ve silinir; hareket kaydı yine yalnız tetikle yazılır. Kimin yapabileceği uygulamada (canDo
-- rapor_onayla / rapor_geri_gonder / rapor_durum_degistir; C1: kendi raporunu onaylamak engellenmez — pkproje.md §1 reisim kararı).
-- 0025'in akış tetiği yerinde kalır; burada yalnız işlevleri yenilenir. ⛔ Her göç IDEMPOTENT.
ALTER TABLE rapor ADD COLUMN IF NOT EXISTS onay timestamptz;
ALTER TABLE rapor ADD COLUMN IF NOT EXISTS onay_hesap uuid;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rapor_onay_tutarli') THEN
    -- onay damgası yalnız onaylanmış (ve sonrası: imzada, imzalı) raporda; Yeni ve onaydaki raporda yok
    ALTER TABLE rapor ADD CONSTRAINT rapor_onay_tutarli CHECK ((onay IS NULL) = (durum IN ('taslak', 'onayda')));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS rapor_kuyruk ON rapor (firma_id, durum, gonderildi DESC) WHERE silindi IS NULL;

CREATE OR REPLACE FUNCTION rapor_akis() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE hesap uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'taslak' OR NEW.revizyon <> 0 OR NEW.gonderildi IS NOT NULL OR NEW.ilk_gonderim IS NOT NULL OR NEW.silindi IS NOT NULL
      OR NEW.onay IS NOT NULL OR NEW.onay_hesap IS NOT NULL THEN
      RAISE EXCEPTION 'yeni rapor "Yeni" açılır' USING ERRCODE = '23514';
    END IF;
    -- format: raporun türünün YAYINDAKİ sürümü
    IF NOT EXISTS (SELECT 1 FROM rapor_format f WHERE f.firma_id = NEW.firma_id AND f.id = NEW.format_id AND f.tur_id = NEW.tur_id AND f.durum = 'yayinda') THEN
      RAISE EXCEPTION 'rapor türün yayındaki formatıyla açılır' USING ERRCODE = '23514';
    END IF;
    -- ekipman planda, etkin ve türü raporun türü
    IF NOT EXISTS (SELECT 1 FROM plan_ekipman pe JOIN ekipman e ON e.firma_id = pe.firma_id AND e.id = pe.ekipman_id
                   WHERE pe.firma_id = NEW.firma_id AND pe.plan_id = NEW.plan_id AND pe.ekipman_id = NEW.ekipman_id AND e.tur_id = NEW.tur_id AND e.pasif IS NULL
                   FOR SHARE OF e) THEN
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
  -- durum değişirken içerik değişmez (geri gönderen, onaylayan raporu düzenleyemez)
  IF NEW.durum IS DISTINCT FROM OLD.durum AND (NEW.cevaplar IS DISTINCT FROM OLD.cevaplar OR NEW.ekipman_bilgi IS DISTINCT FROM OLD.ekipman_bilgi
    OR NEW.kunye IS DISTINCT FROM OLD.kunye OR NEW.bas IS DISTINCT FROM OLD.bas OR NEW.cihazlar IS DISTINCT FROM OLD.cihazlar OR NEW.fotolar IS DISTINCT FROM OLD.fotolar
    OR NEW.format_id IS DISTINCT FROM OLD.format_id) AND NOT (OLD.durum = 'taslak' AND NEW.durum = 'onayda') THEN
    RAISE EXCEPTION 'durum değişirken rapor içeriği değişmez' USING ERRCODE = '23514';
  END IF;
  -- format yalnız aynı türün daha yeni YAYINLANMIŞ sürümüne geçer ("Formatı güncelle", 211)
  IF NEW.format_id IS DISTINCT FROM OLD.format_id AND NOT EXISTS (
    SELECT 1 FROM rapor_format y JOIN rapor_format e ON e.firma_id = y.firma_id AND e.id = OLD.format_id
    WHERE y.firma_id = NEW.firma_id AND y.id = NEW.format_id AND y.tur_id = NEW.tur_id AND y.durum IN ('yayinda', 'eski') AND y.sira > e.sira) THEN
    RAISE EXCEPTION 'rapor formatı yalnız türün daha yeni yayınlanmış sürümüne geçer' USING ERRCODE = '23514';
  END IF;
  -- damgalar yalnız tetikten
  NEW.gonderildi := OLD.gonderildi; NEW.ilk_gonderim := OLD.ilk_gonderim; NEW.onay := OLD.onay; NEW.onay_hesap := OLD.onay_hesap;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    -- açılan geçişler: Yeni · onayda · onaylandı arasında (gönder, onayla, geri gönder, onayı geri al, durumu değiştir); imza ve revize kendi göçleriyle
    IF NOT (OLD.durum IN ('taslak', 'onayda', 'onaylandi') AND NEW.durum IN ('taslak', 'onayda', 'onaylandi')) THEN
      RAISE EXCEPTION 'rapor % durumundan % durumuna geçemez', OLD.durum, NEW.durum USING ERRCODE = '23514';
    END IF;
    IF NEW.durum = 'taslak' AND length(btrim(coalesce(current_setting('app.gerekce', true), ''))) < 10 THEN
      RAISE EXCEPTION 'denetçiye dönen raporda gerekçe en az 10 karakter' USING ERRCODE = '23514';
    END IF;
    IF NEW.durum = 'taslak' THEN
      NEW.gonderildi := NULL;   -- ilk gönderim korunur
    ELSIF OLD.durum = 'taslak' THEN
      NEW.gonderildi := now(); NEW.ilk_gonderim := coalesce(OLD.ilk_gonderim, now());
    END IF;
    IF NEW.durum = 'onaylandi' THEN NEW.onay := now(); NEW.onay_hesap := hesap; ELSE NEW.onay := NULL; NEW.onay_hesap := NULL; END IF;
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

-- hareket: geçişin adı ve gerekçesi (işlemin app.gerekce ayarı; okunur ve silinir — sonraki geçişe taşınmaz)
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
             WHEN NEW.durum = 'taslak' THEN 'geri'
             ELSE 'durum' END, g);
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_hareket_yaz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_hareket_yaz() FROM PUBLIC;
