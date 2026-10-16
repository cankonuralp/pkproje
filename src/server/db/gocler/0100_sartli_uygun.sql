-- 0100 — ŞARTLI UYGUN (sunum 595 madde 12; reisim K1 "Evet, hepsi" — "iki seçeneğin metni yazılır; üçüncü seçenek eklenir (ör. şartlı uygun)").
--   Raporun sonucuna üçüncü değer 'sartli' (şartlı uygun: ekipman kullanılabilir, hafif kusurları sonraki kontrole kadar giderilir). Seçenek yalnız
--   formatın sonuç bölümü açtıysa seçilir (uygulama denetler). Uygunsuzluk "Uygun" olmayan imzalı sürüme açılır: Uygun değil ve Şartlı uygun — hafif
--   kusurlar müşterinin uygunsuzluk listesinde takip edilir, sonraki imzalı muayeneyle kapanır (kapanış kuralı aynı). İdempotent.
--   Kilit tests/onaylar.test.ts (595 madde 12).

ALTER TABLE rapor DROP CONSTRAINT IF EXISTS rapor_sonuc_check;
ALTER TABLE rapor ADD CONSTRAINT rapor_sonuc_check CHECK (sonuc IS NULL OR sonuc IN ('uygun', 'uygun_degil', 'sartli'));
ALTER TABLE rapor_surumu DROP CONSTRAINT IF EXISTS rapor_surumu_sonuc_check;
ALTER TABLE rapor_surumu ADD CONSTRAINT rapor_surumu_sonuc_check CHECK (sonuc IS NULL OR sonuc IN ('uygun', 'uygun_degil', 'sartli'));

CREATE OR REPLACE FUNCTION uygunsuzluk_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE s record; k uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- bağlam imzalı sürümden; uygunsuzluk ancak o sürüm yazıldığı işlemde, "Uygun" olmayan sürüme (Uygun değil · Şartlı uygun) açılır
    SELECT x.rapor_id, x.ekipman_id, x.tesis_id, x.musteri_id, x.kontrol_tarihi, x.sonuc, x.imzalandi INTO s
      FROM rapor_surumu x WHERE x.firma_id = NEW.firma_id AND x.id = NEW.surum_id;
    IF s IS NULL OR s.imzalandi <> now() OR s.sonuc IS NULL OR s.sonuc NOT IN ('uygun_degil', 'sartli') THEN
      RAISE EXCEPTION 'uygunsuzluk yalnız imzalanan sürümle birlikte, "Uygun değil" ya da "Şartlı uygun" sürüme açılır' USING ERRCODE = '23514';
    END IF;
    NEW.rapor_id := s.rapor_id; NEW.ekipman_id := s.ekipman_id; NEW.tesis_id := s.tesis_id; NEW.musteri_id := s.musteri_id; NEW.tarih := s.kontrol_tarihi;
    NEW.kapanis := NULL; NEW.kapatan_surum := NULL; NEW.kapandi := NULL;
    -- aynı ekipmanın DAHA YENİ tarihli muayenesi zaten imzalıysa (sonradan imzalanan eski muayene) kusur o muayeneyle giderilmiş doğar;
    -- yalnız raporların SON imzalı sürümleri sayılır (yerini yeni revizyona bırakmış sürümün tarihi geçersiz)
    IF s.kontrol_tarihi IS NOT NULL THEN
      SELECT y.id INTO k FROM rapor_surumu y WHERE y.firma_id = NEW.firma_id AND y.ekipman_id = s.ekipman_id AND y.id <> NEW.surum_id
        AND y.rapor_id <> s.rapor_id AND y.kontrol_tarihi > s.kontrol_tarihi
        AND NOT EXISTS (SELECT 1 FROM rapor_surumu z WHERE z.firma_id = y.firma_id AND z.rapor_id = y.rapor_id AND z.revizyon > y.revizyon)
        ORDER BY y.kontrol_tarihi DESC, y.imzalandi DESC LIMIT 1;
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
