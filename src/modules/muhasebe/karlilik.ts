/* KÂRLILIK VE GELİR-GİDER (328; maket maket-veri.js MV.ayMaliyet, MV.isKarlilik, MV.ayGelirGider, MV.donemGelirGider — 2026-09-27 reisim: "plan
   yapıldığında denetçi maaşı yakıt araç kira bedeli ofis giderleri vergiler vb tüm giderler etki edecek şekilde kazanç ve gider hesaplanarak kar
   hesaplanacak kar yüzdesi yazacak iş başına"; "gelir gidere göre bilançoda olacak"; L3 toplam). SAF: veriyi çağıran verir (KURUŞ), hesap burada.
   İş kârı = gelir (raporlanan, KDV hariç) − işe bağlı masraflar (KDV hariç, reddedilen hariç) − denetçi maliyeti (kişinin günlük maliyeti × işte
   çalıştığı gün) − genel gider payı (denetçi-günü başına pay × gün). Kişi-gün: kişinin o gün bu işte yazdığı rapor ÷ o gün bütün işlerde yazdığı
   rapor (aynı gün iki işe giden denetçinin günü bölünür). Günlük maliyet: o ayın bordrosu (yoksa önceki son, o da yoksa ilk — tahmini) ÷ 22 iş
   günü. Genel gider (ay): sabit giderler + işe bağlı olmayan masraflar + denetçi olmayan personelin maliyeti; denetçi-gününe eşit dağıtılır
   (÷ denetçi sayısı ÷ 22). Ay gelir-gideri: o ay denetlenen işlerin raporlananı − maaşlar − masraflar − sabit giderler. */
import { giderKdv } from "./sema.ts";

export const IS_GUNU = 22;
export interface KarRaporu { planId: string; personelId: string; gun: string }
export interface KarGideri { tarih: string; planId: string | null; tutar: number; oran: number; durum: string }
export interface KarKisisi { id: string; ad: string; basla: string; ayrildi: string | null; denetci: boolean }
export interface KarBordrosu { personelId: string; ay: string; maliyet: number }
export interface KarVerisi { raporlar: KarRaporu[]; giderler: KarGideri[]; kisiler: KarKisisi[]; bordrolar: KarBordrosu[]; sabitAylik: number }
export interface KarIsi { id: string; tarih: string; gelir: number }

/** ayın bordrosu; yoksa o aydan önceki son, o da yoksa ilk (tahmini) */
export function bordroAy(v: KarVerisi, kisi: string, ay: string): KarBordrosu | null {
  const l = v.bordrolar.filter((b) => b.personelId === kisi).sort((a, b) => b.ay.localeCompare(a.ay));
  return l.find((b) => b.ay <= ay) ?? l.at(-1) ?? null;
}
export const gunlukMaliyet = (v: KarVerisi, kisi: string, ay: string) => Math.round((bordroAy(v, kisi, ay)?.maliyet ?? 0) / IS_GUNU);
const haric = (l: readonly KarGideri[]) => l.reduce((n, g) => n + giderKdv(g.tutar, g.oran).haric, 0);

export interface AyMaliyeti { ay: string; kisi: number; denetciSayisi: number; maasDenetci: number; maasDiger: number; sabit: number; genel: number; masraf: number;
  bordroVar: boolean; gunPay: number }
export function ayMaliyet(v: KarVerisi, ay: string): AyMaliyeti {
  const aktif = v.kisiler.filter((p) => p.basla.slice(0, 7) <= ay && !(p.ayrildi && p.ayrildi.slice(0, 7) < ay));
  const den = aktif.filter((p) => p.denetci), diger = aktif.filter((p) => !p.denetci);
  const mal = (l: KarKisisi[]) => l.reduce((n, p) => n + (bordroAy(v, p.id, ay)?.maliyet ?? 0), 0);
  const gl = v.giderler.filter((g) => g.tarih.slice(0, 7) === ay && g.durum !== "red");
  const o = { ay, kisi: aktif.length, denetciSayisi: den.length, maasDenetci: mal(den), maasDiger: mal(diger), sabit: v.sabitAylik,
    genel: haric(gl.filter((g) => !g.planId)), masraf: haric(gl.filter((g) => g.planId)), bordroVar: v.bordrolar.some((b) => b.ay === ay), gunPay: 0 };
  o.gunPay = o.denetciSayisi ? Math.round((o.maasDiger + o.sabit + o.genel) / o.denetciSayisi / IS_GUNU) : 0;
  return o;
}

