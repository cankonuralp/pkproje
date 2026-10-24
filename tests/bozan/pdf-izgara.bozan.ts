/* OLUMSUZ KANIT — tests/pdf-izgara.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur, göreli içe aktarmalar mutlak yola çevrilir):
   1. Kenar örtme denetimi kalkınca (her kenar çizili sayılınca) birleşik başlık şeridi sütun sütun bölünür.
   2. Sözlük katlaması kalkınca "İSG-KATİP Sözl. ID" etiketi sözlükle eşleşmez: kayıttan gelecek hücre elle doldurulan alan olur.
   3. Yan yana kuralı kalkınca aynı yükseklikteki iki tablo alt alta düşer. Sayfalar UYDURMA.
   (2026-10-24 denetim kilitleri)
   4. Dış çerçeve kuralı kalkınca (içindeki aday atılınca) sayfa kenarlığı tabloyu yutar: tablo tek hücre olur.
   5. Çift çizgi birleşmeyince 3 puntoluk şerit satır olur.
   6. Bant bölme kalkınca tek parça form tek tablo kalır.
   7. İmza bilgisi tablonun tamamına uygulanınca firmanın unvanı uzmanın mesleği olur.
   8. Yazı çizgide bölünmeyince sıra no kaybolur.
   9. Madde satırı imza başlığı sayılınca açıklama kutusu imza yeri olur.
   10. Çok satırlı listede sütun başlığından kayıt verilince ölçüm cihazının markası ekipmanın markası olur.
   11. Aynı kayıt bir satırda iki kez verilince saat hücresi tarih + saat basar.
   12. Taşan yazının üstünden geçtiği hücre alan olur.
   13. Hazır cümle kuralı kalkınca kutudaki cümle sabit yazı kalır.
   14. Sayfa altı satır satır değerlendirilmezse kod satırı gövdeye düşer, form kodu bulunmaz.
   15. Bölüm birleştirme kalkınca 45 paragraf 45 bölüm olur.
   16. Sayfa devamı kalkınca iki sayfaya bölünen tablo iki tablo olur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import type { PdfCizgi, PdfSayfasi, PdfYazi } from "../../src/modules/rapor-format/pdf-tipler.ts";

const klasor = mkdtempSync(join(tmpdir(), "pdf-izgara-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type Izgara = typeof import("../../src/modules/rapor-format/pdf-izgara.ts");
async function bozuk(eski: string, yeni: string, ...ek: [string, string][]): Promise<Izgara> {
  const dosya = "src/modules/rapor-format/pdf-izgara.ts", kok = resolve(dosya, "..");
  let kaynak = readFileSync(dosya, "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`)
    .replace(/from "react"/g, `from "${import.meta.resolve("react")}"`).replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`);
  for (const [a, b] of [[eski, yeni], ...ek]) {
    assert.ok(kaynak.includes(a), `bozulacak satır kaynakta yok: ${a}`);
    kaynak = kaynak.replace(a, () => b);
  }
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, kaynak);
  return import(pathToFileURL(yol).href) as Promise<Izgara>;
}
const gercek = () => import("../../src/modules/rapor-format/pdf-izgara.ts");

const yazi = (s: string, x: number, y: number): PdfYazi => ({ s, x, y, g: s.length * 4.5, h: 9, boy: 9, kalin: false, egik: false, aile: "Arial" });
/** ızgara çizgileri ("d:r:c" c. dikey çizginin r. satırdaki parçası çizilmez) */
function izgara(xs: number[], ys: number[], bos: string[] = []): PdfCizgi[] {
  const l: PdfCizgi[] = [];
  for (let r = 0; r < ys.length; r++) for (let c = 0; c + 1 < xs.length; c++) l.push({ x1: xs[c], y1: ys[r], x2: xs[c + 1], y2: ys[r], kalinlik: 0.5 });
  for (let c = 0; c < xs.length; c++) for (let r = 0; r + 1 < ys.length; r++) if (!bos.includes(`d:${r}:${c}`)) l.push({ x1: xs[c], y1: ys[r], x2: xs[c], y2: ys[r + 1], kalinlik: 0.5 });
  return l;
}
const sayfa = (cizgiler: PdfCizgi[], yazilar: PdfYazi[]): PdfSayfasi => ({ en: 595, boy: 842, yazilar, dolgular: [], cizgiler, resimler: [] });

