/* SAHA RAPORU · TABLO YARDIMCILARI (486; reisim 2026-10-10: "test tablosu olan yerler de, son satırı kopyala, satırları otomatik sırala, gibi tuşlar
   da olsun ve yazdığım işlere yarasın"). Ölçüm tablosunun "Son satırı kopyala"sı bu işlevlerle; saf — ekran ve test aynı işlevi koşar. Kopyada bütün
   değerler (uygunluk notu dahil) gelir, tablonun İLK sütunundaki kimlik / no (F3, X09, 12) bir artar — denetçi yalnız değişen değeri yazar.
   488 (reisim 2026-10-11: "sırala tuşu da kalksın zaten son satırı kopyala diyince sıra no değişerek iniyor"): Sırala ve satırın Kopyala'sı kalktı. */
import type { Satir } from "./foto-eslestir.ts";

/** sondaki sayı bir artar, sıfır dolgusu korunur: "F3" → "F4" · "X09" → "X10" · "7" → "8" · "Priz 2. kat" → "Priz 3. kat"; sayısız değer aynen */
export function sonrakiKod(v: string): string {
  const m = /^(.*?)(\d+)(\D*)$/.exec(v);
  if (!m) return v;
  const n = (BigInt(m[2]) + 1n).toString();
  return `${m[1]}${n.padStart(m[2].length, "0")}${m[3]}`;
}

/** satırın kopyası: bütün değerler, ilk sütundaki kimlik / no bir artar. 488: denetçinin elle sonucu ve gerekçesi (motor.ts ELLE_SONUC) o satırın
    kararıdır — kopyaya geçmez, kopyanın sonucu kendi değerlerinden çıkar */
export function satirKopyasi(s: Satir, ilkSutun: string | undefined): Satir {
  const k = { ...s };
  delete k._sonuc;
  delete k._gerekce;
  /* 595 (madde 5): hazır satırın adı o satırındır — kopya numarasıyla yazar */
  delete k._ad;
  if (ilkSutun && k[ilkSutun]) k[ilkSutun] = sonrakiKod(k[ilkSutun]);
  return k;
}

/** i. satırın kopyası hemen altına (i tablonun dışındaysa tablo aynen) */
export function satirKopyala(l: readonly Satir[], i: number, ilkSutun: string | undefined): Satir[] {
  if (i < 0 || i >= l.length) return [...l];
  return [...l.slice(0, i + 1), satirKopyasi(l[i], ilkSutun), ...l.slice(i + 1)];
}
