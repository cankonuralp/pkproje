-- ══ 0089 · OKUMA KAYDINDA FOTOĞRAF (542; reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri
-- yap diyeceğim"; sunum 541 K3 — "rapordaki okunmamış bütün fotoğraflar") ══
-- Fotoğraf rapora okunmadan eklenir; S.A.Y'a "fotoğrafları oku ve gir" denince raporun OKUNMAMIŞ okuma fotoğrafları okunur. Hangi fotoğrafın
-- okunduğu okuma kaydından bilinir: yz_okuma.dosya (raporun okuma fotoğrafının dosya kimliği; eski kayıtlarda ve yeni çekilip okunan fotoğrafta boş).
-- Kayıt değişmez kalır (yz_koru); yalnız sütun eklenir. ⛔ Her göç IDEMPOTENT.

ALTER TABLE yz_okuma ADD COLUMN IF NOT EXISTS dosya uuid;
CREATE INDEX IF NOT EXISTS yz_okuma_dosya ON yz_okuma (firma_id, rapor_id, dosya) WHERE dosya IS NOT NULL;
