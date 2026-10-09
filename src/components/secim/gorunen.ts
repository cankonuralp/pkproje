/* GÖRÜNEN SEÇENEKLER — seçim listesinin (SecenekListesi) ve telefon süzgeç levhasının ortak, saf hesabı (425). Saf: testte doğrudan koşar. */
import { tr } from "../liste/suzgec.ts";

/** [değer, etiket, ek (sağda soluk; ör. "3 rapor")] */
export type SecimSecenegi = readonly [deger: string, etiket: string, ek?: string];

/** 425 (reisim 2026-10-09: "çok müşteri olunca kullanışsız olur ve donmalara sebep olur"): liste en çok bu kadar eşleşme ÇİZER — binlerce
    müşteri / personel / ekipmanda her tuş vuruşunda binlerce satır çizilmez; seçili seçenek her zaman görünür, kalanı aramayla daraltılır */
export const EN_COK_GORUNEN = 50;

/** aramaya uyan seçenekler, en çok EN_COK_GORUNEN; seçili olan (aramaya uyuyorsa) her zaman listede. kalan: çizilmeyen eşleşme sayısı */
export function gorunenSecenekler(secenekler: readonly SecimSecenegi[], deger: string, ara: string, seciliBasta = false) {
  const q = tr(ara.trim());
  const uyan = secenekler.filter((o) => !q || tr(o[1]).includes(q));
  const sirali = seciliBasta ? [...uyan.filter((o) => o[0] === deger), ...uyan.filter((o) => o[0] !== deger)] : uyan;
  const liste = sirali.slice(0, EN_COK_GORUNEN);
  const secili = sirali.find((o) => o[0] === deger);
  if (secili && !liste.includes(secili)) liste[liste.length - 1] = secili;
  return { liste, kalan: uyan.length - liste.length, hic: uyan.length === 0 };
}
