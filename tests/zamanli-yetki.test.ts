/* NEREDEN GELDİ: 378 — gece işi ucu (/api/is/gece) yalnız zamanlayıcının sırrıyla açılır (reisim: "yetki her zaman sunucuda denetlenir"). Saf:
   sır yoksa / kısaysa hiçbir istek geçmez (yanlış kurulum açık kapı olmaz); "Bearer " öneki şart; yanlış sır, boş başlık geçmez.
   Olumsuz kanıt: tests/bozan/gece-cop.bozan.ts (kısa sır denetimi kalkınca). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { zamanliYetkili } from "../src/server/is/yetki.ts";

const SIR = "deneme-sir-deneme-sir-deneme-sir-01";

test("yalnız 'Bearer <sır>' geçer; sır yok / kısa / yanlış / öneksiz / boş başlık geçmez", () => {
  assert.equal(zamanliYetkili(`Bearer ${SIR}`, SIR), true);
  assert.equal(zamanliYetkili(`Bearer ${SIR}`, undefined), false, "sır tanımsız");
  assert.equal(zamanliYetkili("Bearer ", ""), false, "sır boş");
  assert.equal(zamanliYetkili("Bearer kisa", "kisa"), false, "32 karakterden kısa sır kabul edilmez");
  assert.equal(zamanliYetkili(`Bearer ${SIR}x`, SIR), false);
  assert.equal(zamanliYetkili(SIR, SIR), false, "öneksiz");
  assert.equal(zamanliYetkili(`bearer ${SIR}`, SIR), false, "önek birebir");
  assert.equal(zamanliYetkili(null, SIR), false);
  assert.equal(zamanliYetkili("", SIR), false);
});
