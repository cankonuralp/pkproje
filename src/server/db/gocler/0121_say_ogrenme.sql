-- ══ 0121 · S.A.Y KENDİ İŞİNDEN ÖĞRENME (2026-11-05; reisim: "müşterilerin yaptırdığı işlere göre sürekli kendini eğitme sistemi", "benim 1 kere yaptırdığım işi
--    claude … bir dahaki sefer daha iyi yapıyor … say asistanda da bu hafızalama yöntemi … geri planda çalışsın ve kullanıcının tokeninden yemesin";
--    sunum https://claude.ai/artifact/7UcQ3N2BJRQkLHq4Whad16 — "önerilerinin yeni hali uygundur": K1 deneme paketi yerine gerçek işlerden öğrenme, K2 örnek
--    firma içinde, K3 öğrenilenler silinmez / ham konuşma 12 ay, K4 koşul metni) ══
-- · say_is: S.A.Y'ın bitmiş her işinin ÖZETİ (iş bitince uygulama yazar — yalnız ekler): kullanıcının isteği, adımlar (işlem adları, hata), işin dokunduğu
--   raporlar ve o andaki cevaplarının parmak izi (anahtar başına md5), düzeltme isteği mi ("hayır", "yanlış", geri al). Puanı gece say_ogren_veri verir
--   (yapay zekâ YOK — kodla): rapor onaydan geri geldi / S.A.Y'ın yazdığı cevap sonradan elle değişti / sonraki istek düzeltme → kötü; işlem hatası →
--   şüpheli; dokunduğu raporların hepsi onaylandı (raporsuz işte bir gün geçti) → iyi. Ham kayıt 12 ay (K3).
-- · say_hafiza: firmanın S.A.Y hafızası — örnek işler (iş türü başına en iyi üç) ve alışkanlıklar; gece kurulur (say_hafiza_yaz), konuşmanın başında
--   S.A.Y'a not olarak gider (src/modules/say/server/say.ts). Öğrenilenler SİLİNMEZ (K3): ham kayıt silinse de örnek hafızada kalır.
-- Yönetim: firma_yonetim_say işlere puanı ve hafızayı ekler. Kilit tests/say-ogrenme.test.ts (PG) + say-ogrenme-saf. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS say_is (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id   uuid NOT NULL REFERENCES hesap(id),
  is_id      uuid NOT NULL,
  zaman      timestamptz NOT NULL DEFAULT clock_timestamp(),
  soru       text NOT NULL CHECK (char_length(soru) <= 2000),
  adimlar    jsonb NOT NULL CHECK (jsonb_typeof(adimlar) = 'array' AND jsonb_array_length(adimlar) <= 300),
  raporlar   uuid[] NOT NULL DEFAULT '{}' CHECK (cardinality(raporlar) <= 200),
  anlik      jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(anlik) = 'object' AND pg_column_size(anlik) <= 2000000),
  duzeltme   boolean NOT NULL DEFAULT false,
  hata       integer NOT NULL DEFAULT 0 CHECK (hata >= 0),
  tur        text NOT NULL CHECK (char_length(tur) BETWEEN 1 AND 160),
  /* gecenin işi yazar (sahibin haklarıyla) */
  puan       text CHECK (puan IS NULL OR puan IN ('iyi', 'kotu', 'supheli')),
  sinyal     jsonb,
  istek      integer,
  maliyet    bigint,
  puanlandi  timestamptz,
  UNIQUE (firma_id, is_id)
);
CREATE INDEX IF NOT EXISTS say_is_hesap ON say_is (hesap_id);
CREATE INDEX IF NOT EXISTS say_is_zaman ON say_is (firma_id, zaman);
ALTER TABLE say_is ENABLE ROW LEVEL SECURITY;
ALTER TABLE say_is FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS say_hafiza (
  firma_id   uuid PRIMARY KEY DEFAULT gecerli_firma() REFERENCES firma(id),
  metin      text NOT NULL CHECK (char_length(metin) <= 12000),
  ornekler   jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(ornekler) = 'array' AND pg_column_size(ornekler) <= 500000),
  guncel     timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE say_hafiza ENABLE ROW LEVEL SECURITY;
