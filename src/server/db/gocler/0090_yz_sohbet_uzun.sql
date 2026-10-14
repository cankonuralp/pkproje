-- ══ 0090 · S.A.Y UZUN SORU VE CEVAP (550; sunum 546 K6 — reisim 2026-10-14: "yapay zeka asistanı S.A.Y. de herhangi bir kısıt kural vb olmasını
-- istemiyorum oradan direk haiku ile konuşmak aynı claud kullanır gibi"; karar: "diğer önerilerini kabul ediyorum") ══
-- S.A.Y'ın kuralları kalktı: soru 20 000, cevap 60 000 karaktere kadar (src/server/yz/say.ts SORU_SINIRI / CEVAP_SINIRI). İletinin uzunluk sınırı
-- 6 000'den 100 000'e çıkar (pay bırakılır); boş ileti yine yazılmaz. ⛔ Her göç IDEMPOTENT.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'yz_sohbet'::regclass AND conname = 'yz_sohbet_metin_check') THEN
    ALTER TABLE yz_sohbet DROP CONSTRAINT yz_sohbet_metin_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'yz_sohbet'::regclass AND conname = 'yz_sohbet_metin_uzunluk') THEN
    ALTER TABLE yz_sohbet ADD CONSTRAINT yz_sohbet_metin_uzunluk CHECK (length(metin) BETWEEN 1 AND 100000);
  END IF;
END $$;
