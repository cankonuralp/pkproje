/* S.A.Y CHAT — "CHATTEN OKU"NUN KAPSAMI (2026-11-07; beceri B02 §8.1). SAF. Kullanıcı aralık vermediyse işlenmemiş mesajların SON kesintisiz
   bloğu: sondan geriye, aynı İstanbul günü ve iki mesaj arası en çok BLOK_BOSLUK_DK (karar 1). Gün ("dünkü"), saat aralığı ("10:20'den sonrası") ya da
   sözcük ("kazan dairesinden sonrası": sözcüğün son geçtiği mesajdan o bloğun sonuna) verilirse o. İşlenmişler varsayılan olarak alınmaz.
   Dönen: seçilenler (zaman sırasıyla) ve dışarıda kalan İŞLENMEMİŞ mesaj sayısı. Kilit tests/say-chat-kapsam.test.ts. */
import { BLOK_BOSLUK_DK, istanbulGunu } from "./sema.ts";

export interface KapsamMesaji { zaman: string; sira: number; metin: string | null; islendi: unknown }
export interface Kapsam {
  /** ISO zaman (dahil) */
  bas?: string | null;
  bit?: string | null;
  /** İstanbul günü YYYY-AA-GG */
  gun?: string | null;
  sozcuk?: string | null;
  /** işlenmişleri de al */
  islenmis?: boolean;
}
export interface KapsamSonucu<T> { secilen: T[]; disarida: number; nasil: "blok" | "aralik" | "gun" | "sozcuk" }

const sirala = <T extends KapsamMesaji>(l: readonly T[]) => [...l].sort((a, b) => a.zaman.localeCompare(b.zaman) || a.sira - b.sira);
const zamani = (x: KapsamMesaji) => Date.parse(x.zaman);
const kopuk = (a: KapsamMesaji, b: KapsamMesaji) => istanbulGunu(a.zaman) !== istanbulGunu(b.zaman) || zamani(b) - zamani(a) > BLOK_BOSLUK_DK * 60_000;
const kucuk = (s: string) => s.toLocaleLowerCase("tr");

/** sıralı listede i'nin bulunduğu bloğun [baş, son] sınırları */
function blokSiniri<T extends KapsamMesaji>(l: readonly T[], i: number): [number, number] {
  let bas = i, son = i;
  while (bas > 0 && !kopuk(l[bas - 1]!, l[bas]!)) bas--;
  while (son < l.length - 1 && !kopuk(l[son]!, l[son + 1]!)) son++;
  return [bas, son];
}

export function kapsamSec<T extends KapsamMesaji>(mesajlar: readonly T[], k: Kapsam = {}): KapsamSonucu<T> {
  const tum = sirala(mesajlar);
  const havuz = k.islenmis ? tum : tum.filter((m) => !m.islendi);
  let secilen: T[], nasil: KapsamSonucu<T>["nasil"];
  if (k.bas || k.bit) {
    const b = k.bas ? Date.parse(k.bas) : -Infinity, s = k.bit ? Date.parse(k.bit) : Infinity;
    secilen = havuz.filter((m) => zamani(m) >= b && zamani(m) <= s);
    nasil = "aralik";
  } else if (k.gun) {
    secilen = havuz.filter((m) => istanbulGunu(m.zaman) === k.gun);
    nasil = "gun";
  } else if (k.sozcuk?.trim()) {
    const sz = kucuk(k.sozcuk.trim());
    let i = -1;
    for (let j = havuz.length - 1; j >= 0; j--) if (kucuk(havuz[j]!.metin ?? "").includes(sz)) { i = j; break; }
    secilen = i < 0 ? [] : havuz.slice(i, blokSiniri(havuz, i)[1] + 1);
    nasil = "sozcuk";
  } else {
    secilen = havuz.length ? havuz.slice(blokSiniri(havuz, havuz.length - 1)[0]) : [];
    nasil = "blok";
  }
  const alinan = new Set(secilen);
  return { secilen, disarida: tum.filter((m) => !m.islendi && !alinan.has(m)).length, nasil };
}
