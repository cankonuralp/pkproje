/* OLUMSUZ KANIT — tests/sign-gomulu.test.ts neyi koruyor (2026-11-07). Kaynak diskte DEĞİŞTİRİLMEZ: bellekte bozulur —
   (1) köken denetimi kalkarsa başka bir sitenin iletisi "imzalandı" sayılır; (2) kaynak denetimi kalkarsa sign dışı ileti geçer;
   (3) adres denetimi alt alan sınırını kaybederse benzer adlı başka site çerçeveye açılır; (4) allow özniteliği değişirse USB imza uygulamasına
   ulaşılamaz — kilitteki eşitlik düşer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-sign-gomulu-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
async function bozuk<T>(dosya: string, eski: string, yeni: string, ad: string): Promise<T> {
  const kaynak = readFileSync(resolve(dosya), "utf8");
  assert.ok(kaynak.includes(eski), "bozulacak yer bulunmalı");
  const yol = join(klasor, `${ad}.ts`);
  writeFileSync(yol, kaynak.replace(eski, yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Haber = typeof import("../../src/modules/raporlar/sign-haber.ts");
type Adres = typeof import("../../src/server/dis/sign-adres.ts");
const FIRMA = "https://deneme.sign.probata.com.tr";

test("köken denetimi kalkınca başka sitenin iletisi geçer — kilit düşer", async () => {
  const m = await bozuk<Haber>("src/modules/raporlar/sign-haber.ts", "if (!beklenenKoken || e.origin !== beklenenKoken) return null;", "", "koken");
  assert.deepEqual(m.signHaberi({ origin: "https://kotu.example", data: { kaynak: "probata-sign", tur: "imzalandi" } }, FIRMA), { tur: "imzalandi" });
});

test("kaynak denetimi kalkınca sign dışı ileti geçer — kilit düşer", async () => {
  const m = await bozuk<Haber>("src/modules/raporlar/sign-haber.ts", "if (x.kaynak !== \"probata-sign\") return null;", "", "kaynak");
  assert.deepEqual(m.signHaberi({ origin: FIRMA, data: { kaynak: "baska", tur: "imzalandi" } }, FIRMA), { tur: "imzalandi" });
});

test("alt alan sınırı kalkınca benzer adlı site sign sayılır — kilit düşer", async () => {
  const m = await bozuk<Adres>("src/server/dis/sign-adres.ts", "a.host.endsWith(`.${k.host}`)", "a.host.includes(k.host)", "alt-alan");
  assert.equal(m.signSayfasiMi("https://sign.probata.com.tr.kotu.example/x", "https://sign.probata.com.tr"), true);
});

test("allow özniteliği değişince rehberle eşitlik düşer — kilit düşer", async () => {
  const m = await bozuk<Haber>("src/modules/raporlar/sign-haber.ts", "\"local-network-access; local-network; loopback-network\"", "\"local-network-access\"", "allow");
  assert.notEqual(m.GOMULU_IZIN, "local-network-access; local-network; loopback-network");
});
