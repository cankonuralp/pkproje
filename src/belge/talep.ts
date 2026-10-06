/* TALEP FORMU BELGESİ (341; maket maket-belge.js MB.TALEP_FORMAT / MB.talepFormu / MB.talepPdfAc — 35. tur 161–162, T8: "talebin formu (firma
   formatı; temel KM-FR-IZN-01 / MSR-01) PDF olarak açılır, indirilir"). TEMEL FORMAT (firma kodu + "-FR-IZN-01" izin, "-FR-MSR-01" masraf): başlık
   tablosu (logo · firma · form adı · doküman bilgisi), form bilgisi (form no, gönderildi, personel, durum), 1 Talep (alanlar), 2 Beyan (+ red gerekçesi),
   imzalar (Talep eden · Onaylayan: gönderildi / onaylandı / reddedildi, zamanıyla; karar yoksa "Tarih · imza"). Rapor, teklif ve fatura özeti
   belgesiyle aynı görünüm (belge.css .rb- sınıfları). SAF, React'in kaçışıyla (ham HTML yok). E-posta ile iletme K5 (iş kuyruğu). */
import { createElement as h, type ReactNode } from "react";
import { firmaAdresi, firmaLogosu } from "./belge.ts";

export type TalepTipi = "izin" | "masraf";
export interface TalepFormuVerisi {
  firma: { ad: string; kod: string; adres?: string | null; logo?: string | null };
  tip: TalepTipi; no: string; gonderildi: string;
  personel: { ad: string; meslek: string };
  /** görünen durum adı (Onay bekliyor, Onaylandı, Ödendi, Reddedildi) */
  durum: string;
  alanlar: readonly (readonly [etiket: string, deger: string])[];
  red: string | null;
  /** karar: onaylayan (ad), zaman ISO, sonuç; karar yoksa null */
  karar: { ad: string; zaman: string; sonuc: "onaylandi" | "reddedildi" } | null;
}

export const TALEP_FORMAT: Record<TalepTipi, { kod: string; baslik: string; alt: string; onaylayan: string; metin: string }> = {
  izin: { kod: "IZN-01", baslik: "İzin talep formu", alt: "Personel izin talebi", onaylayan: "Firma yöneticisi",
    metin: "Yukarıda belirtilen tarihler arasında izin kullanmak istiyorum. İzin dönüşü görevimin başında olacağım." },
  masraf: { kod: "MSR-01", baslik: "Masraf formu", alt: "Personel masraf bildirimi", onaylayan: "Muhasebe",
    metin: "Yukarıdaki masrafı iş için yaptığımı, fişinin aslını muhasebeye teslim edeceğimi beyan ederim." },
};
export const talepFormKodu = (firmaKod: string, tip: TalepTipi) => `${firmaKod}-FR-${TALEP_FORMAT[tip].kod}`;

const ZAMAN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const zamanYaz = (iso: string) => ZAMAN.format(new Date(iso)).replace(",", "");
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
const bolum = (no: number, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: ad }, h("h2", null, `${no}. ${ad}`), ...icerik);
const satir = (e: string, d: ReactNode, key: string) => h("tr", { key }, h("td", { className: "rb-e" }, e), h("td", null, d));

export function talepFormu(v: TalepFormuVerisi): ReactNode {
  const F = TALEP_FORMAT[v.tip], formKod = talepFormKodu(v.firma.kod, v.tip);
  const imza = (rol: string, ad: string, durum: string) => h("td", { className: "rb-imza", key: rol },
    h("div", null, h("b", null, rol)), h("div", null, ad), h("div", null, durum));
  return h("article", { className: "rb-sayfa", "aria-label": `${v.no} ${F.baslik.toLocaleLowerCase("tr")}` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "30%", "32%", "27%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, firmaLogosu(v.firma)), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma)),
      h("td", { className: "rb-bas-ad" }, F.baslik),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Form No"), `: ${v.no}`),
        h("div", null, h("span", null, "Gönderildi"), `: ${zamanYaz(v.gonderildi)}`), h("div", null, h("span", null, "Durum"), `: ${v.durum}`))))),
    h("table", null, kolonlar(["28%", "72%"]), h("tbody", null,
      satir("Personel", `${v.personel.ad} · ${v.personel.meslek}`, "p"), satir("Konu", F.alt, "k"))),
    bolum(1, "Talep", h("table", null, kolonlar(["28%", "72%"]), h("tbody", null, ...v.alanlar.map(([e, d], i) => satir(e, d || "-", `a${i}`))))),
    bolum(2, "Beyan", h("p", { className: "rb-kutu-metin" }, F.metin + (v.red ? `\nRed gerekçesi: ${v.red}` : ""))),
    h("table", null, kolonlar(["50%", "50%"]), h("tbody", null, h("tr", null,
      imza("Talep eden", v.personel.ad, `gönderildi · ${zamanYaz(v.gonderildi)}`),
      imza("Onaylayan", v.karar ? v.karar.ad : F.onaylayan,
        v.karar ? `${v.karar.sonuc === "onaylandi" ? "onaylandı" : "reddedildi"} · ${zamanYaz(v.karar.zaman)}` : "Tarih · imza")))),
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod} · temel format`));
}
