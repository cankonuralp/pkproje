-- ══ 0132 · S.A.Y CHAT RAPOR MODUNDA KONTROL SAATİ (2026-11-12; pkproje.md §11 K11, K12 — yapım sırasında T5) ══
-- Rapor modunda kayıt = bir ekipman; ilk fotoğraf kontrolün başlangıcı, "Gönder" bitişi (ek tuş yok). Kayıt bağlantısız yazılır, saatler cihazdan
-- gelir; sunucu iş geldiğinde sunucu saatine çevirir (cihaz-saati.ts) ve kayda yazar. Kayıt rapora dönerken (ekipman belli olunca) kontrol kaydı açılır.
-- 1. say_rapor_kayit.kontrol: başlangıç + bitiş (sunucu saatine çevrilmiş), kanıtı, tutmadıysa işareti — bir kez yazılır, değişmez.
-- 2. kontrol_koru: cihaz saatiyle BİTMİŞ kontrol tek eklemede yazılabilir (başlangıç + bitiş birlikte; kişinin o sırada süren başka kontrolü olsa da —
--    bu kayıt geçmişte bitmiş bir kontroldür, "aynı anda tek açık kontrol" kuralına girmez; saat çakışırsa sapma denetimi söyler).
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE say_rapor_kayit ADD COLUMN IF NOT EXISTS kontrol jsonb;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'say_rapor_kayit_kontrol_ck') THEN
    ALTER TABLE say_rapor_kayit ADD CONSTRAINT say_rapor_kayit_kontrol_ck
      CHECK (kontrol IS NULL OR (jsonb_typeof(kontrol) = 'object' AND kontrol ? 'bas' AND kontrol ? 'bit' AND pg_column_size(kontrol) <= 8000));
  END IF;
END $$;

/* yazan oturumdaki kişi; kaydın sahibi ve kimliği değişmez; ölçülen kontrol saati bir kez yazılır */
CREATE OR REPLACE FUNCTION say_rapor_kayit_koru() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF ben IS NULL THEN RAISE EXCEPTION 'Rapor kaydını oturumdaki kişi yazar' USING ERRCODE = '23514'; END IF;
    NEW.hesap_id := ben;
    RETURN NEW;
  END IF;
  IF NEW.hesap_id IS DISTINCT FROM OLD.hesap_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.cihaz_id IS DISTINCT FROM OLD.cihaz_id
    OR NEW.plan_id IS DISTINCT FROM OLD.plan_id OR NEW.olustu IS DISTINCT FROM OLD.olustu THEN
    RAISE EXCEPTION 'Rapor kaydının sahibi ve planı değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.kontrol IS NOT NULL AND NEW.kontrol IS DISTINCT FROM OLD.kontrol THEN
    RAISE EXCEPTION 'Rapor kaydının ölçülen kontrol saati değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION say_rapor_kayit_koru() FROM PUBLIC;

