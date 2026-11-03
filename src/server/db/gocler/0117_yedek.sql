-- ══ 0117 · FİRMANIN KENDİ YEDEĞİ — Google Drive / OneDrive bağlantısı + değişiklik kaydı + aylık arşiv (2026-11-03; reisim: "yedekleme bağlantısı
--    neden yapılmıyor ? yapılsın firma ayarlardan kendi yedeğini otomatik alabiliyo olsun", "her gece tüm siteyi işlemeyelim yeni eklenenler eklensin
--    yedeğe yeter her günün ayrı ayrı yedeği olmasın" → sunum K1–K6 + fotoğraf düzeni A kabul) ══
-- 1. bulut_baglanti: firmanın bağlı hesabı (hizmet, hesap adresi, durum). Erişim anahtarı firma_sir'de ŞİFRELİ ("bulut_erisimi"), burada değil.
--    Kesilince satır kalır (durum "kesildi"): aynı hesap yeniden bağlanınca gönderilenler yeniden gitmez. "isliyor": aynı firmada aynı anda
--    tek gönderim (gece işi, "Şimdi yedekle", imzadan sonra) — 15 dakikada kendiliğinden düşer.
-- 2. bulut_izin: izin ekranına gidişin tek kullanımlık kaydı (durum kodu, PKCE doğrulayıcısı, kim başlattı; 15 dk) — dönüşte silinir.
-- 3. bulut_kuyruk: gönderilecek dosyalar (dosya kimliği başına TEK satır — bir dosya bir kez gider); yol ve ad sıraya girerken hesaplanır.
-- 4. bulut_yer: hizmetteki klasör / dosya kimlikleri (Google Drive yolla değil kimlikle çalışır) — hesap değişince silinir.
-- 5. yedek_degisiklik: yedeklenen tabloların SON hâli (satır başına tek kayıt; silinen satır işaretli) — yedek_iz tetiği yazar. Ay kapanınca
--    aylık arşive yazılır ve o aya kadarki kayıtlar silinir. Gizli sütun (parola özeti) tetikte atılır.
-- 6. yedek_arsiv: probata'nın deposundaki tam kopya (yılda bir) ve aylık değişiklik dosyaları; saklama süresi dolunca silinir (KOD-GECIS ENGEL 11).
-- Tetik listesi src/server/yedek/tablolar.ts YEDEK_TABLOLARI ile AYNI (kilit tests/yedek-saf.test.ts + tests/yedek.test.ts).
-- Politikalar "(SELECT gecerli_firma())" (0091); yabancı anahtarlar dizinli. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS bulut_baglanti (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  saglayici    text NOT NULL CHECK (saglayici IN ('gdrive', 'onedrive')),
  hesap        text NOT NULL CHECK (length(hesap) BETWEEN 1 AND 320),
  durum        text NOT NULL DEFAULT 'bagli' CHECK (durum IN ('bagli', 'kopuk', 'dolu', 'kesildi')),
  neden        text CHECK (neden IS NULL OR length(neden) <= 300),
  bildirildi   boolean NOT NULL DEFAULT false,
  baglandi     timestamptz NOT NULL DEFAULT now(),
  toplama      timestamptz,
  tam_kopya    timestamptz,
  ay_gonderim  timestamptz,
  son_kopya    timestamptz,
  son_dosya    text CHECK (son_dosya IS NULL OR length(son_dosya) <= 300),
  isliyor      timestamptz,
  surum        integer NOT NULL DEFAULT 0,
  olustu       timestamptz NOT NULL DEFAULT now(),
  degisti      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id)
);

CREATE TABLE IF NOT EXISTS bulut_izin (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  kod          text NOT NULL UNIQUE CHECK (kod ~ '^[A-Za-z0-9_-]{32,64}$'),
  dogrulayici  text NOT NULL CHECK (dogrulayici ~ '^[A-Za-z0-9_-]{43,128}$'),
  saglayici    text NOT NULL CHECK (saglayici IN ('gdrive', 'onedrive')),
  hesap_id     uuid NOT NULL,
  son          timestamptz NOT NULL DEFAULT now() + interval '15 minutes'
);
CREATE INDEX IF NOT EXISTS bulut_izin_firma ON bulut_izin (firma_id);

