/* OLUMSUZ KANIT — tests/say-tam-yetki.test.ts neyi koruyor (2026-10-31). Kaynak diskte DEĞİŞTİRİLMEZ: metinler bellekte bozulur. Onay kapısı, onay olayı ya da
   S.A.Y işi için ekran penceresi geri gelirse denetim yakalar. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { tamYetkiKaynaklari } from "../say-tam-yetki.test.ts";
import { onayKapisiIzleri } from "../yardimci/denetimler.ts";

test("kapı, olay ve pencere geri gelince kilit düşer", () => {
  const k = tamYetkiKaynaklari();
  assert.equal(onayKapisiIzleri({ ...k, islem: `${k.islem}\nconst kapi = t.ikinciOnay && o.onayKapisi;` }).length, 1);
  assert.equal(onayKapisiIzleri({ ...k, dongu: `${k.dongu}\nyaz({ t: "onay", ozet, metin });` }).length, 1);
  assert.equal(onayKapisiIzleri({ ...k, ekran: `${k.ekran}\nawait onayla({ baslik: "S.A.Y onayınızı istiyor", metin: "x" });` }).length, 1);
});
