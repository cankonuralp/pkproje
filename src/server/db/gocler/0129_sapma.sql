-- ══ 0129 · SAPMA KAYDI VE TÜRÜN EN KISA KONTROL SÜRESİ (2026-11-12; pkproje.md §11 K6, K7 — reisim: "yazılan süre ile ekipman başında geçirilen
--    süre uymalı log kayıtları düzgün olmalı"; yapım sırasında T4) ══
-- 1. rapor.sapmalar: ölçümlü rapor onaya gönderilirken bulunan sapmalar ve denetçinin gerekçeleri ([{ tur, metin, gerekce }]) — teknik yönetici onay
--    ekranında görür. Sapma kesin engel değildir; gerekçesiz gönderilmez (kural uygulamada: raporlar.ts onayaGonder).
-- 2. ekipman_turu.en_kisa: türün en kısa kontrol süresi (dakika; boşsa denetlenmez) — firma kendi prosedürüne göre girer.
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE rapor ADD COLUMN IF NOT EXISTS sapmalar jsonb NOT NULL DEFAULT '[]'::jsonb;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rapor_sapmalar_bicim') THEN
    ALTER TABLE rapor ADD CONSTRAINT rapor_sapmalar_bicim CHECK (jsonb_typeof(sapmalar) = 'array' AND jsonb_array_length(sapmalar) <= 10 AND pg_column_size(sapmalar) <= 8000);
  END IF;
END $$;

ALTER TABLE ekipman_turu ADD COLUMN IF NOT EXISTS en_kisa integer;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ekipman_turu_en_kisa_aralik') THEN
    ALTER TABLE ekipman_turu ADD CONSTRAINT ekipman_turu_en_kisa_aralik CHECK (en_kisa IS NULL OR en_kisa BETWEEN 1 AND 600);
  END IF;
END $$;
