/* TEKLİFLER LİSTE TANIMI (570; 566'nın yöntemi — 09-B3 "her liste sunucuda sayfalı"): ekran (ui/TeklifListesi.tsx) ve sunucu (server/teklifler.ts
   teklifSayfasi) AYNI tanımı kullanır; teklif satırları hesaplanır (durum, süresi doldu, kalem / tutar) → tarayıcının süzgeci SUNUCUDA koşar
   (server/liste/liste.ts bellekteListele), ekrana yalnız sayfanın 20 satırı ve sayılar. Müşteri seçenekleri görebildiği tekliflerden. Saf. */
import type { Secenek, SuzgecTanimi } from "../../components/liste/suzgec.ts";
import type { TeklifSatiri } from "./server/teklifler.ts";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
/** bugünden verilen güne kaç gün (Türkiye takvim günü; geçmişse eksi) — sunucuda da tarayıcıda da aynı */
export const gunFarki = (iso: string) => Math.round((Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${GUN.format(new Date())}T00:00:00Z`)) / 864e5);

/** tekliflerdeki müşteriler (kimlik, ad), Türkçe ad sırasıyla */
export const teklifMusterileri = (l: readonly TeklifSatiri[]): Secenek[] =>
  [...new Map(l.filter((t) => t.musteriId).map((t) => [t.musteriId!, t.musteri])).entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));

export function teklifTanim(musteriler: readonly Secenek[]): SuzgecTanimi<TeklifSatiri> {
  return {
    ad: "Tekliflerde ara", ipucu: "Teklif no, müşteri, tesis", birim: "teklif", sayfa: 20, imkansiz: "Bir teklif aynı anda iki durumda olamaz",
    metin: (t) => [t.no, t.musteri, t.unvan, t.tesis, t.yer ?? ""].join(" "),
    cipler: [
      { k: "taslak", ad: "Taslak", grup: "durum", test: (t) => t.durum === "taslak" },
      { k: "gonderildi", ad: "Gönderildi", grup: "durum", test: (t) => t.durum === "gonderildi" },
      { k: "kabul", ad: "Kabul edildi", grup: "durum", test: (t) => t.durum === "kabul" },
      { k: "kapanan", ad: "Red ya da süresi doldu", grup: "durum", test: (t) => t.durum === "red" || t.durum === "suresi" },
      { k: "yakin", ad: "Geçerliliği 7 gün içinde bitiyor", test: (t) => { const k = t.bitis ? gunFarki(t.bitis) : -1; return t.durum === "gonderildi" && k >= 0 && k <= 7; } },
    ],
    seciciler: [{ k: "musteri", ad: "Müşteri", secenek: () => [["tumu", "Tümü"], ...musteriler], gecer: (t, v) => v === "tumu" || t.musteriId === v }],
  };
}
