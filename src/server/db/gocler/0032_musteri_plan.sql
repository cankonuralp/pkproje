-- ══ 0032 · MÜŞTERİ PANELİ › PLANLANAN KONTROLLER (321; maket musteri.html #/plan, planCiz; karar 81 "müşteri panelinde planlanan kontrol") ══
-- Müşteri rolü planın YALNIZ tesis, tarih ve durum sütunlarını okur (proje no, açıklama, künye — firma adı / adres / SGK —, açan ve ekip yok);
-- yalnız kendi müşterisinin, kendi tesis kapsamındaki AÇIK planlar (Kabul bekliyor · Kabul edildi · Denetimde): reddedilen ya da tamamlanan plan
-- müşteriye "planlanan kontrol" değildir. Kiracı politikasıyla VE'lenen kısıtlayıcı politika (0030 ile aynı yapı); yazma yok.
-- ⛔ Her göç IDEMPOTENT.

GRANT SELECT (id, firma_id, tesis_id, baslangic, bitis, durum) ON plan TO probata_musteri;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan' AND policyname = 'plan_musteri') THEN
    CREATE POLICY plan_musteri ON plan AS RESTRICTIVE FOR SELECT TO probata_musteri
      USING (durum IN ('bekliyor', 'kabul', 'denetimde') AND musteri_tesis_gorur(tesis_id)
             AND EXISTS (SELECT 1 FROM tesis t WHERE t.firma_id = plan.firma_id AND t.id = plan.tesis_id AND t.musteri_id = gecerli_musteri()));
  END IF;
END $$;
