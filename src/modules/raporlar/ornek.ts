/* RAPORUN BAŞLANGIÇ CEVAPLARI ve ÖRNEK SAHA RAPORU (saf; sunucu ve tarayıcı ortak).
   · ilkCevaplar: yeni raporun başlangıç cevapları — bütün maddeler cevap setinin ilk öğesiyle ("Uygun") dolu (§3.8-3). Sunucu raporu açarken,
     format kurucusunun saha görünümü denerken aynı işlevi kullanır.
   · ornekSahaRaporu (472; reisim 2026-10-10, maket kararları k1–k4): format kurucusunun "Saha ekranı" görünümü taslak formatı denetçinin
     göreceği ekranda gösterir — gerçek saha ekranı (SahaRaporu) bu UYDURMA raporla çizilir. Veritabanına hiçbir şey yazılmaz; kimlik "ornek",
     müşteri / tesis / cihaz adları uydurmadır. */
import { Cevaplar, type FormatTanimi } from "../../format/tanim.ts";
import type { StandartOzeti } from "../dokumanlar/eslestir.ts";
import type { KriterBelgesi } from "../../tanim/kriterler.ts";
import type { SahaRaporu } from "./server/raporlar.ts";
import { ayEkle } from "./sema.ts";

export function ilkCevaplar(t: FormatTanimi): Cevaplar {
  const madde: Cevaplar["madde"] = {};
  for (const b of t.bolumler) if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) madde[m.id] = { c: b.cevaplar[0] };
  return Cevaplar.parse({ madde });
}

/** tanım değişince (kurucuda madde eklendi) denemenin cevapları: var olan cevap kalır, yeni maddeye ilk cevap; artık olmayan madde düşer */
export function cevaplariTamamla(t: FormatTanimi, c: Cevaplar): Cevaplar {
  const ilk = ilkCevaplar(t).madde, madde: Cevaplar["madde"] = {};
  for (const [id, x] of Object.entries(ilk)) madde[id] = c.madde[id] ?? x;
  return { ...c, madde };
}

export const ORNEK_KIMLIK = "ornek";
/** bugün (YYYY-AA-GG, Türkiye saati) */
export const ornekBugun = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export interface OrnekTur {
  id: string; ad: string; kod: string; brans: "m" | "e"; periyot: number;
  /** türün kontrol metodu standartları ve ölçüm cihazı türleri (tür sayfasında seçilir) */
  std: string[]; cihaz: string[];
}

/** uydurma saha raporu: bugün (YYYY-AA-GG, Türkiye) kontrol başlangıcı; türün ölçüm cihazı türlerinin her biri için kalibrasyonu geçerli bir
    uydurma cihaz; yazan uydurma denetçi; düzenlenebilir, silinmez, kopyalanmaz; fotoğraftan okuma kapalı */
export function ornekSahaRaporu(tanim: FormatTanimi, tur: OrnekTur, bugun: string, kaynak: { standartlar: StandartOzeti[] | null; kriterler: KriterBelgesi[] }): SahaRaporu {
  const yil = ayEkle(bugun, 12);
  return {
    id: ORNEK_KIMLIK, no: "ÖRNEK", durum: "taslak", surum: 0, olustu: `${bugun}T09:00:00+03:00`, degisti: `${bugun}T09:00:00+03:00`, gonderildi: null, bugun,
    plan: { id: ORNEK_KIMLIK, no: "P-ÖRNEK", tesisAd: "Örnek tesis", musteriKisa: "Örnek Sanayi" },
    ekipman: { id: ORNEK_KIMLIK, kod: "ÖRN-001", onceki: null },
    tur: { id: tur.id, ad: tur.ad, kod: tur.kod, brans: tur.brans, kontrolStd: tur.std, periyot: tur.periyot },
    yazan: { ad: "Örnek Denetçi", meslek: "diger", meslekMetin: "Makine mühendisi", ekipnet: "ÖRNEK-0000" },
    kunye: {
      firmaAdi: "Örnek Sanayi A.Ş.", adres: "Örnek Mah. Deneme Sk. No: 1, Merkez / Ankara", sgk: "0000000000000000000000000", isgNo: "000000",
      eposta: "bilgi@ornek-sanayi.example", tel: "0312 000 00 00",
    },
    kunyeFark: [],
    ekipmanBilgi: { marka: null, model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
    tarih: { bas: `${bugun}T09:00`, bit: null, sonraki: null, takip: null, rapor: null },
    cevaplar: ilkCevaplar(tanim), tanim, formatSira: 0,
    cihazlar: tur.cihaz.map((ad, i) => ({
      turId: `ornek${i + 1}`, turAd: ad,
      cihaz: { id: `ornek${i + 1}`, kod: `ÖC-${String(i + 1).padStart(3, "0")}`, marka: "Örnek", model: "Ö-1", seri: String(1000 + i), bitis: yil, gecti: false, eksik: false, lab: false },
    })),
    fotolar: [], secilebilir: {}, kopyaKaynak: null, guncelFormat: null, mesaiDolu: false, geri: null, revize: null, imza: null, imzali: null,
    izin: { duzenle: true, sil: false, kopyala: false }, yz: false, kaynak,
  };
}
