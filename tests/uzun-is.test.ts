/* NEREDEN GELDİ: kalıp 12 UZUN TUŞ KİLİDİ (reisim 2026-09-12: "PDF indir'e tekrar bastım, 2 kere indirdi, çakışma oldu"). Davranış testi:
   iş sürerken ikinci çağrı undefined, iş bir kez koşar; bitince ve hata verince kilit açılır; hata yutulmaz. K0 (2026-10-03). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { uzunIsKilidi } from "../src/components/tus/uzunIs.ts";

test("iş sürerken ikinci basış yok sayılır, iş bir kez koşar; bitince yeniden basılır", async () => {
  const k = uzunIsKilidi();
  let kosu = 0;
  let bitir!: () => void;
  const is = () => new Promise<string>((r) => { kosu++; bitir = () => r("tamam"); });
  const ilk = k.calistir(is);
  assert.ok(ilk);
  assert.equal(k.mesgul, true);
  assert.equal(k.calistir(is), undefined);
  assert.equal(kosu, 1);
  bitir();
  assert.equal(await ilk, "tamam");
  assert.equal(k.mesgul, false);
  const ikinci = k.calistir(is);
  assert.ok(ikinci);
  assert.equal(kosu, 2);
  bitir(); await ikinci;
});

test("hata verince kilit açılır, hata yutulmaz; adım bildirilir", async () => {
  const k = uzunIsKilidi();
  const adimlar: string[] = [];
  await assert.rejects(k.calistir(async (ilerle) => { ilerle("PDF hazırlanıyor"); throw new Error("depo yanıt vermedi"); }, (a) => adimlar.push(a))!, /depo yanıt vermedi/);
  assert.equal(k.mesgul, false);
  assert.deepEqual(adimlar, ["PDF hazırlanıyor"]);
});
