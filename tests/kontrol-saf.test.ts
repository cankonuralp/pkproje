/* NEREDEN GELDİ: 2026-11-12 — reisim: "yazılan süre ile ekipman başında geçirilen süre uymalı log kayıtları düzgün olmalı", "ara verme olmasın"
   (göç 0128; pkproje.md §11 K2, K11). Kontrol kaydının iki saf kuralı: (1) rapora yazılan saat düzeltme varsa O, yoksa ölçülen — ölçülen kayıtta
   kalır; (2) kontrol ancak bitirilince ya da saati gerekçeyle yazılınca "bitti"dir (bitmemiş kontrolle rapor onaya gitmez). Veritabanı tarafı
   tests/raporlar.test.ts "kontrol saati (0128)". Olumsuz kanıt: tests/bozan/kontrol.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { etkinSaat, kontrolDurumu, type KontrolSatiri } from "../src/modules/raporlar/server/kontrol.ts";
import { KontrolDuzeltme } from "../src/modules/raporlar/sema.ts";

const T = (s: string) => new Date(`2026-11-12T${s}:00+03:00`);
const satir = (k: Partial<KontrolSatiri>): KontrolSatiri => ({ id: "x", kaynak: "sunucu", basladi: null, bitti: null, duz_bas: null, duz_bit: null, duz_gerekce: null,
  duz_zaman: null, duz_kim: null, surum: 0, bit_kaynak: null, cihaz_kanit: null, saat_tutmadi: false, ...k });

test("kontrol durumu: kayıt yoksa yok; ölçülüp bitirilmemiş sürüyor; bitirilmiş ya da saati gerekçeyle yazılmış bitti", () => {
  assert.equal(kontrolDurumu(null), "yok");
  assert.equal(kontrolDurumu(satir({ basladi: T("13:30") })), "suruyor");
  assert.equal(kontrolDurumu(satir({ basladi: T("13:30"), bitti: T("14:02") })), "bitti");
  assert.equal(kontrolDurumu(satir({ kaynak: "elle", duz_bas: T("13:30"), duz_bit: T("14:00"), duz_gerekce: "Bağlantı yoktu, saat elle yazıldı", duz_kim: "Deneme" })), "bitti");
});

test("rapora yazılan saat: düzeltme varsa düzeltilen, yoksa ölçülen; sürerken bitiş boş", () => {
  assert.deepEqual(etkinSaat(satir({ basladi: T("13:30") })), { bas: T("13:30"), bit: null });
  assert.deepEqual(etkinSaat(satir({ basladi: T("13:30"), bitti: T("14:02") })), { bas: T("13:30"), bit: T("14:02") });
  const duz = satir({ basladi: T("13:30"), bitti: T("13:36"), duz_bas: T("13:30"), duz_bit: T("14:05"), duz_gerekce: "Tuşa erken basıldı", duz_kim: "Deneme" });
  assert.deepEqual(etkinSaat(duz), { bas: T("13:30"), bit: T("14:05") });
  assert.deepEqual([duz.basladi, duz.bitti], [T("13:30"), T("13:36")], "ölçülen değer kayıtta kalır");
});

test("saat düzeltme şeması: başlangıç ve bitiş zorunlu, bitiş başlangıçtan sonra, gerekçe en az 10 karakter", () => {
  const hata = (g: Record<string, unknown>) => {
    const r = KontrolDuzeltme.safeParse({ bas: "2026-11-12T13:30", bit: "2026-11-12T14:00", gerekce: "Tuşa geç basıldı", ...g });
    return r.success ? null : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
  };
  assert.equal(hata({}), null);
  assert.deepEqual(hata({ gerekce: " kısa  " }), { gerekce: "Gerekçe en az 10 karakter olmalı." });
  assert.deepEqual(hata({ bit: "2026-11-12T13:30" }), { bit: "Bitiş başlangıçtan sonra olmalı." });
  assert.deepEqual(hata({ bas: "" }), { bas: "Başlangıç tarihi ve saati seçilmeli." });
  assert.deepEqual(hata({ bit: null }), { bit: "Bitiş tarihi ve saati seçilmeli." });
});
