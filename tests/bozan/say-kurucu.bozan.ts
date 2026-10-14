/* OLUMSUZ KANIT — tests/say-kurucu.test.ts (553, S.A.Y format yapıcıda) neyi koruyor (kaynak diskte değiştirilmez; say-kurucu.ts bellekte bozulur,
   göreli içe aktarmalar mutlak yola çevrilir):
   1. Bölümü ADIYLA bulma kalkınca aynı istekte eklenen bölüme öğe eklenemez ("RC ölçümü" tablosu boş kalır — reisim'in örneği yarım kalır).
   2. Eklenebilir bölüm türü denetimi kalkınca S.A.Y formatta tek olması gereken bölümü (imza) ikinci kez ekler. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi } from "../../src/format/tanim.ts";

const klasor = mkdtempSync(join(tmpdir(), "say-kurucu-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const yol = "src/modules/rapor-format/say-kurucu.ts";
const KAYNAK = readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/rapor-format/say-kurucu.ts")> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(y).href);
}
const T = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);

test("bölümü adıyla bulma kalkınca yeni tabloya sütun eklenemez", async () => {
  const m = await bozuk("return i >= 0 ? i : t.bolumler.findIndex((b) => tr(b.ad) === tr(k));", "return i;");
  const r = m.formatIslemleri(T(), [{ islem: "bolum_ekle", tur: "olcum", ad: "RC ölçümü" }, { islem: "oge_ekle", bolum: "RC ölçümü", ad: "RCd" }]);
  assert.equal(r.gecersiz.length, 1, "bozuk: adıyla bulunamadı");
});

test("bölüm türü denetimi kalkınca ikinci imza bölümü eklenir", async () => {
  const m = await bozuk("if (!(EKLENIR_BLOK as readonly string[]).includes(tur)) {", "if (false) {");
  const r = m.formatIslemleri(T(), [{ islem: "bolum_ekle", tur: "imza", ad: "İkinci imza" }]);
  assert.equal(r.t.bolumler.filter((b) => b.blok === "imza").length, 2, "bozuk: ikinci imza bölümü");
});
