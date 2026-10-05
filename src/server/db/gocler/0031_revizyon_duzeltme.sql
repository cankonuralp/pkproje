-- ══ 0031 · REVİZYON DÜZELTMELERİ (318 çapraz incelemesi, 2026-10-05; doğrulanmış bulgular) ══
-- (1) İmzalı sürümün muayene (rapor) tarihi imza gününden ileri olamaz (Europe/Istanbul): ileri tarihli tek imzalı rapor ekipmanın açık ve
--     gelecekteki bütün uygunsuzluklarını "giderildi" yapardı. Sunucu Onaya gönderde de denetler (başlangıç günü ≤ rapor tarihi ≤ bugün).
-- (2) "Giderilmiş doğar" denetimi yalnız her raporun SON imzalı sürümüne bakar: yerini yeni revizyona bırakmış sürümün tarihi (ör. revizyonla
--     düzeltilen yanlış tarih) başka raporun kusurunu kapatmaz. Revize süren raporun önceki imzalı sürümü (yenisi henüz imzalanmadı) geçerli kalır
--     — müşteri de onu görür (193).
--     Aynı tarihli iki muayenede son imzalanan geçerlidir: sonradan imzalanan önceki kusuru kapatır (rapor_surumu_sonra "<="), kendi kusuru ise
--     açık doğar (">") — iki yönde de aynı kural.
-- (3) Temizlik: 0028'den önce onaydan çıkmış raporların artakalan bekleyen imza istekleri iptal (rapor o revizyonda onaylı değil ya da istek
--     son onaydan önce açılmış — eski içerikli PDF).
-- ⛔ Her göç IDEMPOTENT.

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
  -- muayene tarihi imza gününden ileri olamaz (ileri tarih uygunsuzluk kapanışını bozar)
  IF r.rapor_tarihi IS NOT NULL AND r.rapor_tarihi > (now() AT TIME ZONE 'Europe/Istanbul')::date THEN
    RAISE EXCEPTION 'muayene tarihi imza gününden ileri olamaz' USING ERRCODE = '23514';
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

-- temizlik: artakalan bekleyen imza istekleri (eski içerikli PDF) iptal — ikinci koşuda eşleşen satır kalmaz
UPDATE imza_istegi i SET durum = 'iptal', surum = i.surum + 1, degisti = now()
  FROM rapor r
  WHERE r.firma_id = i.firma_id AND r.id = i.rapor_id AND i.durum = 'bekliyor'
    AND (r.durum NOT IN ('onaylandi', 'imzada') OR r.revizyon <> i.revizyon OR r.silindi IS NOT NULL OR r.onay IS NULL OR i.olustu < r.onay);
