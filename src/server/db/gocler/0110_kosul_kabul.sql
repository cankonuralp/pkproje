-- ══ 0110 · KULLANIM KOŞULLARI — YAPAY ZEKÂ (S.A.Y) KABULÜ (2026-10-31, kalem 7 — M6; sunum "S.A.Y'a tam yetenek", karar 5: 06'daki madde aynen, ekranlar
--    maket 9) ══
-- · kosul_kabul: firma (tur 'firma' — firma yöneticisi firması adına) ve kişi (tur 'kullanici') kabulü; koşul sürümüyle. Yalnız EKLENİR (değişmez, silinmez
--   — iz); IP / cihaz bilgisi tutulmaz. Kişi işlemin bağlamından (app.hesap_id), istemciden alınmaz.
-- · Denetim sunucuda: S.A.Y'a giden her istekte güncel sürümün firma ve kişi kabulü (src/server/yz/kosul.ts) — yoksa istek yapay zekâya gitmez.
-- · Yönetim: firma_yonetim_ozet'e 'kosul' (firma kabulü: kim, ne zaman, sürüm; sürüm başına kabul eden kullanıcı sayısı).
-- Kilit: tests/say-kosul.test.ts. ⛔ Her göç IDEMPOTENT.

CREATE TABLE IF NOT EXISTS kosul_kabul (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id  uuid NOT NULL DEFAULT gecerli_firma() REFERENCES firma(id),
  hesap_id  uuid NOT NULL REFERENCES hesap(id),
  tur       text NOT NULL CHECK (tur IN ('firma', 'kullanici')),
  surum     text NOT NULL CHECK (surum ~ '^[0-9]{4}-[0-9]{2}-[0-9]+$'),
  zaman     timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS kosul_kabul_firma ON kosul_kabul (firma_id, tur, surum);
CREATE INDEX IF NOT EXISTS kosul_kabul_hesap ON kosul_kabul (hesap_id);
ALTER TABLE kosul_kabul ENABLE ROW LEVEL SECURITY;
ALTER TABLE kosul_kabul FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kosul_kabul' AND policyname = 'kosul_kabul_firma') THEN
    CREATE POLICY kosul_kabul_firma ON kosul_kabul USING (firma_id = (SELECT gecerli_firma())) WITH CHECK (firma_id = (SELECT gecerli_firma()));
  END IF;
END $$;
CREATE OR REPLACE FUNCTION kosul_kabul_koru() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'Koşul kabulü değişmez' USING ERRCODE = '23514'; END IF;
  IF ben IS NULL THEN RAISE EXCEPTION 'Koşulu oturumdaki kişi kabul eder' USING ERRCODE = '23514'; END IF;
  NEW.hesap_id := ben;
  RETURN NEW;
END $$;
ALTER FUNCTION kosul_kabul_koru() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION kosul_kabul_koru() FROM PUBLIC;
CREATE OR REPLACE TRIGGER kosul_kabul_koru BEFORE INSERT OR UPDATE ON kosul_kabul FOR EACH ROW EXECUTE FUNCTION kosul_kabul_koru();
REVOKE ALL ON kosul_kabul FROM PUBLIC;
GRANT SELECT, INSERT ON kosul_kabul TO probata_uygulama;

-- Yönetim özeti: firmanın kabul durumu (0106'daki gövde aynen + 'kosul')
CREATE OR REPLACE FUNCTION firma_yonetim_ozet(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_ay text := to_char(now() AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM');
  v_ilk uuid;
  s firma_sir%ROWTYPE;
  a jsonb;
BEGIN
  PERFORM yonetim_firma_kimi(p_firma);
  SELECT ilk_hesap INTO v_ilk FROM firma WHERE id = p_firma;
  SELECT * INTO s FROM firma_sir WHERE firma_id = p_firma AND ad = 'yapay_zeka_anahtari';
  SELECT deger INTO a FROM firma_ayar WHERE firma_id = p_firma AND bolum = 'yapay_zeka';
  RETURN jsonb_build_object(
    'durum', (SELECT durum FROM firma WHERE id = p_firma),
    'kullanici', (SELECT count(*)::int FROM hesap WHERE firma_id = p_firma AND durum <> 'pasif'),
    'yonetici', (SELECT jsonb_build_object('ad', h.ad, 'eposta', h.eposta, 'durum', h.durum) FROM hesap h
                 WHERE h.firma_id = p_firma AND h.durum <> 'pasif' AND 'firma_yoneticisi' = ANY (h.roller)
                 ORDER BY (h.id = v_ilk) DESC NULLS LAST, h.olustu LIMIT 1),
    'yz', jsonb_build_object(
      'ayar', coalesce(a, '{}'::jsonb),
      'tanimli', s.sifreli IS NOT NULL,
      'son4', CASE WHEN s.sifreli IS NOT NULL THEN s.son4 END,
      'ay', v_ay,
      'okuma', (SELECT coalesce(sum(okuma), 0)::int FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay),
      'mesaj', (SELECT coalesce(sum(mesaj), 0)::int FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay),
      'maliyet', (SELECT coalesce(sum(maliyet), 0)::bigint FROM yz_kullanim WHERE firma_id = p_firma AND ay = v_ay),
      'kisiler', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'ad', h.ad, 'okuma', k.okuma, 'mesaj', k.mesaj, 'maliyet', k.maliyet)
                    ORDER BY k.maliyet DESC, h.ad), '[]'::jsonb)
                  FROM yz_kullanim k JOIN hesap h ON h.id = k.hesap_id
                  WHERE k.firma_id = p_firma AND k.ay = v_ay AND (k.okuma > 0 OR k.mesaj > 0 OR k.maliyet > 0))),
    'kosul', jsonb_build_object(
      'firma', (SELECT jsonb_build_object('ad', h.ad, 'zaman', k.zaman, 'surum', k.surum) FROM kosul_kabul k JOIN hesap h ON h.id = k.hesap_id
                WHERE k.firma_id = p_firma AND k.tur = 'firma' ORDER BY k.zaman DESC LIMIT 1),
      'kullanicilar', (SELECT coalesce(jsonb_object_agg(surum, n), '{}'::jsonb) FROM
                       (SELECT surum, count(DISTINCT hesap_id)::int AS n FROM kosul_kabul WHERE firma_id = p_firma AND tur = 'kullanici' GROUP BY surum) x)));
END $$;