ALTER TABLE say_hafiza FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  /* ekleme: oturumdaki kişi kendi adına. Okuma / puan yazma / 12 ayı geçeni silme: firmada; kişi bağlamı varsa yalnız kendi kaydı (gecenin işinde kişi
     bağlamı yok — firmanın bütün işleri). Uygulama rolü içerik sütunlarını zaten okuyamaz, güncelleyemez (aşağıdaki izinler) */
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_is' AND policyname = 'say_is_ekle') THEN
    CREATE POLICY say_is_ekle ON say_is FOR INSERT
      WITH CHECK (firma_id = (SELECT gecerli_firma()) AND hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_is' AND policyname = 'say_is_oku') THEN
    CREATE POLICY say_is_oku ON say_is FOR SELECT
      USING (firma_id = (SELECT gecerli_firma()) AND (NULLIF((SELECT current_setting('app.hesap_id', true)), '') IS NULL
        OR hesap_id = NULLIF((SELECT current_setting('app.hesap_id', true)), '')::uuid));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_is' AND policyname = 'say_is_puan') THEN
    CREATE POLICY say_is_puan ON say_is FOR UPDATE
      USING (firma_id = (SELECT gecerli_firma()) AND NULLIF((SELECT current_setting('app.hesap_id', true)), '') IS NULL)
      WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_is' AND policyname = 'say_is_sil') THEN
    CREATE POLICY say_is_sil ON say_is FOR DELETE
      USING (firma_id = (SELECT gecerli_firma()) AND NULLIF((SELECT current_setting('app.hesap_id', true)), '') IS NULL);
  END IF;
  /* hafıza firmanın: firmadaki her S.A.Y kullanıcısı okur (konuşmanın başında); yazan yalnız gecenin işlevi */
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'say_hafiza' AND policyname = 'say_hafiza_firma') THEN
    CREATE POLICY say_hafiza_firma ON say_hafiza USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;

/* sahibi işlemin bağlamından; uygulama yalnız ekler (puanı gecenin işlevi yazar — tetik yalnız eklemede) */
CREATE OR REPLACE FUNCTION say_is_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF ben IS NULL THEN RAISE EXCEPTION 'S.A.Y işini oturumdaki kişi yazar' USING ERRCODE = '23514'; END IF;
  NEW.hesap_id := ben;
  NEW.puan := NULL; NEW.sinyal := NULL; NEW.istek := NULL; NEW.maliyet := NULL; NEW.puanlandi := NULL;
  RETURN NEW;
END $$;
ALTER FUNCTION say_is_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_is_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER say_is_koru BEFORE INSERT ON say_is FOR EACH ROW EXECUTE FUNCTION say_is_koru();

REVOKE ALL ON say_is FROM PUBLIC;
REVOKE ALL ON say_hafiza FROM PUBLIC;
GRANT INSERT ON say_is TO probata_uygulama;
/* ON CONFLICT (firma_id, is_id) DO NOTHING için tekil anahtarın sütunları okunur; içerik okunamaz */
GRANT SELECT (firma_id, is_id) ON say_is TO probata_uygulama;
GRANT SELECT ON say_hafiza TO probata_uygulama;

