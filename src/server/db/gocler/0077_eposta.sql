-- ══ 0077 · E-POSTA KUYRUĞU + PLANIN BİLGİLENDİRME LİSTESİ (432; reisim 2026-10-09: "Plan açıldığında planın açıldığı denetçilere otomatik mail
-- gidecek gerekirse bilgilendirme kısmına elle ya da listeden mail girilebilecek") ══
-- Giden her e-posta önce buraya yazılır (alıcı başına bir satır — alıcılar birbirini görmez), sonra gönderilir (yanıttan sonra; gece işi bekleyenleri
-- yeniden dener). Sağlayıcı (KOD-GECIS Y4) kurulmadıysa satır "bekliyor" kalır, nedeni yazılır — sessiz kayıp yok. Firma yalnız kendi
-- e-postalarını görür (RLS). Gövde gönderilecek metnin kendisidir (alıcıya giden hâl; sonradan değişmez — yalnız durum / deneme / hata değişir).
-- Plan: bilgilendirme listesi (elle ya da listeden; en çok 20 adres, küçük harf). Kilit: tests/eposta-kuyruk.test.ts; olumsuz kanıt
-- tests/bozan/eposta.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS eposta (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  kime        text NOT NULL CHECK (kime = lower(kime) AND length(kime) BETWEEN 3 AND 254 AND position('@' in kime) > 1),
  konu        text NOT NULL CHECK (length(btrim(konu)) BETWEEN 1 AND 300),
  govde       text NOT NULL CHECK (length(govde) BETWEEN 1 AND 20000),
  kaynak      text NOT NULL CHECK (kaynak ~ '^[a-z_]{1,20}$'),
  kaynak_id   uuid,
  durum       text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'gonderildi', 'hata')),
  deneme      integer NOT NULL DEFAULT 0 CHECK (deneme BETWEEN 0 AND 100),
  son_hata    text CHECK (son_hata IS NULL OR length(son_hata) <= 300),
  gonderildi  timestamptz,
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, id),
  CHECK ((durum = 'gonderildi') = (gonderildi IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS eposta_kaynak ON eposta (firma_id, kaynak, kaynak_id);
CREATE INDEX IF NOT EXISTS eposta_bekleyen ON eposta (firma_id, olustu) WHERE durum = 'bekliyor';
ALTER TABLE eposta ENABLE ROW LEVEL SECURITY;
ALTER TABLE eposta FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eposta' AND policyname = 'eposta_kiraci') THEN
    CREATE POLICY eposta_kiraci ON eposta USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

/* gönderilen metin değişmez: alıcı, konu, gövde, kaynak yazıldığı gibi kalır; gönderilmiş e-posta yeniden "bekliyor" olmaz */
CREATE OR REPLACE FUNCTION eposta_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'e-posta kaydı silinmez' USING ERRCODE = '23514'; END IF;
  IF NEW.kime IS DISTINCT FROM OLD.kime OR NEW.konu IS DISTINCT FROM OLD.konu OR NEW.govde IS DISTINCT FROM OLD.govde
     OR NEW.kaynak IS DISTINCT FROM OLD.kaynak OR NEW.kaynak_id IS DISTINCT FROM OLD.kaynak_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'gönderilecek e-postanın metni değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'gonderildi' AND NEW.durum <> 'gonderildi' THEN RAISE EXCEPTION 'gönderilmiş e-posta geri alınmaz' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION eposta_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION eposta_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER eposta_koru BEFORE UPDATE OR DELETE ON eposta FOR EACH ROW EXECUTE FUNCTION eposta_koru();

REVOKE ALL ON eposta FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON eposta TO probata_uygulama;

ALTER TABLE plan ADD COLUMN IF NOT EXISTS bilgilendirme text[] NOT NULL DEFAULT '{}';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_bilgilendirme_sinir') THEN
    ALTER TABLE plan ADD CONSTRAINT plan_bilgilendirme_sinir CHECK (cardinality(bilgilendirme) <= 20);
  END IF;
END $$;
