/* NEREDEN GELDİ: 465 — reisim 2026-10-09 (hata listesi 7): "ayrıca excelden aktarma gibi seçenekler de olmalı". Plan aç › Ekipmanlar › "Excel'den
   yükle": src/modules/planlar/excel.ts planExcelSatirlari (saf). Kod ve tür zorunlu; kod plan şemasıyla aynı biçimde (A–Z 0–9 tire, 3–20); tür adla
   ya da kodla; başlık satırı atlanır; tesiste kayıtlı / dosyada ya da listede tekrar eden kod gerekçesiyle atlanır; konum en çok 60. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { planExcelSatirlari, planSablonExceli, PLAN_SABLON_BASLIK } from "../src/modules/planlar/excel.ts";
import { tabloOku } from "../src/components/disa/oku.ts";

const TURLER = [{ id: "t1", ad: "Hava tankı", kod: "HT" }, { id: "t2", ad: "Forklift" }];

test("satırlar: başlık atlanır, tür adla / kodla, kod büyük harfe; gerekçeli atlamalar", () => {
  const l = planExcelSatirlari([
    ["Kod", "Ekipman türü", "Konum"],
    ["ht-0101", "hava tankı", "Kazan dairesi"],
    ["HT-0102", "HT", ""],
    ["", "Forklift", "Depo"],
    ["FK-01", "Vinç", ""],
    ["FK ç1", "Forklift", ""],
    ["HT-0101", "Hava tankı", ""],
    ["HT-0200", "Hava tankı", ""],
    ["HT-0300", "Hava tankı", ""],
    ["FK-0400", "Forklift", "x".repeat(61)],
    ["", "", ""],
  ], TURLER, ["HT-0200"], ["HT-0300"]);
  assert.deepEqual(l.map((x) => [x.satir, x.kod, x.tur, x.ok, x.neden]), [
    [2, "HT-0101", "t1", true, ""],
    [3, "HT-0102", "t1", true, ""],
    [4, "", "t2", false, "Kod yok, atlanır"],
    [5, "FK-01", "", false, "Tür bulunamadı, atlanır"],
    [6, "FKç1", "t2", false, "Kodda yalnız A–Z, 0–9 ve tire olabilir (Türkçe harf ve boşluk yok). Atlanır."],
    [7, "HT-0101", "t1", false, "Kod dosyada iki kez, atlanır"],
    [8, "HT-0200", "t1", false, "Tesiste kayıtlı; zaten plana girer"],
    [9, "HT-0300", "t1", false, "Kod listede zaten var, atlanır"],
    [10, "FK-0400", "t2", false, "Konum en çok 60 karakter, atlanır"],
  ]);
  /* başlıksız dosya: ilk satır veri */
  assert.equal(planExcelSatirlari([["H9", "Hava tankı", ""]], TURLER)[0].neden, "Kod 3 ile 20 hane arasında olmalı. Atlanır.");
  assert.equal(planExcelSatirlari([["HT-900", "Hava tankı", ""]], TURLER)[0].ok, true);
});

test("şablon: okuyucu geri okur — başlık + örnek satır, örnek satır geçerli", async () => {
  const ham = await tabloOku("sablon.xlsx", planSablonExceli("Hava tankı"));
  assert.deepEqual(ham[0], [...PLAN_SABLON_BASLIK]);
  const l = planExcelSatirlari(ham, TURLER);
  assert.deepEqual(l.map((x) => [x.kod, x.tur, x.konum, x.ok]), [["HT-0101", "t1", "Kazan dairesi", true]]);
});
