/* PERFORMANS — SAF HESAP (329; maket performans.html M15, maket-performans.js; pkproje §1.1 "personellerin yaptığı işler, gün başı işler vb takip
   edilecek grafikleri oluşturulacak, gün başı rapor elde edilen kazanç", §3.1 modül 19, §3.2 madde 5; reisim 2026-09-27: 24 / 48 saat içinde
   tamamlanma; 2026-09-29: "yeni durumundan itibaren her rapor performansı etkiler" — silinen rapor sayılmaz; KOD-GECIS §3 "tablo yok — rapor ve
   durum geçişlerinden özet"). Veri sunucuda okunur; dönem, özet, tamamlanma süresi, zaman grafiği, süreç adımları ve GÖRÜNÜRLÜK (kim neyi görür —
   denetçi yalnız kendisini, kazançsız; branş yöneticisi branşını) burada, test edilebilir. Tutarlar KURUŞ, KDV hariç. */

export type Brans = "m" | "e";
export interface PRapor {
  id: string; personelId: string; planId: string; tesisId: string; brans: Brans | null;
  /** açılış günü (Türkiye takvimi) ve zamanı (ISO) */
  gun: string; olustu: string;
  ilkGonderim: string | null; gonderildi: string | null; onay: string | null;
  /** ilk imzalı sürümün zamanı ("Tamamlandı") */
  imza: string | null;
  /** şimdiki revizyonun imzası — son imza adımı onayla bununla ölçülür (revizyonda onay yenilenir; 329–332 incelemesi). Yoksa null */
  sonImza?: string | null;
  imzali: boolean;
  /** birim fiyat (Teklifler'in bağı; fiyat yoksa 0) */
  kazanc: number;
  /** geri gönderme → sonraki gönderim (düzeltme); yeniden gönderilmediyse null */
  geriler: { geri: string; gonderim: string | null }[];
}
export interface PKisi { id: string; ad: string; meslek: string; brans: Brans | null; denetci: boolean; etkin: boolean }

/* ── DÖNEM (maket DONEM: bu ay · bu yıl · geçen yıl · tarih aralığı — 62 günden uzunsa aylık) ── */
export type DonemKodu = "ay" | "yil" | "gecen" | "aralik";
export const DONEM_AD: Record<DonemKodu, string> = { ay: "Bu ay", yil: "Bu yıl", gecen: "Geçen yıl", aralik: "Tarih aralığı" };
export interface Donem { kod: DonemKodu; bas: string; bit: string; grup: "gun" | "ay" }
const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
const gecerliGun = (s: string) => ISO.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
/** dönem: bugünden; aralıkta iki tarih (başlangıç ≤ bitiş ≤ bugün, en çok 5 yıl), yoksa hata iletisi */
export function donemCoz(kod: string, bugun: string, bas?: string, bit?: string): Donem | { hata: string } {
  const y = bugun.slice(0, 4);
  if (kod === "yil") return { kod, bas: `${y}-01-01`, bit: bugun, grup: "ay" };
  if (kod === "gecen") return { kod, bas: `${Number(y) - 1}-01-01`, bit: `${Number(y) - 1}-12-31`, grup: "ay" };
  if (kod === "aralik") {
    if (!bas || !bit || !gecerliGun(bas) || !gecerliGun(bit)) return { hata: "GG.AA.YYYY biçiminde iki tarih." };
    if (bas > bit) return { hata: "Başlangıç bitişten sonra olamaz." };
    if (bit > bugun) return { hata: "Bitiş bugünden sonra olamaz." };
    if (gunFarki(bas, bit) > 366 * 5) return { hata: "En çok 5 yıllık aralık." };
    return { kod, bas, bit, grup: gunFarki(bas, bit) > 62 ? "ay" : "gun" };
  }
  return { kod: "ay", bas: `${bugun.slice(0, 7)}-01`, bit: bugun, grup: "gun" };
}
export const icinde = (d: Donem, gun: string) => gun >= d.bas && gun <= d.bit;

