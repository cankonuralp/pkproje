/* uygunsuzluk metni (format motorunun kusur metni "Kriter: açıklama" — src/format/motor.ts) → kriter + açıklama; ayraç yoksa hepsi kriter.
   Saf: liste, önizleme ve Excel aynı parçalamayı kullanır. */
export function kusurParcala(metin: string): { kriter: string; aciklama: string } {
  const i = metin.indexOf(": ");
  return i > 0 ? { kriter: metin.slice(0, i), aciklama: metin.slice(i + 2) } : { kriter: metin, aciklama: "" };
}
