/* STANDART ATFI → KÜTÜPHANE (428; reisim 2026-10-09: "Denetçi muayene yaparken standarta tıklayınca pop-up olarak standart açılmalı okuyabilmeli").
   Rapor formatındaki madde / grup standardı serbest metindir ("TS EN 62305-3 Madde 5.3 · TS EN 62561", "ZPKK02 · Elektrik İç Tesisatı …"); burada
   atıflara bölünür ve her atıf firmanın standart kütüphanesindeki (Dökümanlar › Standartlar, güncel sürüm) en uzun eşleşen numarayla ya da
   Bakanlık kriter belgesiyle (ZPKKnn, src/tanim/kriterler.ts) eşlenir. Saf: istemci ve sunucu aynı işlevi kullanır. */

/** rapora giden kütüphane özeti (yalnız güncel sürüm; dosya kısa ömürlü yetkili indirmeyle — tek dosya ucu) */
export interface StandartOzeti { id: string; no: string; surumAdi: string; konu: string; dosyaId: string }

const duz = (s: string) => s.toLocaleUpperCase("tr").replace(/\s+/g, " ").trim();
const KRITER = /\bZPKK\d{2}\b/i;

/** Bakanlık kriter belgesinin kodu ("ZPKK02") ya da null */
export const kriterKodu = (atif: string) => KRITER.exec(atif)?.[0].toUpperCase() ?? null;

/** standart metni atıflara: " · " ve ";" ayırır. Kriter belgesi atfı ("ZPKK02 · belgenin adı") tek atıftır — adı ayrı bir standart sanılmaz */
export function atiflar(std: string | undefined | null): string[] {
  const s = (std ?? "").trim();
  if (!s) return [];
  if (KRITER.test(s)) return [s];
  return s.split(/\s+·\s+|\s*;\s*/).map((x) => x.trim()).filter(Boolean);
}

/** kütüphanede atfın BAŞINDA geçen en uzun standart numarası; numaranın hemen ardından rakam / harf gelirse eşleşmez ("TS EN 62305-3",
    "TS EN 62305-30"u tutmaz; "TS 622", "TS 6225"i tutmaz). Bulunamazsa null. */
export function standartBul<T extends { no: string }>(atif: string, liste: readonly T[]): T | null {
  const a = duz(atif);
  let en: T | null = null, enUzun = 0;
  for (const s of liste) {
    const n = duz(s.no);
    if (!n || !a.startsWith(n)) continue;
    const sonraki = a.charAt(n.length);
    if (sonraki && /[0-9A-ZÇĞİÖŞÜ]/.test(sonraki)) continue;
    if (n.length > enUzun) { en = s; enUzun = n.length; }
  }
  return en;
}
