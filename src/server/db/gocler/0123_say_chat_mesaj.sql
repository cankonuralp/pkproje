-- ══ 0123 · S.A.Y CHAT YENİDEN — KİŞİSEL SOHBET (2026-11-07; reisim: "S.A.Y Chat revizesini yapacağız", sunum claude.ai 2PiEskE9jDqF5kSefutRBC —
-- "Evet, önerilerle") ══
-- Uzman sahada WhatsApp'a yazar gibi kendine yazar: yazı, fotoğraf (altyazılı), belge. Sohbet KİŞİYE ÖZEL (RLS firma + kişi; S.A.Y da yalnız isteyenin
-- sohbetini okur) ve bir plana bağlı DEĞİL. S.A.Y "chatten oku" ile okur (chat_oku), işlediğini plana işaretler (chat_isle).
-- · cihaz_id: mesajın cihazda üretilen kimliği (çevrimdışı kuyruk — 392); zaman: cihazda yazıldığı an; sira: aynı anda yazılanların sırası. Sunucu sırayı
--   ve saati DEĞİŞTİRMEZ. cekim: fotoğrafın çekim saati (EXIF, cihazda — EXIF silinmeden önce okunur).
-- · dosya: fotoğraf / belge (dosya modülü "say_chat", kaydı mesajın CİHAZ kimliği — dosya mesajdan önce yüklenir; eski kayıttan taşınanda eski_kayit;
--   yalnız sahibi açar). on_okuma: fotoğraf ilk kez chat_oku ile okunduğunda bir kez.
-- · islendi*: chat_isle — hangi plana, kaç rapor; geri alınabilir. Karar 2: işlenmiş mesajın dosyası 30 gün sonra silinir, yazısı kalır (dosya_silindi).
-- · Eski düzen KALKAR (karar 1): say_chat_kayit'ta rapora dönmemiş kayıt sahibinin sohbetine kaydın saatiyle, işlenmemiş taşınır — fotoğrafları
--   fotoğraf mesajı (eski_kayit: dosyanın bağlı olduğu eski kayıt), satırları "ad: değer" yazısı. Sonra say_chat_kayit ve say_chat_ayar kalkar.
-- · yz_ek.chat_mesaj: S.A.Y'ın konuşmasına giren sohbet mesajı (aynı konuşmada ikinci kez eklenmez).
-- Kilit: tests/say-chat-mesaj.test.ts (gerçek PostgreSQL). ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS say_chat_mesaj (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id       uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id       uuid NOT NULL REFERENCES hesap(id),
  cihaz_id       uuid NOT NULL,
  zaman          timestamptz NOT NULL,
  sira           integer NOT NULL DEFAULT 0 CHECK (sira BETWEEN 0 AND 1000),
  tur            text NOT NULL CHECK (tur IN ('yazi', 'foto', 'belge')),
  metin          text CHECK (metin IS NULL OR char_length(metin) <= 4000),
  dosya          uuid,
  dosya_ad       text CHECK (dosya_ad IS NULL OR char_length(dosya_ad) <= 200),
  cekim          text CHECK (cekim IS NULL OR cekim ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}'),
  on_okuma       jsonb CHECK (on_okuma IS NULL OR (jsonb_typeof(on_okuma) = 'object' AND length(on_okuma::text) <= 20000)),
  eski_kayit     uuid,
  islendi        timestamptz,
  islendi_plan   uuid,
  islendi_no     text CHECK (islendi_no IS NULL OR char_length(islendi_no) <= 40),
  islendi_rapor  integer CHECK (islendi_rapor IS NULL OR islendi_rapor >= 0),
  dosya_silindi  timestamptz,
  surum          integer NOT NULL DEFAULT 0,
  olustu         timestamptz NOT NULL DEFAULT now(),
  degisti        timestamptz NOT NULL DEFAULT now(),
  CHECK (tur <> 'yazi' OR (dosya IS NULL AND metin IS NOT NULL AND char_length(btrim(metin)) > 0)),
  CHECK (tur = 'yazi' OR dosya IS NOT NULL),
  CHECK ((islendi IS NULL) = (islendi_plan IS NULL)),
  UNIQUE (firma_id, cihaz_id),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS say_chat_mesaj_sira ON say_chat_mesaj (firma_id, hesap_id, zaman, sira);
CREATE INDEX IF NOT EXISTS say_chat_mesaj_hesap ON say_chat_mesaj (hesap_id);

/* taşıma: eski kayıtlar (rapora dönmemiş — rapor yazılınca kayıt silinirdi) sahibinin sohbetine. Tetik bundan sonra kurulur (sahibi işlemden değil, kayıttan). */
DO $$
BEGIN
  IF to_regclass('public.say_chat_kayit') IS NOT NULL THEN
    INSERT INTO say_chat_mesaj (firma_id, hesap_id, cihaz_id, zaman, sira, tur, dosya, dosya_ad, eski_kayit)
    SELECT k.firma_id, k.hesap_id, gen_random_uuid(), k.olustu, f.n::int, 'foto', (f.x->>'dosya')::uuid, left(coalesce(f.x->>'ad', 'foto.jpg'), 200), k.id
      FROM say_chat_kayit k, jsonb_array_elements(k.fotolar) WITH ORDINALITY f(x, n)
      WHERE f.x->>'dosya' ~ '^[0-9a-f-]{36}$' AND f.n <= 900;
    INSERT INTO say_chat_mesaj (firma_id, hesap_id, cihaz_id, zaman, sira, tur, metin, eski_kayit)
    SELECT k.firma_id, k.hesap_id, gen_random_uuid(), k.olustu, 999, 'yazi', left(t.metin, 4000), k.id
      FROM say_chat_kayit k CROSS JOIN LATERAL (
        SELECT string_agg(coalesce(nullif(btrim(k.tanim->'satirlar'->((m.n - 1)::int)->>'ad'), ''), m.n || '. satır') || ': ' || btrim(m.v), E'\n' ORDER BY m.n) AS metin
          FROM jsonb_array_elements_text(k.mesaj) WITH ORDINALITY m(v, n) WHERE btrim(m.v) NOT IN ('', '-')) t
      WHERE t.metin IS NOT NULL;
  END IF;
END $$;

ALTER TABLE say_chat_mesaj ENABLE ROW LEVEL SECURITY;
ALTER TABLE say_chat_mesaj FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_chat_mesaj' AND policyname = 'say_chat_mesaj_kendi') THEN
    CREATE POLICY say_chat_mesaj_kendi ON say_chat_mesaj
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
END $$;

/* sahibi işlemin bağlamından; mesajın kendisi (kimlik, saat, sıra, tür, yazı, dosya, çekim) değişmez — değişen yalnız ön okuma, işaret, dosyanın silinmesi */
CREATE OR REPLACE FUNCTION say_chat_mesaj_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF ben IS NULL THEN RAISE EXCEPTION 'S.A.Y Chat mesajını oturumdaki kişi yazar' USING ERRCODE = '23514'; END IF;
    NEW.hesap_id := ben;
    RETURN NEW;
  END IF;
  IF NEW.hesap_id IS DISTINCT FROM OLD.hesap_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.cihaz_id IS DISTINCT FROM OLD.cihaz_id
    OR NEW.zaman IS DISTINCT FROM OLD.zaman OR NEW.sira IS DISTINCT FROM OLD.sira OR NEW.tur IS DISTINCT FROM OLD.tur OR NEW.metin IS DISTINCT FROM OLD.metin
    OR NEW.dosya IS DISTINCT FROM OLD.dosya OR NEW.dosya_ad IS DISTINCT FROM OLD.dosya_ad OR NEW.cekim IS DISTINCT FROM OLD.cekim
    OR NEW.eski_kayit IS DISTINCT FROM OLD.eski_kayit OR NEW.olustu IS DISTINCT FROM OLD.olustu THEN
    RAISE EXCEPTION 'S.A.Y Chat mesajı değişmez (yalnız ön okuma, işaret ve dosyanın silinmesi)' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION say_chat_mesaj_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_chat_mesaj_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER say_chat_mesaj_koru BEFORE INSERT OR UPDATE ON say_chat_mesaj FOR EACH ROW EXECUTE FUNCTION say_chat_mesaj_koru();

/* cihaz kimliği bu firmada başka kişinin mesajında mı (RLS'de görünmez; aynı kimlikle yazılırsa iş YAPILMADAN reddedilir) — yalnız evet / hayır */
CREATE OR REPLACE FUNCTION say_chat_mesaj_baskasinda(p_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM say_chat_mesaj m WHERE m.firma_id = gecerli_firma() AND m.cihaz_id = p_id
    AND m.hesap_id IS DISTINCT FROM NULLIF(current_setting('app.hesap_id', true), '')::uuid)
$$;
ALTER FUNCTION say_chat_mesaj_baskasinda(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_chat_mesaj_baskasinda(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION say_chat_mesaj_baskasinda(uuid) TO probata_uygulama;

REVOKE ALL ON say_chat_mesaj FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON say_chat_mesaj TO probata_uygulama;

/* S.A.Y'ın konuşmasına giren sohbet mesajı */
ALTER TABLE yz_ek ADD COLUMN IF NOT EXISTS chat_mesaj uuid;

/* eski düzen kalkar (karar 1): kayıt ve tür ayarı */
DROP TABLE IF EXISTS say_chat_kayit;
DROP FUNCTION IF EXISTS say_chat_kayit_koru();
DROP FUNCTION IF EXISTS say_chat_cihaz_baskasinda(uuid);
DROP TABLE IF EXISTS say_chat_ayar;
DROP FUNCTION IF EXISTS say_chat_ayar_koru();

/* yedeklenen tablolar (0119): say_chat_ayar düştü — liste src/server/yedek/tablolar.ts ile aynı (kilit tests/yedek-saf.test.ts son tanımı okur) */
CREATE OR REPLACE FUNCTION yedek_tablolari() RETURNS text[]
  LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['arac', 'arac_km', 'arac_tutanagi', 'belge_doldurma', 'belge_format', 'belge_onay', 'bordro', 'cihaz_turu', 'demirbas',
    'denetim_izi', 'dokuman', 'dosya', 'egitim_kaydi', 'egitim_turu', 'ekipman', 'ekipman_atamasi', 'ekipman_kodu', 'ekipman_turu', 'fatura',
    'fatura_rapor', 'firma_ayar', 'fiyat_listesi', 'format_parca', 'gider', 'hesap', 'ice_aktarim', 'imza_istegi', 'is_sozlesmesi',
    'is_sozlesmesi_tesis', 'isg_katip', 'izin_talebi', 'kalibrasyon', 'kosul_kabul', 'musteri', 'musteri_hesap', 'numara_sayaci', 'olcum_cihazi',
    'ozluk_belgesi', 'personel', 'plan', 'plan_ekip', 'plan_ekipman', 'plan_not', 'rapor', 'rapor_format', 'rapor_hareket', 'rapor_revize_istegi',
    'rapor_surumu', 'saha_formu', 'saklama_silme', 'sozlesme_sablon', 'standart', 'standart_tanim', 'tahsilat', 'teklif',
    'teklif_kalem', 'teklif_tesis', 'tesis', 'tur_format', 'uygunsuzluk', 'zimmet_formu', 'zimmet_hareket']::text[]
$$;
ALTER FUNCTION yedek_tablolari() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yedek_tablolari() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yedek_tablolari() TO probata_uygulama;

/* belge mesajında Word (.docx) da olur (S.A.Y'ın kabul ettiği belgeler: PDF, Word, Excel) — dosya türü listesine (src/server/dosya/tur.ts TURLER) */
ALTER TABLE dosya DROP CONSTRAINT IF EXISTS dosya_tur_check;
ALTER TABLE dosya ADD CONSTRAINT dosya_tur_check CHECK (tur IN ('image/jpeg', 'image/png', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv'));
