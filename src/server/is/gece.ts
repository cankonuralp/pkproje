/* GECE İŞLERİ (378; KOD-GECIS K5, ARKA-UC §7, 09-G1) — /api/is/gece'yi zamanlayıcı günde bir çağırır. Şimdilik tek iş: çöp temizliği (A5).
   · Kayıt: is_calisma (0069) — aynı iş aynı anda iki kez koşmaz ("zaten_calisiyor"), sonucu yalnız sayılarla yazılır, düşen iş "hata" görünür.
   · Kiracı bağlamı (G1): firma listesi yalnız kimlik (gece_firmalari; dondurulmuş yok), her firma KENDİ işleminde; bir firmada düşen iş ötekileri
     durdurmaz, sayılır, iş "hata" ile biter.
   · Süre: Vercel işlevi 60 sn; `sure` dolunca kalan firmalar sonraki geceye ("kalan"). */
import { geceFirmalari, isBasla, isBitir } from "../db/is.ts";
import { kiraciIcinde, type Havuz } from "../db/kiraci.ts";
import { copTemizle } from "../dosya/cop.ts";
import type { Depo } from "../dosya/depo.ts";

export interface GeceOzeti {
  durum: "tamam" | "hata" | "zaten_calisiyor";
  firma: number;
  silinen: number;
  bayt: number;
  bagli: number;
  oksuz: number;
  /** sınır ya da süre yüzünden sonraki geceye kalan firma */
  kalan: number;
  hatali_firma: number;
}

export const GECE_SURE = 45_000;

export async function geceIsleri(havuz: Havuz, depo: Depo, sure = GECE_SURE): Promise<GeceOzeti> {
  const o: Omit<GeceOzeti, "durum"> = { firma: 0, silinen: 0, bayt: 0, bagli: 0, oksuz: 0, kalan: 0, hatali_firma: 0 };
  const id = await isBasla(havuz, "cop_temizligi");
  if (!id) return { durum: "zaten_calisiyor", ...o };
  const bas = Date.now();
  try {
    for (const f of await geceFirmalari(havuz)) {
      if (Date.now() - bas > sure) { o.kalan++; continue; }
      try {
        const r = await kiraciIcinde(havuz, f, (db) => copTemizle(db, depo));
        o.firma++;
        o.silinen += r.silinen;
        o.bayt += r.bayt;
        o.bagli += r.bagli;
        o.oksuz += r.oksuz ?? 0;
        if (r.kalan) o.kalan++;
      } catch (h) {
        o.hatali_firma++;
        console.error("[gece] çöp temizliği bir firmada düştü:", (h as Error).message);
      }
    }
  } catch (h) {
    await isBitir(havuz, id, "hata", { ...o, hata: "firma listesi okunamadı" });
    throw h;
  }
  const durum = o.hatali_firma ? "hata" : "tamam";
  await isBitir(havuz, id, durum, o);
  return { durum, ...o };
}
