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
   16. Sayfa devamı kalkınca iki sayfaya bölünen tablo iki tablo olur.
   17–28: 2026-10-24 ikinci denetim kilitleri (dosyanın sonunda). */
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
  const m = await bozuk("if (b.kapli || dar || baslikBosu(b)) {", "if (dar || baslikBosu(b)) {");
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
  const m = await bozuk("      if (devamEkle(o.bolum, devam,", "      if (false && devamEkle(o.bolum, devam,");
  assert.equal(m.pdfIzgara([sf(1, 100), sf(25, 40)]).bolumler.length, 2, "bozuk: iki tablo");
});

/* ── 2026-10-24 ikinci denetim kilitleri ──
   17. Küçük kutu ayıklanmazsa hücre çizgisine yapışık onay kutuları U | UD | X sütunlarını böler.
   18. Grup alt başlığı listeyi bölünce alt başlıktan sonraki maddelerin cevabı kaybolur.
   19. Seçenek yazısı tanınmazsa "☐ Uygun ☐ Uygun Değil" sabit yazı kalır.
   20. Ölçüm çizelgesi kuralı kalkınca satırın bütün değerleri satır etiketinin adını alır.
   21. Renkli zeminin üstündeki beyaz ince dolgu çizgi sayılmazsa tablo dağılır.
   22. Çerçeve kuralı kalkınca kenarlığa değen ayırma çizgisi kenarlığı tabloya çevirir.
   23. Sayfa numarası izden atılmazsa başlık her sayfada yeniden girer.
   24. Sürekli numara kuralı kalkınca ikinci liste 1'den başlar.
   25. Etiketin sağındaki boş kutular birleşmezse her kutu ayrı alan olur.
   26. Tablo dışı "Etiket: [kutu]" birleşmezse kutu boş kalır.
   27. Madde satırında sonuç cümlesi aranınca "… uygundur" maddesi raporun sonucu olur.
   28. Sayfa numarası sayfa altından atılmazsa alt yazıya girer. */
const kareC = (x: number, y: number, s: number): PdfCizgi[] => [
  { x1: x, y1: y, x2: x + s, y2: y, kalinlik: 0.5 }, { x1: x, y1: y + s, x2: x + s, y2: y + s, kalinlik: 0.5 },
  { x1: x, y1: y, x2: x, y2: y + s, kalinlik: 0.5 }, { x1: x + s, y1: y, x2: x + s, y2: y + s, kalinlik: 0.5 },
];
const listeSayfasi = (cevap: string, madde2 = "Madde 2"): PdfSayfasi => {
  const ys = [100, 116, 132, 148, 164];
  return sayfa(izgara([40, 70, 380, 555], ys), [sol("No", 40, 100, 116), sol("Kontrol maddesi", 70, 100, 116), sol("Sonuc", 380, 100, 116),
    ...[1, 2, 3].flatMap((r) => [sol(String(r), 40, ys[r], ys[r + 1]), sol(r === 2 ? madde2 : `Madde ${r}`, 70, ys[r], ys[r + 1]), ...(cevap ? [sol(cevap, 380, ys[r], ys[r + 1])] : [])])]);
};

test("küçük kutu ayıklanmazsa yapışık onay kutuları U | UD | X sütunlarını böler", async () => {
  const xs = [40, 70, 300, 330, 360, 390], ys = [100, 112, 124, 136, 148];
  const s = sayfa([...izgara(xs, ys), ...[1, 2, 3].flatMap((r) => [300, 330, 360].flatMap((x) => kareC(x + 10.5, ys[r] + 1.5, 9)))], [
    sol("No", 40, 100, 112), sol("Madde", 70, 100, 112), sol("U", 300, 100, 112), sol("UD", 330, 100, 112), sol("X", 360, 100, 112),
    ...[1, 2, 3].flatMap((r) => [sol(String(r), 40, ys[r], ys[r + 1]), sol(`Madde ${r}`, 70, ys[r], ys[r + 1])]),
  ]);
  assert.equal((await gercek()).pdfIzgara([s]).bolumler[0].sutunlar.length, 5, "sağlam: 5 sütun");
  const m = await bozuk("const [yHat, dHat] = kutulariAyikla(hatlar(d.yatay), hatlar(d.dikey), d.yazilar);", "const [yHat, dHat] = [hatlar(d.yatay), hatlar(d.dikey)];");
  assert.ok(m.pdfIzgara([s]).bolumler[0].sutunlar.length > 5, "bozuk: sütunlar bölündü");
});