-- ── gece: puanla, örnek adaylarını ve alışkanlıkları ver (oturumdaki firma; sahibin haklarıyla; yapay zekâ yok) ──
CREATE OR REPLACE FUNCTION say_ogren_veri() RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE f uuid := gecerli_firma(); k record; olc jsonb := '{}'::jsonb;
BEGIN
  IF f IS NULL THEN RETURN NULL; END IF;
  IF NULLIF(current_setting('app.hesap_id', true), '') IS NOT NULL THEN RAISE EXCEPTION 'gecenin işi kişi bağlamı olmadan koşar' USING ERRCODE = '42501'; END IF;
  /* K3: ham kayıt 12 ay (öğrenilen hafızada kalır) */
  DELETE FROM say_is WHERE firma_id = f AND zaman < now() - interval '365 days';
  /* maliyet ve istek sayısı işin ölçümünden — say_istek kişiye bağlı: politikalar (FORCE RLS sahibe de uygulanır) için bağlam kişi kişi; önce
     ölçümler toplanır, sonra bağlam boşalır ve puanlar yazılır */
  FOR k IN SELECT DISTINCT hesap_id FROM say_is WHERE firma_id = f AND zaman > now() - interval '30 days' LOOP
    PERFORM set_config('app.hesap_id', k.hesap_id::text, true);
    olc := olc || coalesce((SELECT jsonb_object_agg(o.is_id::text, jsonb_build_object('n', o.n, 'm', o.m)) FROM (
      SELECT is_id, count(*)::integer AS n, sum(maliyet)::bigint AS m FROM say_istek WHERE firma_id = f AND hesap_id = k.hesap_id GROUP BY is_id) o), '{}'::jsonb);
  END LOOP;
  PERFORM set_config('app.hesap_id', '', true);
  UPDATE say_is s SET istek = (olc -> s.is_id::text ->> 'n')::integer, maliyet = (olc -> s.is_id::text ->> 'm')::bigint
   WHERE s.firma_id = f AND s.zaman > now() - interval '30 days' AND olc ? s.is_id::text
     AND (s.istek IS DISTINCT FROM (olc -> s.is_id::text ->> 'n')::integer OR s.maliyet IS DISTINCT FROM (olc -> s.is_id::text ->> 'm')::bigint);
  /* sinyaller (son 30 gün; puan her gece yeniden — onay sonradan gelir) */
  WITH s AS (
    SELECT x.id, x.hesap_id, x.zaman, x.raporlar, x.anlik, x.hata,
      /* sonraki iş (aynı kişi, 60 dk içinde) düzeltme istediyse */
      EXISTS (SELECT 1 FROM say_is n WHERE n.firma_id = f AND n.hesap_id = x.hesap_id AND n.zaman > x.zaman AND n.zaman < x.zaman + interval '60 minutes'
                AND n.duzeltme AND NOT EXISTS (SELECT 1 FROM say_is a WHERE a.firma_id = f AND a.hesap_id = x.hesap_id AND a.zaman > x.zaman AND a.zaman < n.zaman)) AS olumsuz,
      (SELECT count(*)::integer FROM rapor_hareket h WHERE h.firma_id = f AND h.rapor_id = ANY (x.raporlar) AND h.ne = 'geri' AND h.zaman > x.zaman) AS geri,
      (SELECT count(*)::integer FROM rapor r WHERE r.firma_id = f AND r.id = ANY (x.raporlar) AND r.onay IS NOT NULL AND r.silindi IS NULL) AS onay,
      (SELECT count(*)::integer FROM rapor r WHERE r.firma_id = f AND r.id = ANY (x.raporlar) AND r.silindi IS NULL) AS rapor,
      /* S.A.Y'ın bıraktığı cevap sonradan değişti mi: o raporun SON S.A.Y işinin parmak iziyle (sonra S.A.Y yeniden yazdıysa eski iş sayılmaz) */
      (SELECT count(*)::integer FROM rapor r CROSS JOIN LATERAL jsonb_each_text(coalesce(x.anlik -> r.id::text, '{}'::jsonb)) a(k, v)
        WHERE r.firma_id = f AND r.id = ANY (x.raporlar) AND r.silindi IS NULL
          AND NOT EXISTS (SELECT 1 FROM say_is y WHERE y.firma_id = f AND y.zaman > x.zaman AND r.id = ANY (y.raporlar))
          AND md5(coalesce((r.cevaplar -> a.k)::text, 'null')) <> a.v) AS elle,
      (SELECT array_agg(DISTINCT a.k) FROM rapor r CROSS JOIN LATERAL jsonb_each_text(coalesce(x.anlik -> r.id::text, '{}'::jsonb)) a(k, v)
        WHERE r.firma_id = f AND r.id = ANY (x.raporlar) AND r.silindi IS NULL
          AND NOT EXISTS (SELECT 1 FROM say_is y WHERE y.firma_id = f AND y.zaman > x.zaman AND r.id = ANY (y.raporlar))
          AND md5(coalesce((r.cevaplar -> a.k)::text, 'null')) <> a.v) AS elle_yer
    FROM say_is x WHERE x.firma_id = f AND x.zaman > now() - interval '30 days')
  UPDATE say_is t SET
    sinyal = jsonb_build_object('olumsuz', s.olumsuz, 'geri', s.geri, 'onay', s.onay, 'rapor', s.rapor, 'elle', s.elle, 'hata', s.hata,
                                'elle_yer', to_jsonb(coalesce(s.elle_yer[1:10], '{}'::text[]))),
    puan = CASE WHEN s.geri > 0 OR s.elle > 0 OR s.olumsuz THEN 'kotu'
                WHEN s.hata > 0 THEN 'supheli'
                WHEN s.rapor > 0 AND s.onay = s.rapor THEN 'iyi'
                WHEN s.rapor = 0 AND cardinality(s.raporlar) = 0 AND s.zaman < now() - interval '1 day' THEN 'iyi'
                ELSE NULL END,
    puanlandi = now()
  FROM s WHERE t.id = s.id;
  RETURN jsonb_build_object(
    /* örnek adayları: iyi işler (son 12 ay), iş türü başına en ucuz üç */
    'adaylar', (WITH x AS (
                  SELECT s.id, CASE WHEN cardinality(s.raporlar) > 0 THEN 'rapor · ' || coalesce((SELECT string_agg(DISTINCT t.ad, ', ')
                    FROM rapor r JOIN ekipman_turu t ON t.firma_id = r.firma_id AND t.id = r.tur_id WHERE r.firma_id = f AND r.id = ANY (s.raporlar)), '?')
                    ELSE s.tur END AS tur, s.soru, s.adimlar, s.istek, s.maliyet, s.zaman, cardinality(s.raporlar) AS rapor
                  FROM say_is s WHERE s.firma_id = f AND s.puan = 'iyi'),
                y AS (SELECT x.*, row_number() OVER (PARTITION BY x.tur ORDER BY x.maliyet NULLS LAST, x.zaman DESC) AS sira FROM x)
                SELECT coalesce(jsonb_agg(jsonb_build_object('id', y.id, 'tur', y.tur, 'soru', y.soru, 'adimlar', y.adimlar, 'istek', y.istek,
                  'maliyet', y.maliyet, 'zaman', y.zaman, 'rapor', y.rapor) ORDER BY y.tur, y.sira), '[]'::jsonb) FROM y WHERE y.sira <= 3),
    /* alışkanlıklar: türler ve kod düzeni (en sık önek), maskelenecek adlar */
    'turler', (SELECT coalesce(jsonb_agg(jsonb_build_object('ad', t.ad, 'kod', t.kod, 'onek',
                  (SELECT regexp_replace(e.kod, '[0-9]+$', '') FROM ekipman e WHERE e.firma_id = f AND e.tur_id = t.id AND e.pasif IS NULL
                    GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1)) ORDER BY t.ad), '[]'::jsonb)
               FROM ekipman_turu t WHERE t.firma_id = f),
    'adlar', (SELECT coalesce(jsonb_agg(DISTINCT a), '[]'::jsonb) FROM (
                SELECT unvan AS a FROM musteri WHERE firma_id = f UNION SELECT kisa FROM musteri WHERE firma_id = f
                UNION SELECT ilgili FROM musteri WHERE firma_id = f UNION SELECT ad FROM tesis WHERE firma_id = f
                UNION SELECT ad FROM personel WHERE firma_id = f UNION SELECT ad FROM hesap WHERE firma_id = f) y
              WHERE a IS NOT NULL AND char_length(btrim(a)) >= 3),
    'onceki', (SELECT ornekler FROM say_hafiza WHERE firma_id = f),
    'puanlanan', (SELECT count(*)::integer FROM say_is WHERE firma_id = f AND puanlandi > now() - interval '1 minute'));
