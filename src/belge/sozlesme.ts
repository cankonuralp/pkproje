/* SÖZLEŞME BELGESİ (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir
   müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"). İş sözleşmesinin (Sözleşmeler modülü) belgesi.
   Firmanın yayınladığı sözleşme formatı varsa o (katalog.ts belgeCizimi — firmanın kendi metni formatın yazı hücrelerinde, elle doldurulan yerleri
   ./doldurma.ts), yoksa bu TEMEL FORMAT (firma kodu + "-FR-SZL-01"): başlık tablosu (logo · firma · belge adı · doküman bilgisi: sözleşme no,
   tarih), 1 Taraflar (hizmet veren · hizmet alan: ünvan, vergi dairesi / no, adres), 2 Kapsam (tesisler: ad · il / ilçe · SGK sicil no), 3 Süre ve
   ödeme (başlangıç, bitiş, ödeme vadesi, yenileme, dayanak teklif), imzalar (Hizmet veren · Hizmet alan). Temel formatta hukuki madde metni YOK —
   yalnız kayıttaki bilgiler (sözleşmenin metni firmanın formatındadır). Öteki belgelerle aynı görünüm (belge.css .rb-). SAF, React'in kaçışıyla. */
import { createElement as h, type ReactNode } from "react";
import type { FormatTanimi } from "../format/tanim.ts";
import { firmaAdresi, firmaLogosu, tarihNo } from "./belge.ts";

export interface SozlesmeBelgesiVerisi {
  firma: { ad: string; kod: string; adres?: string | null; logo?: string | null };
  /** sözleşme numarası */
  no: string;
  /** sözleşmenin tarihi (YYYY-AA-GG) */
  tarih: string;
  musteri: { unvan: string; vd: string | null; vno: string | null; adres?: string | null };
  /** kapsamdaki tesisler */
  tesisler: readonly { ad: string; il: string | null; ilce: string | null; sgk: string | null }[];
  /** başlangıç ve bitiş günü (YYYY-AA-GG) */
  baslangic: string; bitis: string;
  /** ödeme vadesi (gün) */
  vade: number;
  yenileme: "yok" | "otomatik";
  /** dayanak teklifin numarası (yoksa null) */
  teklifNo: string | null;
  /** firmanın ve müşterinin imza günü (YYYY-AA-GG; müşteri imzalamadıysa null) */
  firmaImza: string; musteriImza: string | null;
  /** firmanın yayınladığı sözleşme formatı (yoksa temel format) */
  format?: FormatTanimi | null;
  /** formatın elle doldurulan yerlerinin değerleri (hücre kimliği → değer; ./doldurma.ts) */
  elle?: Record<string, string> | null;
}

export const sozlesmeFormKodu = (firmaKod: string) => `${firmaKod}-FR-SZL-01`;
export const SOZLESME_ADI = "Hizmet sözleşmesi";
export const YENILEME_AD: Record<SozlesmeBelgesiVerisi["yenileme"], string> = { yok: "Yenilenmez", otomatik: "Otomatik yenilenir" };
/** "ilçe / il" (biri yoksa öteki; ikisi de yoksa boş) */
export const ilIlce = (x: { il: string | null; ilce: string | null }) => [x.ilce, x.il].filter((s) => s && s.trim()).join(" / ");

const deger = (s: string | null | undefined) => (s && s.trim() ? s : "-");
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const bolum = (no: number, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: ad }, h("h2", null, `${no}. ${ad}`), ...icerik);
const satir = (e: string, d: ReactNode, key: string) => h("tr", { key }, h("td", { className: "rb-e" }, e), h("td", null, d));

export function sozlesmeBelgesi(v: SozlesmeBelgesiVerisi): ReactNode {
  const formKod = sozlesmeFormKodu(v.firma.kod);
  const imza = (rol: string, ad: string, gun: string | null) => h("td", { className: "rb-imza", key: rol },
    h("div", null, h("b", null, rol)), h("div", null, ad), h("div", null, gun ? `${tarihNo(gun)} · imza` : "Tarih · imza"));
  const m = v.musteri;
  return h("article", { className: "rb-sayfa", "aria-label": `${v.no} sözleşme` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, firmaLogosu(v.firma)), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma)),
      h("td", { className: "rb-bas-ad" }, SOZLESME_ADI),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Sözleşme No"), `: ${v.no}`),
        h("div", null, h("span", null, "Tarih"), `: ${tarihNo(v.tarih)}`))))),
    bolum(1, "Taraflar", h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Hizmet veren", [v.firma.ad, v.firma.adres].filter((s) => s && s.trim()).join(" — "), "f"),
      satir("Hizmet alan", m.unvan, "m"), satir("Vergi dairesi / no", `${deger(m.vd)} / ${deger(m.vno)}`, "v"), satir("Adres", deger(m.adres), "a")))),
    bolum(2, "Kapsam", h("table", null, kolonlar(["7%", "43%", "25%", "25%"]),
      h("thead", null, h("tr", null, ...["#", "Tesis", "İlçe / il", "SGK sicil no"].map((x) => h("th", { key: x, className: "rb-ab" }, x)))),
      h("tbody", null, ...(v.tesisler.length
        ? v.tesisler.map((x, i) => h("tr", { key: i }, h("td", null, String(i + 1)), h("td", null, h("b", null, x.ad)), h("td", null, ilIlce(x) || "-"), h("td", null, deger(x.sgk))))
        : [h("tr", { key: "bos" }, h("td", { colSpan: 4 }, "Tesis yok."))])))),
    bolum(3, "Süre ve ödeme", h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Başlangıç", tarihNo(v.baslangic), "b"), satir("Bitiş", tarihNo(v.bitis), "s"), satir("Ödeme vadesi", `${v.vade} gün`, "o"),
      satir("Yenileme", YENILEME_AD[v.yenileme], "y"), satir("Dayanak teklif", deger(v.teklifNo), "t")))),
    h("table", null, kolonlar(["50%", "50%"]), h("tbody", null, h("tr", null,
      imza("Hizmet veren", v.firma.ad, v.firmaImza), imza("Hizmet alan", m.unvan, v.musteriImza)))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod} · temel format`));
}
