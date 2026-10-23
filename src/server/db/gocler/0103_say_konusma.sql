-- ══ 0103 · S.A.Y KONUŞMASI OLDUĞU GİBİ (2026-10-23 — reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde çalıştıramaz
-- mıyız", "tamam onaylıyorum … baştan kurarken herhangi bir kısıt kurma tamamen temiz kurulum yap, hiç bir kısıtı olmasın") ══
-- · yz_konusma: kişinin S.A.Y konuşmasının yapay zekâya giden hâli — her ileti Messages API'nin içeriğiyle (düşünme ve imzası, araç çağrısı, araç
--   sonucu, ek başvurusu) BİREBİR, sırasıyla; yalnız sona eklenir (düşünme bloğu kendinden önceki her şey değişmeden kaldıkça geçerli). Tek istisna:
--   son yapay zekâ iletisinden SONRAKİ kuyruk (cevapsız kalmış soru ve sayfa notu) düzeltilebilir — ardında düşünme bloğu yoktur.
-- · yz_ek: konuşmaya eklenen dosyanın Anthropic Dosya API'sindeki kimliği, adı, türü, boyu — dosya konuşmada kalır, "Sohbeti temizle" ile silinir
--   (522'deki "ek saklanmaz" kararı kalktı — reisim onayı 2026-10-23).
-- · yz_ek_parca: büyük dosyanın tarayıcıdan parça parça gelişi (barındırmanın istek boyu sınırı); dosya birleşip yüklenince parçalar silinir.
-- · yz_konusma_is: kişinin o anki S.A.Y işi (iki pencere aynı konuşmaya aynı anda yazıp sırayı bozmasın); süresi dolan iş yenisine yer verir.
-- · yz_sohbet (0071 / 0090): kişi başı 200 ileti, metin ve ek boyu sınırları KALKTI (görünen geçmiş konuşmanın tamamı kalır).
-- RLS firma + hesap (yz_sohbet gibi); hesap ekleme anında işlemin bağlamından damgalanır. Politika "(SELECT …)" ile, her yabancı anahtar dizinli
-- (0091). Kilit: tests/say.test.ts; olumsuz kanıt tests/bozan/say.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS yz_konusma (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  sira      bigint GENERATED ALWAYS AS IDENTITY,
  rol       text NOT NULL CHECK (rol IN ('user', 'assistant', 'system')),
  icerik    jsonb NOT NULL CHECK (jsonb_typeof(icerik) IN ('array', 'string')),
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS yz_konusma_kisi ON yz_konusma (firma_id, hesap_id, sira);
CREATE INDEX IF NOT EXISTS yz_konusma_hesap ON yz_konusma (hesap_id);

CREATE TABLE IF NOT EXISTS yz_ek (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  dosya     text NOT NULL CHECK (length(dosya) BETWEEN 1 AND 200),
  ad        text NOT NULL CHECK (length(ad) >= 1),
  tur       text NOT NULL CHECK (tur IN ('foto', 'pdf', 'word', 'metin', 'tablo')),
  mime      text NOT NULL CHECK (length(mime) BETWEEN 1 AND 100),
  boyut     bigint NOT NULL CHECK (boyut >= 0),
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS yz_ek_kisi ON yz_ek (firma_id, hesap_id, zaman);
CREATE INDEX IF NOT EXISTS yz_ek_hesap ON yz_ek (hesap_id);

CREATE TABLE IF NOT EXISTS yz_ek_parca (
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  yukleme   uuid NOT NULL,
  sira      integer NOT NULL CHECK (sira >= 0),
  veri      bytea NOT NULL,
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (firma_id, hesap_id, yukleme, sira)
);
CREATE INDEX IF NOT EXISTS yz_ek_parca_hesap ON yz_ek_parca (hesap_id);

CREATE TABLE IF NOT EXISTS yz_konusma_is (
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  is_id     uuid NOT NULL,
  bitis     timestamptz NOT NULL,
  -- aynı cevapta ekranın işinden ÖNCE sunucunun yaptığı işlerin sonuçları (araç çağrısı kimliği → sonuç); ekranın sonucuyla birlikte konuşmaya girer
  bekleyen  jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(bekleyen) = 'object'),
  PRIMARY KEY (firma_id, hesap_id)
);
CREATE INDEX IF NOT EXISTS yz_konusma_is_hesap ON yz_konusma_is (hesap_id);

ALTER TABLE yz_konusma ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_konusma FORCE ROW LEVEL SECURITY;
ALTER TABLE yz_ek ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_ek FORCE ROW LEVEL SECURITY;
ALTER TABLE yz_ek_parca ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_ek_parca FORCE ROW LEVEL SECURITY;
ALTER TABLE yz_konusma_is ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_konusma_is FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_konusma' AND policyname = 'yz_konusma_kendi') THEN
    CREATE POLICY yz_konusma_kendi ON yz_konusma
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_ek' AND policyname = 'yz_ek_kendi') THEN
    CREATE POLICY yz_ek_kendi ON yz_ek
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_ek_parca' AND policyname = 'yz_ek_parca_kendi') THEN
    CREATE POLICY yz_ek_parca_kendi ON yz_ek_parca
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_konusma_is' AND policyname = 'yz_konusma_is_kendi') THEN
    CREATE POLICY yz_konusma_is_kendi ON yz_konusma_is
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
END $$;
REVOKE ALL ON yz_konusma FROM PUBLIC;
REVOKE ALL ON yz_ek FROM PUBLIC;
REVOKE ALL ON yz_ek_parca FROM PUBLIC;
REVOKE ALL ON yz_konusma_is FROM PUBLIC;

/* sahibi işlemin bağlamından (istemciden alınmaz); konuşmanın ve ekin satırı değişmez (yalnız eklenir / silinir) */
CREATE OR REPLACE FUNCTION yz_konusma_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF ben IS NULL THEN RAISE EXCEPTION 'S.A.Y konuşmasını oturumdaki kişi yazar' USING ERRCODE = '23514'; END IF;
    NEW.hesap_id := ben;
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME <> 'yz_konusma_is' THEN RAISE EXCEPTION 'S.A.Y konuşması değişmez; yalnız sona eklenir' USING ERRCODE = '23514'; END IF;
  IF NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.hesap_id IS DISTINCT FROM OLD.hesap_id THEN
    RAISE EXCEPTION 'S.A.Y işinin sahibi değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION yz_konusma_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yz_konusma_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER yz_konusma_koru BEFORE INSERT OR UPDATE ON yz_konusma FOR EACH ROW EXECUTE FUNCTION yz_konusma_koru();
CREATE OR REPLACE TRIGGER yz_ek_koru BEFORE INSERT OR UPDATE ON yz_ek FOR EACH ROW EXECUTE FUNCTION yz_konusma_koru();
CREATE OR REPLACE TRIGGER yz_ek_parca_koru BEFORE INSERT OR UPDATE ON yz_ek_parca FOR EACH ROW EXECUTE FUNCTION yz_konusma_koru();
CREATE OR REPLACE TRIGGER yz_konusma_is_koru BEFORE INSERT OR UPDATE ON yz_konusma_is FOR EACH ROW EXECUTE FUNCTION yz_konusma_koru();

GRANT SELECT, INSERT, DELETE ON yz_konusma TO probata_uygulama;
GRANT SELECT, INSERT, DELETE ON yz_ek TO probata_uygulama;
GRANT SELECT, INSERT, DELETE ON yz_ek_parca TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE, DELETE ON yz_konusma_is TO probata_uygulama;

/* yz_sohbet: 200 ileti ve boy sınırları kalkar (konuşmanın görünen hâli bütünüyle kalır) */
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'yz_sohbet'::regclass AND conname = 'yz_sohbet_metin_uzunluk') THEN
    ALTER TABLE yz_sohbet DROP CONSTRAINT yz_sohbet_metin_uzunluk;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'yz_sohbet'::regclass AND conname = 'yz_sohbet_metin_bos_degil') THEN
    ALTER TABLE yz_sohbet ADD CONSTRAINT yz_sohbet_metin_bos_degil CHECK (length(metin) >= 1);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'yz_sohbet'::regclass AND conname = 'yz_sohbet_ek_check') THEN
    ALTER TABLE yz_sohbet DROP CONSTRAINT yz_sohbet_ek_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'yz_sohbet'::regclass AND conname = 'yz_sohbet_ek_nesne') THEN
    ALTER TABLE yz_sohbet ADD CONSTRAINT yz_sohbet_ek_nesne CHECK (ek IS NULL OR jsonb_typeof(ek) = 'object');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION yz_sohbet_yaz(p_kim text, p_metin text, p_yer text, p_ek jsonb) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  i uuid;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'sohbeti oturumdaki kişi yazar' USING ERRCODE = '42501'; END IF;
  INSERT INTO yz_sohbet (firma_id, hesap_id, kim, metin, yer, ek) VALUES (f, ben, p_kim, p_metin, p_yer, p_ek) RETURNING id INTO i;
  RETURN i;
END $$;
ALTER FUNCTION yz_sohbet_yaz(text, text, text, jsonb) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yz_sohbet_yaz(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yz_sohbet_yaz(text, text, text, jsonb) TO probata_uygulama;
