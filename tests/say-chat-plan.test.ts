/* NEREDEN GELDİ: 2026-11-08 reisim: "yukarıdan plan değiştir" — S.A.Y Chat'in üst bandı bugünkü planı gösterir; birden çoksa en yakın tarihli, kişinin seçimi önce. "S.A.Y okusun" komutu kişinin
   elle yazacağı cümle. Olumsuz kanıt: tests/bozan/say-chat-plan.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { bantPlani, okuKomutu, type BantPlani } from "../src/modules/say-chat/plan.ts";

test("komut kişinin yazacağı cümle", () => {
  assert.equal(okuKomutu("P-1126-005"), "Chatten oku, P-1126-005 planına yaz");
  assert.equal(okuKomutu(null), "Chatten oku");
});

test("bant: kişinin seçimi önce; yoksa bugünü kapsayan; yoksa en yakın tarihli; plan yoksa null", () => {
  const p = (id: string, baslangic: string, bitis = baslangic): BantPlani => ({ id, no: id, tesis: "t", baslangic, bitis, kalan: 1 });
  const l = [p("gelecek", "2026-11-20"), p("bugun", "2026-11-06", "2026-11-09"), p("eski", "2026-10-01")];
  assert.equal(bantPlani(l, "2026-11-08", null)?.id, "bugun");
  assert.equal(bantPlani(l, "2026-11-08", "eski")?.id, "eski", "seçim");
  assert.equal(bantPlani(l, "2026-11-08", "silinmis")?.id, "bugun", "seçilen listede yoksa");
  assert.equal(bantPlani([p("gelecek", "2026-11-20"), p("eski", "2026-10-01")], "2026-11-08", null)?.id, "gelecek", "12 gün sonrası 38 gün öncesinden yakın");
  assert.equal(bantPlani([], "2026-11-08", null), null);
});
