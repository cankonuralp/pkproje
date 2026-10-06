/* FOTOĞRAFTAN OKUNANLARIN TABLOYA YERİ — saf (354; 350–351 incelemesi, maket rapor.html Z3 nokta-oku / noktaYaz: "ölçü aletinin ekranından okunan Zx,
   Zx'i boş noktalara öneri olarak yazılır"; eskiden her okunan satır tablonun sonuna eklenip zorunlu adı / eğrisi boş yeni satır açıyordu).
   · Hedef: var olan, en az bir değeri olan satırda okunanın BÜTÜN sütunları boşsa o satır (sırayla; her satır en çok bir okunana) — ölçü aletinden
     yalnız Zx okunduysa Zx'i boş ilk nokta. Uyan satır yoksa tablonun sonuna yeni satır (pano okuması: boş tabloya satırlar).
   · Uygula: hedefi olan okunan o satırın yalnız BOŞ hücrelerine yazılır (elle girilen değer ezilmez); hiç değeri olmayan (boş açılmış) satır düşer,
     yeni satırlar sona eklenir. Kart ve uygulama aynı işlevle aynı anki tabloya bakar. */
export type Satir = Record<string, string>;
const bos = (x: string | undefined) => !(x ?? "").trim();
export const doluSatir = (s: Satir) => Object.values(s).some((x) => !bos(x));

/** okunan her satırın hedefi: var olan satırın sırası ya da null (yeni satır) */
export function okunanHedefleri(mevcut: readonly Satir[], okunan: readonly { degerler: Satir }[]): (number | null)[] {
  const alinan = new Set<number>();
  return okunan.map((o) => {
    const sutunlar = Object.keys(o.degerler);
    if (!sutunlar.length) return null;
    const i = mevcut.findIndex((s, j) => !alinan.has(j) && doluSatir(s) && sutunlar.every((c) => bos(s[c])));
    if (i < 0) return null;
    alinan.add(i);
    return i;
  });
}

/** seçilen okunanları tabloya uygular — hedefler KARTIN gösterdiğidir (bütün öneriler aynı anki tabloya göre okunanHedefleri; bir kısmı uygulanınca
    kalanlar yeni tabloya göre yeniden hesaplanır ve gösterilen yerlerine düşer) */
export function okunanlariUygula(mevcut: readonly Satir[], secilen: readonly { degerler: Satir; hedef: number | null }[]): Satir[] {
  const tablo = mevcut.map((s) => ({ ...s }));
  const yeni: Satir[] = [];
  for (const o of secilen) {
    const t = o.hedef === null ? undefined : tablo[o.hedef];
    if (!t) { yeni.push({ ...o.degerler }); continue; }
    for (const [c, v] of Object.entries(o.degerler)) if (bos(t[c])) t[c] = v;
  }
  return [...tablo.filter(doluSatir), ...yeni];
}
