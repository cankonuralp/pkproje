/* TEKLİF BELGESİ ÇİZİCİ (325; pkproje §3.7 satır 4 "teklif PDF'i firmanın formatıyla; indirilip elle gönderilir" — 161; maket teklifler.html
   X["pdf"] "teklif yazdırma penceresinden PDF olur"). TEMEL FORMAT (firma kodu + "-FR-TKL-01"; firmaya özel sürüm §3.7 kuralıyla kodda): başlık
   tablosu (logo yeri · firma · "FİYAT TEKLİFİ" · doküman bilgisi), 1 Müşteri bilgileri, 2 Teklif kalemleri (tür × periyot × adet × birim fiyat ×
   tutar; ara toplam, KDV, genel toplam), 3 Koşullar (geçerlilik, KDV hariç fiyat, not), 4 Hazırlayan. Rapor belgesiyle aynı görünüm (belge.css,
   .rb- sınıfları). SAF, React'in kaçışıyla (ham HTML yok); createElement (düğüm test koşucusu doğrudan yükler — tests/teklif-belgesi.test.ts). */
import { createElement as h, type ReactNode } from "react";

export interface TeklifBelgesiVerisi {
  firma: { ad: string; kod: string };
  no: string; tarih: string; gecerlilik: number; bitis: string | null; kdv: number; notlar: string | null; hazirlayan: string;
  durum: "taslak" | "gonderildi" | "kabul" | "red" | "suresi";
  /** yerler: kayıtlı müşteride teklifin tesisleri (ad, adres); kayıtlı olmayanda tek adres (ad yok) */
  musteri: { unvan: string; vergi: string | null; eposta: string | null; tel: string | null; ilgili: string | null; yerler: { ad: string | null; adres: string | null }[] };
  /** fiyat KURUŞ, KDV hariç */
  kalemler: { turAd: string; brans: "m" | "e" | null; periyot: number | null; adet: number; fiyat: number }[];
}

const tarihNo = (s: string | null | undefined) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : "-");
const para = (kurus: number) => `${(kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const deger = (s: string | null | undefined) => (s && s.trim() ? s : "-");
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const bolum = (no: number, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: ad }, h("h2", null, `${no}. ${ad}`), ...icerik);
const satir = (e: string, d: ReactNode, key: string) => h("tr", { key }, h("td", { className: "rb-e" }, e), h("td", null, d));

export const teklifFormKodu = (firmaKod: string) => `${firmaKod}-FR-TKL-01`;

export function teklifBelgesi(v: TeklifBelgesiVerisi): ReactNode {
  const formKod = teklifFormKodu(v.firma.kod);
  const ara = v.kalemler.reduce((n, k) => n + k.adet * k.fiyat, 0), genel = Math.round((ara * (100 + v.kdv)) / 100);
  const m = v.musteri;
  const yerler = m.yerler.length
    ? m.yerler.map((y, i) => satir(m.yerler.length > 1 ? `Tesis ${i + 1}` : y.ad ? "Tesis" : "Adres", y.ad ? `${y.ad}${y.adres ? ` — ${y.adres}` : ""}` : deger(y.adres), `y${i}`))
    : [satir("Adres", "-", "y")];
  return h("article", { className: "rb-sayfa", "aria-label": `${v.no} teklif belgesi` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, "LOGO"), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad)),
      h("td", { className: "rb-bas-ad" }, "Fiyat teklifi"),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Teklif No"), `: ${v.no}`),
        h("div", null, h("span", null, "Teklif Tarihi"), `: ${tarihNo(v.tarih)}`), h("div", null, h("span", null, "Geçerlilik"), `: ${v.gecerlilik} gün`))))),
    v.durum === "taslak" ? h("p", { className: "rb-taslak" }, "Taslak — müşteriye gönderilmedi.") : null,
    bolum(1, "Müşteri bilgileri", h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Firma ünvanı", m.unvan, "u"), satir("Vergi dairesi / no", deger(m.vergi), "v"), ...yerler,
      satir("İlgili kişi", deger(m.ilgili), "i"), satir("E-posta", deger(m.eposta), "e"), satir("Telefon", deger(m.tel), "t")))),
    bolum(2, "Teklif kalemleri", h("table", null, kolonlar(["6%", "40%", "12%", "10%", "16%", "16%"]),
      h("thead", null, h("tr", null, ...["Sıra", "Ekipman türü", "Periyot", "Adet", "Birim fiyat", "Tutar"].map((x, i) => h("th", { key: i, className: "rb-ab" }, x)))),
      h("tbody", null,
        ...v.kalemler.map((k, i) => h("tr", { key: i },
          h("td", { className: "rb-orta" }, String(i + 1)),
          h("td", null, k.turAd, k.brans ? ` (${k.brans === "m" ? "Mekanik" : "Elektrik"})` : ""),
          h("td", { className: "rb-orta" }, k.periyot ? `${k.periyot} ay` : "-"),
          h("td", { className: "rb-orta" }, String(k.adet)),
          h("td", { className: "rb-sag" }, para(k.fiyat)),
          h("td", { className: "rb-sag" }, para(k.adet * k.fiyat)))),
        h("tr", { key: "ara" }, h("td", { colSpan: 5, className: "rb-e rb-sag" }, "Ara toplam (KDV hariç)"), h("td", { className: "rb-sag" }, para(ara))),
        h("tr", { key: "kdv" }, h("td", { colSpan: 5, className: "rb-e rb-sag" }, `KDV %${v.kdv}`), h("td", { className: "rb-sag" }, para(genel - ara))),
        h("tr", { key: "genel" }, h("td", { colSpan: 5, className: "rb-ab rb-sag" }, "Genel toplam"), h("td", { className: "rb-sag" }, h("b", null, para(genel))))))),
    bolum(3, "Koşullar", h("p", { className: "rb-kutu-metin" },
      `Bu teklif ${v.bitis ? `${tarihNo(v.bitis)} tarihine kadar` : `gönderildiği tarihten itibaren ${v.gecerlilik} gün`} geçerlidir. Birim fiyatlara KDV dahil değildir; `
      + `KDV %${v.kdv} oranıyla ayrıca gösterilmiştir.`
      + (v.notlar ? `\n${v.notlar}` : ""))),
    bolum(4, "Hazırlayan", h("table", null, kolonlar(["28%", "40%", "32%"]), h("tbody", null,
      h("tr", null, h("td", { className: "rb-e" }, "Ad soyad"), h("td", null, v.hazirlayan), h("td", { rowSpan: 2, className: "rb-imza" }, "İmza / kaşe")),
      h("tr", null, h("td", { className: "rb-e" }, "Tarih"), h("td", null, tarihNo(v.tarih)))))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod}`));
}
