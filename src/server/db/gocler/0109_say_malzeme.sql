-- ══ 0109 · S.A.Y MALZEMESİ (2026-10-31, kalem 2 — sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; karar: dosya adı ve çekim saati
--    yapay zekâya gider, 522'deki "ad gitmez" değişti) ══
-- · yz_ek.cekim: fotoğrafın çekim saati (EXIF DateTimeOriginal, konum silinmeden önce okunur) — "YYYY-AA-GG SS:DD", saat dilimsiz (fotoğrafın kendi saati).
-- · yz_ek.sira: kişinin eklerinin kalıcı sırası — malzeme numarası (M01 …, fotoğrafta F01 …) bundan; "Sohbeti temizle" ile ekler silinince yeniden başlar.
-- Ekin kopyası firmanın deposunda (dosya modülü "say_ek", kayıt = yz_ek kimliği; yalnız eki ekleyen açar — src/server/dosya/erisim.ts); temizlenince çöpe.
-- Kilit: tests/say-malzeme.test.ts. ⛔ Her göç IDEMPOTENT.

ALTER TABLE yz_ek ADD COLUMN IF NOT EXISTS cekim text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'yz_ek_cekim_bicim') THEN
    ALTER TABLE yz_ek ADD CONSTRAINT yz_ek_cekim_bicim CHECK (cekim IS NULL OR cekim ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'yz_ek' AND column_name = 'sira') THEN
    ALTER TABLE yz_ek ADD COLUMN sira bigint GENERATED ALWAYS AS IDENTITY;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS yz_ek_sira ON yz_ek (firma_id, hesap_id, sira);
