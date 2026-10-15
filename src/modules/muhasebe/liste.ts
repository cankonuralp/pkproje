/* MUHASEBE LİSTE TANIMLARI (566; 09-B3 "her liste sunucuda sayfalı"; reisim 2026-10-15 analizi — İşler ve Faturalar bütün işleri ve faturaları
   tarayıcıya indiriyordu). Ekran (ui/Listeler.tsx) ve sunucu (server/muhasebe.ts isSayfasi / faturaSayfasi) AYNI tanımı kullanır: iş ve fatura
   satırları hesaplanır (durum, kalan, kâr — SQL karşılığı yok), bu yüzden tarayıcının süzgeci (components/liste/suzgec.ts listele) SUNUCUDA koşar
   (server/liste/liste.ts bellekteListele); ekrana yalnız sayfanın satırları, sayılar ve seçenekler gider. Müşteri seçenekleri görebildiği
   kayıtlardan (sunucu üretir). Saf — React'siz. */
import type { Secenek, SuzgecTanimi } from "../../components/liste/suzgec.ts";
import { FATURA_DURUM, IS_DURUM } from "./sema.ts";
import type { FaturaSatiri, IsSatiri } from "./server/muhasebe.ts";

/** kayıtlardaki müşteriler (kimlik, kısa ad), Türkçe ad sırasıyla */
export const musteriSecenekleri = (l: readonly { musteriId: string; musteri: string }[]): Secenek[] =>
  [...new Map(l.filter((x) => x.musteriId).map((x) => [x.musteriId, x.musteri])).entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
const musteriSecici = <T extends { musteriId: string }>(m: readonly Secenek[]) => ({
  k: "musteri", ad: "Müşteri", secenek: (): readonly Secenek[] => [["tumu", "Tümü"], ...m], gecer: (x: T, v: string) => v === "tumu" || x.musteriId === v,
});

/** İşler (maket muhasebe.html suzgecTanimla "i"): arama proje no, müşteri, tesis, fatura no; durum çipleri; müşteri seçicisi; 20'şer */
export function isTanim(musteriler: readonly Secenek[]): SuzgecTanimi<IsSatiri> {
  return {
    ad: "İşlerde ara", ipucu: "Proje no, müşteri, tesis", birim: "iş", sayfa: 20, imkansiz: "Bir iş aynı anda iki durumda olamaz",
    metin: (x) => [x.no, x.musteri, x.unvan, x.tesis, ...x.faturaNolari].join(" "),
    cipler: (["gecikti", "hazir", "tahsilat", "rapor", "kapandi"] as const).map((k) => ({ k, ad: IS_DURUM[k][0], grup: "durum", test: (x: IsSatiri) => x.durum === k })),
    seciciler: [musteriSecici<IsSatiri>(musteriler)],
  };
}

/** Faturalar (maket "f"): arama fatura no, müşteri, iş no; durum çipleri; müşteri seçicisi; 20'şer */
export function faturaTanim(musteriler: readonly Secenek[]): SuzgecTanimi<FaturaSatiri> {
  return {
    ad: "Faturalarda ara", ipucu: "Fatura no, müşteri", birim: "fatura", sayfa: 20, imkansiz: "Bir fatura aynı anda iki durumda olamaz",
    metin: (f) => [f.no, f.musteri, f.unvan, ...f.isler.map((x) => x.no)].join(" "),
    cipler: (["gecikti", "bekliyor", "kismi", "odendi"] as const).map((k) => ({ k, ad: FATURA_DURUM[k][0], grup: "durum", test: (f: FaturaSatiri) => f.durum === k })),
    seciciler: [musteriSecici<FaturaSatiri>(musteriler)],
  };
}
