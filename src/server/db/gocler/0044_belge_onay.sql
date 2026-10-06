-- ══ 0044 · BELGE ONAYI — Onaylar › Diğer belgeler (333; KOD-GECIS §3 Onay ve imza "belge_onay (BELGE_ONAY: bordro, eğitim, zimmet, araç
-- tutanağı)"; maket onaylar.html #/diger, muhasebe.html "Maaş bordrosu gönder", personel.html bordro "Onaya gönder"; pkproje §11 230, 264, 265) ══
-- Kişinin imzasına gönderilen belge: tür, ad, imzalayacak kişi (personel), kaynağı (ör. bordro kaydı), bordroda dönem, imzasız PDF (belgenin
-- kendi dosyası — başka kaydın dosyası gösterilemez), durum: bekliyor → imzalı (imzalı PDF belgenin kendi dosyası) / geri gönderildi.
-- Gönderen ve zaman, karar veren ve zaman veritabanında damgalanır. Kararı (imzalı / geri) YALNIZ imzalayacak kişi verir (hesabının personeli);
-- karar verilmiş belge değişmez; belge silinmez. Bekleyen belge kaynağı değişince (bordro yeniden yüklendi / kaldırıldı) İPTAL olur — kişi eski
-- PDF'i imzalamasın (333 incelemesi). Bir kaynağın (bordro kaydı) tek etkin belgesi olur (bekliyor ya da imzalı); kaynaksız bordro belgesinde
-- (Muhasebe'nin bordrosu olmayan kişiye gönderdiği) kişi × dönem başına tek etkin belge. Geri gönderilen ve iptal edilen sayılmaz. ⛔ IDEMPOTENT.

CREATE TABLE IF NOT EXISTS belge_onay (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tur           text NOT NULL CHECK (tur IN ('bordro', 'egitim', 'zimmet', 'arac')),
  ad            text NOT NULL CHECK (length(btrim(ad)) BETWEEN 3 AND 120),
  personel_id   uuid NOT NULL,
  kaynak_id     uuid,
  ay            text CHECK (ay IS NULL OR ay ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  -- imzasız PDF: eklemeyle aynı işlemde bir kez yazılır (kayıt → dosya → bağ), sonra değişmez; işlem sonunda boş kalamaz (ertelenen denetim)
  dosya         uuid,
  durum         text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'imzali', 'geri', 'iptal')),
  imzali_dosya  uuid,
  gonderen      uuid,
  gonderildi    timestamptz NOT NULL DEFAULT now(),
  karar         timestamptz,
  karar_veren   uuid,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  FOREIGN KEY (firma_id, dosya) REFERENCES dosya (firma_id, id),
  FOREIGN KEY (firma_id, imzali_dosya) REFERENCES dosya (firma_id, id),
  UNIQUE (firma_id, id),
  CHECK ((durum = 'bekliyor') = (karar IS NULL)),
  CHECK ((durum = 'imzali') = (imzali_dosya IS NOT NULL)),
  CHECK (tur <> 'bordro' OR ay IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS belge_onay_kaynak_etkin ON belge_onay (firma_id, kaynak_id) WHERE kaynak_id IS NOT NULL AND durum IN ('bekliyor', 'imzali');
CREATE UNIQUE INDEX IF NOT EXISTS belge_onay_kaynaksiz_donem ON belge_onay (firma_id, personel_id, ay)
  WHERE tur = 'bordro' AND kaynak_id IS NULL AND durum IN ('bekliyor', 'imzali');
CREATE INDEX IF NOT EXISTS belge_onay_personel ON belge_onay (firma_id, personel_id, gonderildi DESC);
CREATE INDEX IF NOT EXISTS belge_onay_kaynak ON belge_onay (firma_id, kaynak_id) WHERE kaynak_id IS NOT NULL;
ALTER TABLE belge_onay ENABLE ROW LEVEL SECURITY;
ALTER TABLE belge_onay FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'belge_onay' AND policyname = 'belge_onay_kiraci') THEN
    CREATE POLICY belge_onay_kiraci ON belge_onay USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION belge_onay_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'onaya gönderilen belge silinmez' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF ben IS NULL THEN RAISE EXCEPTION 'belgeyi oturumdaki kişi gönderir' USING ERRCODE = '23514'; END IF;
    IF NEW.durum <> 'bekliyor' THEN RAISE EXCEPTION 'gönderilen belge imza bekler' USING ERRCODE = '23514'; END IF;
    IF NEW.dosya IS NOT NULL THEN RAISE EXCEPTION 'belgenin dosyası kayıttan sonra bağlanır' USING ERRCODE = '23514'; END IF;
    NEW.gonderen := ben; NEW.gonderildi := now(); NEW.karar := NULL; NEW.karar_veren := NULL; NEW.imzali_dosya := NULL;
    RETURN NEW;
  END IF;
  IF NEW.tur IS DISTINCT FROM OLD.tur OR NEW.ad IS DISTINCT FROM OLD.ad OR NEW.personel_id IS DISTINCT FROM OLD.personel_id
    OR NEW.kaynak_id IS DISTINCT FROM OLD.kaynak_id OR NEW.ay IS DISTINCT FROM OLD.ay OR NEW.gonderen IS DISTINCT FROM OLD.gonderen
    OR NEW.gonderildi IS DISTINCT FROM OLD.gonderildi OR NEW.olustu IS DISTINCT FROM OLD.olustu OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'gönderilen belge değişmez' USING ERRCODE = '23514';
  END IF;
  IF NEW.dosya IS DISTINCT FROM OLD.dosya THEN
    IF OLD.dosya IS NOT NULL OR OLD.durum <> 'bekliyor' OR ben IS NULL OR ben IS DISTINCT FROM OLD.gonderen THEN
      RAISE EXCEPTION 'belgenin dosyası bir kez, gönderenin işleminde bağlanır' USING ERRCODE = '23514';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.dosya AND d.modul = 'belge_onay' AND d.kayit_id = NEW.id AND d.cop IS NULL) THEN
      RAISE EXCEPTION 'belgenin dosyası bu belgeye yüklenmiş PDF olmalı' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF OLD.durum <> 'bekliyor' THEN RAISE EXCEPTION 'karar verilmiş belge değişmez' USING ERRCODE = '23514'; END IF;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF NEW.durum NOT IN ('imzali', 'geri', 'iptal') THEN RAISE EXCEPTION 'belge % durumuna geçemez', NEW.durum USING ERRCODE = '23514'; END IF;
    -- iptal: kaynağı değişen bekleyen belge (yetki uygulamada — kaynağın sahibi modül); imzalı / geri: yalnız imzacı
    IF NEW.durum = 'iptal' THEN
      IF ben IS NULL OR NEW.imzali_dosya IS NOT NULL THEN RAISE EXCEPTION 'belgeyi oturumdaki kişi iptal eder' USING ERRCODE = '23514'; END IF;
    ELSIF ben IS NULL OR NEW.personel_id IS DISTINCT FROM (SELECT h.personel_id FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.id = ben) THEN
      RAISE EXCEPTION 'belgeyi yalnız imzalayacak kişi imzalar ya da geri gönderir' USING ERRCODE = '23514';
    END IF;
    IF OLD.dosya IS NULL THEN RAISE EXCEPTION 'dosyası olmayan belge imzalanmaz' USING ERRCODE = '23514'; END IF;
    IF NEW.durum = 'imzali' AND NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.imzali_dosya AND d.modul = 'belge_onay_imzali'
      AND d.kayit_id = NEW.id AND d.cop IS NULL) THEN
      RAISE EXCEPTION 'imzalı PDF bu belgeye yüklenmiş olmalı' USING ERRCODE = '23514';
    END IF;
    NEW.karar := now(); NEW.karar_veren := ben;
  ELSIF NEW.karar IS DISTINCT FROM OLD.karar OR NEW.karar_veren IS DISTINCT FROM OLD.karar_veren OR NEW.imzali_dosya IS DISTINCT FROM OLD.imzali_dosya THEN
    RAISE EXCEPTION 'karar yalnız durum değişirken yazılır' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION belge_onay_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION belge_onay_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER belge_onay_koru BEFORE INSERT OR UPDATE OR DELETE ON belge_onay FOR EACH ROW EXECUTE FUNCTION belge_onay_koru();

-- işlem sonunda dosyasız belge kalmaz (kayıt → dosya → bağ aynı işlemde)
CREATE OR REPLACE FUNCTION belge_onay_dosyali() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT b.dosya FROM belge_onay b WHERE b.firma_id = NEW.firma_id AND b.id = NEW.id) IS NULL THEN
    RAISE EXCEPTION 'belge dosyasız gönderilemez' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION belge_onay_dosyali() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION belge_onay_dosyali() FROM PUBLIC;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'belge_onay_dosyali' AND tgrelid = 'belge_onay'::regclass) THEN
    CREATE CONSTRAINT TRIGGER belge_onay_dosyali AFTER INSERT ON belge_onay DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION belge_onay_dosyali();
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON belge_onay TO probata_uygulama;
