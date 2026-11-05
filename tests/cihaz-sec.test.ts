/* NEREDEN GELDİ: 2026-11-06 (reisim: "bir denetçinin 1 kere kullandığı kontrol cihazı ona atalı ise … tekrar her muayene de seçmesine gerek
   kalmasın otomatik seçili gelsin. uygun cihaz otomatik seçili olsun") — src/modules/raporlar/cihaz-sec.ts. Yeni raporda tür başına: yazanın
   zimmetindeki uygun (pasif değil, lab'da değil, kalibrasyonu geçerli) cihazlardan en son kullandığı; hiç kullanmadıysa tek aday; birden çok
   kullanılmamış aday ya da depodaki cihaz seçilmez. Bozan: tests/bozan/cihaz-sec.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { otomatikCihazlar, type OtoAday } from "../src/modules/raporlar/cihaz-sec.ts";

const MAN = "11111111-1111-4111-8111-111111111111", TER = "22222222-2222-4222-8222-222222222222";
const c = (id: string, turId: string, x: Partial<OtoAday> = {}): OtoAday => ({ id, turId, pasif: false, lab: false, gecti: false, zimmette: true, ...x });

test("en son kullanılan zimmetteki uygun cihaz seçilir; tür başına bir", () => {
  const son = new Map([["mn1", "2026-10-01T09:00:00"], ["mn2", "2026-11-01T09:00:00"]]);
  assert.deepEqual(otomatikCihazlar([MAN], [c("mn1", MAN), c("mn2", MAN), c("mn3", MAN)], son), [{ tur: MAN, cihaz: "mn2" }]);
});

test("kullanılan cihaz artık uygun değilse (zimmetten çıktı, pasif, lab, kalibrasyonu geçti) sıradaki kullanılan seçilir", () => {
  const son = new Map([["mn1", "2026-10-01T09:00:00"], ["mn2", "2026-11-01T09:00:00"]]);
  for (const bozuk of [{ zimmette: false }, { pasif: true }, { lab: true }, { gecti: true }]) {
    assert.deepEqual(otomatikCihazlar([MAN], [c("mn1", MAN), c("mn2", MAN, bozuk)], son), [{ tur: MAN, cihaz: "mn1" }], JSON.stringify(bozuk));
  }
});

test("hiç kullanılmamışsa: tek uygun aday seçilir; birden çoksa seçim denetçinin; depodaki cihaz seçilmez", () => {
  const bos = new Map<string, string>();
  assert.deepEqual(otomatikCihazlar([MAN, TER], [c("mn1", MAN), c("tm1", TER), c("tm2", TER)], bos), [{ tur: MAN, cihaz: "mn1" }]);
  assert.deepEqual(otomatikCihazlar([MAN], [c("mn1", MAN, { zimmette: false })], bos), [], "depodaki tek cihaz");
  assert.deepEqual(otomatikCihazlar([MAN], [c("mn1", MAN, { gecti: true })], bos), [], "kalibrasyonu geçmiş tek cihaz");
  assert.deepEqual(otomatikCihazlar([MAN], [c("tm1", TER)], bos), [], "başka türün cihazı");
});
