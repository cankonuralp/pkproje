-- ══ 0133 · ÖLÇÜM CİHAZI: KALİBRASYON GEREKMEZ (2026-11-16; reisim: "yeni bir sistem ekle kalibrasyon tarihine gerek yok seçeneği olsun ekipman
--    eklerken") ══ Cihaz eklenirken / düzenlenirken işaretlenir. İşaretli cihazda kalibrasyon bitişi aranmaz: rapora eklenir, onaya gönderimi
--    durdurmaz, kalibrasyon uyarılarına girmez; listede ve belgede "Gerekmez" yazar. Kalibrasyon kaydı yine eklenebilir (kayıt olarak durur).
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE olcum_cihazi ADD COLUMN IF NOT EXISTS kal_gerekmez boolean NOT NULL DEFAULT false;
