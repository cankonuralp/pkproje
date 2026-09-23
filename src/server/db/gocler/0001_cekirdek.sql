-- ══ 0001 · ÇEKİRDEK: kiracı (firma) + denetim izi + uygulama rolü ══════════════════════════════════════════
-- Kural (CLAUDE.md §2, anayasa 5.4): kiracı izolasyonu VERİTABANINDA. Kiracı tablosu = firma_id sütunu taşıyan tablo;
-- her biri ENABLE + FORCE ROW LEVEL SECURITY + politika taşır (tests/kiraci-suzgeci.test.ts denetler).
-- Uygulama `probata_uygulama` rolüyle bağlanır: süper kullanıcı değil, BYPASSRLS yok, tablo sahibi değil — RLS'yi
-- aşamaz. Oturumun kiracısı işlem başına `app.firma_id` ayarıdır (src/server/db/kiraci.ts); ayar yoksa satır görünmez.
-- ⛔ Her göç IDEMPOTENT: iki kez koşmak hata vermez, şemayı değiştirmez (IF NOT EXISTS, pg_policies/pg_roles denetimi).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'probata_uygulama') THEN
    CREATE ROLE probata_uygulama NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;

-- geçerli kiracı: ayar yoksa NULL (''::uuid hatasını önler) → politika hiçbir satırı geçirmez
CREATE OR REPLACE FUNCTION gecerli_firma() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.firma_id', true), '')::uuid $$;

-- ── firma (kiracı) ────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS firma (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- alt alan adı: <kisa_ad>.probata.com.tr (yalnız a–z, 0–9, tire; DNS etiketi kuralı)
  kisa_ad     text NOT NULL UNIQUE CHECK (kisa_ad ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  ad          text NOT NULL CHECK (length(ad) BETWEEN 1 AND 200),
  -- rapor numarasının başındaki firma kısa kodu (pkproje.md §3.5: XX-AAYY-SIRA-EK)
  rapor_kodu  text NOT NULL CHECK (rapor_kodu ~ '^[A-Z]{2}$'),
  olusturuldu timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE firma ENABLE ROW LEVEL SECURITY;
ALTER TABLE firma FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firma' AND policyname = 'firma_kendi') THEN
    CREATE POLICY firma_kendi ON firma USING (id = gecerli_firma());
  END IF;
END $$;

-- alt alan adından firma kimliği: kiracı henüz bilinmezken çağrılır, bu yüzden tanımlayıcının yetkisiyle koşar ve
-- YALNIZ kimliği döndürür (başka firmanın hiçbir alanı sızmaz)
CREATE OR REPLACE FUNCTION firma_bul(p_kisa_ad text) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT id FROM firma WHERE kisa_ad = p_kisa_ad $$;
REVOKE ALL ON FUNCTION firma_bul(text) FROM PUBLIC;

-- ── denetim izi (hareket kaydı: kim, ne zaman, ne) ─────────────────────────────────────────────────────────
-- reisim 2026-09-23: "bu hareketler kayıt altında kalsın" — yalnız EKLENİR; uygulama rolü güncelleyemez, silemez.
CREATE TABLE IF NOT EXISTS denetim_izi (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  zaman     timestamptz NOT NULL DEFAULT now(),
  kim       text NOT NULL CHECK (length(kim) BETWEEN 1 AND 200),
  ne        text NOT NULL CHECK (length(ne) BETWEEN 1 AND 200),
  ayrinti   jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS denetim_izi_firma_zaman ON denetim_izi (firma_id, zaman DESC);
ALTER TABLE denetim_izi ENABLE ROW LEVEL SECURITY;
ALTER TABLE denetim_izi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'denetim_izi' AND policyname = 'denetim_izi_kiraci') THEN
    CREATE POLICY denetim_izi_kiraci ON denetim_izi
      USING (firma_id = gecerli_firma())
      WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- ── uygulama rolünün yetkileri (en az yetki) ──────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO probata_uygulama;
GRANT EXECUTE ON FUNCTION gecerli_firma() TO probata_uygulama;
GRANT EXECUTE ON FUNCTION firma_bul(text) TO probata_uygulama;
GRANT SELECT ON firma TO probata_uygulama;
GRANT SELECT, INSERT ON denetim_izi TO probata_uygulama;
