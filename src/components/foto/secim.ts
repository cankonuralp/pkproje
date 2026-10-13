/* S.A.Y CHAT FOTOĞRAF SEÇİMİ (527; reisim 2026-10-13: "say chatte fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek
   olsun") — saf. Fotoğraf tuşu iki yol açar (ui/FotoTusu.tsx): kamera ya da galeri / bilgisayar; galeriden birden çok fotoğraf seçilebilir. Hangileri
   kayda girer: cihazda küçültüldükten sonra yalnız JPEG / PNG (türü bildirilmeyeni sunucu baytlarından denetler), boş olmayan, en çok CHAT_FOTO_BAYT
   (kuyruğun gövde sınırı) — ve kayıttaki yer kadar (ekipman 12, başlık başına 6, etiket 1); yer dolunca kalanlar küçültülmez bile. Sunucu aynısını
   yeniden denetler (server/kayitlar.ts chatFoto); bu ön denetim, reddedilecek fotoğrafın kuyruğa girip "Cihazda" takılı kalmasını önler ve
   eklenmeyeni söyler (sessiz atlama yok). */
import { CHAT_FOTO_BAYT } from "./sema.ts";

/** tarayıcının File'ı bu biçimdedir (ad, bildirilen tür, bayt) */
export interface SecilenFoto { name: string; type: string; size: number }
export interface FotoSecimi<T extends SecilenFoto> { alinan: T[]; uygunsuz: string[]; fazla: number }

export const fotoUygun = (f: SecilenFoto) => (!f.type || /^image\/(jpeg|png)$/.test(f.type)) && f.size > 0 && f.size <= CHAT_FOTO_BAYT;

/** seçilenleri sırayla hazırlar (küçültme) ve ayırır: alınan · uygunsuz (ad) · yer dolduğu için alınmayan sayısı */
export async function fotolariSec<T extends SecilenFoto>(l: readonly T[], yer: number, hazirla: (f: T) => Promise<T>): Promise<FotoSecimi<T>> {
  const alinan: T[] = [], uygunsuz: string[] = [];
  let fazla = 0;
  for (const f of l) {
    if (alinan.length >= yer) { fazla++; continue; }
    const d = await hazirla(f);
    if (fotoUygun(d)) alinan.push(d); else uygunsuz.push(f.name);
  }
  return { alinan, uygunsuz, fazla };
}

/** eklenmeyenlerin kısa açıklaması (hepsi alındıysa null); sinir: kayıttaki yerin cümlesi ("Kayda en çok 12 ekipman fotoğrafı") */
export function fotoSecimiUyarisi(s: FotoSecimi<SecilenFoto>, sinir: string): string | null {
  const p: string[] = [];
  if (s.uygunsuz.length) p.push(`${s.uygunsuz.length === 1 ? s.uygunsuz[0] : `${s.uygunsuz.length} fotoğraf`} eklenmedi: yalnız JPEG ya da PNG, en çok ${CHAT_FOTO_BAYT >> 20} MB`);
  if (s.fazla) p.push(`${sinir}; ${s.fazla} fotoğraf eklenmedi`);
  return p.length ? `${p.join(". ")}.` : null;
}
