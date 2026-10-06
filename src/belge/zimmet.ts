/* ZİMMET TESLİM FORMU BELGESİ (344; maket maket-belge.js MB.zimmetFormu, personel.html zimmet formu — "PDF indir", "İmzala"; AA3: "eğitim zimmet
   formu gönderilirse oradan onaylanabilsin"). TEMEL FORMAT (firma kodu + "-FR-ZMT-01"): başlık tablosu (logo · firma · belge adı · doküman
   bilgisi: form no, tarih), teslim alan (ad · meslek), teslim eden (firma adına), 1 Zimmetlenen varlıklar (# · varlık: kod + ad · tür · teslim
   alındığı gün, ölçüm cihazında kalibrasyon bitişi), 2 Taahhüt, imzalar (Teslim eden · Teslim alan: "Tarih · imza" — imza, imzalı PDF'in
   kendisinde). İmzaya gönderilmeden indirilen formda numara yok ("—"). Öteki belgelerle aynı görünüm (belge.css .rb-). SAF, React'in kaçışıyla. */
import { createElement as h, type ReactNode } from "react";
import { firmaAdresi, firmaLogosu } from "./belge.ts";

export interface ZimmetFormuVerisi {
  firma: { ad: string; kod: string; adres?: string | null; logo?: string | null };
  /** imzaya gönderilince verilen numara (ZF-AAYY-SIRA); indirilen taslakta null */
  no: string | null;
  /** YYYY-AA-GG */
  tarih: string;
  alan: { ad: string; meslek: string };
  /** Firma ayarları › Zimmet teslim eden; seçilmediyse null ("Firma adına") */
  eden: { ad: string; meslek: string } | null;
  varliklar: readonly { kod: string; ad: string; tur: string; teslim: string | null; not: string | null }[];
}

export const zimmetFormKodu = (firmaKod: string) => `${firmaKod}-FR-ZMT-01`;
export const ZIMMET_TAAHHUT = "Yukarıda listelenen varlıkları eksiksiz ve çalışır durumda teslim aldım. Özenle ve yalnız işim için kullanacağımı; kayıp, hasar ya da "
  + "arızayı gecikmeden bildireceğimi; işten ayrılışımda ya da istendiğinde eksiksiz iade edeceğimi kabul ederim.";

const tarihYaz = (g: string) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const bolum = (no: number, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: ad }, h("h2", null, `${no}. ${ad}`), ...icerik);
const satir = (e: string, d: ReactNode, key: string) => h("tr", { key }, h("td", { className: "rb-e" }, e), h("td", null, d));

export function zimmetFormu(v: ZimmetFormuVerisi): ReactNode {
  const formKod = zimmetFormKodu(v.firma.kod);
  const eden = v.eden ? `${v.eden.ad} · firma adına` : "Firma adına";
  const imza = (rol: string, ad: string) => h("td", { className: "rb-imza", key: rol }, h("div", null, h("b", null, rol)), h("div", null, ad), h("div", null, "Tarih · imza"));
  return h("article", { className: "rb-sayfa", "aria-label": `${v.no ?? "Taslak"} zimmet teslim formu` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, firmaLogosu(v.firma)), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma)),
      h("td", { className: "rb-bas-ad" }, "Zimmet teslim formu"),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Form No"), `: ${v.no ?? "—"}`),
        h("div", null, h("span", null, "Tarih"), `: ${tarihYaz(v.tarih)}`))))),
    h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Teslim alan", `${v.alan.ad} · ${v.alan.meslek}`, "a"), satir("Teslim eden", eden, "e"))),
    bolum(1, "Zimmetlenen varlıklar",
      h("table", null, kolonlar(["7%", "51%", "18%", "24%"]),
        h("thead", null, h("tr", null, ...["#", "Varlık", "Tür", "Teslim"].map((x) => h("th", { key: x, className: "rb-ab" }, x)))),
        h("tbody", null, ...v.varliklar.map((x, i) => h("tr", { key: i },
          h("td", null, String(i + 1)), h("td", null, h("b", null, x.kod), ` · ${x.ad}`), h("td", null, x.tur),
          h("td", null, x.teslim ? tarihYaz(x.teslim) : "-", x.not ? ` · ${x.not}` : "")))))),
    bolum(2, "Taahhüt", h("p", { className: "rb-kutu-metin" }, ZIMMET_TAAHHUT)),
    h("table", null, kolonlar(["50%", "50%"]), h("tbody", null, h("tr", null, imza("Teslim eden", eden), imza("Teslim alan", v.alan.ad)))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod} · temel format`));
}
