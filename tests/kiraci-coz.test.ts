/* NEREDEN GELDİ: pkproje.md §8.8 (her firma kendi alt alan adında: <firma>.probata.com.tr) + anayasa 5.5 (kimlik
   metin değildir: dile bağlı harf katlama yok — `İ`/`ı` kiracı adını değiştirmez, reddedilir). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kiraciAdiCoz } from "../src/server/kiraci/coz.ts";

const ANA = "probata.com.tr";

test("tek düzey alt alan kiracıdır", () => {
  assert.equal(kiraciAdiCoz("deneme.probata.com.tr", ANA), "deneme");
  assert.equal(kiraciAdiCoz("deneme-2.probata.com.tr:443", ANA), "deneme-2");
  assert.equal(kiraciAdiCoz("DENEME.probata.com.tr", ANA), "deneme");
  assert.equal(kiraciAdiCoz("deneme.localhost:3000", "localhost"), "deneme");
});

test("ana alan, derin alt alan ve başka alan kiracı değildir", () => {
  assert.equal(kiraciAdiCoz("probata.com.tr", ANA), null);
  assert.equal(kiraciAdiCoz("a.b.probata.com.tr", ANA), null);
  assert.equal(kiraciAdiCoz("deneme.baska.com.tr", ANA), null);
  assert.equal(kiraciAdiCoz("xprobata.com.tr", ANA), null);
});

test("DNS etiketi kuralına uymayan ad reddedilir; Türkçe harf katlanmaz", () => {
  assert.equal(kiraciAdiCoz("-deneme.probata.com.tr", ANA), null);
  assert.equal(kiraciAdiCoz("deneme-.probata.com.tr", ANA), null);
  assert.equal(kiraciAdiCoz("DENEMEİ.probata.com.tr", ANA), null);
  assert.equal(kiraciAdiCoz("şirket.probata.com.tr", ANA), null);
  assert.equal(kiraciAdiCoz("a".repeat(64) + ".probata.com.tr", ANA), null);
});
