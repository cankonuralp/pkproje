-- ══ 0047 · TOPLU İÇE AKTARMA (ilk kurulum) — Firma ayarları (337; maket firma-ayarlari "Toplu içe aktarma (ilk kurulum)", iceCiz / ia-aktar /
-- ia-geri; pkproje §11 245; KOD-GECIS Y2) ══
-- Firma ilk kurulumda müşteri + tesis, ekipman, ölçüm cihazı, personel ve aracı Excel'den yükler. Her içe aktarma bir KAYIT: tür, dosya adı,
-- eklenen satır ve atlanan satır sayısı, oluşturulan kayıtların listesi (tür + kimlik), kim, ne zaman. Liste YALNIZ aynı işlemde oluşturulmuş
-- kayıtları taşıyabilir (tetik: her kayıt bu firmada ve olustu = işlemin zamanı) — kayıt sahte bir listeyle başka verinin silinmesine yol açamaz.
-- GERİ AL: yalnız SON içe aktarma, bir kez; kayıtlar henüz kullanılmadıysa (plan, rapor, zimmet, hesap, kilometre, teklif, sözleşme, dosya …)
-- silinir. Kullanılmışsa hiçbiri silinmez ("kullanildi"). Uygulama rolünün bu tablolarda silme hakkı YOK: geri alma tanımlayıcı-yetkili işlevle,
-- yalnız kendi firmasında (RLS + açık firma süzgeci), oturumdaki hesapla. Ölçüm cihazına "sistem öncesi kalibrasyon bitişi" sütunu (ekipmandaki
-- sistem öncesi son kontrol gibi): içe aktarılan cihazın geçerli bitişi, kalibrasyon kaydı açılana kadar buradan. ⛔ Her göç IDEMPOTENT.

ALTER TABLE olcum_cihazi ADD COLUMN IF NOT EXISTS ilk_bitis date;

CREATE TABLE IF NOT EXISTS ice_aktarim (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tur         text NOT NULL CHECK (tur IN ('musteri', 'ekipman', 'cihaz', 'personel', 'arac')),
  dosya       text NOT NULL CHECK (length(btrim(dosya)) BETWEEN 1 AND 200),
  adet        integer NOT NULL CHECK (adet BETWEEN 1 AND 2000),
  atlanan     integer NOT NULL DEFAULT 0 CHECK (atlanan BETWEEN 0 AND 5000),
  kayitlar    jsonb NOT NULL CHECK (jsonb_typeof(kayitlar) = 'array' AND jsonb_array_length(kayitlar) BETWEEN 1 AND 4000),
  kim         text NOT NULL CHECK (length(kim) BETWEEN 1 AND 200),
  hesap_id    uuid,
  zaman       timestamptz NOT NULL DEFAULT now(),
  geri        timestamptz,
  geri_kim    text CHECK (geri_kim IS NULL OR length(geri_kim) BETWEEN 1 AND 200),
  geri_hesap  uuid,
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, id),
  CHECK ((geri IS NULL) = (geri_kim IS NULL))
);
CREATE INDEX IF NOT EXISTS ice_aktarim_zaman ON ice_aktarim (firma_id, zaman DESC);
ALTER TABLE ice_aktarim ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_aktarim FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ice_aktarim' AND policyname = 'ice_aktarim_kiraci') THEN
    CREATE POLICY ice_aktarim_kiraci ON ice_aktarim USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- eklerken: hesap ve zaman veritabanından; geri alınmış olarak eklenemez; listedeki her kayıt bu firmada ve BU işlemde oluşturulmuş