CREATE OR REPLACE FUNCTION kontrol_koru() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Kontrol kaydı silinmez.' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.kaynak = 'sunucu' THEN
      NEW.basladi := now(); NEW.bitti := NULL; NEW.bit_kaynak := NULL; NEW.cihaz_kanit := NULL; NEW.saat_tutmadi := false;
      NEW.duz_bas := NULL; NEW.duz_bit := NULL; NEW.duz_gerekce := NULL; NEW.duz_kim := NULL; NEW.duz_zaman := NULL;
    ELSIF NEW.kaynak = 'elle' THEN
      NEW.basladi := NULL; NEW.bitti := NULL; NEW.bit_kaynak := NULL; NEW.cihaz_kanit := NULL; NEW.saat_tutmadi := false; NEW.duz_zaman := now();
    ELSE
      -- cihaz saati: başlangıcı uygulama yazar (sunucu saatine çevrilmiş); ileri bir an olamaz
      IF NEW.basladi IS NULL OR NEW.basladi > now() + interval '1 minute' THEN
        RAISE EXCEPTION 'Cihaz saatiyle başlayan kontrolün başlangıcı ileri bir an olamaz.' USING ERRCODE = '23514';
      END IF;
      -- 0132: bitişi de cihaz saatiyle gelen (bitmiş) kontrol tek eklemede; yoksa kontrol açık başlar
      IF NEW.bitti IS NOT NULL AND NEW.bit_kaynak = 'cihaz' THEN
        IF NEW.bitti > now() + interval '1 minute' THEN
          RAISE EXCEPTION 'Cihaz saatiyle biten kontrolün bitişi ileri bir an olamaz.' USING ERRCODE = '23514';
        END IF;
      ELSE
        NEW.bitti := NULL; NEW.bit_kaynak := NULL;
      END IF;
      NEW.duz_bas := NULL; NEW.duz_bit := NULL; NEW.duz_gerekce := NULL; NEW.duz_kim := NULL; NEW.duz_zaman := NULL;
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.plan_id IS DISTINCT FROM OLD.plan_id OR NEW.ekipman_id IS DISTINCT FROM OLD.ekipman_id
     OR NEW.personel_id IS DISTINCT FROM OLD.personel_id OR NEW.takip IS DISTINCT FROM OLD.takip OR NEW.kaynak IS DISTINCT FROM OLD.kaynak
     OR NEW.basladi IS DISTINCT FROM OLD.basladi OR NEW.olustu IS DISTINCT FROM OLD.olustu THEN
    RAISE EXCEPTION 'Kontrol kaydının ölçülen başlangıcı ve bağlı olduğu kayıtlar değişmez.' USING ERRCODE = '23514';
  END IF;
  IF OLD.bitti IS NOT NULL AND NEW.bitti IS DISTINCT FROM OLD.bitti THEN
    RAISE EXCEPTION 'Kontrolün ölçülen bitişi değişmez.' USING ERRCODE = '23514';
  END IF;
  IF OLD.bitti IS NULL AND NEW.bitti IS NOT NULL THEN
    IF OLD.kaynak = 'elle' THEN RAISE EXCEPTION 'Bu kontrol kaydı ölçülmedi; bitişi yazılmaz.' USING ERRCODE = '23514'; END IF;
    IF NEW.bit_kaynak = 'cihaz' THEN
      IF NEW.bitti > now() + interval '1 minute' THEN
        RAISE EXCEPTION 'Cihaz saatiyle biten kontrolün bitişi ileri bir an olamaz.' USING ERRCODE = '23514';
      END IF;
    ELSE
      NEW.bitti := now(); NEW.bit_kaynak := 'sunucu'; NEW.cihaz_kanit := OLD.cihaz_kanit; NEW.saat_tutmadi := OLD.saat_tutmadi;
    END IF;
    IF OLD.saat_tutmadi THEN NEW.saat_tutmadi := true; END IF;
  ELSIF NEW.bit_kaynak IS DISTINCT FROM OLD.bit_kaynak OR NEW.cihaz_kanit IS DISTINCT FROM OLD.cihaz_kanit OR NEW.saat_tutmadi IS DISTINCT FROM OLD.saat_tutmadi THEN
    -- saatin kaynağı, kanıtı ve "tutmadı" işareti yalnız uç yazılırken yazılır
    RAISE EXCEPTION 'Kontrol saatinin kaynağı ve kanıtı değişmez.' USING ERRCODE = '23514';
  END IF;
  IF NEW.duz_bas IS DISTINCT FROM OLD.duz_bas OR NEW.duz_bit IS DISTINCT FROM OLD.duz_bit OR NEW.duz_gerekce IS DISTINCT FROM OLD.duz_gerekce THEN
    -- sürerken düzeltilmez; düzeltme geri alınmaz (yenisi yazılır — eskisi denetim izinde)
    IF OLD.basladi IS NOT NULL AND NEW.bitti IS NULL THEN RAISE EXCEPTION 'Kontrol sürerken saat düzeltilmez.' USING ERRCODE = '23514'; END IF;
    IF NEW.duz_bas IS NULL THEN RAISE EXCEPTION 'Saat düzeltmesi kaldırılmaz.' USING ERRCODE = '23514'; END IF;
    NEW.duz_zaman := now();
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION kontrol_koru() FROM PUBLIC;