END $$;
ALTER FUNCTION say_ogren_veri() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_ogren_veri() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION say_ogren_veri() TO probata_uygulama;

CREATE OR REPLACE FUNCTION say_hafiza_yaz(p_metin text, p_ornekler jsonb) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE f uuid := gecerli_firma();
BEGIN
  IF f IS NULL THEN RETURN; END IF;
  INSERT INTO say_hafiza (firma_id, metin, ornekler, guncel) VALUES (f, p_metin, p_ornekler, clock_timestamp())
  ON CONFLICT (firma_id) DO UPDATE SET metin = EXCLUDED.metin, ornekler = EXCLUDED.ornekler, guncel = EXCLUDED.guncel;
END $$;
ALTER FUNCTION say_hafiza_yaz(text, jsonb) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_hafiza_yaz(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION say_hafiza_yaz(text, jsonb) TO probata_uygulama;

-- ── Yönetim: işlerin ölçümüne puan ve neden; firmanın hafızası; Ar-Ge kayıtları 12 ay (K3) ──
CREATE OR REPLACE FUNCTION firma_yonetim_say(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  PERFORM yonetim_firma_kimi(p_firma);
  RETURN jsonb_build_object(
    'isler', (SELECT coalesce(jsonb_agg(x ORDER BY x->>'bas' DESC), '[]'::jsonb) FROM (
      SELECT jsonb_build_object('is', i.is_id, 'kisi', h.ad, 'bas', min(i.zaman), 'bit', max(i.zaman), 'istek', count(*)::int,
             'en_buyuk', max(i.giris + i.okunan + i.yazilan), 'giris', sum(i.giris + i.okunan + i.yazilan)::bigint, 'cikis', sum(i.cikis)::bigint,
             'okunan', sum(i.okunan)::bigint, 'maliyet', sum(i.maliyet)::bigint, 'sure_ms', sum(i.sure_ms)::bigint, 'yazma', sum(i.yazma)::int,
             'islem', sum(i.islem)::int, 'sablon', max(i.sablon), 'derinlik', max(i.derinlik),
             'puan', (SELECT s.puan FROM say_is s WHERE s.firma_id = p_firma AND s.is_id = i.is_id),
             'sinyal', (SELECT s.sinyal FROM say_is s WHERE s.firma_id = p_firma AND s.is_id = i.is_id),
             'tur', (SELECT s.tur FROM say_is s WHERE s.firma_id = p_firma AND s.is_id = i.is_id)) AS x
        FROM say_istek i JOIN hesap h ON h.id = i.hesap_id
       WHERE i.firma_id = p_firma AND i.zaman > now() - interval '30 days'
       GROUP BY i.is_id, h.ad ORDER BY min(i.zaman) DESC LIMIT 50) y),
    'arge', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'kisi', h.ad, 'zaman', a.zaman, 'ileti', a.ileti) ORDER BY a.zaman DESC), '[]'::jsonb)
               FROM say_arge a JOIN hesap h ON h.id = a.hesap_id WHERE a.firma_id = p_firma AND a.zaman > now() - interval '365 days'),
    'hafiza', (SELECT jsonb_build_object('metin', m.metin, 'guncel', m.guncel, 'ornek', jsonb_array_length(m.ornekler)) FROM say_hafiza m WHERE m.firma_id = p_firma),
    'ozet', (SELECT jsonb_build_object('is', count(*)::int, 'iyi', count(*) FILTER (WHERE puan = 'iyi')::int, 'kotu', count(*) FILTER (WHERE puan = 'kotu')::int,
               'supheli', count(*) FILTER (WHERE puan = 'supheli')::int, 'maliyet', coalesce(round(avg(maliyet))::bigint, 0))
             FROM say_is WHERE firma_id = p_firma AND zaman > now() - interval '7 days'));
