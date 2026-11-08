/* S.A.Y CHAT — SAHA LİSTESİ BANDI VE "S.A.Y OKUSUN" (2026-11-08; sunum claude.ai 4ApGDVAfUgvm8C5nTSRVbh sürüm 2, K3 K4 K6 — reisim: "peki say chatte bu ayrımı kullanıcı nasıl fark
   edecek"). SAF. Kural: ücret yalnız yapay zekâ işaretli yerde; sohbet hiçbir şeyi okumaz. Tuşta tahmini tutar, iş bitince gerçek tutar. Tahmin canlı ölçümden: 10 fotoğraf + 2 yazı,
   5 rapor = 0,034 $ (2026-11-07, P-1126-005). Kilit tests/saha-listesi.test.ts. */

/** "S.A.Y okusun" tahmini (dolar): sabit + fotoğraf + yazı (fotoğraf okunup rapora yazılır, yazı yalnız okunur) */
export function tahminiTutar(foto: number, diger: number): number {
  return 0.005 + Math.max(0, foto) * 0.0028 + Math.max(0, diger) * 0.0005;
}

/** "0,03 $"; bir sentten azı "0,01 $'dan az" */
export function tutarMetni(dolar: number): string {
  if (dolar < 0.01) return "0,01 $'dan az";
  return `${dolar.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
}

/** tuştaki tahmin */
export const tahminMetni = (foto: number, diger: number): string => {
  const t = Math.max(0.01, tahminiTutar(foto, diger));
  return `≈ ${t.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
};

/** S.A.Y'a giden komut (kişinin elle yazacağı cümlenin aynısı) */
export const okuKomutu = (planNo: string | null) => (planNo ? `Chatten oku, ${planNo} planına yaz` : "Chatten oku");

export interface BantPlani { id: string; no: string; tesis: string; baslangic: string; bitis: string; kalan: number }

/** K6: bandın planı — kişinin seçtiği (hâlâ listedeyse); yoksa bugünü kapsayan; yoksa en yakın tarihli (geçmiş ve gelecek arasında gün farkı en küçük, eşitlikte geçmiş) */
export function bantPlani<T extends BantPlani>(planlar: readonly T[], bugun: string, secili: string | null): T | null {
  const s = planlar.find((p) => p.id === secili);
  if (s) return s;
  const gun = (x: string) => Date.parse(`${x}T00:00:00Z`) / 86_400_000, b = gun(bugun);
  const fark = (p: T) => (p.baslangic <= bugun && bugun <= p.bitis ? 0 : p.baslangic > bugun ? gun(p.baslangic) - b : b - gun(p.bitis));
  let en: T | null = null;
  for (const p of planlar) {
    if (!en) { en = p; continue; }
    const a = fark(p), c = fark(en);
    if (a < c || (a === c && p.baslangic > en.baslangic && p.baslangic <= bugun)) en = p;
  }
  return en;
}
