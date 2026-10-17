-- ══ 0102 · TEKNİK YÖNETİCİ İMZASI (reisim 2026-10-17: "firma ayarlarına ekleyebiliriz teknik yönetici imzalasın seçeneği olsun açıkken teknik
--   yönetici onayına giden rapor teknik yönetici tarafından imzalansın, ondan sonra denetçiye gitsin, eğer açık değilse bu seçenek şu an ki
--   kurgumuzdan devam edelim" · önerinin ayrıntıları "onaylıyorum") ══
-- İmza isteğinin AŞAMASI: 'uzman' (bugünkü — onaylanmış raporun muayene uzmanı son imzası) · 'teknik' (firma ayarı açıkken onaydaki raporu teknik
-- yönetici imzalar; imzalı PDF'i yükleyince istek kapanır ve rapor onaylanır). Teknik aşamanın imzalı PDF'i (dosya modülü rapor_pdf) muayene
-- uzmanının imzalayacağı PDF olur: o onaydan sonra açılan uzman isteği başka PDF'le açılamaz (teknik yöneticinin imzası atlanamaz). Rapor onaydan
-- çıkınca bekleyen teknik istek iptal (rapor_hareket_yaz). Ayarın kendisi firma_ayar'da (imza.teknik; uygulama denetler). ⛔ Her göç IDEMPOTENT.
-- Kilit tests/onaylar.test.ts (teknik yönetici imzası) + tests/imza-kimlik.test.ts, bozan tests/bozan/onaylar.bozan.ts 15–18.

ALTER TABLE imza_istegi ADD COLUMN IF NOT EXISTS asama text NOT NULL DEFAULT 'uzman';
ALTER TABLE imza_istegi DROP CONSTRAINT IF EXISTS imza_istegi_asama_check;
ALTER TABLE imza_istegi ADD CONSTRAINT imza_istegi_asama_check CHECK (asama IN ('uzman', 'teknik'));

CREATE OR REPLACE FUNCTION imza_istegi_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE r record; t uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'bekliyor' OR NEW.imzali_dosya IS NOT NULL OR NEW.kapandi IS NOT NULL THEN RAISE EXCEPTION 'imza isteği bekliyor açılır' USING ERRCODE = '23514'; END IF;
    SELECT x.durum, x.onay INTO r FROM rapor x WHERE x.firma_id = NEW.firma_id AND x.id = NEW.rapor_id AND x.revizyon = NEW.revizyon AND x.silindi IS NULL;
    IF NEW.asama = 'teknik' THEN
      IF r IS NULL OR r.durum <> 'onayda' THEN RAISE EXCEPTION 'teknik yönetici imza isteği yalnız onaydaki rapora açılır' USING ERRCODE = '23514'; END IF;
    ELSE
      IF r IS NULL OR r.durum <> 'onaylandi' THEN RAISE EXCEPTION 'imza isteği yalnız onaylanmış rapora açılır' USING ERRCODE = '23514'; END IF;
      -- bu onay teknik yöneticinin imzasıyla verildiyse uzman yalnız o imzalı PDF'i imzalar
      SELECT i.imzali_dosya INTO t FROM imza_istegi i WHERE i.firma_id = NEW.firma_id AND i.rapor_id = NEW.rapor_id AND i.revizyon = NEW.revizyon
        AND i.asama = 'teknik' AND i.durum = 'tamam' AND i.kapandi >= r.onay ORDER BY i.kapandi DESC LIMIT 1;
      IF t IS NOT NULL AND NEW.pdf_dosya IS DISTINCT FROM t THEN
        RAISE EXCEPTION 'teknik yöneticinin imzaladığı rapor yalnız o imzalı PDF''le imzalanır' USING ERRCODE = '23514';
      END IF;
    END IF;
    -- imzasız PDF bu firmanın, bu raporun kesin PDF'i (dosya kimliği istemciden uydurulamaz)
    IF NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.pdf_dosya AND d.modul = 'rapor_pdf' AND d.kayit_id = NEW.rapor_id
                   AND d.sha256 = NEW.pdf_sha256 AND d.cop IS NULL) THEN
      RAISE EXCEPTION 'imzasız PDF bu raporun değil' USING ERRCODE = '23514';
    END IF;
    NEW.hesap_id := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
    RETURN NEW;
  END IF;
  IF NEW.rapor_id IS DISTINCT FROM OLD.rapor_id OR NEW.revizyon IS DISTINCT FROM OLD.revizyon OR NEW.yontem IS DISTINCT FROM OLD.yontem
    OR NEW.pdf_dosya IS DISTINCT FROM OLD.pdf_dosya OR NEW.pdf_sha256 IS DISTINCT FROM OLD.pdf_sha256 OR NEW.hesap_id IS DISTINCT FROM OLD.hesap_id
    OR NEW.firma_id IS DISTINCT FROM OLD.firma_id OR NEW.kopya IS DISTINCT FROM OLD.kopya OR NEW.asama IS DISTINCT FROM OLD.asama THEN
    RAISE EXCEPTION 'imza isteğinin raporu, PDF''i, kopyası, aşaması ve sahibi değişmez' USING ERRCODE = '23514';
  END IF;
  IF OLD.durum <> 'bekliyor' THEN RAISE EXCEPTION 'kapanmış imza isteği değişmez' USING ERRCODE = '23514'; END IF;
  IF NEW.durum = 'tamam' AND OLD.asama = 'teknik' THEN
    -- teknik yöneticinin imzalı PDF'i: muayene uzmanının imzalayacağı PDF (rapor_pdf); rapor o anda hâlâ onayda
    IF NEW.imzali_dosya IS NULL OR NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.imzali_dosya AND d.modul = 'rapor_pdf'
         AND d.kayit_id = NEW.rapor_id AND d.cop IS NULL)
       OR NOT EXISTS (SELECT 1 FROM rapor x WHERE x.firma_id = NEW.firma_id AND x.id = NEW.rapor_id AND x.revizyon = NEW.revizyon AND x.durum = 'onayda') THEN
      RAISE EXCEPTION 'teknik yöneticinin imzalı PDF''i bu onaydaki raporun değil' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.durum = 'tamam' AND (NEW.imzali_dosya IS NULL OR NOT EXISTS (SELECT 1 FROM dosya d WHERE d.firma_id = NEW.firma_id AND d.id = NEW.imzali_dosya
    AND d.modul = 'rapor_imzali' AND d.kayit_id = NEW.rapor_id AND d.cop IS NULL)) THEN
    RAISE EXCEPTION 'imzalı PDF bu raporun değil' USING ERRCODE = '23514';
  END IF;
  IF NEW.durum <> 'bekliyor' THEN NEW.kapandi := now(); END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION imza_istegi_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION imza_istegi_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER imza_istegi_koru BEFORE INSERT OR UPDATE ON imza_istegi FOR EACH ROW EXECUTE FUNCTION imza_istegi_koru();

