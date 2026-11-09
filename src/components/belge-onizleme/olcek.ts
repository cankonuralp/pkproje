/* BELGE ÖNİZLEMESİ — ÖLÇEK (2026-11-09; reisim: "telefonda pdf ön izlemesi ekrana sığmıyor, düzelt"), saf. Belgenin kâğıdı A4 genişliğinde (belge.css
   .rb-sayfa 794 px); kap daha darsa kâğıt kaba sığacak kadar küçülür, geniş kapta büyümez. Aşağı yuvarlanır: yuvarlama yana kaydırma çubuğu açmasın. */
export const KAGIT_GENISLIGI = 794;

export function belgeOlcegi(kapGenisligi: number): number {
  if (!(kapGenisligi > 0) || kapGenisligi >= KAGIT_GENISLIGI) return 1;
  return Math.floor((kapGenisligi / KAGIT_GENISLIGI) * 1000) / 1000;
}
