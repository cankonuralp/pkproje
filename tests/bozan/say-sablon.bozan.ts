/* OLUMSUZ KANIT — tests/say-sablon.test.ts neyi koruyor (2026-10-31, kalem 8). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): sablonlar.ts bellekte bozulup geçici
   klasörden içe aktarılır. 1. Rol süzgeci kalkarsa kişisel belgeli öneri (özlük, bordro) denetçiye de görünür. 2. Son kullanılan öne alınmazsa kişinin sık
   işi listenin dibinde kalır. 3. "Önce sun" şablon notuna girmezse S.A.Y envanteri göstermeden işe başlar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-sablon-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Sablon = typeof import("../../src/modules/say/sablonlar.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Sablon> {
  const kaynak = readFileSync(resolve("src/modules/say/sablonlar.ts"), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-sablonlar.ts`);
  /* 2026-10-31 V21: sablonlar.ts artık göreli içe aktarıyor (bitis-denetimi, is-siniri) — geçici kopyada mutlak yola */
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "(\.\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve("src/modules/say", y)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<Sablon>;
}
const ID = "0f2a3d00-1fa3-47a0-8f5e-4e5f6c000001";

test("1. rol süzgeci kalkınca kilit düşer", async () => {
  const m = await bozuk(" && (!s.roller || s.roller.some((r) => roller.includes(r)))", "");
  assert.ok(m.sayfaOnerileri("/personel", ["denetci"]).length > 0);
});
test("2. son kullanılan öne alınmayınca kilit düşer", async () => {
  const m = await bozuk("return [...l].sort((a, b) => sira(a) - sira(b) || l.indexOf(a) - l.indexOf(b));", "void sira; return [...l];");
  assert.notEqual(m.sayfaOnerileri(`/planlar/${ID}`, ["denetci"], ["S8"])[0]!.id, "S8");
});
test("3. önce sun nota girmeyince kilit düşer", async () => {
  const m = await bozuk('önce sun: ${once ? "evet', 'önce sun: ${false ? "evet');
  assert.match(m.sablonNotu(m.SABLONLAR.find((s) => s.id === "S1")!, { onceSun: true }), /önce sun: hayır/);
});
