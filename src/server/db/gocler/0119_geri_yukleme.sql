-- ══ 0119 · YEDEKTEN GERİ YÜKLEME + AYLIK DOĞRULAMA (2026-11-04; reisim: "tamam koda başla" — maket claude.ai THfrK3AzKkg9S7DiRVKKF4, sunum
-- Vt3Kf6qPknVPqjUFCmB5Cd K1, K3–K6; K2 "Drive'dan indir" tuşu reisim'in kararıyla YOK) ══
-- (1) yedek_dogrulama: aylık doğrulamanın sonucu (kaynak, tamam mı, özet — tablo / kayıt / PDF sayıları ve sorunlar). Firmanın verisi değil,
--     yedeğin kendi kaydı (YEDEK_DISI).
-- (2) yedek_geri_yukleme: Yönetim'den yapılan geri yüklemelerin kaydı (kim, kaynak, yedeğin anı, durum, özet, önceki hâlin arşivdeki kopyası).
-- (3) yedek_arsiv tur "once": geri yüklemeden hemen önce alınan tam kopya (donem = YYYYAAGG"T"SSDDss, İstanbul) — "Geri dön" bundan kurar; 30 gün.
-- (4) yedek_geri_yukle(kayıt, veri): firmanın yedeklenen 63 tablosunu verilen hâle getirir — TEK VERİTABANI İŞLEMİNDE (yarıda kalmaz; hata olursa
--     hiçbir şey değişmez). Kullanıcı tetikleri (değişmezlik, akış, numara, yedek izi) bu işlem boyunca kapalı, işlev dönmeden açılır (DDL de işlemle
--     birlikte geri alınır — açık kalamaz). Yabancı anahtarlar AÇIK: silme ters, ekleme düz bağımlılık sırasıyla; boş bırakılabilen bağlar önce
--     boşaltılır, en sonda yedekteki değerleriyle yazılır (döngü ve kendine bağ). Yedekte olmayan geçici kayıtlar (S.A.Y, öneri, oturum) silinen
--     kaydı gösteriyorsa onlar da silinir. Gizli sütun (parola özeti) yedekte yok: var olan hesapta KORUNUR; yeni gelen hesapta boş — çağıran geçici
--     parola verir (dönen "parolasiz"). Çağrı yalnız aynı işlemde açılmış "suruyor" kaydıyla.
--     Not: kullanıcı tetiklerinin kapatılması tabloda SHARE ROW EXCLUSIVE kilidi alır — geri yükleme sürerken (saniyeler) öteki firmaların bu
--     tablolara yazması bekler; okuma sürer.
-- Kilit: tests/geri-yukleme.test.ts (gerçek PostgreSQL); olumsuz kanıt tests/bozan/geri-yukleme.bozan.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS yedek_dogrulama (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  zaman      timestamptz NOT NULL DEFAULT now(),
  kaynak     text NOT NULL CHECK (kaynak IN ('drive', 'arsiv')),
  tamam      boolean NOT NULL,
  ozet       jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(ozet) = 'object' AND pg_column_size(ozet) <= 20000),
  bildirildi boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS yedek_dogrulama_zaman ON yedek_dogrulama (firma_id, zaman DESC);
ALTER TABLE yedek_dogrulama ENABLE ROW LEVEL SECURITY;
ALTER TABLE yedek_dogrulama FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yedek_dogrulama' AND policyname = 'yedek_dogrulama_kiraci') THEN
    CREATE POLICY yedek_dogrulama_kiraci ON yedek_dogrulama USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;
REVOKE ALL ON yedek_dogrulama FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON yedek_dogrulama TO probata_uygulama;

CREATE TABLE IF NOT EXISTS yedek_geri_yukleme (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id   uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  basladi    timestamptz NOT NULL DEFAULT now(),
  bitti      timestamptz,
  kim        text NOT NULL CHECK (length(kim) BETWEEN 1 AND 300),
  kaynak     text NOT NULL CHECK (kaynak IN ('drive', 'arsiv', 'once')),
  yedek_ani  timestamptz,
  durum      text NOT NULL DEFAULT 'suruyor' CHECK (durum IN ('suruyor', 'tamam', 'hata')),
  ozet       jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(ozet) = 'object' AND pg_column_size(ozet) <= 50000),
  once_arsiv uuid,
  islem      bigint NOT NULL DEFAULT txid_current()
);
CREATE INDEX IF NOT EXISTS yedek_geri_yukleme_zaman ON yedek_geri_yukleme (firma_id, basladi DESC);
ALTER TABLE yedek_geri_yukleme ENABLE ROW LEVEL SECURITY;
ALTER TABLE yedek_geri_yukleme FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yedek_geri_yukleme' AND policyname = 'yedek_geri_yukleme_kiraci') THEN
    CREATE POLICY yedek_geri_yukleme_kiraci ON yedek_geri_yukleme USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;
