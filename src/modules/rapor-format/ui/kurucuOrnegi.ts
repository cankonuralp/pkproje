/* FORMAT KURUCUNUN BELGE ÖNİZLEMESİ (451) — taslağın kesin belgede (src/belge/belge.ts: önizleme ve PDF aynı çizici) nasıl duracağını göstermek
   için BOŞ bir rapor: künye ve tarih yerinde yer tutucu, cevap yok (belgede "-"). Uydurma; hiçbir yere yazılmaz. */
import type { BelgeVerisi } from "../../../belge/veri";
import { Cevaplar, type FormatTanimi } from "../../../format/tanim";

export function kurucuOrnegi(tanim: FormatTanimi, tur: { ad: string; kod: string }): BelgeVerisi {
  return {
    firma: { ad: "Firmanızın adı", kod: "FR", nusha: 2, adres: "Adres, logo ve akreditasyon Firma ayarlarından", akr: null, logo: null },
    no: "—", revizyon: 0, formatSira: 1, durum: "taslak",
    tur: { ad: tur.ad, kod: tur.kod, kontrolStd: [] },
    kunye: { firmaAdi: "Müşteri firma (plandan)", adres: "Periyodik kontrol adresi (plandan)", sgk: null, isgNo: null },
    tarih: { bas: null, bit: null, sonraki: null, takip: null, rapor: null },
    ekipman: { kod: "—", marka: null, model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
    tanim, cevaplar: Cevaplar.parse({}), cihazlar: [], fotolar: [], sonuc: null,
    yazan: { ad: "—", meslek: "", ekipnet: null, diploma: null, oda: null }, onay: null, imza: null,
  };
}
