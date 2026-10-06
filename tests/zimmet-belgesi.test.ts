/* NEREDEN GELDİ: maket maket-belge.js MB.zimmetFormu (personel.html zimmet formu "PDF indir" / "İmzala"; AA3: "eğitim zimmet formu gönderilirse
   oradan onaylanabilsin") · 344. Saf (veritabanısız): zimmet teslim formu çizicisi (src/belge/zimmet.ts) — form kodu firma kodundan, teslim alan /
   eden, varlık tablosu (kalibrasyon notu), taahhüt, imzalar, numarasız taslakta "—", kaçış, React'le birebir HTML. Kesin PDF tests/pdf.test.ts;
   veri, yetki ve imzaya gönderme tests/personel-dosya.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { htmlYaz } from "../src/belge/html.ts";
import { ornekZimmetFormu } from "../src/belge/ornek.ts";
import { zimmetFormKodu, zimmetFormu } from "../src/belge/zimmet.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");

test("zimmet teslim formu: form kodu (DA-FR-ZMT-01), teslim alan / eden, varlıklar, taahhüt, imzalar; kaçış; React'le birebir HTML", () => {
  const agac = zimmetFormu(ornekZimmetFormu()), html = htmlYaz(agac);
  assert.equal(html, renderToStaticMarkup(agac as never), "htmlYaz = React");
  assert.equal(zimmetFormKodu("KM"), "KM-FR-ZMT-01");
  const m = metin(html);
  for (const p of ["DA-FR-ZMT-01", "Zimmet teslim formu", "Form No : ZF-1026-001", "Tarih : 06.10.2026", "Teslim alan Deneme Denetçi · Makine mühendisi",
    "Teslim eden Deneme Yönetici · firma adına", "1 OC-201 · Topraklama <ölçer> & prob Ölçüm cihazı 01.09.2026 · kalibrasyon 15.03.2027",
    "2 34 DNM 001 · Kamyonet · Deneme Araç -", "eksiksiz ve çalışır durumda teslim aldım", "Teslim alan Deneme Denetçi Tarih · imza", "temel format"]) {
    assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  }
  assert.ok(html.includes("Topraklama &lt;ölçer&gt; &amp; prob"));
  assert.ok(!/<script|<ölçer>/i.test(html));
});

test("indirilen taslak: numara yok (—), teslim eden seçilmediyse 'Firma adına'", () => {
  const m = metin(htmlYaz(zimmetFormu({ ...ornekZimmetFormu(), no: null, eden: null })));
  for (const p of ["Form No : —", "Teslim eden Firma adına", "Teslim eden Firma adına Tarih · imza"]) assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
});
