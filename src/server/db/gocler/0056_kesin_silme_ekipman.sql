-- ══ 0056 · KESİN SİLME — ekipman (360; §9 elli üçüncü tur, 0054 deseni; pkproje §9 yirmi üçüncü tur: "Yanlış girilen ekipman pasife alınır (geri
-- alınabilir); silme yalnız yönetici" — KOD-GECIS §4 ekipman_sil; reisim 2026-10-07 "ekipman … silinemiyor") ══
-- Kullanım: raporu (yabancı anahtar rapor.ekipman_id — silinmiş taslak dahil; imzalı sürüm ve uygunsuzluk kayıtları ancak raporla olur) · TAMAMLANMIŞ bir
-- planda yer alması (plan kapanmış bir iş kaydıdır). Birlikte silinen: açık / reddedilmiş planlardaki plan satırları (plan_ekipman) ve kod geçmişi
-- (ekipman_kodu) — kod serbest kalır (içe aktarmayı geri almanın sonucu ile aynı). Raporu olan ekipman silinmez ve pasife de alınmaz (geçmiş kayıt).
-- Yetki (yalnız yönetici — canDo ekipman_sil) sunucuda. ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION ekipman_kullanim(p_idler uuid[]) RETURNS TABLE (id uuid, kullanim jsonb)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT e.id, jsonb_strip_nulls(jsonb_build_object(
    'rapor', NULLIF((SELECT count(*) FROM rapor r WHERE r.firma_id = e.firma_id AND r.ekipman_id = e.id), 0),
    'tamamlanmis_plan', NULLIF((SELECT count(*) FROM plan_ekipman pe JOIN plan p ON p.firma_id = pe.firma_id AND p.id = pe.plan_id
                                WHERE pe.firma_id = e.firma_id AND pe.ekipman_id = e.id AND p.durum = 'tamamlandi'), 0)))
  FROM ekipman e
  WHERE e.firma_id = gecerli_firma() AND e.id = ANY (p_idler)
$$;
ALTER FUNCTION ekipman_kullanim(uuid[]) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ekipman_kullanim(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ekipman_kullanim(uuid[]) TO probata_uygulama;

CREATE OR REPLACE FUNCTION ekipman_sil(p_id uuid, p_kim text) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  f uuid := gecerli_firma();
  ben uuid := NULLIF(current_setting('app.hesap_id', true), '')::uuid;
  e ekipman%ROWTYPE;
  k jsonb; planlar jsonb; kodlar jsonb;
BEGIN
  IF f IS NULL OR ben IS NULL THEN RAISE EXCEPTION 'kaydı oturumdaki kişi siler' USING ERRCODE = '42501'; END IF;
  IF p_kim IS NULL OR length(p_kim) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'silen kişinin adı gerekli' USING ERRCODE = '23514'; END IF;
  SELECT * INTO e FROM ekipman WHERE id = p_id AND firma_id = f FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('durum', 'yok'); END IF;
  SELECT u.kullanim INTO k FROM ekipman_kullanim(ARRAY[p_id]) u;
  IF k IS NOT NULL AND k <> '{}'::jsonb THEN RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', k); END IF;
  SELECT coalesce(jsonb_agg(pe.plan_id::text ORDER BY pe.olustu), '[]'::jsonb) INTO planlar FROM plan_ekipman pe WHERE pe.firma_id = f AND pe.ekipman_id = p_id;
  SELECT coalesce(jsonb_agg(ek.kod ORDER BY ek.verildi), '[]'::jsonb) INTO kodlar FROM ekipman_kodu ek WHERE ek.firma_id = f AND ek.ekipman_id = p_id;
  BEGIN
    DELETE FROM plan_ekipman WHERE firma_id = f AND ekipman_id = p_id;
    DELETE FROM ekipman_kodu WHERE firma_id = f AND ekipman_id = p_id;
    DELETE FROM ekipman WHERE firma_id = f AND id = p_id;
  EXCEPTION WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('durum', 'kullanildi', 'kullanim', '{}'::jsonb);
  END;
  INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, eski, ayrinti)
    VALUES (p_kim, 'ekipman.sil', 'ekipman', p_id::text, to_jsonb(e) - 'firma_id', jsonb_build_object('planlar', planlar, 'kodlar', kodlar));
  RETURN jsonb_build_object('durum', 'tamam', 'ad', e.kod);
END $$;
ALTER FUNCTION ekipman_sil(uuid, text) SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION ekipman_sil(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ekipman_sil(uuid, text) TO probata_uygulama;
