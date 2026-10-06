/* FATURA ÖZETİ BELGESİ (340; maket muhasebe.html faturaCiz "Fatura özeti (PDF)" — X["pdf"]: "fatura e-Fatura programında kesilir; burada fatura
   özeti (kalemler, KDV, tahsilat) yazdırılır / PDF olur"; pkproje §11 1659 "Fatura bu sistemde kesilmediği için tuşun adı Fatura özeti (PDF)").
   TEMEL FORMAT (firma kodu + "-FR-FOZ-01"): başlık tablosu (logo · firma · "FATURA ÖZETİ" · doküman bilgisi), "fatura değildir" notu, 1 Alıcı,
   2 İşler, 3 Kalemler (tür × adet × birim fiyat × tutar; teklif dışı işaretli; ara toplam, KDV, genel toplam), 4 Tahsilatlar (tahsil edilen,
   kalan). Rapor ve teklif belgesiyle aynı görünüm (belge.css .rb- sınıfları). SAF, React'in kaçışıyla (ham HTML yok). Tutarlar KURUŞ. */
import { createElement as h, type ReactNode } from "react";
import { firmaAdresi, firmaLogosu } from "./belge.ts";

export interface FaturaBelgesiVerisi {
  firma: { ad: string; kod: string; adres?: string | null; logo?: string | null };
  no: string; tarih: string; vade: string; vadeGun: number; kaydeden: string;
  alici: { unvan: string; vd: string | null; vno: string | null };
  isler: { no: string; tesis: string }[]; raporSayisi: number;
  /** fiyat null: fiyatsız (teklifsiz ve fiyat listesinde yok) */
  kalemler: { turAd: string; adet: number; fiyat: number | null; disi: boolean }[];
  ara: number; kdv: number; kdvTutar: number; toplam: number;
  tahsilatlar: { tarih: string; yontem: string; tutar: number; aciklama: string | null }[];
  tahsil: number; kalan: number;
}

const tarihNo = (s: string | null | undefined) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : "-");
const para = (kurus: number) => `${(kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const bolum = (no: number, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: ad }, h("h2", null, `${no}. ${ad}`), ...icerik);
const satir = (e: string, d: ReactNode, key: string) => h("tr", { key }, h("td", { className: "rb-e" }, e), h("td", null, d));

export const faturaOzetiFormKodu = (firmaKod: string) => `${firmaKod}-FR-FOZ-01`;

export function faturaBelgesi(v: FaturaBelgesiVerisi): ReactNode {
  const formKod = faturaOzetiFormKodu(v.firma.kod);
  return h("article", { className: "rb-sayfa", "aria-label": `${v.no} fatura özeti` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, firmaLogosu(v.firma)), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma)),
      h("td", { className: "rb-bas-ad" }, "Fatura özeti"),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Fatura No"), `: ${v.no}`),
        h("div", null, h("span", null, "Fatura Tarihi"), `: ${tarihNo(v.tarih)}`), h("div", null, h("span", null, "Vade"), `: ${tarihNo(v.vade)} (${v.vadeGun} gün)`))))),
    h("p", { className: "rb-taslak" }, "Bu belge fatura değildir: fatura e-Fatura programında kesilir; burada kalemler, KDV ve tahsilat özetlenir."),
    bolum(1, "Alıcı", h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Firma ünvanı", v.alici.unvan, "u"), satir("Vergi dairesi / no", [v.alici.vd && `${v.alici.vd} VD`, v.alici.vno].filter(Boolean).join(" · ") || "-", "v")))),
    bolum(2, v.isler.length > 1 ? "İşler" : "İş", h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      ...v.isler.map((x, i) => satir(v.isler.length > 1 ? `İş ${i + 1}` : "İş", `${x.no} · ${x.tesis}`, `i${i}`)),
      satir("Rapor sayısı", String(v.raporSayisi), "r")))),
    bolum(3, "Kalemler", h("table", null, kolonlar(["6%", "46%", "10%", "19%", "19%"]),
      h("thead", null, h("tr", null, ...["Sıra", "Ekipman türü", "Adet", "Birim fiyat", "Tutar"].map((x, i) => h("th", { key: i, className: "rb-ab" }, x)))),
      h("tbody", null,
        ...v.kalemler.map((k, i) => h("tr", { key: i },
          h("td", { className: "rb-orta" }, String(i + 1)),
          h("td", null, k.turAd, k.disi ? " (teklif dışı)" : ""),
          h("td", { className: "rb-orta" }, String(k.adet)),
          h("td", { className: "rb-sag" }, k.fiyat === null ? "fiyatsız" : para(k.fiyat)),
          h("td", { className: "rb-sag" }, k.fiyat === null ? "-" : para(k.adet * k.fiyat)))),
        h("tr", { key: "ara" }, h("td", { colSpan: 4, className: "rb-e rb-sag" }, "Ara toplam (KDV hariç)"), h("td", { className: "rb-sag" }, para(v.ara))),
        h("tr", { key: "kdv" }, h("td", { colSpan: 4, className: "rb-e rb-sag" }, `KDV %${v.kdv}`), h("td", { className: "rb-sag" }, para(v.kdvTutar))),
        h("tr", { key: "genel" }, h("td", { colSpan: 4, className: "rb-ab rb-sag" }, "Genel toplam"), h("td", { className: "rb-sag" }, h("b", null, para(v.toplam))))))),
    bolum(4, "Tahsilatlar", h("table", null, kolonlar(["18%", "22%", "36%", "24%"]),
      h("thead", null, h("tr", null, ...["Tarih", "Yöntem", "Açıklama", "Tutar"].map((x, i) => h("th", { key: i, className: "rb-ab" }, x)))),
      h("tbody", null,
        ...(v.tahsilatlar.length ? v.tahsilatlar.map((t, i) => h("tr", { key: i },
          h("td", { className: "rb-orta" }, tarihNo(t.tarih)), h("td", null, t.yontem), h("td", null, t.aciklama || "-"), h("td", { className: "rb-sag" }, para(t.tutar))))
          : [h("tr", { key: "yok" }, h("td", { colSpan: 4, className: "rb-orta" }, "Henüz tahsilat yok."))]),
        h("tr", { key: "tahsil" }, h("td", { colSpan: 3, className: "rb-e rb-sag" }, "Tahsil edilen"), h("td", { className: "rb-sag" }, para(v.tahsil))),
        h("tr", { key: "kalan" }, h("td", { colSpan: 3, className: "rb-ab rb-sag" }, "Kalan"), h("td", { className: "rb-sag" }, h("b", null, para(v.kalan))))))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod} · kaydeden ${v.kaydeden}`));
}
