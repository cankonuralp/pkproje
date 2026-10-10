/* YAN MENÜ SAYISININ SEBEBİ — saf parçalar (480; şerit TakipSeridi.tsx, sayılar anasayfa/server/takip.ts). Test: tests/takip-seridi.test.ts. */
import { MODULLER } from "../../modules/moduller.ts";

export interface TakipNedeni { tur: "kirmizi" | "sari"; sayi: number; metin: string; yer: string; sayfada: boolean }
/** modül (§3.1 no) → balon; ad: ekran okuyucunun ve ipucunun okuduğu anlam; neden: şeridin satırları */
export type KabukTakip = Record<number, { kirmizi: number; sari: number; ad: { kirmizi: string; sari: string }; neden?: TakipNedeni[] }>;

export const temizYol = (yol: string) => (yol.length > 1 ? yol.replace(/\/+$/, "") : yol);
/** adresin modülü: modülün kökü ya da altı (/onaylar/talepler → Onaylar; /dokumanlar/egitimler → Dökümanlar) */
export const yolunModulu = (yol: string) => MODULLER.find((m) => yol === `/${m.yol}` || yol.startsWith(`/${m.yol}/`));
/** bu sayfada gösterilecek sebepler: sebebin kendi sayfası onu zaten gösteriyorsa (sayfada) orada yok */
export const sayfaNedenleri = (l: readonly TakipNedeni[] | undefined, yol: string) => (l ?? []).filter((n) => !(n.sayfada && n.yer === yol));
