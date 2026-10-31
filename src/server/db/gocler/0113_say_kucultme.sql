-- 2026-11-01 (V21 A1 — reisim: "100 bin olayını sınırlama şansımız yok mu"): S.A.Y işinin İŞ İÇİ küçültme seviyesi (0–4; yalnız ileri) —
-- istem 90 bin tokeni aşacaksa döngü seviyeyi artırır (eski büyütmeler metne, okunmuş beceriler nota, uzun sonuçlar kırpık, "bağlam doldu" notu),
-- seviye işin satırında yaşar (yz_konusma_is; iş bitince satır kalkar). Konuşma kaydı değişmez. İdempotent.
ALTER TABLE yz_konusma_is ADD COLUMN IF NOT EXISTS kucultme smallint NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'yz_konusma_is_kucultme_sinir') THEN
    ALTER TABLE yz_konusma_is ADD CONSTRAINT yz_konusma_is_kucultme_sinir CHECK (kucultme BETWEEN 0 AND 4);
  END IF;
END $$;
