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

/* 2026-10-26 (reisim: "verilen formatta yazanlara göre standart ekleme", "PDF'ten şablon kurulunca formatta yazan standartlar da türe kendiliğinden
   eklenecek"): basılı formun yazılarındaki standart atıfları — "TS EN 12817", "TS EN ISO 9927-1", "TS ISO 4309", "TS 1446", "TS HD 60364-6",
   "EN 13445-5:2014" (yıl atılır). Ad: numaradan sonra aynı yazıda gelen metin (ayraç, "·", ";" ya da sonraki numaraya kadar); yoksa boş. Numara
   tekil, ilk görülen adla. */
const STD_ATIF = /(?<![A-ZÇĞİÖŞÜa-zçğıöşü0-9])((?:(?:TS|EN|ISO|IEC|HD|CEN|CLC)(?: ?\/ ?| ))*(?:TS|EN|ISO|IEC|HD)) ?(\d{2,6}(?:[-.]\d{1,4})*)(?::\d{4}(?:\+[A-Z]\d{1,2}(?::\d{4})?)*)?(?![0-9A-Za-z])/g;
export function metindenStandartlar(metinler: readonly string[]): { no: string; konu: string }[] {
  const gor = new Map<string, string>();
  for (const ham of metinler) {
    const m = ham.replace(/\s+/g, " ");
    const l = [...m.matchAll(STD_ATIF)];
    l.forEach((x, i) => {
      const no = `${x[1].replace(/ ?\/ ?/g, "/").trim()} ${x[2]}`;
      if (!/^(TS|EN|ISO|IEC|HD)\b/.test(no)) return;
      const bas = (x.index ?? 0) + x[0].length, son = i + 1 < l.length ? l[i + 1].index ?? m.length : m.length;
      const konu = m.slice(bas, son).split(/\s+·\s+|;/)[0].replace(/^[\s:–—,.-]+/, "").replace(/[\s,;:–—-]+$/, "").trim().slice(0, 120);
      if (!gor.has(no) || (!gor.get(no) && konu.length >= 2)) gor.set(no, konu.length >= 2 ? konu : "");
    });
  }
  return [...gor].map(([no, konu]) => ({ no, konu }));
}
