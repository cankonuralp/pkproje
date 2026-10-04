-- ══ 0023 · EKİPMAN + PLAN (modül 7 — planın içinde; modül 13 Planlama; maket plan-ac.html M6, planlarim.html; pkproje §3.4, §3.5; KOD-GECIS §3, §5) ══
-- EKİPMAN: tesisin KALICI kaydı (reisim 3. tur: "ekipman ekle ve rapor oluşturma ayrı olmalı … seneye yeni rapor"); tür kataloğa bağlı; kodu
-- personel etiketten yazar, FİRMADA EŞSİZ (A–Z 0–9 tire, 3–20, tireyle başlamaz / bitmez, çift tire yok); silinmez, pasife alınır. Sistem öncesi
-- son kontrol (Excel'den gelen) ayrı sütunda. EKİPMAN KODU GEÇMİŞİ: verilmiş HER kod (eski kod dahil) firmada tek ekipmanındır — kod değişirse eski
-- kod başkasına verilmez (KOD-GECIS §3 "eski kod başkasına verilmez"); veritabanı tetiği yazar, başka ekipmanın kodu reddedilir.
-- PLAN: proje no (P-AAYY-SIRA, sunucu verir, firmada eşsiz), tesis, başlangıç–bitiş (bitiş başlangıçtan önce olamaz; geçmiş tarih UYARI — G1),
-- açıklama, durum (Kabul bekliyor → Kabul edildi → Denetimde → Tamamlandı · Reddedildi), KÜNYE (plan açılırken kayıttan: firma adı = müşteri
-- ünvanı, adres, SGK DETSİS NO — §3.4 "Plan künyesi": planlamacı Düzenle ile değiştirir). Tesisin bütün ekipmanı plana girer (L6; kapsam seçimi yok).
-- PLAN EKİBİ: plan × denetçi (personel) + o denetçinin İSG-KATİP SÖZLEŞME ID'si (sözleşmeden gelir ya da plan açan el ile yazar; boş kalabilir —
-- uyarı, engel değil, L2). Hepsi AYNI firmaya bağlı; silme hakkı yok. Plan hareketleri denetim izinde (nesne 'plan'). ⛔ Her göç IDEMPOTENT.
CREATE TABLE IF NOT EXISTS ekipman (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tesis_id     uuid NOT NULL,
  tur_id       uuid NOT NULL,
  kod          text NOT NULL CHECK (kod ~ '^[A-Z0-9]([A-Z0-9]|-[A-Z0-9]){2,19}$' AND length(kod) BETWEEN 3 AND 20),
  konum        text CHECK (konum IS NULL OR length(konum) BETWEEN 1 AND 60),
  marka        text CHECK (marka IS NULL OR length(marka) BETWEEN 1 AND 60),
  model        text CHECK (model IS NULL OR length(model) BETWEEN 1 AND 60),
  seri         text CHECK (seri IS NULL OR length(seri) BETWEEN 1 AND 30),
  imal         integer CHECK (imal IS NULL OR imal BETWEEN 1900 AND 2100),
  dis_kontrol  date,
  dis_sonuc    text CHECK (dis_sonuc IS NULL OR dis_sonuc IN ('Uygun', 'Hafif kusurlu', 'Kusurlu')),
  pasif        timestamptz,
  ekleyen      text NOT NULL CHECK (length(ekleyen) BETWEEN 1 AND 200),
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, tesis_id) REFERENCES tesis (firma_id, id),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id),
  UNIQUE (firma_id, kod),
  UNIQUE (firma_id, id),
  CHECK (dis_sonuc IS NULL OR dis_kontrol IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS ekipman_tesis ON ekipman (firma_id, tesis_id);
ALTER TABLE ekipman ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ekipman' AND policyname = 'ekipman_kiraci') THEN
    CREATE POLICY ekipman_kiraci ON ekipman USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ekipman_kodu (
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  kod          text NOT NULL,
  ekipman_id   uuid NOT NULL,
  verildi      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firma_id, kod),
  FOREIGN KEY (firma_id, ekipman_id) REFERENCES ekipman (firma_id, id)
);
ALTER TABLE ekipman_kodu ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekipman_kodu FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ekipman_kodu' AND policyname = 'ekipman_kodu_kiraci') THEN
    CREATE POLICY ekipman_kodu_kiraci ON ekipman_kodu USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
