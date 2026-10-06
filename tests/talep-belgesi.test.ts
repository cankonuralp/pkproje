/* NEREDEN GELDİ: maket maket-belge.js MB.TALEP_FORMAT / MB.talepFormu (35. tur 161–162, T8: "talebin formu (firma formatı; temel KM-FR-IZN-01 /
   MSR-01) PDF olarak açılır, indirilir") · 341. Saf (veritabanısız): talep formu çizicisi (src/belge/talep.ts) — form kodu firma kodundan ve
   türden, alanlar, beyan, red gerekçesi, imzalar (gönderildi / onaylandı / reddedildi, karar yoksa "Tarih · imza"), kaçış, React'le birebir HTML.
   Kesin PDF tests/pdf.test.ts; veri ve yetki tests/talepler.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { htmlYaz } from "../src/belge/html.ts";
import { ornekTalep } from "../src/belge/ornek.ts";
import { talepFormKodu, talepFormu } from "../src/belge/talep.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");

test("masraf formu: form kodu (DA-FR-MSR-01), alanlar, beyan, imzalar (onaylandı); kaçış; React'le birebir HTML", () => {
  const agac = talepFormu(ornekTalep()), html = htmlYaz(agac);
  assert.equal(html, renderToStaticMarkup(agac as never), "htmlYaz = React");
  assert.deepEqual([talepFormKodu("KM", "izin"), talepFormKodu("KM", "masraf")], ["KM-FR-IZN-01", "KM-FR-MSR-01"]);
  const m = metin(html);
  for (const p of ["DA-FR-MSR-01", "Masraf formu", "G-1026-001", "Durum : Onaylandı", "Deneme Denetçi · Makine mühendisi", "Personel masraf bildirimi",
    "İş P-1026-001", "Tutar (KDV dahil) 250,00 TL", "KDV %20 · 41,67 TL (KDV hariç 208,33 TL)", "fişinin aslını muhasebeye teslim edeceğimi",
    "Talep eden Deneme Denetçi gönderildi", "Onaylayan Deneme Muhasebe onaylandı", "temel format"]) assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  assert.ok(html.includes("Deneme &lt;yakıt&gt; &amp; fiş"));
  assert.ok(!/<script|<yakıt>/i.test(html));
});

test("izin formu: bekleyen talepte onaylayan yeri 'Tarih · imza' (firma yöneticisi); reddedilende gerekçe", () => {
  const izin = { ...ornekTalep(), tip: "izin" as const, no: "I-1026-001", durum: "Onay bekliyor", karar: null,
    alanlar: [["İzin türü", "Yıllık izin"], ["Başlangıç", "12.10.2026"], ["Bitiş", "16.10.2026"], ["Süre", "5 iş günü"], ["Açıklama", ""], ["Ek belge", "-"]] as [string, string][] };
  const m = metin(htmlYaz(talepFormu(izin)));
  for (const p of ["DA-FR-IZN-01", "İzin talep formu", "Personel izin talebi", "İzin türü Yıllık izin", "Süre 5 iş günü", "Açıklama -", "İzin dönüşü görevimin başında olacağım",
    "Onaylayan Firma yöneticisi Tarih · imza"]) assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  const red = metin(htmlYaz(talepFormu({ ...izin, durum: "Reddedildi", red: "Yoğun dönem", karar: { ad: "Deneme Yönetici", zaman: "2026-10-06T08:00:00.000Z", sonuc: "reddedildi" } })));
  for (const p of ["Red gerekçesi: Yoğun dönem", "Onaylayan Deneme Yönetici reddedildi"]) assert.ok(red.includes(p), `belgede yok: ${p}\n${red}`);
});