test("kenar örtme denetimi kalkınca birleşik başlık şeridi bölünür", async () => {
  const s = sayfa(izgara([40, 200, 555], [100, 118, 136], ["d:0:1"]), [yazi("1. UYDURMA BILGILER", 250, 104), yazi("Marka", 43, 122)]);
  assert.equal((await gercek()).pdfIzgara([s]).bolumler[0].satirlar[0].hucreler[0].sutunBirlesim, 2, "sağlam: şerit tek hücre");
  const m = await bozuk("const acik = (o: Ortu) => o.oran < ORTU;", "const acik = (_o: Ortu) => false;");
  assert.equal(m.pdfIzgara([s]).bolumler[0].satirlar[0].hucreler.length, 2, "bozuk: şerit iki hücreye bölündü");
});

test("sözlük katlaması kalkınca İSG-KATİP etiketi eşleşmez, kayıt hücresi alan olur", async () => {
  const s = sayfa(izgara([40, 200, 555], [100, 118]), [yazi("İSG-KATİP Sözl. ID", 43, 104)]);
  const tur = (m: Izgara) => { const h = m.pdfIzgara([s]).bolumler[0].satirlar[0].hucreler[1]; return [h.tur, h.kaynak]; };
  assert.deepEqual(tur(await gercek()), ["kayit", "isg"], "sağlam: sözlükten");
  const m = await bozuk("const k = katla(etiket);", "const k = etiket;");
  assert.equal(m.kayitKaynagi("İSG-KATİP Sözl. ID"), null);
  assert.deepEqual(tur(m), ["alan", "yok"], "bozuk: kayıt yerine alan");
});

test("yan yana kuralı kalkınca iki tablo alt alta düşer", async () => {
  const s = sayfa([...izgara([40, 160, 290], [180, 198, 216]), ...izgara([310, 430, 555], [180, 198, 216])], [yazi("Sol", 43, 184), yazi("Sag", 313, 184)]);
  assert.deepEqual((await gercek()).pdfIzgara([s]).bolumler.map((b) => b.yan), [false, true], "sağlam: yan yana");
  const m = await bozuk("if (g && yanda) g.push(b); else gruplar.push([b]);", "void yanda; gruplar.push([b]);");
  assert.deepEqual(m.pdfIzgara([s]).bolumler.map((b) => b.yan), [false, false], "bozuk: alt alta");
});

/* ── 2026-10-24 denetim kilitleri ── */
const sol = (s: string, x0: number, y0: number, y1: number, kalin = false): PdfYazi => ({ ...yazi(s, x0 + 3, (y0 + y1) / 2 - 4.5), kalin });
const izgaraBos = (xs: number[], ys: number[], bos: string[]): PdfCizgi[] => {
  const l: PdfCizgi[] = [];
  for (let r = 0; r < ys.length; r++) for (let c = 0; c + 1 < xs.length; c++) if (!bos.includes(`y:${r}:${c}`)) l.push({ x1: xs[c], y1: ys[r], x2: xs[c + 1], y2: ys[r], kalinlik: 0.5 });
  for (let c = 0; c < xs.length; c++) for (let r = 0; r + 1 < ys.length; r++) if (!bos.includes(`d:${r}:${c}`)) l.push({ x1: xs[c], y1: ys[r], x2: xs[c], y2: ys[r + 1], kalinlik: 0.5 });
  return l;
};
const turler = (m: Izgara, s: PdfSayfasi, n = 0) => m.pdfIzgara([s]).bolumler[n].satirlar.map((x) => x.hucreler.map((h) => (h.tur === "kayit" ? `k:${h.kaynak}` : h.tur === "imza" ? "imza" : h.tur)));

