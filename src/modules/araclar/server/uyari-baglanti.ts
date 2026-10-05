/* ARAÇLAR ↔ UYARILAR BAĞLANTISI (modül 20 → 23; 331 — maket MV.uyarilar "arac", 2026-10-03: muayene, trafik sigortası, kasko — geçen ya da eşik
   içinde biten; pasif araç sayılmaz). Uyarılar araç tablosuna dokunmaz; buradan okur. Eşik firma ayarı (Araçlar'ın kullandığı kalibrasyon eşiği).
   Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { belgeDurumu } from "../sema.ts";

export interface AracUyarisi { id: string; plaka: string; ad: string; belge: string; tarih: string; durum: "gecti" | "yakin" }
export async function aracUyarilari(db: Sorgulayici, bugun: string): Promise<{ l: AracUyarisi[]; esik: number }> {
  const esik = (await ayarOku(db, "uyari_esikleri")).deger.kalibrasyon;
  const l = (await db.sorgu<{ id: string; plaka: string; marka: string; model: string; muayene: string | null; sigorta: string | null; kasko: string | null }>(
    "SELECT id::text, plaka, marka, model, muayene::text, sigorta::text, kasko::text FROM arac WHERE pasif IS NULL")).rows;
  return { esik, l: l.flatMap((a) => ([["Muayene", a.muayene], ["Trafik sigortası", a.sigorta], ["Kasko", a.kasko]] as const).flatMap(([belge, t]) => {
    const d = belgeDurumu(t, bugun, esik);
    return t && (d === "gecti" || d === "yakin") ? [{ id: a.id, plaka: a.plaka, ad: `${a.marka} ${a.model}`, belge, tarih: t, durum: d }] : [];
  })) };
}
