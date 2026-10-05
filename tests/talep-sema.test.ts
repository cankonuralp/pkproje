/* NEREDEN GELDİ: maket talepler.html izinCiz / masrafCiz (maket-veri.js MV.isGunu: hafta sonu sayılmaz) · personel.html izin reddet (gerekçe) ·
   330. Şema saf (veritabanısız); veritabanı tarafı tests/talepler.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { isGunu, IzinGirdisi, RedGirdisi } from "../src/modules/talepler/sema.ts";

test("iş günü: başlangıç ve bitiş dahil, cumartesi ve pazar sayılmaz; ters aralık 0", () => {
  assert.equal(isGunu("2026-11-02", "2026-11-06"), 5, "pazartesi – cuma");
  assert.equal(isGunu("2026-11-02", "2026-11-09"), 6, "hafta sonu atlanır");
  assert.equal(isGunu("2026-11-07", "2026-11-08"), 0, "yalnız hafta sonu");
  assert.equal(isGunu("2026-11-04", "2026-11-04"), 1);
  assert.equal(isGunu("2026-11-06", "2026-11-02"), 0);
  assert.equal(isGunu("x", "2026-11-02"), 0);
});

test("izin şeması: tür, bitiş başlangıçtan önce olamaz, iş günü olmalı, en çok bir yıl; açıklama 160; red gerekçesi 5–200", () => {
  const ok = IzinGirdisi.safeParse({ tur: "yillik", bas: "2026-11-02", bit: "2026-11-06", aciklama: " " });
  assert.ok(ok.success && ok.data.aciklama === null);
  const hata = (g: object) => { const r = IzinGirdisi.safeParse({ tur: "yillik", bas: "2026-11-02", bit: "2026-11-06", ...g }); return r.success ? null : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`); };
  assert.deepEqual(hata({ bit: "2026-11-01" }), ["bit: Bitiş başlangıçtan önce olamaz."]);
  assert.deepEqual(hata({ bas: "2026-11-07", bit: "2026-11-08" }), ["bit: Seçilen aralıkta iş günü yok."]);
  assert.deepEqual(hata({ bit: "2027-11-06" }), ["bit: En çok bir yıllık izin."]);
  assert.ok(hata({ tur: "tatil" })![0].startsWith("tur:"));
  assert.ok(hata({ aciklama: "a".repeat(161) })![0].startsWith("aciklama:"));
  assert.equal(RedGirdisi.safeParse({ gerekce: " kısa " }).success, false);
  assert.equal(RedGirdisi.safeParse({ gerekce: "Yoğun dönem" }).success, true);
});