test("dış çerçeve kuralı kalkınca sayfa kenarlığı tabloyu yutar", async () => {
  const s = sayfa([...izgara([20, 575], [20, 822]), ...izgara([60, 200, 340], [100, 130, 160])], [yazi("A", 63, 110), yazi("B", 203, 110), yazi("C", 63, 140)]);
  const say = (m: Izgara) => { const b = m.pdfIzgara([s]).bolumler[0]; return [b.satirlar.length, b.sutunlar.length]; };
  assert.deepEqual(say(await gercek()), [2, 2], "sağlam: tablo 2 × 2");
  const m = await bozuk("    const ic = sirali.filter((b) => b !== a && !atilan.has(b) && icinde(a.kutu, b.kutu, YAKIN));\n    if (!ic.length) continue;",
    "    for (const b of sirali) if (b !== a && icinde(a.kutu, b.kutu, YAKIN)) atilan.add(b);\n    continue;\n    const ic: TabloAday[] = [];");
  assert.deepEqual(say(m), [1, 1], "bozuk: tek hücre");
});

test("çift çizgi birleşmeyince 3 puntoluk şerit satır olur", async () => {
  const s = sayfa(izgara([60, 200, 340], [97, 100, 130, 160]), [yazi("A", 63, 110), yazi("B", 63, 140)]);
  assert.equal((await gercek()).pdfIzgara([s]).bolumler[0].satirlar.length, 2, "sağlam: 2 satır");
  const m = await bozuk("if (out.length && v - o <= CIFT && ", "if (false && ");
  assert.equal(m.pdfIzgara([s]).bolumler[0].satirlar.length, 3, "bozuk: şerit satır");
});

/** tek parça form: şerit · firma (Unvanı) · yan yana iki yarı · imza bloğu (Unvanı) */
function tekParca(): PdfSayfasi {
  const xs = [40, 200, 300, 400, 555], ys = [66, 82, 98, 114, 130, 146, 162, 178];
  const bos = [1, 2, 3].map((c) => `d:0:${c}`).concat(["d:1:2", "d:1:3", "d:2:1", "d:2:3", "d:4:3", "d:5:3", "d:6:3"]);
  return sayfa(izgaraBos(xs, ys, bos), [sol("1. FIRMA", 40, 66, 82, true), sol("Firma Unvanı", 40, 82, 98), sol("HALAT", 40, 98, 114, true), sol("KANCA", 300, 98, 114, true),
    sol("Cap", 40, 114, 130), sol("Mandal", 300, 114, 130), sol("KISI", 40, 130, 146, true), sol("KONTROLU YAPAN", 200, 130, 146, true), sol("ONAYLAYAN", 300, 130, 146, true),
    sol("Adı Soyadı", 40, 146, 162), sol("Unvanı", 40, 162, 178)]);
}
test("bant bölme kalkınca tek parça form tek tablo kalır", async () => {
  const ad = (m: Izgara) => m.pdfIzgara([tekParca()]).bolumler.map((b) => b.ad);
  assert.deepEqual(ad(await gercek()), ["1. FIRMA", "HALAT", "KANCA", "KISI"], "sağlam: bantlar");
  const m = await bozuk("const bantlar = kesim.length > 2 ?", "const bantlar = false ?");
  assert.deepEqual(ad(m), ["1. FIRMA"], "bozuk: tek tablo");
});

