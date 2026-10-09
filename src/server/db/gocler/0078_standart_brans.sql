-- ══ 0078 · STANDARDIN BRANŞI (440; reisim 2026-10-09: "STANDARTLARIDA KENDİ ALTINDA MEKANİK ELEKTRİK OLARAK AYIR") ══
-- Dökümanlar › Standartlar Mekanik / Elektrik sekmelerinde: her standart sürümü bir branşta ('m' mekanik, 'e' elektrik). Yeni sürüm güncel sürümün
-- branşını alır (sunucu, dokumanlar/server/dokumanlar.ts standartYukle). Var olan satırlar: yalnız elektrik türlerinde kontrol metodu olan
-- standart elektrik, öteki mekanik (yayında 2026-10-09'da standart yoktu); branşsız eklenen satır mekanik (varsayılan). Kilit: tests/dokumanlar.test.ts
-- "440". ⛔ Her göç IDEMPOTENT.

ALTER TABLE standart ADD COLUMN IF NOT EXISTS brans text;
UPDATE standart s SET brans = CASE
    WHEN EXISTS (SELECT 1 FROM ekipman_turu t WHERE t.firma_id = s.firma_id AND t.brans = 'e' AND s.no = ANY (t.kontrol_std))
     AND NOT EXISTS (SELECT 1 FROM ekipman_turu t WHERE t.firma_id = s.firma_id AND t.brans = 'm' AND s.no = ANY (t.kontrol_std)) THEN 'e'
    ELSE 'm' END
  WHERE s.brans IS NULL;
ALTER TABLE standart ALTER COLUMN brans SET DEFAULT 'm';
ALTER TABLE standart ALTER COLUMN brans SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'standart_brans' AND conrelid = 'standart'::regclass) THEN
    ALTER TABLE standart ADD CONSTRAINT standart_brans CHECK (brans IN ('m', 'e'));
  END IF;
END $$;
