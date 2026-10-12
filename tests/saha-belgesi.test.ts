/* NEREDEN GELDİ: reisim 2026-10-12: "görselde saha takip formu üretme işi yok ? neden ? geri gelsin." — maket maket-belge.js MB.sahaFormu
   (planlarim.html saha formu; reisim 2026-09-26: "yapılan ekipmanlar ve yapıldığına dair firma onayı için imza yerleri"). Saf (veritabanısız): saha
   formu çizicisi (src/belge/saha.ts) — form kodu firma kodundan, form / proje no, tarih aralığı, müşteri / tesis / adres, ekipman tablosu, firma
   onayı, imza yerleri (firma yetkilisi kaşeli; muayene uzmanları), raporsuz planda boş satır, kaçış, React'le birebir HTML. Kesin PDF ve veri,
   yetki, tarama tests/plan-ici.test.ts. Örnek veriler uydurmadır. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { htmlYaz } from "../src/belge/html.ts";
import { SAHA_ONAY, sahaFormKodu, sahaFormu, type SahaFormuVerisi } from "../src/belge/saha.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
const ORNEK: SahaFormuVerisi = {
  firma: { ad: "Deneme Muayene Ltd.", kod: "DA", adres: "Deneme Mah. 1. Sok. No: 2, Ankara", logo: null },
  no: "P-1026-003-SF2", projeNo: "P-1026-003", baslangic: "2026-10-12", bitis: "2026-10-14",
  musteri: "Deneme Sanayi A.Ş.", tesis: "Merkez <Tesis> & Depo", adres: "Deneme Cad. 1, Gebze / Kocaeli",
  ekipmanlar: [{ kod: "HT-A2", tur: "Hava tankı", konum: "Kompresör odası" }, { kod: "ET-0003", tur: "Elektrik iç tesisatı", konum: null }],
  uzmanlar: ["Deneme Bir", "Deneme İki"],
};

test("saha formu: form kodu (DA-FR-SAH-01), form / proje no, tarih aralığı, müşteri / tesis / adres, ekipmanlar, firma onayı, imza yerleri; kaçış; React'le birebir", () => {
  const agac = sahaFormu(ORNEK), html = htmlYaz(agac);
  assert.equal(html, renderToStaticMarkup(agac as never), "htmlYaz = React");
  assert.equal(sahaFormKodu("KM"), "KM-FR-SAH-01");
  const m = metin(html);
  for (const p of ["DA-FR-SAH-01", "Saha formu", "Form No : P-1026-003-SF2", "Proje No : P-1026-003", "Tarih : 12.10.2026 – 14.10.2026",
    "Müşteri Deneme Sanayi A.Ş.", "Tesis Merkez <Tesis> & Depo", "Adres Deneme Cad. 1, Gebze / Kocaeli", "1. Kontrolü yapılan ekipmanlar",
    "1 HT-A2 Hava tankı Kompresör odası", "2 ET-0003 Elektrik iç tesisatı -", "2. Firma onayı", SAHA_ONAY,
    "Firma yetkilisi Ad soyad · unvan Tarih · imza · kaşe", "Muayene uzmanı Deneme Bir, Deneme İki Tarih · imza", "Deneme Muayene Ltd. · DA-FR-SAH-01 · temel format"]) {
    assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  }
  assert.ok(html.includes("Merkez &lt;Tesis&gt; &amp; Depo"));
  assert.ok(!/<script|<Tesis>/i.test(html));
});

test("tek günlük plan tek tarih; raporsuz planda ekipman tablosu boş satırla; adres yoksa '-'", () => {
  const m = metin(htmlYaz(sahaFormu({ ...ORNEK, bitis: ORNEK.baslangic, ekipmanlar: [], adres: null, uzmanlar: [] })));
  for (const p of ["Tarih : 12.10.2026", "Bu planda rapor yazılmadı.", "Adres -", "Muayene uzmanı - Tarih · imza"]) assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  assert.ok(!m.includes("12.10.2026 –"));
});
