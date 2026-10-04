-- ══ 0016 · ARAÇLAR (modül 23; maket araclar.html, AA4 + 2026-10-03 haftalık kilometre) ═══════════════════════════════════════════════
-- Araç bir zimmet varlığı: "kimde" Zimmetler'in hareketlerinden okunur (zimmet_hareket.arac_id), ikinci liste yok. Plaka firmada eşsiz
-- (boşluklar yok sayılır). Teslim tutanağı = o zimmet hareketinin eki (no, yakıt, araçta olanlar, hasar; kilometre hareketin km sütununda);
-- hareket gibi DEĞİŞMEZ. Haftalık kilometre: araç başına hafta (Pazartesi) başına bir kayıt; aynı hafta düzeltilir (güncelleme hakkı var).
-- Hepsi AYNI firmaya bağlı (bileşik yabancı anahtar). ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS arac (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  plaka      text NOT NULL CHECK (plaka ~ '^[0-9]{2} ?[A-ZÇĞİÖŞÜ]{1,3} ?[0-9]{2,4}$'),
  plaka_duz  text GENERATED ALWAYS AS (replace(plaka, ' ', '')) STORED,
  tur        text NOT NULL CHECK (tur IN ('Binek araç', 'Hafif ticari araç', 'Kamyonet', 'Minibüs', 'Kamyon')),
  marka      text NOT NULL CHECK (length(marka) BETWEEN 1 AND 40),
  model      text NOT NULL CHECK (length(model) BETWEEN 1 AND 40),
  yil        integer NOT NULL CHECK (yil BETWEEN 1980 AND 2100),
  yakit      text NOT NULL CHECK (yakit IN ('benzin', 'dizel', 'lpg', 'elektrik', 'hibrit')),
  ilk_km     integer CHECK (ilk_km IS NULL OR ilk_km BETWEEN 0 AND 9999999),
  bakim_km   integer CHECK (bakim_km IS NULL OR bakim_km BETWEEN 0 AND 9999999),
  muayene    date,
  sigorta    date,
  kasko      date,
  pasif      date,
  surum      integer NOT NULL DEFAULT 0,
  olustu     timestamptz NOT NULL DEFAULT now(),
  degisti    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, plaka_duz),
  UNIQUE (firma_id, id)
);
ALTER TABLE arac ENABLE ROW LEVEL SECURITY;
ALTER TABLE arac FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'arac' AND policyname = 'arac_kiraci') THEN
    CREATE POLICY arac_kiraci ON arac USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- zimmet hareketine araç: bir harekette tam bir varlık (cihaz · demirbaş · araç). Eski iki varlıklı denetim yerine üç varlıklı.
ALTER TABLE zimmet_hareket ADD COLUMN IF NOT EXISTS arac_id uuid;
DO $$ DECLARE c text; BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zimmet_hareket_arac_fk') THEN
    ALTER TABLE zimmet_hareket ADD CONSTRAINT zimmet_hareket_arac_fk FOREIGN KEY (firma_id, arac_id) REFERENCES arac (firma_id, id);
  END IF;
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid = 'zimmet_hareket'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%num_nonnulls(cihaz_id, demirbas_id)%' LOOP
    EXECUTE format('ALTER TABLE zimmet_hareket DROP CONSTRAINT %I', c);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zimmet_hareket_tek_varlik') THEN
    ALTER TABLE zimmet_hareket ADD CONSTRAINT zimmet_hareket_tek_varlik CHECK (num_nonnulls(cihaz_id, demirbas_id, arac_id) = 1);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS zimmet_arac ON zimmet_hareket (firma_id, arac_id, zaman DESC) WHERE arac_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS arac_tutanagi (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hareket_id  uuid NOT NULL,
  no          text NOT NULL CHECK (no ~ '^[A-Z]{1,4}-[0-9]{4}-[0-9]{3,}$'),
  yakit       text NOT NULL CHECK (yakit IN ('bos', 'ceyrek', 'yarim', 'ucceyrek', 'dolu')),
  kontrol     text[] NOT NULL DEFAULT '{}',
  hasar       text CHECK (hasar IS NULL OR length(hasar) <= 400),
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, hareket_id) REFERENCES zimmet_hareket (firma_id, id),
  UNIQUE (firma_id, hareket_id),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id)
);
ALTER TABLE arac_tutanagi ENABLE ROW LEVEL SECURITY;
ALTER TABLE arac_tutanagi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'arac_tutanagi' AND policyname = 'arac_tutanagi_kiraci') THEN
    CREATE POLICY arac_tutanagi_kiraci ON arac_tutanagi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS arac_km (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  arac_id     uuid NOT NULL,
  hafta       date NOT NULL CHECK (extract(isodow FROM hafta) = 1),
  km          integer NOT NULL CHECK (km BETWEEN 0 AND 9999999),
  personel_id uuid,
  zaman       timestamptz NOT NULL DEFAULT now(),
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, arac_id) REFERENCES arac (firma_id, id),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  UNIQUE (firma_id, arac_id, hafta)
);
ALTER TABLE arac_km ENABLE ROW LEVEL SECURITY;
ALTER TABLE arac_km FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'arac_km' AND policyname = 'arac_km_kiraci') THEN
    CREATE POLICY arac_km_kiraci ON arac_km USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON arac TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON arac_km TO probata_uygulama;
-- tutanak hareket gibi değişmez: yalnız eklenir ve okunur
GRANT SELECT, INSERT ON arac_tutanagi TO probata_uygulama;
