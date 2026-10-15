-- ══ 0096 · MERKEZ KAYDI — kendi projeli firmanın bağlantısı ve kurulumu (FIRMA-VT.md FV2, §4, §5.1–5.4, §5.11, §5.12; sunum 579, reisim onayı 2026-10-15) ══
-- Merkez = ortak proje (karar §3.1). Kendi Supabase projesinde çalışan firmanın merkezdeki satırı yalnız KAYITTIR (firma.vt = 'kendi', 0095); verisine
-- nasıl bağlanılacağı burada, firma_vt satırında durur. Kurulumun (FV10) adımları firma_kurulum satırında ilerler.
-- · firma_vt: ref, havuzcu sunucusu, kapı, veritabanı adı, kullanıcı (yalnız probata_uygulama[.ref] — kayıt ayrıcalıklı role yöneltilemez), uygulama
--   parolası ŞİFRELİ (bekleyen + geçerli: §5.4 sırası — önce bekleyen yazılır, sonra ALTER ROLE, sonra onaylanır ve sürüm artar), Storage adresi + gizli
--   anahtar ŞİFRELİ + kova, sürüm (havuz anahtarı), son göç / göç sayısı / son sağlık, göç dışı ("bakımda") + gerekçe. Şifre çözme UYGULAMADA
--   (src/server/db/baglanti.ts; ek veri firma + ref + ad — satır başka firmaya ya da başka projeye kopyalansa çözülmez); veritabanında anahtar yok.
-- · firma_kurulum: adım, durum, kira (aynı anda tek ilerleten; 90 sn), deneme sayısı, maskeli hata + kısa hata kodu, şifreli geçici girdi (sahip
--   parolası, yapay zekâ anahtarı — "tamam"da boşalır), ilk firma yöneticisinin adı / e-postası (firma veritabanında firma_kur — FV9 — için).
-- · Bu iki tabloyu uygulama rolü doğrudan okuyamaz / yazamaz; politika yalnız probata_yonetim (uygulama rolü o role GEÇEBİLİR — 0050; güven düzeyi
--   bugünküyle aynı, FIRMA-VT §5.11). Uygulama firma_coz / firma_coz_id ile yalnız ETKİN firmanın — kendi projelide yalnız kurulumu tamam ve göç dışı
--   değilken — bağlantı kaydını alır, şifreli metin olduğu gibi. ASIL KORUMA ana anahtar + ek veri (çözme yalnız uygulamada, firma + ref + ada bağlı);
--   işlevlerin öteki denetimleri kaza önlemidir. Merkez olmayan veritabanında (firma veritabanı) çağrılırsa RED (yanlış havuz).
-- · firma.durum'a 'kurulum' (yalnız kendi projeli firmada): kurulumdaki firma alt alan adından bulunmaz, girilmez, gece işine girmez.
-- · Yönetim işlevleri: yonetim_firma_baglanti, goc_hedefleri (göç dağıtıcı — yöneticisiz yönetim rolüyle de çalışır), yonetim_firma_kayit_ac (kurulum
--   adım 0), firma_kurulum_kira / firma_kurulum_ilerlet; yonetim_firmalar yeni sütunlarla (dönüş tipi değişti → DROP + CREATE + GRANT);
--   yonetim_firma_durum kendi projeli firmada merkezde YALNIZ durum + iz; yonetim_gecici_parola kendi projeli firmada HİÇBİR ŞEY yazmaz ({hata:
--   'kendi'}) — parola firma veritabanında değişir, iz ancak o başarılı olunca yazılır (ikisi de FV9).
-- 2026-10-15 (FV2 incelemesi): işlevlerin arama yolunda geçici şema EN SONDA (pg_catalog, public, pg_temp — 0010 kuralı; yalnız "public" yazılırsa
-- PostgreSQL tablo adlarında geçici şemaya EN ÖNCE bakar, çağıranın geçici tablosu tanımlayıcı-yetkili işlevin tablosunu gölgeler); 0095'in dört
-- işlevi de burada sıkılaştırıldı. Storage adresi kaydın projesine bağlı; Storage üçü (adres, gizli anahtar, kova) birlikte; hata metni reddedilmez,
-- MASKELENİR (red ayrıntısı sırrı günlüğe yazıyordu); kurulum sırrının eki ref'siz.
-- Kilit: tests/merkez-kaydi.test.ts · tests/yayin.test.ts (arama yolu) · olumsuz kanıt tests/bozan/firma-baglanti.bozan.ts. ⛔ IDEMPOTENT. RLS ifadeleri düz
-- metin (tests/yardimci/denetimler.ts rlsEksikTablolar); işlevler search_path'li (tests/yayin.test.ts); yabancı anahtarların dizini birincil anahtar.

