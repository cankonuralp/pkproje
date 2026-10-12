/* OLUMSUZ KANIT — tests/yz-okuma.test.ts "Haiku 5.5" neyi koruyor (2026-10-12; reisim: "yapay zekada da haiku … seçenekler olmalı daha uygun
   ücretlendirme için"). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): okuma.ts bellekte bozulup geçici klasörden içe aktarılır.
   1. Üst fiyat (istem 100 000 tokeni aşınca) kalkınca uzun istem (belgeden başlat) beş kat ucuz sayılır — kişi başı sınır gerçek harcamanın gerisinde kalır.
   2. Yukarı yuvarlama kalkınca Haiku'nun kesirli maliyeti tam sayı olmaz — veritabanındaki maliyet sütunu (bigint) yazmayı reddeder, okuma düşer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

type Okuma = typeof import("../../src/server/yz/okuma.ts");
const KAYNAK = "src/server/yz/okuma.ts";
const gecici = mkdtempSync(join(tmpdir(), "yz-maliyet-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Okuma> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `okuma-${++sira}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, y: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), y)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<Okuma>;
}
after(() => rmSync(gecici, { recursive: true, force: true }));

test("1. üst fiyat kalkınca 100 000 tokeni aşan istem alt fiyatla (beş kat ucuz) hesaplanır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("const f = FIYAT[model], u = f.ust && giris > f.ust.esik ? f.ust : f;", "const f = FIYAT[model], u = f;");
  assert.equal(m.maliyetHesapla("haiku", 200_000, 10_000), 25_000, "bozuk: üst fiyat yerine alt fiyat (doğrusu 125 000)");
});

test("2. yukarı yuvarlama kalkınca Haiku maliyeti kesirli çıkar (kilidin koruduğu açık)", async () => {
  const m = await bozuk("return Math.ceil((giris * u.giris + cikis * u.cikis) / 10);", "return (giris * u.giris + cikis * u.cikis) / 10;");
  assert.equal(Number.isInteger(m.maliyetHesapla("haiku", 1, 1)), false, "bozuk: 0,6 milyonda bir dolar — bigint sütuna yazılamaz");
});
