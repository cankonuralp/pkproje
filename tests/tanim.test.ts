/* NEREDEN GELDİ: ARKA-UC §2.1 (sabit tanımlar sürümlü, karma adlı JSON; firma verisi değil) · KOD-GECIS §5, §7, §8 · K1 "tanım JSON'ları · API sürümü"
   (2026-10-04). AYNA: durum adları = onaylı maket (MV.PLAN_DURUM, MV.RAPOR_DURUM); eğri çarpanları = KOD-GECIS §8. Karma içerikten (anahtar sırası
   değiştirmez), içerik değişince ad değişir. API: eski istemci 426. Olumsuz kanıt: tests/bozan/tanim.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { EN_AZ_ISTEMCI, istemciEskiMi } from "../src/server/api-surum.ts";
import { duzenliJson, TANIM_DOSYALARI, TANIM_SEMALARI, TANIMLAR } from "../src/tanim/tanimlar.ts";
import { oku } from "./yardimci/denetimler.ts";

test("her tanım şemadan geçer; dosya adı <ad>.<12 hane karma>.json; adlar eşsiz", () => {
  for (const t of TANIM_DOSYALARI) {
    assert.match(t.dosya, new RegExp(`^${t.ad}\\.[0-9a-f]{12}\\.json$`));
    assert.doesNotThrow(() => TANIM_SEMALARI[t.ad].parse(JSON.parse(t.govde)));
  }
  assert.equal(new Set(TANIM_DOSYALARI.map((t) => t.dosya)).size, TANIM_DOSYALARI.length);
});

test("AYNA: plan ve rapor durum adları = onaylı maket (MV.PLAN_DURUM, MV.RAPOR_DURUM)", () => {
  const js = oku("docs/assets/maket-veri.js");
  const al = (ad: string) => {
    const m = new RegExp(`MV\\.${ad} = (\\{[\\s\\S]*?\\n?\\s*\\});`).exec(js);
    assert.ok(m, ad);
    const o = vm.runInNewContext(`(${m[1]})`) as Record<string, { ad: string; rozet: string }>;
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ad: v.ad, rozet: v.rozet.replace("a-rozet-", "") }]));
  };
  assert.deepEqual(TANIMLAR.durumlar.plan, al("PLAN_DURUM"));
  assert.deepEqual(TANIMLAR.durumlar.rapor, al("RAPOR_DURUM"));
});

test("AYNA: eğri çarpanları ve yasal mesai sınırları = KOD-GECIS", () => {
  const md = oku("KOD-GECIS.md");
  assert.ok(md.includes("eğri çarpanları (B 5 · C 10 · D 15)"));
  assert.deepEqual(TANIMLAR.egri_carpanlari, { B: 5, C: 10, D: 15 });
  assert.ok(md.includes("yıllık fazla çalışma ≤ 270 saat, günlük\n≤ 660 dk") || md.includes("yıllık fazla çalışma ≤ 270 saat, günlük ≤ 660 dk"));
});

test("karma: anahtar sırası değiştirmez; içerik değişince değişir", () => {
  assert.equal(duzenliJson({ b: 1, a: [2, { d: 3, c: 4 }] }), duzenliJson({ a: [2, { c: 4, d: 3 }], b: 1 }));
  assert.notEqual(duzenliJson({ a: 1 }), duzenliJson({ a: 2 }));
});

test("API sürümü: başlıksız istek (tarayıcı) geçer; eski, bozuk ya da negatif istemci sürümü 426'ya düşer", () => {
  assert.equal(istemciEskiMi(null), false);
  assert.equal(istemciEskiMi(String(EN_AZ_ISTEMCI)), false);
  for (const b of [String(EN_AZ_ISTEMCI - 1), "abc", "-1", "1.5", "", "1e3", "9999999"]) assert.equal(istemciEskiMi(b), true, b);
});
