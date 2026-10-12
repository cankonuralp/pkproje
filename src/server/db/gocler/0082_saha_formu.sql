-- ══ 0082 · SAHA FORMU (2026-10-12; reisim: "görselde saha takip formu üretme işi yok ? neden ? geri gelsin." — maket planlarim.html 2026-09-26
-- "plan tamamlandıktan sonra saha formu oluştur tuşu gelsin bu tuşa istenildiği kadar basılsın … yapılan ekipmanlar ve yapıldığına dair firma
-- onayı için imza yerleri", 197 "İmzalı saha formunu yükle"; KOD-GECIS §3 saha_formu) ══
-- Tamamlanan planda istendiği kadar saha formu: numara planın numarası + "-SF" + sıra (P-…-SF1, SF2 …; plan içinde kesintisiz, yeniden verilmez).
-- Formun içeriği (yapılan ekipmanlar, ekip) belge basılırken plandan okunur; müşterinin ıslak imzalı + kaşeli kâğıdının TARAMASI yüklenir, değiştirilir,
-- kaldırılır (yalnız tarama değişir — numara, sıra, plan DEĞİŞMEZ: uygulama rolünde UPDATE yalnız tarama sütununda). Silinmez (müşteriye verilmiş
-- belge). Plan kesin silinirken saha formu KULLANIM sayılır (plan_kullanim). ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS saha_formu (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  plan_id    uuid NOT NULL,
  sira       integer NOT NULL CHECK (sira BETWEEN 1 AND 999),
  no         text NOT NULL CHECK (length(no) BETWEEN 3 AND 40),
  olusturan  text NOT NULL CHECK (length(olusturan) BETWEEN 1 AND 200),
  tarama     uuid,
  surum      integer NOT NULL DEFAULT 0,
  olustu     timestamptz NOT NULL DEFAULT now(),
  degisti    timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, plan_id) REFERENCES plan (firma_id, id),
  UNIQUE (firma_id, plan_id, sira),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS saha_formu_plan ON saha_formu (firma_id, plan_id);

ALTER TABLE saha_formu ENABLE ROW LEVEL SECURITY;
ALTER TABLE saha_formu FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saha_formu' AND policyname = 'saha_formu_kiraci') THEN
    CREATE POLICY saha_formu_kiraci ON saha_formu USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- uygulama rolü: okur, ekler; yalnız taramayı (ve yazıcının sürüm / zaman damgasını) değiştirir; silemez
REVOKE ALL ON saha_formu FROM PUBLIC, probata_uygulama;
GRANT SELECT, INSERT ON saha_formu TO probata_uygulama;
GRANT UPDATE (tarama, surum, degisti) ON saha_formu TO probata_uygulama;

-- planın kullanımı: saha formu da sayılır (0067'ye ek; silinecek planda saha formu varsa plan kullanılmıştır)
CREATE OR REPLACE FUNCTION plan_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id, jsonb_strip_nulls(jsonb_build_object(
    'rapor', NULLIF((SELECT count(*) FROM rapor x WHERE x.firma_id = p.firma_id AND x.plan_id = p.id), 0),
    'tamamlandi', CASE WHEN p.durum = 'tamamlandi' THEN 1 END,
    'fatura', NULLIF((SELECT count(*) FROM fatura_rapor x WHERE x.firma_id = p.firma_id AND x.plan_id = p.id), 0),
    'gider', NULLIF((SELECT count(*) FROM gider x WHERE x.firma_id = p.firma_id AND x.plan_id = p.id), 0),
    'saha_formu', NULLIF((SELECT count(*) FROM saha_formu x WHERE x.firma_id = p.firma_id AND x.plan_id = p.id), 0)))
  FROM plan p
  WHERE p.firma_id = gecerli_firma() AND p.id = ANY (p_idler)
$$;
ALTER FUNCTION plan_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION plan_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION plan_kullanim(uuid[]) TO probata_uygulama;