/* ── GÖRÜNÜRLÜK (KOD-GECIS §4 Performans: planlama görür · denetçi kendi · branş yöneticileri branşı · firma yöneticisi görür · muhasebe —) ── */
export type Gorunurluk = { kapsam: "hepsi" } | { kapsam: "brans"; branslar: Brans[] } | { kapsam: "kendi"; personelId: string | null };
/** rapor görünür mü (kendi: yalnız kendi raporu; branş: türünün branşı) */
export function raporGorunur(g: Gorunurluk, r: Pick<PRapor, "personelId" | "brans">): boolean {
  return g.kapsam === "hepsi" || (g.kapsam === "brans" ? !!r.brans && g.branslar.includes(r.brans) : !!g.personelId && r.personelId === g.personelId);
}
/** kişi görünür mü (kendi: yalnız kendisi; branş: mesleğinin branşı) */
export function kisiGorunur(g: Gorunurluk, k: Pick<PKisi, "id" | "brans">): boolean {
  return g.kapsam === "hepsi" || (g.kapsam === "brans" ? !!k.brans && g.branslar.includes(k.brans) : !!g.personelId && k.id === g.personelId);
}
/** kazanç (birim fiyat) yalnız "kendi" olmayana (maket 148: denetçi kendi sayılarını görür, kazancını görmez) */
export const kazancGorunur = (g: Gorunurluk) => g.kapsam !== "kendi";

/* ── ÖZET ── */
export interface SureOzeti { n: number; h24: number; h48: number; h48p: number; pay: number }
export interface Ozet { rapor: number; gun: number; ort: number; kazanc: number; gunKazanc: number; geri: number; son: string | null; sure: SureOzeti }
/** tamamlanma süresi (saat): açılış → ilk imza; imzalanmamışsa null */
export const sure = (r: Pick<PRapor, "olustu" | "imza">) => (r.imza ? (Date.parse(r.imza) - Date.parse(r.olustu)) / 36e5 : null);
export function sureOzeti(rl: readonly PRapor[]): SureOzeti {
  const o = { n: 0, h24: 0, h48: 0, h48p: 0, pay: 0 };
  for (const r of rl) { const h = sure(r); if (h === null) continue; o.n++; if (h <= 24) o.h24++; else if (h <= 48) o.h48++; else o.h48p++; }
  o.pay = o.n ? Math.round((o.h24 * 100) / o.n) : 0;
  return o;
}
/** dönemde açılan raporlar (silinmemiş; okuyucu siler) */
export const donemRaporlari = (rl: readonly PRapor[], d: Donem) => rl.filter((r) => icinde(d, r.gun));
/** dönemde geri gönderilen rapor sayısı (geri gönderme günü dönemde; açılışı daha önce olabilir) */
export const geriSayisi = (rl: readonly PRapor[], d: Donem) => rl.filter((r) => r.geriler.some((x) => icinde(d, istanbulGunu(x.geri)))).length;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const istanbulGunu = (iso: string) => GUN.format(new Date(iso));
/** rapor · çalışılan gün (kişi × gün) · gün başı · kazanç · gün başı kazanç · geri gönderilen · son rapor günü · tamamlanma süresi */
export function ozet(rl: readonly PRapor[], geri: number): Ozet {
  const gunler = new Set(rl.map((r) => `${r.personelId}|${r.gun}`));
  const n = gunler.size, kazanc = rl.reduce((t, r) => t + r.kazanc, 0);
  return { rapor: rl.length, gun: n, ort: n ? rl.length / n : 0, kazanc, gunKazanc: n ? Math.round(kazanc / n) : 0, geri,
    son: rl.reduce<string | null>((s, r) => (!s || r.gun > s ? r.gun : s), null), sure: sureOzeti(rl) };
}

