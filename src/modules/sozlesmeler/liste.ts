/* SÖZLEŞMELER LİSTE TANIMI (570; 566'nın yöntemi — 09-B3): ekran (ui/SozlesmeListesi.tsx) ve sunucu (server/sozlesmeler.ts sozlesmeSayfasi) AYNI
   tanımı kullanır; satırlar hesaplanır (durum, kalan gün, İSG-KATİP sayısı) → tarayıcının süzgeci SUNUCUDA koşar (bellekteListele), ekrana yalnız
   sayfa. Müşteri ve denetçi seçenekleri görebildiği sözleşmelerden. Saf. */
import type { Secenek, SuzgecTanimi } from "../../components/liste/suzgec.ts";
import type { SozlesmeSatiri } from "./server/sozlesmeler.ts";

const tekil = (x: readonly string[]): Secenek[] => [...new Set(x)].sort((a, b) => a.localeCompare(b, "tr")).map((m) => [m, m] as const);
/** seçici seçenekleri: müşteri · denetçi (İSG-KATİP kişileri) */
export const sozlesmeListeSecenekleri = (l: readonly SozlesmeSatiri[]) => ({ musteri: tekil(l.map((x) => x.musteri)), kisi: tekil(l.flatMap((x) => x.isgKisileri)) });

export function sozlesmeTanim(sec: { musteri?: readonly Secenek[]; kisi?: readonly Secenek[] }): SuzgecTanimi<SozlesmeSatiri> {
  return {
    ad: "Sözleşmelerde ara", ipucu: "No, müşteri, tesis", birim: "sözleşme", sayfa: 20, imkansiz: "Bir sözleşme aynı anda iki durumda olamaz",
    metin: (x) => `${x.no} ${x.musteri} ${x.tesisler.join(" ")} ${x.teklif?.no ?? ""}`,
    cipler: [
      { k: "imza", ad: "İmza bekliyor", grup: "durum", test: (x) => x.durum === "imza" },
      { k: "yururlukte", ad: "Yürürlükte", grup: "durum", test: (x) => x.durum === "yururlukte" },
      { k: "suresi", ad: "Süresi doldu", grup: "durum", test: (x) => x.durum === "suresi" },
      { k: "isgyok", ad: "İSG-KATİP ID yok", test: (x) => x.isgSayisi === 0 },
    ],
    seciciler: [
      { k: "musteri", ad: "Müşteri", secenek: () => [["tumu", "Tümü"], ...(sec.musteri ?? [])], gecer: (x, s) => s === "tumu" || x.musteri === s },
      { k: "kisi", ad: "Denetçi", secenek: () => [["tumu", "Tümü"], ...(sec.kisi ?? [])], gecer: (x, s) => s === "tumu" || x.isgKisileri.includes(s) },
    ],
  };
}