CREATE TABLE IF NOT EXISTS bulut_kuyruk (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  dosya_id     uuid NOT NULL,
  yol          text[] NOT NULL CHECK (cardinality(yol) BETWEEN 1 AND 8),
  ad           text NOT NULL CHECK (length(ad) BETWEEN 1 AND 200),
  durum        text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'gonderildi', 'yok')),
  deneme       integer NOT NULL DEFAULT 0 CHECK (deneme >= 0),
  hata         text CHECK (hata IS NULL OR length(hata) <= 300),
  boyut        bigint NOT NULL DEFAULT 0 CHECK (boyut >= 0),
  eklendi      timestamptz NOT NULL DEFAULT now(),
  gonderildi   timestamptz,
  UNIQUE (firma_id, dosya_id)
);
CREATE INDEX IF NOT EXISTS bulut_kuyruk_bekleyen ON bulut_kuyruk (firma_id, durum, eklendi);

CREATE TABLE IF NOT EXISTS bulut_yer (
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  yol          text NOT NULL CHECK (length(yol) BETWEEN 1 AND 2000),
  uzak_id      text NOT NULL CHECK (uzak_id ~ '^[A-Za-z0-9_!.-]{1,200}$'),
  PRIMARY KEY (firma_id, yol)
);

CREATE TABLE IF NOT EXISTS yedek_degisiklik (
  firma_id     uuid NOT NULL REFERENCES firma(id),
  tablo        text NOT NULL CHECK (tablo ~ '^[a-z_]{1,40}$'),
  anahtar      text NOT NULL,
  silindi      boolean NOT NULL DEFAULT false,
  satir        jsonb NOT NULL,
  zaman        timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (firma_id, tablo, anahtar)
);
CREATE INDEX IF NOT EXISTS yedek_degisiklik_zaman ON yedek_degisiklik (firma_id, zaman);

CREATE TABLE IF NOT EXISTS yedek_arsiv (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id     uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  tur          text NOT NULL CHECK (tur IN ('tam', 'ay')),
  donem        text NOT NULL CHECK (donem ~ '^[0-9]{4}(-[0-9]{2})?$'),
  -- depo kovasının tek dosya sınırı (30 MB) yüzünden 25 MB'lık parçalar; sırayla birleştirilir
  anahtarlar   text[] NOT NULL CHECK (cardinality(anahtarlar) BETWEEN 1 AND 400
                 AND array_to_string(anahtarlar, ',') ~ '^firma/[0-9a-f-]{36}/yedek_arsiv/[0-9a-f-]{36}/[0-9a-f-]{36}(,firma/[0-9a-f-]{36}/yedek_arsiv/[0-9a-f-]{36}/[0-9a-f-]{36})*$'),
  boyut        bigint NOT NULL CHECK (boyut > 0),
  sha256       text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  olustu       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, tur, donem),
  CHECK ((tur = 'tam') = (donem ~ '^[0-9]{4}$'))
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bulut_baglanti', 'bulut_izin', 'bulut_kuyruk', 'bulut_yer', 'yedek_degisiklik', 'yedek_arsiv'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_kiraci') THEN
      EXECUTE format('CREATE POLICY %I ON %I USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()))', t || '_kiraci', t);
    END IF;
    EXECUTE format('REVOKE ALL ON %I FROM PUBLIC', t);
  END LOOP;
END $$;
GRANT SELECT, INSERT, UPDATE ON bulut_baglanti TO probata_uygulama;
GRANT SELECT, INSERT, DELETE ON bulut_izin TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE ON bulut_kuyruk TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE, DELETE ON bulut_yer TO probata_uygulama;
GRANT SELECT, DELETE ON yedek_degisiklik TO probata_uygulama;
GRANT SELECT, INSERT, DELETE ON yedek_arsiv TO probata_uygulama;

/* değişiklik tetiği: satırın son hâli (gizli sütunlar atılmış) anahtarıyla; silinen satır işaretli. Birincil anahtar tetiğin ilk argümanında
   (virgüllü sütun adları), gizli sütunlar sonraki argümanlarda. Tanımlayıcı-yetkili: uygulama rolünün yedek_degisiklik'e yazma hakkı yok; satır
   yalnız tetikten girer (firma süzgeci aynı politika — satırın firması işlemin firmasıyla aynı olmalı). Anahtarı değişen satırın eski anahtarı
   silindi olarak düşer. */
