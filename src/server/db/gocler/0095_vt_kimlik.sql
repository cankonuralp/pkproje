-- ══ 0095 · VERİTABANI KİMLİĞİ — her firmaya ayrı veritabanı (FIRMA-VT.md FV1; sunum 579, reisim onayı 2026-10-15) ══════════════════════════════
-- Yeni firmalar kendi Supabase projesinde, eskiler (deneme firması, K5) ortak projede çalışacak. Hangi isteğin hangi veritabanına gideceğini kod
-- seçer (FV3); bu göç SON KAPIYI veritabanına koyar: her veritabanı kim olduğunu bilir ve başka firmanın işini kabul etmez.
-- · vt_kimlik: TEK satır. Ortak veritabanında 'ortak' (bu göç tohumlar); firmanın kendi veritabanında kurulum (FV10) 'firma' + firma kimliği yazar.
--   Kimlik bir kez 'firma' olunca değişmez, satır silinmez (tetik). Uygulama rolü bu tabloyu ne okur ne yazar; yalnız aşağıdaki işlevler okur.
-- · firma.vt: 'ortak' (verisi ortak veritabanında) | 'kendi' (verisi kendi projesinde; ortaktaki satır yalnız kayıt — FV2).
-- · vt_firma_dogrula(firma): kiraciIcinde her işlemin başında, kiracı ayarıyla AYNI sorguda çağırır (src/server/db/kiraci.ts) —
--     firma veritabanında: kimlik o firmanın değilse RED (42501);
--     ortak veritabanında: firma kendi projesine geçmişse RED (verisi burada değil; yanlış havuz). Olmayan kimlik bugünkü gibi geçer (RLS boş döndürür,
--     yabancı anahtarlar yazmayı engeller). Dondurulmuş firma burada reddedilmez — dondurma girişte ve oturumda (tests/yonetim.test.ts).
-- · firma_bul: ortakta yalnız 'ortak' firmalar; firma veritabanında kendi firması.
-- · firma tablosu tetiği: firma veritabanına başka firmanın satırı eklenemez.
-- ⛔ IDEMPOTENT. RLS ifadeleri düz metin (tests/yardimci/denetimler.ts rlsEksikTablolar); işlevler search_path'li (tests/yayin.test.ts).

-- ── veritabanının kimliği (tek satır) ────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vt_kimlik (
  tek       boolean PRIMARY KEY DEFAULT true CHECK (tek),
  tur       text NOT NULL DEFAULT 'ortak' CHECK (tur IN ('ortak', 'firma')),
  -- yabancı anahtar YOK: kimlik firma satırından ÖNCE yazılır (FV10 kurulum sırası)
  firma_id  uuid,
  CONSTRAINT vt_kimlik_tutarli CHECK ((tur = 'ortak' AND firma_id IS NULL) OR (tur = 'firma' AND firma_id IS NOT NULL))
);
ALTER TABLE vt_kimlik ENABLE ROW LEVEL SECURITY;
ALTER TABLE vt_kimlik FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vt_kimlik' AND policyname = 'vt_kimlik_yonetim') THEN
    CREATE POLICY vt_kimlik_yonetim ON vt_kimlik FOR SELECT TO probata_yonetim USING (true);
  END IF;
END $$;
REVOKE ALL ON vt_kimlik FROM PUBLIC;
GRANT SELECT ON vt_kimlik TO probata_yonetim;
INSERT INTO vt_kimlik (tek) VALUES (true) ON CONFLICT (tek) DO NOTHING;

-- kimlik bir kez 'firma' olunca değişmez; satır silinmez; 'firma' yapılırken veritabanında başka firmanın satırı olamaz
CREATE OR REPLACE FUNCTION vt_kimlik_koru() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Veritabanı kimliği silinemez' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.tur = 'firma' AND (NEW.tur IS DISTINCT FROM OLD.tur OR NEW.firma_id IS DISTINCT FROM OLD.firma_id) THEN
    RAISE EXCEPTION 'Firma veritabanının kimliği değiştirilemez' USING ERRCODE = '42501';
  END IF;
  IF NEW.tur = 'firma' AND EXISTS (SELECT 1 FROM firma WHERE id <> NEW.firma_id) THEN
    RAISE EXCEPTION 'Bu veritabanında başka firmanın kaydı var; firma veritabanı olamaz' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vt_kimlik_koru() FROM PUBLIC;
DROP TRIGGER IF EXISTS vt_kimlik_koru ON vt_kimlik;
CREATE TRIGGER vt_kimlik_koru BEFORE INSERT OR UPDATE OR DELETE ON vt_kimlik FOR EACH ROW EXECUTE FUNCTION vt_kimlik_koru();

-- ── firmanın verisi nerede ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE firma ADD COLUMN IF NOT EXISTS vt text NOT NULL DEFAULT 'ortak';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'firma_vt_check') THEN
    ALTER TABLE firma ADD CONSTRAINT firma_vt_check CHECK (vt IN ('ortak', 'kendi'));
  END IF;
END $$;

-- firma veritabanına yalnız kendi firması eklenir (kimliği değiştirilemez)
CREATE OR REPLACE FUNCTION firma_vt_koru() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k_tur text; k_firma uuid;
BEGIN
  SELECT tur, firma_id INTO k_tur, k_firma FROM vt_kimlik WHERE tek;
  IF k_tur = 'firma' AND NEW.id IS DISTINCT FROM k_firma THEN
    RAISE EXCEPTION 'Bu veritabanına yalnız kendi firması eklenir' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION firma_vt_koru() FROM PUBLIC;
DROP TRIGGER IF EXISTS firma_vt_koru ON firma;
CREATE TRIGGER firma_vt_koru BEFORE INSERT OR UPDATE OF id ON firma FOR EACH ROW EXECUTE FUNCTION firma_vt_koru();

-- ── işlemin firması bu veritabanının mı (kiraciIcinde, her işlemin başında) ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION vt_firma_dogrula(p_firma uuid) RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE k_tur text; k_firma uuid;
BEGIN
  SELECT tur, firma_id INTO k_tur, k_firma FROM vt_kimlik WHERE tek;
  IF k_tur IS NULL THEN
    RAISE EXCEPTION 'Veritabanı kimliği yok' USING ERRCODE = '42501';
  END IF;
  IF k_tur = 'firma' THEN
    IF p_firma IS DISTINCT FROM k_firma THEN
      RAISE EXCEPTION 'Bu veritabanı başka bir firmanın' USING ERRCODE = '42501';
    END IF;
  ELSIF EXISTS (SELECT 1 FROM firma WHERE id = p_firma AND vt = 'kendi') THEN
    RAISE EXCEPTION 'Bu firmanın verisi kendi veritabanında' USING ERRCODE = '42501';
  END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION vt_firma_dogrula(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vt_firma_dogrula(uuid) TO probata_uygulama;

-- ── alt alan adından firma: ortakta yalnız ortak firmalar, firma veritabanında kendi firması (0050'deki dondurma koşulu aynen) ─────────
CREATE OR REPLACE FUNCTION firma_bul(p_kisa_ad text) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT id FROM firma WHERE kisa_ad = p_kisa_ad AND durum = 'etkin'
          AND (vt = 'ortak' OR id = (SELECT firma_id FROM vt_kimlik WHERE tek)) $$;
