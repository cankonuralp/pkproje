/* UYDURMA ÖRNEK BELGE — PDF motorunun ölçümü (src/app/api/olcum/pdf, yalnız önizleme dağıtımı) ve testleri için. Gerçek firma / kişi yok. */
import { SABLONLAR } from "../format/sablonlar.ts";
import { Cevaplar } from "../format/tanim.ts";
import type { TeklifBelgesiVerisi } from "./teklif.ts";
import type { BelgeVerisi } from "./veri.ts";

export function ornekBelge(sablon: "ZPKR01" | "ZPKR02" | "KOMPRESOR"): BelgeVerisi {
  const tanim = SABLONLAR[sablon].tanim;
  const madde = Object.fromEntries(tanim.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler.map((m) => [m.id, { c: b.cevaplar[0] }])) : [])));
  return {
    firma: { ad: "Deneme Muayene A.Ş.", kod: "DA", nusha: 2 }, no: "DA-1026-001-abcde", revizyon: 0, formatSira: 1, durum: "onaylandi",
    tur: { ad: "Deneme türü", kod: "DT", kontrolStd: [] },
    kunye: { firmaAdi: "Deneme Sanayi A.Ş.", adres: "Deneme Cad. 1, Çankaya / Ankara", sgk: null, isgNo: "ISG-1" },
    tarih: { bas: "2026-10-05T09:00", bit: "2026-10-05T10:30", sonraki: "2027-10-05", takip: null, rapor: "2026-10-05" },
    ekipman: { kod: "DT-1", marka: "Deneme", model: "M-1", seri: "S-1", imal: "2020", konum: "Deneme yeri", amac: null, bolum: null },
    tanim, cevaplar: Cevaplar.parse({ madde, sonuc: "uygun" }), cihazlar: [], fotolar: [], sonuc: "uygun",
    yazan: { ad: "Deneme Denetçi", meslek: "elk-muh", ekipnet: "123", diploma: null, oda: null }, onay: null, imza: null,
  };
}

/** uydurma teklif belgesi (325; testler) */
export const ornekTeklif = (): TeklifBelgesiVerisi => ({
  firma: { ad: "Deneme Muayene A.Ş.", kod: "DA" }, no: "T-1026-001", tarih: "2026-10-05", gecerlilik: 30, bitis: "2026-11-04", kdv: 20,
  notlar: "Ulaşım dahildir.", hazirlayan: "Deneme Planlama", durum: "gonderildi",
  musteri: { unvan: "Deneme Bir Sanayi A.Ş.", vergi: "Merkez · 1234567890", eposta: "satin@deneme-bir.example", tel: null, ilgili: "Deneme Yetkili",
    yerler: [{ ad: "Merkez", adres: "Deneme Cad. 1, Gebze / Kocaeli" }, { ad: "Depo", adres: null }] },
  kalemler: [{ turAd: "Hava tankı", brans: "m", periyot: 12, adet: 2, fiyat: 125000 }, { turAd: "Elektrik iç tesisatı", brans: "e", periyot: 12, adet: 1, fiyat: 90050 }],
});