/* ── ZAMAN GRAFİĞİ: kısa dönemde rapor yazılan günler; uzunda aylar (boş ay da görünür) ── */
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
export interface ZamanGrubu { etiket: string; tam: string; m: number; e: number; rapor: number; kazanc: number }
export function zamanGruplari(rl: readonly PRapor[], d: Donem): ZamanGrubu[] {
  const grup = (l: readonly PRapor[], etiket: string, tam: string): ZamanGrubu => {
    const m = l.filter((r) => r.brans === "m").length;
    return { etiket, tam, m, e: l.length - m, rapor: l.length, kazanc: l.reduce((t, r) => t + r.kazanc, 0) };
  };
  if (d.grup === "gun") {
    const g = new Map<string, PRapor[]>();
    for (const r of rl) g.set(r.gun, [...(g.get(r.gun) ?? []), r]);
    return [...g.keys()].sort().map((k) => grup(g.get(k)!, `${k.slice(8, 10)}.${k.slice(5, 7)}`,
      `${k.slice(8, 10)}.${k.slice(5, 7)}.${k.slice(0, 4)} ${GUNLER[new Date(`${k}T12:00:00Z`).getUTCDay()]}`));
  }
  const out: ZamanGrubu[] = [], cokYil = d.bas.slice(0, 4) !== d.bit.slice(0, 4);
  let y = Number(d.bas.slice(0, 4)), a = Number(d.bas.slice(5, 7));
  for (let ay = `${y}-${String(a).padStart(2, "0")}`; ay <= d.bit.slice(0, 7);) {
    const ad = AYLAR[a - 1];
    out.push(grup(rl.filter((r) => r.gun.slice(0, 7) === ay), `${ad.slice(0, 3)}${cokYil ? ` ${String(y).slice(2)}` : ""}`, `${ad}${cokYil ? ` ${y}` : ""}`));
    if (a === 12) { y++; a = 1; } else a++;
    ay = `${y}-${String(a).padStart(2, "0")}`;
  }
  return out;
}

/* ── SÜREÇ ADIMLARI (kişi sayfası; maket surecGrafikleri): yazım (açılış → ilk gönderim), düzeltme (geri → yeniden gönderim), onay (gönderim →
   yönetici onayı), son imza (onay → imza). Yalnız adımı tamamlanmış raporlar ortalamaya girer. ── */
export interface SurecAdimi { ad: string; ort: number; n: number }
const saat = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 36e5;
export function surecAdimlari(rl: readonly PRapor[]): SurecAdimi[] {
  const ort = (l: number[]) => (l.length ? Math.round((l.reduce((t, x) => t + x, 0) / l.length) * 10) / 10 : 0);
  const yazim = rl.filter((r) => r.ilkGonderim).map((r) => saat(r.olustu, r.ilkGonderim!));
  const duzelt = rl.flatMap((r) => r.geriler.filter((x) => x.gonderim).map((x) => saat(x.geri, x.gonderim!)));
  const onay = rl.filter((r) => r.gonderildi && r.onay).map((r) => saat(r.gonderildi!, r.onay!));
  /* şimdiki revizyonun onayı → imzası; eksi süre (veri tutarsız) ortalamaya girmez */
  const imza = rl.filter((r) => r.onay && r.sonImza && r.sonImza >= r.onay).map((r) => saat(r.onay!, r.sonImza!));
  return [["Yazım", yazim], ["Düzeltme", duzelt], ["Onay", onay], ["Son imza", imza]].map(([ad, l]) => ({ ad: ad as string, ort: ort(l as number[]), n: (l as number[]).length }));
}

/* ── KİŞİNİN GÜNLÜK İŞİ (gün × tesis) ── */
export interface GunlukIs { gun: string; tesisId: string; planIdleri: string[]; rapor: number; imzali: number; kazanc: number }
export function gunlukIsler(rl: readonly PRapor[]): GunlukIs[] {
  const g = new Map<string, GunlukIs>();
  for (const r of rl) {
    const k = `${r.gun}|${r.tesisId}`;
    const x = g.get(k) ?? { gun: r.gun, tesisId: r.tesisId, planIdleri: [], rapor: 0, imzali: 0, kazanc: 0 };
    x.rapor++; if (r.imzali) x.imzali++; x.kazanc += r.kazanc; if (!x.planIdleri.includes(r.planId)) x.planIdleri.push(r.planId);
    g.set(k, x);
  }
  return [...g.values()].sort((a, b) => b.gun.localeCompare(a.gun) || a.tesisId.localeCompare(b.tesisId));
}