END $$;
REVOKE EXECUTE ON FUNCTION firma_yonetim_say(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_yonetim_say(uuid) TO probata_yonetim;

-- ── K3: konuşmanın Ar-Ge kaydı 12 ay (0116'nın süpürme işlevi aynen; yalnız süre) ──
CREATE OR REPLACE FUNCTION say_kapanis_supur(p_dakika integer DEFAULT 60, p_firma uuid DEFAULT NULL, p_hesap uuid DEFAULT NULL) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  k record;
  son record;
  n integer := 0;
  bildirim text;
  ileti_sayisi integer;
  arge jsonb;
BEGIN
  IF p_dakika IS NULL OR p_dakika < 1 THEN RAISE EXCEPTION 'süre dakika olarak 1 ya da daha büyük olmalı' USING ERRCODE = '22023'; END IF;
  FOR k IN
    SELECT firma_id, hesap_id FROM yz_konusma
    WHERE (p_firma IS NULL OR firma_id = p_firma) AND (p_hesap IS NULL OR hesap_id = p_hesap)
    GROUP BY firma_id, hesap_id HAVING max(zaman) < now() - make_interval(mins => p_dakika)
  LOOP
    -- politikalar (FORCE RLS sahibe de uygulanır) için işlemin bağlamı o kişi
    PERFORM set_config('app.firma_id', k.firma_id::text, true);
    PERFORM set_config('app.hesap_id', k.hesap_id::text, true);
    -- süren iş varsa dokunma
    IF EXISTS (SELECT 1 FROM yz_konusma_is i WHERE i.firma_id = k.firma_id AND i.hesap_id = k.hesap_id AND i.bitis > now()) THEN CONTINUE; END IF;
    -- iş bitmiş olmalı: son ileti (sayfa notu dışında) yapay zekânın ve açık araç çağrısı yok
    SELECT rol, icerik INTO son FROM yz_konusma WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id AND rol <> 'system' ORDER BY sira DESC LIMIT 1;
    IF NOT FOUND OR son.rol <> 'assistant' THEN CONTINUE; END IF;
    IF jsonb_typeof(son.icerik) = 'array' AND EXISTS (SELECT 1 FROM jsonb_array_elements(son.icerik) b WHERE b->>'type' = 'tool_use') THEN CONTINUE; END IF;
    -- Ar-Ge kaydı (2026-11-05 K3: 12 ay; eski kayıtlar silinir)
    DELETE FROM say_arge WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id AND zaman < now() - interval '365 days';
    SELECT count(*), coalesce(jsonb_agg(jsonb_build_object('rol', rol, 'bloklar', say_arge_icerik(icerik)) ORDER BY sira), '[]'::jsonb)
      INTO ileti_sayisi, arge FROM yz_konusma WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    INSERT INTO say_arge (firma_id, hesap_id, ileti, icerik) VALUES (k.firma_id, k.hesap_id, ileti_sayisi, arge);
    -- son bildirim → yeni konuşmanın başındaki not
    SELECT coalesce(string_agg(coalesce(b->>'text', ''), E'\n'), '') INTO bildirim
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(son.icerik) = 'array' THEN son.icerik ELSE '[]'::jsonb END) b WHERE b->>'type' = 'text';
    INSERT INTO yz_kapanis (firma_id, hesap_id, neden, son_bildirim) VALUES (k.firma_id, k.hesap_id, p_dakika::text || ' dakika geçti', left(bildirim, 2000))
      ON CONFLICT (firma_id, hesap_id) DO UPDATE SET neden = EXCLUDED.neden, zaman = clock_timestamp(), son_bildirim = EXCLUDED.son_bildirim;
    -- ekler: depodaki kopya çöpe (çöp süresi dolunca depodan silinir), hizmetteki dosya silinecekler listesine (fotoğraf hizmete yüklenmez: '-')
    UPDATE dosya d SET cop = now() WHERE d.firma_id = k.firma_id AND d.modul = 'say_ek' AND d.cop IS NULL
      AND d.kayit_id IN (SELECT e.id FROM yz_ek e WHERE e.firma_id = k.firma_id AND e.hesap_id = k.hesap_id);
    INSERT INTO yz_silinecek_dosya (firma_id, dosya)
      SELECT e.firma_id, e.dosya FROM yz_ek e WHERE e.firma_id = k.firma_id AND e.hesap_id = k.hesap_id AND e.dosya <> '-';
    DELETE FROM yz_ek_parca WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    DELETE FROM yz_ek WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    DELETE FROM yz_konusma WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    DELETE FROM yz_konusma_is WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    DELETE FROM yz_sohbet WHERE firma_id = k.firma_id AND hesap_id = k.hesap_id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
ALTER FUNCTION say_kapanis_supur(integer, uuid, uuid) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION say_kapanis_supur(integer, uuid, uuid) FROM PUBLIC;
