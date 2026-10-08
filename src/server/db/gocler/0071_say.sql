-- ══ 0071 · S.A.Y SAHA ASİSTANI — sohbet geçmişi + mesaj sayacı (380; KOD-GECIS K5 "yapay zekâ — sonra S.A.Y", ARKA-UC §5.3, maket say.js BB6) ══
-- Reisim 2026-10-03: "her yerden tek boy yönetilir, sayfa değişince vs geçmiş silinmez, geçmiş olayı önemli" → geçmiş KİŞİNİN HESABINDA, yalnız
-- kendisi görür (RLS: firma + hesap), kalıcı; "Sohbeti temizle" yalnız kendi geçmişini siler. Uygulama rolü tabloya yazamaz / silemez:
-- yz_sohbet_yaz (kişi başı en yeni 200 ileti kalır) ve yz_sohbet_temizle tanımlayıcı-yetkili, hesap işlemin bağlamından (istemciden değil).
-- yz_kullanim.mesaj: kişinin bu ayki S.A.Y mesaj sayısı (Firma ayarları › Yapay zekâ "S.A.Y mesajı" sütunu, maket Y1) — okuma / maliyet gibi
-- yalnız ARTAR (yz_koru). Kilit: tests/say.test.ts; olumsuz kanıt tests/bozan/say.bozan.ts. ⛔ Her göç IDEMPOTENT.

ALTER TABLE yz_kullanim ADD COLUMN IF NOT EXISTS mesaj integer NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'yz_kullanim_mesaj_eksi_degil' AND conrelid = 'yz_kullanim'::regclass) THEN
    ALTER TABLE yz_kullanim ADD CONSTRAINT yz_kullanim_mesaj_eksi_degil CHECK (mesaj >= 0);
  END IF;
END $$;

-- 0053'teki tetik + mesaj da yalnız artar
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
    OR NEW.okuma < OLD.okuma OR NEW.maliyet < OLD.maliyet OR NEW.mesaj < OLD.mesaj THEN
    RAISE EXCEPTION 'kullanım yalnız artar' USING ERRCODE = '23514';
  END IF;
  IF ben IS NULL OR ben IS DISTINCT FROM OLD.hesap_id THEN RAISE EXCEPTION 'kullanımı yalnız kişinin kendi okuması değiştirir' USING ERRCODE = '23514'; END IF;
  NEW.degisti := now();
  RETURN NEW;
END $$;
ALTER FUNCTION yz_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yz_koru() FROM PUBLIC;

CREATE TABLE IF NOT EXISTS yz_sohbet (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  kim       text NOT NULL CHECK (kim IN ('ben', 'say')),
  metin     text NOT NULL CHECK (length(metin) BETWEEN 1 AND 6000),
  yer       text NOT NULL CHECK (length(yer) BETWEEN 1 AND 80),
  ek        jsonb CHECK (ek IS NULL OR (jsonb_typeof(ek) = 'object' AND octet_length(ek::text) <= 8000)),
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS yz_sohbet_kisi ON yz_sohbet (firma_id, hesap_id, zaman DESC);
ALTER TABLE yz_sohbet ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_sohbet FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_sohbet' AND policyname = 'yz_sohbet_kendi') THEN
    CREATE POLICY yz_sohbet_kendi ON yz_sohbet
      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)
      WITH CHECK (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid);
  END IF;
END $$;
REVOKE ALL ON yz_sohbet FROM PUBLIC;
GRANT SELECT ON yz_sohbet TO probata_uygulama;

/* ileti yazar (oturumdaki firma ve kişi; istemciden kimlik alınmaz); kişinin en yeni 200 iletisi kalır. Dönen: ileti kimliği */
CREATE OR REPLACE FUNCTION yz_sohbet_yaz(p_kim text, p_metin text, p_yer text, p_ek jsonb) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  i uuid;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'sohbeti oturumdaki kişi yazar' USING ERRCODE = '42501'; END IF;
  INSERT INTO yz_sohbet (firma_id, hesap_id, kim, metin, yer, ek) VALUES (f, ben, p_kim, p_metin, p_yer, p_ek) RETURNING id INTO i;
  DELETE FROM yz_sohbet s WHERE s.firma_id = f AND s.hesap_id = ben
    AND s.id NOT IN (SELECT x.id FROM yz_sohbet x WHERE x.firma_id = f AND x.hesap_id = ben ORDER BY x.zaman DESC, x.id DESC LIMIT 200);
  RETURN i;
END $$;
ALTER FUNCTION yz_sohbet_yaz(text, text, text, jsonb) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yz_sohbet_yaz(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yz_sohbet_yaz(text, text, text, jsonb) TO probata_uygulama;

/* "Sohbeti temizle": yalnız oturumdaki kişinin, bu firmadaki geçmişi. Dönen: silinen ileti sayısı */
CREATE OR REPLACE FUNCTION yz_sohbet_temizle() RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  n integer;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'sohbeti oturumdaki kişi temizler' USING ERRCODE = '42501'; END IF;
  DELETE FROM yz_sohbet WHERE firma_id = f AND hesap_id = ben;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
ALTER FUNCTION yz_sohbet_temizle() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yz_sohbet_temizle() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yz_sohbet_temizle() TO probata_uygulama;
