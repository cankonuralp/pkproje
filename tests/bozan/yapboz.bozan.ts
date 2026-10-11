/* OLUMSUZ KANIT — tests/yapboz.test.ts (494) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden içe
   aktarılır (göreli içe aktarmalar asıl dosyalara çevrilir).
   · Kopyada Bakanlık işareti kalsaydı firmanın kopyası Bakanlık öğesi sayılır, yayında "Bakanlık formatından ayrılan" uyarıları karışırdı.
   · Taşımada yer düzeltmesi olmasaydı aşağı sürüklenen bölüm bir yer fazla kayardı (bırakılan yerin bir altına düşer).
   · Kopyada madde kimlikleri yenilenmeseydi iki bölüm aynı madde kimliğini taşır — raporda iki maddenin cevabı birbirine yazılırdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi } from "../../src/format/tanim.ts";

const gecici = mkdtempSync(join(tmpdir(), "yapboz-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
type Yapboz = typeof import("../../src/modules/rapor-format/yapboz.ts");
const YOL = { "../../format/tanim.ts": "src/format/tanim.ts", "./kurucu.ts": "src/modules/rapor-format/kurucu.ts", "./ui/ortak.ts": "src/modules/rapor-format/ui/ortak.ts" };

async function bozuk(ad: string, eski: string, yeni: string): Promise<Yapboz> {
  let s = readFileSync(resolve("src/modules/rapor-format/yapboz.ts"), "utf8");
  assert.ok(s.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  s = s.replace(eski, () => yeni);
  for (const [goreli, gercek] of Object.entries(YOL)) s = s.replaceAll(`"${goreli}"`, JSON.stringify(pathToFileURL(resolve(gercek)).href));
  const yol = join(gecici, `${ad}.ts`);
  writeFileSync(yol, s);
  return import(pathToFileURL(yol).href) as Promise<Yapboz>;
}
const Z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const T = FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);

test("1. kopyada Bakanlık işareti kalınca firmanın kopyası Bakanlık bölümü sayılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("kilit", "const kopya = Bolum.parse({ ...k, id: yeni(\"b\"), ad, kilit: false });", "const kopya = Bolum.parse({ ...k, id: yeni(\"b\"), ad });");
  const li = Z.bolumler.findIndex((b) => b.blok === "olcum" && b.kilit);
  assert.equal(m.bolumKopyala(Z, li)!.t.bolumler[li + 1].kilit, true, "bozuk: kopya Bakanlık işaretli");
});

test("2. taşımada yer düzeltmesi olmayınca aşağı sürüklenen bölüm bir yer fazla kayar (kilidin koruduğu açık)", async () => {
  const m = await bozuk("tasi", "  if (j > i) j--;\n", "");
  const once = T.bolumler.map((b) => b.id), id = once[1];
  const sonra = m.bolumuTasi(T, id, 4).bolumler.map((b) => b.id);
  assert.notDeepEqual(sonra, [once[0], once[2], once[3], id, ...once.slice(4)], "bozuk: bölüm bırakılan yerin altına düştü");
});

test("3. kopyada madde kimlikleri yenilenmeyince iki bölüm aynı maddeyi taşır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("madde", "maddeler: g.maddeler.map((m) => ({ ...m, id: yeni(\"m\"), kilit: false }))", "maddeler: g.maddeler.map((m) => ({ ...m, kilit: false }))");
  const ki = Z.bolumler.findIndex((b) => b.blok === "liste");
  const x = m.bolumKopyala(Z, ki);
  /* aynı kimlik iki kez: şema reddeder (Bolum.parse tek bölümü denetler, tanım bütününü değil) → bozuk kopya tanımda geçersiz */
  assert.ok(x, "bozuk kopya üretildi");
  assert.equal(FormatTanimi.safeParse(x!.t).success, false, "bozuk: madde kimliği iki kez");
});
