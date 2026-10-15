/* NEREDEN GELDİ: pkproje.md §8.8 (her firma kendi alt alan adında: <firma>.probata.com.tr) + anayasa 5.5 (kimlik
   metin değildir: dile bağlı harf katlama yok — `İ`/`ı` kiracı adını değiştirmez, reddedilir).
   2026-10-15 (FIRMA-VT FV3 incelemesi) eklenenler: kiracı YALNIZ Host başlığından — src/server/kiraci/istek.ts metni (tests/yardimci/denetimler.ts
   kiraciBasligiEksikleri; önce yalnız veritabanlı tests/firma-vt.test.ts içinde düz ifadelerdi, olumsuz kanıtı yoktu) ve adresten kiracı
   (hosttanKiraci): kural dışı adres çözücüye sorulmaz, çözüm başka adın kaydını verirse kullanılmaz, kendi projeli firmanın bağlantı kaydı kiracıda
   numaralanamaz. Olumsuz kanıt: tests/bozan/kiraci-coz.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { FirmaCozumu } from "../src/server/db/merkez.ts";
import { hosttanKiraci, kiraciAdiCoz } from "../src/server/kiraci/coz.ts";
import { kiraciBasligiEksikleri, oku } from "./yardimci/denetimler.ts";

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

test("kiracı YALNIZ Host başlığından: istek.ts başlıkları bir kez okur, yalnız host; çerez / sorgu / X-Forwarded-* / Origin yok", () => {
  assert.deepEqual(kiraciBasligiEksikleri(oku("src/server/kiraci/istek.ts")), []);
});

test("adresten kiracı: kural dışı adres çözücüye sorulmaz; çözüm başka adın kaydını verirse kullanılmaz; bağlantı kaydı numaralanamaz", async () => {
  const [O, A] = [randomUUID(), randomUUID()];
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  const kayit = { firmaId: A, ref: null, sunucu: "127.0.0.1", kapi: 6543, vtAd: "probata_kendi_a", kullanici: "probata_uygulama",
    parolaSifreli: "v1.uydurma.uydurma.uydurma", depo: null, surum: 1 };
  const cozumler: Record<string, FirmaCozumu> = { "ortak-o": { id: O, kisaAd: "ortak-o", vt: "ortak" }, "kendi-a": { id: A, kisaAd: "kendi-a", vt: "kendi", kayit } };
  const sorulan: string[] = [];
  const coz = async (k: string) => { sorulan.push(k); return cozumler[k] ?? null; };
  assert.deepEqual(await hosttanKiraci("ortak-o.probata.com.tr", ANA, coz), { firmaId: O, kisaAd: "ortak-o" });
  const kA = await hosttanKiraci("KENDI-A.probata.com.tr:443", ANA, coz);
  assert.deepEqual([kA?.firmaId, kA?.kisaAd, kA?.vt], [A, "kendi-a", kayit]);
  assert.deepEqual(Object.keys(kA!), ["firmaId", "kisaAd"], "bağlantı kaydı numaralanamaz");
  assert.ok(!JSON.stringify(kA).includes("probata_kendi_a") && !JSON.stringify(kA).includes("6543"), "serileştirmede altyapı bilgisi yok");
  sorulan.length = 0;
  for (const h of ["kendi-a.baska.probata.com.tr", "probata.com.tr", "kendi-a.probata.com.tr.saldirgan.example", "kendi_a.probata.com.tr", "", "-kendi.probata.com.tr"]) {
    assert.equal(await hosttanKiraci(h, ANA, coz), null, h);
  }
  assert.deepEqual(sorulan, [], "kural dışı adres çözücüye sorulmadı");
  assert.equal(await hosttanKiraci("kendi-a.probata.com.tr", ANA, async () => cozumler["ortak-o"]!), null, "başka adın kaydı kullanılmaz");
});
