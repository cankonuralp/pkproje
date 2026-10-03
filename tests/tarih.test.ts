/* NEREDEN GELDİ: reisim 2026-09-27 "Her yerde aynı 23.09.2026 formatı gibi olsun" + "tıklayınca tarih seçtiren bi takvim açılsın ve saat
   dakika seçebileceğim bir kısım olsun" — maketteki tarih / saat alanının (MK.zaman) kuralları, uygulamada src/components/secim/tarih.ts.
   Takvimde olmayan gün (31.02) kabul edilmez; takvim pazartesi başlar; ay geçişi yıl sınırında doğru. K0 (2026-10-03). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ayBasligi, ayGunleri, ayKaydir, bugunIso, parcaGecerli, saatliKur, simdiIso, tarihNo, tarihOku } from "../src/components/secim/tarih.ts";

test("GG.AA.YYYY ↔ ISO; geçersiz gün ve biçim reddedilir", () => {
  assert.equal(tarihNo("2026-09-23"), "23.09.2026");
  assert.equal(tarihNo("2026-09-23T14:05"), "23.09.2026");
  assert.equal(tarihOku("23.09.2026"), "2026-09-23");
  assert.equal(tarihOku(" 29.02.2028 "), "2028-02-29");
  assert.equal(tarihOku("29.02.2026"), null);
  assert.equal(tarihOku("31.04.2026"), null);
  assert.equal(tarihOku("2026-09-23"), null);
  assert.equal(tarihOku("3.9.2026"), null);
});

test("takvim: pazartesi başlar, ayın gün sayısı doğru", () => {
  const ekim = ayGunleri("2026-10");   // 1 Ekim 2026 perşembe
  assert.equal(ekim.bosluk, 3);
  assert.equal(ekim.gunler.length, 31);
  assert.equal(ekim.gunler[0], "2026-10-01");
  assert.equal(ayGunleri("2028-02").gunler.length, 29);
  assert.equal(ayGunleri("2026-06").bosluk, 0);   // 1 Haziran 2026 pazartesi
  assert.equal(ayBasligi("2026-10"), "Ekim 2026");
});

test("ay geçişi yıl sınırında", () => {
  assert.equal(ayKaydir("2026-12", 1), "2027-01");
  assert.equal(ayKaydir("2026-01", -1), "2025-12");
  assert.equal(ayKaydir("2026-10", 0), "2026-10");
});

test("saatli değer: bir parça değişir, eksik parça şimdiden", () => {
  assert.equal(saatliKur("2026-10-03T09:30", "2026-01-01T00:00", { saat: "14" }), "2026-10-03T14:30");
  assert.equal(saatliKur("2026-10-03T09:30", "2026-01-01T00:00", { gun: "2026-10-05" }), "2026-10-05T09:30");
  assert.equal(saatliKur("", "2026-01-01T08:15", { dakika: "45" }), "2026-01-01T08:45");
  assert.equal(parcaGecerli("23", "saat"), true);
  assert.equal(parcaGecerli("24", "saat"), false);
  assert.equal(parcaGecerli("59", "dakika"), true);
  assert.equal(parcaGecerli("7", "dakika"), false);
});

test("bugün ve şimdi yerel saatle", () => {
  const d = new Date(2026, 9, 3, 7, 5);
  assert.equal(bugunIso(d), "2026-10-03");
  assert.equal(simdiIso(d), "2026-10-03T07:05");
});
