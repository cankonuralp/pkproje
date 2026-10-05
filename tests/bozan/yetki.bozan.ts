/* OLUMSUZ KANIT — yetki kilidi (tests/yetki.test.ts) gerçekten yakalıyor mu. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): canDo.ts bellekte
   bozulur, geçici klasörden içe aktarılır (tanim.ts mutlak yolla bağlanır). Her bozma, testin denediği saldırıyı geçirir. K1 (2026-10-04). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const TANIM = pathToFileURL(resolve("src/server/yetki/tanim.ts")).href;
const KAYNAK = readFileSync("src/server/yetki/canDo.ts", "utf8").replace('from "./tanim.ts"', `from "${TANIM}"`);
const klasor = mkdtempSync(join(tmpdir(), "yetki-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

type Modul = typeof import("../../src/server/yetki/canDo.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `canDo-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}
const kisi = (id: string, ...roller: string[]) => ({ id, roller }) as never;

test("bozuk firma matrisi denetimi kalkınca 'admin' değeri muhasebeyi açar", async () => {
  const m = await bozuk('(typeof d === "string" && (DUZEYLER as readonly string[]).includes(d) ? (d as Duzey) : "yok")', '(d === "admin" ? "yaz" : (d as Duzey) ?? "yok")');
  assert.equal(m.canDo(kisi("p", "planlama"), 18, "gor", undefined, { 18: ["admin"] } as never), true);
});

test("sabit satırlar kalkınca firma yöneticisi kendini Personel'den kilitler", async () => {
  const m = await bozuk("if (sabit) return sabit;", "void sabit;");
  assert.equal(m.canDo(kisi("y", "firma_yoneticisi"), 2, "degistir", undefined, { 2: ["gor", "kendi", "gor", "gor", "yok", "yok"] } as never), false);
});

/* 2026-10-05 (314): dört göz kalktı (reisim kararı); yerine branş kilidi — branş denetimi kalkınca öteki branşın yöneticisi onaylar */
test("branş denetimi kalkınca elektrik yöneticisi mekanik raporu onaylar", async () => {
  const m = await bozuk("!!k?.brans && (branslari(h).includes(k.brans) || (!!k.vekil && branslari(h).length > 0))", "!!k?.brans && branslari(h).length > 0");
  assert.equal(m.canDoEylem(kisi("e1", "elektrik_yonetici"), "rapor_onayla", { sahip: "d1", brans: "m" }), true);
});
