/* NEREDEN GELDİ: 549 — S.A.Y Chat "Plandan seç" (sunum 546 K1–K2; reisim 2026-10-14: "plandan seç diyince plandaki ekipmanlar gözükmüyor", "diğer
   önerilerini kabul ediyorum"). Saf: plandaki her ekipmanın durumu — başka branş UYARIYLA seçilir (engel değil), kişinin kendi Yeni raporu varsa
   seçilir (kayıt o rapora girer), başkasının / onaya gitmiş raporu olan, pasif ve formatsız ekipman nedeniyle görünür, seçilmez. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { bransUyarisi, planEkipmanDurumu } from "../src/modules/say-chat/secim.ts";

const E = { id: "e1", brans: "e" as const, pasif: false };

test("kişinin branşında, raporsuz: uygun", () => {
  assert.deepEqual(planEkipmanDurumu(E, "e", [], true), { durum: "uygun", neden: null });
  assert.deepEqual(planEkipmanDurumu(E, null, [], true), { durum: "uygun", neden: null }, "branşı bilinmeyen kişi");
});

test("başka branş: seçilir, uyarı yazar (engel değil)", () => {
  const d = planEkipmanDurumu(E, "m", [], true);
  assert.equal(d.durum, "brans");
  assert.equal(d.neden, "Elektrik branşında — sizin branşınız mekanik.");
  assert.equal(bransUyarisi("m", "e"), "Mekanik branşında — sizin branşınız elektrik.");
});

test("kişinin kendi Yeni raporu: seçilir (rapor), başka branşta da", () => {
  const r = [{ ekipmanId: "e1", durum: "taslak", benimTaslak: true }];
  assert.equal(planEkipmanDurumu(E, "e", r, true).durum, "rapor");
  assert.equal(planEkipmanDurumu(E, "m", r, true).durum, "rapor");
});

test("seçilmeyenler nedeniyle: başkasının raporu, onaya gitmiş rapor, pasif, formatsız", () => {
  assert.deepEqual(planEkipmanDurumu(E, "e", [{ ekipmanId: "e1", durum: "taslak", benimTaslak: false }], true), { durum: "kapali", neden: "Başka birinin raporu var." });
  assert.deepEqual(planEkipmanDurumu(E, "e", [{ ekipmanId: "e1", durum: "onayda", benimTaslak: false }], true),
    { durum: "kapali", neden: "Raporu “Teknik yönetici onayında” durumunda; yeni kayıt yazılmaz." });
  assert.equal(planEkipmanDurumu({ ...E, pasif: true }, "e", [], true).neden, "Pasif ekipman.");
  assert.equal(planEkipmanDurumu(E, "e", [], false).neden, "Türün rapor formatı yayında değil.");
  assert.equal(planEkipmanDurumu(E, "e", [{ ekipmanId: "baska", durum: "onayda", benimTaslak: false }], true).durum, "uygun", "başka ekipmanın raporu etkilemez");
});
