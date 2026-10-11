-- ══ 0080 · FİRMANIN FORMAT PARÇALARI (496; hata listesi 29 + 46 maketi onaylı — reisim 2026-10-11: "maketi onaylıyorum … gelişmiş seçenekler tuşu
-- olsun"; maketteki "Parça olarak kaydet": firmanın kendi bölümü bütün formatlarında kullanılır) ══
-- Format kurucunun gelişmiş görünümünde bir bölüm "parça" olarak saklanır (bölümün tanımı JSON — src/format/tanim.ts Bolum; sunucu şemadan geçirir,
-- Bakanlık işaretini siler). Parça bir formata KOPYALANARAK eklenir (yeni kimliklerle) — formatlar parçaya bağlanmaz; parça silinince formatlar
-- değişmez. Firma yalnız kendi parçalarını görür (RLS). Değişmez (yeniden kaydedilir); kesin silme yalnız işlevle (silici.ts; kullanımı yok).
-- Kilit: tests/parca.test.ts; silme kapsamı tests/silme-kapsami.test.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS format_parca (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  ad          text NOT NULL CHECK (length(btrim(ad)) BETWEEN 1 AND 200),
  bolum       jsonb NOT NULL CHECK (jsonb_typeof(bolum) = 'object' AND length(bolum::text) <= 200000),
  olusturan   text NOT NULL CHECK (length(btrim(olusturan)) BETWEEN 1 AND 200),
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS format_parca_firma ON format_parca (firma_id, olustu);
ALTER TABLE format_parca ENABLE ROW LEVEL SECURITY;
ALTER TABLE format_parca FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'format_parca' AND policyname = 'format_parca_kiraci') THEN
    CREATE POLICY format_parca_kiraci ON format_parca USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

/* parça değişmez: ad ve tanım yazıldığı gibi kalır (yeniden kaydetmek yeni parçadır); silme yalnız format_parca_sil ile */
CREATE OR REPLACE FUNCTION format_parca_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'format parçası değişmez; yeniden kaydedin' USING ERRCODE = '23514';
END $$;
ALTER FUNCTION format_parca_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION format_parca_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER format_parca_koru BEFORE UPDATE ON format_parca FOR EACH ROW EXECUTE FUNCTION format_parca_koru();

REVOKE ALL ON format_parca FROM PUBLIC;
GRANT SELECT, INSERT ON format_parca TO probata_uygulama;

/* kesin silme (357 deseni): parça hiçbir yerde kullanılmaz (formatlara kopyalanır) — kullanım her zaman boş */
CREATE OR REPLACE FUNCTION format_parca_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id, '{}'::jsonb FROM format_parca p WHERE p.firma_id = gecerli_firma() AND p.id = ANY (p_idler)
$$;
ALTER FUNCTION format_parca_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION format_parca_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION format_parca_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION format_parca_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  r format_parca%ROWTYPE;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO r FROM format_parca WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  DELETE FROM format_parca WHERE firma_id = f AND id = p_id;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'format_parca.sil', 'format_parca', p_id::text, to_jsonb(r) - 'firma_id' - 'bolum', '{}'::jsonb);
  RETURN jsonb_build_object('durum', 'tamam', 'ad', r.ad);
END $$;
ALTER FUNCTION format_parca_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION format_parca_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION format_parca_sil(uuid, text) TO probata_uygulama;
