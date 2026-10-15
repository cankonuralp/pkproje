/* OLUMSUZ KANIT — tests/say-rapor-haritasi.test.ts'in 561 kilidi (S.A.Y açık raporu bilir, yazamıyorsa nedenini söyler) neyi koruyor. Kaynak diskte
   DEĞİŞTİRİLMEZ (anayasa 13.11): sema.ts ve rapor-haritasi.ts bellekte bozulur, göreli içe aktarmalar mutlak yola çevrilir. O zaman:
   1. durum denetimi kalkınca teknik yönetici onayındaki rapor yazana "yazılabilir" sayılır (S.A.Y elle değiştirilemeyen rapora yazmaya kalkar);
   2. onay ekranının adresi tanınmazsa yönetici onay ekranındayken S.A.Y "açık rapor yok" der (reisim'in 2026-10-15 şikâyeti);
   3. bağlamdan neden kalkınca S.A.Y raporu görür ama neden yazamadığını söyleyemez. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "say-acik-rapor-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
let sira = 0;
async function bozuk<T>(yol: string, eski: string, yeni: string): Promise<T> {
  const k = kaynak(yol);
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<T>;
}
type Sema = typeof import("../../src/modules/raporlar/sema.ts");
type Harita = typeof import("../../src/modules/say/rapor-haritasi.ts");
const ID = "0f1e2d3c-4b5a-4c69-8d7e-9fa0b1c2d3e4";

test("1. durum denetimi kalkınca onaydaki rapor yazılabilir sayılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Sema>("src/modules/raporlar/sema.ts", '  if (durum !== "taslak") return YAZILAMAZ_NEDEN[durum];\n', "");
  assert.equal(m.raporYazmaNedeni("onayda", true, true), null, "bozuk: onaydaki rapor yazılabilir");
});

test("2. onay ekranının adresi tanınmazsa açık rapor bulunmaz (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Harita>("src/modules/say/rapor-haritasi.ts", "/^\\/(?:raporlar|onaylar)\\/(", "/^\\/(?:raporlar)\\/(");
  assert.equal(m.yoldakiRapor(`/raporlar/${ID}`), ID, "saha raporu yine bulunur");
  assert.equal(m.yoldakiRapor(`/onaylar/${ID}`), null, "bozuk: onay ekranında rapor yok");
});

test("3. bağlamdan neden kalkınca S.A.Y yazamadığının nedenini bilmez (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Harita>("src/modules/say/rapor-haritasi.ts",
    '  if (!d.yazilabilir) l.push(`Bu rapora şu an yazılamaz; kullanıcı da elle değiştiremez: ${d.neden ?? "rapor düzenlenemez"}.`);\n  else if', "  if");
  const t = m.acikRaporMetni({ no: "SA-1026-009-0a1b2", turAd: "Elektrik panosu", durumAd: "Teknik yönetici onayında", yazilabilir: false, neden: "rapor teknik yönetici onayında" }, false);
  assert.doesNotMatch(t, /onaylanana|yazılamaz; kullanıcı/, "bozuk: neden bağlamda yok");
});
