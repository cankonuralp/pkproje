/* OLUMSUZ KANIT — tests/e2e-hazirlik.test.ts (468) neyi koruyor (kaynak diskte değiştirilmez; e2e/rotalar.ts bellekte bozulur):
   1. Rota grubu adresten düşmezse "(uygulama)" adrese girer — hazırlık var olmayan adresi ister, sayfa derlenmez.
   2. Tanımsız parametre denetimi kalkınca "[bilinmez]" sessizce atlanmaz, yanlış adres olur — hazırlık durmaz.
   3. Denetim nesnenin kendi adını ayırmazsa ("in") [constructor] parametresi tanımlı sayılır. */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

type Modul = typeof import("../../e2e/rotalar.ts");
const KAYNAK = readFileSync("e2e/rotalar.ts", "utf8");
const klasor = mkdtempSync(join(tmpdir(), "e2e-hazirlik-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `rotalar-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const parametreli = (ad: string) => {
  const kok = mkdtempSync(join(klasor, "kok-"));
  mkdirSync(join(kok, "(uygulama)", "deneme", `[${ad}]`), { recursive: true });
  writeFileSync(join(kok, "(uygulama)", "deneme", `[${ad}]`, "page.tsx"), "");
  return kok;
};

test("rota grubu adresten düşmezse adreste '(' kalır", async () => {
  const m = await bozuk("grup ? yol : [...yol, p ? PARAMETRE[p[1]] : g.name]", "[...yol, p ? PARAMETRE[p[1]] : g.name]");
  assert.ok(m.uygulamaRotalari().some((y) => y.includes("(uygulama)")), "bozuk: grup adresin içinde");
});

test("parametre denetimi kalkınca tanımsız parametre hazırlığı durdurmaz", async () => {
  const m = await bozuk("if (p && !Object.hasOwn(PARAMETRE, p[1])) throw new Error(", "if (false) throw new Error(");
  assert.doesNotThrow(() => m.uygulamaRotalari(parametreli("bilinmez")), "bozuk: hata yok");
});

test("denetim 'in' ile yapılınca [constructor] tanımlı sayılır", async () => {
  const m = await bozuk("!Object.hasOwn(PARAMETRE, p[1])", "!(p[1] in PARAMETRE)");
  assert.doesNotThrow(() => m.uygulamaRotalari(parametreli("constructor")), "bozuk: constructor geçti");
});
