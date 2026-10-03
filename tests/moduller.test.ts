/* NEREDEN GELDİ: reisim 2026-09-23 "diğer modüller nerde onlarda gözüksün" + "sekmelerin adı da öznellik içermesin
   planlar raporlar zimmetler gibi genel isimler olsun" — onaylı maketin (5. tur) menüsü. Uygulamanın menüsü (MODÜL
   KAYDI) makettekiyle birebir: grup, sıra, ad, ikon, §3.1 numarası. Her modülün kendi rota klasörü var, fazlası yok.
   Olumsuz kanıt: tests/bozan/kilitler.bozan.ts ("Planlar" → "Planlarım" yakalanır).
   2026-09-24 (toplu maket, MAKET-PLANI §3.2): maketin menüsü bütün maket sayfalarında tek üreticiden gelsin diye
   docs/assets/maket.js'ten docs/assets/maket-ortak.js'e taşındı → okunan dosya değişti, denetim aynı; ayrıca menü sabiti
   maket betiklerinde TEK yerde (ikinci kopya sessizce ayrışırdı).
   2026-09-25 (reisim, M1 cevapları: "159 birleşsin"): Kullanıcılar (1) Personel'e katıldı → 16 modül, menüde olmayanlar 1, 6, 16, 17
   (1'in ekranı Personel'in içinde). Beklenen sayılar bu karar için güncellendi; denetimin kendisi aynı.
   2026-09-26 (reisim, M3: "ekipmanlar ve ekipman türleri diye iki modüle gerek yok ekipman türleri yeterli"): Ekipmanlar (7) ayrı
   modül değil, ekipmanlar planın içinde → 15 modül, menüde olmayanlar 1, 6, 7, 16, 17. Denetim aynı, beklenen sayılar güncellendi.
   2026-09-28 (reisim: "talepler kısmı olsun denetçi izin talebi masraf formu ekleme"): 21 Talepler eklendi → 16 modül; numara aralığı
   1–21. Denetim aynı, beklenen sayılar güncellendi.
   2026-09-28 (reisim: "dökümanlar modülü olsun … eğitimler, muayene kriterleri, standartlar ve diğer dökümanlar bu kısımda"): 4 Standartlar
   → Dökümanlar, 10 Eğitimler Dökümanlar'ın içinde → 15 modül, menüde olmayanlar 1, 6, 7, 10, 16, 17. Denetim aynı.
   2026-09-30 (R1, reisim: "firma ayarları personel kısmının altında değil ayrı bir modül olsun"): 22 Firma ayarları eklendi → 16 modül;
   numara aralığı 1–22. Denetim aynı, beklenen sayılar güncellendi.
   2026-10-02 (AA4, reisim: "bir de araç takip modülü olsun hangi aracın kimde olduğu belli olsun takip edilebilsin"): 23 Araçlar eklendi
   (Varlık grubu) → 17 modül; numara aralığı 1–23. Denetim aynı, beklenen sayılar güncellendi.
   2026-10-03 (K0, reisim: "Makette eksik kalmadıysa koda geç"): ortak bileşenlerin uçtan uca denetimi için TEK modül dışı rota "vitrin"
   (yalnız geliştirmede açılır, yayında 404 — src/app/vitrin/page.tsx). İstisna adıyla yazıldı; başka modül dışı rota hâlâ yakalanır. */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { MODULLER, MODUL_GRUPLARI } from "../src/modules/moduller.ts";
import { KOK, maketMenusu, oku } from "./yardimci/denetimler.ts";

test("menü onaylı maketle birebir (grup · sıra · ad · ikon · §3.1 no)", () => {
  const maket = maketMenusu(oku("docs/assets/maket-ortak.js"));
  const uygulama = MODUL_GRUPLARI.map((g) => ({ grup: g.grup, ogeler: g.moduller.map((m) => [m.ad, m.ikon, m.no]) }));
  assert.equal(maket.length, 6);
  assert.deepEqual(uygulama, maket);
});

test("maket menüsü tek kaynakta: menü sabiti yalnız maket-ortak.js'te", () => {
  const assets = join(KOK, "docs", "assets");
  const tasiyan = readdirSync(assets).filter((ad) => ad.endsWith(".js") && readFileSync(join(assets, ad), "utf8").includes("var MENU = ["));
  assert.deepEqual(tasiyan, ["maket-ortak.js"]);
});

test("17 modül, numaralar tekil; menüde olmayanlar 1 (Personel'in içinde), 6, 7 (planın içinde), 10 (Dökümanlar'ın içinde), 16, 17", () => {
  const nolar = MODULLER.map((m) => m.no);
  assert.equal(nolar.length, 17);
  assert.equal(new Set(nolar).size, 17);
  const yok = Array.from({ length: 23 }, (_, i) => i + 1).filter((n) => !nolar.includes(n));
  assert.deepEqual(yok, [1, 6, 7, 10, 16, 17]);
});

const GELISTIRME_ROTASI = "vitrin";

test("her modülün rota klasörü var ve src/app'te modül dışı rota yok", () => {
  const app = join(KOK, "src", "app");
  const klasorler = readdirSync(app).filter((ad) => statSync(join(app, ad)).isDirectory() && ad !== GELISTIRME_ROTASI).sort();
  const yollar = MODULLER.filter((m) => m.yol !== "").map((m) => m.yol).sort();
  assert.deepEqual(klasorler, yollar);
  for (const y of yollar) assert.ok(existsSync(join(app, y, "page.tsx")), `${y}/page.tsx yok`);
  assert.ok(existsSync(join(app, "page.tsx")), "Planlar ana sayfası yok");
});

test("adresler ASCII ve tekil", () => {
  const yollar = MODULLER.map((m) => m.yol);
  assert.equal(new Set(yollar).size, yollar.length);
  for (const y of yollar) assert.match(y, /^[a-z0-9-]*$/);
});
