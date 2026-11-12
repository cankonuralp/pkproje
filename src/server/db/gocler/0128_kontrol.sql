-- ══ 0128 · KONTROL KAYDI: TÜRKAK'lı firmada kontrol saati ÖLÇÜLÜR (2026-11-12; pkproje.md §11 K2, K3, K10, K11 — reisim: "yazılan süre ile
--    ekipman başında geçirilen süre uymalı log kayıtları düzgün olmalı", "ara verme olmasın"; yapım sırasında T2) ══
-- 1. rapor.olcumlu: rapor AÇILDIĞI andaki çalışma modeline bağlanır (K10) — veritabanı yazar (firma_ayar 'calisma'), sonradan değişmez.
-- 2. kontrol: süre rapora değil sahadaki kayda bağlı (plan + ekipman + kişi; takip muayenesi ayrı kayıt). Başlangıç ve bitiş saatini VERİTABANI
--    koyar (kaynak 'sunucu': now()); bir kez yazılır, değişmez, silinmez. Elle düzeltme ayrı sütunlarda (duz_*, gerekçe ≥ 10): ölçülen değer kayıtta
--    kalır. Hiç ölçülmemiş kontrolün saati de gerekçeyle yazılır (kaynak 'elle'). Aynı kişide aynı anda TEK açık kontrol (K3; ara verme yok).
--    kaynak 'cihaz' bağlantısız çalışma için ayrıldı (T5).
-- ⛔ Her göç IDEMPOTENT.

-- ── 1. rapor.olcumlu ─────────────────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE rapor ADD COLUMN IF NOT EXISTS olcumlu boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION rapor_olcumlu_yaz() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.olcumlu := coalesce((SELECT a.deger ->> 'model' = 'turkak' FROM firma_ayar a WHERE a.firma_id = NEW.firma_id AND a.bolum = 'calisma'), false);
    RETURN NEW;
  END IF;
  IF NEW.olcumlu IS DISTINCT FROM OLD.olcumlu THEN
    RAISE EXCEPTION 'Raporun çalışma modeli açıldığı andaki modeldir; değişmez.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION rapor_olcumlu_yaz() FROM PUBLIC;
DROP TRIGGER IF EXISTS rapor_olcumlu_yaz ON rapor;
CREATE TRIGGER rapor_olcumlu_yaz BEFORE INSERT OR UPDATE OF olcumlu ON rapor FOR EACH ROW EXECUTE FUNCTION rapor_olcumlu_yaz();

-- ── 2. kontrol ───────────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kontrol (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  plan_id      uuid NOT NULL,
  ekipman_id   uuid NOT NULL,
  personel_id  uuid NOT NULL,
  takip        boolean NOT NULL DEFAULT false,
  kaynak       text NOT NULL DEFAULT 'sunucu' CHECK (kaynak IN ('sunucu', 'cihaz', 'elle')),
  basladi      timestamptz,
  bitti        timestamptz,
  duz_bas      timestamptz,
  duz_bit      timestamptz,
  duz_gerekce  text,
  duz_zaman    timestamptz,
  duz_kim      text,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id),
  FOREIGN KEY (firma_id, ekipman_id) REFERENCES ekipman (firma_id, id),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  UNIQUE (firma_id, plan_id, ekipman_id, personel_id, takip),
  UNIQUE (firma_id, id),
  CHECK ((kaynak = 'elle') = (basladi IS NULL)),
  CHECK (bitti IS NULL OR (basladi IS NOT NULL AND bitti >= basladi)),
  CHECK ((duz_bas IS NULL) = (duz_bit IS NULL) AND (duz_bas IS NULL) = (duz_gerekce IS NULL) AND (duz_bas IS NULL) = (duz_kim IS NULL)),
  CHECK (duz_bit IS NULL OR duz_bit > duz_bas),
  CHECK (duz_gerekce IS NULL OR length(btrim(duz_gerekce)) BETWEEN 10 AND 500),
  CHECK (duz_kim IS NULL OR length(duz_kim) BETWEEN 1 AND 200),
  CHECK (kaynak <> 'elle' OR duz_bas IS NOT NULL)
);
-- K3: aynı kişide aynı anda tek açık (ölçülen, bitmemiş) kontrol
CREATE UNIQUE INDEX IF NOT EXISTS kontrol_acik ON kontrol (firma_id, personel_id) WHERE basladi IS NOT NULL AND bitti IS NULL;
CREATE INDEX IF NOT EXISTS kontrol_ekipman ON kontrol (firma_id, ekipman_id);
CREATE INDEX IF NOT EXISTS kontrol_personel ON kontrol (firma_id, personel_id, basladi);

