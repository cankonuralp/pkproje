-- ══ 0076 · ÇEVRİMDIŞI İŞLEM: TEK SEFERLİK (392; 09-D2 "işlem kimliği sunucuda benzersiz; aynı kimlik ikinci kez işlenmez", ARKA-UC §4.3 çıkış
-- kuyruğu, KOD-GECIS K3 "çevrimdışı kuyruk ölçüldü", maket Z4) ══
-- Cihaz bağlantısızken yaptığı işi (rapor Kaydet, Onaya gönder …) kimliğiyle kuyruğa yazar; bağlantı gelince /api/islem'e gönderir. Sunucu işlemi
-- ve sonucunu AYNI veritabanı işleminde yazar: aynı kimlik yeniden gelirse (yanıt yolda kayboldu, cihaz yeniden denedi) iş tekrar yapılmaz, saklanan
-- sonuç döner. Sonuç ne olursa olsun saklanır ("başka yerde değiştirildi" dahil) — kullanıcı yeniden göndermeyi seçerse cihaz YENİ kimlik üretir.
-- Kişi yalnız kendi işlemlerini görür (RLS: firma + hesap; hesap işlemin bağlamından, istemciden değil). Kayıt değişmez, silinmez (uygulama rolüne
-- yalnız okuma + ekleme). Kilit: tests/islem.test.ts; olumsuz kanıt tests/bozan/islem.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS islem (
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  id            uuid NOT NULL,
  hesap_id      uuid NOT NULL,
  tur           text NOT NULL CHECK (tur ~ '^[a-z_]{1,20}\.[a-z_]{1,20}$'),
  kayit_id      uuid NOT NULL,
  cihaz_zamani  timestamptz,
  alindi        timestamptz NOT NULL DEFAULT now(),
  sonuc         jsonb NOT NULL CHECK (jsonb_typeof(sonuc) = 'object' AND octet_length(sonuc::text) <= 20000),
  PRIMARY KEY (firma_id, id)
);
CREATE INDEX IF NOT EXISTS islem_kisi ON islem (firma_id, hesap_id, alindi DESC);
ALTER TABLE islem ENABLE ROW LEVEL SECURITY;
ALTER TABLE islem FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'islem' AND policyname = 'islem_kendi') THEN
    CREATE POLICY islem_kendi ON islem
      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)
      WITH CHECK (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid);
  END IF;
END $$;

/* kim ve ne zaman veritabanından: hesap işlemin bağlamından (istemci başkası adına işlem yazamaz), alınma anı sunucu saati; kayıt değişmez */
CREATE OR REPLACE FUNCTION islem_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'işlem kaydı değişmez' USING ERRCODE = '23514'; END IF;
  IF ben IS NULL THEN RAISE EXCEPTION 'işlemi oturumdaki kişi yazar' USING ERRCODE = '42501'; END IF;
  NEW.hesap_id := ben;
  NEW.alindi := now();
  RETURN NEW;
END $$;
ALTER FUNCTION islem_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION islem_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER islem_koru BEFORE INSERT OR UPDATE OR DELETE ON islem FOR EACH ROW EXECUTE FUNCTION islem_koru();

REVOKE ALL ON islem FROM PUBLIC;
GRANT SELECT, INSERT ON islem TO probata_uygulama;

/* kimlik bu firmada başka bir kişinin işleminde kullanılmış mı (kişi başkasının işlemini RLS yüzünden göremez; kimlik yeniden kullanılırsa iş
   YAPILMADAN reddedilir). Yalnız evet / hayır — işlemin kendisi dönmez. */
CREATE OR REPLACE FUNCTION islem_kimlik_baskasinda(p_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM islem i WHERE i.firma_id = gecerli_firma() AND i.id = p_id
    AND i.hesap_id IS DISTINCT FROM NULLIF(current_setting('app.hesap_id', true), '')::uuid)
$$;
ALTER FUNCTION islem_kimlik_baskasinda(uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION islem_kimlik_baskasinda(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION islem_kimlik_baskasinda(uuid) TO probata_uygulama;