CREATE OR REPLACE FUNCTION yedek_iz() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  yeni jsonb; eski jsonb; k text; ek text; i integer;
BEGIN
  IF TG_OP <> 'INSERT' THEN eski := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN yeni := to_jsonb(NEW); END IF;
  FOR i IN 1 .. TG_NARGS - 1 LOOP
    eski := eski - TG_ARGV[i];
    yeni := yeni - TG_ARGV[i];
  END LOOP;
  IF eski IS NOT NULL THEN
    SELECT string_agg(coalesce(eski ->> s, ''), '|' ORDER BY o) INTO ek FROM unnest(string_to_array(TG_ARGV[0], ',')) WITH ORDINALITY AS u(s, o);
  END IF;
  IF yeni IS NOT NULL THEN
    SELECT string_agg(coalesce(yeni ->> s, ''), '|' ORDER BY o) INTO k FROM unnest(string_to_array(TG_ARGV[0], ',')) WITH ORDINALITY AS u(s, o);
    INSERT INTO yedek_degisiklik (firma_id, tablo, anahtar, silindi, satir, zaman)
      VALUES ((yeni ->> 'firma_id')::uuid, TG_TABLE_NAME, k, false, yeni, clock_timestamp())
      ON CONFLICT (firma_id, tablo, anahtar) DO UPDATE SET silindi = false, satir = EXCLUDED.satir, zaman = EXCLUDED.zaman;
  END IF;
  IF eski IS NOT NULL AND ek IS DISTINCT FROM k THEN
    INSERT INTO yedek_degisiklik (firma_id, tablo, anahtar, silindi, satir, zaman)
      VALUES ((eski ->> 'firma_id')::uuid, TG_TABLE_NAME, ek, true, eski, clock_timestamp())
      ON CONFLICT (firma_id, tablo, anahtar) DO UPDATE SET silindi = true, satir = EXCLUDED.satir, zaman = EXCLUDED.zaman;
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION yedek_iz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION yedek_iz() FROM PUBLIC;

DO $$
DECLARE r record; pk text;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('arac', ''), ('arac_km', ''), ('arac_tutanagi', ''), ('belge_doldurma', ''), ('belge_format', ''), ('belge_onay', ''), ('bordro', ''),
    ('cihaz_turu', ''), ('demirbas', ''), ('denetim_izi', ''), ('dokuman', ''), ('dosya', ''), ('egitim_kaydi', ''), ('egitim_turu', ''),
    ('ekipman', ''), ('ekipman_atamasi', ''), ('ekipman_kodu', ''), ('ekipman_turu', ''), ('fatura', ''), ('fatura_rapor', ''), ('firma_ayar', ''),
    ('fiyat_listesi', ''), ('format_parca', ''), ('gider', ''), ('hesap', 'parola_ozeti'), ('ice_aktarim', ''), ('imza_istegi', ''),
    ('is_sozlesmesi', ''), ('is_sozlesmesi_tesis', ''), ('isg_katip', ''), ('izin_talebi', ''), ('kalibrasyon', ''), ('kosul_kabul', ''),
    ('musteri', ''), ('musteri_hesap', 'parola_ozeti'), ('numara_sayaci', ''), ('olcum_cihazi', ''), ('ozluk_belgesi', ''), ('personel', ''),
    ('plan', ''), ('plan_ekip', ''), ('plan_ekipman', ''), ('plan_not', ''), ('rapor', ''), ('rapor_format', ''), ('rapor_hareket', ''),
    ('rapor_revize_istegi', ''), ('rapor_surumu', ''), ('saha_formu', ''), ('saklama_silme', ''), ('say_chat_ayar', ''), ('sozlesme_sablon', ''),
    ('standart', ''), ('standart_tanim', ''), ('tahsilat', ''), ('teklif', ''), ('teklif_kalem', ''), ('teklif_tesis', ''), ('tesis', ''),
    ('tur_format', ''), ('uygunsuzluk', ''), ('zimmet_formu', ''), ('zimmet_hareket', '')
  ) AS v(tablo, gizli) LOOP
    SELECT string_agg(a.attname, ',' ORDER BY array_position(i.indkey::int2[], a.attnum)) INTO pk
      FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
      WHERE i.indrelid = ('public.' || r.tablo)::regclass AND i.indisprimary;
    IF pk IS NULL THEN RAISE EXCEPTION 'yedek: % tablosunun birincil anahtarı yok', r.tablo; END IF;
    EXECUTE format('CREATE OR REPLACE TRIGGER yedek_iz AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION yedek_iz(%L%s)',
      r.tablo, pk, CASE WHEN r.gizli = '' THEN '' ELSE ', ' || quote_literal(r.gizli) END);
  END LOOP;
END $$;