ALTER TABLE kontrol ENABLE ROW LEVEL SECURITY;
ALTER TABLE kontrol FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kontrol' AND policyname = 'kontrol_firma') THEN
    CREATE POLICY kontrol_firma ON kontrol USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;

-- saat veritabanından; ölçülen değer bir kez yazılır, değişmez; kayıt silinmez
CREATE OR REPLACE FUNCTION kontrol_koru() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Kontrol kaydı silinmez.' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.kaynak = 'sunucu' THEN
      NEW.basladi := now(); NEW.bitti := NULL;
      NEW.duz_bas := NULL; NEW.duz_bit := NULL; NEW.duz_gerekce := NULL; NEW.duz_kim := NULL; NEW.duz_zaman := NULL;
    ELSIF NEW.kaynak = 'elle' THEN
      NEW.basladi := NULL; NEW.bitti := NULL; NEW.duz_zaman := now();
    ELSE
      RAISE EXCEPTION 'Cihaz saatiyle kontrol kaydı henüz açılamaz.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.plan_id IS DISTINCT FROM OLD.plan_id OR NEW.ekipman_id IS DISTINCT FROM OLD.ekipman_id
     OR NEW.personel_id IS DISTINCT FROM OLD.personel_id OR NEW.takip IS DISTINCT FROM OLD.takip OR NEW.kaynak IS DISTINCT FROM OLD.kaynak
     OR NEW.basladi IS DISTINCT FROM OLD.basladi OR NEW.olustu IS DISTINCT FROM OLD.olustu THEN
    RAISE EXCEPTION 'Kontrol kaydının ölçülen başlangıcı ve bağlı olduğu kayıtlar değişmez.' USING ERRCODE = '23514';
  END IF;
  IF OLD.bitti IS NOT NULL AND NEW.bitti IS DISTINCT FROM OLD.bitti THEN
    RAISE EXCEPTION 'Kontrolün ölçülen bitişi değişmez.' USING ERRCODE = '23514';
  END IF;
  IF OLD.bitti IS NULL AND NEW.bitti IS NOT NULL THEN
    IF OLD.kaynak <> 'sunucu' THEN RAISE EXCEPTION 'Bu kontrol kaydı ölçülmedi; bitişi yazılmaz.' USING ERRCODE = '23514'; END IF;
    NEW.bitti := now();
  END IF;
  IF NEW.duz_bas IS DISTINCT FROM OLD.duz_bas OR NEW.duz_bit IS DISTINCT FROM OLD.duz_bit OR NEW.duz_gerekce IS DISTINCT FROM OLD.duz_gerekce THEN
    -- sürerken düzeltilmez; düzeltme geri alınmaz (yenisi yazılır — eskisi denetim izinde)
    IF OLD.basladi IS NOT NULL AND NEW.bitti IS NULL THEN RAISE EXCEPTION 'Kontrol sürerken saat düzeltilmez.' USING ERRCODE = '23514'; END IF;
    IF NEW.duz_bas IS NULL THEN RAISE EXCEPTION 'Saat düzeltmesi kaldırılmaz.' USING ERRCODE = '23514'; END IF;
    NEW.duz_zaman := now();
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION kontrol_koru() FROM PUBLIC;
DROP TRIGGER IF EXISTS kontrol_koru ON kontrol;
CREATE TRIGGER kontrol_koru BEFORE INSERT OR UPDATE OR DELETE ON kontrol FOR EACH ROW EXECUTE FUNCTION kontrol_koru();

REVOKE ALL ON kontrol FROM PUBLIC;
GRANT SELECT, INSERT ON kontrol TO probata_uygulama;
GRANT UPDATE (bitti, duz_bas, duz_bit, duz_gerekce, duz_kim, duz_zaman, surum, degisti) ON kontrol TO probata_uygulama;
