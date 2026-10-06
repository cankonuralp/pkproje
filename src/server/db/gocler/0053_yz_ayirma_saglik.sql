-- ══ 0053 · 350–351 ÇAPRAZ İNCELEMESİ (354): yapay zekâ sınırına AYIRMA + sağlık denetiminin ikinci hâli ══
-- 1. yz_kullanim.ayrilan (milyonda bir dolar): çağrıdan ÖNCE, kişinin ay satırı kilitlenerek (FOR UPDATE) en kötü maliyet ayrılır; sınır
--    maliyet + ayrılan ile denetlenir. Eşzamanlı okumalar (iki sekme, iki cihaz, doğrudan istek) aynı eski maliyeti okuyup sınırı aşamaz; aşım en çok
--    bir okumanın gerçek maliyeti kadar. Kayıtta ayırma gerçek maliyetle kapanır; ücretsiz biten çağrıda (hizmet hata döndü) bırakılır; sonucu
--    bilinmeyende (zaman aşımı) en kötü maliyet harcamaya yazılır. İşlev çağrı ortasında kesilirse ayırma o ay kalır (harcanmış sayılır — güvenli yan).
--    Tetik (yz_koru): okuma ve maliyet yalnız ARTAR; ayrılan artar / azalır (kişinin kendi satırı, kişi / ay / firma değişmez); kayıt silinmez.
-- 2. saglik_denetimi(): 350–351 incelemesi — (a) uygulama_ayricalikli BAĞLANAN rolü ölçer (session_user; SECURITY DEFINER içinde current_user
--    sahiptir): rol probata_uygulama değilse ya da süper kullanıcı / RLS'yi aşan ya da öyle bir rolün üyesiyse ayrıcalıklı; eskisi adı sabit rolün
--    bayraklarına bakıyordu, uygulama yanlışlıkla postgres ile bağlansa "kısıtlı" derdi. (b) api_sema service_role'ü de sayar (0000 / 0008 kümesi).
--    (c) goc_sayisi: arada atlanmış göç son göçün adıyla yakalanmaz — kod uygulanmış göç SAYISINI da bekler (src/server/db/son-goc.ts).
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE yz_kullanim ADD COLUMN IF NOT EXISTS ayrilan bigint NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'yz_kullanim_ayrilan_eksi_degil' AND conrelid = 'yz_kullanim'::regclass) THEN
    ALTER TABLE yz_kullanim ADD CONSTRAINT yz_kullanim_ayrilan_eksi_degil CHECK (ayrilan >= 0);
  END IF;
END $$;

-- hesap işlemin bağlamından; okuma / maliyet yalnız artar, ayrılan serbest; kişi / ay / firma değişmez; okuma kaydı değişmez; hiçbiri silinmez
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
  IF ben IS NULL OR ben IS DISTINCT FROM OLD.hesap_id THEN RAISE EXCEPTION 'kullanımı yalnız kişinin kendi okuması değiştirir' USING ERRCODE = '23514'; END IF;
  NEW.degisti := now();
  RETURN NEW;
END $$;
ALTER FUNCTION yz_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yz_koru() FROM PUBLIC;

CREATE OR REPLACE FUNCTION saglik_denetimi() RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH kiraci AS (
    SELECT c.oid, c.relrowsecurity, c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
      AND (c.relname = 'firma' OR EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'firma_id' AND a.attnum > 0 AND NOT a.attisdropped)))
  SELECT jsonb_build_object(
    'son_goc', (SELECT max(ad) FROM goc),
    'goc_sayisi', (SELECT count(*) FROM goc),
    'kiraci_tablo', (SELECT count(*) FROM kiraci),
    'rls_eksik', (SELECT count(*) FROM kiraci WHERE NOT relrowsecurity OR NOT relforcerowsecurity),
    'politikasiz', (SELECT count(*) FROM kiraci k WHERE NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = k.oid)),
    'api_sema', coalesce((SELECT bool_or(has_schema_privilege(r.oid, 'public', 'USAGE')) FROM pg_roles r WHERE r.rolname IN ('anon', 'authenticated', 'service_role')), false),
    'uygulama_ayricalikli', coalesce((
      SELECT r.rolname <> 'probata_uygulama' OR r.rolsuper OR r.rolbypassrls
        OR EXISTS (SELECT 1 FROM pg_roles x WHERE x.oid <> r.oid AND (x.rolsuper OR x.rolbypassrls) AND pg_has_role(r.oid, x.oid, 'MEMBER'))
      FROM pg_roles r WHERE r.rolname = session_user), true)
  ) $$;
ALTER FUNCTION saglik_denetimi() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION saglik_denetimi() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION saglik_denetimi() TO probata_uygulama;
