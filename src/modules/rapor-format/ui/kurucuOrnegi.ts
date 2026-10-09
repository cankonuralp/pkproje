/* FORMAT KURUCUNUN BELGE ÖNİZLEMESİ (451) — taslağın kesin belgede (src/belge/belge.ts: önizleme ve PDF aynı çizici) nasıl duracağını göstermek
   için BOŞ bir rapor: künye ve tarih yerinde yer tutucu, cevap yok (belgede "-"). Uydurma; hiçbir yere yazılmaz. 459: türün kontrol metodu
   standartları ve ölçüm cihazı türleri (tür sayfasından) yerinde — cihaz satırı türün adıyla, cihazın kendisi sahada zimmetten seçilir. */
import type { BelgeVerisi } from "../../../belge/veri.ts";
import { Cevaplar, type FormatTanimi } from "../../../format/tanim.ts";

export function kurucuOrnegi(tanim: FormatTanimi, tur: { ad: string; kod: string; std: readonly string[]; cihaz: readonly string[] }): BelgeVerisi {
  return {
    firma: { ad: "Firmanızın adı", kod: "FR", nusha: 2, adres: "Adres, logo ve akreditasyon Firma ayarlarından", akr: null, logo: null },
    no: "—", revizyon: 0, formatSira: 1, durum: "taslak",
    tur: { ad: tur.ad, kod: tur.kod, kontrolStd: [...tur.std] },
    kunye: { firmaAdi: "Müşteri firma (plandan)", adres: "Periyodik kontrol adresi (plandan)", sgk: null, isgNo: null },
    tarih: { bas: null, bit: null, sonraki: null, takip: null, rapor: null },
    ekipman: { kod: "—", marka: null, model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
    tanim, cevaplar: Cevaplar.parse({}), fotolar: [], sonuc: null,
    cihazlar: tur.cihaz.map((ad) => ({ turAd: ad, kod: "sahada seçilir", marka: null, model: null, seri: null, kalTarih: null, kalBitis: null, sertifika: null })),
    yazan: { ad: "—", meslek: "", ekipnet: null, diploma: null, oda: null }, onay: null, imza: null,
  };
}
