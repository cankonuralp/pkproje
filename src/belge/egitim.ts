/* EĞİTİM KATILIM FORMU BELGESİ (345; maket maket-veri.js MV.BELGE_ONAY "… eğitimi katılım formu", onaylar.html #/diger; AA3: "eğitim zimmet formu
   gönderilirse oradan onaylanabilsin"). TEMEL FORMAT (firma kodu + "-FR-EGT-01"): başlık tablosu (logo · firma · belge adı · doküman bilgisi: form no,
   eğitim tarihi), katılan (ad · meslek), eğitim (tür), eğitimi veren kurum, eğitim tarihi, tekrar tarihi; 1 Beyan; imzalar (Eğitimi veren · Katılan:
   "Tarih · imza" — imza, imzalı PDF'in kendisinde). Öteki belgelerle aynı görünüm (belge.css .rb-). SAF, React'in kaçışıyla (ham HTML yok). */
import { createElement as h, type ReactNode } from "react";
import { firmaAdresi, firmaLogosu } from "./belge.ts";

export interface EgitimFormuVerisi {
  firma: { ad: string; kod: string; adres?: string | null; logo?: string | null };
  /** EF-AAYY-SIRA */
  no: string;
  katilan: { ad: string; meslek: string };
  egitim: string;
  kurum: string;
  /** YYYY-AA-GG */
  tarih: string;
  tekrar: string;
}

export const egitimFormKodu = (firmaKod: string) => `${firmaKod}-FR-EGT-01`;
export const EGITIM_BEYAN = "Yukarıda belirtilen eğitime katıldığımı, eğitimde anlatılanları anladığımı ve işimde iş sağlığı ve güvenliği kurallarına "
  + "uyacağımı; eğitimin tekrar tarihinde yenileme eğitimine katılacağımı beyan ederim.";

const tarihYaz = (g: string) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const satir = (e: string, d: ReactNode, key: string) => h("tr", { key }, h("td", { className: "rb-e" }, e), h("td", null, d));

export function egitimFormu(v: EgitimFormuVerisi): ReactNode {
  const formKod = egitimFormKodu(v.firma.kod);
  const imza = (rol: string, ad: string) => h("td", { className: "rb-imza", key: rol }, h("div", null, h("b", null, rol)), h("div", null, ad), h("div", null, "Tarih · imza"));
  return h("article", { className: "rb-sayfa", "aria-label": `${v.no} eğitim katılım formu` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, firmaLogosu(v.firma)), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma)),
      h("td", { className: "rb-bas-ad" }, "Eğitim katılım formu"),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Form No"), `: ${v.no}`),
        h("div", null, h("span", null, "Eğitim Tarihi"), `: ${tarihYaz(v.tarih)}`))))),
    h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Katılan", `${v.katilan.ad} · ${v.katilan.meslek}`, "k"), satir("Eğitim", v.egitim, "e"), satir("Eğitimi veren", v.kurum, "v"),
      satir("Eğitim tarihi", tarihYaz(v.tarih), "t"), satir("Tekrar tarihi", tarihYaz(v.tekrar), "r"))),
    h("section", { className: "rb-bolum" }, h("h2", null, "1. Beyan"), h("p", { className: "rb-kutu-metin" }, EGITIM_BEYAN)),
    h("table", null, kolonlar(["50%", "50%"]), h("tbody", null, h("tr", null, imza("Eğitimi veren", v.kurum), imza("Katılan", v.katilan.ad)))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod} · temel format`));
}