CREATE OR REPLACE FUNCTION ice_aktarim_ekle() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid; x jsonb; t text; i uuid; var boolean;
BEGIN
  IF ben IS NULL THEN RAISE EXCEPTION 'içe aktarmayı oturumdaki kişi yapar' USING ERRCODE = '23514'; END IF;
  NEW.hesap_id := ben; NEW.zaman := now(); NEW.geri := NULL; NEW.geri_kim := NULL; NEW.geri_hesap := NULL;
  FOR x IN SELECT * FROM jsonb_array_elements(NEW.kayitlar) LOOP
    t := x->>'t';
    IF jsonb_typeof(x) <> 'object' OR (x->>'id') IS NULL OR (x->>'id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'içe aktarma kaydı geçersiz' USING ERRCODE = '23514';
    END IF;
    i := (x->>'id')::uuid;
    IF NOT (t = NEW.tur OR (NEW.tur = 'musteri' AND t = 'tesis')) THEN RAISE EXCEPTION 'içe aktarma kaydının türü uymuyor' USING ERRCODE = '23514'; END IF;
    var := CASE t
      WHEN 'musteri'  THEN EXISTS (SELECT 1 FROM musteri      WHERE firma_id = NEW.firma_id AND id = i AND olustu = now())
      WHEN 'tesis'    THEN EXISTS (SELECT 1 FROM tesis        WHERE firma_id = NEW.firma_id AND id = i AND olustu = now())
      WHEN 'ekipman'  THEN EXISTS (SELECT 1 FROM ekipman      WHERE firma_id = NEW.firma_id AND id = i AND olustu = now())
      WHEN 'cihaz'    THEN EXISTS (SELECT 1 FROM olcum_cihazi WHERE firma_id = NEW.firma_id AND id = i AND olustu = now())
      WHEN 'personel' THEN EXISTS (SELECT 1 FROM personel     WHERE firma_id = NEW.firma_id AND id = i AND olustu = now())
      WHEN 'arac'     THEN EXISTS (SELECT 1 FROM arac         WHERE firma_id = NEW.firma_id AND id = i AND olustu = now())
      ELSE false END;
    IF NOT var THEN RAISE EXCEPTION 'içe aktarma kaydı bu işlemde oluşturulmuş bir kayıt değil' USING ERRCODE = '23514'; END IF;
  END LOOP;
  RETURN NEW;
END $$;
ALTER FUNCTION ice_aktarim_ekle() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ice_aktarim_ekle() FROM PUBLIC;
CREATE OR REPLACE TRIGGER ice_aktarim_ekle BEFORE INSERT ON ice_aktarim FOR EACH ROW EXECUTE FUNCTION ice_aktarim_ekle();

-- GERİ AL (yalnız son içe aktarma, bir kez; kayıtlar kullanılmadıysa). p_dene: yalnız dener (silmez) — "geri alınabilir mi" sorusu.
-- Dönüş: tamam · olur (deneme) · yok · geri (zaten geri alındı) · son_degil · kullanildi
CREATE OR REPLACE FUNCTION ice_aktarim_geri_al(p_id uuid, p_kim text, p_dene boolean) RETURNS text
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  a record; son uuid;
  m uuid[]; t uuid[]; e uuid[]; c uuid[]; p uuid[]; ar uuid[]; tum uuid[];
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'içe aktarmayı oturumdaki kişi geri alır' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'geri alan kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT id, kayitlar, geri INTO a FROM ice_aktarim WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN 'yok'; END IF;
  IF a.geri IS NOT NULL THEN RETURN 'geri'; END IF;
  SELECT id INTO son FROM ice_aktarim WHERE firma_id = f ORDER BY zaman DESC, olustu DESC, id DESC LIMIT 1;
  IF son IS DISTINCT FROM p_id THEN RETURN 'son_degil'; END IF;
  SELECT coalesce(array_agg((x->>'id')::uuid) FILTER (WHERE x->>'t' = 'musteri'), '{}'),
         coalesce(array_agg((x->>'id')::uuid) FILTER (WHERE x->>'t' = 'tesis'), '{}'),
         coalesce(array_agg((x->>'id')::uuid) FILTER (WHERE x->>'t' = 'ekipman'), '{}'),
         coalesce(array_agg((x->>'id')::uuid) FILTER (WHERE x->>'t' = 'cihaz'), '{}'),
         coalesce(array_agg((x->>'id')::uuid) FILTER (WHERE x->>'t' = 'personel'), '{}'),
         coalesce(array_agg((x->>'id')::uuid) FILTER (WHERE x->>'t' = 'arac'), '{}')
    INTO m, t, e, c, p, ar FROM jsonb_array_elements(a.kayitlar) x;
  tum := m || t || e || c || p || ar;
  -- yabancı anahtarı olmayan bağlar: kayda bağlı (çöpte olmayan) dosya, raporun cihaz listesi, müşteri girişinin tesis kapsamı
  IF EXISTS (SELECT 1 FROM dosya WHERE firma_id = f AND kayit_id = ANY (tum) AND cop IS NULL)
     OR (cardinality(c) > 0 AND EXISTS (SELECT 1 FROM rapor r, unnest(c) k WHERE r.firma_id = f AND position(k::text IN r.cihazlar::text) > 0))
     OR (cardinality(t) > 0 AND EXISTS (SELECT 1 FROM musteri_hesap h WHERE h.firma_id = f AND h.tesisler && t)) THEN
    RETURN 'kullanildi';
  END IF;
  BEGIN
    DELETE FROM ekipman_kodu WHERE firma_id = f AND ekipman_id = ANY (e);
    DELETE FROM ekipman WHERE firma_id = f AND id = ANY (e);
    DELETE FROM tesis WHERE firma_id = f AND id = ANY (t);
    DELETE FROM musteri WHERE firma_id = f AND id = ANY (m);
    DELETE FROM olcum_cihazi WHERE firma_id = f AND id = ANY (c);
    DELETE FROM personel WHERE firma_id = f AND id = ANY (p);
    DELETE FROM arac WHERE firma_id = f AND id = ANY (ar);
    IF p_dene THEN RAISE EXCEPTION 'deneme' USING ERRCODE = 'PA001'; END IF;
  EXCEPTION
    WHEN foreign_key_violation THEN RETURN 'kullanildi';
    WHEN SQLSTATE 'PA001' THEN RETURN 'olur';
  END;
  UPDATE ice_aktarim SET geri = now(), geri_kim = p_kim, geri_hesap = ben, surum = surum + 1, degisti = now() WHERE id = p_id AND firma_id = f;
  RETURN 'tamam';
END $$;
ALTER FUNCTION ice_aktarim_geri_al(uuid, text, boolean) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ice_aktarim_geri_al(uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ice_aktarim_geri_al(uuid, text, boolean) TO probata_uygulama;

GRANT SELECT, INSERT ON ice_aktarim TO probata_uygulama;
