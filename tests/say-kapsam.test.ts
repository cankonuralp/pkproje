/* NEREDEN GELDİ: 2026-10-31, kalem 11 — M5 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; "hiçbir eksik kalmasın"ın güvencesi). Ekranın her sunucu
   eylemi S.A.Y'da bir işleme ya da ekran aracına karşılık gelir, bilerek dışarıdadır ya da eksik olarak (nedeniyle) yazılıdır. Yeni bir ekran eylemi tabloya
   girmeden bu test geçmez; tablodaki işlem katalogda, araç ekran araçlarında olmalı; eksik sayısı yalnız azalır (EKSIK_EN_COK). Olumsuz kanıt: bozan say-kapsam. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { KAPSAM } from "../src/modules/say/kapsam.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";
import { EKRAN_ARAC_ADLARI } from "../src/server/yz/say.ts";

/** eksik karşılık sayısının üst sınırı — bir eksik kapanınca bu sayı da düşürülür (yükselmez) */
export const EKSIK_EN_COK = 29;

export function eylemDosyalari(kok = "src/modules"): Record<string, string[]> {
  const l: Record<string, string[]> = {};
  for (const m of readdirSync(kok)) {
    let ui: string[] = [];
    try { ui = readdirSync(join(kok, m, "ui")); } catch { continue; }
    for (const d of ui.filter((x) => /eylem.*\.ts$/.test(x))) {
      const s = readFileSync(join(kok, m, "ui", d), "utf8");
      if (!/^"use server";/m.test(s)) continue;
      l[`${m}/ui/${d}`] = [...s.matchAll(/^export async function ([A-Za-z0-9_]+)/gm)].map((x) => x[1]!);
    }
  }
  return l;
}

test("her ekran eylemi tabloda; tablodaki her eylem ekranda", () => {
  const e = eylemDosyalari();
  assert.ok(Object.keys(e).length >= 20);
  for (const [d, adlar] of Object.entries(e)) {
    for (const a of adlar) assert.ok(KAPSAM[d]?.[a], `${d} ${a}: S.A.Y kapsam tablosunda yok (src/modules/say/kapsam.ts) — işlem, araç, dışarıda ya da eksik olarak yaz`);
    for (const a of Object.keys(KAPSAM[d] ?? {})) assert.ok(adlar.includes(a), `${d} ${a}: tabloda var, ekranda yok`);
  }
  for (const d of Object.keys(KAPSAM)) assert.ok(e[d], `${d}: tabloda var, eylem dosyası yok`);
});

test("karşılıklar geçerli: işlem katalogda, araç ekranda; eksikler sınırın altında", () => {
  let eksik = 0;
  for (const [d, l] of Object.entries(KAPSAM)) for (const [a, k] of Object.entries(l)) {
    const [t, ...g] = k.split(":"), v = g.join(":");
    assert.ok(["i", "a", "d", "e"].includes(t!) && v.trim(), `${d} ${a}: biçim`);
    if (t === "i") assert.ok(ISLEM_KATALOGU.some((x) => x.ad === v), `${d} ${a}: ${v} katalogda yok`);
    if (t === "a") assert.ok(EKRAN_ARAC_ADLARI.has(v), `${d} ${a}: ${v} ekran aracı değil`);
    if (t === "e") eksik++;
  }
  assert.ok(eksik <= EKSIK_EN_COK, `eksik ${eksik} > ${EKSIK_EN_COK}: yeni eylem S.A.Y'sız kalmasın`);
  assert.equal(eksik, EKSIK_EN_COK, "eksik kapandıysa EKSIK_EN_COK'u da düşür");
});
