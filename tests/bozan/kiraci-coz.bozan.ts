/* OLUMSUZ KANIT — tests/kiraci-coz.test.ts'in "kiracı YALNIZ Host başlığından" kilidi (FIRMA-VT FV3, 2026-10-15 incelemesi; tests/yardimci/denetimler.ts
   kiraciBasligiEksikleri) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/kiraci/istek.ts bellekte okunur, bozulur, denetim
   işlevine verilir; her bozma yakalanmalı.
   1. Kiracı X-Forwarded-Host'tan (ya da Host yoksa ondan) okunursa — istemcinin gönderdiği başlık firmayı seçerdi.
   2. Kiracı çerezden, sorgu dizesinden, Origin / Referer'dan okunursa.
   3. Başlıklar ikinci kez okunur ya da başlığın başka bir okuma yolu (entries, has) kullanılırsa.
   4. Çözüme host dışında bir şey verilirse (istemcinin seçtiği ad).
   Yorumdaki söz bulgu sayılmaz (sağlam davranış — yanlış alarm yok). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kiraciBasligiEksikleri, oku } from "../yardimci/denetimler.ts";

const METIN = oku("src/server/kiraci/istek.ts");
const HOST = '  const host = (await headers()).get("host") ?? "";\n';
const COZUM = "  return hosttanKiraci(host, anaAlan(), firmaKaydi);\n";
const boz = (eski: string, yeni: string) => {
  assert.ok(METIN.includes(eski), `bozulacak metin kaynakta yok: ${eski}`);
  return kiraciBasligiEksikleri(METIN.replace(eski, () => yeni));
};

test("sağlam: bulgu yok; yorumdaki söz sayılmaz", () => {
  assert.deepEqual(kiraciBasligiEksikleri(METIN), []);
  assert.deepEqual(kiraciBasligiEksikleri(`/* X-Forwarded-Host, cookies(), searchParams okunmaz */\n// headers().get("origin") yok\n${METIN}`), []);
});

test("1. kiracı X-Forwarded-Host'tan okununca yakalanır (kilidin koruduğu açık)", () => {
  assert.notDeepEqual(boz(HOST, '  const host = (await headers()).get("x-forwarded-host") ?? "";\n'), []);
  assert.notDeepEqual(boz(HOST, '  const h = await headers();\n  const host = h.get("host") ?? h.get("x-forwarded-host") ?? "";\n'), []);
  assert.notDeepEqual(boz(HOST, `${HOST}  const ileri = (await headers()).get("x-forwarded-host");\n`), []);
});

test("2. kiracı çerezden, sorgu dizesinden, Origin / Referer'dan okununca yakalanır (kilidin koruduğu açık)", () => {
  for (const ek of ['  const c = (await cookies()).get("firma")?.value;\n', "  const s = new URL(istekAdresi).searchParams;\n",
    '  const o = "origin";\n', '  const r = "referer";\n']) {
    assert.notDeepEqual(boz(HOST, `${HOST}${ek}`), [], ek);
  }
});

test("3. başlıklar ikinci kez ya da başka yolla okununca yakalanır (kilidin koruduğu açık)", () => {
  assert.notDeepEqual(boz(HOST, `${HOST}  const tum = [...(await headers()).entries()];\n`), []);
  assert.notDeepEqual(boz(HOST, '  const b = await headers();\n  const host = b.has("x-firma") ? "" : (b.get("host") ?? "");\n'), []);
});

test("4. çözüme host dışında bir ad verilince yakalanır (kilidin koruduğu açık)", () => {
  assert.notDeepEqual(boz(COZUM, "  return hosttanKiraci(secilen, anaAlan(), firmaKaydi);\n"), []);
});
