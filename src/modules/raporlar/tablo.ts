/* SAHA RAPORU · TABLO YARDIMCILARI (486; reisim 2026-10-10: "test tablosu olan yerler de, son satırı kopyala, satırları otomatik sırala, gibi tuşlar
   da olsun ve yazdığım işlere yarasın"). Ölçüm tablosunun "Son satırı kopyala", satırın "Kopyala"sı ve "Sırala"sı bu işlevlerle; saf — ekran ve test
   aynı işlevi koşar. Kopyada bütün değerler (uygunluk notu dahil) gelir, tablonun İLK sütunundaki kimlik / no (F3, X09, 12) bir artar — denetçi
   yalnız değişen değeri yazar. Sıralama ilk sütuna göre doğal sırayla (Türkçe; F2 < F10), boşlar sona, eşitler eski sırasında. */
import type { Satir } from "./foto-eslestir.ts";

/** sondaki sayı bir artar, sıfır dolgusu korunur: "F3" → "F4" · "X09" → "X10" · "7" → "8" · "Priz 2. kat" → "Priz 3. kat"; sayısız değer aynen */
export function sonrakiKod(v: string): string {
  const m = /^(.*?)(\d+)(\D*)$/.exec(v);
  if (!m) return v;
  const n = (BigInt(m[2]) + 1n).toString();
  return `${m[1]}${n.padStart(m[2].length, "0")}${m[3]}`;
}

/** satırın kopyası: bütün değerler, ilk sütundaki kimlik / no bir artar */
export function satirKopyasi(s: Satir, ilkSutun: string | undefined): Satir {
  const k = { ...s };
  if (ilkSutun && k[ilkSutun]) k[ilkSutun] = sonrakiKod(k[ilkSutun]);
  return k;
}

/** i. satırın kopyası hemen altına (i tablonun dışındaysa tablo aynen) */
export function satirKopyala(l: readonly Satir[], i: number, ilkSutun: string | undefined): Satir[] {
  if (i < 0 || i >= l.length) return [...l];
  return [...l.slice(0, i + 1), satirKopyasi(l[i], ilkSutun), ...l.slice(i + 1)];
}

const SIRA = new Intl.Collator("tr", { numeric: true, sensitivity: "base" });

/** doğal sıra (Türkçe; sayılar sayı gibi — F2 < F10); boş değerler sona; eşitlerde eski sıra korunur */
export function satirlariSirala(l: readonly Satir[], sutun: string): Satir[] {
  return l.map((s, i) => ({ s, i, v: (s[sutun] ?? "").trim() })).sort((a, b) => {
    if (!a.v !== !b.v) return a.v ? -1 : 1;
    return SIRA.compare(a.v, b.v) || a.i - b.i;
  }).map((x) => x.s);
}

/** tablo zaten sıralı mı (Sırala bir şey değiştirmeyecekse söylenir) */
export const siraliMi = (l: readonly Satir[], sutun: string) => satirlariSirala(l, sutun).every((s, i) => s === l[i]);
