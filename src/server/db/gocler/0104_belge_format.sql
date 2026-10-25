-- ══ 0104 · BELGE FORMATI (2026-10-25, belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız") ══
-- Programın ürettiği belgelerin (zimmet teslim formu, araç teslim tutanağı, eğitim katılım formu, izin / masraf talep formu, teklif, fatura özeti,
-- saha formu, ön bilgilendirme formu — src/belge/katalog.ts BELGE_TURLERI) firmanın kurduğu formatı: rapor formatının (0022) aynısı, tür yerine belge.
-- Her satır bir sürüm: TASLAK (belge başına en çok bir; düzenlenir) → YAYINDA (belge başına en çok bir; v1, v2 …) → ESKİ (yerine yenisi yayınlandı).
-- Yayında sürüm yoksa belge temel formatla (src/belge/<belge>.ts) çizilir. Tanım JSON (src/format/tanim.ts şeması; sunucu her yazmada ve okumada
-- şemadan geçirir). ⛔ YAYINLANAN SÜRÜM DEĞİŞMEZ: tetik tanımı, sırayı, notu, yayın damgasını kilitler; geçiş yalnız taslak → yayında → eski; yeni
-- satır yalnız taslak doğar; belge değişmez. Yayın zamanı ve yayınlayan hesap veritabanında damgalanır (app.hesap_id — 0003 deseni). Silme hakkı yok.
-- Politika "(SELECT gecerli_firma())" ile (0091), yabancı anahtar dizinli. Kilit tests/belge-format.test.ts (PG) + tests/belge-format-saf.test.ts
-- (belge listesi = BELGE_TURLERI). ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS belge_format (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id       uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  belge          text NOT NULL,
  sira           integer CHECK (sira IS NULL OR sira >= 1),
  durum          text NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak', 'yayinda', 'eski')),
  sema           integer NOT NULL CHECK (sema BETWEEN 1 AND 99),
  tanim          jsonb NOT NULL CHECK (jsonb_typeof(tanim) = 'object' AND octet_length(tanim::text) <= 1000000),
  notu           text CHECK (notu IS NULL OR length(notu) BETWEEN 1 AND 200),
  olusturan      text NOT NULL CHECK (length(olusturan) BETWEEN 1 AND 200),
  yayinlayan     text CHECK (yayinlayan IS NULL OR length(yayinlayan) BETWEEN 1 AND 200),
  yayinlayan_id  uuid,
  yayin          timestamptz,
  surum          integer NOT NULL DEFAULT 0,
  olustu         timestamptz NOT NULL DEFAULT now(),
  degisti        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, belge, sira),
  UNIQUE (firma_id, id),
  -- taslağın sırası, yayın damgası ve yayınlayanı yok; yayınlanmışın hepsi var
  CONSTRAINT belge_format_taslak_sirasiz CHECK ((durum = 'taslak') = (sira IS NULL)),
  CONSTRAINT belge_format_yayin_damgasi CHECK ((durum = 'taslak') = (yayin IS NULL) AND (durum = 'taslak') = (yayinlayan IS NULL))
);
-- belge listesi src/belge/katalog.ts BELGE_TURLERI ile aynı (tests/belge-format-saf.test.ts); yeni belge eklenince yeni göç bu kısıtı yeniden kurar
ALTER TABLE belge_format DROP CONSTRAINT IF EXISTS belge_format_belge_check;
ALTER TABLE belge_format ADD CONSTRAINT belge_format_belge_check
  CHECK (belge IN ('zimmet', 'arac', 'egitim', 'izin', 'masraf', 'teklif', 'fatura', 'saha', 'onbilgi'));
CREATE UNIQUE INDEX IF NOT EXISTS belge_format_tek_taslak ON belge_format (firma_id, belge) WHERE durum = 'taslak';
CREATE UNIQUE INDEX IF NOT EXISTS belge_format_tek_yayin ON belge_format (firma_id, belge) WHERE durum = 'yayinda';
ALTER TABLE belge_format ENABLE ROW LEVEL SECURITY;
ALTER TABLE belge_format FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'belge_format' AND policyname = 'belge_format_kiraci') THEN
    CREATE POLICY belge_format_kiraci ON belge_format USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;

-- ── koruma: yeni satır yalnız taslak; yayınlanan değişmez; geçiş yalnız ileri; belge değişmez; yayın damgası veritabanından ─────────────────
CREATE OR REPLACE FUNCTION belge_format_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'taslak' THEN RAISE EXCEPTION 'belge formatı yalnız taslak olarak açılır' USING ERRCODE = '23514'; END IF;
    NEW.yayin := NULL; NEW.yayinlayan_id := NULL;
    RETURN NEW;
  END IF;
  IF NEW.belge IS DISTINCT FROM OLD.belge OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'belge formatının belgesi değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'taslak' THEN
    IF NEW.durum = 'eski' THEN RAISE EXCEPTION 'taslak yayınlanmadan eski olamaz' USING ERRCODE = '23514'; END IF;
    IF NEW.durum = 'yayinda' THEN
      NEW.yayin := now();
      NEW.yayinlayan_id := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
    ELSE
      NEW.yayinlayan_id := NULL;
    END IF;
    RETURN NEW;
  END IF;
  -- yayınlanmış (yayinda / eski): içerik ve damga değişmez; yalnız yayinda → eski
  IF NOT (OLD.durum = NEW.durum OR (OLD.durum = 'yayinda' AND NEW.durum = 'eski')) THEN
    RAISE EXCEPTION 'yayınlanmış belge formatı geri alınamaz' USING ERRCODE = '23514';
  END IF;
  IF NEW.tanim IS DISTINCT FROM OLD.tanim OR NEW.sema IS DISTINCT FROM OLD.sema OR NEW.sira IS DISTINCT FROM OLD.sira
     OR NEW.notu IS DISTINCT FROM OLD.notu OR NEW.olusturan IS DISTINCT FROM OLD.olusturan OR NEW.yayinlayan IS DISTINCT FROM OLD.yayinlayan
     OR NEW.yayinlayan_id IS DISTINCT FROM OLD.yayinlayan_id OR NEW.yayin IS DISTINCT FROM OLD.yayin THEN
    RAISE EXCEPTION 'yayınlanmış belge formatı değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION belge_format_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION belge_format_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER belge_format_koru BEFORE INSERT OR UPDATE ON belge_format FOR EACH ROW EXECUTE FUNCTION belge_format_koru();

REVOKE ALL ON belge_format FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON belge_format TO probata_uygulama;
