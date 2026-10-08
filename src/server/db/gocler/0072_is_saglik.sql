-- ══ 0072 · SAĞLIKTA ARKA PLAN İŞİ (383; 09-G5 "duman testi: … takılı arka plan işi", 378 is_calisma) ══
-- 1 saatten uzun süredir "çalışıyor"da kalan iş (gece çöp temizliği, duyuru okuma …) sağlık ucunda "sorun" olur — işlev sırasında düşmüş ya da
-- asılı kalmış iş sessiz kalmaz (bir sonraki koşu onu "takıldı" yapar; o zamana kadar sağlık söyler). Yalnız sayı (iş adı / firma yok).
-- saglik_denetimi'ni (0053) yeniden tanımlamaz — ayrı işlev; sağlık okuyucusu ikisini birleştirir (src/server/db/saglik.ts).
-- Kilit: tests/saglik.test.ts, tests/saglik-saf.test.ts; olumsuz kanıt tests/bozan/is-saglik.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION is_denetimi() RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'takili_is', (SELECT count(*) FROM is_calisma WHERE durum = 'calisiyor' AND basladi < now() - interval '1 hour'))
$$;
ALTER FUNCTION is_denetimi() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION is_denetimi() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_denetimi() TO probata_uygulama;
