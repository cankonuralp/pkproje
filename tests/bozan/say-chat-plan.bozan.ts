/* OLUMSUZ KANIT — tests/say-chat-plan.test.ts: en yakın plan seçilmezse bant ilk planda kalır; kişinin seçimi yok sayılırsa "yukarıdan plan değiştir" çalışmaz. Kaynak bellekte bozulur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const gecici = mkdtempSync(join(tmpdir(), "say-chat-plan-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
type B = typeof import("../../src/modules/say-chat/plan.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<B> {
  const kaynak = readFileSync(resolve("src/modules/say-chat/plan.ts"), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `${sira++}.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<B>;
}
const p = (id: string, baslangic: string, bitis = baslangic) => ({ id, no: id, tesis: "t", baslangic, bitis, kalan: 1 });

test("en yakın plan seçilmezse bant ilk planda kalır", async () => {
  const m = await bozuk("if (a < c || (a === c && p.baslangic > en.baslangic && p.baslangic <= bugun)) en = p;", "");
  assert.equal(m.bantPlani([p("uzak", "2026-01-01"), p("bugun", "2026-11-08")], "2026-11-08", null)?.id, "uzak", "bozuk: ilk plan kaldı");
});
test("seçim yok sayılırsa kişi planı değiştiremez", async () => {
  const m = await bozuk("if (s) return s;", "");
  assert.equal(m.bantPlani([p("bugun", "2026-11-08"), p("eski", "2026-10-01")], "2026-11-08", "eski")?.id, "bugun", "bozuk: seçim yok sayıldı");
});
