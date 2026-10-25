/* NEREDEN GELDİ: reisim 2026-10-25 — "Claude Haiku 5.5" S.A.Y başlığında, Firma ayarlarında ve S.A.Y'ın kendi cevabında görünüyordu; model adı
   ekranda, e-postada, PDF'te hiçbir yerde yazmaz. src/ altında (yorumlar hariç) Haiku / Sonnet / Opus / Claude yazısı yok; model kimliği
   ("claude-haiku-5-5", küçük harf) kalır. Olumsuz kanıt: tests/bozan/arayuz-model-adi.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, modelAdiBulgulari, oku } from "./yardimci/denetimler.ts";

test("src altındaki kodda (yorum dışı) model adı yazmaz", () => {
  const bulgu = dosyalar("src", [".ts", ".tsx"]).flatMap((d) => modelAdiBulgulari(oku(d)).map((b) => `${d}:${b}`));
  assert.deepEqual(bulgu, []);
});

test("saf denetim: dizge ve JSX metnindeki ad yakalanır, yorum ve model kimliği yakalanmaz", () => {
  assert.equal(modelAdiBulgulari('const a = "Claude Haiku 5.5";').length, 1);
  assert.equal(modelAdiBulgulari("<p>Haiku</p>").length, 1);
  assert.equal(modelAdiBulgulari('// Haiku\n/* Opus */\nconst m = "claude-haiku-5-5";').length, 0);
});
