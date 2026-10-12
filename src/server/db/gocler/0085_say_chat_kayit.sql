-- ══ 0085 · S.A.Y CHAT KAYITLARI (524; pkproje §3.10 m.1–12, 18–24; maket 521 maket-saychat.js — reisim 2026-10-13: "onayılıyorum, yap bitir") ══
-- Sahada BİR ekipmanın kaydı: planın sohbetinde, KİŞİYE ÖZEL (m.2 — yalnız kaydı yazan görür; plan sorumlusu, teknik yönetici, yönetici GÖREMEZ):
-- RLS firma + hesap (yz_sohbet 0071 gibi); hesap ekleme anında işlemin bağlamından damgalanır (istemciden alınmaz), sonra değişmez.
-- · cihaz_id: kaydın CİHAZDA üretilen kimliği — çevrimdışı kuyruk (392) işleri bununla gelir; firmada eşsiz.
-- · ekipman: plandaki ekipman (ekipman_id — "Plandan seç") YA DA yeni ekipmanın türü (tur_id — "Yeni ekle"; kod rapor yazılırken, 525); ikisi
--   birden olamaz; fotoğraf önce gelirse ikisi de boş olabilir (kayıt fotoğrafla açılır, ekipman sonra seçilir).
-- · mesaj: numaralı satırlar (n. satır = tanımın n. maddesi); tanım: kaydın kullandığı satır tanımı (Ekipman türleri › S.A.Y Chat ayarları, 523 —
--   ayar sonradan değişse de kayıt kendi tanımıyla okunur, m.16); fotolar: [{ dosya, rol: ekipman | etiket | okunacak, k: bölüm }] (dosya modülü
--   "say_chat", kayıt kimliğiyle — yalnız sahibi açar).
-- · Plan, ekipman ya da tür kesin silinince kayıt da gider (ON DELETE CASCADE — silici.ts "birlikte"); rapor yazılınca kayıt silinir (525).
-- Kilit: tests/say-chat-kayit.test.ts (gerçek PostgreSQL, iki firma, aynı firmada iki kişi). ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS say_chat_kayit (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id     uuid NOT NULL REFERENCES hesap(id),
  cihaz_id     uuid NOT NULL,
  plan_id      uuid NOT NULL,
  ekipman_id   uuid,
  tur_id       uuid,
  mesaj        jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(mesaj) = 'array' AND jsonb_array_length(mesaj) <= 60 AND length(mesaj::text) <= 20000),
  tanim        jsonb CHECK (tanim IS NULL OR (jsonb_typeof(tanim) = 'object' AND length(tanim::text) <= 30000)),
  tanim_surum  integer NOT NULL DEFAULT 0 CHECK (tanim_surum >= 0),
  fotolar      jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(fotolar) = 'array' AND jsonb_array_length(fotolar) <= 60),
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  CHECK (ekipman_id IS NULL OR tur_id IS NULL),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id) ON DELETE CASCADE,
  FOREIGN KEY (firma_id, ekipman_id) REFERENCES ekipman (firma_id, id) ON DELETE CASCADE,
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id) ON DELETE CASCADE,
  UNIQUE (firma_id, cihaz_id),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS say_chat_kayit_plan ON say_chat_kayit (firma_id, hesap_id, plan_id, olustu);
ALTER TABLE say_chat_kayit ENABLE ROW LEVEL SECURITY;
ALTER TABLE say_chat_kayit FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_chat_kayit' AND policyname = 'say_chat_kayit_kendi') THEN
    CREATE POLICY say_chat_kayit_kendi ON say_chat_kayit
      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)
      WITH CHECK (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid);
  END IF;
END $$;

/* sahibi işlemin bağlamından; kimlikler (sahip, cihaz kimliği, plan) değişmez */
CREATE OR REPLACE FUNCTION say_chat_kayit_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF ben IS NULL THEN RAISE EXCEPTION 'S.A.Y Chat kaydını oturumdaki kişi yazar' USING ERRCODE = '23514'; END IF;
    NEW.hesap_id := ben;
    RETURN NEW;
  END IF;
  IF NEW.hesap_id IS DISTINCT FROM OLD.hesap_id OR NEW.cihaz_id IS DISTINCT FROM OLD.cihaz_id OR NEW.plan_id IS DISTINCT FROM OLD.plan_id
    OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'S.A.Y Chat kaydının sahibi, kimliği ve planı değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION say_chat_kayit_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_chat_kayit_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER say_chat_kayit_koru BEFORE INSERT OR UPDATE ON say_chat_kayit FOR EACH ROW EXECUTE FUNCTION say_chat_kayit_koru();

/* cihaz kimliği bu firmada başka kişinin kaydında mı (kişi başkasının kaydını RLS yüzünden göremez; aynı kimlikle yazılırsa iş YAPILMADAN
   reddedilir — 0076 islem_kimlik_baskasinda gibi). Yalnız evet / hayır. */
CREATE OR REPLACE FUNCTION say_chat_cihaz_baskasinda(p_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM say_chat_kayit k WHERE k.firma_id = gecerli_firma() AND k.cihaz_id = p_id
    AND k.hesap_id IS DISTINCT FROM NULLIF(current_setting('app.hesap_id', true), '')::uuid)
$$;
ALTER FUNCTION say_chat_cihaz_baskasinda(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_chat_cihaz_baskasinda(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION say_chat_cihaz_baskasinda(uuid) TO probata_uygulama;

REVOKE ALL ON say_chat_kayit FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON say_chat_kayit TO probata_uygulama;