test("grup alt başlığı listeyi bölünce liste iki tabloya ayrılır", async () => {
  const xs = [40, 70, 400, 480], ys = [100, 116, 132, 148, 164, 180];
  const s: PdfSayfasi = { ...sayfa(izgara(xs, ys, ["d:1:1", "d:1:2"]), [sol("No", 40, 100, 116, true), sol("Kontrol maddesi", 70, 100, 116, true), sol("Sonuc", 400, 100, 116, true),
    sol("A. MEKANIK AKSAM", 40, 116, 132, true), sol("1", 40, 132, 148), sol("Fren 1", 70, 132, 148), sol("2", 40, 148, 164), sol("Fren 2", 70, 148, 164),
    sol("3", 40, 164, 180), sol("Fren 3", 70, 164, 180)]), dolgular: [{ x: 40, y: 116, g: 440, h: 16, renk: "#D9D9D9" }] };
  assert.equal((await gercek()).pdfIzgara([s]).bolumler.length, 1, "sağlam: tek liste");
  const m = await bozuk("|| (serit(k) && listeIci(k))) continue;", ") continue;");
  assert.equal(m.pdfIzgara([s]).bolumler.length, 2, "bozuk: iki tablo");
});

test("seçenek yazısı tanınmazsa '☐ Uygun ☐ Uygun Değil' sabit yazı kalır", async () => {
  const s = listeSayfasi("☐ Uygun ☐ Uygun Değil");
  assert.deepEqual(turler(await gercek(), s)[1][2], "cevap", "sağlam: cevap");
  const m = await bozuk("const l = b.durum === \"yazi\" && !b.sira && !b.secenekBasligi ? secenekYazisi(b.metin) : null;", "const l = null as string[] | null;");
  assert.equal(turler(m, s)[1][2], "yazi", "bozuk: yazı");
});

test("ölçüm çizelgesi kuralı kalkınca satırın değerleri satır etiketinin adını alır", async () => {
  const s = sayfa(izgara([40, 200, 320, 440], [100, 116, 132]), [sol("Olcum Noktasi", 40, 100, 116), sol("Kesit (mm2)", 200, 100, 116), sol("In (A)", 320, 100, 116), sol("Pano 1", 40, 116, 132)]);
  const adlar = (m: Izgara) => m.pdfIzgara([s]).bolumler[0].satirlar[1].hucreler.slice(1).map((h) => h.metin);
  assert.deepEqual(adlar(await gercek()), ["Pano 1 · Kesit", "Pano 1 · In"], "sağlam: satır · sütun");
  const m = await bozuk("        if (olcum) {", "        if (false) {");
  assert.deepEqual(adlar(m), ["Pano 1", "Pano 1"], "bozuk: aynı ad");
});

test("renkli zeminin üstündeki beyaz ince dolgu çizgi sayılmazsa tablo dağılır", async () => {
  const xs = [40, 70, 400], ys = [100, 116, 132, 148];
  const beyaz = [...ys.map((y) => ({ x: 40, y: y - 0.25, g: 360, h: 0.5, renk: "#FFFFFF" })), ...xs.map((x) => ({ x: x - 0.25, y: 100, g: 0.5, h: 48, renk: "#FFFFFF" }))];
  const s: PdfSayfasi = { ...sayfa([], [sol("No", 40, 100, 116), sol("Madde", 70, 100, 116), sol("1", 40, 116, 132), sol("Fren", 70, 116, 132), sol("2", 40, 132, 148), sol("Halat", 70, 132, 148)]),
    dolgular: [{ x: 40, y: 100, g: 360, h: 48, renk: "#DDEBF7" }, ...beyaz] };
  assert.equal((await gercek()).pdfIzgara([s]).bolumler.length, 1, "sağlam: tek tablo");
  const m = await bozuk("if (zeminUstunde(w.yatay, w.p, renkli.filter((z) => z.n < w.n)))", "if (false)");
  assert.ok(m.pdfIzgara([s]).bolumler.length > 1, "bozuk: dağıldı");
});

test("çerçeve kuralı kalkınca kenarlığa değen ayırma çizgisi kenarlığı tabloya çevirir", async () => {
  const s = sayfa([...izgara([20, 575], [20, 822]), { x1: 20, y1: 80, x2: 575, y2: 80, kalinlik: 0.5 }, ...izgara([60, 200, 340], [200, 230, 260])],
    [yazi("BASLIK", 250, 40), yazi("A", 63, 210), yazi("B", 203, 210), yazi("C", 63, 240)]);
  const say = (m: Izgara) => m.pdfIzgara([s]).bolumler.find((b) => b.satirlar.some((r) => r.hucreler.some((h) => h.metin === "A")))!.satirlar.length;
  assert.equal(say(await gercek()), 2, "sağlam: içteki tablo ayrı");
  const m = await bozuk("if ((!icY.length || !icD.length) && !ic.some(deger)) { atilan.add(a); continue; }", "void deger;");
  assert.ok(say(m) > 2, "bozuk: kenarlık tablo oldu");
});

