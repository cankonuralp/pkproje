-- ══ 0075 · YÖNETİM: İKİ ADIMLI GİRİŞ AÇ / KAPA (393; 348 / 0050'nin devamı) ══
-- Reisim 2026-10-08: "2 aşamalı doğrulama için Google Authenticator kullanıyorum ama sürekli hata veriyor … yönetim paneline giremiyorum ikii
-- aşamalı doğrulamayı şimdilik kaldır, belirlediğin mail şifre ile direk girebileyim". Ayar tek satır (yonetim_ayar.iki_adim), başlangıçta
-- KAPALI: yönetici e-posta + parolayla girer (geçici parolalı "ilk" yönetici de). yonetim_kim (0050: yalnız "etkin" yönetici) aynı ayara bakar —
-- kapalıyken "ilk" yönetici de yönetim işlemi yapar; açılınca eskisi gibi yalnız "etkin" (anahtarı kurulmuş). Ayar satırı yoksa AÇIK sayılır.
-- Ayarı uygulama değiştiremez (yalnız okur — yönetim rolü); açmak / kapamak göçle ya da veritabanı sahibinin elle yazmasıyla.
-- Kilit: tests/yonetim.test.ts; olumsuz kanıt tests/bozan/yonetim.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS yonetim_ayar (
  tek       boolean PRIMARY KEY DEFAULT true CHECK (tek),
  iki_adim  boolean NOT NULL DEFAULT false
);
INSERT INTO yonetim_ayar (tek, iki_adim) VALUES (true, false) ON CONFLICT (tek) DO NOTHING;
REVOKE ALL ON yonetim_ayar FROM PUBLIC;
GRANT SELECT ON yonetim_ayar TO probata_yonetim;

-- işlemin yöneticisi: bağlamda yoksa (yönetim işlemi değil) reddedilir; kapalı yönetici de reddedilir; iki adım AÇIKKEN yalnız "etkin" (0050 gibi)
CREATE OR REPLACE FUNCTION yonetim_kim() RETURNS text
  LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v text;
BEGIN
  SELECT eposta INTO v FROM yonetici WHERE id = NULLIF(current_setting('app.yonetici_id', true), '')::uuid
    AND (durum = 'etkin' OR (durum = 'ilk' AND NOT coalesce((SELECT a.iki_adim FROM yonetim_ayar a WHERE a.tek), true)));
  IF v IS NULL THEN RAISE EXCEPTION 'yönetim işlemi değil' USING ERRCODE = '42501'; END IF;
  RETURN v;
END $$;
ALTER FUNCTION yonetim_kim() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yonetim_kim() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yonetim_kim() TO probata_yonetim;
