/* NEREDEN GELDİ: anayasa 2.5 (ikon = SVG) + 5.2 (kendi kökenimizden) + maket 5. tur (yeni 10 ikon, eski dosya
   önbellekte kalınca menü ikonsuz göründü). Kullanılan her ikon adı dosyada var; uygulamanın ikon dosyası maketinkiyle
   aynı (iki kopya ayrışmaz). Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, eksikIkonlar, kullanilanIkonlar, maketIkonlari, oku } from "./yardimci/denetimler.ts";

const IKON_DOSYASI = "public/vendor/lucide-1.47.0/ikonlar.svg";

test("kullanılan her ikon ikon dosyasında var", () => {
  const dosya = oku(IKON_DOSYASI);
  const adlar = kullanilanIkonlar();
  assert.ok(adlar.length >= 17);
  assert.deepEqual(eksikIkonlar(adlar, dosya), []);
});

test("uygulamanın ikon dosyası maketinkiyle aynı", () => {
  assert.equal(oku(IKON_DOSYASI), oku("docs/vendor/lucide-1.47.0/ikonlar.svg"));
});

/* 2026-09-24 (toplu maket M3): onaylı Planlar maketinin sayfalayıcısında "önceki sayfa" tuşu BOŞTU — chevron-left ikon
   dosyasında yoktu; kilit yalnız uygulamayı (src) taradığı için görülmemişti. Maketler de taranır. */
test("maket betiklerinde ve sayfalarında kullanılan her ikon ikon dosyasında var", () => {
  const metinler = [...dosyalar("docs/assets", [".js"]), ...dosyalar("docs/maket", [".html"])].map(oku);
  const adlar = maketIkonlari(metinler);
  assert.ok(adlar.length >= 40, `yalnız ${adlar.length} ikon bulundu (boş tarama yalancı geçer)`);
  assert.deepEqual(eksikIkonlar(adlar, oku("docs/vendor/lucide-1.47.0/ikonlar.svg")), []);
});
