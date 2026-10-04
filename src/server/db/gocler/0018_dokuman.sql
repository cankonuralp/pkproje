-- ══ 0018 · DÖKÜMANLAR (modül 4; maket standartlar.html, M7) ══════════════════════════════════════════════════════════════════════
-- Standart kütüphanesi: firmanın standart kopyası (PDF), SÜRÜMLÜ. Her satır bir sürüm; aynı numarada GÜNCEL sürüm tektir (kısmi eşsiz dizin).
-- Yeni sürüm yüklenince eskisi "bitti" tarihiyle önceki olur (dosyası saklanır; o tarihe kadar yazılan raporlar onu gösterir). Ekipman türleri
-- standarda NUMARAYLA bağlanır (Ekipman türleri kalemi) — böylece yeni sürüm türlere kendiliğinden geçer. Kaldırılan sürüm satırı kalır
-- (kaldirildi); güncel kaldırılırsa bir önceki yeniden güncel olur (uygulama). Diğer dökümanlar: firmanın kendi belgeleri (ad, tür, kod,
-- revizyon, PDF). dosya_id kayıtla aynı işlemde yazılır (dosya kaydın kimliğine bağlanır; işlem düşerse ikisi de yok). Kontrol kriterleri belgeleri kodda (src/tanim/kriterler.ts). Hepsi AYNI firmaya bağlı; silme hakkı yok. ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS standart (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no           text NOT NULL CHECK (length(no) BETWEEN 3 AND 40),
  surum_adi    text NOT NULL CHECK (surum_adi ~ '^[0-9]{4}(\+[A-Z][0-9]{1,2}(:[0-9]{4})?)*$'),
  konu         text NOT NULL CHECK (length(konu) BETWEEN 2 AND 120),
  dosya_id     uuid,
  yukleyen     text NOT NULL,
  bitti        date,
  kaldirildi   timestamptz,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS standart_guncel ON standart (firma_id, no) WHERE bitti IS NULL AND kaldirildi IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS standart_surum ON standart (firma_id, no, surum_adi) WHERE kaldirildi IS NULL;
ALTER TABLE standart ENABLE ROW LEVEL SECURITY;
ALTER TABLE standart FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'standart' AND policyname = 'standart_kiraci') THEN
    CREATE POLICY standart_kiraci ON standart USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS dokuman (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  ad           text NOT NULL CHECK (length(ad) BETWEEN 2 AND 100),
  tur          text NOT NULL CHECK (tur IN ('Kalite el kitabı', 'Prosedür', 'Talimat', 'Politika', 'Form', 'Sertifika', 'Diğer')),
  kod          text CHECK (kod IS NULL OR length(kod) <= 20),
  rev          text CHECK (rev IS NULL OR length(rev) <= 20),
  dosya_id     uuid,
  tarih        date NOT NULL DEFAULT current_date,
  kaldirildi   timestamptz,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, id)
);
ALTER TABLE dokuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokuman FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dokuman' AND policyname = 'dokuman_kiraci') THEN
    CREATE POLICY dokuman_kiraci ON dokuman USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON standart TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON dokuman TO probata_uygulama;
