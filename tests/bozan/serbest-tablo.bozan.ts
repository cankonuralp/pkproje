/* OLUMSUZ KANIT — tests/serbest-tablo.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur, göreli içe aktarmalar mutlak yola çevrilir):
   1. Birleştirmede seçimdeki öteki hücreler silinmezse hücreler üst üste biner (tanım şemadan geçmez).
   2. Araya satır eklenince birleşik hücre büyümezse ızgarada boşluk kalır / satırı kayar.
   3. Cevap hücresi sanal maddeye dönmezse "Uygun değil" cevabı kusur listesine girmez (uygunsuzluk kaybolur — sessiz iyimserlik).
   4. Şemada üst üste binme denetimi kalkınca iki hücre aynı yere yazılabilir.
   5. Belgede çoğalan satır kopyalanmazsa sahada eklenen ikinci ölçüm satırı belgeye basılmaz.
   6. (2026-10-24) Sıra numaraları satır sırasıyla verilirse iki sütunlu listede sol 1, 3, 5 · sağ 2, 4, 6 olur (formda sol 1–3, sağ 4–6).
   7. (2026-10-24, ikinci denetim) Madde metni bitişik öteki cevabı geçmezse iki cevaplı maddenin ikinci cevabı adsız ("Madde") kalır;
      bitişik cevap dizileri birleşmezse sahada önce bütün sol cevaplar, sonra bütün sağ cevaplar gelir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { Cevaplar, FormatTanimi, type Hucre } from "../../src/format/tanim.ts";
import type { TabloBolumu } from "../../src/format/tablo.ts";

const klasor = mkdtempSync(join(tmpdir(), "serbest-tablo-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  const kok = resolve(dosya, "..");
  const kaynak = readFileSync(dosya, "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`)
    .replace(/from "react"/g, `from "${import.meta.resolve("react")}"`).replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`);
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Tablo = typeof import("../../src/format/tablo.ts");
const tablo = (eski: string, yeni: string) => bozuk<Tablo>("src/format/tablo.ts", eski, yeni);
const h = (r: number, c: number, o: Omit<Hucre, "r" | "c">): Hucre => ({ r, c, ...o });

test("birleştirmede öteki hücreler silinmezse üst üste biner, şemadan geçmez", async () => {
  const m = await tablo("hucreler: [...b.hucreler.filter((_, n) => !l.includes(n)), yeni]", "hucreler: [...b.hucreler, yeni]");
  const b = m.birlestir(m.yeniTablo("t1", "T", 2, 2), { r1: 0, c1: 0, r2: 1, c2: 1 });
  assert.equal(FormatTanimi.safeParse({ sema: 1, bolumler: [b] }).success, false, "bozuk: üst üste binen hücreler");
});

test("araya satır eklenince birleşik hücre büyümezse ızgara bozulur", async () => {
  const m = await tablo("else if (v + uz - 1 >= i) { if (R) h.rs = uz + 1; else h.cs = uz + 1; }", "");
  let b = m.birlestir(m.yeniTablo("t1", "T", 2, 2), { r1: 0, c1: 0, r2: 1, c2: 0 });
  b = m.satirEkle(b, 1);
  assert.equal(b.hucreler.find((x) => x.r === 0 && x.c === 0)!.rs, 2, "bozuk: birleşik hücre büyümedi (3 olmalıydı)");
});

test("cevap hücresi sanal maddeye dönmezse 'Uygun değil' kusur olmaz", async () => {
  /* 2026-10-24: maddeler sütun dizisi sırasıyla (diziSirasi) — bozulan satır onunla */
  const m = await tablo(`const maddeler = diziSirasi(duz.filter((h) => h.tur === "cevap" && h.id))`, `const maddeler = diziSirasi(duz.filter((h) => h.tur === "cevap" && h.id && false))`);
  const b: TabloBolumu = { id: "k", ad: "K", blok: "tablo", kilit: false, sutun: [70, 30], cevaplar: ["U", "UD"], satirlar: [{}],
    hucreler: [h(0, 0, { tur: "yazi", m: "Fren" }), h(0, 1, { tur: "cevap", id: "m1" })] };
  const t = FormatTanimi.parse({ sema: 1, bolumler: [b] });
  const s = m.sahaTanimi(t);
  assert.ok(!s.bolumler.some((x) => x.blok === "liste"), "bozuk: madde yok");
  const { degerlendir } = await import("../../src/format/motor.ts");
  /* motor gerçek tablo.ts'i kullanır; bozuk sanal tanımla değerlendirilince kusur yok */
  assert.equal(degerlendir({ ...s, bolumler: s.bolumler }, Cevaplar.parse({ madde: { m1: { c: "UD", not: "x" } } })).kusurlar.length, 0);
});

