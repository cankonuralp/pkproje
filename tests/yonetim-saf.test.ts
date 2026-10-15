/* NEREDEN GELDİ: 348 — yönetim sayfasının saf parçaları (veritabanısız): doğrulama kodu RFC 6238 test vektörleriyle (telefon uygulamasıyla aynı kodu
   üretmezse kimse giremez), saat kayması penceresi ve yeniden oynatma; yönetim adresi denetimi; firma aç şeması (maketin iletileri), ünvandan öneri,
   ayrılmış ad listesinin göçle (0050; 2026-10-15'ten beri listeyi taşıyan HER göç — 0096 dahil) aynı olması. Gerçek veritabanı davranışı:
   tests/yonetim.test.ts. Olumsuz kanıt (ayrılmış ad listesi): tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { AYRILMIS, firmaAcSemasi, oneri, yonetimEtiketi } from "../src/modules/yonetim/sema.ts";
import { yonetimAdresiMi, yonetimAlani } from "../src/server/yonetim/adres.ts";
import { base32Oku, base32Yaz, otpauthAdresi, totpDogrula, totpKodu, zamanAdimi } from "../src/server/yonetim/totp.ts";
import { ayrilmisAdListeleri } from "./yardimci/denetimler.ts";

const RFC = base32Yaz(Buffer.from("12345678901234567890", "ascii"));

test("TOTP: RFC 6238 SHA-1 test vektörleri (son 6 hane) ve Base32", () => {
  assert.equal(RFC, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.deepEqual(base32Oku("gezd gnbv gy3t qojq gezd gnbv gy3t qojq"), Buffer.from("12345678901234567890", "ascii"));
  assert.equal(base32Oku("0189"), null, "Base32 dışı harf");
  for (const [t, beklenen] of [[59, "287082"], [1111111109, "081804"], [1111111111, "050471"], [1234567890, "005924"], [2000000000, "279037"]] as const) {
    assert.equal(totpKodu(RFC, zamanAdimi(new Date(t * 1000))), beklenen, String(t));
  }
});

test("TOTP doğrulama: ±1 adım kabul, ötesi değil; aynı ya da eski adım ikinci kez geçmez; biçimsiz kod", () => {
  const t = new Date(1_800_000_000_000), a = zamanAdimi(t);
  assert.equal(totpDogrula(RFC, totpKodu(RFC, a), t, 0), a);
  assert.equal(totpDogrula(RFC, totpKodu(RFC, a - 1), t, 0), a - 1);
  assert.equal(totpDogrula(RFC, totpKodu(RFC, a + 1), t, 0), a + 1);
  assert.equal(totpDogrula(RFC, totpKodu(RFC, a - 2), t, 0), null);
  assert.equal(totpDogrula(RFC, totpKodu(RFC, a + 2), t, 0), null);
  assert.equal(totpDogrula(RFC, totpKodu(RFC, a), t, a), null, "yeniden oynatma");
  assert.equal(totpDogrula(RFC, totpKodu(RFC, a - 1), t, a - 1), null);
  assert.equal(totpDogrula(RFC, ` ${totpKodu(RFC, a).slice(0, 3)} ${totpKodu(RFC, a).slice(3)} `, t, 0), a, "boşluklu yazım");
  for (const k of ["", "12345", "1234567", "abcdef", "12345a"]) assert.equal(totpDogrula(RFC, k, t, 0), null, k);
  assert.match(otpauthAdresi(RFC, "y@probata.example"), /^otpauth:\/\/totp\/probata%20y%C3%B6netim%3Ay%40probata\.example\?secret=GEZD.*&period=30$/);
});

test("yönetim adresi: yalnız tanımlı tam ad (kapı ve büyük harf yok sayılır); tanımsızsa hiçbir adres değil", () => {
  assert.equal(yonetimAlani("Yonetim.Localhost"), "yonetim.localhost");
  assert.equal(yonetimAlani(""), null);
  assert.equal(yonetimAlani("kötü ad"), null);
  assert.equal(yonetimAdresiMi("yonetim.localhost:3100", "yonetim.localhost"), true);
  assert.equal(yonetimAdresiMi("YONETIM.localhost", "yonetim.localhost"), true);
  assert.equal(yonetimAdresiMi("deneme.localhost:3100", "yonetim.localhost"), false);
  assert.equal(yonetimAdresiMi("yonetim.localhost.kotu.example", "yonetim.localhost"), false);
  assert.equal(yonetimAdresiMi("yonetim.localhost", null), false);
  assert.equal(yonetimAdresiMi(null, "yonetim.localhost"), false);
});

test("firma aç şeması: maketin iletileri, ayrılmış adlar (göçle aynı liste), ünvandan öneri", () => {
  const sema = firmaAcSemasi(["probata-yonetim"]);
  const hata = (g: Record<string, string>) => {
    const r = sema.safeParse({ unvan: "Deneme Muayene", alt: "deneme", kod: "DM", yon: "Deneme Kişi", eposta: "a@deneme.example", ...g });
    return r.success ? null : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
  };
  assert.equal(hata({}), null);
  assert.deepEqual(hata({ unvan: " " }), { unvan: "Ticari ünvan yazılmalı." });
  assert.deepEqual(hata({ alt: "ab" }), { alt: "3–30 karakter; yalnız a–z, 0–9 ve tire (başta ve sonda tire olmaz)." });
  assert.deepEqual(hata({ alt: "-abc" }), { alt: "3–30 karakter; yalnız a–z, 0–9 ve tire (başta ve sonda tire olmaz)." });
  assert.deepEqual(hata({ alt: "WWW" }), { alt: "“www” bize ayrılmış; başka bir ad seçin." });
  assert.deepEqual(hata({ alt: "probata-yonetim" }), { alt: "“probata-yonetim” bize ayrılmış; başka bir ad seçin." });
  assert.deepEqual(hata({ kod: "A1" }), { kod: "İki harf (A–Z)." });
  assert.deepEqual(hata({ yon: "Deneme" }), { yon: "Ad ve soyad yazılmalı." });
  assert.deepEqual(hata({ eposta: "deneme" }), { eposta: "Geçerli bir e-posta değil." });
  assert.equal(sema.parse({ unvan: "  Deneme   Muayene ", alt: " Deneme ", kod: "dm", yon: "Deneme  Kişi", eposta: " A@Deneme.Example " }).eposta, "a@deneme.example");
  /* ayrılmış adlar: uygulama ve veritabanı aynı listeyi tutar. 2026-10-15 (FIRMA-VT FV2 incelemesi): liste 0096'da (yonetim_firma_kayit_ac) üçüncü kez
     yazıldı — kilit yalnız 0050'ye bakıyordu, kopya kayabilirdi (kurulum yolu ayrılmış adı kabul ederdi); artık her göçteki her liste */
  const gocler = readdirSync("src/server/db/gocler").filter((d) => d.endsWith(".sql")).sort()
    .map((ad) => ({ ad, metin: readFileSync(`src/server/db/gocler/${ad}`, "utf8") }));
  const ayrilmis = ayrilmisAdListeleri(gocler, AYRILMIS);
  assert.deepEqual(ayrilmis.bulunan, ["0050_yonetim.sql", "0096_merkez_kaydi.sql"]);
  assert.deepEqual(ayrilmis.farklar, []);
  assert.deepEqual(oneri("Örnek Muayene ve Kontrol Ltd. Şti."), { alt: "ornek", kod: "OM" });
  assert.deepEqual(oneri("ABC Test Muayene"), { alt: "abctest", kod: "AT" });
  assert.deepEqual(oneri("İşık"), { alt: "isik", kod: "IS" });
  assert.deepEqual(oneri(""), { alt: "", kod: "" });
  assert.deepEqual(yonetimEtiketi("yonetim.localhost", "localhost"), ["yonetim"]);
  assert.deepEqual(yonetimEtiketi("probata-yonetim.vercel.app", "vercel.app"), ["probata-yonetim"]);
  assert.deepEqual(yonetimEtiketi("yonetim.baska.example", "probata.com.tr"), []);
  assert.deepEqual(yonetimEtiketi(null, "localhost"), []);
});