test("imza bilgisi tablonun tamamına uygulanınca firmanın unvanı uzmanın mesleği olur", async () => {
  const s = sayfa(izgaraBos([40, 200, 380, 555], [100, 116, 132, 148], ["d:0:2"]), [sol("Firma Unvanı", 40, 100, 116), sol("Bilgi", 40, 116, 132), sol("KONTROLU YAPAN", 200, 116, 132),
    sol("ONAYLAYAN", 380, 116, 132), sol("Unvanı", 40, 132, 148)]);
  assert.deepEqual(turler(await gercek(), s)[0], ["yazi", "k:firma"], "sağlam: firma");
  const m = await bozuk("const imzaAlti = IMZA_TABLOSU.test(kis);", "const imzaAlti = bl.some((x) => x.durum === \"bos\" && IMZA_TABLOSU.test(katla(sutunBasligi(x))));");
  assert.deepEqual(turler(m, s)[0], ["yazi", "k:uzman_meslek"], "bozuk: uzmanın mesleği");
});

test("yazı çizgide bölünmeyince sıra no kaybolur", async () => {
  const s = sayfa(izgara([40, 60, 300, 400], [100, 118, 136, 154]), [yazi("No", 43, 104), yazi("Madde", 63, 104), yazi("Sonuc", 303, 104),
    yazi("1 Madde 1", 60 - 1.5 * 4.5, 122), yazi("2 Madde 2", 60 - 1.5 * 4.5, 140)]);
  assert.deepEqual(turler(await gercek(), s)[1], ["sira", "yazi", "cevap"], "sağlam: sıra no");
  const m = await bozuk("    for (const y of kes(y0, t0)) {", "    for (const y of [y0]) {");
  assert.notEqual(turler(m, s)[1][0], "sira", "bozuk: sıra no yok");
});

test("madde satırı imza başlığı sayılınca açıklama kutusu imza yeri olur", async () => {
  const s = sayfa(izgaraBos([40, 70, 400, 555], [100, 118, 136, 154, 234], ["d:3:2"]), [sol("No", 40, 100, 118), sol("Kontrol maddesi", 70, 100, 118), sol("Sonuc", 400, 100, 118),
    sol("1", 40, 118, 136), sol("Fren", 70, 118, 136), sol("2", 40, 136, 154), sol("Uzman onayi gereken parcalar", 70, 136, 154), sol("Aciklamalar", 40, 154, 234)]);
  assert.ok(!turler(await gercek(), s).flat().includes("imza"), "sağlam: imza yok");
  const m = await bozuk("return x && !listeSatiri(x.r) ? katla(x.metin) : \"\"; };", "return x ? katla(x.metin) : \"\"; };",
    ["const imzaTablosu = !listeTablosu && ", "const imzaTablosu = "]);
  assert.ok(turler(m, s).flat().includes("imza"), "bozuk: imza sanıldı");
});

test("çok satırlı listede sütun başlığından kayıt verilince ölçüm cihazının markası ekipmanın markası olur", async () => {
  const s = sayfa(izgara([40, 300, 555], [100, 118, 136, 154]), [sol("Marka", 40, 100, 118), sol("Seri no", 300, 100, 118)]);
  assert.deepEqual(turler(await gercek(), s)[1], ["alan", "alan"], "sağlam: alan");
  const m = await bozuk("const kaynak = liste.n > 1 ? null : bul(et);", "const kaynak = bul(et);");
  assert.deepEqual(turler(m, s)[1], ["k:marka", "k:seri"], "bozuk: kayıt");
});

test("aynı kayıt bir satırda iki kez verilince saat hücresi tarih + saat basar", async () => {
  const s = sayfa(izgara([40, 200, 300, 400], [100, 118]), [sol("Kontrol Tarihi / Saati", 40, 100, 118)]);
  assert.deepEqual(turler(await gercek(), s)[0], ["yazi", "k:bas", "alan"], "sağlam: saat alanı");
  const m = await bozuk("} else if (kaynak && !kul.has(kaynak)) {", "} else if (kaynak) {");
  assert.deepEqual(turler(m, s)[0], ["yazi", "k:bas", "k:bas"], "bozuk: iki kez");
});

