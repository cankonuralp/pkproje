/* MÜŞTERİ PANELİ LİSTE TANIMLARI (577; 566'nın yöntemi — 09-B3 "her liste sunucuda sayfalı"; reisim 2026-10-15 "elindeki işlerin hepsini sırayla
   bitir"): Raporlarınız ve Uygunsuzluklar müşterinin BÜTÜN raporlarını / uygunsuzluklarını tarayıcıya indiriyordu (büyük müşteride binlerce). Ekran
   (ui/) ve sunucu (server/panel.ts) AYNI tanımı kullanır; süzgeç sunucuda (bellekteListele), ekrana yalnız sayfa; Excel / toplu ZIP süzülenlerin
   tamamını sunucudan ister. Görme yine veritabanında (müşteri rolü). Saf. */
import type { Secenek, SuzgecTanimi } from "../../components/liste/suzgec.ts";
import type { MusteriRaporu, MusteriUygunsuzlukSatiri } from "../raporlar/server/musteri-baglanti.ts";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
/** bugünden verilen güne kaç gün (Türkiye takvim günü; geçmişse eksi) — sunucu ve ekran aynı */
export const gunFarki = (iso: string) => Math.round((Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${GUN.format(new Date())}T00:00:00Z`)) / 864e5);
/** "sonraki kontrol yakın" eşiği (gün) */
export const YAKIN = 60;

type Secimler = { tesis?: readonly Secenek[]; yil?: readonly Secenek[] };
/** seçenekler: görebildiği tesisler (başlık sırasıyla) · raporların yılları (en yeni üstte) */
export const raporSecimleri = (l: readonly MusteriRaporu[], tesisler: readonly { id: string; ad: string }[]): Secimler => ({
  tesis: tesisler.map((t) => [t.id, t.ad] as Secenek),
  yil: [...new Set(l.map((r) => (r.kontrol ?? r.imzaGunu).slice(0, 4)))].sort().reverse().map((y) => [y, y] as Secenek),
});

export function raporTanim(sec: Secimler): SuzgecTanimi<MusteriRaporu> {
  return {
    ad: "Raporlarda ara", ipucu: "Rapor no, ekipman kodu", birim: "rapor", sayfa: 20, imkansiz: "",
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis].join(" "),
    cipler: [
      { k: "uygunsuz", ad: "Uygunsuz", test: (r) => r.sonuc === "uygun_degil" },
      { k: "yakin", ad: `Sonraki kontrol ${YAKIN} gün içinde`, test: (r) => !!r.sonraki && gunFarki(r.sonraki) <= YAKIN },
    ],
    seciciler: [
      { k: "tesis", ad: "Tesis", secenek: () => [["tumu", "Tümü"], ...(sec.tesis ?? [])], gecer: (r, v) => v === "tumu" || r.tesisId === v },
      { k: "yil", ad: "Yıl", secenek: () => [["tumu", "Tümü"], ...(sec.yil ?? [])], gecer: (r, v) => v === "tumu" || (r.kontrol ?? r.imzaGunu).startsWith(v) },
    ],
  };
}

export function uygunsuzlukTanim(sec: Secimler): SuzgecTanimi<MusteriUygunsuzlukSatiri> {
  return {
    ad: "Uygunsuzluklarda ara", ipucu: "Ekipman, kriter, rapor no", birim: "uygunsuzluk", sayfa: 20, imkansiz: "Bir uygunsuzluk hem açık hem giderilmiş olamaz",
    metin: (u) => [u.ekipmanKod, u.turAd, u.tesis, u.metin, u.raporNo].join(" "),
    cipler: [
      { k: "acik", ad: "Açık", grup: "durum", test: (u) => u.acik },
      { k: "giderildi", ad: "Giderildi", grup: "durum", test: (u) => !u.acik },
      { k: "agir", ad: "Ağır kusur", test: (u) => u.agir },
    ],
    seciciler: [
      { k: "tesis", ad: "Tesis", secenek: () => [["tumu", "Tümü"], ...(sec.tesis ?? [])], gecer: (u, v) => v === "tumu" || u.tesisId === v },
    ],
  };
}
