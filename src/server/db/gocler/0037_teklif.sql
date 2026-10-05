-- ══ 0037 · TEKLİFLER (324; modül 11; maket teklifler.html M12 2. tur; pkproje §3.1 modül 11, §3.2 madde 5, §9 yirmi birinci tur 119–124) ══
-- Teklif: no T-AAYY-SIRA (numara üreticisi; önek firma ayarı); kayıtlı müşteriye (bir ya da birden çok TESİS — 123) ya da kayıtlı olmayan
-- müşteriye (aday: ünvan, vergi, adres, il / ilçe, e-posta, telefon, yetkili — 2026-09-27); kalem = ekipman türü × adet × birim fiyat (KDV hariç;
-- fiyat listesinden gelir, satır başına değişir — 119); KDV teklifte (varsayılan %20 — 120); geçerlilik gün (gönderilişten sayılır).
-- Durum: taslak → gönderildi → kabul / red (müşterinin gerekçesi ≥ 5). Süresi dolan kendiliğinden (124): gönderildi + geçerlilik < bugün →
-- "süresi doldu" (okurken hesaplanır; süresi dolan teklif kabul / red edilmez). Yalnız TASLAK düzenlenir (kalemler, tesisler dahil — tetik);
-- gönderilen teklif değişmez (yenisi kopyalanır). Kayıtlı olmayan müşterinin kabul edilen teklifi "Müşteri olarak kaydet" ile müşteriye
-- bağlanır (bir kez; tesis de o anda eklenir).
-- Fiyat listesi: tür başına KDV hariç birim fiyat (firma ayarı — 119); kabul edilmiş teklifin fiyatı değişmez (kalem kendi fiyatını taşır).
-- Tutarlar KURUŞ (tam sayı).
-- 324 çapraz incelemesi (göç henüz uygulanmamıştı, yerinde): kalem / tesis başka teklife taşınmaz; tesissiz (kayıtlı müşterili) teklif gönderilmez;
-- "ilk tesis" istisnası yalnız kayıtlı olmayan müşteriden gelen teklif; taslağın müşterisi değişirken teklifte başka müşterinin tesisi kalamaz;
-- kopya kaynağı aynı firmanın teklifi (yabancı anahtar); Excel ekipman listesinin bayt sınırı şemanın en kötü durumunu karşılar.
-- ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS fiyat_listesi (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tur_id    uuid NOT NULL,
  -- KURUŞ (para kayan noktayla tutulmaz — src/sema/ortak.ts tutar)
  fiyat     bigint NOT NULL CHECK (fiyat BETWEEN 0 AND 100000000000),
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  degisti   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id),
  UNIQUE (firma_id, tur_id),
  UNIQUE (firma_id, id)
);
ALTER TABLE fiyat_listesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiyat_listesi FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS teklif (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no            text NOT NULL CHECK (no ~ '^[A-Z]{1,4}-[0-9]{4}-[0-9]{3,6}$'),
  musteri_id    uuid,
  -- kayıtlı olmayan müşterinin elle girilen bilgileri (müşteri olarak kaydedilince de kalır — teklifin verildiği hâl)
  aday          jsonb CHECK (aday IS NULL OR (jsonb_typeof(aday) = 'object' AND pg_column_size(aday) <= 4000)),
  durum         text NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak', 'gonderildi', 'kabul', 'red')),
  tarih         date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Istanbul')::date,
  gonderildi    date,
  sonuc         date,
  gerekce       text CHECK (gerekce IS NULL OR length(btrim(gerekce)) BETWEEN 5 AND 300),
  gecerlilik    integer NOT NULL CHECK (gecerlilik BETWEEN 1 AND 999),
  kdv           integer NOT NULL DEFAULT 20 CHECK (kdv BETWEEN 0 AND 99),
  notlar        text CHECK (notlar IS NULL OR length(notlar) <= 300),
  -- müşterinin Excel'den yüklenen ekipman listesi (kod, tür, konum, seri) — teklifle saklanır
  ekipmanlar    jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(ekipmanlar) = 'array' AND pg_column_size(ekipmanlar) <= 1500000),
  hazirlayan    uuid,
  kopya_kaynak  uuid,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, musteri_id) REFERENCES musteri (firma_id, id),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id),
  FOREIGN KEY (firma_id, kopya_kaynak) REFERENCES teklif (firma_id, id),
  CHECK (musteri_id IS NOT NULL OR aday IS NOT NULL),
  CHECK ((durum = 'taslak') = (gonderildi IS NULL)),
  CHECK ((durum IN ('kabul', 'red')) = (sonuc IS NOT NULL)),
  CHECK ((durum = 'red') = (gerekce IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS teklif_tarih ON teklif (firma_id, tarih DESC);
CREATE INDEX IF NOT EXISTS teklif_musteri ON teklif (firma_id, musteri_id);
ALTER TABLE teklif ENABLE ROW LEVEL SECURITY;
ALTER TABLE teklif FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS teklif_tesis (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  teklif_id  uuid NOT NULL,
  tesis_id   uuid NOT NULL,
  sira       integer NOT NULL DEFAULT 0 CHECK (sira BETWEEN 0 AND 499),
  surum      integer NOT NULL DEFAULT 0,
  olustu     timestamptz NOT NULL DEFAULT now(),
  degisti    timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, teklif_id) REFERENCES teklif (firma_id, id),
  FOREIGN KEY (firma_id, tesis_id) REFERENCES tesis (firma_id, id),
  UNIQUE (firma_id, teklif_id, tesis_id)
);
ALTER TABLE teklif_tesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE teklif_tesis FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS teklif_kalem (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  teklif_id  uuid NOT NULL,
  tur_id     uuid NOT NULL,
  adet       integer NOT NULL CHECK (adet BETWEEN 1 AND 999),
  -- KURUŞ, KDV hariç birim fiyat
  fiyat      bigint NOT NULL CHECK (fiyat BETWEEN 1 AND 100000000000),
  sira       integer NOT NULL DEFAULT 0 CHECK (sira BETWEEN 0 AND 499),
  surum      integer NOT NULL DEFAULT 0,
  olustu     timestamptz NOT NULL DEFAULT now(),
  degisti    timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, teklif_id) REFERENCES teklif (firma_id, id),
  FOREIGN KEY (firma_id, tur_id) REFERENCES ekipman_turu (firma_id, id),
  UNIQUE (firma_id, teklif_id, tur_id)
);
ALTER TABLE teklif_kalem ENABLE ROW LEVEL SECURITY;
ALTER TABLE teklif_kalem FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fiyat_listesi' AND policyname = 'fiyat_listesi_kiraci') THEN
    CREATE POLICY fiyat_listesi_kiraci ON fiyat_listesi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teklif' AND policyname = 'teklif_kiraci') THEN
    CREATE POLICY teklif_kiraci ON teklif USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teklif_tesis' AND policyname = 'teklif_tesis_kiraci') THEN
    CREATE POLICY teklif_tesis_kiraci ON teklif_tesis USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teklif_kalem' AND policyname = 'teklif_kalem_kiraci') THEN
    CREATE POLICY teklif_kalem_kiraci ON teklif_kalem USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- TEKLİF AKIŞI: yeni teklif taslak açılır (hazırlayan veritabanından); yalnız taslak düzenlenir; geçişler taslak → gönderildi → kabul / red;
