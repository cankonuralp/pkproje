/* FİRMA FİRMA KOŞAN İŞ (387; 378'deki çöp temizliğinden ayrıldı — gece işlerinin ortak çatısı, KOD-GECIS K5, 09-G1 / E6):
   · Kayıt: is_calisma (0069) — aynı iş aynı anda iki kez koşmaz ("zaten_calisiyor"), sonucu yalnız sayılarla yazılır, düşen iş "hata" görünür.
   · Kiracı bağlamı (G1): firma listesi yalnız kimlik (gece_firmalari; dondurulmuş yok — E6), her firma KENDİ işleminde; bir firmada düşen adım
     ötekileri durdurmaz, sayılır ("hatali_firma"), iş "hata" ile biter (o firmanın işlemi geri alınır).
   · Süre: `sure` dolunca kalan firmalar sonraki koşuya ("kalan"); adım "işim kaldı" derse o firma da sayılır.
   · FV6 (FIRMA-VT §5.6, 2026-10-16): firma listesi ve iş kaydı MERKEZDE (havuz); her firmanın adımı o firmanın KENDİ havuzunda (havuzBul — ortak
     firmaya merkez, kendi projeliye kendi veritabanı). Firma çözülmezse (bakımda, kurulumu bozuk) ya da adımdan ÖNCE bağlantı / doğrulama düşerse
     "ulasilamayan" sayılır, öteki firmalar sürer; adımın kendisi düşerse "hatali_firma". İkisi de işi "hata" bitirir (o gece o firmanın işi
     koşmadı — saklama süresi, e-posta). havuzBul verilmezse her firma merkez havuzunda (bugünkü testler). */
import { geceFirmalari, isBasla, isBitir } from "../db/is.ts";
import { kiraciIcinde, type Havuz, type Sorgulayici } from "../db/kiraci.ts";

/** işin kendi sayıları (silinen, bayt …) — hepsi sayı */
type Sayilar<S> = { [K in keyof S]: number };
export type IsDurumu = "tamam" | "hata" | "zaten_calisiyor";
export type IsOzeti<S extends Sayilar<S>> = S & { durum: IsDurumu; firma: number; kalan: number; hatali_firma: number; ulasilamayan: number };
/** bir firmadaki adımın sonucu: toplanacak sayılar + sınır yüzünden işi kaldı mı */
export interface AdimSonucu<S> { sayilar: S; kalan: boolean }
/** FV6: firma kimliğinden o firmanın havuzu (ortak firmaya merkez, kendi projeliye kendi havuzu); çözülmezse null — firma-havuzu.ts firmaHavuzuKimlikle */
export type HavuzBul = (firmaId: string) => Promise<Havuz | null>;

export async function firmalardaKos<S extends Sayilar<S>>(havuz: Havuz, ad: string, sure: number, bos: S,
  adim: (db: Sorgulayici) => Promise<AdimSonucu<S>>, havuzBul?: HavuzBul): Promise<IsOzeti<S>> {
  const o: Record<string, number> = { ...(bos as Record<string, number>), firma: 0, kalan: 0, hatali_firma: 0, ulasilamayan: 0 };
  const ozet = (durum: IsDurumu) => ({ durum, ...o }) as unknown as IsOzeti<S>;
  const id = await isBasla(havuz, ad);
  if (!id) return ozet("zaten_calisiyor");
  const bas = Date.now();
  try {
    for (const f of await geceFirmalari(havuz)) {
      if (Date.now() - bas > sure) { o.kalan++; continue; }
      /* adım başladı mı: başlamadan düşen (bağlantı, firma doğrulaması) ulaşılamayan, adımda düşen hatalı */
      let basladi = false;
      try {
        const h = havuzBul ? await havuzBul(f) : havuz;
        if (!h) {
          o.ulasilamayan++;
          console.error(`[gece] ${ad}: bir firma çözülmedi (bakımda ya da kurulumu eksik) — o firmada koşmadı`);
          continue;
        }
        const r = await kiraciIcinde(h, f, (db) => { basladi = true; return adim(db); });
        o.firma++;
        for (const k of Object.keys(bos)) o[k] += (r.sayilar as Record<string, number>)[k] ?? 0;
        if (r.kalan) o.kalan++;
      } catch (h) {
        if (basladi) o.hatali_firma++; else o.ulasilamayan++;
        console.error(`[gece] ${ad} bir firmada ${basladi ? "düştü" : "ulaşılamadı"}:`, (h as Error).message);
      }
    }
  } catch (h) {
    await isBitir(havuz, id, "hata", { ...o, hata: "firma listesi okunamadı" });
    throw h;
  }
  const durum = o.hatali_firma || o.ulasilamayan ? "hata" : "tamam";
  await isBitir(havuz, id, durum, o);
  return ozet(durum);
}
