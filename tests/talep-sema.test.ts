/* NEREDEN GELDİ: maket talepler.html izinCiz / masrafCiz (maket-veri.js MV.isGunu: hafta sonu sayılmaz) · personel.html izin reddet (gerekçe) ·
   330. Şema saf (veritabanısız); veritabanı tarafı tests/talepler.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { GerekceGirdisi, isGunu, IzinGirdisi, tatilMi } from "../src/modules/talepler/sema.ts";

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
  /* 2026-10-10 (477; Talepler–Onaylar sunumu kuralı "Geri gönder ve Reddet gerekçe ister (en az 10 karakter)"): red ve düzeltme gerekçesi tek
     şema, en az 10 (önce 5) */
  assert.equal(GerekceGirdisi.safeParse({ gerekce: " kısa " }).success, false);
  assert.equal(GerekceGirdisi.safeParse({ gerekce: "Kısa olan" }).success, false, "9 karakter");
  assert.equal(GerekceGirdisi.safeParse({ gerekce: "Yoğun dönem" }).success, true);
});

/* 417 (KOD-GECIS Y9): resmî tatiller iş günü sayılmaz — 2429 sayılı Kanun'un sabit günleri + Diyanet takviminden dini bayramlar; yarım gün iş günü */
test("iş günü: resmî tatiller ve dini bayramlar sayılmaz, arife (yarım gün) sayılır", () => {
  assert.equal(isGunu("2026-10-26", "2026-10-30"), 4, "29 Ekim perşembe tatil; 28 Ekim (yarım gün) sayılır");
  assert.equal(isGunu("2027-03-08", "2027-03-12"), 2, "Ramazan Bayramı 9–11 Mart 2027; 8 Mart arife sayılır");
  assert.equal(isGunu("2026-05-25", "2026-05-29"), 2, "Kurban Bayramı 27–30 Mayıs 2026; 26 Mayıs arife sayılır");
  assert.equal(isGunu("2027-01-01", "2027-01-01"), 0, "Yılbaşı");
  assert.equal(isGunu("2028-05-01", "2028-05-08"), 3, "1 Mayıs pazartesi + Kurban Bayramı 5–8 Mayıs 2028; 2–4 Mayıs (4 arife) sayılır");
  assert.equal(tatilMi("2026-07-15"), true);
  assert.equal(tatilMi("2026-10-28"), false, "28 Ekim yarım gün");
});
