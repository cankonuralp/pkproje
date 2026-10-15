-- ══ 0091 · VERİTABANI HIZI (564; reisim 2026-10-15: "layzload kurgumuz vs nasıl sitede donma yaşanabilecek şeyler düşünülüp kurgumuz … yapıldı mı
-- genel bi analiz yap" → analiz; "elindeki bütün işleri yap") ══
-- Supabase'in performans denetimi iki şey buldu; ikisi de veri büyüyünce yavaşlatır, bugün ölçülmez:
--   1. Firma süzgeci (RLS) her SATIR için yeniden hesaplanıyordu: gecerli_firma() "SET search_path" taşıdığı için satır içine açılamaz; politikada
--      çıplak çağrı her satırda çalışır. "(SELECT gecerli_firma())" sorgu başına BİR kez hesaplanır (InitPlan) — anlam aynı (değer işlem boyunca
--      sabit: set_config(…, true)). Aynısı gecerli_musteri() ve current_setting('app.hesap_id', true) için.
--   2. 47 yabancı anahtarın dizini yoktu: ilişkili kaydı arayan birleştirme ve silme (kesin silme — silici.ts kullanım sayımı) bütün tabloyu tarar.
-- Yeni politika ve yabancı anahtarlar da böyle yazılır — kilit tests/kiraci-izolasyonu.test.ts (çıplak çağrı ve dizinsiz yabancı anahtar kalmaz).
-- ⛔ Her göç IDEMPOTENT: sarılmış çağrı yeniden sarılmaz (sarılmış hâli varsa atlanır), dizin varsa atlanır. Düzenli ifade kullanılmaz:
-- "önünde SELECT yok" (lookbehind) PostgreSQL 18'de 17'deki gibi davranmadı (deneme makinesi, 0243bf5).

DO $$
DECLARE
  r record;
  yq text; yc text;
  /* düz metin (düzenli ifade yok — sürümler arasında aynı davranır): çağrı, sarılmış hâli; sarılmış hâli zaten varsa o çağrıya dokunulmaz */
  cagri constant text[] := ARRAY['gecerli_firma()', 'gecerli_musteri()', 'current_setting(''app.hesap_id''::text, true)'];
  sarili constant text[] := ARRAY['( SELECT gecerli_firma() AS gecerli_firma)', '( SELECT gecerli_musteri() AS gecerli_musteri)',
    '( SELECT current_setting(''app.hesap_id''::text, true) AS current_setting)'];
  i int;
BEGIN
  FOR r IN SELECT p.schemaname, p.tablename, p.policyname, p.qual, p.with_check FROM pg_policies p WHERE p.schemaname = 'public' LOOP
    yq := r.qual; yc := r.with_check;
    FOR i IN 1 .. array_length(cagri, 1) LOOP
      IF yq IS NOT NULL AND position(sarili[i] IN yq) = 0 THEN yq := replace(yq, cagri[i], sarili[i]); END IF;
      IF yc IS NOT NULL AND position(sarili[i] IN yc) = 0 THEN yc := replace(yc, cagri[i], sarili[i]); END IF;
    END LOOP;
    IF yq IS DISTINCT FROM r.qual THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', r.policyname, r.schemaname, r.tablename, yq);
    END IF;
    IF yc IS DISTINCT FROM r.with_check THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', r.policyname, r.schemaname, r.tablename, yc);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
  ad text;
BEGIN
  /* dizini olmayan her yabancı anahtar: anahtarın sütunlarıyla BAŞLAYAN dizin yoksa (sıra aynı) aynı sırayla dizin kurulur */
  FOR r IN
    SELECT con.conrelid::regclass AS tablo, cls.relname AS tablo_ad, con.conname,
           array_agg(att.attname ORDER BY k.ord) AS sutunlar, con.conkey
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
    WHERE con.contype = 'f' AND ns.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index ix
        WHERE ix.indrelid = con.conrelid
          AND (string_to_array(ix.indkey::text, ' ')::int2[])[1:array_length(con.conkey, 1)] = con.conkey
      )
    GROUP BY con.conrelid, cls.relname, con.conname, con.conkey
  LOOP
    /* ad: tablo + sütunlar (kısaltılırsa çakışmasın diye tablo ve sütunların özeti) */
    ad := left(r.tablo_ad || '_' || array_to_string(r.sutunlar, '_'), 40) || '_' || left(md5(r.tablo_ad || ':' || array_to_string(r.sutunlar, ',')), 6) || '_ydz';
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%s)', ad, r.tablo,
      (SELECT string_agg(quote_ident(s), ', ') FROM unnest(r.sutunlar) AS s));
  END LOOP;
END $$;
