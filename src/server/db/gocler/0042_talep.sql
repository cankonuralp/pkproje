-- ══ 0042 · TALEPLER (330; modül 21; maket talepler.html, personel.html #/izinler; 2026-09-28 reisim: "personelin bireysel olarak isteyeceği
-- şeyler … denetçi izin talebi masraf formu ekleme ve ileride ekleyeceğimiz bir şey olursa buradan ekler"; izin onayı firma yöneticisinde,
-- Personel'de; KOD-GECIS §3 Talepler "izin_talebi, masraf (gider'e yazar)", §4 Talepler "kendi · … · firma yöneticisi değiştirir") ══
-- İzin talebi: no I-AAYY-SIRA (numara üreticisi; önek firma ayarı), personel (YALNIZ talep edenin kendisi — hesabının personeli), tür (yıllık,
-- mazeret, hastalık — sağlık raporu, ücretsiz), başlangıç–bitiş, iş günü (hafta sonu sayılmaz; resmî tatil takvimi sonra), açıklama, belge
-- (sağlık raporu vb.). Durum: bekliyor → onaylandı / reddedildi (gerekçe 5–200); karar veren ve zamanı veritabanında. Karar verilmiş talep
-- değişmez; onay bekleyeni yalnız talep eden geri çeker (silinir — henüz işlenmedi). Yıllık izin hakkı personel kaydında (gün; başlangıç 14).
-- Masraf formu muhasebenin gider kaydına yazılır (0040: kaynak "form", onay bekler). ⛔ Her göç IDEMPOTENT.

ALTER TABLE personel ADD COLUMN IF NOT EXISTS izin_hak integer NOT NULL DEFAULT 14;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'personel_izin_hak') THEN
    ALTER TABLE personel ADD CONSTRAINT personel_izin_hak CHECK (izin_hak BETWEEN 0 AND 60);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS izin_talebi (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no           text NOT NULL CHECK (no ~ '^[A-Z]{1,4}-[0-9]{4}-[0-9]{3,6}$'),
  personel_id  uuid NOT NULL,
  tur          text NOT NULL CHECK (tur IN ('yillik', 'mazeret', 'rapor', 'ucretsiz')),
  bas          date NOT NULL,
  bit          date NOT NULL,
  gun          integer NOT NULL CHECK (gun BETWEEN 0 AND 366),
  aciklama     text CHECK (aciklama IS NULL OR length(aciklama) <= 160),
  belge        uuid,
  durum        text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'onaylandi', 'red')),
  red          text CHECK (red IS NULL OR length(btrim(red)) BETWEEN 5 AND 200),
  karar        timestamptz,
  onaylayan    uuid,
  kaydeden     uuid,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, personel_id) REFERENCES personel (firma_id, id),
  FOREIGN KEY (firma_id, belge) REFERENCES dosya (firma_id, id),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id),
  CHECK (bit >= bas AND bit - bas <= 366),
  CHECK ((durum = 'red') = (red IS NOT NULL)),
  CHECK ((durum = 'bekliyor') = (karar IS NULL))
);
CREATE INDEX IF NOT EXISTS izin_talebi_personel ON izin_talebi (firma_id, personel_id, bas DESC);
CREATE INDEX IF NOT EXISTS izin_talebi_durum ON izin_talebi (firma_id, durum, olustu DESC);
ALTER TABLE izin_talebi ENABLE ROW LEVEL SECURITY;
ALTER TABLE izin_talebi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'izin_talebi' AND policyname = 'izin_talebi_kiraci') THEN
    CREATE POLICY izin_talebi_kiraci ON izin_talebi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION izin_talebi_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.durum = 'bekliyor' AND ben IS NOT NULL AND OLD.kaydeden = ben THEN RETURN OLD; END IF;
    RAISE EXCEPTION 'izin talebini yalnız talep eden, onay beklerken geri çeker' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'bekliyor' THEN RAISE EXCEPTION 'izin talebi onay bekler' USING ERRCODE = '23514'; END IF;
    IF NEW.personel_id IS DISTINCT FROM (SELECT h.personel_id FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.id = ben) THEN
      RAISE EXCEPTION 'izin talebi yalnız kendi adına gönderilir' USING ERRCODE = '23514';
    END IF;
    NEW.kaydeden := ben; NEW.onaylayan := NULL; NEW.karar := NULL; NEW.red := NULL;
    RETURN NEW;
  END IF;
  IF NEW.no IS DISTINCT FROM OLD.no OR NEW.personel_id IS DISTINCT FROM OLD.personel_id OR NEW.kaydeden IS DISTINCT FROM OLD.kaydeden
    OR NEW.olustu IS DISTINCT FROM OLD.olustu OR NEW.firma_id IS DISTINCT FROM OLD.firma_id THEN
    RAISE EXCEPTION 'izin talebinin numarası, sahibi ve kaydedeni değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum <> 'bekliyor' THEN RAISE EXCEPTION 'karar verilmiş izin talebi değişmez' USING ERRCODE = '23514'; END IF;
  IF NEW.tur IS DISTINCT FROM OLD.tur OR NEW.bas IS DISTINCT FROM OLD.bas OR NEW.bit IS DISTINCT FROM OLD.bit OR NEW.gun IS DISTINCT FROM OLD.gun
    OR NEW.aciklama IS DISTINCT FROM OLD.aciklama THEN
    RAISE EXCEPTION 'gönderilen izin talebinin içeriği değişmez (geri çekip yenisi gönderilir)' USING ERRCODE = '23514';
  END IF;
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF NEW.durum NOT IN ('onaylandi', 'red') THEN RAISE EXCEPTION 'izin talebi % durumuna geçemez', NEW.durum USING ERRCODE = '23514'; END IF;
    NEW.onaylayan := ben; NEW.karar := now();
  ELSIF NEW.onaylayan IS DISTINCT FROM OLD.onaylayan OR NEW.karar IS DISTINCT FROM OLD.karar OR NEW.red IS DISTINCT FROM OLD.red THEN
    RAISE EXCEPTION 'karar yalnız durum değişirken yazılır' USING ERRCODE = '23514';
  ELSIF NEW.belge IS DISTINCT FROM OLD.belge AND (ben IS NULL OR OLD.kaydeden IS DISTINCT FROM ben) THEN
    RAISE EXCEPTION 'talebin belgesini yalnız talep eden değiştirir' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION izin_talebi_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION izin_talebi_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER izin_talebi_koru BEFORE INSERT OR UPDATE OR DELETE ON izin_talebi FOR EACH ROW EXECUTE FUNCTION izin_talebi_koru();

GRANT SELECT, INSERT, UPDATE, DELETE ON izin_talebi TO probata_uygulama;
