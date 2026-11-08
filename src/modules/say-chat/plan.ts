/* S.A.Y CHAT — ÜSTTEKİ PLAN SEÇİMİ VE "S.A.Y OKUSUN" KOMUTU (2026-11-08). SAF. Kilit tests/say-chat-plan.test.ts, olumsuz kanıt tests/bozan/say-chat-plan.bozan.ts. */

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