-- her verilen kod geçmişe yazılır; kod BAŞKA bir ekipmana verilmişse (eski kodu dahil) reddedilir
CREATE OR REPLACE FUNCTION ekipman_kodu_kaydet() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE sahibi uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.kod = OLD.kod THEN RETURN NEW; END IF;
  INSERT INTO ekipman_kodu (firma_id, kod, ekipman_id) VALUES (NEW.firma_id, NEW.kod, NEW.id) ON CONFLICT (firma_id, kod) DO NOTHING;
  SELECT ekipman_id INTO sahibi FROM ekipman_kodu WHERE firma_id = NEW.firma_id AND kod = NEW.kod;
  IF sahibi IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'ekipman kodu % başka bir ekipmana verilmiş', NEW.kod USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION ekipman_kodu_kaydet() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ekipman_kodu_kaydet() FROM PUBLIC;
CREATE OR REPLACE TRIGGER ekipman_kodu_kaydet AFTER INSERT OR UPDATE OF kod ON ekipman FOR EACH ROW EXECUTE FUNCTION ekipman_kodu_kaydet();

CREATE TABLE IF NOT EXISTS plan (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no           text NOT NULL CHECK (no ~ '^[A-Z]{1,4}-[0-9]{4}-[0-9]{3,6}$'),
  tesis_id     uuid NOT NULL,
  baslangic    date NOT NULL,
  bitis        date NOT NULL,
  aciklama     text CHECK (aciklama IS NULL OR length(aciklama) BETWEEN 1 AND 300),
  durum        text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'kabul', 'denetimde', 'tamamlandi', 'reddedildi')),
  firma_adi    text NOT NULL CHECK (length(firma_adi) BETWEEN 1 AND 200),
  adres        text CHECK (adres IS NULL OR length(adres) BETWEEN 1 AND 300),
  sgk          text CHECK (sgk IS NULL OR sgk ~ '^[0-9]{26}$'),
  acan         text NOT NULL CHECK (length(acan) BETWEEN 1 AND 200),
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, tesis_id) REFERENCES tesis (firma_id, id),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id),
  CHECK (bitis >= baslangic)
);
CREATE INDEX IF NOT EXISTS plan_tesis ON plan (firma_id, tesis_id);
CREATE INDEX IF NOT EXISTS plan_tarih ON plan (firma_id, baslangic DESC);
ALTER TABLE plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan' AND policyname = 'plan_kiraci') THEN
    CREATE POLICY plan_kiraci ON plan USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;
-- proje no değişmez (planın kimliği; raporlar ve muhasebe ona bağlanır)
CREATE OR REPLACE FUNCTION plan_no_degismez() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.no IS DISTINCT FROM OLD.no OR NEW.tesis_id IS DISTINCT FROM OLD.tesis_id THEN
    RAISE EXCEPTION 'planın proje numarası ve tesisi değişmez' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION plan_no_degismez() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION plan_no_degismez() FROM PUBLIC;
CREATE OR REPLACE TRIGGER plan_no_degismez BEFORE UPDATE ON plan FOR EACH ROW EXECUTE FUNCTION plan_no_degismez();

CREATE TABLE IF NOT EXISTS plan_ekip (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  plan_id      uuid NOT NULL,
  personel_id  uuid NOT NULL,
  isg_no       text CHECK (isg_no IS NULL OR length(isg_no) BETWEEN 1 AND 30),
  isg_id       uuid,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  FOREIGN KEY (firma_id, isg_id) REFERENCES isg_katip (firma_id, id),
  UNIQUE (firma_id, plan_id, personel_id),
  UNIQUE (firma_id, id),
  CHECK (isg_id IS NULL OR isg_no IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS plan_ekip_personel ON plan_ekip (firma_id, personel_id);
ALTER TABLE plan_ekip ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_ekip FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_ekip' AND policyname = 'plan_ekip_kiraci') THEN
    CREATE POLICY plan_ekip_kiraci ON plan_ekip USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON ekipman, plan, plan_ekip TO probata_uygulama;
GRANT SELECT, INSERT ON ekipman_kodu TO probata_uygulama;