test("taşan yazının üstünden geçtiği hücre alan olur", async () => {
  const s = sayfa(izgara([40, 200, 300, 555], [200, 218]), [yazi("Cok uzun bir aciklama metni iki hucreye tasar", 43, 204)]);
  assert.equal(turler(await gercek(), s)[0][1], "yazi", "sağlam: yazı");
  const m = await bozuk("if (b.kapli || dar) {", "if (dar) {");
  assert.equal(turler(m, s)[0][1], "alan", "bozuk: alan");
});

test("hazır cümle kuralı kalkınca kutudaki cümle sabit yazı kalır", async () => {
  const s = sayfa(izgara([40, 555], [400, 416, 466]), [sol("NOTLAR", 40, 400, 416, true), yazi("Uygunsuzluk tespit edilmemistir.", 200, 437)]);
  assert.equal(turler(await gercek(), s)[1][0], "alan", "sağlam: alan");
  const m = await bozuk("else if (notKutusu(b))", "else if (false)");
  assert.equal(turler(m, s)[1][0], "yazi", "bozuk: sabit yazı");
});

test("sayfa altı satır satır değerlendirilmezse kod satırı gövdeye düşer, form kodu bulunmaz", async () => {
  const s = sayfa(izgara([40, 555], [100, 120]), [yazi("Tablo", 43, 104), { ...yazi("ABC.021", 40, 790), boy: 7, h: 7 }, { ...yazi("Rev.0", 500, 790), boy: 7, h: 7 },
    ...[0, 1, 2].map((i) => ({ ...yazi(`Uzun satir ${i} ${"y".repeat(150)}`, 40, 804 + i * 7), boy: 6, h: 6 }))]);
  const g = (await gercek()).pdfIzgara([s]);
  assert.deepEqual([g.altYazi, g.formKodu], ["ABC.021 · Rev.0", "ABC.021"], "sağlam: sayfa altı");
  const m = (await bozuk("const kisaMi = (p: Paragraf) => p.satirlar.length === 1 && p.satirlar[0].metin.length <= 120;", "const kisaMi = (_p: Paragraf) => false;")).pdfIzgara([s]);
  assert.deepEqual([m.altYazi, m.formKodu], ["", ""], "bozuk: sayfa altı yok");
});

test("bölüm birleştirme kalkınca 45 paragraf 45 bölüm olur", async () => {
  const s = sayfa([], Array.from({ length: 45 }, (_, i) => yazi(`Paragraf ${i + 1}`, 40, 40 + i * 16)));
  assert.ok((await gercek()).pdfIzgara([s]).bolumler.length <= 37, "sağlam: birleşti");
  const m = await bozuk("bolumler: paragraflariBirlestir(bolumler, BOLUM_HEDEF),", "bolumler,");
  assert.equal(m.pdfIzgara([s]).bolumler.length, 45, "bozuk: 45 bölüm");
});

test("sayfa devamı kalkınca iki sayfaya bölünen tablo iki tablo olur", async () => {
  const sf = (bas: number, y0: number): PdfSayfasi => {
    const ys = Array.from({ length: 26 }, (_, i) => y0 + i * 25), l = [sol("No", 40, ys[0], ys[1], true), sol("Madde", 80, ys[0], ys[1], true)];
    for (let r = 1; r < 25; r++) l.push(sol(String(bas + r - 1), 40, ys[r], ys[r + 1]), sol(`Madde ${bas + r - 1}`, 80, ys[r], ys[r + 1]));
    return sayfa(izgara([40, 80, 555], ys), l);
  };
  assert.equal((await gercek()).pdfIzgara([sf(1, 100), sf(25, 40)]).bolumler.length, 1, "sağlam: tek tablo");
  const m = await bozuk("      && devamEkle(o.bolum,", "      && false && devamEkle(o.bolum,");
  assert.equal(m.pdfIzgara([sf(1, 100), sf(25, 40)]).bolumler.length, 2, "bozuk: iki tablo");
});
