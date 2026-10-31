-- ══ 0111 · S.A.Y FOTOĞRAF ÖN OKUMA VE SANİYELİ ÇEKİM SAATİ (2026-10-31; reisim: "Fotoğraf ön okuma: her fotoğraf bir kez, paralel ve küçük bir çağrıyla
--    okunur, sonuç saklanır. Ana konuşmaya metin ve pafta girer"; "Önce say, sonra aç: fotoğraflar çekim saatine göre sıralanır"; sunum L4) ══
-- · yz_ek.cekim saniyeli de olabilir ("YYYY-AA-GG SS:DD:SS" — dosya adından okunan WhatsApp / telefon adı; aynı dakikada çekilenler sıralansın).
-- · yz_ek_okuma: fotoğraf ekinin ön okuması (sınıf, okunan yazı, kısa tarif) — ek başına bir kez; yalnız EKLENİR. Ek silinince ("Sohbeti temizle")
--   birlikte silinir. Yalnız eki ekleyen kişi görür (yz_ek gibi).
-- Kilit: tests/say-on-okuma.test.ts. ⛔ Her göç IDEMPOTENT.

ALTER TABLE yz_ek DROP CONSTRAINT IF EXISTS yz_ek_cekim_bicim;
ALTER TABLE yz_ek ADD CONSTRAINT yz_ek_cekim_bicim CHECK (cekim IS NULL OR cekim ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$');

CREATE TABLE IF NOT EXISTS yz_ek_okuma (
  ek_id     uuid PRIMARY KEY REFERENCES yz_ek(id) ON DELETE CASCADE,
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  sinif     text NOT NULL CHECK (sinif IN ('E', 'T', 'L', 'Y', 'S', 'K', 'D')),
  yazi      text NOT NULL DEFAULT '' CHECK (length(yazi) <= 400),
  tarif     text NOT NULL DEFAULT '' CHECK (length(tarif) <= 160),
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS yz_ek_okuma_kisi ON yz_ek_okuma (firma_id, hesap_id);
CREATE INDEX IF NOT EXISTS yz_ek_okuma_hesap ON yz_ek_okuma (hesap_id);
ALTER TABLE yz_ek_okuma ENABLE ROW LEVEL SECURITY;
ALTER TABLE yz_ek_okuma FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yz_ek_okuma' AND policyname = 'yz_ek_okuma_kendi') THEN
    CREATE POLICY yz_ek_okuma_kendi ON yz_ek_okuma
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
END $$;
/* sahibi işlemin bağlamından; satır değişmez (0103'ün koruması — yz_konusma_is dışındaki tabloda UPDATE reddedilir) */
CREATE OR REPLACE TRIGGER yz_ek_okuma_koru BEFORE INSERT OR UPDATE ON yz_ek_okuma FOR EACH ROW EXECUTE FUNCTION yz_konusma_koru();
REVOKE ALL ON yz_ek_okuma FROM PUBLIC;
GRANT SELECT, INSERT, DELETE ON yz_ek_okuma TO probata_uygulama;
