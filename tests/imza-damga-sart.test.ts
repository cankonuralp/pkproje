/* NEREDEN GELDİ: 2026-11-12 — reisim (sektörden birinin anlattığı): "e imza sürecinde de e imza içinde attırdığı e imzalar geçersiz oldu patladı".
   Zaman damgasız imza, sertifikanın süresi dolunca ya da iptal edilince doğrulanamaz. Karar (pkproje.md §11 K9): TÜRKAK'lı firmada — ölçümlü raporda —
   zaman damgasız imzalı PDF yüklemede reddedilir; probata'nın kendi yükleme kapısı (src/server/imza/yukleme.ts), sign'a dokunulmaz. TÜRKAK'sız
   raporda bugünkü gibi kabul. Uydurma makam ve sertifikalar (tests/yardimci). Olumsuz kanıt: tests/bozan/imza-damga-sart.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DAMGA_YOK, ekImzaNedeni } from "../src/server/imza/yukleme.ts";
import { dk, imzaliDss, iptalK, kanitliBelge, T } from "./yardimci/iptal-zamani.ts";

const kanit = () => ({ ocsp: [iptalK.ocsp({ zaman: dk(5) })] });

test("zaman damgası şartı: damgalı imza kabul, damgasız ret; şart yokken damgasız da kabul; imzayı kapsayan belge damgası damga sayılır", () => {
  const damgali = imzaliDss(kanit(), { damga: true }), damgasiz = imzaliDss(kanit(), { damga: false });
  assert.equal(ekImzaNedeni(iptalK.taban, damgali, dk(10), { damgaSart: true }), null);
  assert.equal(ekImzaNedeni(iptalK.taban, damgasiz, dk(10), { damgaSart: true }), DAMGA_YOK);
  assert.equal(ekImzaNedeni(iptalK.taban, damgasiz, dk(10)), null, "şart yokken (TÜRKAK'sız rapor) bugünkü gibi kabul");
  assert.equal(ekImzaNedeni(iptalK.taban, damgasiz, dk(10), { damgaSart: false }), null);
  assert.equal(ekImzaNedeni(iptalK.taban, kanitliBelge(kanit(), { belgeDamgasi: T }), dk(10), { damgaSart: true }), null, "belge zaman damgası imzayı kapsıyor");
});

test("kaynak kilidi: rapor imzası yüklenen iki yerde de şart raporun ölçümlü olmasına bağlı", () => {
  const k = readFileSync("src/modules/raporlar/server/raporlar.ts", "utf8");
  assert.equal(k.split("ekImzaNedeni(").length - 1, 2, "rapor imzası iki yerde yüklenir (muayene uzmanı, teknik yönetici)");
  assert.equal(k.split("{ damgaSart: e.r.olcumlu }").length - 1, 2, "ikisi de zaman damgası şartını raporun modelinden alır");
});