REVOKE ALL ON yedek_geri_yukleme FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON yedek_geri_yukleme TO probata_uygulama;

-- önceki hâl kopyası
ALTER TABLE yedek_arsiv DROP CONSTRAINT IF EXISTS yedek_arsiv_tur_check;
ALTER TABLE yedek_arsiv DROP CONSTRAINT IF EXISTS yedek_arsiv_donem_check;
ALTER TABLE yedek_arsiv DROP CONSTRAINT IF EXISTS yedek_arsiv_check;
ALTER TABLE yedek_arsiv DROP CONSTRAINT IF EXISTS yedek_arsiv_tur_donem;
ALTER TABLE yedek_arsiv ADD CONSTRAINT yedek_arsiv_tur_donem CHECK (
  (tur = 'tam' AND donem ~ '^[0-9]{4}$') OR (tur = 'ay' AND donem ~ '^[0-9]{4}-[0-9]{2}$') OR (tur = 'once' AND donem ~ '^[0-9]{8}T[0-9]{6}$'));

/* yedeklenen tabloların listesi (src/server/yedek/tablolar.ts YEDEK_TABLOLARI ve 0117'nin tetik listesiyle AYNI — kilit tests/yedek-saf.test.ts) */
CREATE OR REPLACE FUNCTION yedek_tablolari() RETURNS text[]
  LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['arac', 'arac_km', 'arac_tutanagi', 'belge_doldurma', 'belge_format', 'belge_onay', 'bordro', 'cihaz_turu', 'demirbas',
    'denetim_izi', 'dokuman', 'dosya', 'egitim_kaydi', 'egitim_turu', 'ekipman', 'ekipman_atamasi', 'ekipman_kodu', 'ekipman_turu', 'fatura',
    'fatura_rapor', 'firma_ayar', 'fiyat_listesi', 'format_parca', 'gider', 'hesap', 'ice_aktarim', 'imza_istegi', 'is_sozlesmesi',
    'is_sozlesmesi_tesis', 'isg_katip', 'izin_talebi', 'kalibrasyon', 'kosul_kabul', 'musteri', 'musteri_hesap', 'numara_sayaci', 'olcum_cihazi',
    'ozluk_belgesi', 'personel', 'plan', 'plan_ekip', 'plan_ekipman', 'plan_not', 'rapor', 'rapor_format', 'rapor_hareket', 'rapor_revize_istegi',
    'rapor_surumu', 'saha_formu', 'saklama_silme', 'say_chat_ayar', 'sozlesme_sablon', 'standart', 'standart_tanim', 'tahsilat', 'teklif',
    'teklif_kalem', 'teklif_tesis', 'tesis', 'tur_format', 'uygunsuzluk', 'zimmet_formu', 'zimmet_hareket']::text[]
$$;
ALTER FUNCTION yedek_tablolari() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yedek_tablolari() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yedek_tablolari() TO probata_uygulama;

/* geri yükleme: p_veri = { "<tablo>": [satır, …], … } — yedeklenen HER tablonun istenen hâli (eksik tablo = boş). Dönen: tablo başına silinen /
   yazılan sayısı + parolasız kalan hesaplar. */
CREATE OR REPLACE FUNCTION yedek_geri_yukle(p_kayit uuid, p_veri jsonb) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  liste text[] := yedek_tablolari();
  sira text[] := '{}';
  kalan text[];
  ekle text[];
  t text;
  pk text[];
  pkj text;
  sutun text;
  bos text;
  geri text;
  yaz text;
  c record;
  n bigint;
  ozet jsonb := '{}'::jsonb;
  parolasiz jsonb;
