-- ══ 0112 · S.A.Y İŞ ÖLÇÜMÜ VE AR-GE KAYDI (2026-10-31; reisim: "İş ölçümü: her iş için istek sayısı, en büyük istem, süre ve maliyet kaydedilir"; Ar-Ge
--    dökümü kararı: "eğer bize bir handikapı yoksa 30 gün saklansın (b)"; sunum L8) ══
-- · say_istek: S.A.Y'ın her yapay zekâ isteği — işin kimliği (ekranın iş kimliği; bir iş devam / ekran sonucu istekleriyle sürer), giriş / önbellekten okunan /
--   önbelleğe yazılan / çıkış token, maliyet (milyonda bir $), süre, yazma adımı, işlem sayısı, şablon, derinlik. Yalnız EKLENİR. İşin toplamı Yönetim'de.
-- · say_arge: "Sohbeti temizle"den önce konuşmanın METNİ — kullanıcı ve S.A.Y iletileri, araç çağrıları ve sonuçları; ekler (fotoğraf, belge), düşünce
--   ve imzası YOK (künye değeri konuşmaya zaten girmez — 557). 30 gün; yalnız probata Yönetim okur (uygulama rolü yalnız ekler; eskiyeni ekleme anında siler).
-- Kilit: tests/say-olcum.test.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS say_istek (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  is_id     uuid NOT NULL,
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp(),
  giris     integer NOT NULL CHECK (giris >= 0),
  okunan    integer NOT NULL CHECK (okunan >= 0),
  yazilan   integer NOT NULL CHECK (yazilan >= 0),
  cikis     integer NOT NULL CHECK (cikis >= 0),
  maliyet   bigint NOT NULL CHECK (maliyet >= 0),
  sure_ms   integer NOT NULL CHECK (sure_ms >= 0),
  yazma     integer NOT NULL DEFAULT 0 CHECK (yazma >= 0),
  islem     integer NOT NULL DEFAULT 0 CHECK (islem >= 0),
  sablon    text CHECK (sablon IS NULL OR sablon ~ '^S[0-9]{1,3}$'),
  derinlik  text NOT NULL CHECK (derinlik IN ('high', 'medium'))
);
CREATE INDEX IF NOT EXISTS say_istek_is ON say_istek (firma_id, is_id, zaman);
CREATE INDEX IF NOT EXISTS say_istek_hesap ON say_istek (hesap_id);
ALTER TABLE say_istek ENABLE ROW LEVEL SECURITY;
ALTER TABLE say_istek FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS say_arge (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp(),
  ileti     integer NOT NULL CHECK (ileti >= 0),
  icerik    jsonb NOT NULL CHECK (jsonb_typeof(icerik) = 'array' AND pg_column_size(icerik) <= 5000000)
);
CREATE INDEX IF NOT EXISTS say_arge_firma ON say_arge (firma_id, zaman);
CREATE INDEX IF NOT EXISTS say_arge_hesap ON say_arge (hesap_id);
ALTER TABLE say_arge ENABLE ROW LEVEL SECURITY;
ALTER TABLE say_arge FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_istek' AND policyname = 'say_istek_kendi') THEN
    CREATE POLICY say_istek_kendi ON say_istek
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_arge' AND policyname = 'say_arge_kendi') THEN
    CREATE POLICY say_arge_kendi ON say_arge
      USING (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid)
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
END $$;
/* sahibi işlemin bağlamından, satır değişmez (0103'ün koruması) */
CREATE OR REPLACE TRIGGER say_istek_koru BEFORE INSERT OR UPDATE ON say_istek FOR EACH ROW EXECUTE FUNCTION yz_konusma_koru();
CREATE OR REPLACE TRIGGER say_arge_koru BEFORE INSERT OR UPDATE ON say_arge FOR EACH ROW EXECUTE FUNCTION yz_konusma_koru();
REVOKE ALL ON say_istek FROM PUBLIC;
REVOKE ALL ON say_arge FROM PUBLIC;
GRANT INSERT ON say_istek TO probata_uygulama;
/* Ar-Ge kaydını uygulama yalnız ekler; 30 günü geçenleri ekleme anında siler (kendi kayıtları) — okuyamaz */
GRANT INSERT, DELETE ON say_arge TO probata_uygulama;

-- ── Yönetim: işlerin ölçümü (son 30 gün, en yeni 50 iş) ve Ar-Ge kayıtları (30 gün) ──
CREATE OR REPLACE FUNCTION firma_yonetim_say(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  PERFORM yonetim_firma_kimi(p_firma);
  RETURN jsonb_build_object(
    'isler', (SELECT coalesce(jsonb_agg(x ORDER BY x->>'bas' DESC), '[]'::jsonb) FROM (
      SELECT jsonb_build_object('is', i.is_id, 'kisi', h.ad, 'bas', min(i.zaman), 'bit', max(i.zaman), 'istek', count(*)::int,
             'en_buyuk', max(i.giris + i.okunan + i.yazilan), 'giris', sum(i.giris + i.okunan + i.yazilan)::bigint, 'cikis', sum(i.cikis)::bigint,
             'okunan', sum(i.okunan)::bigint, 'maliyet', sum(i.maliyet)::bigint, 'sure_ms', sum(i.sure_ms)::bigint, 'yazma', sum(i.yazma)::int,
             'islem', sum(i.islem)::int, 'sablon', max(i.sablon), 'derinlik', max(i.derinlik)) AS x
        FROM say_istek i JOIN hesap h ON h.id = i.hesap_id
       WHERE i.firma_id = p_firma AND i.zaman > now() - interval '30 days'
       GROUP BY i.is_id, h.ad ORDER BY min(i.zaman) DESC LIMIT 50) y),
    'arge', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'kisi', h.ad, 'zaman', a.zaman, 'ileti', a.ileti) ORDER BY a.zaman DESC), '[]'::jsonb)
               FROM say_arge a JOIN hesap h ON h.id = a.hesap_id WHERE a.firma_id = p_firma AND a.zaman > now() - interval '30 days'));
END $$;
CREATE OR REPLACE FUNCTION firma_yonetim_say_arge(p_firma uuid, p_id uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  PERFORM yonetim_firma_kimi(p_firma);
  RETURN (SELECT icerik FROM say_arge WHERE firma_id = p_firma AND id = p_id AND zaman > now() - interval '30 days');
END $$;
REVOKE ALL ON FUNCTION firma_yonetim_say(uuid), firma_yonetim_say_arge(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_yonetim_say(uuid), firma_yonetim_say_arge(uuid, uuid) TO probata_yonetim;
