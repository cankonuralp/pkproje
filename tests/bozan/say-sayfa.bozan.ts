/* OLUMSUZ KANIT — tests/say-sayfa.test.ts neyi koruyor (2026-10-31, K2 + M4). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): islem.ts bellekte bozulup
   geçici klasörden içe aktarılır. 1. Uzun rakam dizisi süzülmezse T.C. kimlik / telefon numarası sayfa notuyla yapay zekâya gider. 2. Okuma düşünce
   kayıt noktasına dönülmezse sorunun veritabanı işlemi bozulur (S.A.Y'a ileti gitmez). 3. Sayfa tanımı kalkarsa o sayfada S.A.Y açık kaydı bilmez. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { z } from "zod";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-sayfa-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type IslemM = typeof import("../../src/server/yz/islem.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<IslemM> {
  const kaynak = readFileSync(resolve("src/server/yz/islem.ts"), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-islem.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replaceAll('from "../../sema/', `from "${pathToFileURL(resolve("src/sema")).href}/`)
    .replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`));
  return import(pathToFileURL(yol).href) as Promise<IslemM>;
}
const ID = "0f2a3d00-1fa3-47a0-8f5e-4e5f6c000001";

test("1. uzun rakam dizisi süzülmeyince kilit düşer", async () => {
  const m = await bozuk("!/\\d{10,}/.test(s.replace(/[\\s-]/g, \"\"))", "true");
  assert.ok(m.sayfaOzeti({ kod: "12345678901" }).length === 1);
});
test("2. okuma düşünce kayıt noktasına dönülmeyince kilit düşer", async () => {
  const m = await bozuk('await b.db.sorgu("ROLLBACK TO SAVEPOINT acik_kayit"); return null;', "return null;");
  const l: string[] = [];
  const t = { ad: "plan_getir", modul: 13, tarif: "", tur: "oku", girdi: z.object({ plan: z.string() }), kaynak: [], islev: () => 0, calistir: async () => { throw new Error("x"); } };
  await m.acikKayit([t as never], [{ desen: /^\/planlar\/([0-9a-f-]{36})$/, tur: "Plan", islem: "plan_getir", girdi: (id: string) => ({ plan: id }) }],
    { db: { sorgu: async (s: string) => { l.push(s); return { rows: [] }; } } } as never, `/planlar/${ID}`);
  assert.ok(!l.includes("ROLLBACK TO SAVEPOINT acik_kayit"));
});
test("3. sayfa tanımı kalkınca kilit düşer", () => {
  const s = readFileSync(resolve("src/modules/personel/say-islemleri.ts"), "utf8");
  const bozukKaynak = s.replace(/export const SAY_SAYFALARI[\s\S]*$/, "export const SAY_SAYFALARI = [];\n");
  assert.ok(!/\/\^\\\/personel\\\//.test(bozukKaynak), "bozuk: personel sayfası tanımsız — say-sayfa.test.ts rota denetimi bunu yakalar");
  assert.ok(/\/\^\\\/personel\\\//.test(s), "özgün kaynakta personel sayfası tanımlı");
});
