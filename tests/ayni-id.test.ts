/* NEREDEN GELDİ: anayasa 13.2 — kaynak projede tek küresel ad alanı; 412 id'nin tekilliği testle korunuyordu.
   Bu projede modül sistemi var (EKSIKLER 12) ama sayfada iki öğe aynı id'yi alırsa etiket/aria bağları yanlış öğeye
   gider. Sabit id="…" bütün TSX'te bir kez geçer. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ciftIdler, dosyalar, oku } from "./yardimci/denetimler.ts";

test("sabit id'ler tekil", () => {
  const metinler = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.ok(metinler.length > 0);
  assert.deepEqual(ciftIdler(metinler), []);
});
