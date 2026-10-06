-- ══ 0052 · YAPAY ZEKÂ — fotoğraftan okuma: kişi başı aylık kullanım ve okuma kaydı (351; ARKA-UC §5.1–5.2, K1; §8.10 "değer öneri olarak düşer";
-- maket rapor.html Z3, firma-ayarlari.html Y1; 09-G3 istisnası: firma ayarıyla açılır, çağrı yalnız sunucudan, firmanın anahtarıyla) ══
-- yz_kullanim: firma × hesap × ay — okuma sayısı ve maliyet (milyonda bir dolar). Sınır (firma ayarı "kişi başı aylık $") buradan denetlenir. Satır
-- yalnız ARTAR (tetik: sayılar azalamaz, kişi / ay değişmez); hesap işlemin bağlamından damgalanır (istemci başkasının hanesine yazamaz).
-- yz_okuma: her okumanın kaydı (rapor, bölüm, model, öneri, token, maliyet) — kalite takibi (hangi alanda ne sıklıkla düzeltildiği) için; yalnız
-- eklenir. Fotoğrafın kendisi SAKLANMAZ (öneri uygulanınca değerler raporda; fotoğraf ayrıca eklenirse rapor fotoğrafı olur). ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS yz_kullanim (
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  ay        text NOT NULL CHECK (ay ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  okuma     integer NOT NULL DEFAULT 0 CHECK (okuma >= 0),
  maliyet   bigint NOT NULL DEFAULT 0 CHECK (maliyet >= 0),
  degisti   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firma_id, hesap_id, ay)
);
ALTER TABLE yz_kullanim ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_kullanim FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_kullanim' AND policyname = 'yz_kullanim_kiraci') THEN
    CREATE POLICY yz_kullanim_kiraci ON yz_kullanim USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS yz_okuma (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  rapor_id  uuid NOT NULL,
  bolum     text NOT NULL CHECK (bolum ~ '^[a-z][a-z0-9_]{0,23}$'),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  model     text NOT NULL CHECK (model IN ('opus', 'sonnet')),
  oneri     jsonb NOT NULL CHECK (jsonb_typeof(oneri) = 'array' AND jsonb_array_length(oneri) <= 200),
  giris     integer NOT NULL CHECK (giris >= 0),
  cikis     integer NOT NULL CHECK (cikis >= 0),
  maliyet   bigint NOT NULL CHECK (maliyet >= 0),
  zaman     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, rapor_id) REFERENCES rapor (firma_id, id)
);
CREATE INDEX IF NOT EXISTS yz_okuma_rapor ON yz_okuma (firma_id, rapor_id, zaman DESC);
ALTER TABLE yz_okuma ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_okuma FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_okuma' AND policyname = 'yz_okuma_kiraci') THEN
    CREATE POLICY yz_okuma_kiraci ON yz_okuma USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- hesap işlemin bağlamından; kullanım yalnız artar, kişi / ay / firma değişmez; okuma kaydı değişmez
CREATE OR REPLACE FUNCTION yz_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'yapay zekâ kaydı silinmez' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF ben IS NULL THEN RAISE EXCEPTION 'yapay zekâ kaydını oturumdaki kişi yazar' USING ERRCODE = '23514'; END IF;
    NEW.hesap_id := ben;
    IF TG_TABLE_NAME = 'yz_okuma' THEN NEW.zaman := now(); ELSE NEW.degisti := now(); END IF;
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME = 'yz_okuma' THEN RAISE EXCEPTION 'okuma kaydı değişmez' USING ERRCODE = '23514'; END IF;
  IF NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.hesap_id IS DISTINCT FROM OLD.hesap_id OR NEW.ay IS DISTINCT FROM OLD.ay
    OR NEW.okuma < OLD.okuma OR NEW.maliyet < OLD.maliyet THEN
    RAISE EXCEPTION 'kullanım yalnız artar' USING ERRCODE = '23514';
  END IF;
  IF ben IS NULL OR ben IS DISTINCT FROM OLD.hesap_id THEN RAISE EXCEPTION 'kullanımı yalnız kişinin kendi okuması artırır' USING ERRCODE = '23514'; END IF;
  NEW.degisti := now();
  RETURN NEW;
END $$;
ALTER FUNCTION yz_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yz_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER yz_kullanim_koru BEFORE INSERT OR UPDATE OR DELETE ON yz_kullanim FOR EACH ROW EXECUTE FUNCTION yz_koru();
CREATE OR REPLACE TRIGGER yz_okuma_koru BEFORE INSERT OR UPDATE OR DELETE ON yz_okuma FOR EACH ROW EXECUTE FUNCTION yz_koru();

GRANT SELECT, INSERT, UPDATE ON yz_kullanim TO probata_uygulama;
GRANT SELECT, INSERT ON yz_okuma TO probata_uygulama;