-- HAREKET KAYDI (0029'un işlevi + 0102: onaydan çıkan raporun bekleyen teknik imza isteği iptal)
CREATE OR REPLACE FUNCTION rapor_hareket_yaz() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE g text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne) VALUES (NEW.firma_id, NEW.id, NEW.revizyon, NULL, NEW.durum, 'olustur');
  ELSIF NEW.silindi IS NOT NULL AND OLD.silindi IS NULL THEN
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne) VALUES (NEW.firma_id, NEW.id, NEW.revizyon, OLD.durum, NEW.durum, 'sil');
  ELSIF NEW.durum IS DISTINCT FROM OLD.durum THEN
    g := left(NULLIF(btrim(coalesce(current_setting('app.gerekce', true), '')), ''), 400);
    PERFORM set_config('app.gerekce', '', true);
    INSERT INTO rapor_hareket (firma_id, rapor_id, revizyon, eski, yeni, ne, gerekce)
      VALUES (NEW.firma_id, NEW.id, NEW.revizyon, OLD.durum, NEW.durum,
        CASE WHEN OLD.durum = 'taslak' AND NEW.durum = 'onayda' THEN 'gonder'
             WHEN OLD.durum = 'onayda' AND NEW.durum = 'onaylandi' THEN 'onay'
             WHEN OLD.durum = 'onaylandi' AND NEW.durum = 'onayda' THEN 'onay_geri'
             WHEN OLD.durum = 'imzali' AND NEW.durum = 'taslak' THEN 'revize'
             WHEN NEW.durum = 'imzali' THEN 'imza'
             WHEN NEW.durum = 'taslak' THEN 'geri'
             ELSE 'durum' END, g);
    -- onaylanmış rapor onaydan çıkınca (onayı geri al, durumu değiştir) o revizyonun bekleyen imza isteği iptal: hazırlanan PDF eski içeriği
    -- taşır, yeniden onaylanınca İmzala yeni PDF üretir
    IF OLD.durum = 'onaylandi' AND NEW.durum IN ('taslak', 'onayda') THEN
      UPDATE imza_istegi SET durum = 'iptal', surum = surum + 1, degisti = now()
        WHERE firma_id = NEW.firma_id AND rapor_id = NEW.id AND revizyon = NEW.revizyon AND durum = 'bekliyor';
    END IF;
    -- 0102: rapor onaydan çıkınca (geri gönder, durumu değiştir, imzasız onay) teknik yöneticinin bekleyen imza isteği iptal — hazırlanan PDF o
    -- anki içeriği taşır; teknik yönetici imzalayıp yüklediğinde istek ÖNCE kapanır, sonra rapor onaylanır (iptal edilecek istek kalmaz)
    IF OLD.durum = 'onayda' AND NEW.durum <> 'onayda' THEN
      UPDATE imza_istegi SET durum = 'iptal', surum = surum + 1, degisti = now()
        WHERE firma_id = NEW.firma_id AND rapor_id = NEW.id AND revizyon = NEW.revizyon AND asama = 'teknik' AND durum = 'bekliyor';
    END IF;
    -- revizeye gönderilince raporun bekleyen revize isteği kapanır (istek yerine getirildi)
    IF OLD.durum = 'imzali' AND NEW.durum = 'taslak' THEN
      UPDATE rapor_revize_istegi SET durum = 'revize', surum = surum + 1, degisti = now()
        WHERE firma_id = NEW.firma_id AND rapor_id = NEW.id AND durum = 'bekliyor';
    END IF;
  END IF;
  RETURN NULL;
END $$;
ALTER FUNCTION rapor_hareket_yaz() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION rapor_hareket_yaz() FROM PUBLIC;