test("şemada üst üste binme denetimi kalkınca iki hücre aynı yere yazılır", async () => {
  const m = await bozuk<typeof import("../../src/format/tanim.ts")>("src/format/tanim.ts",
    `if (dolu.has(k)) { bag.addIssue({ code: "custom", path: yol, message: "Hücreler üst üste biniyor." }); return; }`, "");
  const b = { id: "k", ad: "K", blok: "tablo", kilit: false, sutun: [100], satirlar: [{}], hucreler: [h(0, 0, { tur: "yazi", m: "a" }), h(0, 0, { tur: "yazi", m: "b" })] };
  assert.equal(m.FormatTanimi.safeParse({ sema: 1, bolumler: [b] }).success, true, "bozuk: üst üste binen kabul edildi");
});

test("belgede çoğalan satır kopyalanmazsa ikinci ölçüm satırı basılmaz", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts",
    "const kez = b.satirlar.map((s) => (s.tekrar && s.id ? Math.max(1, c.tablo[s.id]?.length ?? 0) : 1));", "const kez = b.satirlar.map(() => 1);");
  const b: TabloBolumu = { id: "k", ad: "K", blok: "tablo", kilit: false, sutun: [50, 50], cevaplar: ["U", "UD"], satirlar: [{ tekrar: true, id: "olc" }],
    hucreler: [h(0, 0, { tur: "alan", id: "yuk", alan: "sayi" }), h(0, 1, { tur: "cevap", id: "ys" })] };
  const t = FormatTanimi.parse({ sema: 1, bolumler: [b], gorunum: { formKodu: "", baslik: "", dayanak: [], talimat: "", cevap: "acilir", serbest: true } });
  const html = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t, cevaplar: Cevaplar.parse({ tablo: { olc: [{ yuk: "500" }, { yuk: "600" }] } }) }) as never);
  assert.ok(html.includes(">500<") && !html.includes(">600<"), "bozuk: ikinci satır yok");
});

test("sıra numaraları satır sırasıyla verilirse iki sütunlu listede sol sütun 1, 3, 5 olur", async () => {
  const h = (r: number, c: number, o: Omit<Hucre, "r" | "c">): Hucre => ({ r, c, ...o });
  const hucreler: Hucre[] = [];
  for (let r = 0; r < 3; r++) hucreler.push(h(r, 0, { tur: "sira" }), h(r, 1, { tur: "yazi", m: "Sol" }), h(r, 2, { tur: "sira" }), h(r, 3, { tur: "yazi", m: "Sag" }));
  const t = FormatTanimi.parse({ sema: 1, bolumler: [{ id: "k", ad: "K", blok: "tablo", kilit: false, sutun: [10, 40, 10, 40], satirlar: [{}, {}, {}], hucreler }] });
  const sol = (m: Tablo) => [0, 1, 2].map((r) => m.siraNumaralari(t).get(`k:${r},0`));
  assert.deepEqual(sol(await import("../../src/format/tablo.ts")), [1, 2, 3], "sağlam: sol sütun 1–3");
  const m = await bozuk<Tablo>("src/format/tablo.ts", "for (const h of diziSirasi(b.hucreler.filter((h) => h.tur === \"sira\" && !tekrar.has(h.r))))",
    "for (const h of [...b.hucreler].sort((x, y) => x.r - y.r || x.c - y.c).filter((h) => h.tur === \"sira\" && !tekrar.has(h.r)))");
  assert.deepEqual(sol(m), [1, 3, 5], "bozuk: satır sırası");
});

test("madde metni bitişik öteki cevabı geçmezse iki cevaplı maddenin ikinci cevabı adsız kalır; diziler birleşmezse sıra sütun sütun olur", async () => {
  const m: Hucre[] = [1, 2].flatMap((r) => [h(r - 1, 0, { tur: "yazi", m: `Fren ${r}` }), h(r - 1, 1, { tur: "cevap", id: `a${r}` }), h(r - 1, 2, { tur: "cevap", id: `b${r}` })]);
  const b: TabloBolumu = { id: "m", ad: "M", blok: "tablo", kilit: false, sutun: [60, 20, 20], cevaplar: ["U", "UD"], satirlar: [{}, {}], hucreler: m };
  const gercek = await import("../../src/format/tablo.ts");
  assert.equal(gercek.maddeMetni(b, m[2]), "Fren 1", "sağlam: adıyla");
  const x = await tablo("for (let x = yeri(c); x?.tur === \"cevap\"; x = yeri(c)) c = adim < 0 ? x.c - 1 : x.c + (x.cs ?? 1);", "");
  assert.equal(x.maddeMetni(b, m[2]), "", "bozuk: adsız");
  const ids = (t: Tablo) => t.diziSirasi(m.filter((y) => y.tur === "cevap")).map((y) => y.id);
  assert.deepEqual(ids(gercek), ["a1", "b1", "a2", "b2"], "sağlam: satır satır");
  const y = await tablo("    if (g) g.push(d); else diziler.push([d]);", "    diziler.push([d]);");
  assert.deepEqual(ids(y), ["a1", "a2", "b1", "b2"], "bozuk: sütun sütun");
});
