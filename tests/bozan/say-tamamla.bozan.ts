/* OLUMSUZ KANIT — tests/say-tamamla.test.ts neyi koruyor (2026-10-31, L1). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): tamamla.ts bellekte bozulup geçici
   klasörden içe aktarılır. 1. Tür denetimi kalkarsa yıl / sayı alanına "-" yazılır. 2. Dolu alan denetimi kalkarsa kullanıcının yazdığı ezilir.
   3. Zimmet önceliği kalkarsa başkasının elindeki depodaki cihaz zimmettekinin önüne geçer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { grupFormati } from "../../src/format/sablonlar.ts";
import { Cevaplar } from "../../src/format/tanim.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-tamamla-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type M = typeof import("../../src/modules/raporlar/tamamla.ts");
async function bozuk(eski: string, yeni: string): Promise<M> {
  const dosya = "src/modules/raporlar/tamamla.ts", kaynak = readFileSync(resolve(dosya), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}.ts`), kok = dirname(resolve(dosya));
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
const t = grupFormati({ ad: "Deneme", grup: "kaldirma" });
const g = (ekipman: Record<string, string> = {}) => ({ tanim: t, durum: { ekipman, cevaplar: Cevaplar.parse({}), tarih: { bas: "2026-10-31T09:00", bit: "" } },
  verilen: new Set<string>(), gun: "2026-10-31", saat: null, cihazlar: [] });

test("1. tür denetimi kalkınca kilit düşer", async () => {
  const m = await bozuk(`if (a.tur !== "metin" || verilen.has(yer)`, `if (verilen.has(yer)`);
  assert.equal(m.raporTamamla(g()).girisler.find((x) => x.yer === "e:imal")?.deger, "-");
});
test("2. dolu alan denetimi kalkınca kilit düşer", async () => {
  const m = await bozuk(`|| !bosMu(alanDegeri(a.id))) continue;`, `) continue;`);
  assert.equal(m.raporTamamla(g({ marka: "Deneme Marka" })).girisler.find((x) => x.yer === "e:marka")?.deger, "-");
});
test("3. zimmet önceliği kalkınca kilit düşer", async () => {
  const m = await bozuk(`if (zimmet.length) return { aday: zimmet[0]!, neden: "zimmet" };`, ``);
  assert.notEqual(m.cihazSec([{ id: "A", kod: "A", zimmette: false, sonKullanim: "2026-10-01", bitis: "2027-01-01" },
    { id: "B", kod: "B", zimmette: true, sonKullanim: null, bitis: "2026-12-01" }])?.neden, "zimmet");
});
