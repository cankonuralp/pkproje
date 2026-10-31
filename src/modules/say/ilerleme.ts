/* S.A.Y BEKLEME ÇUBUĞU — TAHMİNİ SÜRE VE YÜZDE (2026-10-31; reisim: "sadece düşünüyor, çalışıyor yazmasın termin süresi ve yüzdelik bar olsun"). SAF.
   · Adımı bilinen işte (fotoğraf okuma "3 / 10") yüzde adımdan: biten adım + şimdiki adımın geçen süresi; kalan süre adım başına ortalamadan.
   · Adımı bilinmeyen işte (S.A.Y'ın düşünmesi, işlemler) tahmin bu cihazda aynı türden işlerin (şablon, ekli soru, serbest soru, okuma) son
     sürelerinin ortancasından; yoksa türün başlangıç tahmini. Yüzde geçen / tahmin ile yükselir ama iş bitmeden %95'i geçmez; tahmin aşılınca
     "biraz daha sürüyor" der (yanlış "bitti" izlenimi vermez).
   Kilit tests/say-ilerleme.test.ts. */

/** türün başlangıç tahmini (sn) — bu cihazda geçmiş yokken */
const BASLANGIC: Readonly<Record<string, number>> = { serbest: 25, ekli: 60, oku: 40, sablon: 90 };
/** saklanan süre sayısı (tür başına) */
export const SURE_EN_COK = 10;

/** işin türü: şablonla başlayan iş şablonun kimliğiyle, ekli soru, serbest soru, okuma */
export const isTuru = (x: { sablon?: string | null; ekli?: boolean; oku?: boolean }): string =>
  x.oku ? "oku" : x.sablon ? `sablon:${x.sablon}` : x.ekli ? "ekli" : "serbest";

/** tahmini süre (sn): geçmişin ortancası, yoksa başlangıç */
export function tahminSn(tur: string, gecmis: Readonly<Record<string, readonly number[]>>): number {
  const l = [...(gecmis[tur] ?? [])].filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  if (l.length) return Math.max(3, Math.round(l[Math.floor(l.length / 2)]!));
  return BASLANGIC[tur.startsWith("sablon:") ? "sablon" : tur] ?? BASLANGIC.serbest!;
}

/** biten işin süresi geçmişe (en yenisi sonda, tür başına en çok SURE_EN_COK) */
export function sureEkle(gecmis: Readonly<Record<string, readonly number[]>>, tur: string, sn: number): Record<string, number[]> {
  const y: Record<string, number[]> = Object.fromEntries(Object.entries(gecmis).map(([k, v]) => [k, [...v]]));
  if (!(sn > 0) || !Number.isFinite(sn)) return y;
  y[tur] = [...(y[tur] ?? []), Math.round(sn)].slice(-SURE_EN_COK);
  return y;
}

/** "3 / 10 · Bölüm" biçimindeki ilerlemeden adım (yoksa null) */
export function adimOku(ilerleme: string | null): { i: number; n: number } | null {
  const m = /^(\d+)\s*\/\s*(\d+)/.exec(ilerleme ?? "");
  if (!m) return null;
  const i = Number(m[1]), n = Number(m[2]);
  return n > 0 && i >= 1 && i <= n ? { i, n } : null;
}

export interface Ilerleme { yuzde: number; kalanSn: number | null; asildi: boolean }

/** geçen süre (sn), tahmin (sn), adım (varsa: i şimdiki adım, 1'den; adimBas: şimdiki adımın başından beri geçen sn) */
export function ilerleme(gecenSn: number, tahmin: number, adim: { i: number; n: number; adimBasSn: number } | null = null): Ilerleme {
  const g = Math.max(0, gecenSn);
  if (adim) {
    const biten = adim.i - 1;
    const adimSn = biten > 0 ? (g - adim.adimBasSn) / biten || tahmin / adim.n : tahmin / adim.n;
    const simdiki = Math.min(0.95, adim.adimBasSn / Math.max(1, adimSn));
    const yuzde = Math.min(99, Math.round(((biten + simdiki) / adim.n) * 100));
    const kalan = Math.max(0, Math.round(adimSn * (adim.n - biten) - adim.adimBasSn));
    return { yuzde, kalanSn: kalan, asildi: false };
  }
  const t = Math.max(1, tahmin);
  const yuzde = Math.min(95, Math.round(95 * (1 - Math.exp(-2.3 * g / t))));
  return g <= t ? { yuzde, kalanSn: Math.max(1, Math.round(t - g)), asildi: false } : { yuzde, kalanSn: null, asildi: true };
}

/** "yaklaşık 20 sn" / "yaklaşık 2 dk" */
export const sureYaz = (sn: number): string => (sn < 60 ? `yaklaşık ${Math.max(1, Math.round(sn))} sn` : `yaklaşık ${Math.round(sn / 60)} dk`);