BEGIN
  IF f IS NULL THEN RAISE EXCEPTION 'geri yükleme firma işleminde koşar' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM yedek_geri_yukleme g WHERE g.id = p_kayit AND g.firma_id = f AND g.durum = 'suruyor' AND g.islem = txid_current() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'geri yükleme kaydı yok ya da bu işlemde açılmadı' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(p_veri) <> 'object' THEN RAISE EXCEPTION 'geri yükleme verisi biçimsiz' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_veri) k WHERE k <> ALL (liste)) THEN
    RAISE EXCEPTION 'geri yükleme verisinde bilinmeyen tablo' USING ERRCODE = '22023';
  END IF;
  PERFORM set_config('lock_timeout', '15s', true);

  /* bağımlılık sırası: boş bırakılamayan bağlara göre (boş bırakılabilenler ayrıca) */
  kalan := liste;
  WHILE cardinality(kalan) > 0 LOOP
    SELECT coalesce(array_agg(x ORDER BY x), '{}') INTO ekle FROM unnest(kalan) x
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_constraint k
        WHERE k.contype = 'f' AND k.conrelid = ('public.' || x)::regclass AND k.confrelid <> k.conrelid
          AND k.confrelid::regclass::text = ANY (kalan)
          AND NOT EXISTS (SELECT 1 FROM unnest(k.conkey) a(n) JOIN pg_attribute p ON p.attrelid = k.conrelid AND p.attnum = a.n
                          WHERE NOT p.attnotnull AND p.attname <> 'firma_id'));
    IF cardinality(ekle) = 0 THEN RAISE EXCEPTION 'geri yükleme: tablolar arasında boş bırakılamayan döngü'; END IF;
    sira := sira || ekle;
    kalan := ARRAY(SELECT x FROM unnest(kalan) x WHERE x <> ALL (ekle));
  END LOOP;

  /* kullanıcı tetikleri kapalı (yalnız bu işlemde; dönmeden açılır) */
  FOREACH t IN ARRAY liste LOOP EXECUTE format('ALTER TABLE %I DISABLE TRIGGER USER', t); END LOOP;

  CREATE TEMP TABLE IF NOT EXISTS gy_parolasiz (tablo text, id uuid) ON COMMIT DROP;
  DELETE FROM gy_parolasiz;

  /* 1 · boş bırakılabilen bağlar boşaltılır (yedeklenen tablolara giden; kendine bağ dahil) */
  FOREACH t IN ARRAY liste LOOP
    SELECT string_agg(DISTINCT format('%I = NULL', p.attname), ', ') INTO bos
      FROM pg_constraint k JOIN unnest(k.conkey) a(n) ON true JOIN pg_attribute p ON p.attrelid = k.conrelid AND p.attnum = a.n
      WHERE k.contype = 'f' AND k.conrelid = ('public.' || t)::regclass AND k.confrelid::regclass::text = ANY (liste)
        AND NOT p.attnotnull AND p.attname <> 'firma_id';
    IF bos IS NOT NULL THEN EXECUTE format('UPDATE %I SET %s WHERE firma_id = $1', t, bos) USING f; END IF;
  END LOOP;

  /* 2 · yedekte olmayan satırlar silinir — ters sıra; onları gösteren geçici kayıtlar (yedek dışı tablolar) önce */
  FOR i IN REVERSE cardinality(sira) .. 1 LOOP
    t := sira[i];
    SELECT array_agg(p.attname ORDER BY array_position(x.indkey::int2[], p.attnum)) INTO pk
      FROM pg_index x JOIN pg_attribute p ON p.attrelid = x.indrelid AND p.attnum = ANY (x.indkey)
      WHERE x.indrelid = ('public.' || t)::regclass AND x.indisprimary;
    pkj := (SELECT string_agg(format('s.%1$I = y.%1$I', k), ' AND ') FROM unnest(pk) k);
    EXECUTE format('CREATE TEMP TABLE gy_sil ON COMMIT DROP AS SELECT s.* FROM %1$I s WHERE s.firma_id = $1 AND NOT EXISTS ('
      || 'SELECT 1 FROM jsonb_populate_recordset(NULL::%1$I, coalesce($2 -> %2$L, ''[]''::jsonb)) y WHERE %3$s)', t, t, pkj) USING f, p_veri;
    FOR c IN SELECT k.conrelid::regclass::text AS kaynak,
                    (SELECT string_agg(format('%I', pa.attname), ', ' ORDER BY u.o) FROM unnest(k.conkey) WITH ORDINALITY u(n, o)
                       JOIN pg_attribute pa ON pa.attrelid = k.conrelid AND pa.attnum = u.n) AS kaynak_s,
                    (SELECT string_agg(format('g.%I', pa.attname), ', ' ORDER BY u.o) FROM unnest(k.confkey) WITH ORDINALITY u(n, o)
                       JOIN pg_attribute pa ON pa.attrelid = k.confrelid AND pa.attnum = u.n) AS hedef_s
             FROM pg_constraint k
             WHERE k.contype = 'f' AND k.confrelid = ('public.' || t)::regclass AND k.conrelid::regclass::text <> ALL (liste)
               AND k.conrelid::regclass::text <> 'firma' LOOP
      EXECUTE format('DELETE FROM %I WHERE (%s) IN (SELECT %s FROM gy_sil g)', c.kaynak, c.kaynak_s, c.hedef_s);
    END LOOP;
    EXECUTE format('DELETE FROM %1$I s USING gy_sil y WHERE s.firma_id = $1 AND %2$s', t, pkj) USING f;
    GET DIAGNOSTICS n = ROW_COUNT;
    ozet := jsonb_set(ozet, ARRAY[t], jsonb_build_object('silinen', n));
    DROP TABLE gy_sil;
  END LOOP;

  /* 3 · ekle / güncelle — düz sıra; boş bırakılabilen bağlar boş; gizli sütun yeni satırda boş, var olanda korunur */
  FOREACH t IN ARRAY sira LOOP
    SELECT array_agg(p.attname ORDER BY array_position(x.indkey::int2[], p.attnum)) INTO pk
      FROM pg_index x JOIN pg_attribute p ON p.attrelid = x.indrelid AND p.attnum = ANY (x.indkey)
      WHERE x.indrelid = ('public.' || t)::regclass AND x.indisprimary;
    SELECT string_agg(format('%I', a.attname), ', ' ORDER BY a.attnum) INTO sutun FROM pg_attribute a
      WHERE a.attrelid = ('public.' || t)::regclass AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '' AND a.attidentity <> 'a';
    SELECT string_agg(CASE
        WHEN a.attname = 'firma_id' THEN '$1'
        /* gizli sütun yedekte yok: var olan satırın değeri (önerilen satır CHECK'ten geçmeli — 0030: ilk / etkin parola ister, hazır istemez) */
        WHEN a.attname = 'parola_ozeti' AND t = 'musteri_hesap' THEN
          'CASE WHEN y.durum = ''hazir'' THEN NULL ELSE (SELECT s.parola_ozeti FROM musteri_hesap s WHERE s.id = y.id AND s.firma_id = $1) END'
        WHEN a.attname = 'durum' AND t = 'musteri_hesap' THEN
          'CASE WHEN y.durum IN (''ilk'', ''etkin'') AND (SELECT s.parola_ozeti FROM musteri_hesap s WHERE s.id = y.id AND s.firma_id = $1) IS NULL '
          || 'THEN ''hazir'' ELSE y.durum END'
        WHEN a.attname = 'parola_ozeti' THEN format('(SELECT s.parola_ozeti FROM %I s WHERE s.id = y.id AND s.firma_id = $1)', t)
        WHEN EXISTS (SELECT 1 FROM pg_constraint k WHERE k.contype = 'f' AND k.conrelid = a.attrelid AND a.attnum = ANY (k.conkey)
                       AND k.confrelid::regclass::text = ANY (liste)) AND NOT a.attnotnull THEN 'NULL'
        ELSE format('y.%I', a.attname) END, ', ' ORDER BY a.attnum) INTO yaz FROM pg_attribute a
      WHERE a.attrelid = ('public.' || t)::regclass AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '' AND a.attidentity <> 'a';
    SELECT string_agg(format('%1$I = EXCLUDED.%1$I', a.attname), ', ' ORDER BY a.attnum) INTO geri FROM pg_attribute a
      WHERE a.attrelid = ('public.' || t)::regclass AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '' AND a.attidentity <> 'a'
        AND a.attname <> ALL (pk) AND a.attname <> 'firma_id';
    IF t IN ('hesap', 'musteri_hesap') THEN
      EXECUTE format('INSERT INTO gy_parolasiz SELECT %1$L, y.id FROM jsonb_populate_recordset(NULL::%1$I, coalesce($2 -> %1$L, ''[]''::jsonb)) y '
        || 'WHERE NOT EXISTS (SELECT 1 FROM %1$I s WHERE s.id = y.id AND s.firma_id = $1 AND s.parola_ozeti IS NOT NULL)', t) USING f, p_veri;
    END IF;
    EXECUTE format('INSERT INTO %1$I (%2$s) SELECT %3$s FROM jsonb_populate_recordset(NULL::%1$I, coalesce($2 -> %1$L, ''[]''::jsonb)) y '
      || 'ON CONFLICT (%4$s) DO %5$s', t, sutun, yaz, (SELECT string_agg(format('%I', k), ', ') FROM unnest(pk) k),
      CASE WHEN geri IS NULL THEN 'NOTHING' ELSE 'UPDATE SET ' || geri END) USING f, p_veri;
    GET DIAGNOSTICS n = ROW_COUNT;
    ozet := jsonb_set(ozet, ARRAY[t], coalesce(ozet -> t, '{}'::jsonb) || jsonb_build_object('yazilan', n));
  END LOOP;

  /* 4 · boş bırakılan bağlar yedekteki değerleriyle */
  FOREACH t IN ARRAY liste LOOP
    SELECT string_agg(DISTINCT format('%1$I = y.%1$I', p.attname), ', ') INTO bos
      FROM pg_constraint k JOIN unnest(k.conkey) a(n) ON true JOIN pg_attribute p ON p.attrelid = k.conrelid AND p.attnum = a.n
      WHERE k.contype = 'f' AND k.conrelid = ('public.' || t)::regclass AND k.confrelid::regclass::text = ANY (liste)
        AND NOT p.attnotnull AND p.attname <> 'firma_id';
    IF bos IS NULL THEN CONTINUE; END IF;
    SELECT array_agg(p.attname ORDER BY array_position(x.indkey::int2[], p.attnum)) INTO pk
      FROM pg_index x JOIN pg_attribute p ON p.attrelid = x.indrelid AND p.attnum = ANY (x.indkey)
      WHERE x.indrelid = ('public.' || t)::regclass AND x.indisprimary;
    EXECUTE format('UPDATE %1$I s SET %2$s FROM jsonb_populate_recordset(NULL::%1$I, coalesce($2 -> %1$L, ''[]''::jsonb)) y WHERE s.firma_id = $1 AND %3$s',
      t, bos, (SELECT string_agg(format('s.%1$I = y.%1$I', k), ' AND ') FROM unnest(pk) k)) USING f, p_veri;
  END LOOP;

  FOREACH t IN ARRAY liste LOOP EXECUTE format('ALTER TABLE %I ENABLE TRIGGER USER', t); END LOOP;

  /* açık oturumlar düşer */
  DELETE FROM oturum WHERE firma_id = f;
  DELETE FROM musteri_oturum WHERE firma_id = f;

  SELECT coalesce(jsonb_agg(jsonb_build_object('tablo', g.tablo, 'id', g.id)), '[]'::jsonb) INTO parolasiz
    FROM gy_parolasiz g
    WHERE (g.tablo = 'hesap' AND EXISTS (SELECT 1 FROM hesap h WHERE h.id = g.id AND h.firma_id = f AND h.parola_ozeti IS NULL AND h.durum <> 'pasif'))
       OR (g.tablo = 'musteri_hesap' AND EXISTS (SELECT 1 FROM musteri_hesap h WHERE h.id = g.id AND h.firma_id = f AND h.parola_ozeti IS NULL AND h.durum = 'hazir'));
  RETURN jsonb_build_object('tablolar', ozet, 'parolasiz', parolasiz);