test("sayfa numarası izden atılmazsa başlık her sayfada yeniden girer", async () => {
  const sf = (n: number) => sayfa([...izgara([40, 400, 555], [40, 60]), ...izgara([40, 80, 555], [120, 140, 160, 180])],
    [sol("FORM", 40, 40, 60, true), sol(`Sayfa ${n}/2`, 400, 40, 60), sol("No", 40, 120, 140), sol("Madde", 80, 120, 140), sol(String(n * 2 - 1), 40, 140, 160), sol("M", 80, 140, 160), sol(String(n * 2), 40, 160, 180), sol("N", 80, 160, 180)]);
  const say = (m: Izgara) => m.pdfIzgara([sf(1), sf(2)]).bolumler.filter((b) => b.ad === "FORM").length;
  assert.equal(say(await gercek()), 1, "sağlam: bir kez");
  const m = await bozuk("const m = b.t.bolgeler.map((x) => x.metin.replace(SAYFA_NO, \"#\")).join(\"|\");", "const m = b.t.bolgeler.map((x) => x.metin).join(\"|\");");
  assert.equal(say(m), 2, "bozuk: iki kez");
});

test("sürekli numara kuralı kalkınca ara yazıyla bölünen ikinci liste devam işaretini almaz", async () => {
  const lst = (y0: number, bas: number) => {
    const ys = [y0, y0 + 16, y0 + 32, y0 + 48];
    return { c: izgara([40, 70, 480], ys), y: [sol("No", 40, ys[0], ys[1]), sol("Madde", 70, ys[0], ys[1]), ...[0, 1].flatMap((i) => [sol(String(bas + i), 40, ys[i + 1], ys[i + 2]), sol(`Madde ${bas + i}`, 70, ys[i + 1], ys[i + 2])])] };
  };
  const a = lst(100, 1), b = lst(220, 3);
  const s = sayfa([...a.c, ...b.c], [...a.y, yazi("B. ELEKTRIK", 40, 190), ...b.y]);
  const devam = (m: Izgara) => m.pdfIzgara([s]).bolumler.map((x) => !!x.siraDevam);
  assert.deepEqual(devam(await gercek()), [false, true, true], "sağlam: sürer");
  const m = await bozuk("if (sonSira !== null && v.ilk === sonSira + 1)", "if (false)");
  assert.deepEqual(devam(m), [false, false, false], "bozuk: sıfırlanır");
});

test("etiketin sağındaki boş kutular birleşmezse her kutu ayrı alan olur", async () => {
  const s = sayfa(izgara([40, 150, 200, 250, 300], [300, 316]), [sol("Firma Unvani", 40, 300, 316)]);
  assert.equal(turler(await gercek(), s)[0].length, 2, "sağlam: tek değer hücresi");
  const m = await bozuk("if (x.r !== b.r || x.rs !== b.rs || x.durum !== \"bos\" || x.resim || x.secenek || baslikHucresi(x)) break;", "break;");
  assert.ok(turler(m, s)[0].length > 2, "bozuk: ayrı kutular");
});

test("tablo dışı 'Etiket: [kutu]' birleşmezse kutu boş kalır", async () => {
  const s = sayfa(izgara([200, 400], [120, 136]), [yazi("Kontrol Tarihi:", 40, 123)]);
  const k = (m: Izgara) => m.pdfIzgara([s]).bolumler.flatMap((b) => b.satirlar.flatMap((r) => r.hucreler)).some((h) => h.tur === "kayit" && h.kaynak === "bas");
  assert.ok(k(await gercek()), "sağlam: kayıt");
  const m = await bozuk("if (b.tur === \"metin\" && sonraki?.tur === \"tablo\" && etiketKutusu(b, sonraki)) {", "if (false) {");
  assert.ok(!k(m), "bozuk: kayıt yok");
});

test("madde satırında sonuç cümlesi aranınca '… uygundur' maddesi raporun sonucu olur", async () => {
  const s = listeSayfasi("", "Kanca mandali mevcut ve uygundur");
  assert.equal(turler(await gercek(), s)[2][1], "yazi", "sağlam: madde");
  const m = await bozuk("const s = b.secenekBasligi || listeSatiri(b.r) ? null : sonucAyir(b.metin);", "const s = b.secenekBasligi ? null : sonucAyir(b.metin);");
  assert.equal(turler(m, s)[2][1], "sonuc", "bozuk: sonuç");
});

test("sayfa numarası sayfa altından atılmazsa alt yazıya girer", async () => {
  const s = sayfa(izgara([40, 555], [100, 120]), [yazi("Tablo", 43, 104), { ...yazi("FR-305 Rev.02 - Sayfa 1/2", 40, 805), boy: 8 }]);
  assert.equal((await gercek()).pdfIzgara([s]).altYazi, "FR-305 Rev.02", "sağlam: numarasız");
  const m = await bozuk("altSatirlar.map((s) => sayfaNosuz(s.metin))", "altSatirlar.map((s) => s.metin)");
  assert.match(m.pdfIzgara([s]).altYazi, /Sayfa 1\/2/, "bozuk: numara alt yazıda");
});
