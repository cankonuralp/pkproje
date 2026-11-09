/* S.A.Y Chat fotoğrafı: küçültme ve kuyruğa giden biçim (sohbet ve Rapor modu aynı; 2026-11-09). */
import { fotografiKucult } from "../../../components/foto/kucult";
import { CHAT_FOTO_BAYT, FOTO_EN_UZUN, FOTO_KALITE } from "../sema";

/** fotoğraf küçültme kademeleri (karar 3: ilk kademe; kuyruğun sınırını aşarsa sonraki) */
const KADEMELER: readonly [number, number][] = [[FOTO_EN_UZUN, FOTO_KALITE], [2000, 0.8], [1600, 0.75], [1200, 0.7]];
export async function chatFotoKucult(f: File): Promise<File | null> {
  for (const [uzun, kalite] of KADEMELER) {
    const k = await fotografiKucult(f, uzun, kalite).catch(() => null);
    if (k && k.size <= CHAT_FOTO_BAYT) return k;
  }
  return null;
}
export const base64 = (d: Blob) => new Promise<string>((coz, red) => {
  const r = new FileReader();
  r.onload = () => { const s = String(r.result); coz(s.slice(s.indexOf(",") + 1)); };
  r.onerror = () => red(r.error ?? new Error("Dosya okunamadı."));
  r.readAsDataURL(d);
});
