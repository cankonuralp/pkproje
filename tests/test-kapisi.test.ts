/* NEREDEN GELDİ: anayasa 0.3 + 13.6 — T1 teslimi (2026-09-14) test düşerken yayınlandı; kapı artık kişiye değil
   mekanizmaya bağlı (EKSIKLER 10): derleme betikleri testle başlar, CI'da test derlemeden önce koşar ve yayın işi
   denetim işine bağlıdır. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { oku, testKapisiEksikleri } from "./yardimci/denetimler.ts";

test("fail 0 olmadan derleme ve yayın yok (package.json + CI)", () => {
  assert.deepEqual(testKapisiEksikleri(oku("package.json"), oku(".github/workflows/ci.yml")), []);
});
