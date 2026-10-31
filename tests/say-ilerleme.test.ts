/* NEREDEN GELDİ: 2026-10-31 — reisim: "sadece düşünüyor, çalışıyor yazmasın termin süresi ve yüzdelik bar olsun". S.A.Y'ın bekleme balonunda tahmini süre
   ve yüzde (src/modules/say/ilerleme.ts). Bu kilit tutar: (1) tahmin aynı türden işlerin süresinin ortancası, yoksa türün başlangıcı; geçmiş tür başına
   en çok 10; (2) adımsız işte yüzde yükselir ama iş bitmeden %95'i geçmez, tahmin aşılınca kalan süre yerine "biraz daha sürüyor"; (3) adımlı işte
   (okuma "3 / 10") yüzde adımdan, kalan süre adım başına ortalamadan; (4) ekran çubuğu gösterir. Olumsuz kanıt: bozan say-ilerleme. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { adimOku, ilerleme, isTuru, sureEkle, sureYaz, tahminSn } from "../src/modules/say/ilerleme.ts";
import { oku } from "./yardimci/denetimler.ts";

test("tahmin: ortanca, başlangıç; geçmiş sınırlı", () => {
  assert.equal(tahminSn("serbest", {}), 25);
  assert.equal(tahminSn(isTuru({ sablon: "S1" }), {}), 90);
  assert.equal(tahminSn("oku", { oku: [10, 50, 20] }), 20);
  let g: Record<string, number[]> = {};
  for (let i = 1; i <= 14; i++) g = sureEkle(g, "ekli", i);
  assert.deepEqual(g.ekli, [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  assert.deepEqual(sureEkle({}, "x", Number.NaN), {});
});

test("adımsız: %95'i geçmez, tahmin aşılınca 'biraz daha'", () => {
  const a = ilerleme(5, 20), b = ilerleme(15, 20), c = ilerleme(200, 20);
  assert.ok(a.yuzde < b.yuzde && b.yuzde < c.yuzde);
  assert.equal(a.kalanSn, 15);
  assert.ok(c.yuzde <= 95 && c.asildi && c.kalanSn === null);
  assert.equal(ilerleme(0, 20).yuzde, 0);
});

test("adımlı: yüzde adımdan, kalan adım başına ortalamadan", () => {
  assert.deepEqual(adimOku("3 / 10 · Pano"), { i: 3, n: 10 });
  assert.equal(adimOku("Okuyor"), null);
  /* 2 adım 20 sn sürdü (adım 10 sn), 3. adım 5 sn'dir sürüyor */
  const p = ilerleme(25, 40, { i: 3, n: 10, adimBasSn: 5 });
  assert.equal(p.yuzde, 25);
  assert.equal(p.kalanSn, 75);
  assert.equal(sureYaz(75), "yaklaşık 1 dk");
  assert.equal(sureYaz(12.4), "yaklaşık 12 sn");
});

test("ekran: bekleme balonunda çubuk ve kalan süre", () => {
  const s = oku("src/modules/say/ui/SayAsistan.tsx");
  assert.ok(s.includes('role="progressbar"') && s.includes("<BeklemeCubugu") && s.includes("biraz daha sürüyor"));
});

/* 2026-10-31 (reisim: "işaretlediğim yere tam ekran tuşu ekle, tıklayınca pop up olarak ekranda daha büyük gözüksün, güzel de bir geçiş animasyonu
   ekle"): önerilerin satırında tam ekran tuşu; büyük görünüm perdeli, FLIP geçişli, Esc ve perde normal boya döndürür; hareketi azalt tercihinde animasyon yok */
test("ekran: tam ekran tuşu, perde, geçiş, Esc", () => {
  const s = oku("src/modules/say/ui/SayAsistan.tsx"), c = oku("src/modules/say/ui/say.module.css");
  assert.ok(s.includes('data-say-tam=""') && s.includes('aria-pressed={tam}') && s.includes('<Ikon ad={tam ? "minimize-2" : "maximize-2"}'));
  assert.ok(s.includes("data-tam={(tam && !kucuk) || undefined}") && s.includes("onClick={() => tamDegistir(false)}"), "perde kapatır");
  assert.ok(s.includes("else if (tam) tamDegistir(false); else kapat();"), "Esc önce normal boya döner");
  assert.ok(s.includes("p.animate(") && s.includes('matchMedia("(prefers-reduced-motion: reduce)").matches'), "geçiş, hareketi azalt tercihine uyar");
  assert.match(c, /\.panel\[data-tam\] \{/);
  assert.match(c, /@media \(max-width: 767\.98px\) \{\n  \.tamTus, \.perde \{ display: none; \}/, "telefonda panel zaten tam ekran");
});
