/* FORMAT MOTORU › HESAPLAR — ölçüm tablosu satırlarının sınır kuralları (RAPOR-FORMAT.md §2.3: "en az / en çok / formül → satır sonucu
   kendiliğinden Uygun / Uygun değil"). Formüller Bakanlık kriter belgelerinden (ZPKK01, ZPKK02); maket maket-veri.js ile birebir
   (MV.noktaHesap, MV.linyeHesap, MV.pdHesap, MV.ziHesap, MV.rcdTestYeter). Tanım bir hesabı ADIYLA seçer; formül kodda tektir.
   ⛔ Bu dosya içe aktarma yapmaz (saf; istemci ve sunucu aynı sonucu verir; olumsuz kanıt kopyasını bellekte bozar). Boş değer değerlendirilmez. */

/** "0,34" · "0.34" · 12 → sayı; boş ya da sayı değilse NaN */
export function sayiOku(v: unknown): number {
  const s = String(v ?? "").trim();
  return /^\d+([.,]\d+)?$/.test(s) ? Number.parseFloat(s.replace(",", ".")) : Number.NaN;
}

/** sınır kuralı: en çok (≤) / en az (≥); sınırı yoksa ya da değer boşsa null */
export function sinirSonucu(op: "<=" | ">=" | undefined, sinir: number | undefined, deger: unknown): boolean | null {
  if (!op || sinir === undefined) return null;
  const n = sayiOku(deger);
  if (Number.isNaN(n)) return null;
  return op === "<=" ? n <= sinir : n >= sinir;
}

/** açma eğrisi çarpanı (ZPKK02 madde 3: B = 5 × In · C = 10 × In · D = 15 × In) */
export const EGRI_KAT: Readonly<Record<string, number>> = Object.freeze({ B: 5, C: 10, D: 15 });
/** faz-toprak gerilimi Uo (V) */
export const UO = 230;
/** RCD açma süresi sınırı (ms) */
export const RCD_SURE = 200;

export interface NoktaSonucu { ia: number; zs: number; zx: number | null; ik: number | null; not: number | null; agir: boolean }
/** ZPKR01 5.1 ölçüm noktası: Ia = çarpan × In · Zs = Uo / Ia · Ik1 = Uo / Zx. Uygunluk notu önerisi: Zx ≤ Zs → Not-1 (32 A'e kadar prizde RCD
    yoksa Not-5, ağır) · aşıyor ama RCD var → Not-4 · aşıyor, RCD yok → Not-2 (ağır). Öneridir; denetçi notu değiştirir (P2). */
export function noktaHesap(n: { egri: string; In: unknown; zx: unknown; rcd?: unknown; priz?: boolean }): NoktaSonucu {
  const In = sayiOku(n.In), zx = sayiOku(n.zx);
  const ia = (EGRI_KAT[n.egri] ?? 10) * (Number.isNaN(In) ? 0 : In);
  const zs = ia > 0 ? Math.round((UO / ia) * 1000) / 1000 : 0;
  const rcd = String(n.rcd ?? "").trim() !== "";
  const zxD = Number.isNaN(zx) ? null : zx;
  const not = zxD === null || ia <= 0 ? null : zxD <= zs ? (n.priz && !rcd && In <= 32 ? 5 : 1) : rcd ? 4 : 2;
  return { ia, zs, zx: zxD, ik: zxD === null || zxD <= 0 ? null : Math.round(UO / zxD), not, agir: not === 2 || not === 5 };
}

/** RCD testi yeterli mi: IΔ ≤ IΔn ve TΔ ≤ 200 ms; değer yoksa null */
export function rcdTestYeter(idn: unknown, id: unknown, td: unknown): boolean | null {
  const n = sayiOku(idn), i = sayiOku(id), d = sayiOku(td);
  if (Number.isNaN(n) || Number.isNaN(i) || Number.isNaN(d)) return null;
  return i <= n && d <= RCD_SURE;
}

export interface SatirSonucu { uygun: boolean; neden: string[] }

/** PE kesiti alt sınırı (ETTY Çizelge 8): S ≤ 16 → S · 16 < S ≤ 35 → 16 · S > 35 → S / 2 */
export const peSiniri = (faz: number) => (faz <= 16 ? faz : faz <= 35 ? 16 : faz / 2);

/** ZPKR02 6.1 linye (pano sigortası): Icu ≥ Ik3 · Ib ≤ In ≤ Iz · N/PEN ≥ faz · PE ≥ Çizelge 8 · RCD testi. Hiç değer yoksa null. */
export function linyeHesap(x: { akim: unknown; ib?: unknown; iz?: unknown; faz?: unknown; npen?: unknown; pe?: unknown; icu?: unknown; rcd?: unknown; id?: unknown; td?: unknown }, ik3: unknown): SatirSonucu | null {
  const n: string[] = [];
  let dolu = false;
  const In = sayiOku(x.akim), ib = sayiOku(x.ib), iz = sayiOku(x.iz), faz = sayiOku(x.faz), npen = sayiOku(x.npen), pe = sayiOku(x.pe), icu = sayiOku(x.icu), k3 = sayiOku(ik3);
  if (!Number.isNaN(icu) && !Number.isNaN(k3) && icu < k3) n.push(`Icu ${String(x.icu)} kA < kısa devre akımı ${String(ik3)} kA`);
  if (!Number.isNaN(ib) || !Number.isNaN(iz)) {
    dolu = true;
    if ((!Number.isNaN(ib) && ib > In) || (!Number.isNaN(iz) && In > iz)) n.push("Ib ≤ In ≤ Iz sağlanmıyor");
  }
  if (!Number.isNaN(faz) && !Number.isNaN(npen)) { dolu = true; if (npen < faz) n.push("N/PEN kesiti faz kesitinden küçük"); }
  if (!Number.isNaN(faz) && !Number.isNaN(pe)) { dolu = true; if (pe < peSiniri(faz)) n.push("PE kesiti yetersiz"); }
  if (String(x.rcd ?? "").trim() !== "") {
    const r = rcdTestYeter(x.rcd, x.id, x.td);
    if (r !== null) { dolu = true; if (!r) n.push("RCD testi yetersiz"); }
  }
  return dolu || n.length ? { uygun: n.length === 0, neden: n } : null;
}

/** ZPKR02 6.2 potansiyel dengeleme: PD 6–25 mm² · tamamlayıcı PD ≥ 4 mm² */
export function pdHesap(x: { kesit?: unknown; tkesit?: unknown }): SatirSonucu | null {
  const k = sayiOku(x.kesit), t = sayiOku(x.tkesit);
  if (Number.isNaN(k) && Number.isNaN(t)) return null;
  const n: string[] = [];
  if (!Number.isNaN(k) && (k < 6 || k > 25)) n.push("PD kesiti 6–25 mm² dışında");
  if (!Number.isNaN(t) && t < 4) n.push("Tamamlayıcı PD kesiti 4 mm²'den küçük");
  return { uygun: n.length === 0, neden: n };
}

/** ZPKR02 6.3 zemin izolasyonu: direnç > 50 kΩ */
export function ziHesap(x: { direnc?: unknown }): SatirSonucu | null {
  const d = sayiOku(x.direnc);
  if (Number.isNaN(d)) return null;
  return d > 50 ? { uygun: true, neden: [] } : { uygun: false, neden: ["Zemin izolasyon direnci 50 kΩ'dan büyük değil"] };
}
