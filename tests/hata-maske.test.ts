/* NEREDEN GELDİ: 567 — 06-HATA-TAKIBI ("aynı hata kısılır, gürültü elenir", "bağlamıyla yazılır, yığın izi kırpılır") ve 09 G2 (log ve hata kaydında
   kişisel veri yok). Saf (veritabanısız): e-posta, telefon / T.C. kimlik / SGK numarası, jeton ve anahtar kayda düşmez; kayıt kimliği (UUID)
   kalır; adres yalnız yol; yığın izinin ilk satırı (mesaj) atılır, en çok 8 kare, köken atılır; bilinen gürültü yazılmaz; biçimsiz firma / hesap
   bağlamı düşer. Veritabanı tarafı tests/hata.test.ts; olumsuz kanıt tests/bozan/hata.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { adresYolu, gurultuMu, hataHazirla, maskele, yiginKirp } from "../src/server/hata/maske.ts";

test("maske: e-posta, telefon, T.C. kimlik, SGK, jeton, anahtar maskelenir; UUID ve olağan ileti kalır", () => {
  assert.equal(maskele("kullanıcı ornek.kisi@firma.example bulunamadı"), "kullanıcı [e-posta] bulunamadı");
  assert.equal(maskele("tel 0532 123 45 67 ve +90 532 123 4567"), "tel [sayı] ve [sayı]");
  assert.equal(maskele("TC 12345678901 SGK 12345678901234567890123456"), "TC [sayı] SGK [sayı]");
  assert.equal(maskele("Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc_DEF-123 geçersiz"), "Bearer [iz] geçersiz");
  assert.equal(maskele("anahtar anahtar-deneme-Ab12Cd34Ef56Gh78Ij90Kl12 reddedildi"), "anahtar [iz] reddedildi");
  assert.equal(maskele(`özet ${"a1".repeat(32)} tutmadı`), "özet [iz] tutmadı");
  const id = "6f9619ff-8b86-4011-b42d-00c04fc964ff";
  assert.equal(maskele(`rapor ${id} bulunamadı`), `rapor ${id} bulunamadı`, "kayıt kimliği kalır");
  assert.equal(maskele("Cannot read properties of undefined (reading 'kod')"), "Cannot read properties of undefined (reading 'kod')");
  assert.equal(maskele("chunk 123:45 satır 2026"), "chunk 123:45 satır 2026", "kısa sayılar kalır");
});

test("adres yalnız yol; yığın izi ilk satırsız, en çok 8 kare, kökensiz; gürültü yazılmaz; biçimsiz bağlam düşer", () => {
  assert.equal(adresYolu("/raporlar/abc?ara=ornek.kisi@firma.example#x"), "/raporlar/abc");
  assert.equal(adresYolu("https://baska.example/x"), null);
  assert.equal(adresYolu(null), null);
  const chrome = ["TypeError: x tanımsız", ...Array.from({ length: 12 }, (_, i) => `    at f${i} (https://deneme.probata.example/_next/static/chunks/a.js:1:${i})`)].join("\n");
  const k = yiginKirp(chrome)!;
  assert.equal(k.split("\n").length, 8);
  assert.ok(k.startsWith("at f0 (/_next/static/chunks/a.js:1:0)"), k);
  assert.ok(!k.includes("TypeError") && !k.includes("https://"));
  assert.equal(yiginKirp("f@https://x.example/a.js:1:2\ng@https://x.example/a.js:3:4"), "f@/a.js:1:2\ng@/a.js:3:4", "Firefox biçimi: ilk satır kare");
  assert.equal(yiginKirp("x".repeat(5000))!.length, 1200);
  for (const m of ["TypeError: Failed to fetch", "ResizeObserver loop completed with undelivered notifications.", "AbortError: The user aborted a request.",
    "ChunkLoadError: Loading chunk 123 failed.", "Script error.", "NEXT_REDIRECT"]) {
    assert.equal(gurultuMu(m), true, m);
    assert.equal(hataHazirla({ kaynak: "istemci", mesaj: m }), null, m);
  }
  assert.equal(gurultuMu("TypeError: Cannot read properties of null"), false);
  const h = hataHazirla({ kaynak: "sunucu", mesaj: "  hata   ornek.kisi@firma.example  ", alan: "Kötü.Alan", hesap: "x", adres: "/a?b=c", cihaz: "UA 05321234567" })!;
  assert.deepEqual([h.mesaj, h.alan, h.hesap, h.adres, h.cihaz], ["hata [e-posta]", null, null, "/a", "UA [sayı]"]);
  assert.equal(hataHazirla({ kaynak: "istemci", mesaj: "   " }), null);
  assert.equal(hataHazirla({ kaynak: "istemci", mesaj: "x".repeat(900) })!.mesaj.length, 300);
});
