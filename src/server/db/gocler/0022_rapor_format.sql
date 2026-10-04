-- ══ 0022 · RAPOR FORMATI — firmanın tür başına kurduğu rapor formatı tanımı (RAPOR-FORMAT.md §5, §7; KOD-GECIS §3, §5; §8.3 onaylı 2026-10-02) ══
-- Her satır bir sürüm: TASLAK (tür başına en çok bir; düzenlenir) → YAYINDA (tür başına en çok bir; v1, v2 …) → ESKİ (yerine yenisi yayınlandı).
-- Tanım JSON (src/format/tanim.ts şeması; sunucu her yazmada ve okumada şemadan geçirir), şema sürümü ayrı sütunda (motor eski şemayı okur).
-- Kaynak: taslağın başladığı hazır şablon (src/format/sablonlar.ts anahtarı) — kilitli (Bakanlık) öğeler yayından önce ona karşı denetlenir.
-- ⛔ YAYINLANAN SÜRÜM DEĞİŞMEZ: imzalı raporun PDF'i hangi sürümle çizildiyse o sürümle yeniden üretilir (§5) → tetik tanımı, sırayı, kaynağı,
--    notu, yayın damgasını kilitler; geçiş yalnız taslak → yayında → eski (geri dönüş yok); yeni satır yalnız taslak doğar.
-- Yayın zamanı ve yayınlayan HESAP veritabanında damgalanır (işlemin app.hesap_id bağlamından — 0003 deseni); kod başka kişi / tarih yazamaz.
-- Tür ve format AYNI firmada bağlı (başka firmanın türüne sürüm bağlanamaz). Silme hakkı yok. ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS rapor_format (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id       uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tur_id         uuid NOT NULL,
  sira           integer CHECK (sira IS NULL OR sira >= 1),
  durum          text NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak', 'yayinda', 'eski')),
  sema           integer NOT NULL CHECK (sema BETWEEN 1 AND 99),
  tanim          jsonb NOT NULL CHECK (jsonb_typeof(tanim) = 'object' AND octet_length(tanim::text) <= 1000000),
  kaynak         text CHECK (kaynak IS NULL OR kaynak ~ '^[A-Z][A-Z0-9_]{1,23}$'),
  notu           text CHECK (notu IS NULL OR length(notu) BETWEEN 1 AND 200),
  olusturan      text NOT NULL CHECK (length(olusturan) BETWEEN 1 AND 200),
  yayinlayan     text CHECK (yayinlayan IS NULL OR length(yayinlayan) BETWEEN 1 AND 200),
  yayinlayan_id  uuid,
  yayin          timestamptz,
  surum          integer NOT NULL DEFAULT 0,
  olustu         timestamptz NOT NULL DEFAULT now(),
  degisti        timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id),
  UNIQUE (firma_id, tur_id, sira),
  UNIQUE (firma_id, id),
  -- taslağın sırası, yayın damgası ve yayınlayanı yok; yayınlanmışın hepsi var
  CONSTRAINT rapor_format_taslak_sirasiz CHECK ((durum = 'taslak') = (sira IS NULL)),
  CONSTRAINT rapor_format_yayin_damgasi CHECK ((durum = 'taslak') = (yayin IS NULL) AND (durum = 'taslak') = (yayinlayan IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS rapor_format_tek_taslak ON rapor_format (firma_id, tur_id) WHERE durum = 'taslak';
CREATE UNIQUE INDEX IF NOT EXISTS rapor_format_tek_yayin ON rapor_format (firma_id, tur_id) WHERE durum = 'yayinda';
ALTER TABLE rapor_format ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_format FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapor_format' AND policyname = 'rapor_format_kiraci') THEN
    CREATE POLICY rapor_format_kiraci ON rapor_format USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- ── koruma: yeni satır yalnız taslak; yayınlanan değişmez; geçiş yalnız ileri; yayın damgası veritabanından ─────────────────────────
CREATE OR REPLACE FUNCTION rapor_format_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'taslak' THEN RAISE EXCEPTION 'rapor formatı yalnız taslak olarak açılır' USING ERRCODE = '23514'; END IF;
    NEW.yayin := NULL; NEW.yayinlayan_id := NULL;
    RETURN NEW;
  END IF;
  IF NEW.tur_id IS DISTINCT FROM OLD.tur_id THEN RAISE EXCEPTION 'rapor formatının türü değişmez' USING ERRCODE = '23514'; END IF;
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
    RAISE EXCEPTION 'yayınlanmış rapor formatı geri alınamaz' USING ERRCODE = '23514';
  END IF;
  IF NEW.tanim IS DISTINCT FROM OLD.tanim OR NEW.sema IS DISTINCT FROM OLD.sema OR NEW.sira IS DISTINCT FROM OLD.sira
     OR NEW.kaynak IS DISTINCT FROM OLD.kaynak OR NEW.notu IS DISTINCT FROM OLD.notu OR NEW.olusturan IS DISTINCT FROM OLD.olusturan
     OR NEW.yayinlayan IS DISTINCT FROM OLD.yayinlayan OR NEW.yayinlayan_id IS DISTINCT FROM OLD.yayinlayan_id OR NEW.yayin IS DISTINCT FROM OLD.yayin THEN
    RAISE EXCEPTION 'yayınlanmış rapor formatı değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION rapor_format_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_format_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_format_koru BEFORE INSERT OR UPDATE ON rapor_format FOR EACH ROW EXECUTE FUNCTION rapor_format_koru();

GRANT SELECT, INSERT, UPDATE ON rapor_format TO probata_uygulama;
