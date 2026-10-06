/* NEREDEN GELDİ: maket maket-belge.js MB.aracTutanak (araclar.html tutanak-goster; AA3 / AA4: "teslim alan kişiyse tutanak onun Onaylar ›
   Diğer'ine imzaya düşer") · 342. Saf (veritabanısız): araç teslim tutanağı çizicisi (src/belge/arac.ts) — form kodu firma kodundan, tutanak
   bilgisi, aracın durumu, araçta olanlar (Var / Yok), hasar, fotoğraflar, taahhüt, imzalar, eski tutanakta "kayıtta yok", kaçış, React'le birebir
   HTML. Kesin PDF tests/pdf.test.ts; veri, yetki ve imzaya gönderme tests/araclar.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { aracTutanagi, aracTutanakFormKodu } from "../src/belge/arac.ts";
import { htmlYaz } from "../src/belge/html.ts";
import { ornekAracTutanagi } from "../src/belge/ornek.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");

test("araç teslim tutanağı: form kodu (DA-FR-ARC-01), bilgiler, Var / Yok, fotoğraflar, taahhüt, imzalar; kaçış; React'le birebir HTML", () => {
  const agac = aracTutanagi(ornekAracTutanagi()), html = htmlYaz(agac);
  assert.equal(html, renderToStaticMarkup(agac as never), "htmlYaz = React");
  assert.equal(aracTutanakFormKodu("KM"), "KM-FR-ARC-01");
  const m = metin(html);
  for (const p of ["DA-FR-ARC-01", "Araç teslim tutanağı", "Tutanak No : AT-1026-001", "Plaka 34 DNM 001", "Araç Binek · Deneme Model · 2022",
    "Teslim eden Depo · firma adına", "Teslim alan Deneme Denetçi · Makine mühendisi", "Kilometre 12.400 km", "Yakıt seviyesi 1/2",
    "1 Ruhsat X", "3 Anahtar (2 adet) X", "Ön çekildi", "Arka çekilmedi", "trafik kurallarına uyarak", "Teslim alan Deneme Denetçi Tarih · imza",
    "temel format"]) assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  assert.ok(html.includes("Sol arka &lt;çizik&gt; &amp; göçük"));
  assert.ok(!/<script|<çizik>/i.test(html));
});

test("eski tutanak (kalemler, kilometre, yakıt yazılmamış): 'kayıtta yok'; hasarsız tutanakta not satırı", () => {
  const m = metin(htmlYaz(aracTutanagi({ ...ornekAracTutanagi(), kontrol: null, km: null, yakit: null, hasar: null, eden: { ad: "Deneme Eden", meslek: "Teknisyen" } })));
  for (const p of ["Kilometre kayıtta yok", "Yakıt seviyesi kayıtta yok", "- kayıtta yok", "Hasar ya da not yazılmadı.", "Teslim eden Deneme Eden · Teknisyen"]) {
    assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  }
});
