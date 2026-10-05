-- ══ 0033 · MÜŞTERİ GİRİŞİ / PANELİ DÜZELTMELERİ (319 çapraz incelemesi, 2026-10-05; doğrulanmış bulgular) ══
-- (1) Müşteri rolü uygunsuzluğu yalnız KENDİ SÜRÜMÜ müşteriye açıksa görür (raporun son imzalı sürümü — 193): eskiden revizyondan önce başka
--     raporla "giderildi" kapanmış eski sürüm kusuru (revizyonla kapanmadığı için) açık kalıyordu; görünürlük imza sırasına bağlıydı.
-- (2) Müşteri pasif olunca bütün girişlerinin açık oturumları HEMEN düşer (eskiden yalnız o belirteçle istek gelince; yeniden etkinleştirilince
--     okunmamış eski belirteç geçerli oluyordu — 09-E4 "düşürülen yetki hemen geçerli").
-- (3) Girişin parolası değişince (geçici parola, parola değiştirme) hata sayacı ve kilit sıfırlanır (personel hesabındaki gibi).
-- (4) Kullanıcı adı tekliği müşterinin KAYITLI e-postasını da kapsar (ana girişin kullanıcı adı odur): personel hesabı ve başka bir giriş o
--     adresi alamaz; müşterinin e-postası başka bir girişin kullanıcı adı olamaz (kendi ana girişi hariç). Eskiden ek giriş müşterinin adresini
--     alınca müşterinin kartı hiç kaydedilemiyor, ana girişi açılamıyordu.
-- ⛔ Her göç IDEMPOTENT.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uygunsuzluk' AND policyname = 'uygunsuzluk_musteri') THEN
    DROP POLICY uygunsuzluk_musteri ON uygunsuzluk;
  END IF;
  -- alt sorgu müşteri rolünde rapor_surumu politikasından geçer: yalnız raporun son imzalı sürümü, kendi müşterisi ve tesis kapsamı
  CREATE POLICY uygunsuzluk_musteri ON uygunsuzluk AS RESTRICTIVE FOR SELECT TO probata_musteri
    USING (musteri_id = gecerli_musteri() AND musteri_tesis_gorur(tesis_id) AND kapanis IS DISTINCT FROM 'revizyon'
           AND EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.firma_id = uygunsuzluk.firma_id AND s.id = uygunsuzluk.surum_id));
END $$;

CREATE OR REPLACE FUNCTION musteri_pasif_oturum() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pasif IS NOT NULL AND OLD.pasif IS NULL THEN
    DELETE FROM musteri_oturum o USING musteri_hesap h
      WHERE o.firma_id = NEW.firma_id AND h.firma_id = NEW.firma_id AND h.id = o.musteri_hesap_id AND h.musteri_id = NEW.id;
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION musteri_pasif_oturum() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_pasif_oturum() FROM PUBLIC;
CREATE OR REPLACE TRIGGER musteri_pasif_oturum AFTER UPDATE OF pasif ON musteri FOR EACH ROW EXECUTE FUNCTION musteri_pasif_oturum();

-- müşteri girişi: tesis kapsamı müşterinin KENDİ tesisleri; müşteri değişmez; parola / durum / e-posta / kapsam değişince oturumlar düşer;
-- parola değişince hata sayacı ve kilit sıfırlanır
CREATE OR REPLACE FUNCTION musteri_hesap_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.musteri_id IS DISTINCT FROM OLD.musteri_id OR NEW.ana IS DISTINCT FROM OLD.ana OR NEW.firma_id IS DISTINCT FROM OLD.firma_id) THEN
    RAISE EXCEPTION 'müşteri girişinin müşterisi ve türü değişmez' USING ERRCODE = '23514';
  END IF;
  IF NEW.tesisler IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(NEW.tesisler) AS x(t)
       WHERE NOT EXISTS (SELECT 1 FROM tesis s WHERE s.firma_id = NEW.firma_id AND s.id = x.t AND s.musteri_id = NEW.musteri_id)) THEN
    RAISE EXCEPTION 'giriş yalnız müşterinin kendi tesislerini görür' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.parola_ozeti IS DISTINCT FROM OLD.parola_ozeti OR NEW.durum IS DISTINCT FROM OLD.durum OR NEW.eposta IS DISTINCT FROM OLD.eposta
       OR NEW.tesisler IS DISTINCT FROM OLD.tesisler THEN
      DELETE FROM musteri_oturum WHERE musteri_hesap_id = NEW.id AND firma_id = NEW.firma_id;
    END IF;
    IF NEW.parola_ozeti IS DISTINCT FROM OLD.parola_ozeti THEN NEW.hatali_deneme := 0; NEW.kilit_bitis := NULL; END IF;
    NEW.degisti := now();
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION musteri_hesap_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_hesap_koru() FROM PUBLIC;

-- kullanıcı adı firmada TEK — personel hesabı, müşteri girişi ve müşterinin kayıtlı e-postası (ana girişin kullanıcı adı)
-- (her tablonun dalı ayrı deyim: PL/pgSQL deyimi ilk koşulduğunda çözer — hesap satırında NEW.ana yoktur)
CREATE OR REPLACE FUNCTION giris_eposta_essiz() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE dolu boolean;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.eposta IS NOT DISTINCT FROM OLD.eposta THEN RETURN NEW; END IF;
  IF NEW.eposta IS NULL THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('probata:giris_eposta:' || NEW.firma_id::text || ':' || NEW.eposta));
  IF TG_TABLE_NAME = 'hesap' THEN
    dolu := EXISTS (SELECT 1 FROM musteri_hesap m WHERE m.firma_id = NEW.firma_id AND m.eposta = NEW.eposta)
         OR EXISTS (SELECT 1 FROM musteri c WHERE c.firma_id = NEW.firma_id AND c.eposta = NEW.eposta);
  ELSIF TG_TABLE_NAME = 'musteri_hesap' THEN
    dolu := EXISTS (SELECT 1 FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.eposta = NEW.eposta)
         OR EXISTS (SELECT 1 FROM musteri c WHERE c.firma_id = NEW.firma_id AND c.eposta = NEW.eposta AND NOT (NEW.ana AND c.id = NEW.musteri_id));
  ELSE
    dolu := EXISTS (SELECT 1 FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.eposta = NEW.eposta)
         OR EXISTS (SELECT 1 FROM musteri_hesap m WHERE m.firma_id = NEW.firma_id AND m.eposta = NEW.eposta AND NOT (m.ana AND m.musteri_id = NEW.id));
  END IF;
  IF dolu THEN
    RAISE EXCEPTION 'bu e-posta firmada başka bir girişte kayıtlı' USING ERRCODE = '23505', CONSTRAINT = 'giris_eposta';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION giris_eposta_essiz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION giris_eposta_essiz() FROM PUBLIC;
CREATE OR REPLACE TRIGGER musteri_eposta_essiz BEFORE INSERT OR UPDATE OF eposta ON musteri FOR EACH ROW EXECUTE FUNCTION giris_eposta_essiz();
