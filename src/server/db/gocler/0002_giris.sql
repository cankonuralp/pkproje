-- ══ 0002 · GİRİŞ: hesap + oturum + giriş kilidi (09-E1–E4 · karar 34, 37) ══════════════════════════════════════
-- Güvenlik ilkeleri (reisim 2026-10-04: "site güvenliği, kaynak koddan rol değiştirme sızma veri çalma gibi şeylere dikkat et"):
-- · Hesap, oturum, kilit tabloları KİRACI tablosudur: ENABLE + FORCE RLS; giriş bile firma bağlamında yapılır (alt alan adı → firma →
--   kiraciIcinde) — bir firmanın giriş ekranı öteki firmanın hesabını göremez, deneyemez.
-- · Parola düz metin tutulmaz (yalnız scrypt özeti); oturum belirteci düz tutulmaz (yalnız SHA-256 özeti) — tablo sızsa da oturum çalınamaz.
-- · Roller hesabın kendisinde, sunucuda; istemci rol yollayamaz. Rol / durum değişince o hesabın oturumları silinir (09-E4, aşağıda tetik).
-- ⛔ Her göç IDEMPOTENT.

-- ── hesap (personel girişi) ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hesap (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  eposta        text NOT NULL CHECK (eposta = lower(eposta) AND length(eposta) BETWEEN 3 AND 254 AND position('@' in eposta) > 1),
  ad            text NOT NULL CHECK (length(ad) BETWEEN 1 AND 200),
  -- scrypt$N$r$p$tuz$ozet (src/server/kimlik/parola.ts); düz parola hiçbir yerde yok
  parola_ozeti  text CHECK (parola_ozeti IS NULL OR parola_ozeti LIKE 'scrypt$%'),
  -- ilk: geçici parolayla ilk girişte parola değiştirmeli · etkin · pasif (giremez)
  durum         text NOT NULL DEFAULT 'ilk' CHECK (durum IN ('ilk', 'etkin', 'pasif')),
  -- rol kümesi (KOD-GECIS §4); yalnız tanımlı roller
  roller        text[] NOT NULL DEFAULT '{}' CHECK (roller <@ ARRAY['planlama','denetci','mekanik_yonetici','elektrik_yonetici','firma_yoneticisi','muhasebe']::text[]),
  hatali_deneme integer NOT NULL DEFAULT 0 CHECK (hatali_deneme >= 0),
  kilit_bitis   timestamptz,
  surum         integer NOT NULL DEFAULT 0,
  olustu        timestamptz NOT NULL DEFAULT now(),
  degisti       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, eposta)
);
ALTER TABLE hesap ENABLE ROW LEVEL SECURITY;
ALTER TABLE hesap FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hesap' AND policyname = 'hesap_kiraci') THEN
    CREATE POLICY hesap_kiraci ON hesap USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- ── oturum ─────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oturum (
  -- çerezdeki belirtecin SHA-256 özeti (hex); belirtecin kendisi saklanmaz
  ozet          text PRIMARY KEY CHECK (ozet ~ '^[0-9a-f]{64}$'),
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id      uuid NOT NULL REFERENCES hesap(id) ON DELETE CASCADE,
  olustu        timestamptz NOT NULL DEFAULT now(),
  son_kullanim  timestamptz NOT NULL DEFAULT now(),
  -- mutlak bitiş (açılıştan en geç 14 gün); hareketsizlik sınırı koddadır (12 saat)
  bitis         timestamptz NOT NULL,
  ip            text,
  tarayici      text CHECK (tarayici IS NULL OR length(tarayici) <= 300)
);
CREATE INDEX IF NOT EXISTS oturum_hesap ON oturum (firma_id, hesap_id);
ALTER TABLE oturum ENABLE ROW LEVEL SECURITY;
ALTER TABLE oturum FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oturum' AND policyname = 'oturum_kiraci') THEN
    CREATE POLICY oturum_kiraci ON oturum USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- ── IP başına giriş kilidi (karar 37: 5 hata → 15 dk, hesaba VE IP'ye) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS giris_kilidi (
  firma_id      uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  ip            text NOT NULL CHECK (length(ip) BETWEEN 1 AND 64),
  hatali_deneme integer NOT NULL DEFAULT 0,
  kilit_bitis   timestamptz,
  son           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firma_id, ip)
);
ALTER TABLE giris_kilidi ENABLE ROW LEVEL SECURITY;
ALTER TABLE giris_kilidi FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'giris_kilidi' AND policyname = 'giris_kilidi_kiraci') THEN
    CREATE POLICY giris_kilidi_kiraci ON giris_kilidi USING (firma_id = gecerli_firma()) WITH CHECK (firma_id = gecerli_firma());
  END IF;
END $$;

-- ── 09-E4: rol, durum ya da parola değişince o hesabın açık oturumları HEMEN düşer (uygulama kodu unutsa bile) ─────
CREATE OR REPLACE FUNCTION hesap_oturum_dusur() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.roller IS DISTINCT FROM OLD.roller OR NEW.durum IS DISTINCT FROM OLD.durum OR NEW.parola_ozeti IS DISTINCT FROM OLD.parola_ozeti THEN
    DELETE FROM oturum WHERE hesap_id = NEW.id AND firma_id = NEW.firma_id;
  END IF;
  NEW.degisti := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS hesap_oturum_dusur ON hesap;
CREATE TRIGGER hesap_oturum_dusur BEFORE UPDATE ON hesap FOR EACH ROW EXECUTE FUNCTION hesap_oturum_dusur();

-- ── uygulama rolünün yetkileri (en az yetki: hesap silinmez, pasife alınır) ─────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON hesap TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE, DELETE ON oturum TO probata_uygulama;
GRANT SELECT, INSERT, UPDATE, DELETE ON giris_kilidi TO probata_uygulama;
