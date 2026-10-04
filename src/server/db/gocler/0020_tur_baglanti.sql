-- ══ 0020 · EKİPMAN TÜRÜ BAĞLANTILARI (maket ekipman-turleri.html yirmi dördüncü tur) ════════════════════════════════════════════════════
-- Kontrol metodu standartları: türe standart NUMARASIYLA bağlanır (Dökümanlar'daki güncel sürüm raporda yazar; yeni sürüm türe kendiliğinden
-- geçer). Kullanılacak ölçüm cihazı türleri (reisim 2026-09-27: "ekipmana göre hangi cihazların kullanılacağı ekipman türlerinden belirlenecek"):
-- raporda bu türlerin her birinden kalibrasyonu geçerli bir cihaz olmadan rapor onaya gönderilemez (Raporlar kalemi). Kimlikler aynı firmanın
-- cihaz türlerinden olmalı — sunucu yazmadan önce denetler. ⛔ Her göç IDEMPOTENT.
ALTER TABLE ekipman_turu ADD COLUMN IF NOT EXISTS kontrol_std text[] NOT NULL DEFAULT '{}';
ALTER TABLE ekipman_turu ADD COLUMN IF NOT EXISTS cihaz_turleri uuid[] NOT NULL DEFAULT '{}';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ekipman_turu_baglanti_sinir') THEN
    ALTER TABLE ekipman_turu ADD CONSTRAINT ekipman_turu_baglanti_sinir CHECK (cardinality(kontrol_std) <= 20 AND cardinality(cihaz_turleri) <= 20);
  END IF;
END $$;
