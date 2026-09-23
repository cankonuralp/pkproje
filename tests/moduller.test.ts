/* NEREDEN GELDİ: reisim 2026-09-23 "diğer modüller nerde onlarda gözüksün" + "sekmelerin adı da öznellik içermesin
   planlar raporlar zimmetler gibi genel isimler olsun" — onaylı maketin (5. tur) menüsü. Uygulamanın menüsü (MODÜL
   KAYDI) makettekiyle birebir: grup, sıra, ad, ikon, §3.1 numarası. Her modülün kendi rota klasörü var, fazlası yok.
   Olumsuz kanıt: tests/bozan/kilitler.bozan.ts ("Planlar" → "Planlarım" yakalanır). */
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { MODULLER, MODUL_GRUPLARI } from "../src/modules/moduller.ts";
import { KOK, maketMenusu, oku } from "./yardimci/denetimler.ts";

test("menü onaylı maketle birebir (grup · sıra · ad · ikon · §3.1 no)", () => {
  const maket = maketMenusu(oku("docs/assets/maket.js"));
  const uygulama = MODUL_GRUPLARI.map((g) => ({ grup: g.grup, ogeler: g.moduller.map((m) => [m.ad, m.ikon, m.no]) }));
  assert.equal(maket.length, 6);
  assert.deepEqual(uygulama, maket);
});

test("17 modül, numaralar tekil; menüde olmayanlar 6, 16, 17", () => {
  const nolar = MODULLER.map((m) => m.no);
  assert.equal(nolar.length, 17);
  assert.equal(new Set(nolar).size, 17);
  const yok = Array.from({ length: 20 }, (_, i) => i + 1).filter((n) => !nolar.includes(n));
  assert.deepEqual(yok, [6, 16, 17]);
});

test("her modülün rota klasörü var ve src/app'te modül dışı rota yok", () => {
  const app = join(KOK, "src", "app");
  const klasorler = readdirSync(app).filter((ad) => statSync(join(app, ad)).isDirectory()).sort();
  const yollar = MODULLER.filter((m) => m.yol !== "").map((m) => m.yol).sort();
  assert.deepEqual(klasorler, yollar);
  for (const y of yollar) assert.ok(existsSync(join(app, y, "page.tsx")), `${y}/page.tsx yok`);
  assert.ok(existsSync(join(app, "page.tsx")), "Planlar ana sayfası yok");
});

test("adresler ASCII ve tekil", () => {
  const yollar = MODULLER.map((m) => m.yol);
  assert.equal(new Set(yollar).size, yollar.length);
  for (const y of yollar) assert.match(y, /^[a-z0-9-]*$/);
});
