-- ══ 0092 · TÜRKÇE ARAMA VE SIRALAMA (566; reisim 2026-10-15: "sitede donma yaşanabilecek şeyler" → analiz: listeler bütün kayıtları tarayıcıya
-- indirip orada süzüyordu, 09-B3 "sunucuda sayfalı" — "elindeki bütün işleri yap") ══
-- Liste süzgeci sunucuya taşınınca arama ve sıralama tarayıcıdakiyle AYNI sonucu vermeli (components/liste/suzgec.ts: toLocaleLowerCase("tr"),
-- localeCompare("tr")). Veritabanının yerel ayarına bağlı kalmamak için (yerelde C, Supabase'te en_US) iki saf işlev:
--   tr_kucuk(x): Türkçe küçük harf — önce I → ı, İ → i ve Türkçe büyük harfler, sonra ASCII lower (C yerel ayarında lower yalnız ASCII'yi küçültür;
--                en_US'te 'İ' → 'i̇' olurdu: çeviri lower'dan ÖNCE).
--   tr_sira(x):  sıralama anahtarı — tr_kucuk + Türkçe harf sırası (c < ç < d, g < ğ < h, h < ı < i, o < ö < p, s < ş < t, u < ü < v) "C" harmanıyla
--                karşılaştırılınca: ç → "c~" ('~' bütün küçük harflerden sonra, sonraki harften önce) …
-- ⛔ Her göç IDEMPOTENT (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION tr_kucuk(x text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  SET search_path = pg_catalog, public, pg_temp
  AS $$ SELECT lower(translate(x, 'IİÇĞÖŞÜÂÎÛ', 'ıiçğöşüâîû')) $$;

CREATE OR REPLACE FUNCTION tr_sira(x text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  SET search_path = pg_catalog, public, pg_temp
  AS $$ SELECT replace(replace(replace(replace(replace(replace(translate(tr_kucuk(x), 'âîû', 'aiu'),
    'ç', 'c~'), 'ğ', 'g~'), 'ı', 'h~'), 'ö', 'o~'), 'ş', 's~'), 'ü', 'u~') $$;
