/* NEREDEN GELDİ: maket muhasebe.html faturaCiz "Fatura özeti (PDF)" (X["pdf"]: "fatura e-Fatura programında kesilir; burada fatura özeti (kalemler,
   KDV, tahsilat) yazdırılır / PDF olur") · pkproje §11 1659 · 340. Saf (veritabanısız): fatura özeti çizicisi (src/belge/fatura.ts) — form kodu firma
   kodundan, "fatura değildir" notu, alıcı, iş, kalemler (teklif dışı / fiyatsız), toplamlar, tahsilatlar, kaçış, React'le birebir HTML. Kesin PDF
   tests/pdf.test.ts; veri (yetki, firma sızıntısı) tests/muhasebe.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { faturaBelgesi, faturaOzetiFormKodu } from "../src/belge/fatura.ts";
import { htmlYaz } from "../src/belge/html.ts";
import { ornekFatura } from "../src/belge/ornek.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");

test("fatura özeti: form kodu firma kodundan, fatura değildir notu, alıcı, iş, kalemler, toplamlar, tahsilatlar; React'le birebir HTML", () => {
  const agac = faturaBelgesi(ornekFatura()), html = htmlYaz(agac);
  assert.equal(html, renderToStaticMarkup(agac as never), "htmlYaz = React");
  assert.equal(faturaOzetiFormKodu("KM"), "KM-FR-FOZ-01");
  const m = metin(html);
  for (const p of ["DA-FR-FOZ-01", "DEN2026000000001", "05.10.2026", "04.11.2026 (30 gün)", "Bu belge fatura değildir", "Deneme Bir Sanayi A.Ş.",
    "Merkez VD · 1234567890", "P-1026-001 · Merkez", "Rapor sayısı 4", "Hava tankı 2 1.250,00 TL 2.500,00 TL", "Hava tankı (teklif dışı) 1 900,00 TL 900,00 TL",
    "Kompresör 1 fiyatsız -", "Ara toplam (KDV hariç) 3.400,00 TL", "KDV %20 680,00 TL", "Genel toplam 4.080,00 TL", "10.10.2026 Havale / EFT",
    "Tahsil edilen 2.080,00 TL", "Kalan 2.000,00 TL", "kaydeden Deneme Muhasebe"]) assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  /* kaçış: açıklamadaki işaretler metin olarak, etiket değil */
  assert.ok(html.includes("Deneme &lt;ödeme&gt; &amp; açıklama"));
  assert.ok(!/<script|<ödeme>/i.test(html));
});

test("fatura özeti: tahsilatsız fatura 'Henüz tahsilat yok', birden çok iş numaralı", () => {
  const v = { ...ornekFatura(), tahsilatlar: [], tahsil: 0, kalan: 408000, isler: [{ no: "P-1026-001", tesis: "Merkez" }, { no: "P-1026-002", tesis: "Depo" }] };
  const m = metin(htmlYaz(faturaBelgesi(v)));
  for (const p of ["Henüz tahsilat yok.", "Tahsil edilen 0,00 TL", "Kalan 4.080,00 TL", "2. İşler", "İş 1 P-1026-001 · Merkez", "İş 2 P-1026-002 · Depo"])
    assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
});
