/* NEREDEN GELDİ: 489 — hata listesi 43 kararı (reisim 2026-10-11: "karar bekleyen sorularda önerilerini kabul ediyorum"; öneri: "denemeleri yayındaki
   gibi derlenmiş uygulamada koşmak … yalnız deneme ortamında iki güvenlik ayarını gevşetmek gerekiyor"). Uçtan uca deneme yayın derlemesinde
   (scripts/e2e-sunucu.ts, ci.yml); iki gevşetme YALNIZ PROBATA_E2E_YAYIN=1 ve YALNIZ yerel adreste. Bu kilit bayrağın başka yere yayılmadığını,
   yerel adres sınırının kalkmadığını, Vercel ayarına girmediğini denetler; canlıda duman testi (tools/duman.mjs) iki başlığı ölçer.
   Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, e2eYayinBayragiEksikleri, oku } from "./yardimci/denetimler.ts";

test("uçtan uca yayın bayrağı: yalnız ara katman ve vitrin kapısında, yalnız yerel adreste; Vercel ayarında yok", () => {
  const kaynaklar = dosyalar("src", [".ts", ".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(e2eYayinBayragiEksikleri({ proxy: oku("src/proxy.ts"), vitrinAcik: oku("src/app/(gelistirme)/vitrin-acik.ts"),
    duzen: oku("src/app/(gelistirme)/layout.tsx"), vercel: oku("vercel.json"), kaynaklar }), []);
});

test("deneme makinesi uçtan ucu yayın derlemesiyle koşar; tools/duman.mjs canlıda iki gevşetmenin kapalı olduğunu ölçer", () => {
  const ci = oku(".github/workflows/ci.yml");
  assert.match(ci, /name: Yayın derlemesi \(uçtan uca için\)\n\s+env:\n\s+PROBATA_E2E_YAYIN: "1"\n\s+run: node scripts\/next\.ts build/);
  assert.match(ci, /PROBATA_E2E_YAYIN: "1"\n\s+run: npm run test:e2e/);
  const duman = oku("tools/duman.mjs");
  assert.match(duman, /upgrade-insecure-requests/);
  assert.match(duman, /\$\{FIRMA\}\/vitrin`\);\n\s+return r\.status === 404/);
});
