-- ══ 0028 · SON İMZA DÜZELTMELERİ (315–317 çapraz incelemesi, 2026-10-05; doğrulanmış bulgular) ══
-- (1) Onaylanmış rapor onaydan çıkınca (onayı geri al / durumu değiştir) o revizyonun bekleyen imza isteği İPTAL olur; imzalı sürüm yalnız
--     BEKLEYEN isteğin PDF'iyle yazılır — eski içerikli PDF imzalanıp yeni içerikle tamamlanamaz.
-- (2) İmza isteği hazırlık anının KOPYASINI taşır (yazan, cihazlar ve kalibrasyonları — imzalanan PDF'le aynı kaynaktan); değişmez. İmzalı
--     sürüm bu kopyadan yazılır (yükleme anındaki canlı kayıttan değil).
-- (3) Uygunsuzluk yalnız "Uygun değil" imzalı sürüme açılır; muayene TARİHİNE göre kapanır (eski muayenenin sonradan imzalanması yeni muayenenin
--     kusurunu kapatmaz; daha yeni tarihli muayene varsa kusur giderilmiş doğar); kapanış elle yazılmaz, yalnız sonraki imzalı sürümün tetiğiyle
--     ve kapatan sürümle (CHECK + yabancı anahtar).
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE imza_istegi ADD COLUMN IF NOT EXISTS kopya jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(kopya) = 'object' AND pg_column_size(kopya) <= 200000);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uygunsuzluk_kapatan_tutarli') THEN
    ALTER TABLE uygunsuzluk ADD CONSTRAINT uygunsuzluk_kapatan_tutarli CHECK ((kapanis IS NULL) = (kapatan_surum IS NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uygunsuzluk_kapatan_surum') THEN
    ALTER TABLE uygunsuzluk ADD CONSTRAINT uygunsuzluk_kapatan_surum FOREIGN KEY (firma_id, kapatan_surum) REFERENCES rapor_surumu (firma_id, id);
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
    OR NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.kopya IS DISTINCT FROM OLD.kopya THEN
    RAISE EXCEPTION 'imza isteğinin raporu, PDF''i, kopyası ve sahibi değişmez' USING ERRCODE = '23514';
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
  -- imzasız PDF bu revizyonun BEKLEYEN imza isteğinin PDF'i: rapor onaydan çıkınca istek iptal edilir, eski içerikli PDF imzalanamaz
  IF NOT EXISTS (SELECT 1 FROM imza_istegi i WHERE i.firma_id = NEW.firma_id AND i.rapor_id = NEW.rapor_id AND i.revizyon = r.revizyon
                 AND i.durum = 'bekliyor' AND i.pdf_dosya = NEW.imzasiz_dosya) THEN
    RAISE EXCEPTION 'imzalı sürüm yalnız bekleyen imza isteğinin PDF''iyle yazılır' USING ERRCODE = '23514';
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

CREATE OR REPLACE FUNCTION uygunsuzluk_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE s record; k uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- bağlam imzalı sürümden; uygunsuzluk ancak o sürüm yazıldığı işlemde, "Uygun" olmayan sürüme açılır
    SELECT x.rapor_id, x.ekipman_id, x.tesis_id, x.musteri_id, x.kontrol_tarihi, x.sonuc, x.imzalandi INTO s
      FROM rapor_surumu x WHERE x.firma_id = NEW.firma_id AND x.id = NEW.surum_id;
    IF s IS NULL OR s.imzalandi <> now() OR s.sonuc IS DISTINCT FROM 'uygun_degil' THEN
      RAISE EXCEPTION 'uygunsuzluk yalnız imzalanan sürümle birlikte, "Uygun değil" sürüme açılır' USING ERRCODE = '23514';
    END IF;
    NEW.rapor_id := s.rapor_id; NEW.ekipman_id := s.ekipman_id; NEW.tesis_id := s.tesis_id; NEW.musteri_id := s.musteri_id; NEW.tarih := s.kontrol_tarihi;
    NEW.kapanis := NULL; NEW.kapatan_surum := NULL; NEW.kapandi := NULL;
    -- aynı ekipmanın DAHA YENİ tarihli muayenesi zaten imzalıysa (sonradan imzalanan eski muayene) kusur o muayeneyle giderilmiş doğar
    IF s.kontrol_tarihi IS NOT NULL THEN
      SELECT y.id INTO k FROM rapor_surumu y WHERE y.firma_id = NEW.firma_id AND y.ekipman_id = s.ekipman_id AND y.id <> NEW.surum_id
        AND y.rapor_id <> s.rapor_id AND y.kontrol_tarihi > s.kontrol_tarihi ORDER BY y.kontrol_tarihi DESC, y.imzalandi DESC LIMIT 1;
      IF k IS NOT NULL THEN NEW.kapanis := 'giderildi'; NEW.kapatan_surum := k; NEW.kapandi := now(); END IF;
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.surum_id IS DISTINCT FROM OLD.surum_id OR NEW.rapor_id IS DISTINCT FROM OLD.rapor_id OR NEW.ekipman_id IS DISTINCT FROM OLD.ekipman_id
    OR NEW.tesis_id IS DISTINCT FROM OLD.tesis_id OR NEW.musteri_id IS DISTINCT FROM OLD.musteri_id OR NEW.kaynak IS DISTINCT FROM OLD.kaynak
    OR NEW.ref IS DISTINCT FROM OLD.ref OR NEW.metin IS DISTINCT FROM OLD.metin OR NEW.agir IS DISTINCT FROM OLD.agir OR NEW.tarih IS DISTINCT FROM OLD.tarih THEN
    RAISE EXCEPTION 'uygunsuzluğun içeriği değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.kapanis IS NOT NULL THEN RAISE EXCEPTION 'kapanmış uygunsuzluk değişmez' USING ERRCODE = '23514'; END IF;
  -- kapanış elle yazılmaz: yalnız sonraki imzalı sürümün tetiği (rapor_surumu_sonra) kapatır, kapatan sürümle
  IF NEW.kapanis IS NOT NULL AND (pg_trigger_depth() < 2 OR NEW.kapatan_surum IS NULL) THEN
    RAISE EXCEPTION 'uygunsuzluk yalnız sonraki imzalı sürümle kapanır' USING ERRCODE = '23514';
  END IF;
  IF NEW.kapanis IS NOT NULL THEN NEW.kapandi := now(); ELSE NEW.kapandi := NULL; NEW.kapatan_surum := NULL; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION uygunsuzluk_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION uygunsuzluk_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER uygunsuzluk_koru BEFORE INSERT OR UPDATE ON uygunsuzluk FOR EACH ROW EXECUTE FUNCTION uygunsuzluk_koru();

CREATE OR REPLACE FUNCTION rapor_surumu_sonra() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  UPDATE uygunsuzluk u SET kapanis = CASE WHEN u.rapor_id = NEW.rapor_id THEN 'revizyon' ELSE 'giderildi' END, kapatan_surum = NEW.id, surum = u.surum + 1, degisti = now()
    WHERE u.firma_id = NEW.firma_id AND u.ekipman_id = NEW.ekipman_id AND u.kapanis IS NULL AND u.surum_id <> NEW.id
      AND (u.rapor_id = NEW.rapor_id OR u.tarih IS NULL OR NEW.kontrol_tarihi IS NULL OR u.tarih <= NEW.kontrol_tarihi);
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_surumu_sonra() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_surumu_sonra() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_surumu_sonra AFTER INSERT ON rapor_surumu FOR EACH ROW EXECUTE FUNCTION rapor_surumu_sonra();

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
    -- onaylanmış rapor onaydan çıkınca (onayı geri al, durumu değiştir) o revizyonun bekleyen imza isteği iptal: hazırlanan PDF eski içeriği
    -- taşır, yeniden onaylanınca İmzala yeni PDF üretir
    IF OLD.durum = 'onaylandi' AND NEW.durum IN ('taslak', 'onayda') THEN
      UPDATE imza_istegi SET durum = 'iptal', surum = surum + 1, degisti = now()
        WHERE firma_id = NEW.firma_id AND rapor_id = NEW.id AND revizyon = NEW.revizyon AND durum = 'bekliyor';
    END IF;
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_hareket_yaz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_hareket_yaz() FROM PUBLIC;
