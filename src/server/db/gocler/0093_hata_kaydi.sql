-- ══ 0093 · HATA KAYDI (567; 06-HATA-TAKIBI "yakalanmayan hata ve reddedilen söz küresel yakalanır", "aynı hata kısılır", "bağlamıyla yazılır",
-- "defter sınırlıdır ve yalnız yetkili okur"; 09 B11 "hata kaydı büyümesi sınırlıdır", G2 "log ve hata kaydında kişisel veri yok"; reisim 2026-10-15
-- analizi → "elindeki bütün işleri yap") ══
-- Tarayıcıda yakalanmayan hata / reddedilen söz ve ekranın hata sınırı (error.tsx) ile sunucunun yakaladığı istek hatası (instrumentation.ts
-- onRequestError) TEK deftere düşer. FİRMA VERİSİ DEĞİL: firma_id yok; bağlam olarak firmanın kısa adı (alt alan adı), oturumlu hesabın kimliği
-- (ad değil), sayfanın yolu (sorgu dizgisi yok), sürüm, cihaz. Mesaj ve yığın izi uygulamada maskelenir (src/server/hata/maske.ts: e-posta, uzun
-- sayı, jeton) — veritabanı uzunlukları kırpar.
--   · aynı hata (kaynak + mesaj + yer) 10 dakika içinde tek satır: sayı artar, son zaman güncellenir;
--   · sel: son 1 saatte 300 yeni satır (oturumsuz istekten 60) dolunca yeni satır yazılmaz — döngüde patlayan hata ya da kötü niyetli istek
--     defteri doldurmaz;
--   · budama yazarken: 30 günden eski düşer, en yeni 2000 kalır.
-- Uygulama rolü tabloya DOĞRUDAN erişemez (yalnız hata_yaz); okuyan yalnız yönetim rolü (probata ekibi; firmalar görmez). Kilit: tests/hata.test.ts;
-- olumsuz kanıt tests/bozan/hata.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS hata_kaydi (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  imza    text NOT NULL CHECK (length(imza) = 32),
  kaynak  text NOT NULL CHECK (kaynak IN ('istemci', 'sunucu')),
  mesaj   text NOT NULL CHECK (length(mesaj) BETWEEN 1 AND 300),
  yer     text CHECK (yer IS NULL OR length(yer) <= 200),
  yigin   text CHECK (yigin IS NULL OR length(yigin) <= 1200),
  adres   text CHECK (adres IS NULL OR length(adres) <= 200),
  alan    text CHECK (alan IS NULL OR alan ~ '^[a-z0-9-]{1,63}$'),
  hesap   uuid,
  surum   text CHECK (surum IS NULL OR length(surum) <= 40),
  cihaz   text CHECK (cihaz IS NULL OR length(cihaz) <= 160),
  sayi    integer NOT NULL DEFAULT 1 CHECK (sayi >= 1),
  ilk     timestamptz NOT NULL DEFAULT now(),
  son     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hata_kaydi_son ON hata_kaydi (son DESC);
CREATE INDEX IF NOT EXISTS hata_kaydi_ilk ON hata_kaydi (ilk DESC);
CREATE INDEX IF NOT EXISTS hata_kaydi_imza ON hata_kaydi (imza, son DESC);
ALTER TABLE hata_kaydi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON hata_kaydi FROM PUBLIC;
/* yönetim yalnız okur (0050 deseni: yönetim rolüne tablo hakkı + yalnız ona politika) */
GRANT SELECT ON hata_kaydi TO probata_yonetim;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hata_kaydi' AND policyname = 'hata_kaydi_yonetim') THEN
    CREATE POLICY hata_kaydi_yonetim ON hata_kaydi FOR SELECT TO probata_yonetim USING (true);
  END IF;
END $$;

/* hatayı yazar (ya da aynı hatanın sayısını artırır); yazıldıysa / sayıldıysa true, sel sınırında ya da geçersizse false. Uzunluklar burada da
   kırpılır; alan biçimsizse boş. */
CREATE OR REPLACE FUNCTION hata_yaz(p_kaynak text, p_mesaj text, p_yer text, p_yigin text, p_adres text, p_alan text, p_hesap uuid, p_surum text,
  p_cihaz text) RETURNS boolean
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_mesaj text := left(btrim(coalesce(p_mesaj, '')), 300);
  v_yer text := nullif(left(btrim(coalesce(p_yer, '')), 200), '');
  v_imza text;
  v_id bigint;
BEGIN
  IF p_kaynak IS NULL OR p_kaynak NOT IN ('istemci', 'sunucu') OR v_mesaj = '' THEN RETURN false; END IF;
  v_imza := md5(p_kaynak || '|' || left(v_mesaj, 160) || '|' || coalesce(left(v_yer, 160), ''));
  UPDATE hata_kaydi SET sayi = sayi + 1, son = now()
    WHERE id = (SELECT h.id FROM hata_kaydi h WHERE h.imza = v_imza AND h.son > now() - interval '10 minutes' ORDER BY h.son DESC LIMIT 1)
    RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN RETURN true; END IF;
  IF (SELECT count(*) FROM hata_kaydi h WHERE h.ilk > now() - interval '1 hour') >= 300 THEN RETURN false; END IF;
  IF p_hesap IS NULL AND (SELECT count(*) FROM hata_kaydi h WHERE h.hesap IS NULL AND h.ilk > now() - interval '1 hour') >= 60 THEN RETURN false; END IF;
  INSERT INTO hata_kaydi (imza, kaynak, mesaj, yer, yigin, adres, alan, hesap, surum, cihaz)
  VALUES (v_imza, p_kaynak, v_mesaj, v_yer, nullif(left(coalesce(p_yigin, ''), 1200), ''), nullif(left(coalesce(p_adres, ''), 200), ''),
    CASE WHEN p_alan ~ '^[a-z0-9-]{1,63}$' THEN p_alan END, p_hesap, nullif(left(coalesce(p_surum, ''), 40), ''), nullif(left(coalesce(p_cihaz, ''), 160), ''));
  DELETE FROM hata_kaydi h WHERE h.son < now() - interval '30 days';
  DELETE FROM hata_kaydi h WHERE h.id IN (SELECT x.id FROM hata_kaydi x ORDER BY x.son DESC, x.id DESC OFFSET 2000);
  RETURN true;
END $$;
ALTER FUNCTION hata_yaz(text, text, text, text, text, text, uuid, text, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION hata_yaz(text, text, text, text, text, text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hata_yaz(text, text, text, text, text, text, uuid, text, text) TO probata_uygulama;
