-- ══ 0051 · SAĞLIK DENETİMİ (350; 09-G5 duman testi: "sağlık ucu, veritabanı bağlantısı, RLS açık mı …"; 06 "her teslimden sonra canlıya karşı
-- duman testi koşulur — sadece 'site 200 dönüyor' demek yanıltıcıdır, veri bütünlüğü iddiaları da") ══
-- Uygulama rolü şema bilgisini (pg_class, goc) okuyamaz: tek işlev, tanımlayıcının haklarıyla yalnız SAYILARI ve son göçün adını döndürür — firma
-- verisi, tablo adı, satır içeriği yok. Denetimler: son uygulanan göç (kodun beklediğiyle karşılaştırılır — kod göçten önce yayınlanırsa yakalanır) ·
-- firma_id taşıyan (ya da firma) tabloda RLS'si açık ve ZORLANMIŞ olmayan · politikası olmayan · Supabase API rolleri (anon / authenticated) şemaya
-- girebiliyor mu · uygulama rolü süper kullanıcı ya da RLS'yi aşabilen mi. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION saglik_denetimi() RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH kiraci AS (
    SELECT c.oid, c.relrowsecurity, c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
      AND (c.relname = 'firma' OR EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'firma_id' AND a.attnum > 0 AND NOT a.attisdropped)))
  SELECT jsonb_build_object(
    'son_goc', (SELECT max(ad) FROM goc),
    'kiraci_tablo', (SELECT count(*) FROM kiraci),
    'rls_eksik', (SELECT count(*) FROM kiraci WHERE NOT relrowsecurity OR NOT relforcerowsecurity),
    'politikasiz', (SELECT count(*) FROM kiraci k WHERE NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = k.oid)),
    'api_sema', coalesce((SELECT bool_or(has_schema_privilege(r.oid, 'public', 'USAGE')) FROM pg_roles r WHERE r.rolname IN ('anon', 'authenticated')), false),
    'uygulama_ayricalikli', coalesce((SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = 'probata_uygulama'), true)
  ) $$;
ALTER FUNCTION saglik_denetimi() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION saglik_denetimi() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION saglik_denetimi() TO probata_uygulama;
