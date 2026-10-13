/* FOTOĞRAF SEÇİMİ — tek kural (saf). 527 (reisim 2026-10-13: "say chatte fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf
   yükleyebilmek olsun") S.A.Y Chat'te doğdu; 531 (reisim 2026-10-13: "araçlar ve zimmetlerde de galeriden fotoğraf ekleme seçeneği ekle") ortak
   oldu. Fotoğraf tuşu (FotoTusu.tsx) iki yol açar: kamera ya da galeri / bilgisayar; galeriden birden çok fotoğraf seçilebilir. Hangileri girer:
   cihazda küçültüldükten sonra (kucult.ts — 09-A4) yalnız JPEG / PNG (türü bildirilmeyeni sunucu baytlarından denetler), boş olmayan, en çok
   enCokBayt (çağıranın sınırı: S.A.Y Chat kuyruğu 2 MB, teslim fotoğrafı 8 MB) — ve yer kadar (S.A.Y Chat ekipman 12, başlık 6, etiket 1; zimmet 10;
   araç açısı 1); yer dolunca kalanlar küçültülmez bile. Sunucu aynısını yeniden denetler; bu ön denetim reddedilecek fotoğrafı göndermeden söyler
   (sessiz atlama yok). */

/** tarayıcının File'ı bu biçimdedir (ad, bildirilen tür, bayt) */
export interface SecilenFoto { name: string; type: string; size: number }
export interface FotoSecimi<T extends SecilenFoto> { alinan: T[]; uygunsuz: string[]; fazla: number }

export const fotoUygun = (f: SecilenFoto, enCokBayt: number) => (!f.type || /^image\/(jpeg|png)$/.test(f.type)) && f.size > 0 && f.size <= enCokBayt;

/** seçilenleri sırayla hazırlar (küçültme) ve ayırır: alınan · uygunsuz (ad) · yer dolduğu için alınmayan sayısı */
export async function fotolariSec<T extends SecilenFoto>(l: readonly T[], yer: number, hazirla: (f: T) => Promise<T>, enCokBayt: number): Promise<FotoSecimi<T>> {
  const alinan: T[] = [], uygunsuz: string[] = [];
  let fazla = 0;
  for (const f of l) {
    if (alinan.length >= yer) { fazla++; continue; }
    const d = await hazirla(f);
    if (fotoUygun(d, enCokBayt)) alinan.push(d); else uygunsuz.push(f.name);
  }
  return { alinan, uygunsuz, fazla };
}

/** eklenmeyenlerin kısa açıklaması (hepsi alındıysa null); sinir: yerin cümlesi ("Kayda en çok 12 ekipman fotoğrafı") */
export function fotoSecimiUyarisi(s: FotoSecimi<SecilenFoto>, sinir: string, enCokBayt: number): string | null {
  const p: string[] = [];
  if (s.uygunsuz.length) p.push(`${s.uygunsuz.length === 1 ? s.uygunsuz[0] : `${s.uygunsuz.length} fotoğraf`} eklenmedi: yalnız JPEG ya da PNG, en çok ${enCokBayt >> 20} MB`);
  if (s.fazla) p.push(`${sinir}; ${s.fazla} fotoğraf eklenmedi`);
  return p.length ? `${p.join(". ")}.` : null;
}
