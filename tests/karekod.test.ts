/* NEREDEN GELDİ: 407 — reisim 2026-10-08: "2 aşamalı doğrulama için Google Authenticator kullanıyorum ama sürekli hata veriyor … süre geçti diyor"
   (anahtar elle yazılıyordu; karekod yoktu). src/server/yonetim/karekod.ts: ekranın ÇİZDİĞİ SVG yolu, bir karekod okuyucuyla (jsQR) gerçekten
   okunur ve doğrulama uygulamasına ekleme bağlantısının (otpauth://totp/…) AYNISI çıkar — anahtar, 6 hane, 30 sn. Saf (veritabanısız).
   Olumsuz kanıt: tests/bozan/karekod.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { karekod } from "../src/server/yonetim/karekod.ts";
import { base32Yaz, otpauthAdresi } from "../src/server/yonetim/totp.ts";
import { yolOku } from "./yardimci/karekod-oku.ts";

test("karekod: ekranın çizdiği yol okununca doğrulama uygulaması bağlantısının aynısı çıkar (anahtar, 6 hane, 30 sn)", () => {
  const anahtar = base32Yaz(new Uint8Array(20).map((_, i) => (i * 37 + 11) & 255));
  const adres = otpauthAdresi(anahtar, "reis@probata.example");
  const k = karekod(adres);
  assert.ok(k.boyut >= 21 && (k.boyut - 17) % 4 === 0, `geçerli karekod boyu: ${k.boyut}`);
  assert.equal(yolOku(k), adres);
  assert.match(adres, new RegExp(`secret=${anahtar}&`));
  assert.match(adres, /digits=6&period=30$/);
  /* yol yalnız sayı ve çizim komutu taşır (ekrana HTML / metin sızmaz) */
  assert.match(k.yol, /^(M\d+ \d+h\d+v1h-\d+z)+$/);
});
