/* NEREDEN GELDİ: 493 — hata listesi 29 + 46 maketi (https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ) onaylandı, reisim 2026-10-11: "maketi onaylıyorum
   … mevcuttaki sistemi koruyalım gelişmiş seçenekler tuşu olsun"; maketteki "Geri al / Yinele" (sunum: "yanlış silmenin korkusunu kaldırır").
   Saf işlevler (src/modules/rapor-format/gecmis.ts): her değişiklik bir adım; geri al öncekine döner, yinele geri getirir; yeni değişiklik
   yinelenecek yolu kapatır; en çok 100 adım; kısayol yazı alanındayken yok. Olumsuz kanıt: tests/bozan/gecmis.bozan.ts. Tarayıcıda:
   e2e/rapor-format.spec.ts (Geri al / Yinele, Ctrl+Z). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { adimEkle, bosGecmis, GECMIS_EN_COK, geriAl, kisayol, yinele } from "../src/modules/rapor-format/gecmis.ts";

test("geri al öncekine döner, yinele geri getirir; boş yığında null", () => {
  let g = bosGecmis<string>();
  assert.equal(geriAl(g, "a"), null);
  assert.equal(yinele(g, "a"), null);
  g = adimEkle(g, "a");       // a → b
  g = adimEkle(g, "b");       // b → c
  const x = geriAl(g, "c")!;
  assert.equal(x.deger, "b");
  const y = geriAl(x.gecmis, x.deger)!;
  assert.equal(y.deger, "a");
  assert.equal(geriAl(y.gecmis, y.deger), null, "başa gelindi");
  const z = yinele(y.gecmis, y.deger)!;
  assert.equal(z.deger, "b");
  const w = yinele(z.gecmis, z.deger)!;
  assert.equal(w.deger, "c");
  assert.equal(yinele(w.gecmis, w.deger), null);
});

test("geri aldıktan sonra yeni değişiklik yinelenecek yolu kapatır", () => {
  let g = adimEkle(adimEkle(bosGecmis<string>(), "a"), "b");
  const x = geriAl(g, "c")!;   // şimdi b, ileride c
  g = adimEkle(x.gecmis, x.deger);   // b → d
  assert.deepEqual(g.ileri, []);
  assert.equal(yinele(g, "d"), null);
  assert.equal(geriAl(g, "d")!.deger, "b");
});

test("en çok 100 adım: en eski düşer", () => {
  let g = bosGecmis<number>();
  for (let i = 0; i < GECMIS_EN_COK + 20; i++) g = adimEkle(g, i);
  assert.equal(g.geri.length, GECMIS_EN_COK);
  assert.equal(g.geri[0], 20);
});

test("kısayol: Ctrl / Cmd + Z geri, Ctrl + Y ya da Ctrl + Shift + Z ileri; yazı alanında, Alt'la ve düz tuşta yok", () => {
  const k = (key: string, o: Partial<{ ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; hedefYazi: boolean }> = {}) =>
    kisayol({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, hedefYazi: false, ...o });
  assert.equal(k("z", { ctrlKey: true }), "geri");
  assert.equal(k("Z", { metaKey: true }), "geri");
  assert.equal(k("y", { ctrlKey: true }), "ileri");
  assert.equal(k("z", { ctrlKey: true, shiftKey: true }), "ileri");
  assert.equal(k("z", { ctrlKey: true, hedefYazi: true }), null, "yazı alanının kendi geri alması");
  assert.equal(k("z", { ctrlKey: true, altKey: true }), null);
  assert.equal(k("z"), null);
  assert.equal(k("x", { ctrlKey: true }), null);
});
