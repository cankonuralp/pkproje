/* GERİ AL / YİNELE (493; hata listesi 29 + 46 maketi, reisim 2026-10-11: "maketi onaylıyorum … mevcuttaki sistemi koruyalım gelişmiş seçenekler tuşu
   olsun") — saf. Format kurucunun taslağındaki her değişiklik (kâğıtta yazılan, eklenen, çıkarılan, taşınan; gelişmiş görünümde sürüklenen) bir
   adımdır: şimdiki hâl "geri" yığınına girer, "ileri" yığını boşalır (yeni değişiklikten sonra yinelenecek yol kapanır). Kâğıt ve gelişmiş görünüm
   aynı geçmişi kullanır. En çok 100 adım tutulur (en eski düşer). Taslak kaydedilince ya da "Vazgeç"le geçmiş sıfırlanır. */

export interface Gecmis<T> { geri: readonly T[]; ileri: readonly T[] }
export const GECMIS_EN_COK = 100;
export const bosGecmis = <T>(): Gecmis<T> => ({ geri: [], ileri: [] });

/** yeni değişiklik: şimdiki hâl geri yığınına; ileri yığını boşalır */
export function adimEkle<T>(g: Gecmis<T>, simdi: T): Gecmis<T> {
  return { geri: [...g.geri, simdi].slice(-GECMIS_EN_COK), ileri: [] };
}

/** geri al: son adımın öncesine döner (şimdiki hâl ileri yığınına); geri alınacak yoksa null */
export function geriAl<T>(g: Gecmis<T>, simdi: T): { gecmis: Gecmis<T>; deger: T } | null {
  if (!g.geri.length) return null;
  return { gecmis: { geri: g.geri.slice(0, -1), ileri: [...g.ileri, simdi].slice(-GECMIS_EN_COK) }, deger: g.geri[g.geri.length - 1] };
}

/** yinele: geri alınan adımı yeniden uygular; yinelenecek yoksa null */
export function yinele<T>(g: Gecmis<T>, simdi: T): { gecmis: Gecmis<T>; deger: T } | null {
  if (!g.ileri.length) return null;
  return { gecmis: { geri: [...g.geri, simdi].slice(-GECMIS_EN_COK), ileri: g.ileri.slice(0, -1) }, deger: g.ileri[g.ileri.length - 1] };
}

/** klavye kısayolu: Ctrl / Cmd + Z geri al, Ctrl / Cmd + Y ya da Ctrl / Cmd + Shift + Z yinele — yazı alanındayken YOK (alanın kendi geri alması) */
export function kisayol(e: { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; hedefYazi: boolean }): "geri" | "ileri" | null {
  if (e.hedefYazi || e.altKey || !(e.ctrlKey || e.metaKey)) return null;
  const k = e.key.toLowerCase();
  if (k === "z") return e.shiftKey ? "ileri" : "geri";
  if (k === "y" && !e.shiftKey) return "ileri";
  return null;
}
