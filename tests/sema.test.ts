/* NEREDEN GELDİ: KOD-GECIS §2 "girdi doğrulama tek şema kitaplığı (sunucu ve istemci aynı şemayı paylaşır)" — K0'ın son kalemi (2026-10-03).
   Kurallar onaylı maketten ve kararlardan: parola karar 37 (en az 10, harf + rakam) · ekipman kodu (A–Z 0–9 tire 3–20, reisim: "eşsiz olmalı …
   personel el ile") · cihaz kodu 3–12 · fatura no e-fatura biçimi · tarih takvimde olmalı · para kuruş tam sayı (kayan nokta yok). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { cihazKodu, dogrula, ekipmanKodu, eposta, faturaNo, metin, parola, tarih, tutar, z, zaman } from "../src/sema/ortak.ts";

const ok = (s: z.ZodType, v: unknown) => s.parse(v);
const ileti = (s: z.ZodType, v: unknown) => { const r = s.safeParse(v); assert.equal(r.success, false, `geçmemeliydi: ${JSON.stringify(v)}`); return r.error!.issues[0].message; };

test("parola: en az 10, harf ve rakam (karar 37)", () => {
  assert.equal(ok(parola, "deneme1234"), "deneme1234");
  assert.equal(ok(parola, "çğışöü1234"), "çğışöü1234");
  assert.equal(ileti(parola, "kisa12"), "En az 10 karakter; harf ve rakam içermeli.");
  assert.equal(ileti(parola, "yalnizharfler"), "En az 10 karakter; harf ve rakam içermeli.");
  assert.equal(ileti(parola, "1234567890"), "En az 10 karakter; harf ve rakam içermeli.");
});

test("ekipman kodu: büyük harfe yerelden bağımsız, A–Z 0–9 tire 3–20; tireyle başlamaz / bitmez", () => {
  assert.equal(ok(ekipmanKodu, " kp-10 "), "KP-10");
  assert.equal(ok(ekipmanKodu, "ki-10"), "KI-10");
  assert.equal(ileti(ekipmanKodu, ""), "Ekipman kodu boş");
  for (const k of ["K", "-KP10", "KP10-", "KP--10", "KP_10", "Ş-10", "A".repeat(21)]) assert.equal(ileti(ekipmanKodu, k), "Kod: A–Z, 0–9, tire; 3–20 hane", k);
  assert.equal(ok(ekipmanKodu, "A".repeat(20)), "A".repeat(20));
});

test("cihaz kodu ve fatura no", () => {
  assert.equal(ok(cihazKodu, "mg-01"), "MG-01");
  assert.match(ileti(cihazKodu, "M1"), /3–12 hane/);
  assert.equal(ok(faturaNo, "abc2026000000123"), "ABC2026000000123");
  assert.match(ileti(faturaNo, "ABC202600000012"), /16 karakter/);
});

test("e-posta kırpılır ve küçülür; bozuk e-posta reddedilir", () => {
  assert.equal(ok(eposta, "  Kisi@Ornek.Example "), "kisi@ornek.example");
  assert.equal(ileti(eposta, "kisi@"), "Geçerli bir e-posta adresi yazılmalı.");
});

test("tarih ve zaman: takvimde olmayan gün ve saat reddedilir", () => {
  assert.equal(ok(tarih, "2028-02-29"), "2028-02-29");
  assert.equal(ileti(tarih, "2026-02-29"), "Takvimde olmayan bir gün.");
  assert.equal(ileti(tarih, "29.02.2026"), "Tarih GG.AA.YYYY biçiminde olmalı.");
  assert.equal(ok(zaman, "2026-10-03T23:59"), "2026-10-03T23:59");
  assert.equal(ileti(zaman, "2026-10-03T24:00"), "Tarih ve saat eksik ya da hatalı.");
});

test("tutar kuruş tam sayıya: Türkçe biçim, binlik nokta, kayan nokta yok", () => {
  assert.equal(ok(tutar, "1.234,56"), 123456);
  assert.equal(ok(tutar, "1234,5"), 123450);
  assert.equal(ok(tutar, "1250"), 125000);
  assert.equal(ok(tutar, "1 250,00 ₺"), 125000);
  assert.equal(ok(tutar, 0.1 + 0.2), 30);
  for (const v of ["-5", "12,345", "1.23,00", "abc", ""]) assert.equal(ileti(tutar, v), "Tutar sayı olmalı (ör. 1.250,00).", v);
});

test("metin kırpılır; dogrula alan → ileti haritası verir, zod iletileri Türkçe", () => {
  const sema = z.object({ ad: metin("Ad", 5), kod: ekipmanKodu, adet: z.number() });
  const r = dogrula(sema, { ad: "  ", kod: "x", adet: "iki" });
  assert.equal(r.tamam, false);
  if (r.tamam) return;
  assert.equal(r.hatalar.ad, "Ad yazılmalı.");
  assert.equal(r.hatalar.kod, "Kod: A–Z, 0–9, tire; 3–20 hane");
  assert.match(r.hatalar.adet, /[ğüşıöçİ]|sayı|beklen/i);
  const iyi = dogrula(sema, { ad: " Örnek ", kod: "kp-1", adet: 2 });
  assert.deepEqual(iyi, { tamam: true, veri: { ad: "Örnek", kod: "KP-1", adet: 2 } });
});
