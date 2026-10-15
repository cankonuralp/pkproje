-- ══ 0094 · DEPO TAŞIMA (568; reisim 2026-10-15: "fotoğraflar neden veritabanından kota yiyor, storage'da olması gerekmiyor mu") ══
-- Dosya içeriği Supabase Storage'a geçer (PROBATA_DEPO=supabase — src/server/dosya/supabase.ts); veritabanı deposundaki (0049 depo_nesne) eski
-- nesneleri gece işi taşır: nesne Storage'a yüklenir, GERİ okunur, okunan içeriğin özeti (SHA-256) buradaki içeriğin özetiyle TUTARSA satır silinir —
-- tutmazsa (eksik / bozuk yükleme) satır kalır, içerik hiçbir yoldan kaybolmaz. Yalnız oturumdaki firmanın satırı (gecerli_firma). Uygulama rolünün
-- depo_nesne'de silme hakkı yine yok (yalnız bu işlev ve çöp işinin depo_nesne_sil'i). Kilit: tests/depo-supabase.test.ts. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION depo_nesne_tasindi(p_anahtar text, p_ozet text) RETURNS boolean
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE f uuid := gecerli_firma();
BEGIN
  IF f IS NULL THEN RAISE EXCEPTION 'depo taşıması firma işleminde koşar' USING ERRCODE = '42501'; END IF;
  IF p_ozet IS NULL OR p_ozet !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
  DELETE FROM depo_nesne n WHERE n.anahtar = p_anahtar AND n.firma_id = f AND encode(sha256(n.bayt), 'hex') = p_ozet;
  RETURN FOUND;
END $$;
ALTER FUNCTION depo_nesne_tasindi(text, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION depo_nesne_tasindi(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION depo_nesne_tasindi(text, text) TO probata_uygulama;
