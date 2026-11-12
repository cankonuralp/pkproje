/* GÜNLÜK ÇİZELGE (2026-11-12; maket yerel/maket/turkak-modeli.html 5. bölüm — pkproje.md §11 T7; reisim: "yazılan raporda süre bazlı olarak 13.30 -
   14.00 de yapılan ekipmanın başında olmalı … log kayıtları düzgün olmalı"): bir günde kim, hangi saatte, hangi ekipmanın başındaydı — kontrol
   kayıtlarından (rapora yazılan saat: düzeltme varsa o). Kişi kişi gruplanır, saate göre sıralanır; elle yazılan saat ve sapmalı kontrol işaretlidir.
   Saf: sunucu satırları verir (raporlar.ts gunlukKontroller), burada gruplanır; çubukların yeri ve Excel tablosu da buradan. */

export interface GunlukKontrol {
  kisiId: string; kisi: string; raporId: string; raporNo: string; ekipman: string; tur: string; musteri: string;
  /** rapora yazılan saat — "YYYY-MM-DDTHH:MM" (Türkiye saati); kontrol sürüyorsa bitiş null */
  bas: string; bit: string | null;
  /** saat gerekçeyle elle yazıldı / düzeltildi */
  elle: boolean;
  /** onaya gönderilirken kaydedilen sapmalar (metinleri) */
  sapmalar: readonly string[];
}
export interface GunlukSatir extends GunlukKontrol { sure: number | null; dikkat: boolean; durum: string }
export interface GunlukKisi { kisiId: string; kisi: string; satirlar: GunlukSatir[]; toplamDk: number }
export interface GunlukCizelge { kisiler: GunlukKisi[]; /** çizelgenin saat aralığı (tam saat) */ aralik: { bas: number; bit: number } }

const dkGun = (s: string) => Number(s.slice(11, 13)) * 60 + Number(s.slice(14, 16));
const an = (s: string) => new Date(`${s}:00+03:00`).getTime();

export function gunlukCizelge(l: readonly GunlukKontrol[], gun: string): GunlukCizelge {
  const kisiler = new Map<string, GunlukKisi>();
  let enErken = 8 * 60, enGec = 18 * 60;
  for (const k of [...l].sort((a, b) => a.kisi.localeCompare(b.kisi, "tr") || a.bas.localeCompare(b.bas))) {
    const sure = k.bit ? Math.max(0, Math.round((an(k.bit) - an(k.bas)) / 60_000)) : null;
    const durum = [k.bit ? null : "Sürüyor", k.elle ? "Saat elle yazıldı" : null, ...k.sapmalar].filter(Boolean).join(" · ");
    const g = kisiler.get(k.kisiId) ?? { kisiId: k.kisiId, kisi: k.kisi, satirlar: [], toplamDk: 0 };
    g.satirlar.push({ ...k, sure, dikkat: k.elle || k.sapmalar.length > 0, durum });
    g.toplamDk += sure ?? 0;
    kisiler.set(k.kisiId, g);
    /* aralık yalnız o günün saatlerinden (gece yarısını aşan kontrol gün sonunda kesilir) */
    const b = k.bas.slice(0, 10) === gun ? dkGun(k.bas) : 0, s = !k.bit ? b : k.bit.slice(0, 10) === gun ? dkGun(k.bit) : 24 * 60;
    enErken = Math.min(enErken, b); enGec = Math.max(enGec, s);
  }
  return { kisiler: [...kisiler.values()], aralik: { bas: Math.floor(enErken / 60), bit: Math.min(24, Math.ceil(enGec / 60)) } };
}

/** satırın çizelgedeki çubuğu: soldan uzaklığı ve eni (yüzde); süren ya da çok kısa kontrol en az görünür ende */
export function cubuk(s: Pick<GunlukSatir, "bas" | "bit">, aralik: GunlukCizelge["aralik"], gun: string): { sol: number; en: number } {
  const bas0 = aralik.bas * 60, toplam = Math.max(60, (aralik.bit - aralik.bas) * 60);
  const b = s.bas.slice(0, 10) === gun ? dkGun(s.bas) : bas0;
  const t = !s.bit ? b : s.bit.slice(0, 10) === gun ? dkGun(s.bit) : aralik.bit * 60;
  const sol = Math.min(100, Math.max(0, ((b - bas0) / toplam) * 100));
  return { sol: Math.round(sol * 100) / 100, en: Math.round(Math.min(100 - sol, Math.max(0.6, ((t - b) / toplam) * 100)) * 100) / 100 };
}

const saat = (s: string | null) => (s ? s.slice(11, 16) : "");
/** Excel'e aktarılan tablo (başlık + satırlar) */
export function gunlukTablo(c: GunlukCizelge): (string | number)[][] {
  return [["Kişi", "Müşteri", "Ekipman", "Tür", "Rapor", "Başlangıç", "Bitiş", "Süre (dk)", "Durum"],
    ...c.kisiler.flatMap((k) => k.satirlar.map((s) => [s.kisi, s.musteri, s.ekipman, s.tur, s.raporNo, saat(s.bas), saat(s.bit), s.sure ?? "", s.durum]))];
}
