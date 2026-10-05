-- ══ 0038 · İŞ SÖZLEŞMESİNİN DAYANAK TEKLİFİ (326; maket sozlesmeler.html formu "Dayanak teklif — kabul edilen teklif; fiyatlar oradan", sözleşme
-- sayfası "Dayanak teklif" / "Sistem öncesi"; pkproje §1.1 akış "teklif kabul edildi → sözleşmeler yapıldı"; 324 incelemesi: "İş sözleşmesi" tuşu
-- teklifin bağlamını taşımıyordu) ══
-- Sözleşme isteğe bağlı olarak bir teklife dayanır: AYNI müşterinin KABUL edilmiş teklifi (sistem öncesi sözleşmede boş). Bağ hazırlanırken yazılır,
-- sonra değişmez. Müşteri rolü bu sütunu okumaz (0034'teki sütun hakları aynı kalır).
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE is_sozlesmesi ADD COLUMN IF NOT EXISTS teklif_id uuid;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'is_sozlesmesi_teklif') THEN
    ALTER TABLE is_sozlesmesi ADD CONSTRAINT is_sozlesmesi_teklif FOREIGN KEY (firma_id, teklif_id) REFERENCES teklif (firma_id, id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION is_sozlesmesi_teklif_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.teklif_id IS DISTINCT FROM OLD.teklif_id THEN
    RAISE EXCEPTION 'dayanak teklif değişmez' USING ERRCODE = '23514';
  END IF;
  IF NEW.teklif_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teklif t WHERE t.firma_id = NEW.firma_id AND t.id = NEW.teklif_id
      AND t.durum = 'kabul' AND t.musteri_id = NEW.musteri_id) THEN
    RAISE EXCEPTION 'dayanak teklif bu müşterinin kabul edilmiş teklifi olmalı' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION is_sozlesmesi_teklif_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION is_sozlesmesi_teklif_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER is_sozlesmesi_teklif_koru BEFORE INSERT OR UPDATE ON is_sozlesmesi FOR EACH ROW EXECUTE FUNCTION is_sozlesmesi_teklif_koru();
