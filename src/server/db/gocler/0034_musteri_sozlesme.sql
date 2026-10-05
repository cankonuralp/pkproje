-- ══ 0034 · MÜŞTERİ PANELİ › SÖZLEŞMELER (322; maket musteri.html #/sozlesme, #/s/<no>; karar 134 "müşteri panelinde görünür, panelden imza
-- atılmaz") ══
-- Müşteri rolü iş sözleşmesinin YALNIZ numara, dönem, müşteri imza tarihi ve imzalı PDF sütunlarını okur (vade, yenileme, firma imzası yok);
-- yalnız kendi müşterisinin ve kapsamında GÖREBİLDİĞİ tesis bulunan sözleşmeleri (ek giriş seçili tesislerde); kapsam satırlarında yalnız
-- görebildiği tesisler. Dosya: rapor PDF'ine ek olarak görebildiği sözleşmenin ŞU ANKİ imzalı PDF'i (yeniden yüklenince eskisi inmez).
-- Kısıtlayıcı politikalar kiracı politikasıyla VE'lenir (0030 ile aynı yapı); yazma yok.
-- ⛔ Her göç IDEMPOTENT.

GRANT SELECT (id, firma_id, no, musteri_id, baslangic, bitis, musteri_imza, imzali_dosya) ON is_sozlesmesi TO probata_musteri;
GRANT SELECT (id, firma_id, sozlesme_id, tesis_id) ON is_sozlesmesi_tesis TO probata_musteri;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'is_sozlesmesi_tesis' AND policyname = 'is_sozlesmesi_tesis_musteri') THEN
    -- tesis alt sorgusu müşteri politikasından geçer: kendi müşterisi ve tesis kapsamı
    CREATE POLICY is_sozlesmesi_tesis_musteri ON is_sozlesmesi_tesis AS RESTRICTIVE FOR SELECT TO probata_musteri
      USING (EXISTS (SELECT 1 FROM tesis t WHERE t.firma_id = is_sozlesmesi_tesis.firma_id AND t.id = is_sozlesmesi_tesis.tesis_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'is_sozlesmesi' AND policyname = 'is_sozlesmesi_musteri') THEN
    CREATE POLICY is_sozlesmesi_musteri ON is_sozlesmesi AS RESTRICTIVE FOR SELECT TO probata_musteri
      USING (musteri_id = gecerli_musteri()
             AND EXISTS (SELECT 1 FROM is_sozlesmesi_tesis st WHERE st.firma_id = is_sozlesmesi.firma_id AND st.sozlesme_id = is_sozlesmesi.id));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dosya' AND policyname = 'dosya_musteri') THEN
    DROP POLICY dosya_musteri ON dosya;
  END IF;
  -- yalnız görebildiği imzalı rapor sürümünün ya da görebildiği sözleşmenin şu anki imzalı PDF'i (alt sorgular müşteri politikalarından geçer)
  CREATE POLICY dosya_musteri ON dosya AS RESTRICTIVE FOR SELECT TO probata_musteri
    USING (cop IS NULL AND (
      (modul = 'rapor_imzali' AND EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.imzali_dosya = dosya.id))
      OR (modul = 'is_sozlesmesi' AND EXISTS (SELECT 1 FROM is_sozlesmesi z WHERE z.imzali_dosya = dosya.id))));
END $$;
