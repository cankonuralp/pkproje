/* NEREDEN GELDİ: TASARIM-KALIBI yöntemi ("onaylı gerçek ekranı referans al, ölçümü yaz, kuralı ölçen bir testle
   mekanik olarak zorla") + reisim 2026-09-23 "tüm önerilerin uygun" → referans ekran (Planlar + plan içi) DONDU
   (pkproje.md §3.3). Sayılar src/styles/kalip.ts'te; bu test onları değişkenlere, kabuğa ve onaylı makete bağlar.
   Kabul edilen / reddedilen: denetim 34/44 (reddedilen 40/48) · kart eşiği 960 (reddedilen 1.180).
   Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { KALIP } from "../src/styles/kalip.ts";
import { degiskenDegeri, oku } from "./yardimci/denetimler.ts";

const tokens = oku("src/styles/tokens.css");
const ORTA = `(max-width: ${KALIP.bant.genis - 0.02}px)`;
const DAR = `(max-width: ${KALIP.bant.orta - 0.02}px)`;

test("denetim yüksekliği: fareyle 34, orta bantta ve dokunmatikte 44", () => {
  assert.equal(degiskenDegeri(tokens, "--tus-y", null), `${KALIP.tusY.fare}px`);
  assert.equal(degiskenDegeri(tokens, "--tus-y", ORTA), `${KALIP.tusY.dokunmatik}px`);
  assert.equal(degiskenDegeri(tokens, "--tus-y", "(pointer: coarse)"), `${KALIP.tusY.dokunmatik}px`);
});

test("yazı ölçeği", () => {
  const y = KALIP.yazi;
  assert.equal(degiskenDegeri(tokens, "--boy-baslik", null), `${y.baslik}px`);
  assert.equal(degiskenDegeri(tokens, "--boy-baslik", DAR), `${y.baslikTelefon}px`);
  assert.equal(degiskenDegeri(tokens, "--boy-bolum", null), `${y.bolum}px`);
  assert.equal(degiskenDegeri(tokens, "--boy-govde", null), `${y.govde}px`);
  assert.equal(degiskenDegeri(tokens, "--boy-govde", ORTA), `${y.govdeDokunmatik}px`);
  assert.equal(degiskenDegeri(tokens, "--boy-kucuk", null), `${y.kucuk}px`);
  assert.equal(degiskenDegeri(tokens, "--boy-etiket", null), `${y.etiket}px`);
});

test("kabuk: yan menü 232, üst çubuk 52; kabuk yalnız kalıbın bantlarını kullanır", () => {
  assert.equal(degiskenDegeri(tokens, "--cubuk-gen", null), `${KALIP.kabuk.cubukGenislik}px`);
  assert.equal(degiskenDegeri(tokens, "--ust-y", null), `${KALIP.kabuk.ustYukseklik}px`);
  const kabuk = oku("src/components/kabuk/Kabuk.module.css");
  assert.ok(kabuk.includes(`@media ${ORTA}`));
  const eşikler = [...kabuk.matchAll(/@media \(max-width: ([\d.]+)px\)/g)].map((m) => Number(m[1]));
  assert.ok(eşikler.every((e) => e === KALIP.bant.genis - 0.02 || e === KALIP.bant.orta - 0.02), `kalıp dışı eşik: ${eşikler}`);
});

test("onaylı maket aynı sayıları taşıyor: kart eşiği 960, sayfa ekipman 10 · rapor 20", () => {
  assert.ok(oku("docs/assets/maket.css").includes(`@container liste (max-width: ${KALIP.kartEsigi - 0.02}px)`));
  assert.ok(oku("docs/assets/maket.js").includes(`var SAYFA = { e: ${KALIP.sayfa.ekipman}, r: ${KALIP.sayfa.rapor} };`));
});