-- süresi dolan gönderilmiş teklif kabul / red edilmez; kayıtlı olmayan müşterinin KABUL edilmiş teklifi bir kez müşteriye bağlanır
CREATE OR REPLACE FUNCTION teklif_akis() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE bugun date := (now() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'taslak' OR NEW.gonderildi IS NOT NULL OR NEW.sonuc IS NOT NULL OR NEW.gerekce IS NOT NULL THEN
      RAISE EXCEPTION 'yeni teklif taslak açılır' USING ERRCODE = '23514';
    END IF;
    NEW.hazirlayan := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
    NEW.tarih := bugun;
    RETURN NEW;
  END IF;
  IF NEW.no IS DISTINCT FROM OLD.no OR NEW.hazirlayan IS DISTINCT FROM OLD.hazirlayan OR NEW.tarih IS DISTINCT FROM OLD.tarih
    OR NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.olustu IS DISTINCT FROM OLD.olustu OR NEW.kopya_kaynak IS DISTINCT FROM OLD.kopya_kaynak THEN
    RAISE EXCEPTION 'teklifin numarası, tarihi ve hazırlayanı değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum <> 'taslak' THEN
    -- gönderilmiş teklifin içeriği değişmez; tek istisna: kayıtlı olmayan müşterinin kabul edilmiş teklifi BİR KEZ müşteriye bağlanır
    IF NEW.aday IS DISTINCT FROM OLD.aday OR NEW.gecerlilik IS DISTINCT FROM OLD.gecerlilik OR NEW.kdv IS DISTINCT FROM OLD.kdv
      OR NEW.notlar IS DISTINCT FROM OLD.notlar OR NEW.ekipmanlar IS DISTINCT FROM OLD.ekipmanlar
      OR (NEW.musteri_id IS DISTINCT FROM OLD.musteri_id AND NOT (OLD.durum = 'kabul' AND NEW.durum = 'kabul' AND OLD.musteri_id IS NULL)) THEN
      RAISE EXCEPTION 'yalnız taslak teklif düzenlenir (gönderilen teklif değişmez; yenisi kopyalanır)' USING ERRCODE = '23514';
    END IF;
  END IF;
  -- müşteri değişirken teklifte başka müşterinin tesisi kalamaz (tesisler önce eşitlenir — teklifKaydet)
  IF NEW.musteri_id IS DISTINCT FROM OLD.musteri_id AND EXISTS (SELECT 1 FROM teklif_tesis y JOIN tesis s ON s.firma_id = y.firma_id AND s.id = y.tesis_id
      WHERE y.firma_id = NEW.firma_id AND y.teklif_id = NEW.id AND s.musteri_id IS DISTINCT FROM NEW.musteri_id) THEN
    RAISE EXCEPTION 'tesis teklifin müşterisinin olmalı' USING ERRCODE = '23514';
  END IF;
  NEW.gonderildi := OLD.gonderildi; NEW.sonuc := OLD.sonuc;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF OLD.durum = 'taslak' AND NEW.durum = 'gonderildi' THEN
      IF NOT EXISTS (SELECT 1 FROM teklif_kalem k WHERE k.firma_id = NEW.firma_id AND k.teklif_id = NEW.id) THEN
        RAISE EXCEPTION 'kalemsiz teklif gönderilmez' USING ERRCODE = '23514';
      END IF;
      IF NEW.musteri_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teklif_tesis y WHERE y.firma_id = NEW.firma_id AND y.teklif_id = NEW.id) THEN
        RAISE EXCEPTION 'tesissiz teklif gönderilmez' USING ERRCODE = '23514';
      END IF;
      NEW.gonderildi := bugun;
    ELSIF OLD.durum = 'gonderildi' AND NEW.durum IN ('kabul', 'red') THEN
      IF OLD.gonderildi + OLD.gecerlilik < bugun THEN
        RAISE EXCEPTION 'süresi dolan teklif kabul ya da red edilmez (yenisi kopyalanır)' USING ERRCODE = '23514';
      END IF;
      NEW.sonuc := bugun;
    ELSE
      RAISE EXCEPTION 'teklif % durumundan % durumuna geçemez', OLD.durum, NEW.durum USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.gerekce IS DISTINCT FROM OLD.gerekce THEN
    RAISE EXCEPTION 'red gerekçesi yalnız reddedilirken yazılır' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION teklif_akis() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION teklif_akis() FROM PUBLIC;
