/* ARAÇ TESLİM TUTANAĞI BELGESİ (342; maket maket-belge.js MB.aracTutanak, araclar.html tutanak-goster / tutanak-kaydet — AA3, AA4: "teslim alan
   kişiyse tutanak onun Onaylar › Diğer'ine imzaya düşer"). TEMEL FORMAT (firma kodu + "-FR-ARC-01"): başlık tablosu (logo · firma · belge adı ·
   doküman bilgisi), tutanak bilgisi (no, tarih ve saat, plaka, araç, teslim eden, teslim alan), 1 Aracın durumu (kilometre, yakıt seviyesi),
   2 Araçta olanlar (kalem başına Var / Yok), 3 Hasar ve notlar, 4 Fotoğraflar (açı başına çekildi / çekilmedi), 5 Taahhüt, imzalar (Teslim eden ·
   Teslim alan: "Tarih · imza" — imza, imzalı PDF'in kendisinde). Eski tutanakta yazılmamış bilgi "kayıtta yok". Rapor, teklif, fatura özeti ve talep
   formuyla aynı görünüm (belge.css .rb- sınıfları). SAF, React'in kaçışıyla (ham HTML yok). */
import { createElement as h, type ReactNode } from "react";
import { firmaAdresi, firmaLogosu } from "./belge.ts";

export interface AracTutanagiVerisi {
  firma: { ad: string; kod: string; adres?: string | null; logo?: string | null };
  no: string;
  /** teslim anı (ISO) */
  zaman: string;
  plaka: string;
  /** "Binek · Marka Model · 2022" */
  arac: string;
  /** null = depo (firma adına) */
  eden: { ad: string; meslek: string } | null;
  alan: { ad: string; meslek: string } | null;
  /** görünen kilometre ("12.400 km"); null = kayıtta yok */
  km: string | null;
  /** görünen yakıt seviyesi ("1/2"); null = kayıtta yok */
  yakit: string | null;
  /** kalem başına var mı; null = kayıtta yok (eski tutanak) */
  kontrol: readonly (readonly [kalem: string, var_: boolean])[] | null;
  hasar: string | null;
  /** açı başına fotoğraf çekildi mi */
  fotolar: readonly (readonly [aci: string, var_: boolean])[];
}

export const aracTutanakFormKodu = (firmaKod: string) => `${firmaKod}-FR-ARC-01`;
export const TAAHHUT = "Yukarıda durumu yazılı aracı, belirtilen kilometre ve yakıt seviyesiyle, listedeki kalemlerle teslim aldım. Aracı yalnız iş için, "
  + "trafik kurallarına uyarak kullanacağımı; kaza, hasar, arıza ve trafik cezalarını gecikmeden bildireceğimi; istendiğinde eksiksiz iade edeceğimi kabul ederim.";

const ZAMAN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const zamanYaz = (iso: string) => ZAMAN.format(new Date(iso)).replace(",", "");
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const bolum = (no: number, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: ad }, h("h2", null, `${no}. ${ad}`), ...icerik);
const YOK = "kayıtta yok";
const kisi = (k: { ad: string; meslek: string } | null) => (k ? `${k.ad} · ${k.meslek}` : "Depo · firma adına");
const ikili = (e1: string, d1: ReactNode, e2: string, d2: ReactNode, key: string) =>
  h("tr", { key }, h("td", { className: "rb-e" }, e1), h("td", null, d1), h("td", { className: "rb-e" }, e2), h("td", null, d2));
const tablo = (basliklar: readonly string[], genislik: readonly string[], satirlar: readonly (readonly ReactNode[])[]) =>
  h("table", null, kolonlar(genislik),
    h("thead", null, h("tr", null, ...basliklar.map((b) => h("th", { key: b, className: "rb-ab" }, b)))),
    h("tbody", null, ...satirlar.map((s, i) => h("tr", { key: i }, ...s.map((d, j) => h("td", { key: j }, d))))));

export function aracTutanagi(v: AracTutanagiVerisi): ReactNode {
  const formKod = aracTutanakFormKodu(v.firma.kod);
  const imza = (rol: string, k: { ad: string } | null) => h("td", { className: "rb-imza", key: rol },
    h("div", null, h("b", null, rol)), h("div", null, k ? k.ad : "Depo · firma adına"), h("div", null, "Tarih · imza"));
  const kontrol = v.kontrol
    ? v.kontrol.map(([k, var_], i) => [String(i + 1), k, var_ ? "X" : "", var_ ? "" : "X"] as const)
    : [["-", YOK, "", ""] as const];
  return h("article", { className: "rb-sayfa", "aria-label": `${v.no} araç teslim tutanağı` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, firmaLogosu(v.firma)), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma)),
      h("td", { className: "rb-bas-ad" }, "Araç teslim tutanağı"),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Tutanak No"), `: ${v.no}`),
        h("div", null, h("span", null, "Tarih"), `: ${zamanYaz(v.zaman)}`))))),
    h("table", null, kolonlar(["18%", "32%", "18%", "32%"]), h("tbody", null,
      ikili("Plaka", v.plaka, "Araç", v.arac, "a"),
      ikili("Teslim eden", kisi(v.eden), "Teslim alan", kisi(v.alan), "k"))),
    bolum(1, "Aracın durumu", h("table", null, kolonlar(["18%", "32%", "18%", "32%"]), h("tbody", null,
      ikili("Kilometre", v.km ?? YOK, "Yakıt seviyesi", v.yakit ?? YOK, "d")))),
    bolum(2, "Araçta olanlar", tablo(["#", "Kalem", "Var", "Yok"], ["8%", "62%", "15%", "15%"], kontrol)),
    bolum(3, "Hasar ve notlar", h("p", { className: "rb-kutu-metin" }, v.hasar || "Hasar ya da not yazılmadı.")),
    bolum(4, "Fotoğraflar", tablo(["Açı", "Fotoğraf"], ["50%", "50%"], v.fotolar.map(([a, var_]) => [a, var_ ? "çekildi" : "çekilmedi"]))),
    bolum(5, "Taahhüt", h("p", { className: "rb-kutu-metin" }, TAAHHUT)),
    h("table", null, kolonlar(["50%", "50%"]), h("tbody", null, h("tr", null, imza("Teslim eden", v.eden), imza("Teslim alan", v.alan)))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod} · temel format`));
}
