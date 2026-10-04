-- ══ 0021 · PERSONEL DOSYASI (maket personel.html: özlük, ekipman atamaları, maaş ve bordrolar, imzalı zimmet formu) ═══════════════════════
-- Özlük belgesi: kişinin belgeleri (tür listeden), yalnız firma yöneticisi görür (KVKK). Ekipman ataması: denetçinin atandığı ekipman türü + atama
-- belgesi (zorunlu); kişi × tür başına tek geçerli atama. Bordro: aylık PDF + brüt / net / işverene maliyet; aynı dönemin yenisi eskisinin yerine
-- geçer (eski kaldırılır, saklanır). İmzalı zimmet formu: o anki zimmet kapsamıyla (varlık anahtarları) yüklenen tarama — zimmet sonradan değişirse
-- form "eskidi". Kaldırılan satır kalır (kaldirildi); silme hakkı yok. Hepsi AYNI firmaya bağlı. ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS ozluk_belgesi (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  personel_id  uuid NOT NULL,
  tur          text NOT NULL CHECK (tur ~ '^[a-z0-9]{2,12}$'),
  aciklama     text CHECK (aciklama IS NULL OR length(aciklama) <= 120),
  dosya_id     uuid,
  kaldirildi   timestamptz,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  UNIQUE (firma_id, id)
);

CREATE TABLE IF NOT EXISTS ekipman_atamasi (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  personel_id  uuid NOT NULL,
  tur_id       uuid NOT NULL,
  tarih        date NOT NULL,
  dosya_id     uuid,
  kaldirildi   timestamptz,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id),
  UNIQUE (firma_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ekipman_atamasi_gecerli ON ekipman_atamasi (firma_id, personel_id, tur_id) WHERE kaldirildi IS NULL;

CREATE TABLE IF NOT EXISTS bordro (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  personel_id  uuid NOT NULL,
  ay           text NOT NULL CHECK (ay ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  brut         numeric(12, 2) NOT NULL CHECK (brut > 0),
  net          numeric(12, 2) NOT NULL CHECK (net > 0 AND net <= brut),
  maliyet      numeric(12, 2) NOT NULL CHECK (maliyet >= brut),
  dosya_id     uuid,
  kaldirildi   timestamptz,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  UNIQUE (firma_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS bordro_donem ON bordro (firma_id, personel_id, ay) WHERE kaldirildi IS NULL;

CREATE TABLE IF NOT EXISTS zimmet_formu (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  personel_id  uuid NOT NULL,
  kapsam       text[] NOT NULL CHECK (cardinality(kapsam) <= 200),
  dosya_id     uuid,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  UNIQUE (firma_id, id)
);

ALTER TABLE ozluk_belgesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE ozluk_belgesi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ozluk_belgesi' AND policyname = 'ozluk_belgesi_kiraci') THEN
    CREATE POLICY ozluk_belgesi_kiraci ON ozluk_belgesi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
ALTER TABLE ekipman_atamasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_atamasi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ekipman_atamasi' AND policyname = 'ekipman_atamasi_kiraci') THEN
    CREATE POLICY ekipman_atamasi_kiraci ON ekipman_atamasi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
ALTER TABLE bordro ENABLE ROW LEVEL SECURITY;
ALTER TABLE bordro FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bordro' AND policyname = 'bordro_kiraci') THEN
    CREATE POLICY bordro_kiraci ON bordro USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
ALTER TABLE zimmet_formu ENABLE ROW LEVEL SECURITY;
ALTER TABLE zimmet_formu FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zimmet_formu' AND policyname = 'zimmet_formu_kiraci') THEN
    CREATE POLICY zimmet_formu_kiraci ON zimmet_formu USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON ozluk_belgesi TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON ekipman_atamasi TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON bordro TO probata_uygulama;
-- imzalı form değişmez: yenisi yüklenir (dosya_id kayıtla aynı işlemde yazılır)
GRANT SELECT, INSERT, UPDATE ON zimmet_formu TO probata_uygulama;
