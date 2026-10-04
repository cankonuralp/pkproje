-- ══ 0017 · SÖZLEŞMELER + İSG-KATİP (modül 12; maket sozlesmeler.html, M5 + M13 2. tur) ═════════════════════════════════════════════
-- İş sözleşmesi: hizmet veren firma ile hizmet alan müşteri arasında; no IS-AAYY-SIRA (numara üreticisi); kapsam tesisler; müşteri imzası
-- yüklenen imzalı PDF ile (yükleyince yürürlükte). İSG-KATİP sözleşme ID'si TESİS × DENETÇİ başına (sözleşmenin sayfasında girilir, plan açarken
-- oradan gelir); onay ve bitiş isteğe bağlı; yeni ID eskisini "önceki" yapar; hiçbir planda kullanılmamış ID kaldırılır, kullanılmış yalnız
-- düzeltilir (kullanildi sütununu Planlar yazar). Sözleşme şablonu firmanın yüklediği sürümler. Hepsi AYNI firmaya bağlı; silme yok.
-- ⛔ Her göç IDEMPOTENT.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tesis_firma_kimlik') THEN
    ALTER TABLE tesis ADD CONSTRAINT tesis_firma_kimlik UNIQUE (firma_id, id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS is_sozlesmesi (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no            text NOT NULL CHECK (no ~ '^[A-Z]{1,4}-[0-9]{4}-[0-9]{3,}$'),
  musteri_id    uuid NOT NULL,
  baslangic     date NOT NULL,
  bitis         date NOT NULL,
  vade          integer NOT NULL CHECK (vade BETWEEN 0 AND 120),
  yenileme      text NOT NULL CHECK (yenileme IN ('yok', 'otomatik')),
  firma_imza    date NOT NULL DEFAULT current_date,
  musteri_imza  date,
  imzali_dosya  uuid,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, musteri_id) REFERENCES musteri (firma_id, id),
  CHECK (bitis >= baslangic),
  CHECK ((musteri_imza IS NULL) = (imzali_dosya IS NULL)),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id)
);
ALTER TABLE is_sozlesmesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE is_sozlesmesi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'is_sozlesmesi' AND policyname = 'is_sozlesmesi_kiraci') THEN
    CREATE POLICY is_sozlesmesi_kiraci ON is_sozlesmesi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS is_sozlesmesi_tesis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  sozlesme_id   uuid NOT NULL,
  tesis_id      uuid NOT NULL,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, sozlesme_id) REFERENCES is_sozlesmesi (firma_id, id),
  FOREIGN KEY (firma_id, tesis_id) REFERENCES tesis (firma_id, id),
  UNIQUE (firma_id, sozlesme_id, tesis_id)
);
ALTER TABLE is_sozlesmesi_tesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE is_sozlesmesi_tesis FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'is_sozlesmesi_tesis' AND policyname = 'is_sozlesmesi_tesis_kiraci') THEN
    CREATE POLICY is_sozlesmesi_tesis_kiraci ON is_sozlesmesi_tesis USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS isg_katip (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tesis_id      uuid NOT NULL,
  personel_id   uuid NOT NULL,
  no            text NOT NULL CHECK (length(no) BETWEEN 1 AND 30),
  onay          date,
  bitis         date,
  dosya_id      uuid,
  onceki        boolean NOT NULL DEFAULT false,
  kullanildi    date,
  kaldirildi    timestamptz,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, tesis_id) REFERENCES tesis (firma_id, id),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  CHECK (kaldirildi IS NULL OR kullanildi IS NULL),
  UNIQUE (firma_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS isg_katip_gecerli ON isg_katip (firma_id, tesis_id, personel_id) WHERE NOT onceki AND kaldirildi IS NULL;
ALTER TABLE isg_katip ENABLE ROW LEVEL SECURITY;
ALTER TABLE isg_katip FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'isg_katip' AND policyname = 'isg_katip_kiraci') THEN
    CREATE POLICY isg_katip_kiraci ON isg_katip USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sozlesme_sablon (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  surum_no      integer NOT NULL CHECK (surum_no >= 1),
  dosya_id      uuid NOT NULL,
  kaldirildi    timestamptz,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, surum_no)
);
ALTER TABLE sozlesme_sablon ENABLE ROW LEVEL SECURITY;
ALTER TABLE sozlesme_sablon FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sozlesme_sablon' AND policyname = 'sozlesme_sablon_kiraci') THEN
    CREATE POLICY sozlesme_sablon_kiraci ON sozlesme_sablon USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON is_sozlesmesi TO probata_uygulama;
-- kapsam sözleşmeyle birlikte yazılır, sonra değişmez
GRANT SELECT, INSERT ON is_sozlesmesi_tesis TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON isg_katip TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON sozlesme_sablon TO probata_uygulama;
