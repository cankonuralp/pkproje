-- ══ 0035 · MÜŞTERİ PANELİ › MUAYENE PERSONELİ BELGELERİ (323; maket musteri.html #/personel personelCiz; P3 2026-10-01 reisim: "müşteri
-- girişine … muayene personeli belgeleri kısmı olur o müşteriye giden muayene personelinin firmanın izin verdiği belgelerini görür (ekipnet
-- belgesi isg belgeleri vs)") ══
-- Müşteri rolü personel, özlük, eğitim ve atama tablolarına HİÇ dokunmaz: iki işlev yalnız gerekeni döndürür (sahibin haklarıyla, firma ve
-- müşteri süzgeci açık yazılı — 0030'daki musteri_son_surum gibi):
--   musteri_personeli(): müşterinin görebildiği tesislere GİDEN muayene personeli — son imzalı raporun yazanı ya da AÇIK planın ekibi; ad, meslek,
--   son gidiş, tesisler. Başka kişisel alan (telefon, TC, adres …) yok.
--   musteri_personel_belgeleri(): bu kişilerin firmanın MÜŞTERİYE AÇTIĞI belgeleri — firma ayarı "musteri_belge" (özlük türleri, eğitim
--   sertifikaları: hepsi ya da seçili türler, ekipman atama belgesi); ayar yoksa başlangıç: yalnız EKİPNET + bütün eğitim sertifikaları (TS
--   başlangıcıyla aynı — src/server/ayar/ayar.ts, kilit testi). Kaldırılan / önceki kayıt ve dosyasız satır yok.
-- Dosya politikası bu belgelerin dosyasını da açar (yalnız listedekiler).
-- ⛔ Her göç IDEMPOTENT.

CREATE OR REPLACE FUNCTION musteri_personeli() RETURNS TABLE (personel_id uuid, ad text, meslek text, son date, tesisler uuid[])
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH g AS (
    SELECT r.personel_id, s.tesis_id, s.kontrol_tarihi AS gun
      FROM rapor_surumu s JOIN rapor r ON r.firma_id = s.firma_id AND r.id = s.rapor_id
      WHERE s.firma_id = gecerli_firma() AND s.musteri_id = gecerli_musteri() AND musteri_tesis_gorur(s.tesis_id)
        AND s.revizyon = (SELECT max(z.revizyon) FROM rapor_surumu z WHERE z.firma_id = s.firma_id AND z.rapor_id = s.rapor_id)
    UNION ALL
    SELECT k.personel_id, p.tesis_id, p.baslangic
      FROM plan p JOIN plan_ekip k ON k.firma_id = p.firma_id AND k.plan_id = p.id JOIN tesis t ON t.firma_id = p.firma_id AND t.id = p.tesis_id
      WHERE p.firma_id = gecerli_firma() AND t.musteri_id = gecerli_musteri() AND musteri_tesis_gorur(p.tesis_id)
        AND p.durum IN ('bekliyor', 'kabul', 'denetimde')
  )
  SELECT g.personel_id, pe.ad, pe.meslek, max(g.gun), array_agg(DISTINCT g.tesis_id)
    FROM g JOIN personel pe ON pe.firma_id = gecerli_firma() AND pe.id = g.personel_id
    WHERE gecerli_firma() IS NOT NULL AND gecerli_musteri() IS NOT NULL
    GROUP BY g.personel_id, pe.ad, pe.meslek $$;

CREATE OR REPLACE FUNCTION musteri_personel_belgeleri() RETURNS TABLE (personel_id uuid, kaynak text, tur text, ad text, dosya_id uuid, tarih date, gecerli date)
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH a AS (SELECT coalesce((SELECT f.deger FROM firma_ayar f WHERE f.firma_id = gecerli_firma() AND f.bolum = 'musteri_belge'), '{}'::jsonb) AS d),
       k AS (SELECT m.personel_id FROM musteri_personeli() m)
  SELECT o.personel_id, 'ozluk', o.tur, NULL::text, o.dosya_id, o.olustu::date, NULL::date
    FROM ozluk_belgesi o, a
    WHERE o.firma_id = gecerli_firma() AND o.personel_id IN (SELECT personel_id FROM k) AND o.kaldirildi IS NULL AND o.dosya_id IS NOT NULL
      AND o.tur IN (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(a.d->'ozluk') = 'array' THEN a.d->'ozluk' ELSE '["ekipnet"]'::jsonb END))
  UNION ALL
  SELECT e.personel_id, 'egitim', e.tur_id::text, t.ad, e.dosya_id, e.tarih, e.tekrar
    FROM egitim_kaydi e JOIN egitim_turu t ON t.firma_id = e.firma_id AND t.id = e.tur_id, a
    WHERE e.firma_id = gecerli_firma() AND e.personel_id IN (SELECT personel_id FROM k) AND NOT e.onceki AND e.dosya_id IS NOT NULL
      AND (jsonb_typeof(a.d->'egitim') IS DISTINCT FROM 'array' OR (a.d->'egitim') ? e.tur_id::text)
  UNION ALL
  SELECT x.personel_id, 'atama', x.tur_id::text, et.ad, x.dosya_id, x.tarih, NULL::date
    FROM ekipman_atamasi x JOIN ekipman_turu et ON et.firma_id = x.firma_id AND et.id = x.tur_id, a
    WHERE x.firma_id = gecerli_firma() AND x.personel_id IN (SELECT personel_id FROM k) AND x.kaldirildi IS NULL AND x.dosya_id IS NOT NULL
      AND coalesce((a.d->>'atama')::boolean, false) $$;

ALTER FUNCTION musteri_personeli() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION musteri_personel_belgeleri() SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION musteri_personeli() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION musteri_personel_belgeleri() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION musteri_personeli(), musteri_personel_belgeleri() TO probata_musteri;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dosya' AND policyname = 'dosya_musteri') THEN
    DROP POLICY dosya_musteri ON dosya;
  END IF;
  -- görebildiği imzalı rapor sürümünün, görebildiği sözleşmenin şu anki imzalı PDF'i ya da kendisine giden personelin müşteriye açık belgesi
  CREATE POLICY dosya_musteri ON dosya AS RESTRICTIVE FOR SELECT TO probata_musteri
    USING (cop IS NULL AND (
      (modul = 'rapor_imzali' AND EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.imzali_dosya = dosya.id))
      OR (modul = 'is_sozlesmesi' AND EXISTS (SELECT 1 FROM is_sozlesmesi z WHERE z.imzali_dosya = dosya.id))
      OR (modul IN ('ozluk', 'egitim', 'atama') AND EXISTS (SELECT 1 FROM musteri_personel_belgeleri() b WHERE b.dosya_id = dosya.id))));
END $$;
