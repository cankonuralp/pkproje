/* SABİT TANIMLAR (ARKA-UC §2.1 · KOD-GECIS §8) — firma verisi DEĞİL, herkes için aynı, yavaş değişen tanımlar. Tek kaynak burası; şemadan geçer.
   Cihaza karma adlı JSON olarak iner (`/api/tanim/<ad>.<karma>.json`): içerik değişince adı değişir, cihaz yenisini indirir; aynı ad sonsuz önbellekte
   kalır (09-B6), çevrimdışı pakete girer (K3). Firma verisi buraya yazılmaz (iki kişi aynı anda yazamaz, yetki uygulanamaz — §2.1).
   İçerik onaylı maketten ve onaylı kararlardan; alan bilgisi uydurulmaz. Yeni tanım (il / ilçe, meslekler, Bakanlık formatları …) kaynağıyla eklenir. */
import { createHash } from "node:crypto";
import { TANIM_SEMALARI, TANIMLAR, type TanimAdi } from "./veri.ts";

export { TANIM_SEMALARI, TANIMLAR, type TanimAdi };

/** anahtarları sıralı JSON (karma yazım sırasına bağlı olmasın) */
export function duzenliJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(duzenliJson).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${duzenliJson((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v);
}

export interface TanimDosyasi { ad: TanimAdi; dosya: string; govde: string }

/** her tanım: şemadan geçmiş gövde + karma adlı dosya adı (sunucu açılırken bir kez) */
export const TANIM_DOSYALARI: readonly TanimDosyasi[] = (Object.keys(TANIM_SEMALARI) as TanimAdi[]).map((ad) => {
  const govde = duzenliJson(TANIM_SEMALARI[ad].parse(TANIMLAR[ad]));
  return { ad, dosya: `${ad}.${createHash("sha256").update(govde).digest("hex").slice(0, 12)}.json`, govde };
});

export const tanimDizini = () => Object.fromEntries(TANIM_DOSYALARI.map((t) => [t.ad, `/api/tanim/${t.dosya}`]));
