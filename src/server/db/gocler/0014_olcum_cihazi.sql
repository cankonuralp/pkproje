-- ══ 0014 · ÖLÇÜM CİHAZLARI (modül 8; maket olcum-cihazlari.html, M4 2. tur; T7 cihaz türü ekle) ═════════════════════════════════════════
-- Cihaz türü: firmanın listesi (ad firmada eşsiz). Cihaz: firmanın verdiği KOD (etiket; firmada eşsiz, düzenlenir), tür, marka / model / seri,
-- ölçüm aralığı, konum (depo · kalibrasyonda; kişi zimmeti Zimmetler kaleminde). Kalibrasyon kaydı: tarih, geçerlilik bitişi (≥ tarih),
-- laboratuvar, sertifika no, sonuç, isteğe bağlı sertifika PDF'i (kapalı depo). Geçerli bitiş = "uygun" kayıtların en geç bitişi (hesap
-- uygulamada). Silme yok: cihaz pasif, kayıt kaldırılır. Hepsi AYNI firmada bağlı. ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS cihaz_turu (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  ad        text NOT NULL CHECK (length(ad) BETWEEN 2 AND 60),
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  degisti   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS cihaz_turu_ad ON cihaz_turu (firma_id, lower(ad));
ALTER TABLE cihaz_turu ENABLE ROW LEVEL SECURITY;
ALTER TABLE cihaz_turu FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cihaz_turu' AND policyname = 'cihaz_turu_kiraci') THEN
    CREATE POLICY cihaz_turu_kiraci ON cihaz_turu USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS olcum_cihazi (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  kod       text NOT NULL CHECK (kod ~ '^[A-Z0-9-]{3,12}$'),
  tur_id    uuid NOT NULL,
  marka     text CHECK (marka IS NULL OR length(marka) <= 40),
  model     text CHECK (model IS NULL OR length(model) <= 40),
  seri      text CHECK (seri IS NULL OR length(seri) <= 40),
  aralik    text CHECK (aralik IS NULL OR length(aralik) <= 60),
  konum     text NOT NULL DEFAULT 'depo' CHECK (konum IN ('depo', 'lab')),
  pasif     date,
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  degisti   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, tur_id) REFERENCES cihaz_turu (firma_id, id),
  UNIQUE (firma_id, kod),
  UNIQUE (firma_id, id)
);
ALTER TABLE olcum_cihazi ENABLE ROW LEVEL SECURITY;
ALTER TABLE olcum_cihazi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'olcum_cihazi' AND policyname = 'olcum_cihazi_kiraci') THEN
    CREATE POLICY olcum_cihazi_kiraci ON olcum_cihazi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS kalibrasyon (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  cihaz_id    uuid NOT NULL,
  tarih       date NOT NULL,
  bitis       date NOT NULL,
  lab         text NOT NULL CHECK (length(lab) BETWEEN 2 AND 80),
  sertifika   text NOT NULL CHECK (length(sertifika) BETWEEN 1 AND 40),
  sonuc       text NOT NULL CHECK (sonuc IN ('uygun', 'uygun_degil')),
  dosya_id    uuid,
  kaldirildi  timestamptz,
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, cihaz_id) REFERENCES olcum_cihazi (firma_id, id),
  FOREIGN KEY (firma_id, dosya_id) REFERENCES dosya (firma_id, id),
  CHECK (bitis >= tarih)
);
CREATE INDEX IF NOT EXISTS kalibrasyon_cihaz ON kalibrasyon (firma_id, cihaz_id);
ALTER TABLE kalibrasyon ENABLE ROW LEVEL SECURITY;
ALTER TABLE kalibrasyon FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kalibrasyon' AND policyname = 'kalibrasyon_kiraci') THEN
    CREATE POLICY kalibrasyon_kiraci ON kalibrasyon USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON cihaz_turu, olcum_cihazi, kalibrasyon TO probata_uygulama;
