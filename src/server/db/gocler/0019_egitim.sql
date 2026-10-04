-- ══ 0019 · EĞİTİMLER (modül 10; Dökümanlar'ın sekmesi; maket egitimler.html, M16) ═════════════════════════════════════════════════
-- Eğitim türü: firmanın eklediği ad + tekrar süresi (1–120 ay). Eğitim kaydı: personel × tür × tarih; tekrar tarihi = tarih + tür süresi (kayıt
-- anındaki süreyle yazılır — tür süresi sonradan değişse de geçmiş kaydın tekrarı değişmez). Aynı kişi × eğitimde GÜNCEL kayıt tektir (kısmi
-- eşsiz dizin); tekrarı kaydedilince eskisi "önceki" olur. Sertifika PDF'i isteğe bağlı. Hepsi AYNI firmaya bağlı; silme hakkı yok.
-- ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS egitim_turu (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  ad         text NOT NULL CHECK (length(ad) BETWEEN 2 AND 60),
  tekrar_ay  integer NOT NULL CHECK (tekrar_ay BETWEEN 1 AND 120),
  surum      integer NOT NULL DEFAULT 0,
  olustu     timestamptz NOT NULL DEFAULT now(),
  degisti    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, id)
);
ALTER TABLE egitim_turu ENABLE ROW LEVEL SECURITY;
ALTER TABLE egitim_turu FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'egitim_turu' AND policyname = 'egitim_turu_kiraci') THEN
    CREATE POLICY egitim_turu_kiraci ON egitim_turu USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS egitim_kaydi (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  personel_id  uuid NOT NULL,
  tur_id       uuid NOT NULL,
  tarih        date NOT NULL,
  tekrar       date NOT NULL,
  kurum        text NOT NULL CHECK (kurum IN ('Firma içi', 'Dış eğitim kurumu')),
  dosya_id     uuid,
  onceki       boolean NOT NULL DEFAULT false,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  FOREIGN KEY (firma_id, tur_id) REFERENCES egitim_turu (firma_id, id),
  CHECK (tekrar > tarih),
  UNIQUE (firma_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS egitim_kaydi_guncel ON egitim_kaydi (firma_id, personel_id, tur_id) WHERE NOT onceki;
ALTER TABLE egitim_kaydi ENABLE ROW LEVEL SECURITY;
ALTER TABLE egitim_kaydi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'egitim_kaydi' AND policyname = 'egitim_kaydi_kiraci') THEN
    CREATE POLICY egitim_kaydi_kiraci ON egitim_kaydi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON egitim_turu TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON egitim_kaydi TO probata_uygulama;
