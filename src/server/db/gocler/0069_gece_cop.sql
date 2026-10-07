-- ══ 0069 · GECE İŞİ: ÇÖP TEMİZLİĞİ + İŞ KAYDI (378; KOD-GECIS K5, 09-A5 / G1 / E6, ARKA-UC §7) ══
-- Silinen kaydın dosyası çöpe gider (dosya.cop: zaman; indirilemez). Çöpte 30 GÜNÜ DOLAN dosya gece işiyle kalıcı silinir: dosya satırı ve depodaki
-- nesnesi. Hâlâ bir kayda bağlı (yabancı anahtarla başvurulan) dosya silinmez, "bağlı" sayılır. Depoda kaydı olmayan nesne (öksüz) yalnız SAYILIR,
-- silinmez (A5, ANAYASA 9.4: yanlış referans seti canlı dosyayı siler). Dondurulmuş firmaya dokunulmaz (E6).
-- İş kiracı bağlamında koşar (G1): firma listesi gece_firmalari() (yalnız kimlik), her firma kendi işleminde. Uygulama rolüne DELETE verilmez: silme
-- tanımlayıcı-yetkili dosya_cop_sil / depo_nesne_sil ile, yalnız oturumdaki firmada; depo nesnesi yalnız dosya satırı yoksa silinir (canlı dosyanın
-- içeriği hiçbir yoldan silinmez).
-- is_calisma: arka plan işlerinin kaydı (G1: düşen iş görünür; G5: takılı iş) — firma ve kişi verisi YOK, yalnız sayılar. Uygulama rolü tabloya
-- doğrudan erişemez (is_basla / is_bitir). Aynı iş aynı anda iki kez koşmaz (kısmi eşsiz dizin); 1 saattir "çalışıyor"da kalan iş "takıldı" olur.
-- Kilit: tests/gece-cop.test.ts; olumsuz kanıt tests/bozan/gece-cop.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS is_calisma (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad       text NOT NULL CHECK (ad ~ '^[a-z_]{1,40}$'),
  basladi  timestamptz NOT NULL DEFAULT now(),
  bitti    timestamptz,
  durum    text NOT NULL DEFAULT 'calisiyor' CHECK (durum IN ('calisiyor', 'tamam', 'hata', 'takildi')),
  ozet     jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(ozet) = 'object' AND octet_length(ozet::text) <= 4000),
  CONSTRAINT is_calisma_bitti CHECK ((durum = 'calisiyor') = (bitti IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS is_calisma_tek ON is_calisma (ad) WHERE durum = 'calisiyor';
CREATE INDEX IF NOT EXISTS is_calisma_son ON is_calisma (ad, basladi DESC);
ALTER TABLE is_calisma ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON is_calisma FROM PUBLIC;

-- çöpte süresi dolanlar sırayla taranır (firma başına, en eski önce)
CREATE INDEX IF NOT EXISTS dosya_cop_i ON dosya (firma_id, cop) WHERE cop IS NOT NULL;

/* işi başlatır: aynı ad "çalışıyor"daysa NULL (ikinci koşu yok); 1 saatten eski "çalışıyor" önce "takıldı" olur */
CREATE OR REPLACE FUNCTION is_basla(p_ad text) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE i uuid;
BEGIN
  IF p_ad IS NULL OR p_ad !~ '^[a-z_]{1,40}$' THEN RAISE EXCEPTION 'iş adı geçersiz' USING ERRCODE = '23514'; END IF;
  UPDATE is_calisma SET durum = 'takildi', bitti = now() WHERE ad = p_ad AND durum = 'calisiyor' AND basladi < now() - interval '1 hour';
  INSERT INTO is_calisma (ad) VALUES (p_ad) ON CONFLICT (ad) WHERE durum = 'calisiyor' DO NOTHING RETURNING id INTO i;
  RETURN i;
END $$;
ALTER FUNCTION is_basla(text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION is_basla(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_basla(text) TO probata_uygulama;

/* işi bitirir (tamam / hata) ve özetini yazar; "takıldı" sayılmış iş değişmez */
CREATE OR REPLACE FUNCTION is_bitir(p_id uuid, p_durum text, p_ozet jsonb) RETURNS boolean
  LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_durum IS NULL OR p_durum NOT IN ('tamam', 'hata') THEN RAISE EXCEPTION 'iş sonucu geçersiz' USING ERRCODE = '23514'; END IF;
  UPDATE is_calisma SET durum = p_durum, bitti = now(), ozet = coalesce(p_ozet, '{}'::jsonb) WHERE id = p_id AND durum = 'calisiyor';
  RETURN FOUND;
END $$;
ALTER FUNCTION is_bitir(uuid, text, jsonb) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION is_bitir(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_bitir(uuid, text, jsonb) TO probata_uygulama;

/* gece işinin firma listesi: yalnız kimlik, yalnız etkin firmalar (dondurulmuşa iş dokunmaz — E6) */
CREATE OR REPLACE FUNCTION gece_firmalari() RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT id FROM firma WHERE durum = 'etkin' ORDER BY id $$;
ALTER FUNCTION gece_firmalari() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION gece_firmalari() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION gece_firmalari() TO probata_uygulama;

/* çöpte 30 günü dolan dosyanın satırını siler (oturumdaki firmada): 'silindi' · 'bagli' (bir kayıt hâlâ başvuruyor) · 'yok' (başka firmanın,
   çöpte değil ya da süresi dolmamış). Depo nesnesi burada silinmez: çağıran depo bağdaştırıcısıyla siler (veritabanı deposunda depo_nesne_sil). */
CREATE OR REPLACE FUNCTION dosya_cop_sil(p_id uuid) RETURNS text
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  d dosya%ROWTYPE;
BEGIN
  IF f IS NULL THEN RAISE EXCEPTION 'çöp temizliği firma işleminde koşar' USING ERRCODE = '42501'; END IF;
  SELECT * INTO d FROM dosya WHERE id = p_id AND firma_id = f AND cop IS NOT NULL AND cop < now() - interval '30 days' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'yok'; END IF;
  BEGIN
    DELETE FROM dosya WHERE id = p_id AND firma_id = f;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN 'bagli';
  END;
  RETURN 'silindi';
END $$;
ALTER FUNCTION dosya_cop_sil(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION dosya_cop_sil(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dosya_cop_sil(uuid) TO probata_uygulama;

/* veritabanı deposunda nesneyi siler — YALNIZ oturumdaki firmanın ve dosya satırı artık yoksa (canlı ya da çöpteki dosyanın içeriği silinmez) */
CREATE OR REPLACE FUNCTION depo_nesne_sil(p_anahtar text) RETURNS boolean
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE f uuid := gecerli_firma();
BEGIN
  IF f IS NULL THEN RAISE EXCEPTION 'depo nesnesi firma işleminde silinir' USING ERRCODE = '42501'; END IF;
  DELETE FROM depo_nesne n WHERE n.anahtar = p_anahtar AND n.firma_id = f
    AND NOT EXISTS (SELECT 1 FROM dosya x WHERE x.anahtar = n.anahtar);
  RETURN FOUND;
END $$;
ALTER FUNCTION depo_nesne_sil(text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION depo_nesne_sil(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION depo_nesne_sil(text) TO probata_uygulama;
