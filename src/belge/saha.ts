/* SAHA FORMU BELGESİ (2026-10-12; reisim: "görselde saha takip formu üretme işi yok ? neden ? geri gelsin." — maket maket-belge.js MB.sahaFormu,
   planlarim.html saha formu; reisim 2026-09-26: "plan tamamlandıktan sonra saha formu oluştur … yapılan ekipmanlar ve yapıldığına dair firma onayı
   için imza yerleri"). TEMEL FORMAT (firma kodu + "-FR-SAH-01"): başlık tablosu (logo · firma · belge adı · doküman bilgisi: form no, proje no,
   tarih), müşteri / tesis / adres, 1 Kontrolü yapılan ekipmanlar (# · kod · ekipman · konum), 2 Firma onayı (metin), imzalar (Firma yetkilisi: ad
   soyad · unvan, "Tarih · imza · kaşe" — ıslak imza ve kaşe kâğıtta; Muayene uzmanı: plan ekibi, "Tarih · imza"). Öteki belgelerle aynı görünüm
   (belge.css .rb-). SAF, React'in kaçışıyla. */
import { createElement as h, type ReactNode } from "react";
import type { FormatTanimi } from "../format/tanim.ts";
import { firmaAdresi, firmaLogosu } from "./belge.ts";

export interface SahaFormuVerisi {
  firma: { ad: string; kod: string; adres?: string | null; logo?: string | null };
  /** P-AAYY-SIRA-SFn */
  no: string;
  projeNo: string;
  /** planın başlangıç ve bitiş günü (YYYY-AA-GG) */
  baslangic: string; bitis: string;
  musteri: string; tesis: string; adres: string | null;
  /** planda raporu yazılan ekipmanlar (rapor numarası sırasıyla) */
  ekipmanlar: readonly { kod: string; tur: string; konum: string | null }[];
  /** plan ekibi (muayene uzmanları) */
  uzmanlar: readonly string[];
  /** 2026-10-25 (belge formatları): firmanın yayınladığı saha formu formatı (yoksa temel format) */
  format?: FormatTanimi | null;
}

export const sahaFormKodu = (firmaKod: string) => `${firmaKod}-FR-SAH-01`;
export const SAHA_ONAY = "Yukarıda listelenen ekipmanların periyodik kontrolü tesisimizde yapılmıştır.";

const tarihYaz = (g: string) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const bolum = (no: number, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: ad }, h("h2", null, `${no}. ${ad}`), ...icerik);
const satir = (e: string, d: ReactNode, key: string) => h("tr", { key }, h("td", { className: "rb-e" }, e), h("td", null, d));

export function sahaFormu(v: SahaFormuVerisi): ReactNode {
  const formKod = sahaFormKodu(v.firma.kod);
  const tarih = v.bitis && v.bitis !== v.baslangic ? `${tarihYaz(v.baslangic)} – ${tarihYaz(v.bitis)}` : tarihYaz(v.baslangic);
  const imza = (rol: string, ad: string, alt: string) => h("td", { className: "rb-imza", key: rol }, h("div", null, h("b", null, rol)), h("div", null, ad), h("div", null, alt));
  return h("article", { className: "rb-sayfa", "aria-label": `${v.no} saha formu` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, firmaLogosu(v.firma)), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma)),
      h("td", { className: "rb-bas-ad" }, "Saha formu"),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Form No"), `: ${v.no}`),
        h("div", null, h("span", null, "Proje No"), `: ${v.projeNo}`), h("div", null, h("span", null, "Tarih"), `: ${tarih}`))))),
    h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Müşteri", v.musteri, "m"), satir("Tesis", v.tesis, "t"), satir("Adres", v.adres || "-", "a"))),
    bolum(1, "Kontrolü yapılan ekipmanlar",
      h("table", null, kolonlar(["7%", "23%", "40%", "30%"]),
        h("thead", null, h("tr", null, ...["#", "Kod", "Ekipman", "Konum"].map((x) => h("th", { key: x, className: "rb-ab" }, x)))),
        h("tbody", null, ...(v.ekipmanlar.length
          ? v.ekipmanlar.map((x, i) => h("tr", { key: i }, h("td", null, String(i + 1)), h("td", null, h("b", null, x.kod)), h("td", null, x.tur), h("td", null, x.konum || "-")))
          : [h("tr", { key: "bos" }, h("td", { colSpan: 4 }, "Bu planda rapor yazılmadı."))])))),
    bolum(2, "Firma onayı", h("p", { className: "rb-kutu-metin" }, SAHA_ONAY)),
    h("table", null, kolonlar(["50%", "50%"]), h("tbody", null, h("tr", null,
      imza("Firma yetkilisi", "Ad soyad · unvan", "Tarih · imza · kaşe"), imza("Muayene uzmanı", v.uzmanlar.join(", ") || "-", "Tarih · imza")))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod} · temel format`));
}
