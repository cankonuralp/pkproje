-- ══ 0088 · EKİPMAN KODUNDA TÜRKÇE HARF (540; reisim 2026-10-14: "TÜRKÇE KARAKTER DE KABUL ETMİYOR ETMELİ") ══
-- Ekipman kodu: harf (A–Z ve Ç Ğ İ Ö Ş Ü), rakam, tire; 3–20; tireyle başlamaz / bitmez, çift tire yok (0048'deki kural + Türkçe büyük harfler).
-- Küçük harf yok (uygulama yerelden bağımsız büyütür — anayasa 5.5). Kodun biçimi uygulamada src/sema/ortak.ts EKIPMAN_KOD_BICIMI ile aynı.
-- Kilit: tests/planlar.test.ts "EKİPMAN KODU". ⛔ Her göç IDEMPOTENT.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'ekipman'::regclass AND conname = 'ekipman_kod_check'
             AND pg_get_constraintdef(oid) NOT LIKE '%ÇĞİÖŞÜ%') THEN
    ALTER TABLE ekipman DROP CONSTRAINT ekipman_kod_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'ekipman'::regclass AND conname = 'ekipman_kod_check') THEN
    ALTER TABLE ekipman ADD CONSTRAINT ekipman_kod_check
      CHECK (kod ~ '^[A-ZÇĞİÖŞÜ0-9]+(-[A-ZÇĞİÖŞÜ0-9]+)*$' AND length(kod) BETWEEN 3 AND 20);
  END IF;
END $$;
