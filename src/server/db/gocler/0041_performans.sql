-- ══ 0041 · PERFORMANS (329; maket performans.html M15; KOD-GECIS §3 "Performans (19): tablo yok — rapor ve durum geçişlerinden özet") ══
-- Tablo yok; dönem sorguları (raporun açılış günü, geri gönderme / gönderim hareketleri) için dizinler. ⛔ Her göç IDEMPOTENT.
CREATE INDEX IF NOT EXISTS rapor_olustu ON rapor (firma_id, olustu) WHERE silindi IS NULL;
CREATE INDEX IF NOT EXISTS rapor_hareket_ne ON rapor_hareket (firma_id, ne, rapor_id, zaman);
