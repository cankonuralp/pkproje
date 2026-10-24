/* OLUMSUZ KANIT — tests/serbest-tablo.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur, göreli içe aktarmalar mutlak yola çevrilir):
   1. Birleştirmede seçimdeki öteki hücreler silinmezse hücreler üst üste biner (tanım şemadan geçmez).
   2. Araya satır eklenince birleşik hücre büyümezse ızgarada boşluk kalır / satırı kayar.
   3. Cevap hücresi sanal maddeye dönmezse "Uygun değil" cevabı kusur listesine girmez (uygunsuzluk kaybolur — sessiz iyimserlik).
   4. Şemada üst üste binme denetimi kalkınca iki hücre aynı yere yazılabilir.
   5. Belgede çoğalan satır kopyalanmazsa sahada eklenen ikinci ölçüm satırı belgeye basılmaz. */
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
  const m = await tablo(`const maddeler = duz.filter((h) => h.tur === "cevap" && h.id)`, `const maddeler = duz.filter((h) => h.tur === "cevap" && h.id && false)`);
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