END $$;
ALTER FUNCTION yedek_geri_yukle(uuid, jsonb) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yedek_geri_yukle(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yedek_geri_yukle(uuid, jsonb) TO probata_uygulama;

/* Yönetim: firmaların yedek durumu — 0118'in işlevi + son doğrulama ve son geri yükleme (dönüş türü değişti: önce kaldırılır) */
DROP FUNCTION IF EXISTS yonetim_yedek_durumlari();
CREATE FUNCTION yonetim_yedek_durumlari()
  RETURNS TABLE (firma_id uuid, saglayici text, durum text, son_kopya timestamptz, denetim timestamptz, tasima timestamptz,
                 bekleyen integer, gonderilen integer, tasinan integer, dogrulama timestamptz, dogrulama_tamam boolean, dogrulama_ozet jsonb,
                 dogrulama_kaynak text)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  PERFORM yonetim_kim();
  RETURN QUERY
    SELECT f.id, b.saglayici, b.durum, b.son_kopya, b.denetim, b.tasima,
      (SELECT count(*)::integer FROM bulut_kuyruk q WHERE q.firma_id = f.id AND q.durum = 'bekliyor'),
      (SELECT count(*)::integer FROM bulut_kuyruk q WHERE q.firma_id = f.id AND q.durum = 'gonderildi'),
      (SELECT count(*)::integer FROM saklama_silme k WHERE k.firma_id = f.id AND k.neden = 'drive'),
      d.zaman, d.tamam, d.ozet, d.kaynak
    FROM firma f
    LEFT JOIN bulut_baglanti b ON b.firma_id = f.id
    LEFT JOIN LATERAL (SELECT x.zaman, x.tamam, x.ozet, x.kaynak FROM yedek_dogrulama x WHERE x.firma_id = f.id ORDER BY x.zaman DESC LIMIT 1) d ON true
    WHERE b.firma_id IS NOT NULL OR d.zaman IS NOT NULL;
END $$;
REVOKE EXECUTE ON FUNCTION yonetim_yedek_durumlari() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION yonetim_yedek_durumlari() TO probata_yonetim;
