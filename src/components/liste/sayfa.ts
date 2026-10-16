/* SAYFA HESABI — saf (React'siz; kilit tests/sayfa.test.ts, olumsuz kanıt tests/bozan/sayfa.bozan.ts). Bütün ekran tabloları ve listeleri 20'den
   sonra sayfalı (reisim 2026-10-16: "herhangi bir liste tablo, ekranda çok fazla veri olunca ekran kasacağı için 20 den fazlası sayfalı olsun diğer
   sayfalara doğru aksın"; pkproje §9 2026-10-15 "S.A.Y CLAUDE GİBİ" (3) "yeni satır sonraki sayfaya akar"). Ekranın parçası Sayfalayici.tsx
   (useSayfa, TabloSayfalari, SayfaliListe); süzgeçli listeler aynı sayıyla kendi süzgeçlerinde sayfalanır (suzgec.ts listele).
   · sayfa numarası 1'den; istenen sayfa sayfa sayısını aşarsa sona, 1'in altına düşerse başa çekilir (satır silinince boş sayfada kalınmaz);
   · satır numarası geneldir: 2. sayfanın ilk satırı 21 (bas = 20, sıfırdan);
   · satır eklenince açık sayfa eklenen İLK satırın sayfasıdır (tek satır eklenince o satırın sayfası; çok satır eklenince eklemenin başladığı yer). */
import { KALIP } from "../../styles/kalip.ts";

/** kendi boyu olmayan ekran tablosunun / listesinin sayfa boyu (kalip.ts sayfa.tablo) */
export const TABLO_SAYFA: number = KALIP.sayfa.tablo;

export interface SayfaHesabi {
  /** satır sayısı */
  toplam: number;
  boy: number;
  /** geçerli sayfa (1'den; sayfa sayısıyla sınırlı) */
  sayfa: number;
  sayfaSayisi: number;
  /** sayfanın ilk satırının genel sırası (0'dan) ve sonrası (dilim: bas ≤ i < son) */
  bas: number;
  son: number;
  /** satır sayısı sayfa boyunu aşıyor mu — aşmıyorsa sayfalayıcı çizilmez */
  sayfali: boolean;
}

const tamSayi = (x: number, varsayilan: number) => (Number.isFinite(x) ? Math.floor(x) : varsayilan);

export function sayfaHesapla(toplam: number, istenen: number, boy: number = TABLO_SAYFA): SayfaHesabi {
  const b = Math.max(1, tamSayi(boy, TABLO_SAYFA));
  const t = Math.max(0, tamSayi(toplam, 0));
  const sayfaSayisi = Math.max(1, Math.ceil(t / b));
  const sayfa = Math.min(Math.max(1, tamSayi(istenen, 1)), sayfaSayisi);
  const bas = (sayfa - 1) * b;
  return { toplam: t, boy: b, sayfa, sayfaSayisi, bas, son: Math.min(t, bas + b), sayfali: t > b };
}

/** genel sırası i (0'dan) olan satırın sayfası */
export function satirSayfasi(i: number, boy: number = TABLO_SAYFA): number {
  return Math.floor(Math.max(0, tamSayi(i, 0)) / Math.max(1, tamSayi(boy, TABLO_SAYFA))) + 1;
}

/** sayfanın satırları (genel sırayı korumak için bas'tan sayın: satırın genel sırası = h.bas + sayfadaki sırası) */
export function sayfaDilimi<T>(l: readonly T[], h: SayfaHesabi): T[] {
  return l.slice(h.bas, h.son);
}

/** satır sayısı değişince açık sayfa: arttıysa eklenen ilk satırın sayfası ("diğer sayfalara doğru aksın"); azaldıysa (silme) aynı sayfa, taşmaz */
export function degisenSayfa(onceki: number, simdiki: number, sayfa: number, boy: number = TABLO_SAYFA): number {
  if (simdiki > onceki) return satirSayfasi(onceki, boy);
  return sayfaHesapla(simdiki, sayfa, boy).sayfa;
}
