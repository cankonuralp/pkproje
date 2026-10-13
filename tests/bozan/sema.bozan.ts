/* OLUMSUZ KANIT — ortak şema kilidi (tests/sema.test.ts) gerçekten yakalıyor mu. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/sema/ortak.ts
   bellekte bozulur, geçici klasörden içe aktarılır (zod paketi projenin node_modules'ünden çözülsün diye geçici dosya proje içinde değil, içe aktarım
   yolu mutlak yapılır). K0 (2026-10-03). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const ZOD = pathToFileURL(resolve("node_modules/zod/index.js")).href;
const KAYNAK = readFileSync("src/sema/ortak.ts", "utf8").replace('from "zod"', `from "${ZOD}"`);
const klasor = mkdtempSync(join(tmpdir(), "sema-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

type Modul = typeof import("../../src/sema/ortak.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `ortak-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}

test("parola: rakam şartı kalkınca yalnız harfli parola geçer", async () => {
  const m = await bozuk("&& /\\d/.test(p)", "");
  assert.equal(m.parola.safeParse("yalnizharfler").success, true);
});

test("ekipman kodu: tire kuralı gevşeyince tireyle biten kod geçer", async () => {
  const m = await bozuk("/^[A-ZÇĞİÖŞÜ0-9](?:[A-ZÇĞİÖŞÜ0-9]|-(?=[A-ZÇĞİÖŞÜ0-9])){2,19}$/", "/^[A-ZÇĞİÖŞÜ0-9-]{3,20}$/");
  assert.equal(m.ekipmanKodu.safeParse("KP10-").success, true);
});

/* 2026-10-14: Türkçe harf kuralının olumsuz kanıtı — büyütme yerele bağlanınca (toLocaleUpperCase "tr") "ki-10" İ'li koda döner (anayasa 5.5) */
test("ekipman kodu: büyütme Türkçe yerele bağlanınca i → İ olur", async () => {
  const m = await bozuk('export const ekipmanKodu = z.preprocess((s) => (typeof s === "string" ? s.trim().toUpperCase() : s),',
    'export const ekipmanKodu = z.preprocess((s) => (typeof s === "string" ? s.trim().toLocaleUpperCase("tr") : s),');
  assert.equal(m.ekipmanKodu.parse("ki-10"), "Kİ-10", "bozuk: i → İ");
});

test("tutar: kuruş yerine lira tutulunca 1.234,56 → 123456 olmaz", async () => {
  const m = await bozuk("const toplam = lira * 100 + kurus;", "const toplam = lira + kurus / 100;");
  const r = m.tutar.safeParse("1.234,56");
  assert.ok(!(r.success && r.data === 123456));
});
