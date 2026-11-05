-- ══ 0120 · ÖLÇÜM CİHAZI ARA KONTROLÜ (2026-11-05; reisim: "gerçek eksiklerde ki 1 numara hariç diğerlerini düzelt hızlıca" — tarama bulgusu 2:
-- "Ara kontrol cihaz kaydında henüz yok"; ISO/IEC 17020: iki kalibrasyon arasında cihazın güvenilirliği ara kontrolle izlenir) ══
-- Ara kontrol kalibrasyon kaydının yanında, AYNI tabloda (tur = 'ara'): tarih, sonraki ara kontrol (bitis), yapan (lab), yöntem / kayıt no
-- (sertifika), sonuç, isteğe bağlı belge. Kalibrasyonun geçerlilik bitişi, rapora eklenen cihazın kalibrasyon denetimi ve belgedeki kalibrasyon
-- yalnız tur = 'kalibrasyon' kayıtlarından (src/modules/olcum-cihazlari/server/cihazlar.ts). Uyarılar ara kontrolü ayrı satırda söyler.
-- ⛔ Her göç IDEMPOTENT.
ALTER TABLE kalibrasyon ADD COLUMN IF NOT EXISTS tur text NOT NULL DEFAULT 'kalibrasyon';
ALTER TABLE kalibrasyon DROP CONSTRAINT IF EXISTS kalibrasyon_tur;
ALTER TABLE kalibrasyon ADD CONSTRAINT kalibrasyon_tur CHECK (tur IN ('kalibrasyon', 'ara'));
CREATE INDEX IF NOT EXISTS kalibrasyon_cihaz_tur ON kalibrasyon (firma_id, cihaz_id, tur);
