/* OLUMSUZ KANIT — tests/say-kurucu.test.ts "serbest tablo" neyi koruyor (2026-10-31). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): say-kurucu.ts bellekte bozulup
   geçici klasörden içe aktarılır. 1. Elle doldurulan yere kimlik verilmezse değeri saklanacak yer olmaz (belge doldurma çalışmaz). 2. Tabloda olmayan hücre
   denetlenmezse S.A.Y sessizce başka hücreye yazmış sanır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-kurucu-tablo-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type M = typeof import("../../src/modules/rapor-format/say-kurucu.ts");
const KAYNAK = "src/modules/rapor-format/say-kurucu.ts";
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<M> {
  const kaynak = readFileSync(resolve(KAYNAK), "utf8"), kok = dirname(resolve(KAYNAK));
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-say-kurucu.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
const T0 = () => FormatTanimi.parse({ sema: 1, gorunum: { serbest: true }, bolumler: [] });

test("1. elle yere kimlik verilmeyince kilit düşer", async () => {
  const m = await bozuk('y.id = eski.tur === "alan" && eski.id ? eski.id : yeniKimlik(t, "h");', "");
  const r = m.formatIslemleri(T0(), [{ islem: "bolum_ekle", tur: "tablo", ad: "F" }, { islem: "tablo", bolum: "F", eylem: "hucre", r: 0, c: 1, hucre: { tur: "alan" } }]);
  const h = (r.t.bolumler[0] as BolumOf<"tablo">).hucreler.find((x) => x.r === 0 && x.c === 1)!;
  assert.ok(!h.id);
});
test("2. tabloda olmayan hücre denetlenmeyince kilit düşer", async () => {
  const m = await bozuk("  if (!icinde(r, c)) return", "  if (false) return");
  const r = m.formatIslemleri(T0(), [{ islem: "bolum_ekle", tur: "tablo", ad: "F" }, { islem: "tablo", bolum: "F", eylem: "hucre", r: 9, c: 0, hucre: { tur: "yazi" } }]);
  assert.ok(!r.gecersiz.some((g) => /tabloda yok/.test(g)));
});
