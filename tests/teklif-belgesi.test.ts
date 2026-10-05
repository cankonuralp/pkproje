/* NEREDEN GELDİ: pkproje §3.7 satır 4 ("teklif PDF'i firmanın formatıyla; indirilip elle gönderilir" — 161) ve maket teklifler.html ("PDF";
   "Excel'den yükle" / "Excel'e aktar", L1 2026-09-30) · 325. Saf (veritabanısız): teklif belgesi çizicisi (src/belge/teklif.ts — kaçış, toplamlar,
   yazı tipi kapsamı, React'le birebir HTML) ve teklifin ekipman listesi Excel'i (src/modules/teklifler/excel.ts — başlık, tür eşleşmesi, tekrar,
   alan sınırları, kalemlere ekleme, dışa aktarma ve şablonun geri okunması). Kesin PDF (Chromium) tests/pdf.test.ts'te. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { tabloOku } from "../src/components/disa/oku.ts";
import { htmlYaz } from "../src/belge/html.ts";
import { ornekTeklif } from "../src/belge/ornek.ts";
import { teklifBelgesi, teklifFormKodu } from "../src/belge/teklif.ts";

const ORNEK_TEKLIF = ornekTeklif();
import { EKIPMAN_SINIR, ekipmanExceli, excelSatirlari, kalemlereEkle, sablonExceli, type ExcelTuru } from "../src/modules/teklifler/excel.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/\s+/g, " ");

test("teklif belgesi: başlık (form kodu firma kodundan), müşteri, kalemler, ara toplam / KDV / genel toplam, koşullar; React'le birebir HTML", () => {
  const agac = teklifBelgesi(ORNEK_TEKLIF), html = htmlYaz(agac);
  assert.equal(html, renderToStaticMarkup(agac as never), "htmlYaz = React");
  const m = metin(html);
  for (const p of ["DA-FR-TKL-01", "T-1026-001", "05.10.2026", "30 gün", "Deneme Bir Sanayi A.Ş.", "Merkez · 1234567890", "Tesis 1 Merkez — Deneme Cad. 1, Gebze / Kocaeli",
    "Tesis 2 Depo", "Hava tankı (Mekanik)", "12 ay", "1.250,00 TL", "2.500,00 TL", "900,50 TL", "Ara toplam (KDV hariç) 3.400,50 TL", "KDV %20 680,10 TL",
    "Genel toplam 4.080,60 TL", "04.11.2026 tarihine kadar geçerlidir", "Ulaşım dahildir.", "Deneme Planlama"]) assert.ok(m.includes(p), `belgede yok: ${p}\n${m}`);
  assert.equal(teklifFormKodu("XY"), "XY-FR-TKL-01");
  assert.ok(!m.includes("Taslak"), "gönderilmiş teklifte taslak şeridi yok");
  assert.ok(metin(htmlYaz(teklifBelgesi({ ...ORNEK_TEKLIF, durum: "taslak", bitis: null }))).includes("Taslak — müşteriye gönderilmedi."));
  assert.ok(metin(htmlYaz(teklifBelgesi({ ...ORNEK_TEKLIF, bitis: null }))).includes("gönderildiği tarihten itibaren 30 gün geçerlidir"));
});

test("teklif belgesi: kullanıcının yazdığı her değer metin olarak basılır (kayıtlı olmayan müşterinin ünvanı, not, tür adı)", () => {
  const html = htmlYaz(teklifBelgesi({ ...ORNEK_TEKLIF, notlar: "<img src=x onerror=alert(1)>",
    musteri: { ...ORNEK_TEKLIF.musteri, unvan: "<script>alert(1)</script>", yerler: [{ ad: null, adres: "\"><b>x</b>" }] },
    kalemler: [{ turAd: "<i>tür</i>", brans: null, periyot: null, adet: 1, fiyat: 1 }] }));
  assert.equal(/<script|<img|<b>x|<i>tür/.test(html), false, html);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
});

test("teklif belgesi: her karakter gömülü Carlito alt kümelerinin aralığında", () => {
  const css = readFileSync(new URL("../src/belge/belge.css", import.meta.url), "utf8");
  const araliklar = [...css.matchAll(/unicode-range:\s*([^;]+);/g)].flatMap((m) => m[1].split(",").map((x) => {
    const [a, b] = x.trim().replace(/^U\+/i, "").split("-");
    return [parseInt(a, 16), parseInt(b ?? a, 16)] as const;
  }));
  const kapsar = (k: number) => araliklar.some(([a, b]) => k >= a && k <= b);
  for (const d of ["taslak", "gonderildi"] as const) {
    const disari = [...new Set([...metin(htmlYaz(teklifBelgesi({ ...ORNEK_TEKLIF, durum: d })))].filter((c) => !kapsar(c.codePointAt(0)!)))];
    assert.deepEqual(disari, [], d);
  }
});

const TURLER: ExcelTuru[] = [
  { id: "00000000-0000-4000-8000-000000000001", ad: "Hava tankı", kod: "HT", brans: "m" },
  { id: "00000000-0000-4000-8000-000000000002", ad: "İç tesisat", kod: "EIT", brans: "e" },
];
const [HT, EIT] = TURLER.map((t) => t.id);

test("Excel'den yükle: başlık atlanır; tür adla (Türkçe büyük / küçük harf) ya da kodla; boş satır yok sayılır; tekrar eden kod, bilinmeyen tür, uzun alan gerekçesiyle atlanır", () => {
  const l = excelSatirlari([
    ["Kod", "Ekipman türü", "Konum", "Seri no"],
    ["ht-1", "HAVA TANKI", "Kazan dairesi", "S-1"],
    ["", "iç tesisat", "Fabrika", ""],
    ["", "", "", ""],
    ["HT-1", "Hava tankı", "", ""],
    ["HT-9", "Forklift", "", ""],
    ["", "EIT", "", ""],
    ["X".repeat(21), "Hava tankı", "", ""],
    ["", "Hava tankı", "K".repeat(81), ""],
    ["HT-2", "Hava tankı", "", ""],
    ["", "", "Depo", ""],
  ], TURLER, [{ kod: "HT-2", tur: HT, konum: "", seri: "" }]);
  assert.deepEqual(l.map((x) => [x.satir, x.kod, x.tur, x.ok, x.neden]), [
    [2, "HT-1", HT, true, ""], [3, "", EIT, true, ""], [5, "HT-1", HT, false, "Kod dosyada iki kez, atlanır"], [6, "HT-9", "", false, "Tür bulunamadı, atlanır"],
    [7, "", EIT, true, ""], [8, "X".repeat(21), HT, false, "Kod en çok 20 karakter, atlanır"], [9, "", HT, false, "Konum en çok 80 karakter, atlanır"],
    [10, "HT-2", HT, false, "Kod listede zaten var, atlanır"], [11, "", "", false, "Tür yok, atlanır"],
  ]);
  assert.deepEqual(excelSatirlari([["HT-1", "Hava tankı"]], TURLER).map((x) => x.satir), [1], "başlıksız dosyada ilk satır veri");
});

test("kalemlere ekle: var olan kalemin adedi artar, yeni tür fiyat listesinden; boş ilk kalem kalkar; liste 2 000'i aşmaz", () => {
  const satirlar = excelSatirlari([["", "Hava tankı"], ["", "Hava tankı"], ["", "İç tesisat"], ["", "Yok"]], TURLER);
  const r = kalemlereEkle([{ tur: "", adet: "1", fiyat: "" }, { tur: HT, adet: "1", fiyat: "1.000,00" }], [], satirlar, (t) => (t === EIT ? 90050 : null));
  assert.deepEqual(r.kalemler, [{ tur: HT, adet: "3", fiyat: "1.000,00" }, { tur: EIT, adet: "1", fiyat: "900,50" }]);
  assert.deepEqual([r.eklenen, r.turSayisi, r.atlanan, r.ekipmanlar.length], [3, 2, 1, 3]);
  const dolu = Array.from({ length: EKIPMAN_SINIR - 1 }, (_, i) => ({ kod: `K${i}`, tur: HT, konum: "", seri: "" }));
  const s = kalemlereEkle([{ tur: "", adet: "1", fiyat: "" }], dolu, satirlar, () => null);
  assert.deepEqual([s.ekipmanlar.length, s.eklenen, s.atlanan], [EKIPMAN_SINIR, 1, 3], "sınır");
  assert.deepEqual(kalemlereEkle([{ tur: "", adet: "1", fiyat: "" }], [], [], () => null).kalemler, [{ tur: "", adet: "1", fiyat: "" }], "boş kalmaz");
});

test("Excel'e aktar ve şablon: geri okununca aynı satırlar; şablon doğrudan içe alınabilir", async () => {
  const b = ekipmanExceli([{ kod: "HT-1", tur: HT, konum: "Kazan dairesi", seri: "S-1" }, { kod: "", tur: EIT, konum: "", seri: "" }], TURLER,
    (t) => (t === HT ? 125000 : null));
  assert.deepEqual(await tabloOku("x.xlsx", b), [
    ["Kod", "Ekipman türü", "Konum", "Seri no", "Branş", "Birim fiyat (TL)"], ["HT-1", "Hava tankı", "Kazan dairesi", "S-1", "Mekanik", "1.250,00"],
    ["", "İç tesisat", "", "", "Elektrik", ""],
  ]);
  const s = excelSatirlari(await tabloOku("sablon.xlsx", sablonExceli("Hava tankı")), TURLER);
  assert.deepEqual(s.map((x) => [x.tur, x.konum, x.seri, x.ok]), [[HT, "Kazan dairesi", "HT-24-118", true]]);
});
