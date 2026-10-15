/* MUHASEBE › GİDERLER LİSTE TANIMI (576; 566'nın yöntemi — 09-B3 "her liste sunucuda sayfalı"): ekran (ui/Giderler.tsx) ve sunucu
   (server/giderler.ts giderSayfasi) AYNI tanımı kullanır; süzgeç sunucuda (bellekteListele), ekrana yalnız sayfa + toplamlar. Dönem ve personel
   seçenekleri görebildiği giderlerden. Saf. */
import type { Secenek, SuzgecTanimi } from "../../components/liste/suzgec.ts";
import { ayAd } from "./karlilik.ts";
import { GIDER_TUR } from "./sema.ts";
import type { GiderSatiri } from "./server/giderler.ts";

const tekil = (l: [string, string][]): Secenek[] => [...new Map(l)].sort((a, b) => a[1].localeCompare(b[1], "tr"));
/** seçenekler: dönem (en yeni üstte) · personel */
export const giderSecimleri = (l: readonly GiderSatiri[]) => ({
  ay: [...new Set(l.map((g) => g.tarih.slice(0, 7)))].sort().reverse().map((a) => [a, ayAd(a)] as Secenek),
  kisi: tekil(l.filter((g) => g.personel).map((g) => [g.personel!.id, g.personel!.ad])),
});

export function giderTanim(sec: { ay?: readonly Secenek[]; kisi?: readonly Secenek[] }): SuzgecTanimi<GiderSatiri> {
  return {
    ad: "Giderlerde ara", ipucu: "Gider no, iş, açıklama", birim: "gider", sayfa: 20, imkansiz: "Bir gider aynı anda iki durumda olamaz",
    metin: (g) => [g.no, GIDER_TUR[g.tur][0], g.aciklama ?? "", g.is?.no ?? "", g.is?.musteri ?? "", g.personel?.ad ?? ""].join(" "),
    cipler: [
      { k: "bekliyor", ad: "Onay bekliyor", grup: "durum", test: (g) => g.durum === "bekliyor" },
      { k: "onaylandi", ad: "Ödenecek", grup: "durum", test: (g) => g.durum === "onaylandi" },
      { k: "belgesiz", ad: "Belgesi yok", test: (g) => !g.belge },
    ],
    seciciler: [
      { k: "bag", ad: "İş", secenek: () => [["tumu", "Tümü"], ["is", "İşe bağlı"], ["genel", "Genel"]], gecer: (g, v) => v === "tumu" || (v === "is") === !!g.is },
      { k: "tur", ad: "Tür", secenek: () => [["tumu", "Tümü"], ...Object.entries(GIDER_TUR).map(([k, [ad]]) => [k, ad] as [string, string])], gecer: (g, v) => v === "tumu" || g.tur === v },
      { k: "ay", ad: "Dönem", secenek: () => [["tumu", "Tümü"], ...(sec.ay ?? [])], gecer: (g, v) => v === "tumu" || g.tarih.slice(0, 7) === v },
      { k: "kisi", ad: "Personel", secenek: () => [["tumu", "Tümü"], ...(sec.kisi ?? [])], gecer: (g, v) => v === "tumu" || g.personel?.id === v },
    ],
  };
}

/** sayfayla gelen sayılar: süzülenlerin KDV hariç / KDV / toplamı + bütün giderlerde onay bekleyen ve belgesi olmayan (şerit) */
export function giderEk(suzulen: readonly GiderSatiri[], hepsi: readonly GiderSatiri[]): Record<string, number> {
  const top = (l: readonly GiderSatiri[]) => l.reduce((n, g) => n + g.tutar, 0);
  const bek = hepsi.filter((g) => g.durum === "bekliyor"), bel = hepsi.filter((g) => !g.belge);
  return {
    haric: suzulen.reduce((n, g) => n + g.haric, 0), kdv: suzulen.reduce((n, g) => n + g.kdv, 0), top: top(suzulen), adet: suzulen.length,
    bekN: bek.length, bekT: top(bek), belN: bel.length, belT: top(bel),
  };
}
