-- ══ 0008 · DIŞ ERİŞİM KAPALI: yönetilen PostgreSQL'in kendi API rolleri şemamıza giremez — temizlik + DOĞRULAMA ════════════════════════
-- Yayında veritabanı Supabase (pkproje.md §8.8). Supabase her projede public şemasını kendi hazır API'sine (Data API / PostgREST,
-- GraphQL) açar: anon / authenticated / service_role rollerine şema kullanım hakkı verir ve bu şemada açılan HER YENİ tabloya,
-- işleve, sayaca bu rollere TÜM yetkiyi varsayılan olarak tanır (2026-10-04 Supabase projesinde ölçüldü: pg_default_acl). Herkese
-- açık "anon" anahtarı tarayıcıda dolaşır; RLS satırları korusa da göç kaydı (goc) gibi RLS'siz tablolar ve SECURITY DEFINER
-- işlevler bu yoldan dışarıya açık kalır. probata bu API'yi KULLANMAZ: veritabanına yalnız uygulama sunucusu probata_uygulama
-- rolüyle bağlanır (0001). 0000 bunu tablolardan önce keser; bu göç:
--   · public şemasının kullanım hakkını herkesten (PUBLIC) alır — yalnız sahip ve açıkça izin verilen probata_uygulama kalır;
--   · Supabase'in API rolleri varsa public'teki mevcut her yetkilerini geri alır ve yeni nesnelere verilmesini durdurur;
--   · public'teki işlevlerin PUBLIC'e çalıştırma hakkını alır (uygulama rolü gerekenleri 0001'den açıkça alır);
--   · göç kaydı tablosunu (goc) RLS'ye bağlar (politika yok → uygulama rolü bile göremez; yalnız sahip);
--   · SONUCU DOĞRULAR: göçü koşan rol yetkiyi alamadıysa (ör. şemanın / nesnenin sahibi değilse PostgreSQL yalnız uyarı verir) göç HATA
--     verir, "uygulandı" yazılmaz (2026-10-04 yayın denetimi: sessiz etkisizlik).
-- Roller yoksa (yerel gömülü PostgreSQL) o kısım hiçbir şey yapmaz. Kanıt: tests/yayin.test.ts (Supabase düzenini taklit eden küme,
-- göçler süper kullanıcı OLMAYAN sahip rolüyle), olumsuz kanıt tests/bozan/yayin.bozan.ts. ⛔ Her göç IDEMPOTENT.

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO probata_uygulama;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r);
      -- göçü koşan rolün (sahip) ileride açacağı nesneler bu rollere verilmesin
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END $$;

-- göç kaydı: kiracı tablosu değil; yalnız sahibin (göç koşucusu) işi
DO $$ BEGIN
  IF to_regclass('public.goc') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.goc ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public.goc FROM PUBLIC';
  END IF;
END $$;

-- ── doğrulama: PUBLIC ve API rollerinin public'te HİÇBİR hakkı kalmamalı ─────────────────────────────────────────────────────────
DO $$
DECLARE r text; n int;
BEGIN
  FOREACH r IN ARRAY ARRAY['public', 'anon', 'authenticated', 'service_role'] LOOP
    CONTINUE WHEN r <> 'public' AND NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r);
    IF has_schema_privilege(r, 'public', 'USAGE') OR has_schema_privilege(r, 'public', 'CREATE') THEN
      RAISE EXCEPTION '0008: % hâlâ public şemasını kullanabiliyor (göçü koşan rol şemanın sahibi mi?)', r;
    END IF;
    SELECT count(*) INTO n FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
     WHERE s.nspname = 'public' AND (
       (c.relkind IN ('r', 'p', 'v', 'm', 'f') AND has_table_privilege(r, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
       OR (c.relkind = 'S' AND has_sequence_privilege(r, c.oid, 'USAGE,SELECT,UPDATE')));
    IF n > 0 THEN RAISE EXCEPTION '0008: % hâlâ public şemasında % tablo / sayaca erişebiliyor', r, n; END IF;
    SELECT count(*) INTO n FROM pg_proc p JOIN pg_namespace s ON s.oid = p.pronamespace
     WHERE s.nspname = 'public' AND has_function_privilege(r, p.oid, 'EXECUTE');
    IF n > 0 THEN RAISE EXCEPTION '0008: % hâlâ public şemasında % işlevi çalıştırabiliyor', r, n; END IF;
  END LOOP;
END $$;
