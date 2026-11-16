/* OLUMSUZ KANIT — tests/ekipman-yetki.test.ts (2026-11-16, Raporlar › Ekipmanlar sekmesi: yalnız teknik yönetici, kendi branşı). Kaynak diskte
   DEĞİŞTİRİLMEZ: dosya bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) branş rolden okunmazsa (her rol her branş) firma yöneticisi de ekipman siler;
   2) branş karşılaştırması kalkarsa mekanik yönetici elektrik ekipmanını yönetir;
   3) sunucu kapısı kalkarsa kaynak kilidi yakalar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/ekipman-yetki.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-ekipman-yetki-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/raporlar/ekipman-yetki.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}

test("1) branş rolden okunmazsa firma yöneticisi de ekipman yönetir", async () => {
  const m = await bozuk("const l = new Set(roller.map((r) => ROL_BRANS[r]).filter((b): b is Brans => !!b));", 'const l = new Set<Brans>(roller.length ? ["m", "e"] : []);');
  assert.deepEqual(m.yonetilenBranslar(["firma_yoneticisi"]), ["m", "e"], "bozuk: firma yöneticisi sekmeyi görür");
});

test("2) branş karşılaştırması kalkarsa mekanik yönetici elektrik ekipmanını yönetir", async () => {
  const m = await bozuk("yonetilenBranslar(roller).includes(brans)", "yonetilenBranslar(roller).length > 0");
  assert.equal(m.bransiYonetir(["mekanik_yonetici"], "e"), true, "bozuk: başka branşın ekipmanı silinir");
});

test("3) sunucu kapısı kalkarsa kaynak kilidi yakalar", () => {
  const s = readFileSync("src/modules/raporlar/server/ekipmanlar.ts", "utf8");
  for (const kilit of ["if (!ekipmanYonetir(kim)) return null;", 'if (!bransiYonetir(kim.roller, x.brans)) return { durum: "yetkisiz" };']) {
    assert.ok(s.includes(kilit), "sağlam");
    assert.ok(!s.replace(kilit, () => "").includes(kilit), `bozuk: kapı kalkar — ${kilit}`);
  }
});
