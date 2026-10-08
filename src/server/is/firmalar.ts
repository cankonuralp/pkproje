/* FİRMA FİRMA KOŞAN İŞ (387; 378'deki çöp temizliğinden ayrıldı — gece işlerinin ortak çatısı, KOD-GECIS K5, 09-G1 / E6):
   · Kayıt: is_calisma (0069) — aynı iş aynı anda iki kez koşmaz ("zaten_calisiyor"), sonucu yalnız sayılarla yazılır, düşen iş "hata" görünür.
   · Kiracı bağlamı (G1): firma listesi yalnız kimlik (gece_firmalari; dondurulmuş yok — E6), her firma KENDİ işleminde; bir firmada düşen adım
     ötekileri durdurmaz, sayılır ("hatali_firma"), iş "hata" ile biter (o firmanın işlemi geri alınır).
   · Süre: `sure` dolunca kalan firmalar sonraki koşuya ("kalan"); adım "işim kaldı" derse o firma da sayılır. */
import { geceFirmalari, isBasla, isBitir } from "../db/is.ts";
import { kiraciIcinde, type Havuz, type Sorgulayici } from "../db/kiraci.ts";

/** işin kendi sayıları (silinen, bayt …) — hepsi sayı */
type Sayilar<S> = { [K in keyof S]: number };
export type IsDurumu = "tamam" | "hata" | "zaten_calisiyor";
export type IsOzeti<S extends Sayilar<S>> = S & { durum: IsDurumu; firma: number; kalan: number; hatali_firma: number };
/** bir firmadaki adımın sonucu: toplanacak sayılar + sınır yüzünden işi kaldı mı */
export interface AdimSonucu<S> { sayilar: S; kalan: boolean }

export async function firmalardaKos<S extends Sayilar<S>>(havuz: Havuz, ad: string, sure: number, bos: S,
  adim: (db: Sorgulayici) => Promise<AdimSonucu<S>>): Promise<IsOzeti<S>> {
  const o: Record<string, number> = { ...(bos as Record<string, number>), firma: 0, kalan: 0, hatali_firma: 0 };
  const ozet = (durum: IsDurumu) => ({ durum, ...o }) as unknown as IsOzeti<S>;
  const id = await isBasla(havuz, ad);
  if (!id) return ozet("zaten_calisiyor");
  const bas = Date.now();
  try {
    for (const f of await geceFirmalari(havuz)) {
      if (Date.now() - bas > sure) { o.kalan++; continue; }
      try {
        const r = await kiraciIcinde(havuz, f, adim);
        o.firma++;
        for (const k of Object.keys(bos)) o[k] += (r.sayilar as Record<string, number>)[k] ?? 0;
        if (r.kalan) o.kalan++;
      } catch (h) {
        o.hatali_firma++;
        console.error(`[gece] ${ad} bir firmada düştü:`, (h as Error).message);
      }
    }
  } catch (h) {
    await isBitir(havuz, id, "hata", { ...o, hata: "firma listesi okunamadı" });
    throw h;
  }
  const durum = o.hatali_firma ? "hata" : "tamam";
  await isBitir(havuz, id, durum, o);
  return ozet(durum);
}
