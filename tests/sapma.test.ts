/* NEREDEN GELDİ: 2026-11-12 — reisim: "yazılan süre ile ekipman başında geçirilen süre uymalı log kayıtları düzgün olmalı" (göç 0129; pkproje.md §11
   K6). Ölçümlü rapor onaya gönderilirken beş sapma denetimi; sapma kesin engel değil ama gerekçesiz (en az 10 karakter) gönderilmez. Veritabanı
   tarafı tests/raporlar.test.ts "kontrol saati (0128)". Olumsuz kanıt: tests/bozan/sapma.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { sapmaGerekceleri, sapmaKarari, sapmalar, type SapmaGirdisi } from "../src/modules/raporlar/sapma.ts";

const TEMIZ: SapmaGirdisi = { bas: "2026-11-12T13:30", bit: "2026-11-12T14:02", enKisaDk: 20, tesis: "A", planBas: "2026-11-12", planBit: "2026-11-13",
  digerleri: [{ no: "FL-1126-001", bas: "2026-11-12T09:10", bit: "2026-11-12T09:42", tesis: "A" }], tesisArasiDk: 15,
  fotolar: [{ ad: "on.jpg", cekim: "2026-11-12 13:33" }, { ad: "etiket.jpg", cekim: null }, { ad: "eski.jpg" }] };
const turler = (g: Partial<SapmaGirdisi>) => sapmalar({ ...TEMIZ, ...g }).map((s) => s.tur);

test("sapma yok: süre yeterli, saat çakışmıyor, aynı tesis, plan gününde, fotoğraf saat içinde (çekim saati olmayan fotoğraf denetlenmez)", () => {
  assert.deepEqual(sapmalar(TEMIZ), []);
});

test("kısa kontrol: türün en kısa süresinden kısa; türde süre yoksa denetlenmez", () => {
  assert.deepEqual(sapmalar({ ...TEMIZ, bit: "2026-11-12T13:36" }), [{ tur: "kisa", metin: "Kontrol 6 dk sürdü. Bu türün en kısa süresi 20 dk." }]);
  assert.deepEqual(turler({ bit: "2026-11-12T13:50" }), [], "tam en kısa süre sapma değil");
  assert.deepEqual(turler({ bit: "2026-11-12T13:36", enKisaDk: null }), []);
});

test("çakışan saat: aynı kişinin başka raporuyla kesişen aralık; uç uca değen çakışma değil", () => {
  const o = { no: "FL-1126-031", bas: "2026-11-12T13:50", bit: "2026-11-12T14:20", tesis: "A" };
  assert.deepEqual(sapmalar({ ...TEMIZ, digerleri: [o] }), [{ tur: "cakisma", metin: "Aynı saatte başka raporunuz var: FL-1126-031 (13:50 – 14:20)." }]);
  assert.deepEqual(turler({ digerleri: [{ ...o, bas: "2026-11-12T14:02" }] }), []);
  assert.deepEqual(turler({ digerleri: [{ ...o, bas: "2026-11-12T13:00", bit: "2026-11-12T13:30" }] }), []);
});

test("tesisler arası geçiş: başka tesisteki kontrolle ara, firmanın süresinden kısa; aynı tesis ve ayar 0 denetlenmez", () => {
  const o = { no: "FL-1126-020", bas: "2026-11-12T12:40", bit: "2026-11-12T13:22", tesis: "B" };
  assert.deepEqual(sapmalar({ ...TEMIZ, digerleri: [o] }), [{ tur: "gecis", metin: "Başka tesisteki FL-1126-020 raporunun kontrolüyle arası 8 dk. İki tesis arası en az süre 15 dk." }]);
  assert.deepEqual(turler({ digerleri: [{ ...o, tesis: "A" }] }), []);
  assert.deepEqual(turler({ digerleri: [o], tesisArasiDk: 0 }), []);
  assert.deepEqual(turler({ digerleri: [{ ...o, bit: "2026-11-12T13:15" }] }), [], "tam 15 dk ara sapma değil");
  /* sonraki kontrol başka tesiste hemen başlıyorsa da */
  assert.deepEqual(turler({ digerleri: [{ ...o, bas: "2026-11-12T14:10", bit: "2026-11-12T14:40" }] }), ["gecis"]);
});

test("plan günü dışı ve saat dışı fotoğraf (5 dakika pay)", () => {
  assert.deepEqual(sapmalar({ ...TEMIZ, planBas: "2026-11-13", planBit: "2026-11-13" }), [{ tur: "gun", metin: "Kontrol 12.11.2026 günü yapıldı; plan 13.11.2026." }]);
  assert.deepEqual(turler({ planBas: "2026-11-10", planBit: "2026-11-11" }), ["gun"]);
  assert.deepEqual(sapmalar({ ...TEMIZ, fotolar: [{ ad: "a.jpg", cekim: "2026-11-12 13:12" }] }), [{ tur: "foto", metin: "Bir fotoğraf kontrol saatleri dışında çekilmiş (12.11.2026 13:12)." }]);
  assert.deepEqual(turler({ fotolar: [{ ad: "a.jpg", cekim: "2026-11-12 13:25" }, { ad: "b.jpg", cekim: "2026-11-12 14:07" }] }), [], "5 dakika pay içinde");
  assert.deepEqual(turler({ fotolar: [{ ad: "a.jpg", cekim: "2026-11-12 13:24" }, { ad: "b.jpg", cekim: "2026-11-12 14:08" }] }), ["foto"]);
});

test("gerekçe: her sapmaya en az 10 karakter; eksikse gönderilmez, tamamsa sapma gerekçesiyle kayda geçer; bilinmeyen tür yok sayılır", () => {
  const l = sapmalar({ ...TEMIZ, bit: "2026-11-12T13:36", planBas: "2026-11-13", planBit: "2026-11-13" });
  assert.deepEqual(l.map((s) => s.tur), ["kisa", "gun"]);
  assert.deepEqual(sapmaKarari(l, {}), { eksik: l });
  assert.deepEqual(sapmaKarari(l, sapmaGerekceleri({ kisa: "Yalnız gözle muayene yapıldı", gun: " kısa " })), { eksik: [l[1]] });
  const g = sapmaGerekceleri({ kisa: "  Yalnız gözle muayene yapıldı ", gun: "Müşteri isteğiyle öne alındı", baska: "bilinmeyen tür", foto: 5 });
  assert.deepEqual(g, { kisa: "Yalnız gözle muayene yapıldı", gun: "Müşteri isteğiyle öne alındı" });
  assert.deepEqual(sapmaKarari(l, g), { kayit: [{ ...l[0], gerekce: "Yalnız gözle muayene yapıldı" }, { ...l[1], gerekce: "Müşteri isteğiyle öne alındı" }] });
  assert.deepEqual(sapmaKarari([], {}), { kayit: [] }, "sapma yoksa gerekçe istenmez");
  for (const bozuk of [null, undefined, "x", 5]) assert.deepEqual(sapmaGerekceleri(bozuk), {});
});