CREATE OR REPLACE TRIGGER teklif_akis BEFORE INSERT OR UPDATE ON teklif FOR EACH ROW EXECUTE FUNCTION teklif_akis();

-- KALEM ve TESİS: yalnız taslak teklifte yazılır / silinir; başka teklife taşınmaz; tesis teklifin müşterisinin olmalı. İstisna: kayıtlı olmayan
-- müşterinin (aday) kabul edilmiş teklifi müşteriye bağlanırken İLK tesis eklenir
CREATE OR REPLACE FUNCTION teklif_parca_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE t record; r record;
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.teklif_id IS DISTINCT FROM OLD.teklif_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id) THEN
    RAISE EXCEPTION 'kalem / tesis başka teklife taşınmaz' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  SELECT x.durum, x.musteri_id, x.aday INTO t FROM teklif x WHERE x.firma_id = r.firma_id AND x.id = r.teklif_id FOR UPDATE;
  IF t IS NULL THEN RAISE EXCEPTION 'teklif yok' USING ERRCODE = '23503'; END IF;
  IF TG_TABLE_NAME = 'teklif_tesis' AND TG_OP <> 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM tesis s WHERE s.firma_id = r.firma_id AND s.id = r.tesis_id AND s.musteri_id = t.musteri_id) THEN
      RAISE EXCEPTION 'tesis teklifin müşterisinin olmalı' USING ERRCODE = '23514';
    END IF;
    IF t.durum = 'kabul' AND t.aday IS NOT NULL AND TG_OP = 'INSERT'
       AND NOT EXISTS (SELECT 1 FROM teklif_tesis y WHERE y.firma_id = r.firma_id AND y.teklif_id = r.teklif_id) THEN
      RETURN NEW;
    END IF;
  END IF;
  IF t.durum <> 'taslak' THEN
    RAISE EXCEPTION 'yalnız taslak teklifin kalemleri ve tesisleri değişir' USING ERRCODE = '23514';
  END IF;
  RETURN r;
END $$;
ALTER FUNCTION teklif_parca_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION teklif_parca_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER teklif_kalem_koru BEFORE INSERT OR UPDATE OR DELETE ON teklif_kalem FOR EACH ROW EXECUTE FUNCTION teklif_parca_koru();
CREATE OR REPLACE TRIGGER teklif_tesis_koru BEFORE INSERT OR UPDATE OR DELETE ON teklif_tesis FOR EACH ROW EXECUTE FUNCTION teklif_parca_koru();

GRANT SELECT, INSERT, UPDATE ON teklif TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE, DELETE ON teklif_kalem, teklif_tesis TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON fiyat_listesi TO probata_uygulama;
