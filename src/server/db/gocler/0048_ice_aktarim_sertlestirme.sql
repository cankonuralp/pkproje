-- ══ 0048 · TOPLU İÇE AKTARMA SERTLEŞTİRME (337–339 incelemesi) ══
-- 1. Oluşturulma zamanı DEĞİŞMEZ: içe aktarma kaydının listesi (0047 ice_aktarim_ekle) "bu işlemde oluşturulmuş kayıt"ı olustu = now() ile anlar.
--    Uygulama rolünün müşteri, tesis, personel, ölçüm cihazı, araç ve ekipman tablolarında güncelleme hakkı var; olustu korunmazsa eski bir kayıt
--    önce "UPDATE … SET olustu = now()" ile yeni gösterilip sahte bir içe aktarma listesine yazılır ve geri alma işlevi (SECURITY DEFINER) onu
--    siler — uygulama rolü fiilen silme hakkı kazanırdı. Bu altı tabloda olustu artık değiştirilemez (teklif, gider, talep, belge onayıyla aynı).
-- 2. Ekipman kodu kuralı uygulamayla aynı (A–Z, 0–9, tire; 3–20 hane; tireyle başlamaz / bitmez, çift tire yok): 0023'teki ifade "A-1" gibi üç
--    haneli tireli kodu reddediyor, uygulama kabul ediyordu (içe aktarma veritabanında düşüyordu). Yeni ifade eskisinin kabul ettiği her kodu kabul eder.
-- ⛔ IDEMPOTENT.

CREATE OR REPLACE FUNCTION olustu_degismez() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.olustu IS DISTINCT FROM OLD.olustu THEN
    RAISE EXCEPTION 'kaydın oluşturulma zamanı değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION olustu_degismez() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION olustu_degismez() FROM PUBLIC;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['musteri', 'tesis', 'personel', 'olcum_cihazi', 'arac', 'ekipman'] LOOP
    EXECUTE format('CREATE OR REPLACE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION olustu_degismez()', t || '_olustu_degismez', t);
  END LOOP;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'ekipman'::regclass AND conname = 'ekipman_kod_check'
             AND pg_get_constraintdef(oid) NOT LIKE '%(-[A-Z0-9]+)*%') THEN
    ALTER TABLE ekipman DROP CONSTRAINT ekipman_kod_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'ekipman'::regclass AND conname = 'ekipman_kod_check') THEN
    ALTER TABLE ekipman ADD CONSTRAINT ekipman_kod_check CHECK (kod ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' AND length(kod) BETWEEN 3 AND 20);
  END IF;
END $$;
