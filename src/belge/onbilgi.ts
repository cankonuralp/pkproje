/* ÖN BİLGİLENDİRME FORMU BELGESİ (2026-10-25, belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca
   bağlamalıyız"; N1 2026-09-30 — "ön bilgilendirme formu her firmanın kendi formatına göre değişir", pkproje §3.7 satır 15). Planın bilgisiyle:
   TEMEL FORMAT (firma kodu + "-FR-OBF-01" — firma-ayarlari/sema.ts onBilgiFormKodu): başlık tablosu (logo · firma · belge adı · doküman bilgisi:
   proje no, tarih), müşteri / tesis / adres, 1 Kontrol bilgileri (planlanan tarih, muayene uzmanları), 2 Kontrol edilecek ekipmanlar (# · kod ·
   ekipman · konum), 3 Bilgilendirme, imzalar (Muayene firması · Tesis yetkilisi: "Tarih · imza"). Firmanın yayınladığı format varsa o (katalog.ts),
   yoksa Firma ayarları'na yüklenen PDF, o da yoksa bu. Öteki belgelerle aynı görünüm (belge.css .rb-). SAF, React'in kaçışıyla. */
import { createElement as h, type ReactNode } from "react";
import type { FormatTanimi } from "../format/tanim.ts";
import { onBilgiFormKodu } from "../modules/firma-ayarlari/sema.ts";
import { firmaAdresi, firmaLogosu, tarihNo } from "./belge.ts";

export interface OnBilgiVerisi {
  firma: { ad: string; kod: string; adres?: string | null; logo?: string | null };
  /** planın proje numarası (P-AAYY-SIRA) */
  projeNo: string;
  /** belgenin basıldığı gün (YYYY-AA-GG) */
  tarih: string;
  musteri: string; tesis: string; adres: string | null;
  /** planın başlangıç ve bitiş günü (YYYY-AA-GG) */
  baslangic: string; bitis: string;
  /** plan ekibi */
  uzmanlar: readonly { ad: string; meslek: string }[];
  /** plandaki ekipmanlar (koda göre) */
  ekipmanlar: readonly { kod: string; tur: string; konum: string | null }[];
  /** firmanın yayınladığı ön bilgilendirme formu formatı (yoksa yüklenen PDF ya da temel format) */
  format?: FormatTanimi | null;
}

export { onBilgiFormKodu };
export const ON_BILGI_METIN = "Periyodik kontrol yukarıdaki tarihlerde, listelenen ekipmanlar için yapılacaktır. Kontrol sırasında ekipmanların çalışır ve "
  + "erişilebilir durumda olması, ekipmanı tanıyan bir tesis yetkilisinin hazır bulunması; kullanım kılavuzu, bakım kayıtları ve önceki periyodik kontrol "
  + "raporlarının hazır tutulması gerekir. Kontrol süresince ekipman kullanıma kapatılabilir; çalışma alanının güvenlik önlemleri tesisçe alınır.";

const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const bolum = (no: number, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: ad }, h("h2", null, `${no}. ${ad}`), ...icerik);
const satir = (e: string, d: ReactNode, key: string) => h("tr", { key }, h("td", { className: "rb-e" }, e), h("td", null, d));
/** planlanan tarih: tek gün ya da "başlangıç – bitiş" */
export const onBilgiTarihi = (v: Pick<OnBilgiVerisi, "baslangic" | "bitis">) =>
  v.bitis && v.bitis !== v.baslangic ? `${tarihNo(v.baslangic)} – ${tarihNo(v.bitis)}` : tarihNo(v.baslangic);

export function onBilgiFormu(v: OnBilgiVerisi): ReactNode {
  const formKod = onBilgiFormKodu(v.firma.kod);
  const imza = (rol: string, ad: string) => h("td", { className: "rb-imza", key: rol }, h("div", null, h("b", null, rol)), h("div", null, ad), h("div", null, "Tarih · imza"));
  return h("article", { className: "rb-sayfa", "aria-label": `${v.projeNo} ön bilgilendirme formu` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, firmaLogosu(v.firma)), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma)),
      h("td", { className: "rb-bas-ad" }, "Ön bilgilendirme formu"),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Proje No"), `: ${v.projeNo}`),
        h("div", null, h("span", null, "Tarih"), `: ${tarihNo(v.tarih)}`))))),
    h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Müşteri", v.musteri, "m"), satir("Tesis", v.tesis, "t"), satir("Adres", v.adres || "-", "a"))),
    bolum(1, "Kontrol bilgileri", h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Planlanan tarih", onBilgiTarihi(v), "d"),
      satir("Muayene uzmanları", v.uzmanlar.map((x) => `${x.ad}${x.meslek ? ` · ${x.meslek}` : ""}`).join(", ") || "-", "u")))),
    bolum(2, "Kontrol edilecek ekipmanlar",
      h("table", null, kolonlar(["7%", "23%", "40%", "30%"]),
        h("thead", null, h("tr", null, ...["#", "Kod", "Ekipman", "Konum"].map((x) => h("th", { key: x, className: "rb-ab" }, x)))),
        h("tbody", null, ...(v.ekipmanlar.length
          ? v.ekipmanlar.map((x, i) => h("tr", { key: i }, h("td", null, String(i + 1)), h("td", null, h("b", null, x.kod)), h("td", null, x.tur), h("td", null, x.konum || "-")))
          : [h("tr", { key: "bos" }, h("td", { colSpan: 4 }, "Planda ekipman yok."))])))),
    bolum(3, "Bilgilendirme", h("p", { className: "rb-kutu-metin" }, ON_BILGI_METIN)),
    h("table", null, kolonlar(["50%", "50%"]), h("tbody", null, h("tr", null,
      imza("Muayene firması", v.firma.ad), imza("Tesis yetkilisi", "Ad soyad · unvan")))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod} · temel format`));
}
