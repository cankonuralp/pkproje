/* NEREDEN GELDİ: 2026-11-16 — reisim: "teknik yönetici tarafında gözüksün, o silebilsin sadece", "herkesinkini raporlar ekranında bir sekme de görsün".
   Plansız kalan ekipmanın hiçbir ekranda "Sil"i yoktu (deneme tesisi ve müşterisi bu yüzden silinemedi). Raporlar › Ekipmanlar sekmesi yalnız TEKNİK
   YÖNETİCİYE: mekanik yönetici mekanik, elektrik yönetici elektrik türlerin ekipmanını görür ve kullanılmamışı siler; firma yöneticisi, planlama,
   denetçi, muhasebe görmez. Bu dosya saf kuralı ve kaynağın kapılarını kilitler; veritabanı tarafı tests/liste.test.ts'te. Olumsuz kanıt:
   tests/bozan/ekipman-yetki.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { bransiYonetir, yonetilenBranslar } from "../src/modules/raporlar/ekipman-yetki.ts";

test("teknik yöneticinin branşları rollerden: mekanik yönetici m, elektrik yönetici e, ikisi de ise ikisi; öteki roller hiçbiri", () => {
  assert.deepEqual(yonetilenBranslar(["mekanik_yonetici"]), ["m"]);
  assert.deepEqual(yonetilenBranslar(["elektrik_yonetici", "denetci"]), ["e"]);
  assert.deepEqual(yonetilenBranslar(["elektrik_yonetici", "mekanik_yonetici"]), ["m", "e"]);
  for (const r of ["firma_yoneticisi", "planlama", "denetci", "muhasebe"] as const) assert.deepEqual(yonetilenBranslar([r]), [], r);
  assert.deepEqual(yonetilenBranslar([]), []);
});

test("silme yalnız kendi branşında: mekanik yönetici elektrik ekipmanını yönetmez; firma yöneticisi hiçbirini", () => {
  assert.equal(bransiYonetir(["mekanik_yonetici"], "m"), true);
  assert.equal(bransiYonetir(["mekanik_yonetici"], "e"), false);
  assert.equal(bransiYonetir(["elektrik_yonetici"], "e"), true);
  assert.equal(bransiYonetir(["firma_yoneticisi", "denetci"], "m"), false);
});

test("kaynağın kapıları: liste ve silme önce teknik yönetici mi diye bakar; liste branşla süzülür; silme branşı kayıttan okur (kaynak kilidi)", () => {
  const s = readFileSync(new URL("../src/modules/raporlar/server/ekipmanlar.ts", import.meta.url), "utf8");
  assert.ok(s.includes("if (!ekipmanYonetir(kim)) return null;"), "liste: görmeyene null");
  assert.ok(s.includes('{ sql: "t.brans = ANY ($1::text[])", p: [yonetilenBranslar(kim.roller)] }'), "liste: yalnız kendi branşı");
  assert.ok(s.includes('if (!ekipmanYonetir(kim)) return { durum: "yetkisiz" };'), "silme: teknik yönetici değilse yetkisiz");
  assert.ok(s.includes('if (!bransiYonetir(kim.roller, x.brans)) return { durum: "yetkisiz" };'), "silme: başka branş yetkisiz");
  assert.ok(s.includes("const r = await ekipmanSil(db, kim.ad, id);"), "silme Ekipman modülünün işleviyle (kullanılmış kayıt veritabanında reddedilir)");
  /* sayfa ve sekme: kapı sunucuda; sekme yalnız teknik yöneticiye çizilir */
  const sayfa = readFileSync(new URL("../src/app/(uygulama)/raporlar/ekipmanlar/page.tsx", import.meta.url), "utf8");
  assert.ok(sayfa.includes("if (!l) return <Yetkisiz />;"), "sayfa: görmeyene yetkisiz");
  const rapor = readFileSync(new URL("../src/app/(uygulama)/raporlar/page.tsx", import.meta.url), "utf8");
  assert.ok(rapor.includes("ekipmanlar={ekipmanYonetir(o)}"), "sekme yalnız teknik yöneticiye");
});