-- ── firma durumu: 'kurulum' (yalnız kendi projeli firma) ─────────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'firma_durum_check' AND conrelid = 'firma'::regclass
             AND pg_get_constraintdef(oid) NOT LIKE '%kurulum%') THEN
    ALTER TABLE firma DROP CONSTRAINT firma_durum_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'firma_durum_check' AND conrelid = 'firma'::regclass) THEN
    ALTER TABLE firma ADD CONSTRAINT firma_durum_check CHECK (durum IN ('etkin', 'dondu', 'kurulum'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'firma_kurulum_kendi' AND conrelid = 'firma'::regclass) THEN
    ALTER TABLE firma ADD CONSTRAINT firma_kurulum_kendi CHECK (durum <> 'kurulum' OR vt = 'kendi');
  END IF;
END $$;

-- ── kendi projeli firmanın bağlantı kaydı (merkez) ───────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS firma_vt (
  firma_id                 uuid PRIMARY KEY REFERENCES firma(id),
  -- Supabase proje kimliği (yerel geliştirme / testte yok)
  ref                      text CHECK (ref IS NULL OR ref ~ '^[a-z0-9]{20}$'),
  -- havuzcu: yalnız Supabase AB (Frankfurt) havuzcusu; yerel adres yalnız yerel geliştirme / test (uygulama ayrıca denetler: src/server/db/baglanti.ts)
  sunucu                   text CHECK (sunucu IS NULL OR sunucu ~ '^aws-[0-9]{1,2}-eu-central-1\.pooler\.supabase\.com$' OR sunucu IN ('127.0.0.1', 'localhost', '::1')),
  kapi                     integer CHECK (kapi IS NULL OR kapi BETWEEN 1 AND 65535),
  vt_ad                    text CHECK (vt_ad IS NULL OR vt_ad ~ '^[a-z_][a-z0-9_]{0,62}$'),
  -- yalnız uygulama rolü (havuzcunun biçimi: probata_uygulama.<ref>) — kayıt sahip ya da başka ayrıcalıklı role yöneltilemez
  kullanici                text CHECK (kullanici IS NULL OR kullanici ~ '^probata_uygulama(\.[a-z0-9]{20})?$'),
  -- AES-256-GCM (v1.<iv>.<etiket>.<gövde>); ek veri probata:baglanti:v1:<firma>:<ref>:uygulama_parolasi
  parola_sifreli           text CHECK (parola_sifreli IS NULL OR parola_sifreli ~ '^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'),
  parola_bekleyen_sifreli  text CHECK (parola_bekleyen_sifreli IS NULL OR parola_bekleyen_sifreli ~ '^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'),
  depo_url                 text CHECK (depo_url IS NULL OR depo_url ~ '^https://[a-z0-9]{20}\.supabase\.co$' OR depo_url ~ '^http://(127\.0\.0\.1|localhost)(:[0-9]{1,5})?$'),
  -- ek veri probata:baglanti:v1:<firma>:<ref>:depo_gizli
  depo_gizli_sifreli       text CHECK (depo_gizli_sifreli IS NULL OR depo_gizli_sifreli ~ '^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'),
  kova                     text CHECK (kova IS NULL OR kova ~ '^[a-z0-9][a-z0-9_-]{2,62}$'),
  -- bağlantı her değiştiğinde artar (havuz anahtarı firma:ref:sürüm — FV3)
  surum                    integer NOT NULL DEFAULT 0 CHECK (surum >= 0),
  son_goc                  text CHECK (son_goc IS NULL OR son_goc ~ '^[0-9]{4}_[a-z0-9_]+\.sql$'),
  goc_sayisi               integer CHECK (goc_sayisi IS NULL OR goc_sayisi >= 0),
  son_saglik               jsonb CHECK (son_saglik IS NULL OR jsonb_typeof(son_saglik) = 'object'),
  son_saglik_zaman         timestamptz,
  -- "bakımda": yönetim gerekçeyle koyar (FV13); o firma çözülmez, göç dağıtımı onu atlar
  goc_disi                 boolean NOT NULL DEFAULT false,
  goc_disi_gerekce         text CHECK (goc_disi_gerekce IS NULL OR length(btrim(goc_disi_gerekce)) BETWEEN 10 AND 500),
  olustu                   timestamptz NOT NULL DEFAULT now(),
  degisti                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT firma_vt_goc_disi CHECK (NOT goc_disi OR goc_disi_gerekce IS NOT NULL),
  CONSTRAINT firma_vt_uzak_ref CHECK (sunucu IS NULL OR sunucu IN ('127.0.0.1', 'localhost', '::1') OR ref IS NOT NULL),
  CONSTRAINT firma_vt_kullanici_ref CHECK (kullanici IS NULL OR kullanici = CASE WHEN ref IS NULL THEN 'probata_uygulama' ELSE 'probata_uygulama.' || ref END),
  -- Storage üçü birlikte: yarım depo bilgisiyle firma hiç çözülemezdi (src/server/db/merkez.ts cozumOku "bozuk: depo")
  CONSTRAINT firma_vt_depo_tam CHECK ((depo_url IS NULL) = (depo_gizli_sifreli IS NULL) AND (depo_url IS NULL) = (kova IS NULL)),
  -- Storage adresi kaydın KENDİ projesinin (gizli anahtarın ek verisi ref'e bağlı, adres de): uzakta https://<ref>.supabase.co, ref yoksa yalnız yerel
  -- (uygulama ayrıca: src/server/db/baglanti.ts depoBaglantisi — adres tutmazsa anahtar çözülmez)
  CONSTRAINT firma_vt_depo_ref CHECK (depo_url IS NULL OR (ref IS NOT NULL AND depo_url = 'https://' || ref || '.supabase.co')
                                      OR (ref IS NULL AND depo_url ~ '^http://(127\.0\.0\.1|localhost)(:[0-9]{1,5})?$'))
);
ALTER TABLE firma_vt ENABLE ROW LEVEL SECURITY;
ALTER TABLE firma_vt FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firma_vt' AND policyname = 'firma_vt_yonetim') THEN
    CREATE POLICY firma_vt_yonetim ON firma_vt TO probata_yonetim USING (true) WITH CHECK (true);
  END IF;
END $$;
REVOKE ALL ON firma_vt FROM PUBLIC;
-- yönetim okur; bağlantı alanlarını yalnız kurulum işlevleri yazar; göç dağıtıcı (FV4 / FV8) ve sağlık (FV7) yalnız son durum sütunlarını
GRANT SELECT ON firma_vt TO probata_yonetim;
GRANT UPDATE (son_goc, goc_sayisi, son_saglik, son_saglik_zaman) ON firma_vt TO probata_yonetim;

-- ── kurulum hata metninin maskesi (tablodan ÖNCE: firma_kurulum.hata denetimi bu işleve bakar) ─────────────────────────────────────────
-- Birinci kilit uygulamada (FV8 hata/maske.ts); bu ikincisi. Supabase kişisel / gizli anahtarı, Resend anahtarı, JWT ve parolalı bağlantı dizesinin
-- parolası maskelenir, metin 500 karaktere kısaltılır. 2026-10-15 (FV2 incelemesi): önceki biçim denetimi bu metni REDDEDİYORDU — red iletisinin
-- ayrıntısı ("Failing row contains …", tanımlayıcı RLS'i aştığı için) reddedilen sırrı ve yöneticinin e-postasını istemciye ve sunucu günlüğüne
-- yazıyordu; uzun ya da desene takılan bir hata metni de bütün ilerletmeyi düşürüyordu (kurulum kendi hatasını yazamazdı). Artık metin maskelenir;
-- tablonun denetimi yalnız "saklanan metin maskelenmiş" der (maske(metin) = metin — desenler tek yerde).
CREATE OR REPLACE FUNCTION kurulum_hata_maskele(p_metin text) RETURNS text
  LANGUAGE sql IMMUTABLE SET search_path = pg_catalog, public, pg_temp
  AS $$ SELECT NULLIF(btrim(left(
    regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(p_metin,
      'sbp_[0-9a-f]{20}[0-9a-f]*', 'sbp_***', 'g'),
      'sb_secret_[A-Za-z0-9_-]{8}[A-Za-z0-9_-]*', 'sb_secret_***', 'g'),
      '\mre_[A-Za-z0-9]{6,}_[A-Za-z0-9]{16}[A-Za-z0-9]*', 're_***', 'g'),
      'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_.-]*', 'eyJ***', 'g'),
      '://[^/@[:space:]]+:[^/@[:space:]]+@', '://***@', 'g'),
    500)), '') $$;

