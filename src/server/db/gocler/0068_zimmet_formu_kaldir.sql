-- ══ 0068 · İMZALI ZİMMET FORMU KALDIR (373; reisim 2026-10-07 "… vb eklenebilen şeylerin silinemediğini tespit ettim"; §9 elli üçüncü tur ekran
-- dili: kayıt saklanıyorsa "Kaldır") ══
-- Yanlış yüklenen ıslak imzalı tarama kaldırılır: satır "kaldirildi" ile kalır (tarama silinmez, saklanır), kişinin kartında imzalı form olarak
-- sayılmaz. Yalnız YÜKLENEN tarama kaldırılır (dosya_id dolu); Onaylar'da kişinin imzaladığı form (belge onayı) kaldırılmaz — veritabanı da ister.
-- Personel özlük dosyasındaki öteki satırlarla (özlük, atama, bordro) aynı desen. ⛔ Her göç IDEMPOTENT.
ALTER TABLE zimmet_formu ADD COLUMN IF NOT EXISTS kaldirildi timestamptz;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zimmet_formu_kaldir_yuklenen') THEN
    ALTER TABLE zimmet_formu ADD CONSTRAINT zimmet_formu_kaldir_yuklenen CHECK (kaldirildi IS NULL OR dosya_id IS NOT NULL);
  END IF;
END $$;
