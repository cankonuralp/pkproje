/* 2026-11-09: belge önizlemesi tek üreticiden (components/belge-onizleme) — "rb-onizleme" sınıfını elle yazan ekran kâğıdı kaba sığdırmaz, telefonda taşar. */
import { dosyalar, oku } from "./denetimler.ts";

export function onizlemeKacaklari(kaynaklar: readonly { ad: string; metin: string }[] = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }))): string[] {
  return kaynaklar.filter((d) => !d.ad.endsWith("components/belge-onizleme/BelgeOnizleme.tsx") && /rb-onizleme/.test(d.metin)).map((d) => d.ad);
}
