/* OLUMSUZ KANIT — tests/say-rapor-modu.test.ts: (1) satır kaydırılırsa marka seri alanına yazılır; (2) tire değer sayılırsa "-" rapora girer; (3) fazla satır atılırsa uzmanın notu kaybolur;
   (4) başkasının raporu seçilebilirse kayıt yanlış rapora gider. Kaynak bellekte bozulur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const gecici = mkdtempSync(join(tmpdir(), "say-rapor-modu-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
type R = typeof import("../../src/modules/say-chat/rapor-modu.ts");
let sira = 0;
const yolu = (a: string) => pathToFileURL(resolve(a)).href;
async function bozuk(eski: string, yeni: string): Promise<R> {
  const k = readFileSync(resolve("src/modules/say-chat/rapor-modu.ts"), "utf8");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(gecici, `${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni).replace('"zod"', () => `"${import.meta.resolve("zod")}"`).replace('"../raporlar/sema.ts"', () => `"${yolu("src/modules/raporlar/sema.ts")}"`).replace('"../../format/duzen.ts"', () => `"${yolu("src/format/duzen.ts")}"`).replace('"../../format/tanim.ts"', () => `"${yolu("src/format/tanim.ts")}"`).replace('"../../sema/ortak.ts"', () => `"${yolu("src/sema/ortak.ts")}"`));
  return import(pathToFileURL(y).href) as Promise<R>;
}
const S = [{ ad: "Marka", alan: "e:marka" }, { ad: "Seri", alan: "e:seri" }];

test("satır kaydırılırsa marka seri alanına yazılır", async () => {
  const m = await bozuk('const h = temiz(mesaj[i] ?? "")', 'const h = temiz(mesaj[i + 1] ?? "")');
  assert.equal(m.dagit(S, ["Örnek", "12"]).degerler["e:marka"], "12", "bozuk: yanlış satır");
});
test("tire değer sayılırsa rapora girer", async () => {
  const m = await bozuk("const bilinmiyor = (x: string) => !x || /^[-–—]+$/.test(x);", "const bilinmiyor = (x: string) => !x;");
  assert.equal(m.dagit(S, ["-"]).degerler["e:marka"], "-", "bozuk: tire yazıldı");
});
test("fazla satır atılırsa not kaybolur", async () => {
  const m = await bozuk("if (fazla.length) degerler.yorum", "if (false) degerler.yorum");
  assert.equal(m.dagit(S, ["a", "b", "not"]).degerler.yorum, undefined, "bozuk: not kayboldu");
});
test("başkasının raporu seçilebilirse kayıt yanlış rapora gider", async () => {
  const m = await bozuk('if (r) return { durum: "kapali", neden: r.durum === "taslak" ? "Başka birinin raporu var" : "Raporu yazılmış" };', "");
  assert.equal(m.ekipmanDurumu({ id: "a", pasif: false }, [{ ekipmanId: "a", durum: "taslak", benimTaslak: false }], true).durum, "uygun", "bozuk: seçilebildi");
});
