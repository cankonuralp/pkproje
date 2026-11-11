-- 0126 · E-POSTA: probata'nın KENDİ alan adından birden çok firma gönderebilir (2026-11-11; reisim maketi onayladı: "Onaylıyorum, yaz" — firma kurulum
-- ekranı, e-postada "probata.com.tr üzerinden" yolu). 0099'da "bir alan adı tek firmanın" idi (eposta_alan.alan eşsiz): yeni firma kendi alan adına DNS
-- kaydı girmeden ve Resend'in ücretli planı gerekmeden gönderemiyordu. Şimdi:
--   · eşsizlik ADRESTE (alan + genel adresin yerel kısmı): iki firma aynı adresi paylaşamaz;
--   · "bir alan adı tek firmanın" kuralı işlevde kalır, YALNIZ ortak alan adında gevşer (p_ortak — sunucu, alan adı probata'nın ana alan adıysa
--     true verir; tabloya yazan tek yol bu işlev, çağıran yalnız yönetim rolü);
--   · eski 7 değişkenli işlev durur ve yenisine p_ortak = false ile devreder (yayın sırasındaki eski kod kırılmasın).
-- Firma tarafında (firma_gonderim, gönderme anahtarı) değişen yok: her firma ortak alan adına bağlı KENDİ anahtarını alır. İdempotent.
-- Kilit tests/eposta-gonderim.test.ts.

DROP INDEX IF EXISTS eposta_alan_alan;
CREATE INDEX IF NOT EXISTS eposta_alan_alan_adi ON eposta_alan (alan);
CREATE UNIQUE INDEX IF NOT EXISTS eposta_alan_adres ON eposta_alan (alan, genel_yerel);

CREATE OR REPLACE FUNCTION yonetim_eposta_alan_yaz(p_firma uuid, p_alan text, p_genel_yerel text, p_resend_id text, p_durum text, p_kayitlar jsonb,
  p_anahtar_id text, p_ortak boolean) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_kim();
  v_eski eposta_alan%ROWTYPE;
  v_ortak boolean := coalesce(p_ortak, false);
BEGIN
  PERFORM vt_merkez_dogrula();
  IF NOT EXISTS (SELECT 1 FROM firma WHERE id = p_firma) THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF p_alan IS NULL OR p_genel_yerel IS NULL OR p_resend_id IS NULL OR p_durum IS NULL OR p_kayitlar IS NULL THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  -- ortak olmayan alan adı tek firmanın
  IF NOT v_ortak AND EXISTS (SELECT 1 FROM eposta_alan WHERE alan = lower(p_alan) AND firma_id <> p_firma) THEN
    RETURN jsonb_build_object('hata', 'alan_baska');
  END IF;
  -- adres (alan + yerel) her durumda tek firmanın
  IF EXISTS (SELECT 1 FROM eposta_alan WHERE alan = lower(p_alan) AND genel_yerel = lower(p_genel_yerel) AND firma_id <> p_firma) THEN
    RETURN jsonb_build_object('hata', 'adres_baska');
  END IF;
  SELECT * INTO v_eski FROM eposta_alan WHERE firma_id = p_firma FOR UPDATE;
  INSERT INTO eposta_alan (firma_id, alan, genel_yerel, resend_id, durum, kayitlar, anahtar_id)
    VALUES (p_firma, lower(p_alan), lower(p_genel_yerel), p_resend_id, p_durum, p_kayitlar, p_anahtar_id)
    ON CONFLICT (firma_id) DO UPDATE SET alan = EXCLUDED.alan, genel_yerel = EXCLUDED.genel_yerel, resend_id = EXCLUDED.resend_id,
      durum = EXCLUDED.durum, kayitlar = EXCLUDED.kayitlar, anahtar_id = EXCLUDED.anahtar_id, degisti = now();
  -- iz yalnız değişince (Doğrula her basışta aynı durumu yazabilir)
  IF v_eski.firma_id IS NULL OR v_eski.alan IS DISTINCT FROM lower(p_alan) OR v_eski.durum IS DISTINCT FROM p_durum
     OR v_eski.genel_yerel IS DISTINCT FROM lower(p_genel_yerel) OR v_eski.anahtar_id IS DISTINCT FROM p_anahtar_id THEN
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
      VALUES (v_kim, 'eposta.alan', p_firma, jsonb_build_object('alan', lower(p_alan), 'genel', lower(p_genel_yerel) || '@' || lower(p_alan), 'durum', p_durum,
        'ortak', v_ortak));
  END IF;
  RETURN jsonb_build_object('durum', 'tamam');
END $$;

-- eski imza: aynı kural (alan adı tek firmanın) — yenisine devreder
CREATE OR REPLACE FUNCTION yonetim_eposta_alan_yaz(p_firma uuid, p_alan text, p_genel_yerel text, p_resend_id text, p_durum text, p_kayitlar jsonb,
  p_anahtar_id text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  RETURN yonetim_eposta_alan_yaz(p_firma, p_alan, p_genel_yerel, p_resend_id, p_durum, p_kayitlar, p_anahtar_id, false);
END $$;

REVOKE ALL ON FUNCTION yonetim_eposta_alan_yaz(uuid, text, text, text, text, jsonb, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yonetim_eposta_alan_yaz(uuid, text, text, text, text, jsonb, text, boolean) TO probata_yonetim;
