-- ══ 0101 · GERİ GÖNDERMEDE GEREKÇE İSTEĞE BAĞLI (reisim 2026-10-17: "Rapor Yeni'ye düşer. En az 10 harflik gerekçe zorunlu … zorunlu açıklamayı
--   kaldır") ══
-- Teknik yönetici onaydaki raporu geri gönderirken ya da durumu değiştirip Yeni'ye alırken gerekçe yazmak ZORUNLU DEĞİL; yazılırsa rapor_hareket'e
-- kaydedilir (0029 rapor_hareket_yaz — değişmedi) ve denetçi raporun üstünde görür. Tamamlanan raporu REVİZEYE göndermede gerekçe ≥ 10 aynen
-- kalır. rapor_akis 0029'daki gövdenin aynısı, yalnız gerekçe koşulu "revize" ile sınırlandı. ⛔ Her göç IDEMPOTENT (CREATE OR REPLACE).
-- Kilit tests/onaylar.test.ts (0101), bozan tests/bozan/onaylar.bozan.ts.

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
    -- 0101: gerekçe yalnız REVİZEDE zorunlu (Tamamlandı → Yeni); onaydaki / onaylanmış raporu Yeni'ye almak (geri gönder, durumu değiştir)
    -- gerekçesiz olabilir — yazılırsa harekete kaydedilir, denetçi raporun üstünde görür
    IF revize AND length(btrim(coalesce(current_setting('app.gerekce', true), ''))) < 10 THEN
      RAISE EXCEPTION 'revizeye gönderilen raporda gerekçe en az 10 karakter' USING ERRCODE = '23514';
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
