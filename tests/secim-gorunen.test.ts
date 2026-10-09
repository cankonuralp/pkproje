/* NEREDEN GELDİ: 425 — reisim 2026-10-09 (telefonda süzgeçte her müşteri tek tek): "çok müşteri olunca kullanışsız olur ve donmalara sebep olur".
   Seçim listesi (seçim alanı, süzgeç seçicisi, telefon levhası — tek hesap src/components/secim/gorunen.ts) en çok 50 eşleşme çizer; seçili olan
   her zaman görünür; kalan sayılır ("N seçenek daha — aramayla daraltın"); arama Türkçe harfe duyarsız. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts
   "görünen seçenek". */
import assert from "node:assert/strict";
import { test } from "node:test";
import { EN_COK_GORUNEN, gorunenSecenekler, type SecimSecenegi } from "../src/components/secim/gorunen.ts";

const BIN: SecimSecenegi[] = Array.from({ length: 1000 }, (_, i) => [`m${i}`, `Müşteri ${String(i).padStart(4, "0")} A.Ş.`]);

test("binlerce seçenekte en çok 50 çizilir, kalan sayılır; seçili sona düşse de görünür", () => {
  assert.equal(EN_COK_GORUNEN, 50);
  const g = gorunenSecenekler(BIN, "", "");
  assert.equal(g.liste.length, 50);
  assert.equal(g.kalan, 950);
  assert.equal(g.hic, false);
  const s = gorunenSecenekler(BIN, "m999", "");
  assert.equal(s.liste.length, 50);
  assert.ok(s.liste.some((o) => o[0] === "m999"), "seçili listede yok");
  assert.equal(gorunenSecenekler(BIN, "m999", "", true).liste[0][0], "m999", "levhada seçili başta");
});

test("arama daraltır (Türkçe harf duyarsız); eşleşme yoksa hic; az seçenekte kalan 0", () => {
  const g = gorunenSecenekler(BIN, "", "MÜŞTERİ 099");
  assert.deepEqual(g.liste.map((o) => o[0]), ["m990", "m991", "m992", "m993", "m994", "m995", "m996", "m997", "m998", "m999"]);
  assert.equal(g.kalan, 0);
  assert.equal(gorunenSecenekler(BIN, "", "yok böyle").hic, true);
  const az: SecimSecenegi[] = [["a", "Ada"], ["b", "Bal"]];
  assert.deepEqual(gorunenSecenekler(az, "", ""), { liste: az, kalan: 0, hic: false });
});
