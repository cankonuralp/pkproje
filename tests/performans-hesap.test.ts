/* NEREDEN GELDİ: maket performans.html M15 (maket-performans.js DONEM, ozet, sureOzet, zamanGrafigi, surecGrafikleri, 148 denetçi kazancı görmez) ·
   reisim 2026-09-27 ("24 saat içinde tamamlandı olan 48 saat içinde tamamlandı olan ve 48 saatten uzun") · 2026-09-29 ("yeni durumundan itibaren
   her rapor performansı etkiler") · KOD-GECIS §4 Performans satırı (görür · kendi · branşı · branşı · görür · —). Saf hesap (329); veritabanı
   tarafı tests/performans.test.ts. Olumsuz kanıt: tests/bozan/performans.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  donemCoz, geriSayisi, gunlukIsler, kazancGorunur, kisiGorunur, ozet, raporGorunur, surecAdimlari, sureOzeti, zamanGruplari, type Donem, type PRapor,
} from "../src/modules/performans/hesap.ts";

const R = (ek: Partial<PRapor> & { id: string }): PRapor => ({ personelId: "k1", planId: "p1", tesisId: "t1", brans: "m", gun: "2026-09-10",
  olustu: "2026-09-10T05:00:00.000Z", ilkGonderim: null, gonderildi: null, onay: null, imza: null, imzali: false, kazanc: 0, geriler: [], ...ek });

test("dönem: bu ay (günlük), bu yıl ve geçen yıl (aylık), tarih aralığı (62 günden uzunsa aylık); aralık denetimi", () => {
  assert.deepEqual(donemCoz("ay", "2026-10-06"), { kod: "ay", bas: "2026-10-01", bit: "2026-10-06", grup: "gun" });
  assert.deepEqual(donemCoz("yil", "2026-10-06"), { kod: "yil", bas: "2026-01-01", bit: "2026-10-06", grup: "ay" });
  assert.deepEqual(donemCoz("gecen", "2026-10-06"), { kod: "gecen", bas: "2025-01-01", bit: "2025-12-31", grup: "ay" });
  assert.deepEqual(donemCoz("x", "2026-10-06"), { kod: "ay", bas: "2026-10-01", bit: "2026-10-06", grup: "gun" }, "bilinmeyen: bu ay");
  assert.deepEqual(donemCoz("aralik", "2026-10-06", "2026-08-06", "2026-10-06"), { kod: "aralik", bas: "2026-08-06", bit: "2026-10-06", grup: "gun" }, "61 gün");
  assert.equal((donemCoz("aralik", "2026-10-06", "2026-08-04", "2026-10-06") as Donem).grup, "ay", "63 gün");
  assert.deepEqual(donemCoz("aralik", "2026-10-06", "2026-10-07", "2026-10-07"), { hata: "Bitiş bugünden sonra olamaz." });
  assert.deepEqual(donemCoz("aralik", "2026-10-06", "2026-10-05", "2026-10-01"), { hata: "Başlangıç bitişten sonra olamaz." });
  assert.deepEqual(donemCoz("aralik", "2026-10-06", "2026-02-30", "2026-03-01"), { hata: "GG.AA.YYYY biçiminde iki tarih." });
  assert.deepEqual(donemCoz("aralik", "2026-10-06", "2010-01-01", "2026-10-01"), { hata: "En çok 5 yıllık aralık." });
});

test("görünürlük: hepsi; branş yöneticisi yalnız branşının raporu ve kişisi; denetçi yalnız kendisi, kazançsız", () => {
  const m = { personelId: "k1", brans: "m" as const }, e = { personelId: "k2", brans: "e" as const };
  assert.deepEqual([raporGorunur({ kapsam: "hepsi" }, m), raporGorunur({ kapsam: "hepsi" }, e)], [true, true]);
  assert.deepEqual([raporGorunur({ kapsam: "brans", branslar: ["m"] }, m), raporGorunur({ kapsam: "brans", branslar: ["m"] }, e)], [true, false]);
  assert.equal(raporGorunur({ kapsam: "brans", branslar: ["m"] }, { personelId: "k1", brans: null }), false, "branşı bilinmeyen rapor branş yöneticisine görünmez");
  assert.deepEqual([raporGorunur({ kapsam: "kendi", personelId: "k1" }, m), raporGorunur({ kapsam: "kendi", personelId: "k1" }, e)], [true, false]);
  assert.equal(raporGorunur({ kapsam: "kendi", personelId: null }, m), false, "personeli olmayan hesap hiçbir şey görmez");
  assert.deepEqual([kisiGorunur({ kapsam: "brans", branslar: ["e"] }, { id: "k2", brans: "e" }), kisiGorunur({ kapsam: "brans", branslar: ["e"] }, { id: "k1", brans: "m" })], [true, false]);
  assert.deepEqual([kisiGorunur({ kapsam: "kendi", personelId: "k1" }, { id: "k1", brans: "m" }), kisiGorunur({ kapsam: "kendi", personelId: "k1" }, { id: "k2", brans: "m" })], [true, false]);
  assert.deepEqual([kazancGorunur({ kapsam: "hepsi" }), kazancGorunur({ kapsam: "brans", branslar: ["m"] }), kazancGorunur({ kapsam: "kendi", personelId: "k1" })], [true, true, false]);
});

test("özet ve tamamlanma süresi: kişi × gün, gün başı, kazanç; 24 saat (dahil) · 24–48 (dahil) · 48'den uzun; imzasız sayılmaz", () => {
  const t = (s: number) => new Date(Date.parse("2026-09-10T05:00:00.000Z") + s * 36e5).toISOString();
  const l = [
    R({ id: "a", imza: t(24), imzali: true, kazanc: 100_000 }), R({ id: "b", imza: t(24.01), imzali: true, kazanc: 100_000 }),
    R({ id: "c", imza: t(48), imzali: true, kazanc: 50_000, personelId: "k2", brans: "e" }), R({ id: "d", imza: t(48.5), imzali: true, gun: "2026-09-11" }),
    R({ id: "e", gun: "2026-09-12" }),
  ];
  assert.deepEqual(sureOzeti(l), { n: 4, h24: 1, h48: 2, h48p: 1, pay: 25 });
  const o = ozet(l, 2);
  assert.deepEqual([o.rapor, o.gun, Math.round(o.ort * 100) / 100, o.kazanc, o.gunKazanc, o.geri, o.son], [5, 4, 1.25, 250_000, 62_500, 2, "2026-09-12"]);
  assert.deepEqual(ozet([], 0), { rapor: 0, gun: 0, ort: 0, kazanc: 0, gunKazanc: 0, geri: 0, son: null, sure: { n: 0, h24: 0, h48: 0, h48p: 0, pay: 0 } });
});

test("geri gönderilen: geri gönderme günü dönemde olan rapor (açılışı önce olsa da), bir kez sayılır", () => {
  const d = donemCoz("aralik", "2026-10-06", "2026-10-01", "2026-10-06") as Donem;
  const l = [R({ id: "a", geriler: [{ geri: "2026-10-02T07:00:00.000Z", gonderim: null }, { geri: "2026-10-03T07:00:00.000Z", gonderim: null }] }),
    R({ id: "b", geriler: [{ geri: "2026-09-30T20:59:00.000Z", gonderim: null }] }), R({ id: "c", geriler: [{ geri: "2026-09-30T21:00:00.000Z", gonderim: null }] })];
  assert.equal(geriSayisi(l, d), 2, "Türkiye takvimi: 30.09 23:59 dönem dışı, 01.10 00:00 içinde");
});

test("zaman grafiği: kısa dönemde rapor yazılan günler (m / e, kazanç); uzunda aylar — boş ay da var, yıl aşan dönemde yıl", () => {
  const d = donemCoz("ay", "2026-10-06") as Donem;
  const l = [R({ id: "a", gun: "2026-10-02", kazanc: 10 }), R({ id: "b", gun: "2026-10-02", brans: "e", kazanc: 5 }), R({ id: "c", gun: "2026-10-05" })];
  assert.deepEqual(zamanGruplari(l, d), [{ etiket: "02.10", tam: "02.10.2026 Cuma", m: 1, e: 1, rapor: 2, kazanc: 15 }, { etiket: "05.10", tam: "05.10.2026 Pazartesi", m: 1, e: 0, rapor: 1, kazanc: 0 }]);
  const y = donemCoz("aralik", "2026-10-06", "2025-11-15", "2026-02-10") as Donem;
  assert.deepEqual(zamanGruplari([R({ id: "a", gun: "2026-01-20" })], y).map((x) => [x.etiket, x.tam, x.rapor]),
    [["Kas 25", "Kasım 2025", 0], ["Ara 25", "Aralık 2025", 0], ["Oca 26", "Ocak 2026", 1], ["Şub 26", "Şubat 2026", 0]]);
});

test("süreç adımları (ortalama saat, yalnız tamamlanmış adım) ve günlük iş (gün × tesis, en yeni üstte)", () => {
  const z = (h: number) => new Date(Date.parse("2026-09-10T05:00:00.000Z") + h * 36e5).toISOString();
  const l = [
    R({ id: "a", ilkGonderim: z(2), gonderildi: z(2), onay: z(4), imza: z(12), sonImza: z(12), imzali: true, kazanc: 7 }),
    R({ id: "b", ilkGonderim: z(3), gonderildi: z(24), onay: z(25), imza: z(47), sonImza: z(47), imzali: true, geriler: [{ geri: z(5), gonderim: z(24) }, { geri: z(30), gonderim: null }], kazanc: 3 }),
    R({ id: "c", gun: "2026-09-11", tesisId: "t2", planId: "p2" }),
  ];
  assert.deepEqual(surecAdimlari(l), [{ ad: "Yazım", ort: 2.5, n: 2 }, { ad: "Düzeltme", ort: 19, n: 1 }, { ad: "Onay", ort: 1.5, n: 2 }, { ad: "Son imza", ort: 15, n: 2 }]);
  /* 2026-10-06 (329–332 incelemesi): son imza adımı şimdiki revizyonun imzasıyla — revizyonda onay yenilenir, ilk imza ondan önce kalır (eksi süre);
     revize edilip henüz imzalanmamış ya da tutarsız çift ortalamaya girmez */
  const rev = [...l, R({ id: "d", onay: z(100), imza: z(12), sonImza: null, imzali: true }), R({ id: "e", onay: z(100), imza: z(12), sonImza: z(90), imzali: true })];
  assert.deepEqual(surecAdimlari(rev).at(-1), { ad: "Son imza", ort: 15, n: 2 });
  assert.deepEqual(gunlukIsler(l), [{ gun: "2026-09-11", tesisId: "t2", planIdleri: ["p2"], rapor: 1, imzali: 0, kazanc: 0 },
    { gun: "2026-09-10", tesisId: "t1", planIdleri: ["p1"], rapor: 2, imzali: 2, kazanc: 10 }]);
});