-- ── kurulum durumu (merkez; §5.12) ───────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS firma_kurulum (
  firma_id    uuid PRIMARY KEY REFERENCES firma(id),
  adim        text NOT NULL DEFAULT 'proje' CHECK (adim IN ('kayit', 'proje', 'hazir', 'ssl', 'goc', 'vt_kimlik', 'rol', 'havuzcu', 'depo', 'dene',
                                                          'firma', 'eposta', 'yz', 'tamam')),
  -- bekliyor · calisiyor · hata (yeniden denenir) · durdu (kalıcı hata: "Sürdür" ister) · tamam
  durum       text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'calisiyor', 'hata', 'durdu', 'tamam')),
  -- aynı anda tek ilerleten: kirayı alan belirteci taşır; süresi dolunca başkası alır
  kira        uuid,
  kira_bitis  timestamptz,
  deneme      integer NOT NULL DEFAULT 0 CHECK (deneme BETWEEN 0 AND 1000),
  -- maskeli hata metni (uygulama maskeler — FV8 hata/maske.ts; ilerletme işlevi yeniden maskeler — kurulum_hata_maskele; burada yalnız "maskelenmiş")
  hata        text CHECK (hata IS NULL OR (length(hata) BETWEEN 1 AND 500 AND hata = kurulum_hata_maskele(hata))),
  -- kısa hata kodu (402, 403, goc, sertifika, sunucu …): yönetim izine yalnız bu gider — metin değil (iz silinemez, maske bir biçimi kaçırabilir)
  hata_kodu   text CHECK (hata_kodu IS NULL OR hata_kodu ~ '^[a-z0-9_]{1,40}$'),
  -- şifreli geçici girdi: {"kurulum_sahip": "v1…", "kurulum_yz": "v1…"} (ek veri probata:baglanti:v1:<firma>::<ad> — ref HER ZAMAN boş, proje açılmadan
  -- yazılır: src/server/db/baglanti.ts kurulumSifrele); "tamam"da boşalır
  girdi       jsonb CHECK (girdi IS NULL OR (jsonb_typeof(girdi) = 'object' AND girdi <> '{}'::jsonb
                                             AND girdi - ARRAY['kurulum_sahip', 'kurulum_yz'] = '{}'::jsonb
                                             AND coalesce(girdi->>'kurulum_sahip', 'v1.') LIKE 'v1.%'
                                             AND coalesce(girdi->>'kurulum_yz', 'v1.') LIKE 'v1.%')),
  -- ilk firma yöneticisi (firma veritabanında açılır — FV9 firma_kur)
  yon_ad      text CHECK (yon_ad IS NULL OR length(yon_ad) BETWEEN 3 AND 80),
  yon_eposta  text CHECK (yon_eposta IS NULL OR (yon_eposta = lower(yon_eposta) AND position('@' in yon_eposta) > 1 AND length(yon_eposta) <= 254)),
  basladi     timestamptz NOT NULL DEFAULT now(),
  degisti     timestamptz NOT NULL DEFAULT now(),
  bitti       timestamptz,
  CONSTRAINT firma_kurulum_kira_tutarli CHECK ((kira IS NULL) = (kira_bitis IS NULL)),
  CONSTRAINT firma_kurulum_tamam CHECK ((adim = 'tamam') = (durum = 'tamam')),
  CONSTRAINT firma_kurulum_tamam_bos CHECK (durum <> 'tamam' OR (girdi IS NULL AND kira IS NULL AND bitti IS NOT NULL))
);
ALTER TABLE firma_kurulum ENABLE ROW LEVEL SECURITY;
ALTER TABLE firma_kurulum FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firma_kurulum' AND policyname = 'firma_kurulum_yonetim') THEN
    CREATE POLICY firma_kurulum_yonetim ON firma_kurulum TO probata_yonetim USING (true) WITH CHECK (true);
  END IF;
END $$;
REVOKE ALL ON firma_kurulum FROM PUBLIC;
GRANT SELECT ON firma_kurulum TO probata_yonetim;

-- ── bu veritabanı merkez mi (firma veritabanında merkez işlevi çağrılırsa yanlış havuz) ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION vt_merkez_dogrula() RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vt_kimlik WHERE tek AND tur = 'ortak') THEN
    RAISE EXCEPTION 'Bu veritabanı merkez değil' USING ERRCODE = '42501';
  END IF;
  RETURN true;
END $$;