export interface IsKarlilik {
  ay: string; gelir: number; rapor: number; kisiler: { kisi: string; ad: string; gun: number; gunluk: number }[]; gun: number; gunPay: number; tahmini: boolean;
  dogrudan: number; personel: number; genel: number; gider: number; kar: number; oran: number;
}
export function isKarlilik(v: KarVerisi, x: KarIsi): IsKarlilik {
  const ay = x.tarih.slice(0, 7), am = ayMaliyet(v, ay);
  const kendi = v.raporlar.filter((r) => r.planId === x.id);
  const kg = new Map<string, Map<string, number>>();
  for (const r of kendi) { const m = kg.get(r.personelId) ?? new Map<string, number>(); m.set(r.gun, (m.get(r.gun) ?? 0) + 1); kg.set(r.personelId, m); }
  const gunRapor = (k: string, g: string) => v.raporlar.filter((r) => r.personelId === k && r.gun === g).length;
  const kisiler = [...kg.entries()].map(([k, m]) => ({
    kisi: k, ad: v.kisiler.find((p) => p.id === k)?.ad ?? "—",
    gun: Math.round([...m.entries()].reduce((n, [g, s]) => n + s / gunRapor(k, g), 0) * 100) / 100, gunluk: gunlukMaliyet(v, k, ay),
  })).sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
  const gun = Math.round(kisiler.reduce((n, k) => n + k.gun, 0) * 100) / 100;
  const dogrudan = haric(v.giderler.filter((g) => g.planId === x.id && g.durum !== "red"));
  const personel = kisiler.reduce((n, k) => n + Math.round(k.gun * k.gunluk), 0), genel = Math.round(am.gunPay * gun);
  const gider = dogrudan + personel + genel, kar = x.gelir - gider;
  return { ay, gelir: x.gelir, rapor: kendi.length, kisiler, gun, gunPay: am.gunPay, tahmini: !am.bordroVar, dogrudan, personel, genel, gider, kar,
    oran: x.gelir ? Math.round((kar / x.gelir) * 1000) / 10 : 0 };
}

export interface AyGelirGider { am: AyMaliyeti; isler: string[]; gelir: number; gider: number; kar: number; oran: number | null }
export function ayGelirGider(v: KarVerisi, ay: string, isler: readonly KarIsi[]): AyGelirGider {
  const am = ayMaliyet(v, ay), l = isler.filter((x) => x.tarih.slice(0, 7) === ay);
  const gelir = l.reduce((n, x) => n + x.gelir, 0), gider = am.maasDenetci + am.maasDiger + am.masraf + am.genel + am.sabit;
  return { am, isler: l.map((x) => x.id), gelir, gider, kar: gelir - gider, oran: gelir ? Math.round(((gelir - gider) / gelir) * 1000) / 10 : null };
}
export interface DonemGelirGider { aylar: (AyGelirGider & { ay: string })[]; ay: number; isler: string[]; gelir: number; gider: number; kar: number; oran: number | null;
  maas: number; masraf: number; genel: number; sabit: number; tahmini: number }
/** verilen aylar (eskiden yeniye) toplanır; her ay ayrıca (aylara göre döküm) */
export function donemGelirGider(v: KarVerisi, aylar: readonly string[], isler: readonly KarIsi[]): DonemGelirGider {
  const l = aylar.map((ay) => ({ ...ayGelirGider(v, ay, isler), ay }));
  const top = (f: (d: AyGelirGider) => number) => l.reduce((n, d) => n + f(d), 0);
  const gelir = top((d) => d.gelir), gider = top((d) => d.gider);
  return { aylar: l, ay: aylar.length, isler: l.flatMap((d) => d.isler), gelir, gider, kar: gelir - gider, oran: gelir ? Math.round(((gelir - gider) / gelir) * 1000) / 10 : null,
    maas: top((d) => d.am.maasDenetci + d.am.maasDiger), masraf: top((d) => d.am.masraf), genel: top((d) => d.am.genel), sabit: top((d) => d.am.sabit),
    tahmini: l.filter((d) => !d.am.bordroVar).length };
}
/** "YYYY-AA" → bir önceki ay */
export function oncekiAy(ay: string): string {
  const [y, a] = ay.split("-").map(Number);
  return a === 1 ? `${y - 1}-12` : `${y}-${String(a - 1).padStart(2, "0")}`;
}
/** bu aydan geriye n ay (yeniden eskiye) */
export function sonAylar(buAy: string, n: number): string[] {
  const l = [buAy];
  while (l.length < n) l.push(oncekiAy(l.at(-1)!));
  return l;
}
const AY_AD = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export const ayAd = (ay: string) => `${AY_AD[Number(ay.slice(5, 7)) - 1]} ${ay.slice(0, 4)}`;
