-- ══ 0000 · DIŞ ERİŞİM TABLOLARDAN ÖNCE KAPANIR ═════════════════════════════════════════════════════════════════════════════
-- Yönetilen PostgreSQL (Supabase) public şemasını kendi hazır API rollerine (anon / authenticated / service_role) açar ve göçü koşan rolün
-- açacağı her yeni tabloyu, işlevi, sayacı onlara varsayılan olarak verir (2026-10-04 ölçüldü). 0001–0007 bu ayar dururken koşarsa, 0008
-- gelene kadar (ya da arada bir göç düşerse kalıcı olarak) tablolar ve firma_bul o API'den erişilebilir kalır (2026-10-04 yayın denetimi).
-- Bu göç her şeyden ÖNCE koşar: şema kullanım hakkını herkesten alır, API rollerine ve PUBLIC'e varsayılan yetkiyi kaldırır, göç kaydını
-- RLS'ye bağlar. Mevcut nesneleri 0008 ayrıca temizler ve sonucu doğrular. Rol yoksa (yerel gömülü PostgreSQL) o kısım boş geçer.
-- Not: işlevler artık PUBLIC'e kendiliğinden açılmaz — uygulama rolünün çağıracağı işleve göçte açıkça GRANT EXECUTE verilir (0001 gibi);
-- tetik işlevleri çalıştırma yetkisi istemez. ⛔ Her göç IDEMPOTENT.

REVOKE ALL ON SCHEMA public FROM PUBLIC;
-- şemaya özel varsayılan, genel varsayılandaki PUBLIC hakkını kaldıramaz → genel (şemasız) varsayılan
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END $$;

DO $$ BEGIN
  IF to_regclass('public.goc') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.goc ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public.goc FROM PUBLIC';
  END IF;
END $$;