-- ── firma çözümü (yönlendirme — FV3): ortak firma {id, kisa_ad, vt}; kendi projeli firma + bağlantı kaydı (şifreli alanlar şifreli) ──────
-- Yalnız etkin firma; kendi projelide yalnız kurulumu tamam, göç dışı değil ve bağlantısı tam iken. Öteki her durumda NULL (kapalı yönde).
CREATE OR REPLACE FUNCTION firma_coz_id(p_id uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_ben     text := NULLIF(current_setting('app.firma_id', true), '');
  f         firma%ROWTYPE;
  v         firma_vt%ROWTYPE;
  v_kurulum text;
BEGIN
  PERFORM vt_merkez_dogrula();
  IF p_id IS NULL THEN RETURN NULL; END IF;
  -- kiracı işleminin içinden başka firmanın kaydı istenmez: KAZA ÖNLEMİ (yanlış kimlikle çağrı erken düşsün). GÜVENLİK SINIRI DEĞİL — uygulama rolü
  -- aynı işlemde app.firma_id'yi boşaltabilir ya da işlem dışından çağırabilir; dönen yalnız şifreli metin, koruma ana anahtar + ek veri (baglanti.ts).
  -- Yeni bir güvenlik kararı bu denetime dayandırılmaz (2026-10-15, FV2 incelemesi).
  IF v_ben IS NOT NULL AND lower(v_ben) <> p_id::text THEN
    RAISE EXCEPTION 'Kiracı işleminde başka firmanın kaydı okunmaz' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO f FROM firma WHERE id = p_id AND durum = 'etkin';
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF f.vt = 'ortak' THEN
    RETURN jsonb_build_object('id', f.id, 'kisa_ad', f.kisa_ad, 'vt', 'ortak');
  END IF;
  SELECT * INTO v FROM firma_vt WHERE firma_id = p_id;
  SELECT durum INTO v_kurulum FROM firma_kurulum WHERE firma_id = p_id;
  IF v.firma_id IS NULL
     OR v_kurulum IS DISTINCT FROM 'tamam'
     OR v.goc_disi
     OR v.sunucu IS NULL OR v.kapi IS NULL OR v.vt_ad IS NULL OR v.kullanici IS NULL OR v.parola_sifreli IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object('id', f.id, 'kisa_ad', f.kisa_ad, 'vt', 'kendi',
    'ref', v.ref, 'sunucu', v.sunucu, 'kapi', v.kapi, 'vt_ad', v.vt_ad, 'kullanici', v.kullanici, 'parola', v.parola_sifreli,
    'depo_url', v.depo_url, 'depo_gizli', v.depo_gizli_sifreli, 'kova', v.kova, 'surum', v.surum);
END $$;

CREATE OR REPLACE FUNCTION firma_coz(p_kisa_ad text) RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
  AS $$ SELECT firma_coz_id((SELECT id FROM firma WHERE kisa_ad = p_kisa_ad)) $$;

-- ── yönetim: firmanın bağlantı kaydı (yönetim işi — FV9; dondurulmuşta da, çünkü etkinleştirme firma tarafına bağlanır) ──────────────────
CREATE OR REPLACE FUNCTION yonetim_firma_baglanti(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  f firma%ROWTYPE;
  v firma_vt%ROWTYPE;
  k firma_kurulum%ROWTYPE;
BEGIN
  PERFORM yonetim_kim();
  SELECT * INTO f FROM firma WHERE id = p_firma;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF f.vt = 'ortak' THEN
    RETURN jsonb_build_object('id', f.id, 'kisa_ad', f.kisa_ad, 'durum', f.durum, 'vt', 'ortak');
  END IF;
  SELECT * INTO v FROM firma_vt WHERE firma_id = p_firma;
  SELECT * INTO k FROM firma_kurulum WHERE firma_id = p_firma;
  RETURN jsonb_build_object('id', f.id, 'kisa_ad', f.kisa_ad, 'durum', f.durum, 'vt', 'kendi',
    'ref', v.ref, 'sunucu', v.sunucu, 'kapi', v.kapi, 'vt_ad', v.vt_ad, 'kullanici', v.kullanici, 'parola', v.parola_sifreli,
    'depo_url', v.depo_url, 'depo_gizli', v.depo_gizli_sifreli, 'kova', v.kova, 'surum', v.surum, 'goc_disi', coalesce(v.goc_disi, false),
    'kurulum', CASE WHEN k.firma_id IS NULL THEN NULL ELSE jsonb_build_object('adim', k.adim, 'durum', k.durum) END);
END $$;

-- ── göç dağıtıcının dolaşacağı kendi projeli firmalar (FV4 / FV8): açılış sırasıyla, göç dışı olanlar hariç, bağlantı kaydıyla ──────────────
-- Yöneticisiz çalışır (derleme adımında yönetici yok): EXECUTE yalnız yönetim rolünde (ve sahipte). Uygulama rolü doğrudan çağıramaz ama yönetim rolüne
-- geçebilir (0050) — dönen parola şifreli metin; koruma ana anahtar + ek veri, bu hak değil.
CREATE OR REPLACE FUNCTION goc_hedefleri()
  RETURNS TABLE (firma_id uuid, kisa_ad text, durum text, ref text, sunucu text, kapi integer, vt_ad text, kullanici text, parola_sifreli text,
                 surum integer, son_goc text, goc_sayisi integer, kurulum_adim text, kurulum_durum text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
  AS $$
    SELECT f.id, f.kisa_ad, f.durum, v.ref, v.sunucu, v.kapi, v.vt_ad, v.kullanici, v.parola_sifreli, v.surum, v.son_goc, v.goc_sayisi, k.adim, k.durum
    FROM firma f
    JOIN firma_vt v ON v.firma_id = f.id
    LEFT JOIN firma_kurulum k ON k.firma_id = f.id
    WHERE f.vt = 'kendi' AND NOT v.goc_disi AND (v.ref IS NOT NULL OR v.sunucu IS NOT NULL)
    ORDER BY f.olusturuldu, f.id $$;

-- ── kurulum adım 0 (kayit): firma (kendi, kurulum) + boş bağlantı kaydı + kurulum satırı + yönetim izine niyet kaydı ─────────────────────
-- Dönen: {"id": …} ya da {"hata": "kisa_ad" | "rapor_kodu" | "ayrilmis" | "gecersiz"} — denetimler yonetim_firma_ac (0050) ile aynı.
CREATE OR REPLACE FUNCTION yonetim_firma_kayit_ac(p_ad text, p_kisa_ad text, p_rapor_kodu text, p_yon_ad text, p_yon_eposta text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_kim();
  v_id  uuid := gen_random_uuid();
BEGIN
  PERFORM vt_merkez_dogrula();
  IF p_kisa_ad IS NULL OR p_kisa_ad !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' OR p_rapor_kodu IS NULL OR p_rapor_kodu !~ '^[A-Z]{2}$'
     OR p_ad IS NULL OR length(btrim(p_ad)) NOT BETWEEN 1 AND 160 OR p_yon_ad IS NULL OR length(p_yon_ad) NOT BETWEEN 3 AND 80 OR p_yon_ad !~ '\S+\s+\S+'
     OR p_yon_eposta IS NULL OR p_yon_eposta <> lower(p_yon_eposta) OR position('@' in p_yon_eposta) < 2 OR length(p_yon_eposta) > 254 THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  IF p_kisa_ad = ANY (ARRAY['www', 'yonetim', 'api', 'mail', 'destek', 'probata', 'test', 'demo']) THEN
    RETURN jsonb_build_object('hata', 'ayrilmis');
  END IF;
  -- eşzamanlı iki açılış aynı adı / kodu almasın (0050 ile aynı kilit)
  LOCK TABLE firma IN SHARE ROW EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM firma WHERE kisa_ad = p_kisa_ad) THEN RETURN jsonb_build_object('hata', 'kisa_ad'); END IF;
  IF EXISTS (SELECT 1 FROM firma WHERE rapor_kodu = p_rapor_kodu) THEN RETURN jsonb_build_object('hata', 'rapor_kodu'); END IF;
  INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt, durum) VALUES (v_id, p_kisa_ad, btrim(p_ad), p_rapor_kodu, 'kendi', 'kurulum');
  INSERT INTO firma_vt (firma_id) VALUES (v_id);
  INSERT INTO firma_kurulum (firma_id, adim, durum, yon_ad, yon_eposta) VALUES (v_id, 'proje', 'bekliyor', p_yon_ad, p_yon_eposta);
  INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
    VALUES (v_kim, 'firma.kurulum_basladi', v_id, jsonb_build_object('kisa_ad', p_kisa_ad, 'rapor_kodu', p_rapor_kodu, 'yonetici', p_yon_eposta, 'vt', 'kendi'));
  RETURN jsonb_build_object('id', v_id);
END $$;

-- ── kurulum kirası: aynı anda tek ilerleten (sayfa 3 sn'de bir sorar; 40 sn bütçe; kira 90 sn) ───────────────────────────────────────────
-- Dönen: {"kira", "kira_bitis", "adim", "durum", "deneme", "hata_metni", "hata_kodu", "girdi", "yon_ad", "yon_eposta", "kisa_ad"} ya da
-- {"hata": "yok" | "tamam" | "kirada"}. Süre veritabanının saatiyle.
CREATE OR REPLACE FUNCTION firma_kurulum_kira(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  k firma_kurulum%ROWTYPE;
BEGIN
  PERFORM yonetim_kim();
  UPDATE firma_kurulum SET kira = gen_random_uuid(), kira_bitis = now() + interval '90 seconds', degisti = now()
    WHERE firma_kurulum.firma_id = p_firma AND firma_kurulum.durum <> 'tamam'
      AND (firma_kurulum.kira_bitis IS NULL OR firma_kurulum.kira_bitis < now())
    RETURNING * INTO k;
  IF NOT FOUND THEN
    SELECT * INTO k FROM firma_kurulum WHERE firma_kurulum.firma_id = p_firma;
    IF NOT FOUND THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
    IF k.durum = 'tamam' THEN RETURN jsonb_build_object('hata', 'tamam'); END IF;
    RETURN jsonb_build_object('hata', 'kirada', 'kira_bitis', k.kira_bitis);
  END IF;
  RETURN jsonb_build_object('kira', k.kira, 'kira_bitis', k.kira_bitis, 'adim', k.adim, 'durum', k.durum, 'deneme', k.deneme,
    'hata_metni', k.hata, 'hata_kodu', k.hata_kodu, 'girdi', k.girdi, 'yon_ad', k.yon_ad, 'yon_eposta', k.yon_eposta,
    'kisa_ad', (SELECT kisa_ad FROM firma WHERE id = p_firma));
END $$;

-- ── kurulum ilerletme: yalnız kirayı tutan; adım yalnız aynı kalır ya da BİR ileri gider (atlanmaz, geri gitmez) ─────────────────────────
-- p_degisim: {"adim", "durum", "hata" + "kod" (yalnız hata / durdu), "girdi": {"kurulum_sahip"|"kurulum_yz": "v1…" | null}, "vt": {bağlantı
--   alanları}, "birak": true (kirayı bırak)}. vt anahtarları: ref, sunucu, kapi, vt_ad, kullanici, depo_url, depo_gizli, kova, parola_bekleyen
--   ("v1…"), parola_onayla (true: bekleyen geçerli olur — ALTER ROLE'den sonra; §5.4). Bağlantı değişince sürüm artar.
-- "hata" metni MASKELENİR ve kısaltılır (kurulum_hata_maskele) — reddedilmez; "kod" kısa ad (^[a-z0-9_]{1,40}$), kalıcı hatanın izine yalnız o gider.
-- "tamam": bağlantı kaydı tam olmalı (yoksa HATA, hiçbir şey yazılmaz); firma etkin olur, geçici girdi boşalır, kira bırakılır, iz yazılır.
-- Not (FV10): "dene"den sonra bağlantı alanı değişirse kurulum makinesi "dene"yi yeniden koşmalı — burada zorlanmıyor (sürüm artar, FV10 bakar).
-- Dönen: {"adim", "durum", "deneme", "surum"} ya da {"hata": "gecersiz" | "yok" | "tamam" | "kira" | "adim" | "bekleyen_yok"}.
CREATE OR REPLACE FUNCTION firma_kurulum_ilerlet(p_firma uuid, p_kira uuid, p_degisim jsonb) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim     text := yonetim_kim();
  v_adimlar text[] := ARRAY['kayit', 'proje', 'hazir', 'ssl', 'goc', 'vt_kimlik', 'rol', 'havuzcu', 'depo', 'dene', 'firma', 'eposta', 'yz', 'tamam'];
  k         firma_kurulum%ROWTYPE;
  v         firma_vt%ROWTYPE;
  v_adim    text;
  v_durum   text;
  v_i       integer;
  v_j       integer;
  v_hata    text;
  v_kod     text;
  v_girdi   jsonb;
  v_yeni    jsonb;
  d         jsonb;
  v_onayla  boolean := false;
  v_birak   boolean;
  v_bitti   boolean;
  v_onceki  text;
BEGIN
  IF p_degisim IS NULL OR jsonb_typeof(p_degisim) <> 'object'
     OR p_degisim - ARRAY['adim', 'durum', 'hata', 'kod', 'girdi', 'vt', 'birak'] <> '{}'::jsonb THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  SELECT * INTO k FROM firma_kurulum WHERE firma_kurulum.firma_id = p_firma FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF k.durum = 'tamam' THEN RETURN jsonb_build_object('hata', 'tamam'); END IF;
  IF p_kira IS NULL OR k.kira IS DISTINCT FROM p_kira OR k.kira_bitis < now() THEN
    RETURN jsonb_build_object('hata', 'kira');
  END IF;
  v_onceki := k.durum;

  v_adim := coalesce(p_degisim->>'adim', k.adim);
  v_durum := coalesce(p_degisim->>'durum', k.durum);
  v_i := array_position(v_adimlar, k.adim);
  v_j := array_position(v_adimlar, v_adim);
  IF v_j IS NULL OR v_j < v_i OR v_j > v_i + 1 THEN RETURN jsonb_build_object('hata', 'adim'); END IF;
  IF v_durum NOT IN ('bekliyor', 'calisiyor', 'hata', 'durdu', 'tamam') OR (v_adim = 'tamam') <> (v_durum = 'tamam') THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  v_bitti := v_adim = 'tamam';
  -- hata metni maskelenir (reddedilmez — ayrıntısı sırrı günlüğe yazardı); kod yalnız kısa ad
  v_hata := CASE WHEN v_durum IN ('hata', 'durdu') THEN kurulum_hata_maskele(p_degisim->>'hata') END;
  v_kod := CASE WHEN v_durum IN ('hata', 'durdu') THEN p_degisim->>'kod' END;
  IF v_kod IS NOT NULL AND v_kod !~ '^[a-z0-9_]{1,40}$' THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  v_birak := coalesce(p_degisim->'birak' = 'true'::jsonb, false);

  -- geçici girdi: değeri null olan anahtar silinir
  v_girdi := p_degisim->'girdi';
  IF v_girdi IS NOT NULL AND (jsonb_typeof(v_girdi) <> 'object' OR v_girdi - ARRAY['kurulum_sahip', 'kurulum_yz'] <> '{}'::jsonb) THEN
    RETURN jsonb_build_object('hata', 'gecersiz');
  END IF;
  v_yeni := CASE WHEN v_girdi IS NULL THEN k.girdi ELSE NULLIF(jsonb_strip_nulls(coalesce(k.girdi, '{}'::jsonb) || v_girdi), '{}'::jsonb) END;

  -- bağlantı alanları
  d := p_degisim->'vt';
  IF d IS NOT NULL THEN
    IF jsonb_typeof(d) <> 'object'
       OR d - ARRAY['ref', 'sunucu', 'kapi', 'vt_ad', 'kullanici', 'depo_url', 'depo_gizli', 'kova', 'parola_bekleyen', 'parola_onayla'] <> '{}'::jsonb
       OR (d ? 'parola_bekleyen' AND d ? 'parola_onayla') THEN
      RETURN jsonb_build_object('hata', 'gecersiz');
    END IF;
    v_onayla := coalesce(d->'parola_onayla' = 'true'::jsonb, false);
    SELECT * INTO v FROM firma_vt WHERE firma_vt.firma_id = p_firma FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
    IF v_onayla AND v.parola_bekleyen_sifreli IS NULL THEN RETURN jsonb_build_object('hata', 'bekleyen_yok'); END IF;
    UPDATE firma_vt SET
      ref = CASE WHEN d ? 'ref' THEN d->>'ref' ELSE firma_vt.ref END,
      sunucu = CASE WHEN d ? 'sunucu' THEN d->>'sunucu' ELSE firma_vt.sunucu END,
      kapi = CASE WHEN d ? 'kapi' THEN (d->>'kapi')::integer ELSE firma_vt.kapi END,
      vt_ad = CASE WHEN d ? 'vt_ad' THEN d->>'vt_ad' ELSE firma_vt.vt_ad END,
      kullanici = CASE WHEN d ? 'kullanici' THEN d->>'kullanici' ELSE firma_vt.kullanici END,
      depo_url = CASE WHEN d ? 'depo_url' THEN d->>'depo_url' ELSE firma_vt.depo_url END,
      depo_gizli_sifreli = CASE WHEN d ? 'depo_gizli' THEN d->>'depo_gizli' ELSE firma_vt.depo_gizli_sifreli END,
      kova = CASE WHEN d ? 'kova' THEN d->>'kova' ELSE firma_vt.kova END,
      parola_sifreli = CASE WHEN v_onayla THEN firma_vt.parola_bekleyen_sifreli ELSE firma_vt.parola_sifreli END,
      parola_bekleyen_sifreli = CASE WHEN d ? 'parola_bekleyen' THEN d->>'parola_bekleyen' WHEN v_onayla THEN NULL ELSE firma_vt.parola_bekleyen_sifreli END,
      surum = firma_vt.surum + CASE WHEN v_onayla OR d - ARRAY['parola_bekleyen', 'parola_onayla'] <> '{}'::jsonb THEN 1 ELSE 0 END,
      degisti = now()
    WHERE firma_vt.firma_id = p_firma;
  END IF;

  IF v_bitti THEN
    SELECT * INTO v FROM firma_vt WHERE firma_vt.firma_id = p_firma;
    IF v.firma_id IS NULL OR v.sunucu IS NULL OR v.kapi IS NULL OR v.vt_ad IS NULL OR v.kullanici IS NULL OR v.parola_sifreli IS NULL
       OR v.parola_bekleyen_sifreli IS NOT NULL THEN
      RAISE EXCEPTION 'Kurulum tamamlanamaz: bağlantı kaydı eksik ya da onaylanmamış parola var' USING ERRCODE = '23514';
    END IF;
  END IF;

  UPDATE firma_kurulum SET
    adim = v_adim,
    durum = v_durum,
    deneme = CASE WHEN v_j <> v_i THEN 0
                  WHEN k.durum = 'durdu' AND v_durum IN ('bekliyor', 'calisiyor') THEN 0
                  WHEN v_durum = 'hata' THEN least(k.deneme + 1, 1000)
                  ELSE k.deneme END,
    hata = v_hata,
    hata_kodu = v_kod,
    girdi = CASE WHEN v_bitti THEN NULL ELSE v_yeni END,
    kira = CASE WHEN v_birak OR v_bitti THEN NULL ELSE k.kira END,
    kira_bitis = CASE WHEN v_birak OR v_bitti THEN NULL ELSE k.kira_bitis END,
    degisti = now(),
    bitti = CASE WHEN v_bitti THEN now() END
  WHERE firma_kurulum.firma_id = p_firma
  RETURNING * INTO k;

  IF v_bitti THEN
    UPDATE firma SET durum = 'etkin' WHERE id = p_firma AND durum = 'kurulum';
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti) VALUES (v_kim, 'firma.kuruldu', p_firma, jsonb_build_object('ref', v.ref));
  ELSIF v_durum = 'durdu' AND v_onceki <> 'durdu' THEN
    -- kalıcı hata ("Sürdür" ister): iz — adım + kısa kod; hata METNİ değil (iz silinemez; maske bir sır biçimini kaçırırsa sonsuza dek kalırdı)
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
      VALUES (v_kim, 'firma.kurulum_durdu', p_firma, jsonb_strip_nulls(jsonb_build_object('adim', v_adim, 'kod', v_kod)));
  END IF;
  RETURN jsonb_build_object('adim', k.adim, 'durum', k.durum, 'deneme', k.deneme,
    'surum', (SELECT surum FROM firma_vt WHERE firma_vt.firma_id = p_firma));
END $$;

-- ── firmalar listesi: kendi projeli firmanın veritabanı türü ve kurulum durumu da (dönüş tipi değişti → DROP + CREATE; GRANT aşağıda) ─────
-- Kendi projeli firmanın kullanıcı sayısı ve yöneticisi merkezde yok (firma veritabanında — FV9 firma_yonetim_ozet); burada 0 / boş.
DROP FUNCTION IF EXISTS yonetim_firmalar();
CREATE FUNCTION yonetim_firmalar()
  RETURNS TABLE (id uuid, ad text, kisa_ad text, rapor_kodu text, durum text, olusturuldu timestamptz, kullanici integer,
                 yon_ad text, yon_eposta text, yon_durum text, vt text, kurulum_adim text, kurulum_durum text, goc_disi boolean)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  PERFORM yonetim_kim();
  RETURN QUERY
    SELECT f.id, f.ad, f.kisa_ad, f.rapor_kodu, f.durum, f.olusturuldu,
      (SELECT count(*)::integer FROM hesap h WHERE h.firma_id = f.id AND h.durum <> 'pasif'),
      y.ad, y.eposta, y.durum, f.vt, k.adim, k.durum, coalesce(v.goc_disi, false)
    FROM firma f
    LEFT JOIN LATERAL (
      SELECT h.ad, h.eposta, h.durum FROM hesap h
      WHERE h.firma_id = f.id AND h.durum <> 'pasif' AND 'firma_yoneticisi' = ANY (h.roller)
      ORDER BY (h.id = f.ilk_hesap) DESC NULLS LAST, h.olustu LIMIT 1) y ON true
    LEFT JOIN firma_kurulum k ON k.firma_id = f.id
    LEFT JOIN firma_vt v ON v.firma_id = f.id
    ORDER BY f.olusturuldu DESC, f.kisa_ad;
END $$;

-- ── dondur / etkinleştir: ortak firmada 0050 ile AYNI; kendi projeli firmada merkezde yalnız durum + iz (oturumları ve firmanın kendi izi firma
-- veritabanında — FV9; sıra: dondurmada önce firma tarafı, etkinleştirmede önce merkez — §5.11). Kurulumdaki firma bu işlevle değişmez. ───────
CREATE OR REPLACE FUNCTION yonetim_firma_durum(p_firma uuid, p_durum text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_kim();
  v_eski text;
  v_vt text;
BEGIN
  IF p_durum NOT IN ('etkin', 'dondu') THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  -- FOR NO KEY UPDATE: eşzamanlı iki yönetim işlemi sıraya girer; firma satırına bağlı eklemelerin (oturum, iz) FOR KEY SHARE'iyle çakışmaz
  SELECT durum, vt INTO v_eski, v_vt FROM firma WHERE id = p_firma FOR NO KEY UPDATE;
  IF v_eski IS NULL THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF v_eski = 'kurulum' THEN RETURN jsonb_build_object('hata', 'kurulum'); END IF;
  IF v_eski = p_durum THEN RETURN jsonb_build_object('hata', 'ayni'); END IF;
  UPDATE firma SET durum = p_durum WHERE id = p_firma;
  IF v_vt = 'kendi' THEN
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
      VALUES (v_kim, CASE p_durum WHEN 'dondu' THEN 'firma.donduruldu' ELSE 'firma.etkinlestirildi' END, p_firma, jsonb_build_object('vt', 'kendi'));
    RETURN jsonb_build_object('durum', p_durum, 'vt', 'kendi');
  END IF;
  IF p_durum = 'dondu' THEN
    DELETE FROM oturum WHERE firma_id = p_firma;
    DELETE FROM musteri_oturum WHERE firma_id = p_firma;
  END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id)
    VALUES (p_firma, 'probata yönetim', CASE p_durum WHEN 'dondu' THEN 'firma.donduruldu' ELSE 'firma.etkinlestirildi' END, 'firma', p_firma::text);
  PERFORM set_config('app.firma_id', '', true);
  INSERT INTO yonetim_izi (kim, ne, hedef_firma)
    VALUES (v_kim, CASE p_durum WHEN 'dondu' THEN 'firma.donduruldu' ELSE 'firma.etkinlestirildi' END, p_firma);
  RETURN jsonb_build_object('durum', p_durum);
END $$;

-- ── firma yöneticisine yeni geçici parola: ortak firmada 0050 ile AYNI; kendi projeli firmada hesap firma veritabanında (parola orada değişir —
-- FV9 firma_yonetim_gecici_parola; merkezin izi ANCAK o başarılı olunca, FV9'da). Burada kendi projeli firmada HİÇBİR ŞEY yazılmaz, {hata: 'kendi'}
-- döner (2026-10-15, FV2 incelemesi: önceki dal parola değişmeden silinemez "hesap.gecici_parola" izi yazıyordu, ekran "yapılamadı" derken).
-- Kurulumdaki firmada yok. ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION yonetim_gecici_parola(p_firma uuid, p_parola_ozeti text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_kim();
  v_durum text;
  v_vt text;
  v_ilk uuid;
  v_hesap uuid;
  v_eposta text;
  v_ad text;
BEGIN
  IF p_parola_ozeti IS NULL OR p_parola_ozeti NOT LIKE 'scrypt$%' THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  SELECT durum, vt, ilk_hesap INTO v_durum, v_vt, v_ilk FROM firma WHERE id = p_firma FOR NO KEY UPDATE;
  IF v_durum IS NULL THEN RETURN jsonb_build_object('hata', 'yok'); END IF;
  IF v_durum = 'kurulum' THEN RETURN jsonb_build_object('hata', 'kurulum'); END IF;
  IF v_durum <> 'etkin' THEN RETURN jsonb_build_object('hata', 'dondu'); END IF;
  IF v_vt = 'kendi' THEN RETURN jsonb_build_object('hata', 'kendi'); END IF;
  SELECT h.id, h.eposta, h.ad INTO v_hesap, v_eposta, v_ad FROM hesap h
    WHERE h.firma_id = p_firma AND h.durum <> 'pasif' AND 'firma_yoneticisi' = ANY (h.roller)
    ORDER BY (h.id = v_ilk) DESC NULLS LAST, h.olustu LIMIT 1 FOR UPDATE;
  IF v_hesap IS NULL THEN RETURN jsonb_build_object('hata', 'hesap_yok'); END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  UPDATE hesap SET parola_ozeti = p_parola_ozeti, durum = 'ilk', hatali_deneme = 0, kilit_bitis = NULL WHERE id = v_hesap;
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id)
    VALUES (p_firma, 'probata yönetim', 'hesap.gecici_parola', 'hesap', v_hesap::text);
  PERFORM set_config('app.firma_id', '', true);
  INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti) VALUES (v_kim, 'hesap.gecici_parola', p_firma, jsonb_build_object('eposta', v_eposta));
  RETURN jsonb_build_object('eposta', v_eposta, 'ad', v_ad);
END $$;

-- ── FV1'in işlevleri (0095): arama yolunda geçici şema EN SONDA (0010 kuralı; 0095 dosyası değişmez — uygulanmış göç — ayar burada) ─────────
-- Örnek açık: firma veritabanında uygulama rolünün açtığı geçici "vt_kimlik" ('ortak') vt_firma_dogrula'yı kandırır, başka firmanın işi geçerdi
-- (kilit tests/merkez-kaydi.test.ts; olumsuz kanıt tests/bozan/firma-baglanti.bozan.ts).
ALTER FUNCTION vt_kimlik_koru() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION firma_vt_koru() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION vt_firma_dogrula(uuid) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION firma_bul(text) SET search_path = pg_catalog, public, pg_temp;

-- ── haklar: uygulama rolü yalnız çözümü ve merkez doğrulamasını çağırır; öteki işlevler yalnız yönetim rolü; maske yalnız sahip (tanımlayıcı) ──
REVOKE ALL ON FUNCTION kurulum_hata_maskele(text), vt_merkez_dogrula(), firma_coz_id(uuid), firma_coz(text), yonetim_firma_baglanti(uuid), goc_hedefleri(),
  yonetim_firma_kayit_ac(text, text, text, text, text), firma_kurulum_kira(uuid), firma_kurulum_ilerlet(uuid, uuid, jsonb), yonetim_firmalar(),
  yonetim_firma_durum(uuid, text), yonetim_gecici_parola(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vt_merkez_dogrula(), firma_coz_id(uuid), firma_coz(text) TO probata_uygulama;
GRANT EXECUTE ON FUNCTION yonetim_firma_baglanti(uuid), goc_hedefleri(), yonetim_firma_kayit_ac(text, text, text, text, text), firma_kurulum_kira(uuid),
  firma_kurulum_ilerlet(uuid, uuid, jsonb), yonetim_firmalar(), yonetim_firma_durum(uuid, text), yonetim_gecici_parola(uuid, text) TO probata_yonetim;
