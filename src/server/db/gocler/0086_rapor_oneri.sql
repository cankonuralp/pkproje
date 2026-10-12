-- ══ 0086 · RAPORDA BEKLEYEN ÖNERİLER (525; pkproje §3.10 m.7 ve m.12 — reisim 2026-10-13: "onayılıyorum, yap bitir") ══
-- S.A.Y Chat kaydından rapor yazılırken yapay zekâ okunacak fotoğrafları okur; değerler raporun o bölümüne ÖNERİ olarak düşer, denetçi onaylar (m.7).
-- Öneri rapora YAZILMAZ: burada bekler, rapor ekranı açılınca bölümün öneri kartında görünür; "Uygula" / "Vazgeç" deyince silinir (değer yine
-- Kaydet'le rapora geçer). tur: alan (bilgi / test alanları — okunan [{ alan, deger, guven }]), tablo (ölçüm tablosu — okunan satırlar), bilgi
-- (raporun üstündeki "S.A.Y Chat kaydından oluşturuldu" şeridi; bolum ''). Kişiye özel: raporu yazan görür (RLS firma + hesap; sahip işlemden).
-- Rapor silinirse öneriler de gider (ON DELETE CASCADE). Kilit: tests/say-chat-rapor.test.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS rapor_oneri (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  rapor_id  uuid NOT NULL,
  bolum     text NOT NULL CHECK (bolum ~ '^[A-Za-z0-9_-]{0,60}$'),
  tur       text NOT NULL CHECK (tur IN ('alan', 'tablo', 'bilgi')),
  okunan    jsonb NOT NULL CHECK (jsonb_typeof(okunan) IN ('array', 'object') AND length(okunan::text) <= 60000),
  -- güvenli yazıcının döndürdüğü sürüm (öneri değişmez; hep 0)
  surum     integer NOT NULL DEFAULT 0,
  olustu    timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (firma_id, rapor_id) REFERENCES rapor (firma_id, id) ON DELETE CASCADE,
  UNIQUE (firma_id, id)
);
CREATE INDEX IF NOT EXISTS rapor_oneri_rapor ON rapor_oneri (firma_id, rapor_id, olustu);
ALTER TABLE rapor_oneri ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_oneri FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rapor_oneri' AND policyname = 'rapor_oneri_kendi') THEN
    CREATE POLICY rapor_oneri_kendi ON rapor_oneri
      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)
      WITH CHECK (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid);
  END IF;
END $$;

/* sahibi işlemin bağlamından; öneri değişmez (yeni okuma yeni satırdır) */
CREATE OR REPLACE FUNCTION rapor_oneri_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'öneri değişmez' USING ERRCODE = '23514'; END IF;
  IF ben IS NULL THEN RAISE EXCEPTION 'öneriyi oturumdaki kişi yazar' USING ERRCODE = '23514'; END IF;
  NEW.hesap_id := ben;
  RETURN NEW;
END $$;
ALTER FUNCTION rapor_oneri_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_oneri_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER rapor_oneri_koru BEFORE INSERT OR UPDATE ON rapor_oneri FOR EACH ROW EXECUTE FUNCTION rapor_oneri_koru();

REVOKE ALL ON rapor_oneri FROM PUBLIC;
GRANT SELECT, INSERT, DELETE ON rapor_oneri TO probata_uygulama;
