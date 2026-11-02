-- 0116 · S.A.Y KONUŞMASI 60 DAKİKADA KENDİLİĞİNDEN KAPANIR (2026-11-02; reisim: "panel ya da sohbetten bağımsız kullanıcı açsa da açmasa da 60 dakika geçince
-- silinsin"): süpürme VERİTABANINDA — say_kapanis_supur(p_dakika, p_firma, p_hesap): son iletisi p_dakika'dan eski, işi bitmiş (süren iş yok; son iletisi
-- yapay zekânın ve açık araç çağrısı yok) her konuşma kapanır: metni Ar-Ge kaydına (say_arge; görüntü / belge / düşünme yok, araç sonucu kırpık — olcum.ts
-- argeIcerigi ile aynı), son bildirim yz_kapanis'e (yeni sorunun başına not — is-siniri.ts kapanisNotu), ekin depodaki kopyası çöpe (dosya.cop), hizmetteki ek
-- dosyaları yz_silinecek_dosya'ya (uygulama Dosya API'sinden siler), konuşma / ekler / iş / görünen geçmiş silinir.
-- Zamanlayıcı: pg_cron varsa (Supabase) 10 dakikada bir herkes için; uygulama ayrıca açılışta kişinin kendisi için (say_kapanis_kendi) ve gece işinde firma
-- için (say_kapanis_firma) çağırır — pg_cron olmayan ortamda (yerel, deneme makinesi) yalnız bunlar. Yarıda kalan iş (son ileti araç çağrısı) süpürülmez: yeni
-- soru onu kapatır. Kilit tests/say.test.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS yz_kapanis (
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id      uuid NOT NULL REFERENCES hesap(id),
  neden         text NOT NULL CHECK (length(neden) BETWEEN 1 AND 60),
  zaman         timestamptz NOT NULL DEFAULT clock_timestamp(),
  son_bildirim  text NOT NULL DEFAULT '' CHECK (length(son_bildirim) <= 2000),
  PRIMARY KEY (firma_id, hesap_id)
);
CREATE INDEX IF NOT EXISTS yz_kapanis_hesap ON yz_kapanis (hesap_id);
ALTER TABLE yz_kapanis ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_kapanis FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS yz_silinecek_dosya (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  dosya     text NOT NULL CHECK (length(dosya) BETWEEN 1 AND 200),
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS yz_silinecek_dosya_firma ON yz_silinecek_dosya (firma_id, zaman);
ALTER TABLE yz_silinecek_dosya ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_silinecek_dosya FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_kapanis' AND policyname = 'yz_kapanis_kendi') THEN
    CREATE POLICY yz_kapanis_kendi ON yz_kapanis
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_silinecek_dosya' AND policyname = 'yz_silinecek_dosya_kiraci') THEN
    CREATE POLICY yz_silinecek_dosya_kiraci ON yz_silinecek_dosya
      USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;
GRANT SELECT, DELETE ON yz_kapanis TO probata_uygulama;
GRANT SELECT, DELETE ON yz_silinecek_dosya TO probata_uygulama;

-- Ar-Ge kaydı içeriği (olcum.ts argeIcerigi ile aynı): yazı · araç çağrısı (ad, girdi) · araç sonucu (yalnız yazı, 4 000 karakter); görüntü, belge, düşünme atılır
CREATE OR REPLACE FUNCTION say_arge_icerik(p_icerik jsonb) RETURNS jsonb
  LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(jsonb_agg(t.b), '[]'::jsonb) FROM (
    SELECT CASE
      WHEN x->>'type' = 'text' THEN jsonb_build_object('type', 'text', 'text', coalesce(x->>'text', ''))
      WHEN x->>'type' IN ('tool_use', 'server_tool_use') THEN jsonb_build_object('type', x->>'type', 'name', x->>'name', 'input', coalesce(x->'input', '{}'::jsonb))
      WHEN x->>'type' = 'tool_result' THEN jsonb_build_object('type', 'tool_result', 'text', left(coalesce(
          CASE WHEN jsonb_typeof(x->'content') = 'string' THEN x->>'content'
               WHEN jsonb_typeof(x->'content') = 'array' THEN (SELECT string_agg(coalesce(y->>'text', ''), E'\n') FROM jsonb_array_elements(x->'content') y WHERE y->>'type' = 'text')
               ELSE '' END, ''), 4000))
        || CASE WHEN x->>'is_error' = 'true' THEN jsonb_build_object('hata', true) ELSE '{}'::jsonb END
      ELSE NULL END AS b
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_icerik) = 'array' THEN p_icerik ELSE jsonb_build_array(jsonb_build_object('type', 'text', 'text', p_icerik #>> '{}')) END) x
  ) t WHERE t.b IS NOT NULL
$$;
ALTER FUNCTION say_arge_icerik(jsonb) SET search_path = pg_catalog, public, pg_temp;

CREATE OR REPLACE FUNCTION say_kapanis_supur(p_dakika integer DEFAULT 60, p_firma uuid DEFAULT NULL, p_hesap uuid DEFAULT NULL) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  k record;
  son record;
  n integer := 0;
  bildirim text;
  ileti_sayisi integer;
  arge jsonb;
BEGIN
  IF p_dakika IS NULL OR p_dakika < 1 THEN RAISE EXCEPTION 'süre dakika olarak 1 ya da daha büyük olmalı' USING ERRCODE = '22023'; END IF;
  FOR k IN
    SELECT firma_id, hesap_id FROM yz_konusma
    WHERE (p_firma IS NULL OR firma_id = p_firma) AND (p_hesap IS NULL OR hesap_id = p_hesap)
    GROUP BY firma_id, hesap_id HAVING max(zaman) < now() - make_interval(mins => p_dakika)
  LOOP
    -- politikalar (FORCE RLS sahibe de uygulanır) için işlemin bağlamı o kişi
    PERFORM set_config('app.firma_id', k.firma_id::text, true);
    PERFORM set_config('app.hesap_id', k.hesap_id::text, true);
    -- süren iş varsa dokunma
    IF EXISTS (SELECT 1 FROM yz_konusma_is i WHERE i.firma_id = k.firma_id AND i.hesap_id = k.hesap_id AND i.bitis > now()) THEN CONTINUE; END IF;
    -- iş bitmiş olmalı: son ileti (sayfa notu dışında) yapay zekânın ve açık araç çağrısı yok
    SELECT rol, icerik INTO son FROM yz_konusma WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id AND rol <> 'system' ORDER BY sira DESC LIMIT 1;
    IF NOT FOUND OR son.rol <> 'assistant' THEN CONTINUE; END IF;
    IF jsonb_typeof(son.icerik) = 'array' AND EXISTS (SELECT 1 FROM jsonb_array_elements(son.icerik) b WHERE b->>'type' = 'tool_use') THEN CONTINUE; END IF;
    -- Ar-Ge kaydı (30 gün; eski kayıtlar silinir)
    DELETE FROM say_arge WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id AND zaman < now() - interval '30 days';
    SELECT count(*), coalesce(jsonb_agg(jsonb_build_object('rol', rol, 'bloklar', say_arge_icerik(icerik)) ORDER BY sira), '[]'::jsonb)
      INTO ileti_sayisi, arge FROM yz_konusma WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    INSERT INTO say_arge (firma_id, hesap_id, ileti, icerik) VALUES (k.firma_id, k.hesap_id, ileti_sayisi, arge);
    -- son bildirim → yeni konuşmanın başındaki not
    SELECT coalesce(string_agg(coalesce(b->>'text', ''), E'\n'), '') INTO bildirim
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(son.icerik) = 'array' THEN son.icerik ELSE '[]'::jsonb END) b WHERE b->>'type' = 'text';
    INSERT INTO yz_kapanis (firma_id, hesap_id, neden, son_bildirim) VALUES (k.firma_id, k.hesap_id, p_dakika::text || ' dakika geçti', left(bildirim, 2000))
      ON CONFLICT (firma_id, hesap_id) DO UPDATE SET neden = EXCLUDED.neden, zaman = clock_timestamp(), son_bildirim = EXCLUDED.son_bildirim;
    -- ekler: depodaki kopya çöpe (çöp süresi dolunca depodan silinir), hizmetteki dosya silinecekler listesine (fotoğraf hizmete yüklenmez: '-')
    UPDATE dosya d SET cop = now() WHERE d.firma_id = k.firma_id AND d.modul = 'say_ek' AND d.cop IS NULL
      AND d.kayit_id IN (SELECT e.id FROM yz_ek e WHERE e.firma_id = k.firma_id AND e.hesap_id = k.hesap_id);
    INSERT INTO yz_silinecek_dosya (firma_id, dosya)
      SELECT e.firma_id, e.dosya FROM yz_ek e WHERE e.firma_id = k.firma_id AND e.hesap_id = k.hesap_id AND e.dosya <> '-';
    DELETE FROM yz_ek_parca WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    DELETE FROM yz_ek WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    DELETE FROM yz_konusma WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    DELETE FROM yz_konusma_is WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    DELETE FROM yz_sohbet WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
ALTER FUNCTION say_kapanis_supur(integer, uuid, uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_kapanis_supur(integer, uuid, uuid) FROM PUBLIC;

-- uygulama: açılışta kişinin kendisi için
CREATE OR REPLACE FUNCTION say_kapanis_kendi(p_dakika integer DEFAULT 60) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE f uuid := gecerli_firma(); ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RETURN 0; END IF;
  RETURN say_kapanis_supur(p_dakika, f, ben);
END $$;
ALTER FUNCTION say_kapanis_kendi(integer) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_kapanis_kendi(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION say_kapanis_kendi(integer) TO probata_uygulama;

-- gece işi: firmanın herkesi için (pg_cron olmayan ortamın yedeği)
CREATE OR REPLACE FUNCTION say_kapanis_firma(p_dakika integer DEFAULT 60) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE f uuid := gecerli_firma();
BEGIN
  IF f IS NULL THEN RETURN 0; END IF;
  RETURN say_kapanis_supur(p_dakika, f, NULL);
END $$;
ALTER FUNCTION say_kapanis_firma(integer) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_kapanis_firma(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION say_kapanis_firma(integer) TO probata_uygulama;

-- zamanlayıcı: pg_cron varsa (Supabase) 10 dakikada bir; yoksa (gömülü PostgreSQL) atlanır
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
      PERFORM cron.schedule('say_kapanis', '*/10 * * * *', 'SELECT public.say_kapanis_supur(60)');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron kurulamadı (%); süpürme uygulamanın açılış ve gece işiyle sürer', SQLERRM;
    END;
  END IF;
END $$;
