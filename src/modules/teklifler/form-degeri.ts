/* TEKLİF FORMUNUN BAŞLANGIÇ DEĞERİ — yeni, kopya ("Yeni teklif (kopyala)"), tesisten başlat (?tesis=) ve düzenle sayfaları SUNUCUDA kurar ("use
   client" dosyasından değer içe aktarılamaz — 324 incelemesi). Kopyada / düzenlemede pasife alınmış müşteri ya da tesis forma alınmaz (formda
   görünmeyen seçili tesis kaydı hep "Tesis seçilmeli." ile düşürürdü); adları şeritte söylenir. Saf. */
import { paraGirdi } from "./sema.ts";
import type { TeklifKarti, TeklifSecenekleri } from "./server/teklifler.ts";

export type AdayDegeri = { unvan: string; vd: string; vno: string; adres: string; il: string; ilce: string; eposta: string; tel: string; yetkili: string };
export type KalemDegeri = { tur: string; adet: string; fiyat: string };
export interface TeklifFormDegeri {
  tip: "kayitli" | "aday"; musteri: string; tesis: string; ekTesisler: string[]; aday: AdayDegeri; gecerlilik: string; kdv: string; notlar: string; kalemler: KalemDegeri[];
  ekipmanlar: { kod: string; tur: string; konum: string; seri: string }[];
}
export const BOS_ADAY: AdayDegeri = { unvan: "", vd: "", vno: "", adres: "", il: "", ilce: "", eposta: "", tel: "", yetkili: "" };

/** k: kopyalanan / düzenlenen teklif (yoksa boş form; tesis verilirse o tesisle başlar) */
export function formDegeri(k: TeklifKarti | null, s: TeklifSecenekleri, tesis: string | null = null): { deger: TeklifFormDegeri; dusen: string[] } {
  if (!k) {
    const tm = tesis ? s.musteriler.find((m) => m.tesisler.some((t) => t.id === tesis)) : undefined;
    return { deger: { tip: "kayitli", musteri: tm?.id ?? "", tesis: tm ? tesis! : "", ekTesisler: [], aday: { ...BOS_ADAY }, gecerlilik: "", kdv: "20", notlar: "",
      kalemler: [{ tur: "", adet: "1", fiyat: "" }], ekipmanlar: [] }, dusen: [] };
  }
  const m = k.musteriKart ? s.musteriler.find((x) => x.id === k.musteriKart!.id) : undefined;
  const etkin = new Set(m?.tesisler.map((t) => t.id) ?? []);
  const kalan = k.tesisler.filter((t) => etkin.has(t.id));
  const dusen = k.musteriKart && !m ? [k.musteriKart.unvan] : k.tesisler.filter((t) => !etkin.has(t.id)).map((t) => t.ad);
  const aday: AdayDegeri = { ...BOS_ADAY };
  for (const [a, b] of Object.entries(k.aday ?? {})) if (a in aday) aday[a as keyof AdayDegeri] = typeof b === "string" ? b : "";
  return {
    deger: {
      tip: k.musteriKart ? "kayitli" : "aday", musteri: m?.id ?? "", tesis: kalan[0]?.id ?? "", ekTesisler: kalan.slice(1).map((t) => t.id), aday,
      gecerlilik: String(k.gecerlilik), kdv: String(k.kdv), notlar: k.notlar ?? "",
      kalemler: k.kalemler.length ? k.kalemler.map((x) => ({ tur: x.turId, adet: String(x.adet), fiyat: paraGirdi(x.fiyat) })) : [{ tur: "", adet: "1", fiyat: "" }],
      ekipmanlar: k.ekipmanlar,
    },
    dusen,
  };
}
