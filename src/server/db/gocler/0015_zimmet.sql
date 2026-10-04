-- ══ 0015 · ZİMMET (modül 9; maket zimmetler.html, M4 2. tur) ══════════════════════════════════════════════════════════════════
-- Varlık: ölçüm cihazı (0014) · diğer demirbaş (burada; kod firmada eşsiz) · araç (Araçlar kalemi, sütun o göçte eklenir). Her teslim AYRI ve
-- DEĞİŞMEZ kayıt (teslim eden → alan, zaman, not, kilometre, fotoğraflar); "kimde" son hareketten okunur. Teslim alan bir personel ya da depo
-- (alan_personel boş = depo). Bir harekette tam bir varlık (CHECK). Hepsi AYNI firmaya bağlı. Fotoğraf isteğe bağlı (karar 62), dosya yolu tek.
-- Onay uygulamada değil, kişinin ıslak imzalı zimmet formuyla (personel kartı) — 2. tur. ⛔ Her göç IDEMPOTENT.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'personel_firma_kimlik') THEN
    ALTER TABLE personel ADD CONSTRAINT personel_firma_kimlik UNIQUE (firma_id, id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS demirbas (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  kod       text NOT NULL CHECK (kod ~ '^[A-Z0-9-]{3,12}$'),
  ad        text NOT NULL CHECK (length(ad) BETWEEN 2 AND 80),
  pasif     date,
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  degisti   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, kod),
  UNIQUE (firma_id, id)
);
ALTER TABLE demirbas ENABLE ROW LEVEL SECURITY;
ALTER TABLE demirbas FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demirbas' AND policyname = 'demirbas_kiraci') THEN
    CREATE POLICY demirbas_kiraci ON demirbas USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS zimmet_hareket (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id       uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  cihaz_id       uuid,
  demirbas_id    uuid,
  eden_personel  uuid,
  alan_personel  uuid,
  zaman          timestamptz NOT NULL,
  km             integer CHECK (km IS NULL OR km BETWEEN 0 AND 9999999),
  notu           text CHECK (notu IS NULL OR length(notu) <= 300),
  surum          integer NOT NULL DEFAULT 0,
  olustu         timestamptz NOT NULL DEFAULT now(),
  degisti        timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, cihaz_id) REFERENCES olcum_cihazi (firma_id, id),
  FOREIGN KEY (firma_id, demirbas_id) REFERENCES demirbas (firma_id, id),
  FOREIGN KEY (firma_id, eden_personel) REFERENCES personel (firma_id, id),
  FOREIGN KEY (firma_id, alan_personel) REFERENCES personel (firma_id, id),
  UNIQUE (firma_id, id),
  CHECK (num_nonnulls(cihaz_id, demirbas_id) = 1),
  CHECK (eden_personel IS DISTINCT FROM alan_personel)
);
CREATE INDEX IF NOT EXISTS zimmet_cihaz ON zimmet_hareket (firma_id, cihaz_id, zaman DESC) WHERE cihaz_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS zimmet_demirbas ON zimmet_hareket (firma_id, demirbas_id, zaman DESC) WHERE demirbas_id IS NOT NULL;
ALTER TABLE zimmet_hareket ENABLE ROW LEVEL SECURITY;
ALTER TABLE zimmet_hareket FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zimmet_hareket' AND policyname = 'zimmet_hareket_kiraci') THEN
    CREATE POLICY zimmet_hareket_kiraci ON zimmet_hareket USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON demirbas TO probata_uygulama;
-- hareket değişmez: yalnız eklenir ve okunur (güncelleme / silme hakkı yok)
GRANT SELECT, INSERT ON zimmet_hareket TO probata_uygulama;
