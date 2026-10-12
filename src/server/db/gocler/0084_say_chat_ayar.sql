-- ══ 0084 · S.A.Y CHAT AYARLARI (523; pkproje §3.10 m.13–16, maket 521 ekran 12 — reisim 2026-10-13: "onayılıyorum, yap bitir") ══
-- Ekipman türü başına S.A.Y Chat'in mesaj satırları (telefonda yazan ad · rapordaki alan · hazır değer, sırayla) ve okunacak fotoğraf başlıkları
-- (formatın fotoğraftan doldurması açık bölümleri; aç / kapa). Türün tek satırı; her Kaydet sürümü bir artırır (güvenli yazıcı, sürüm kilidi), eski
-- hâli denetim izinde. Kayıt yoksa ayar formattan hazır gelir (src/modules/say-chat/sema.ts hazirTanim). Gönderilmiş S.A.Y Chat kaydı kendi
-- tanımını taşır (524) — ayar değişince eski kayıtlar değişmez. Biçim uygulamada şemadan geçer; burada yalnız tür ve boy sınırı.
-- Tür kesin silinince ayar da gider (yabancı anahtar ON DELETE CASCADE — silici.ts ekipman_turu "birlikte"). Uygulama rolünün DELETE hakkı yok.
-- Kilit: tests/say-chat-ayar.test.ts (gerçek PostgreSQL, iki firma) + tests/say-chat-sema.test.ts; silme kapsamı tests/silme-kapsami.test.ts.
-- ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS say_chat_ayar (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tur_id      uuid NOT NULL,
  -- { satirlar: [{ ad, alan, hazir }], okunacak: [{ k, acik }] }
  tanim       jsonb NOT NULL CHECK (jsonb_typeof(tanim) = 'object' AND jsonb_typeof(tanim -> 'satirlar') = 'array'
                AND jsonb_array_length(tanim -> 'satirlar') BETWEEN 1 AND 30 AND jsonb_typeof(tanim -> 'okunacak') = 'array'
                AND jsonb_array_length(tanim -> 'okunacak') <= 40 AND length(tanim::text) <= 30000),
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id) ON DELETE CASCADE,
  UNIQUE (firma_id, tur_id),
  UNIQUE (firma_id, id)
);
ALTER TABLE say_chat_ayar ENABLE ROW LEVEL SECURITY;
ALTER TABLE say_chat_ayar FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_chat_ayar' AND policyname = 'say_chat_ayar_kiraci') THEN
    CREATE POLICY say_chat_ayar_kiraci ON say_chat_ayar USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

/* tür değişmez (satır türüne bağlı); firma değişmez (RLS WITH CHECK ayrıca) */
CREATE OR REPLACE FUNCTION say_chat_ayar_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tur_id IS DISTINCT FROM OLD.tur_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'S.A.Y Chat ayarının türü değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION say_chat_ayar_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_chat_ayar_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER say_chat_ayar_koru BEFORE UPDATE ON say_chat_ayar FOR EACH ROW EXECUTE FUNCTION say_chat_ayar_koru();

REVOKE ALL ON say_chat_ayar FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON say_chat_ayar TO probata_uygulama;
