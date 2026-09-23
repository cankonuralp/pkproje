/* NEREDEN GELDİ: anayasa 2.5 (ikon = SVG) + 5.2 (kendi kökenimizden) + maket 5. tur (yeni 10 ikon, eski dosya
   önbellekte kalınca menü ikonsuz göründü). Kullanılan her ikon adı dosyada var; uygulamanın ikon dosyası maketinkiyle
   aynı (iki kopya ayrışmaz). Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { eksikIkonlar, kullanilanIkonlar, oku } from "./yardimci/denetimler.ts";

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
