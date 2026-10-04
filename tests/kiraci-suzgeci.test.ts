/* NEREDEN GELDİ: CLAUDE.md §6 "ilk gün kurulacak kilitler: kiracı süzgeci testi (her sorgu kiracı kimliği taşır)"
   + §7 "ASLA: kiracı süzgeçsiz sorgu" + anayasa 5.4. İki kapı: (1) veritabanına yalnız src/server/db üzerinden
   erişilir (pg başka yerde içe aktarılmaz, .query çağrılmaz); (2) firma_id taşıyan her tablo göçte ENABLE + FORCE
   RLS + politika taşır. Gerçek veritabanında davranış: tests/kiraci-izolasyonu.test.ts.
   Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, hamYazma, kiraciDisiErisim, oku, rlsEksikTablolar } from "./yardimci/denetimler.ts";

test("uygulama kodu veritabanına yalnız src/server/db üzerinden erişir", () => {
  const metinler = dosyalar("src", [".ts", ".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.ok(metinler.length > 10);
  assert.deepEqual(kiraciDisiErisim(metinler), []);
});

/* 2026-10-04 (K1, güvenli yazıcı): modül ve sayfa ham yazma SQL'i taşımaz; yazma yalnız src/server/ çekirdeğinden (yazici.ts) */
test("modüller ve sayfalar veritabanına ham SQL ile yazmaz (güvenli yazıcıdan geçer)", () => {
  const metinler = dosyalar("src", [".ts", ".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(hamYazma(metinler), []);
});

test("firma_id taşıyan her tablo RLS'yi açar, zorlar ve politika taşır", () => {
  const sqller = dosyalar("src/server/db/gocler", [".sql"]).map(oku);
  assert.ok(sqller.length >= 1);
  assert.deepEqual(rlsEksikTablolar(sqller), []);
});
