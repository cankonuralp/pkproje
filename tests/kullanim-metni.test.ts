/* NEREDEN GELDİ: 357 — kesin silme: kullanılmış kayıt silinmez, nedeni söylenir ("<ad> silinemez: 3 raporda, 1 zimmet hareketinde kullanıldı.").
   Saf (veritabanısız): sayımlar → metin; sıfır sayım yazılmaz; bilinmeyen tür sessizce düşmez (adıyla yazılır). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kullanimMetni } from "../src/components/sil/metin.ts";

test("kullanım metni", () => {
  assert.equal(kullanimMetni({ rapor: 3, zimmet: 1 }), "3 raporda, 1 zimmet hareketinde");
  assert.equal(kullanimMetni({ zimmet_formu: 2, rapor: 0 }), "2 zimmet formunda");
  assert.equal(kullanimMetni({}), "");
  assert.equal(kullanimMetni({ yeni_bag: 4 }), "4 yeni_bag");
});
