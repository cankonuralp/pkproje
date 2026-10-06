/* NEREDEN GELDİ: maket maket-veri.js MV.BELGE_ONAY ("… eğitimi katılım formu"), onaylar.html #/diger; AA3 ("eğitim zimmet formu gönderilirse oradan
   onaylanabilsin") · 345. Saf (veritabanısız): eğitim katılım formu çizicisi (src/belge/egitim.ts) — form kodu firma kodundan, katılan, eğitim,
   kurum, tarihler, beyan, imzalar, kaçış, React'le birebir HTML. Kesin PDF tests/pdf.test.ts; veri, yetki ve imzaya gönderme tests/egitimler.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { egitimFormKodu, egitimFormu } from "../src/belge/egitim.ts";
import { htmlYaz } from "../src/belge/html.ts";
import { ornekEgitimFormu } from "../src/belge/ornek.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");

test("eğitim katılım formu: form kodu (DA-FR-EGT-01), katılan, eğitim, kurum, tarihler, beyan, imzalar; kaçış; React'le birebir HTML", () => {
  const agac = egitimFormu(ornekEgitimFormu()), html = htmlYaz(agac);
  assert.equal(html, renderToStaticMarkup(agac as never), "htmlYaz = React");
  assert.equal(egitimFormKodu("KM"), "KM-FR-EGT-01");
  const m = metin(html);
  for (const p of ["DA-FR-EGT-01", "Eğitim katılım formu", "Form No : EF-1026-001", "Eğitim Tarihi : 15.09.2026", "Katılan Deneme Denetçi · Makine mühendisi",
    "Eğitim Yüksekte <çalışma> & kurtarma", "Eğitimi veren Deneme Eğitim Kurumu", "Tekrar tarihi 15.09.2027", "eğitime katıldığımı",
    "Eğitimi veren Deneme Eğitim Kurumu Tarih · imza", "Katılan Deneme Denetçi Tarih · imza", "temel format"]) assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  assert.ok(html.includes("Yüksekte &lt;çalışma&gt; &amp; kurtarma"));
  assert.ok(!/<script|<çalışma>/i.test(html));
});
