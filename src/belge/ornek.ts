/* UYDURMA ÖRNEK BELGE — PDF motorunun ölçümü (src/app/api/olcum/pdf, yalnız önizleme dağıtımı) ve testleri için. Gerçek firma / kişi yok. */
import { SABLONLAR } from "../format/sablonlar.ts";
import { Cevaplar } from "../format/tanim.ts";
import type { TeklifBelgesiVerisi } from "./teklif.ts";
import type { FaturaBelgesiVerisi } from "./fatura.ts";
import type { TalepFormuVerisi } from "./talep.ts";
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

/** fatura özeti (340): uydurma — iki kalem (biri teklif dışı), bir fiyatsız, iki tahsilat */
export const ornekFatura = (): FaturaBelgesiVerisi => ({
  firma: { ad: "Deneme Muayene A.Ş.", kod: "DA" }, no: "DEN2026000000001", tarih: "2026-10-05", vade: "2026-11-04", vadeGun: 30, kaydeden: "Deneme Muhasebe",
  alici: { unvan: "Deneme Bir Sanayi A.Ş.", vd: "Merkez", vno: "1234567890" }, isler: [{ no: "P-1026-001", tesis: "Merkez" }], raporSayisi: 4,
  kalemler: [{ turAd: "Hava tankı", adet: 2, fiyat: 125000, disi: false }, { turAd: "Hava tankı", adet: 1, fiyat: 90000, disi: true }, { turAd: "Kompresör", adet: 1, fiyat: null, disi: false }],
  ara: 340000, kdv: 20, kdvTutar: 68000, toplam: 408000,
  tahsilatlar: [{ tarih: "2026-10-10", yontem: "Havale / EFT", tutar: 200000, aciklama: "Deneme <ödeme> & açıklama" }, { tarih: "2026-10-20", yontem: "Nakit", tutar: 8000, aciklama: null }],
  tahsil: 208000, kalan: 200000,
});

/** talep formu (341): uydurma masraf formu — onaylanmış; izin için tip ve alanlar değişir */
export const ornekTalep = (): TalepFormuVerisi => ({
  firma: { ad: "Deneme Muayene A.Ş.", kod: "DA" }, tip: "masraf", no: "G-1026-001", gonderildi: "2026-10-05T09:30:00.000Z",
  personel: { ad: "Deneme Denetçi", meslek: "Makine mühendisi" }, durum: "Onaylandı",
  alanlar: [["İş", "P-1026-001"], ["Masraf tarihi", "05.10.2026"], ["Tür", "Yakıt"], ["Tutar (KDV dahil)", "250,00 TL"], ["KDV", "%20 · 41,67 TL (KDV hariç 208,33 TL)"],
    ["Açıklama", "Deneme <yakıt> & fiş"], ["Fiş", "fis.pdf"]],
  red: null, karar: { ad: "Deneme Muhasebe", zaman: "2026-10-05T12:00:00.000Z", sonuc: "onaylandi" },
});

