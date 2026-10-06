-- ══ 0046 · FİRMANIN EKLEDİĞİ BELGE TÜRLERİ — müşteri paneli için adlar (335; maket firma-ayarlari Z5 "Belge türü ekle": "Personel'de belge
-- yüklerken seçilir, burada müşteriye açılabilir") ══
-- Müşteri rolü firma ayarlarını okuyamaz (0030 kısıtlayıcı politikalar); müşteriye açık personel belgelerinin tür ADINI göstermek için yalnız
-- firmanın eklediği türlerin anahtar ve adını döndüren tanımlayıcı-yetkili işlev. Başka hiçbir ayar alanı dönmez. ⛔ Her göç IDEMPOTENT.
CREATE OR REPLACE FUNCTION musteri_belge_turleri() RETURNS TABLE (k text, ad text)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT t->>'k', t->>'ad'
  FROM firma_ayar f, jsonb_array_elements(CASE WHEN jsonb_typeof(f.deger->'turler') = 'array' THEN f.deger->'turler' ELSE '[]'::jsonb END) t
  WHERE f.firma_id = gecerli_firma() AND f.bolum = 'belge_tur_ek' AND gecerli_firma() IS NOT NULL AND gecerli_musteri() IS NOT NULL
    AND (t->>'k') ~ '^ek[1-9][0-9]{0,2}$' $$;
ALTER FUNCTION musteri_belge_turleri() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_belge_turleri() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION musteri_belge_turleri() TO probata_musteri;
