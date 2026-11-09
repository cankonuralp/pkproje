-- ══ 0124 · S.A.Y CHAT RAPOR MODU (2026-11-09; reisim: "eskisi gibi direk rapor oluşturma modu olsun … rapor modu, chat modu diye ayrım olsun", sunum
-- claude.ai HBwuL3s9G693uopxSzTbjH K1–K6 — "Evet, önerilerle") ══
-- Bir kayıt = bir ekipman: fotoğraflar, ekipman (plandan ya da yeni tür), satır satır mesaj. "Bekleyenler için rapor yaz" ile rapor taslağı olur; kayıt rapor
-- bağlantısıyla kalır (K5), fotoğrafları rapora geçer. KİŞİYE ÖZEL (RLS firma + kişi). Sohbetten (say_chat_mesaj) ayrı; Geçmişi sil buna dokunmaz.
-- · cihaz_id: kaydın cihazda üretilen kimliği (çevrimdışı kuyruk — 392). plan_id, ekipman_id, tur_id, rapor_id yabancı anahtar DEĞİL: kayıt kişinin çalışma notu,
--   planın ya da ekipmanın silinmesini engellemez (o zaman kayıt görünmez olur).
-- · satirlar: yazıldığı anki satırlar (K1: formatın ekipman bilgilerinden) — format sonradan değişse de mesaj satırları aynı anlama gelir.
-- · fotolar: [{dosya, ad, rol}] dosya modülü "say_chat", kaydı cihaz_id; yalnız sahibi açar.
-- Kilit: tests/raporlar.test.ts (gerçek PostgreSQL). ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS say_rapor_kayit (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id    uuid NOT NULL REFERENCES hesap(id),
  cihaz_id    uuid NOT NULL,
  plan_id     uuid NOT NULL,
  ekipman_id  uuid,
  tur_id      uuid,
  satirlar    jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(satirlar) = 'array' AND length(satirlar::text) <= 20000),
  mesaj       jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(mesaj) = 'array' AND length(mesaj::text) <= 40000),
  fotolar     jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(fotolar) = 'array' AND length(fotolar::text) <= 20000),
  rapor_id    uuid,
  rapor_no    text CHECK (rapor_no IS NULL OR char_length(rapor_no) <= 60),
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, cihaz_id),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS say_rapor_kayit_plan ON say_rapor_kayit (firma_id, hesap_id, plan_id, olustu);
CREATE INDEX IF NOT EXISTS say_rapor_kayit_hesap ON say_rapor_kayit (hesap_id);

ALTER TABLE say_rapor_kayit ENABLE ROW LEVEL SECURITY;
ALTER TABLE say_rapor_kayit FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_rapor_kayit' AND policyname = 'say_rapor_kayit_kendi') THEN
    CREATE POLICY say_rapor_kayit_kendi ON say_rapor_kayit
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
END $$;

/* yazan oturumdaki kişi; kaydın sahibi ve kimliği değişmez */
CREATE OR REPLACE FUNCTION say_rapor_kayit_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
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
  RETURN NEW;
END $$;
ALTER FUNCTION say_rapor_kayit_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_rapor_kayit_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER say_rapor_kayit_koru BEFORE INSERT OR UPDATE ON say_rapor_kayit FOR EACH ROW EXECUTE FUNCTION say_rapor_kayit_koru();

/* cihaz kimliği bu firmada başka kişinin kaydında mı (RLS'de görünmez; aynı kimlikle yazılırsa iş YAPILMADAN reddedilir) — yalnız evet / hayır */
CREATE OR REPLACE FUNCTION say_rapor_kayit_baskasinda(p_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM say_rapor_kayit k WHERE k.firma_id = gecerli_firma() AND k.cihaz_id = p_id
    AND k.hesap_id IS DISTINCT FROM NULLIF(current_setting('app.hesap_id', true), '')::uuid)
$$;
ALTER FUNCTION say_rapor_kayit_baskasinda(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_rapor_kayit_baskasinda(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION say_rapor_kayit_baskasinda(uuid) TO probata_uygulama;

REVOKE ALL ON say_rapor_kayit FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON say_rapor_kayit TO probata_uygulama;
