-- ══ 0127 · ÇALIŞMA MODELİ: TÜRKAK'lı / TÜRKAK'sız (2026-11-12; reisim: "türkaklı ve türkaksız firmalar için 2 ayrı model oluşturup ona göre
--    yapmalıyız", "firma açarken türkaklı türkaksız diye seçenek olsun yönetimde ona göre açalım daha sonra içeriden de değiştirlebilsin ayarlar" —
--    maket onaylı, pkproje.md §11 K1; yapım sırasında T1) ══
-- Model firma_ayar'ın 'calisma' bölümünde ({"model": "turkak" | "siz"}; kayıt yoksa "siz" — başlangıç src/server/ayar/ayar.ts).
-- 1. KİLİT: uygulama rolü (probata_uygulama) 'calisma' bölümünü yazamaz / değiştiremez / silemez — firma kendi modelini değiştiremez (K1). Okur.
-- 2. firma_yonetim_model: Yönetim yazar (firma açılırken p_acilis = true; sonra değişiklik). Firmanın denetim izine "probata yönetim (ad)",
--    ortak firmada yönetim izine; kendi projeli firmada merkezin izi sonra (yonetim_firmada_iz 'ayar.model').
-- 3. firma_yonetim_model_oku: şu anki model + değişiklik geçmişi (firmanın denetim izinden; en yeni üstte, en çok 50).
-- ⛔ Her göç IDEMPOTENT.

-- ── 1. kilit ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_ayar_calisma_kilidi() RETURNS trigger
  LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF current_user = 'probata_uygulama'
     AND ((TG_OP <> 'DELETE' AND NEW.bolum = 'calisma') OR (TG_OP <> 'INSERT' AND OLD.bolum = 'calisma')) THEN
    RAISE EXCEPTION 'Çalışma modeli probata yönetiminden değiştirilir.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS firma_ayar_calisma_kilidi ON firma_ayar;
CREATE TRIGGER firma_ayar_calisma_kilidi BEFORE INSERT OR UPDATE OR DELETE ON firma_ayar FOR EACH ROW EXECUTE FUNCTION firma_ayar_calisma_kilidi();

-- ── 2. yönetim yazar ─────────────────────────────────────────────────────────────────────────────────────────────────────
-- Dönen: {"durum": "tamam", "eski": …} ya da {"hata": "gecersiz" | "ayni"}. Açılışta (p_acilis) "aynı" denetimi yok: ilk kayıt her zaman yazılır.
CREATE OR REPLACE FUNCTION firma_yonetim_model(p_firma uuid, p_model text, p_acilis boolean) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_kim text := yonetim_firma_kimi(p_firma);
  v_firmada boolean := EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma');
  v_acilis boolean := coalesce(p_acilis, false);
  v_eski text;
BEGIN
  IF p_model IS NULL OR p_model NOT IN ('turkak', 'siz') THEN RETURN jsonb_build_object('hata', 'gecersiz'); END IF;
  SELECT deger ->> 'model' INTO v_eski FROM firma_ayar WHERE firma_id = p_firma AND bolum = 'calisma' FOR UPDATE;
  IF v_eski IS NULL OR v_eski NOT IN ('turkak', 'siz') THEN v_eski := 'siz'; END IF;
  IF NOT v_acilis AND v_eski = p_model THEN RETURN jsonb_build_object('hata', 'ayni'); END IF;
  PERFORM set_config('app.firma_id', p_firma::text, true);
  INSERT INTO firma_ayar (firma_id, bolum, deger) VALUES (p_firma, 'calisma', jsonb_build_object('model', p_model))
    ON CONFLICT (firma_id, bolum) DO UPDATE SET deger = firma_ayar.deger || EXCLUDED.deger, surum = firma_ayar.surum + 1;
  INSERT INTO denetim_izi (firma_id, kim, ne, nesne, nesne_id, ayrinti)
    VALUES (p_firma, 'probata yönetim (' || v_kim || ')', 'ayar.calisma_modeli', 'firma_ayar', 'calisma',
            jsonb_build_object('eski', CASE WHEN v_acilis THEN NULL ELSE v_eski END, 'yeni', p_model, 'acilis', v_acilis));
  PERFORM set_config('app.firma_id', '', true);
  IF NOT v_firmada THEN
    INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti)
      VALUES (v_kim, 'ayar.model', p_firma, jsonb_build_object('eski', CASE WHEN v_acilis THEN NULL ELSE v_eski END, 'yeni', p_model, 'acilis', v_acilis));
  END IF;
  RETURN jsonb_build_object('durum', 'tamam', 'eski', v_eski);
END $$;

-- ── 3. yönetim okur: model + geçmiş ──────────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION firma_yonetim_model_oku(p_firma uuid) RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_model text;
BEGIN
  PERFORM yonetim_firma_kimi(p_firma);
  SELECT deger ->> 'model' INTO v_model FROM firma_ayar WHERE firma_id = p_firma AND bolum = 'calisma';
  IF v_model IS NULL OR v_model NOT IN ('turkak', 'siz') THEN v_model := 'siz'; END IF;
  RETURN jsonb_build_object(
    'model', v_model,
    'gecmis', (SELECT coalesce(jsonb_agg(jsonb_build_object('zaman', g.zaman, 'eski', g.ayrinti ->> 'eski', 'yeni', g.ayrinti ->> 'yeni',
                        'acilis', coalesce((g.ayrinti ->> 'acilis')::boolean, false)) ORDER BY g.zaman DESC, g.id DESC), '[]'::jsonb)
               FROM (SELECT id, zaman, ayrinti FROM denetim_izi WHERE firma_id = p_firma AND ne = 'ayar.calisma_modeli'
                     ORDER BY zaman DESC, id DESC LIMIT 50) g));
END $$;

-- ── 4. kendi projeli firmada merkezin izi: 'ayar.model' eklendi (0106'daki liste + bu) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION yonetim_firmada_iz(p_firma uuid, p_ne text, p_ayrinti jsonb) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_kim text := yonetim_kim();
BEGIN
  IF EXISTS (SELECT 1 FROM vt_kimlik WHERE tur = 'firma') THEN RAISE EXCEPTION 'merkez değil' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM firma WHERE id = p_firma AND vt = 'kendi') THEN RAISE EXCEPTION 'kendi projeli firma değil' USING ERRCODE = '42501'; END IF;
  IF p_ne NOT IN ('hesap.gecici_parola', 'ayar.yz_anahtari', 'ayar.eposta_gonderim', 'ayar.yz', 'ayar.model') THEN
    RAISE EXCEPTION 'bilinmeyen iz' USING ERRCODE = '22023';
  END IF;
  INSERT INTO yonetim_izi (kim, ne, hedef_firma, ayrinti) VALUES (v_kim, p_ne, p_firma, coalesce(p_ayrinti, '{}'::jsonb));
END $$;

-- ── haklar ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION firma_ayar_calisma_kilidi(), firma_yonetim_model(uuid, text, boolean), firma_yonetim_model_oku(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION firma_yonetim_model(uuid, text, boolean), firma_yonetim_model_oku(uuid) TO probata_yonetim;
