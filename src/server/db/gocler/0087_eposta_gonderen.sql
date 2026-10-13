-- ══ 0087 · E-POSTAYI GÖNDEREN KİŞİ (536; pkproje §11 533–535 — reisim 2026-10-13: "kim mail gönder tuşuna basarsa onun mailinden gitmeli" →
-- "A seçeneğini kabul ediyorum" (her firma kendi Resend hesabı) → maket Firma ayarları › E-posta "onaylıyorum") ══
-- Kuyruğa yazılırken tuşa basan kişinin adı ve e-postası (o anki hâli) satıra yazılır; ikisi de boşsa otomatik e-posta. Gönderilirken Kimden bundan
-- ve firmanın E-posta ayarından kurulur (src/server/eposta/kimden.ts). Gönderen de metin gibi yazıldığı gibi kalır (tetik). Kilit: tests/planlar.test.ts
-- "432" / "536". ⛔ Her göç IDEMPOTENT.

ALTER TABLE eposta ADD COLUMN IF NOT EXISTS gonderen_ad text;
ALTER TABLE eposta ADD COLUMN IF NOT EXISTS gonderen_eposta text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eposta_gonderen_bicim') THEN
    ALTER TABLE eposta ADD CONSTRAINT eposta_gonderen_bicim CHECK (
      (gonderen_ad IS NULL) = (gonderen_eposta IS NULL)
      AND (gonderen_ad IS NULL OR length(btrim(gonderen_ad)) BETWEEN 1 AND 120)
      AND (gonderen_eposta IS NULL OR (gonderen_eposta = lower(gonderen_eposta) AND length(gonderen_eposta) BETWEEN 3 AND 254 AND position('@' in gonderen_eposta) > 1)));
  END IF;
END $$;

/* gönderilen metin ve GÖNDEREN değişmez: alıcı, konu, gövde, kaynak, gönderen yazıldığı gibi kalır; gönderilmiş e-posta yeniden "bekliyor" olmaz */
CREATE OR REPLACE FUNCTION eposta_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'e-posta kaydı silinmez' USING ERRCODE = '23514'; END IF;
  IF NEW.kime IS DISTINCT FROM OLD.kime OR NEW.konu IS DISTINCT FROM OLD.konu OR NEW.govde IS DISTINCT FROM OLD.govde
     OR NEW.kaynak IS DISTINCT FROM OLD.kaynak OR NEW.kaynak_id IS DISTINCT FROM OLD.kaynak_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id
     OR NEW.gonderen_ad IS DISTINCT FROM OLD.gonderen_ad OR NEW.gonderen_eposta IS DISTINCT FROM OLD.gonderen_eposta THEN
    RAISE EXCEPTION 'gönderilecek e-postanın metni ve göndereni değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum = 'gonderildi' AND NEW.durum <> 'gonderildi' THEN RAISE EXCEPTION 'gönderilmiş e-posta geri alınmaz' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION eposta_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION eposta_koru() FROM PUBLIC;
