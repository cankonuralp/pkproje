/* NEREDEN GELDİ: iş planı İ6 (2026-10-17; sunum 595 madde 8 — "her öğede tutamak (sürükle)"; reisim: "elindeki tüm işleri … sırala başla durmadan
   bitir"). Saf: sürükle-bırakın taşıması bugünkü bir adımlık işlevlerle adım adım kurulur — öğe (alan, sütun, madde) bırakıldığı öğenin önüne /
   arkasına, madde grup sınırını geçip hedefin grubuna; satırları varsayılandan gelen listeler (firma, imza) ilk değişiklikte tanıma yazılsa da doğru
   sıraya; hedef sırası; aynı yere bırakmak değiştirmez. Ekran (tutamak, işaretçi olayları) e2e/rapor-format.spec.ts'te. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { firmaSatirlari, imzaSatirlari } from "../src/format/duzen.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { firmaSatiriTasi, hedefSirasi, imzaSatiriTasi, ogeyeTasi, siraya } from "../src/modules/rapor-format/kurucu.ts";

const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const KOMP = () => FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const yer = (t: FormatTanimi, blok: string) => t.bolumler.findIndex((b) => b.blok === blok);

test("hedef sırası: önüne / arkasına, yukarıdan ve aşağıdan", () => {
  assert.equal(hedefSirasi(0, 3, true), 2);
  assert.equal(hedefSirasi(0, 3, false), 3);
  assert.equal(hedefSirasi(4, 1, true), 1);
  assert.equal(hedefSirasi(4, 1, false), 2);
});

test("öğe: alan bırakılan alanın arkasına / önüne; sütun yatayda; aynı yere bırakmak tanımı değiştirmez", () => {
  const t = KOMP(), i = t.bolumler.findIndex((b) => b.blok === "bilgi" && b.alanlar.length >= 4);
  const ad = (y: FormatTanimi) => (y.bolumler[i] as BolumOf<"bilgi">).alanlar.map((a) => a.id);
  const l = ad(t);
  assert.deepEqual(ad(ogeyeTasi(t, i, l[0], l[2], false)), [l[1], l[2], l[0], ...l.slice(3)]);
  assert.deepEqual(ad(ogeyeTasi(t, i, l[3], l[0], true)), [l[3], l[0], l[1], l[2], ...l.slice(4)]);
  assert.equal(ogeyeTasi(t, i, l[0], l[1], true), t, "zaten önünde");
  assert.equal(ogeyeTasi(t, i, l[0], l[0], true), t);
});

test("madde: grup sınırını geçer — bırakıldığı maddenin grubuna, önüne / arkasına", () => {
  const t = Z2(), i = t.bolumler.findIndex((b) => b.blok === "liste" && b.gruplar.length > 2);
  const gruplar = (y: FormatTanimi) => (y.bolumler[i] as BolumOf<"liste">).gruplar.map((g) => g.maddeler.map((m) => m.id));
  const g0 = gruplar(t);
  const m = g0[0][0], hedef = g0[2][1];
  const y = gruplar(ogeyeTasi(t, i, m, hedef, true));
  assert.deepEqual(y[2].slice(0, 3), [g0[2][0], m, hedef], "3. grupta hedefin önünde");
  assert.equal(y[0].includes(m), false);
  const z = gruplar(ogeyeTasi(t, i, g0[2][0], g0[0][0], false));
  assert.deepEqual(z[0].slice(0, 2), [g0[0][0], g0[2][0]], "1. grupta ilk maddenin arkasında");
  const son = gruplar(ogeyeTasi(t, i, g0[0][0], g0[1][0], true));
  assert.deepEqual([son[0].includes(g0[0][0]), son[1][0], son[1][1]], [false, g0[0][0], g0[1][0]], "grubun başına (bir önceki grubun sonunda kalmaz)");
});

test("sıralı liste: firma satırları ve imza satırları — ilk değişiklikte tanıma yazılsalar da doğru sıraya", () => {
  const t = KOMP();
  const kaynak = firmaSatirlari(t).map((s) => s.kaynak);
  const y = siraya(t, 4, 0, (x, p, yon) => firmaSatiriTasi(x, firmaSatirlari(x)[p].id, yon));
  assert.deepEqual(firmaSatirlari(y).map((s) => s.kaynak), [kaynak[4], ...kaynak.slice(0, 4), ...kaynak.slice(5)]);
  assert.ok(FormatTanimi.safeParse(y).success);
  const i = yer(t, "imza");
  const imza = (x: FormatTanimi) => imzaSatirlari(x.bolumler[i] as BolumOf<"imza">).map((s) => s.alan);
  const once = imza(t);
  const z = siraya(t, 0, hedefSirasi(0, once.length - 1, false), (x, p, yon) => imzaSatiriTasi(x, i, imzaSatirlari(x.bolumler[i] as BolumOf<"imza">)[p].id, yon));
  assert.deepEqual(imza(z), [...once.slice(1), once[0]], "ilk satır en sona");
  assert.equal(siraya(t, 2, 2, (x) => x), t, "aynı yer");
});
