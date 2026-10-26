-- ══ 0107 · ELLE EKLENEN STANDARTLAR (2026-10-26; reisim: "standartları belirlerken el ile ekle olmalı", "bu ekranda sadece dökümanlarda ekli olan
--    standartlar gözüküyor burada el ile ekleme olmalı", "PDF'ten şablon kurulunca formatta yazan standartlar da türe kendiliğinden eklenecek eğer
--    standartlar kütüphanede yok ise el ile ekleme yöntemi ile eklenecek otomatik olarak") ══
-- Firmanın, PDF'i henüz kütüphanede (standart — 0018) olmayan standartları: numara, ad (konu), branş. Bakanlık listesindeki hazır standartlar gibi
-- davranır: ekipman türünün kontrol metoduna seçilir, Dökümanlar › Standartlar'da "Yüklenmedi" satırı olur (PDF'i yüklenince kütüphanedeki güncel
-- sürüm geçerli). Numara firmada eşsiz. Satır değişmez; silme yalnız standart_tanim_sil ile (kullanan tür yoksa — 357 deseni).
-- Kilit: tests/standart-tanim.test.ts (gerçek PostgreSQL, iki firma); silme kapsamı tests/silme-kapsami.test.ts.
-- ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS standart_tanim (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id    uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  no          text NOT NULL CHECK (length(no) BETWEEN 3 AND 40),
  konu        text NOT NULL CHECK (length(konu) BETWEEN 2 AND 120),
  brans       text NOT NULL CHECK (brans IN ('m', 'e')),
  ekleyen     text NOT NULL CHECK (length(ekleyen) BETWEEN 1 AND 200),
  surum       integer NOT NULL DEFAULT 0,
  olustu      timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, no),
  UNIQUE (firma_id, id)
);
ALTER TABLE standart_tanim ENABLE ROW LEVEL SECURITY;
ALTER TABLE standart_tanim FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'standart_tanim' AND policyname = 'standart_tanim_kiraci') THEN
    CREATE POLICY standart_tanim_kiraci ON standart_tanim USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;

/* satır değişmez (yanlış eklenen silinip yeniden eklenir) */
CREATE OR REPLACE FUNCTION standart_tanim_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'elle eklenen standart değişmez' USING ERRCODE = '23514';
END $$;
ALTER FUNCTION standart_tanim_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION standart_tanim_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER standart_tanim_koru BEFORE UPDATE ON standart_tanim FOR EACH ROW EXECUTE FUNCTION standart_tanim_koru();

REVOKE ALL ON standart_tanim FROM PUBLIC;
GRANT SELECT, INSERT ON standart_tanim TO probata_uygulama;

/* kesin silme (357 deseni): kullanım = numarayı kontrol metodu olarak seçen ekipman türleri */
CREATE OR REPLACE FUNCTION standart_tanim_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT s.id, CASE WHEN n = 0 THEN '{}'::jsonb ELSE jsonb_build_object('ekipman_turu', n) END
  FROM standart_tanim s
  CROSS JOIN LATERAL (SELECT count(*)::int AS n FROM ekipman_turu t WHERE t.firma_id = s.firma_id AND s.no = ANY (t.kontrol_std)) k
  WHERE s.firma_id = gecerli_firma() AND s.id = ANY (p_idler)
$$;
ALTER FUNCTION standart_tanim_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION standart_tanim_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION standart_tanim_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION standart_tanim_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  r standart_tanim%ROWTYPE;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO r FROM standart_tanim WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  /* türlerin satırı paylaşımlı kilitlenir — aynı anda bağlantı kaydıyla sıraya girer */
  PERFORM 1 FROM ekipman_turu WHERE firma_id = f AND r.no = ANY (kontrol_std) FOR SHARE;
  IF FOUND THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim',
      jsonb_build_object('ekipman_turu', (SELECT count(*) FROM ekipman_turu WHERE firma_id = f AND r.no = ANY (kontrol_std))));
  END IF;
  DELETE FROM standart_tanim WHERE firma_id = f AND id = p_id;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'standart_tanim.sil', 'standart_tanim', p_id::text, to_jsonb(r) - 'firma_id', '{}'::jsonb);
  RETURN jsonb_build_object('durum', 'tamam', 'ad', r.no);
END $$;
ALTER FUNCTION standart_tanim_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION standart_tanim_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION standart_tanim_sil(uuid, text) TO probata_uygulama;
