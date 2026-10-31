/* OLUMSUZ KANIT — tests/say-doldur.test.ts (542, S.A.Y rapora girer) neyi koruyor (kaynak diskte değiştirilmez; say-doldur.ts ve istek.ts bellekte
   bozulur, göreli içe aktarmalar mutlak yola çevrilir):
   1. K2 dolu alan denetimi kalkınca S.A.Y kişinin yazdığı değerin üstüne yazar.
   2. Geri al şimdiki değere bakmazsa kişinin S.A.Y'dan sonra değiştirdiği değer silinir.
   3. Maddelerde cevaplanmış madde atlanmazsa "Uygun değil" maddeler "Uygun" olur.
   4. Komut tanımada soru denetimi kalkınca "fotoğrafı okuyabilir misin?" sorusu yapay zekâya gitmez, okuma başlar.
   5–6. (550) rapora_yaz: tür denetimi kalkınca türüne uymayan değer, seçenek denetimi kalkınca listede olmayan madde cevabı yazılır.
   7–8. (557) künye kilidi kalkınca kilitli SGK S.A.Y ile değişir; yazdıktan sonra geri okuma (teyit) kalkınca yazılamayan "yazıldı" sayılır. */
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

/* 550: Haiku'nun rapora_yaz girişleri */
test("rapora_yaz tür denetimi kalkınca yıl alanına \"19x9\" yazılır", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "      const r = kutu.denetle(ham);", "      const r = { v: ham };");
  const u = m.komutlariUygula(bos(), FormatTanimi.parse(SABLONLAR.ZPKR02.tanim), [{ yer: "e:imal", deger: "19x9" }]);
  assert.equal(u.durum.ekipman.imal, "19x9", "bozuk: türüne uymayan değer yazıldı");
});

/* 2026-10-31 V21 madde 11 (reisim: "Sunucu, metin alanlarında soru işaretiyle biten değeri kabul etmez") */
test("rapora_yaz soru işareti denetimi kalkınca şüpheli okuma alana soru işaretiyle yazılır", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "if (SORU_ISARETLI.test(ham)) { red(SORU_ISARETI_NEDENI, kutular.get(yer)?.ad); continue; }", "");
  const u = m.komutlariUygula(bos(), FormatTanimi.parse(SABLONLAR.ZPKR02.tanim), [{ yer: "e:seri", deger: "EETP220526?" }]);
  assert.equal(u.durum.ekipman.seri, "EETP220526?", "bozuk: soru işaretli değer yazıldı");
});

test("rapora_yaz madde seçenek denetimi kalkınca listede olmayan cevap yazılır", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "const cv = temizle(ham) ? md.cevaplar.find((x) => kucukTr(x) === kucukTr(ham)) : \"\";", "const cv = ham;");
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const liste = t.bolumler.find((b) => b.blok === "liste");
  if (!liste || liste.blok !== "liste") throw new Error("liste yok");
  const u = m.komutlariUygula(bos(), t, [{ yer: `m:${liste.gruplar[0].maddeler[0].id}`, deger: "Belki" }]);
  assert.equal(u.durum.cevaplar.madde[liste.gruplar[0].maddeler[0].id]?.c, "Belki", "bozuk: seçeneklerde olmayan cevap");
});

/* 557: künye kilidi ve teyit */
test("künye kilidi kalkınca kilitli SGK S.A.Y ile değişir", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "      if (ek.kunyeKilit?.has(a)) return { neden: \"bu formatta kilitli; elle de değiştirilemiyor\" };", "");
  const u = m.komutlariUygula(bos(), FormatTanimi.parse(SABLONLAR.ZPKR02.tanim), [{ yer: "k:sgk", deger: "123" }], { kunyeKilit: new Set(["sgk"] as const) });
  assert.equal(u.durum.cevaplar.kunye.sgk, "123", "bozuk: kilitli künye değişti");
});

test("yazdıktan sonra geri okuma kalkınca yazılamayan giriş \"yazıldı\" sayılır", async () => {
  /* yazıcı bozulur (yorum yazılmaz): teyit varken "yazılamadı", teyit de kalkınca "yazıldı" (yanlış) */
  const YAZ_BOZUK = DOLDUR.replace('if (y.tur === "yorum") return { ...d, cevaplar: { ...d.cevaplar, yorum: x } };', 'if (y.tur === "yorum") return d;');
  assert.notEqual(YAZ_BOZUK, DOLDUR, "yazıcı satırı kaynakta yok");
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const tek = await bozuk<Doldur>(YAZ_BOZUK, "export function komutlariUygula(", "export function komutlariUygula(");
  assert.equal(tek.komutlariUygula(bos(), t, [{ yer: "yorum", deger: "x" }]).sonuclar[0]?.durum, "yazilamadi", "teyit yazılamayanı yakalar");
  const m = await bozuk<Doldur>(YAZ_BOZUK, "    if (oku(durum, yer) !== x) { sonuclar.push({ yer: k, ad, durum: \"yazilamadi\", neden: \"yazıldıktan sonra okunan değer farklı\" }); return; }", "");
  assert.equal(m.komutlariUygula(bos(), t, [{ yer: "yorum", deger: "x" }]).sonuclar[0]?.durum, "yazildi", "bozuk: yazılamayan yazıldı sayıldı");
});
