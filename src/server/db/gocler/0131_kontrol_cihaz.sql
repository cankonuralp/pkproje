-- ══ 0131 · KONTROL SAATİ BAĞLANTISIZKEN: CİHAZ SAATİ (2026-11-12; pkproje.md §11 K4 — yapım sırasında T5) ══
-- Bağlantı yokken "Kontrole başla" / "Kontrolü bitir" cihazın saatini kuyruğa yazar; bağlantı gelince sunucu, cihaz saatini bağlantıdan çıkarken ve
-- dönerken ölçülen farkla karşılaştırır (5 dk'ya kadar fark düzeltilerek kabul; tutmazsa kayıt "saat tutmadı" — sapma, gerekçe ister).
-- 1. kaynak 'cihaz' artık açılır: başlangıcı uygulama yazar (düzeltilmiş cihaz saati; ileri bir an olamaz), kanıtı (cihaz_kanit) şarttır.
-- 2. bitişin kaynağı ayrı (bit_kaynak): sunucuda başlayan kontrol bağlantısızken bitebilir, tersi de.
-- 3. saat_tutmadi: bir kez doğru olur, geri alınmaz. Ölçülen değerler yine değişmez, kayıt silinmez.
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE kontrol ADD COLUMN IF NOT EXISTS bit_kaynak text;
ALTER TABLE kontrol ADD COLUMN IF NOT EXISTS cihaz_kanit jsonb;
ALTER TABLE kontrol ADD COLUMN IF NOT EXISTS saat_tutmadi boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kontrol_bit_kaynak_ck') THEN
    ALTER TABLE kontrol ADD CONSTRAINT kontrol_bit_kaynak_ck CHECK (bit_kaynak IS NULL OR bit_kaynak IN ('sunucu', 'cihaz'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kontrol_cihaz_kanit_ck') THEN
    ALTER TABLE kontrol ADD CONSTRAINT kontrol_cihaz_kanit_ck
      CHECK (cihaz_kanit IS NULL OR (jsonb_typeof(cihaz_kanit) = 'object' AND pg_column_size(cihaz_kanit) <= 4000));
  END IF;
  -- cihaz saatiyle yazılan her uç kanıtını taşır
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kontrol_cihaz_kanit_var_ck') THEN
    ALTER TABLE kontrol ADD CONSTRAINT kontrol_cihaz_kanit_var_ck
      CHECK ((kaynak <> 'cihaz' OR coalesce(cihaz_kanit ? 'bas', false)) AND (bit_kaynak IS DISTINCT FROM 'cihaz' OR coalesce(cihaz_kanit ? 'bit', false)));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION kontrol_koru() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Kontrol kaydı silinmez.' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.bitti := NULL; NEW.bit_kaynak := NULL;
    IF NEW.kaynak = 'sunucu' THEN
      NEW.basladi := now(); NEW.cihaz_kanit := NULL; NEW.saat_tutmadi := false;
      NEW.duz_bas := NULL; NEW.duz_bit := NULL; NEW.duz_gerekce := NULL; NEW.duz_kim := NULL; NEW.duz_zaman := NULL;
    ELSIF NEW.kaynak = 'elle' THEN
      NEW.basladi := NULL; NEW.cihaz_kanit := NULL; NEW.saat_tutmadi := false; NEW.duz_zaman := now();
    ELSE
      -- cihaz saati: başlangıcı uygulama yazar (sunucu saatine çevrilmiş); ileri bir an olamaz
      IF NEW.basladi IS NULL OR NEW.basladi > now() + interval '1 minute' THEN
        RAISE EXCEPTION 'Cihaz saatiyle başlayan kontrolün başlangıcı ileri bir an olamaz.' USING ERRCODE = '23514';
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

GRANT UPDATE (bit_kaynak, cihaz_kanit, saat_tutmadi) ON kontrol TO probata_uygulama;
