/* NEREDEN GELDİ: anayasa 3.1 (bir eksik parantez bütün siteyi medya bloğuna düşürdü), 2.9 (tanımsız var(--sans)
   29 yerde kullanılıyordu, kısayolun tamamı geçersizdi), 13.2 (aynı ad sessizce ezer; EKSIKLER 12: modül sisteminde
   "aynı seçici" taraması). Uygulamanın BÜTÜN CSS'i ve TSX'i taranır. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ciftSeciciler, ciftTanimliDegiskenler, dosyalar, oku, parantezHatasi, tanimsizDegiskenler } from "./yardimci/denetimler.ts";

const CSS = dosyalar("src", [".css"]);
const TSX = dosyalar("src", [".tsx", ".ts"]);

test("CSS dosyaları bulundu (boş tarama yalancı geçer)", () => {
  assert.ok(CSS.length >= 5, `yalnız ${CSS.length} CSS dosyası`);
});

test("her CSS dosyasında parantezler dengeli", () => {
  const hatali = CSS.map((d) => [d, parantezHatasi(oku(d))]).filter(([, h]) => h);
  assert.deepEqual(hatali, []);
});

test("kullanılan her var(--x) tanımlı (CSS ve TSX)", () => {
  const metinler = [...CSS, ...TSX].map(oku);
  assert.deepEqual(tanimsizDegiskenler(metinler, CSS.map(oku)), []);
});

/* CIRCIR (anayasa 13.2c): bilinen çift bloklar gerekçesiyle burada; YENİSİ yasak, liste yalnız küçülür (çift kalkınca
   satır da silinir — yoksa test düşer). Ezme tehlikesi ayrıca kesin kilitli: aynı değişken iki blokta tanımlanamaz. */
const BILINEN_CIFTLER: Record<string, string> = {
  "src/styles/tokens.css: :root": "değişken grupları ayrı blokta (ölçüler · birincil tuş kararı A); onaylı dosya, değer ezmesi yok",
};

test("medya dışında yeni çift seçici bloğu yok (cırcır)", () => {
  const cift = CSS.flatMap((d) => ciftSeciciler(oku(d)).map((s) => `${d}: ${s}`));
  assert.deepEqual(cift.filter((c) => !(c in BILINEN_CIFTLER)), [], "yeni çift blok");
  assert.deepEqual(Object.keys(BILINEN_CIFTLER).filter((b) => !cift.includes(b)), [], "kalkan çift listeden silinmeli");
});

test("aynı seçicinin bloklarında hiçbir değişken iki kez tanımlanmamış", () => {
  assert.deepEqual(CSS.flatMap((d) => ciftTanimliDegiskenler(oku(d)).map((s) => `${d}: ${s}`)), []);
});
