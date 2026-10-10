/* OLUMSUZ KANIT — tests/format-fark.test.ts neyi koruyor (471 sürüm farkı). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): fark.ts bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. Öğeler kimlik yerine adla eşlenince adı değişen madde "çıkarıldı + eklendi" görünür ("ad değişti" satırı kaybolur).
   2. Çıkarılan bölümün öğeleri süzülmeyince bölüm silmek her maddesini ayrıca "çıkarıldı" diye sayar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { bolumSil, ogeYaz } from "../../src/modules/rapor-format/kurucu.ts";

type Modul = typeof import("../../src/modules/rapor-format/fark.ts");
const KOK = resolve("src/modules/rapor-format");
const KAYNAK = readFileSync(join(KOK, "fark.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "format-fark-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `f-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
after(() => rmSync(klasor, { recursive: true, force: true }));

const zpkr02 = () => structuredClone(SABLONLAR.ZPKR02.tanim);

test("öğeler adla eşlenince adı değişen madde çıkarıldı + eklendi görünür (kilidin koruduğu açık)", async () => {
  const m = await bozuk("m.set(id, {", "m.set(ad, {");
  const t0 = zpkr02();
  const i = t0.bolumler.findIndex((b) => b.blok === "liste");
  const b = t0.bolumler[i];
  assert.ok(b.blok === "liste");
  const ilk = b.gruplar[0].maddeler[0];
  const l = m.surumFarki(t0, ogeYaz(t0, i, ilk.id, { ad: "Değişen madde" })).map((x) => x.metin);
  assert.ok(!l.includes(`Madde (${b.ad}): “${ilk.metin}” → “Değişen madde”`), "bozuk: ad değişti satırı yok");
  assert.ok(l.includes(`Madde eklendi (${b.ad}): “Değişen madde”`));
});

test("çıkarılan bölümün öğeleri süzülmeyince her madde ayrıca sayılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk(" && simdiB.has(o.bolumId)", "");
  const t0 = zpkr02();
  const i = t0.bolumler.findIndex((b) => b.blok === "liste");
  const l = m.surumFarki(t0, bolumSil(t0, i)).filter((x) => x.tur === "cikar");
  assert.ok(l.length > 1, "bozuk: bölümün maddeleri de çıkarıldı sayıldı");
});
