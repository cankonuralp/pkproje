/* NEREDEN GELDİ: anayasa 2.4 + 12.5 (bayat kopya = yanlış kural). Onaylı renkler ve ölçüler iki yerde okunuyor:
   uygulama (src/styles/tokens.css, TEK KAYNAK) ve GitHub Pages'teki maket/sunum (docs/assets/tokens.css). İkisi
   ayrışırsa maket onaylanan ekranı göstermez. :root'tan sonrası bayt bayt aynı olmalı; kontrast ölçer (tools/palet-olc.mjs)
   tek kaynağı okur. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { oku, tokenGovdesi } from "./yardimci/denetimler.ts";

test("docs/assets/tokens.css gövdesi src/styles/tokens.css ile aynı", () => {
  const kaynak = tokenGovdesi(oku("src/styles/tokens.css"));
  assert.ok(kaynak.length > 1000);
  assert.equal(tokenGovdesi(oku("docs/assets/tokens.css")), kaynak);
});

test("kontrast ölçer tek kaynağı okuyor", () => {
  assert.match(oku("tools/palet-olc.mjs"), /src\/styles\/tokens\.css/);
});
