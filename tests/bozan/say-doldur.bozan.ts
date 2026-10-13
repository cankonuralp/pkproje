/* OLUMSUZ KANIT — tests/say-doldur.test.ts (542, S.A.Y rapora girer) neyi koruyor (kaynak diskte değiştirilmez; say-doldur.ts ve istek.ts bellekte
   bozulur, göreli içe aktarmalar mutlak yola çevrilir):
   1. K2 dolu alan denetimi kalkınca S.A.Y kişinin yazdığı değerin üstüne yazar.
   2. Geri al şimdiki değere bakmazsa kişinin S.A.Y'dan sonra değiştirdiği değer silinir.
   3. Maddelerde cevaplanmış madde atlanmazsa "Uygun değil" maddeler "Uygun" olur.
   4. Komut tanımada soru denetimi kalkınca "fotoğrafı okuyabilir misin?" sorusu yapay zekâya gitmez, okuma başlar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { Cevaplar, FormatTanimi } from "../../src/format/tanim.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";

const klasor = mkdtempSync(join(tmpdir(), "say-doldur-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
const DOLDUR = kaynak("src/modules/raporlar/say-doldur.ts"), ISTEK = kaynak("src/modules/say/istek.ts");
let sira = 0;
async function bozuk<T>(k: string, eski: string, yeni: string): Promise<T> {
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `m-${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Doldur = typeof import("../../src/modules/raporlar/say-doldur.ts");
const bos = () => ({ ekipman: { marka: "", model: "Elle Model" }, cevaplar: Cevaplar.parse({}) });

test("K2: dolu alan denetimi kalkınca kişinin değeri ezilir", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "if (!bos(onceki) && !ustune) { dolu.push", "if (false) { dolu.push");
  const u = m.alanlariUygula(bos(), "ekipman", [{ alan: "model", deger: "DM-100", guven: "yuksek" }], new Set(["model"]));
  assert.equal(u.durum.ekipman.model, "DM-100", "bozuk: üstüne yazdı");
});

test("geri al şimdiki değere bakmazsa kişinin sonradan yazdığı silinir", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "if (oku(durum, g.yer) !== g.yeni) continue;", "");
  const u = m.alanlariUygula(bos(), "ekipman", [{ alan: "marka", deger: "M", guven: "yuksek" }], new Set(["marka"]));
  const g = m.geriAl({ ...u.durum, ekipman: { ...u.durum.ekipman, marka: "Elle" } }, u.geri);
  assert.equal(g.durum.ekipman.marka, "", "bozuk: kişinin değeri silindi");
});

test("maddelerde cevaplanmış madde atlanmazsa \"Uygun değil\" madde \"Uygun\" olur", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "      if (onceki) continue;\n      durum = yaz(durum, yer, b.cevaplar[0]);", "      durum = yaz(durum, yer, b.cevaplar[0]);");
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const liste = t.bolumler.find((b) => b.blok === "liste")!;
  if (liste.blok !== "liste") throw new Error("liste yok");
  const m1 = liste.gruplar[0].maddeler[0];
  const u = m.maddeleriIsaretle({ ...bos(), cevaplar: { ...Cevaplar.parse({}), madde: { [m1.id]: { c: liste.cevaplar[1] } } } }, t);
  assert.equal(u.durum.cevaplar.madde[m1.id].c, liste.cevaplar[0], "bozuk: olumsuz cevap değişti");
});

test("komut tanımada soru denetimi kalkınca soru okuma başlatır", async () => {
  const m = await bozuk<typeof import("../../src/modules/say/istek.ts")>(ISTEK,
    `if (!m || m.length > 120 || metin.includes("?") || /(^| )(mi|mı|mu|mü|misin|mısın)( |$)|nasıl|neden|nedir|niye/.test(m)) return null;`, "if (!m) return null;");
  assert.equal(m.istekTani("fotoğrafı okuyabilir misin?"), "oku", "bozuk: soru komut sayıldı");
});
