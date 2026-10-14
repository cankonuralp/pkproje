/* NEREDEN GELDİ: 550 — S.A.Y cevabı Markdown (sunum 546 K6; reisim 2026-10-14: "aynı claud kullanır gibi"). Saf ayrıştırıcı (src/modules/say/
   markdown.ts): başlık, kalın / eğik, kod, madde (iç içe), numaralı liste, tablo, alıntı, çizgi, bağlantı; HTML İŞLENMEZ (metin kalır — ekran React
   ile kaçışlı çizer), bağlantı yalnız http(s) ("javascript:" bağlantı olmaz), çok uzun metin sınırda kesilir. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { markdown, satirIci } from "../src/modules/say/markdown.ts";

test("bloklar: başlık, paragraf, madde (iç içe), numaralı, tablo, alıntı, kod, çizgi", () => {
  const b = markdown("# Başlık\n\nBir **kalın** satır\nikinci satır\n\n- bir\n- iki\n  - iç\n3. üç\n4. dört\n\n| A | B |\n|---|:-:|\n| 1 | 2 |\n\n> alıntı\n\n```\nkod <b>\n```\n---");
  assert.deepEqual(b.map((x) => x.t), ["h", "p", "ul", "ol", "tablo", "alinti", "kod", "cizgi"]);
  const ul = b[2], ol = b[3], t = b[4];
  assert.ok(ul.t === "ul" && ul.maddeler.length === 2 && ul.maddeler[1].alt?.t === "ul");
  assert.ok(ol.t === "ol" && ol.bas === 3 && ol.maddeler.length === 2);
  assert.ok(t.t === "tablo" && t.bas.length === 2 && t.satirlar.length === 1);
  assert.deepEqual(b[6], { t: "kod", m: "kod <b>" });
  assert.ok(b[1].t === "p" && b[1].ic.some((x) => x.t === "br"), "paragraf içi satır sonu");
});

test("satır içi: kalın, eğik, kod, güvenli bağlantı; HTML metin kalır, javascript bağlantı olmaz", () => {
  assert.deepEqual(satirIci("**k** *e* `x` [a](https://ornek.example/y)"), [
    { t: "b", ic: [{ t: "y", m: "k" }] }, { t: "y", m: " " }, { t: "i", ic: [{ t: "y", m: "e" }] }, { t: "y", m: " " }, { t: "k", m: "x" }, { t: "y", m: " " },
    { t: "a", href: "https://ornek.example/y", ic: [{ t: "y", m: "a" }] },
  ]);
  assert.deepEqual(satirIci("<script>alert(1)</script>"), [{ t: "y", m: "<script>alert(1)</script>" }]);
  assert.ok(!JSON.stringify(satirIci("[t](javascript:alert)")).includes("\"a\""), "javascript: bağlantı değil");
  assert.ok(!JSON.stringify(satirIci("[t](data:text/html,x)")).includes("\"a\""), "data: bağlantı değil");
  assert.deepEqual(satirIci("dosya_adi_bu"), [{ t: "y", m: "dosya_adi_bu" }], "kelime içindeki alt çizgi eğik yapmaz");
  assert.deepEqual(satirIci("2 * 3 * 4"), [{ t: "y", m: "2 * 3 * 4" }], "boşluklu yıldız eğik yapmaz");
});

test("çok uzun metin sınırda kesilir; boş metin boş", () => {
  assert.deepEqual(markdown(""), []);
  const b = markdown("a".repeat(70_000));
  assert.ok(b[0].t === "p" && b[0].ic[0].t === "y" && b[0].ic[0].m.length === 60_000);
});
