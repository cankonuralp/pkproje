-- ══ 0003 · DENETİM İZİ: kim · ne zaman · ne · eski / yeni · gerekçe (09-D1, D3 · KOD-GECIS §2 "Güvenli yazıcı", "Denetim izi") ══════════
-- reisim 2026-10-04: "kaynak koddan rol değiştirme sızma veri çalma gibi şeylere dikkat et".
-- · İz YALNIZ EKLENİR: uygulama rolünün UPDATE / DELETE yetkisi yok (0001) VE tetik değiştirmeyi / silmeyi / boşaltmayı reddeder (tablo sahibi bile).
-- · "Kim" ve "ne zaman" uygulamanın yazdığına güvenilmez: zaman veritabanının saati, hesap işlemin bağlamından (`app.hesap_id`,
--   src/server/db/kiraci.ts kiraciIcinde → hesapId). Kod başka bir hesap kimliği yazsa da tetik bağlamdakiyle değiştirir.
-- ⛔ Her göç IDEMPOTENT.

ALTER TABLE denetim_izi ADD COLUMN IF NOT EXISTS hesap_id uuid;
-- hangi kayıt: tablo adı + kimlik (kimlik metin: uuid de, numara da olabilir)
ALTER TABLE denetim_izi ADD COLUMN IF NOT EXISTS nesne    text CHECK (nesne IS NULL OR nesne ~ '^[a-z_][a-z0-9_]{0,62}$');
ALTER TABLE denetim_izi ADD COLUMN IF NOT EXISTS nesne_id text CHECK (nesne_id IS NULL OR length(nesne_id) <= 100);
-- yalnız DEĞİŞEN alanların eski ve yeni değeri (gizli alanlar "gizli" diye yazılır, değeri yazılmaz)
ALTER TABLE denetim_izi ADD COLUMN IF NOT EXISTS eski     jsonb;
ALTER TABLE denetim_izi ADD COLUMN IF NOT EXISTS yeni     jsonb;
ALTER TABLE denetim_izi ADD COLUMN IF NOT EXISTS gerekce  text CHECK (gerekce IS NULL OR length(gerekce) <= 2000);
CREATE INDEX IF NOT EXISTS denetim_izi_nesne ON denetim_izi (firma_id, nesne, nesne_id, zaman DESC);

-- ── damga: zaman veritabanından, hesap işlem bağlamından ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION denetim_izi_damga() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NEW.zaman := now();
  NEW.hesap_id := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS denetim_izi_damga ON denetim_izi;
CREATE TRIGGER denetim_izi_damga BEFORE INSERT ON denetim_izi FOR EACH ROW EXECUTE FUNCTION denetim_izi_damga();

-- ── değişmez: güncelleme, silme, boşaltma reddedilir (yetkisi olan rolde bile) ────────────────────────────────────────
CREATE OR REPLACE FUNCTION denetim_izi_degismez() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'denetim izi değiştirilemez ve silinemez' USING ERRCODE = 'insufficient_privilege';
END $$;
DROP TRIGGER IF EXISTS denetim_izi_degismez ON denetim_izi;
CREATE TRIGGER denetim_izi_degismez BEFORE UPDATE OR DELETE ON denetim_izi FOR EACH ROW EXECUTE FUNCTION denetim_izi_degismez();
DROP TRIGGER IF EXISTS denetim_izi_bosaltilmaz ON denetim_izi;
CREATE TRIGGER denetim_izi_bosaltilmaz BEFORE TRUNCATE ON denetim_izi FOR EACH STATEMENT EXECUTE FUNCTION denetim_izi_degismez();
