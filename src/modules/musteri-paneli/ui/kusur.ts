/* uygunsuzluk metni → kriter + açıklama (liste, önizleme ve Excel aynı parçalamayı kullanır; saf). Kriter kayıtta ayrıysa (0036: imzada motorun
   kusur kriteri yazılır) ondan bölünür — kriterin kendisinde ": " olabilir (ör. "Kablo renk kodları Nötr: Mavi Toprak: Sarı/ Yeşil"). Eski kayıtta
   kriter yok: format motorunun "Kriter: açıklama" biçiminden ilk ": " ile (yaklaşık); ayraç yoksa hepsi kriter. */
export function kusurParcala(metin: string, kriter: string | null = null): { kriter: string; aciklama: string } {
  if (kriter && metin === kriter) return { kriter, aciklama: "" };
  if (kriter && metin.startsWith(`${kriter}: `)) return { kriter, aciklama: metin.slice(kriter.length + 2) };
  const i = metin.indexOf(": ");
  return i > 0 ? { kriter: metin.slice(0, i), aciklama: metin.slice(i + 2) } : { kriter: metin, aciklama: "" };
}
