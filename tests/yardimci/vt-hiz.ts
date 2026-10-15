/* VERİTABANI HIZI DENETİMLERİ (564; göç 0091) — tests/kiraci-izolasyonu.test.ts ve tests/bozan/vt-hiz.bozan.ts aynı sorguları kullanır.
   1. Politikada ÇIPLAK (sorgu başına bir kez hesaplanmayan) firma / müşteri / hesap çağrısı: "SELECT " ile başlamayan gecerli_firma() …
   2. Dizinsiz yabancı anahtar: anahtarın sütunlarıyla aynı sırada başlayan dizin yok. */
/* bir metinde parçanın kaç kez geçtiği (düz metin; düzenli ifade yok — PostgreSQL 17 / 18 aynı) */
const say = (metin: string, parca: string) => `((length(${metin}) - length(replace(${metin}, '${parca}', ''))) / length('${parca}'))`;
const CAGRILAR: [cagri: string, sarili: string][] = [
  ["gecerli_firma()", "SELECT gecerli_firma()"],
  ["gecerli_musteri()", "SELECT gecerli_musteri()"],
  ["current_setting(''app.hesap_id''::text, true)", "SELECT current_setting(''app.hesap_id''::text, true)"],
];
const T = "(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''))";
/** çıplak çağrı: çağrının geçtiği sayı, "SELECT çağrı" sayısından fazla */
export const CIPLAK_POLITIKA = `
  SELECT p.tablename || '.' || p.policyname AS ad FROM pg_policies p
  WHERE p.schemaname = 'public' AND (${CAGRILAR.map(([c, s]) => `${say(T, c)} > ${say(T, s)}`).join(" OR ")})
  ORDER BY 1`;
export const DIZINSIZ_YABANCI_ANAHTAR = `
  SELECT con.conrelid::regclass::text || '.' || con.conname AS ad FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = cls.relnamespace
  WHERE con.contype = 'f' AND ns.nspname = 'public'
    AND NOT EXISTS (SELECT 1 FROM pg_index ix WHERE ix.indrelid = con.conrelid
      AND (string_to_array(ix.indkey::text, ' ')::int2[])[1:array_length(con.conkey, 1)] = con.conkey)
  ORDER BY 1`;
