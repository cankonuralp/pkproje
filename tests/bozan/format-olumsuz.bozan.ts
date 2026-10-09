/* OLUMSUZ KANIT — tests/format-motor.test.ts "426" neyi koruyor (kaynak diskte değiştirilmez; motor.ts bellekte bozulur, göreli içe aktarmalar
   mutlak yola çevrilir): seçmeli hücrenin olumsuz seçeneği (ZPKR04 "UD") değerlendirmeden kalkınca test edilmemiş cihaz satırı kusursuz geçer;
   seçmeli test değerinin olumsuz kuralı kalkınca ZPKR05 "Not 2: Yetersiz" kusur sayılmaz. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { Cevaplar, FormatTanimi } from "../../src/format/tanim.ts";

type Modul = typeof import("../../src/format/motor.ts");
const KOK = resolve("src/format");
const KAYNAK = readFileSync(join(KOK, "motor.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "format-olumsuz-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `motor-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const t = FormatTanimi.parse({ sema: 1, bolumler: [
  { id: "tb", ad: "Cihaz testleri", blok: "olcum", sutunlar: [{ id: "test", ad: "Test", giris: "secim", secenekler: ["U", "UD", "UG"], olumsuz: ["UD"] }] },
  { id: "tp", ad: "Topraklama", blok: "test", degerler: [{ id: "not", ad: "Değerlendirme", secenekler: ["Not 1: Uygun", "Not 2: Yetersiz"], olumsuz: ["Not 2: Yetersiz"], agir: true }] },
] });
const c = Cevaplar.parse({ tablo: { tb: [{ test: "UD" }] }, deger: { not: "Not 2: Yetersiz" } });

test("olumsuz seçenek değerlendirmesi kalkınca 'UD' satırı kusursuz geçer", async () => {
  const m = await bozuk("if (c.olumsuz.includes(s[c.id])) {", "if (false) {");
  assert.equal(m.degerlendir(t, c).satirlar.tb[0].uygun, true, "bozuk: UD uygun sayıldı");
});

test("seçmeli değerin olumsuz kuralı kalkınca 'Not 2: Yetersiz' kusur sayılmaz", async () => {
  const m = await bozuk("const r = !dolu ? null : d.olumsuz?.length ? !d.olumsuz.includes(v!) : null;", "const r = !dolu ? null : true;");
  assert.equal(m.degerlendir(t, c).kusurlar.some((k) => k.kriter === "Değerlendirme"), false, "bozuk: yetersiz kusur değil");
});
