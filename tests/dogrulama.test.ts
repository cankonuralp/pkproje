/* NEREDEN GELDİ: sunum 595 K8 (reisim: "Kanun cümlesi + rapor no + sayfa + doğrulama karekodu"): e-imzaya hazırlanan PDF'in alt şeridinde
   karekod → firmanın adresinde /dogrula/<kod>. Saf (veritabanısız): kod rapor + revizyon + HMAC — başka firmada, başka revizyonla, değiştirilmiş
   ya da başka anahtarla geçmez, biçimsiz kod reddedilir; alt şerit karekodu ve adresi yalnız adres verilince basar (kaçışlı); açık rota
   listesinde (tests/moduller.test.ts). Veritabanı okuması tests/onaylar.test.ts'te. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { ornekBelge } from "../src/belge/ornek.ts";
import { raporAltBilgisi } from "../src/belge/pdf.ts";
import { PDF_JETON_DK, dogrulamaAdresi, dogrulamaCoz, dogrulamaKodu, pdfJetonu, pdfJetonuGecerli } from "../src/server/dogrulama.ts";

const K = randomBytes(32), F = randomUUID(), R = randomUUID();

test("kod: aynı firma ve revizyonda çözülür; başka firma, başka revizyon, değiştirilmiş imza, başka anahtar ve biçimsiz kod geçmez", () => {
  const kod = dogrulamaKodu(F, R, 1, K);
  assert.match(kod, /^[0-9a-f-]{36}\.1\.[A-Za-z0-9_-]{22}$/);
  assert.deepEqual(dogrulamaCoz(kod, F, K), { raporId: R, revizyon: 1 });
  assert.equal(dogrulamaCoz(kod, randomUUID(), K), null, "başka firma");
  assert.equal(dogrulamaCoz(kod.replace(".1.", ".2."), F, K), null, "başka revizyon");
  const son = kod.at(-1) === "A" ? "B" : "A";
  assert.equal(dogrulamaCoz(kod.slice(0, -1) + son, F, K), null, "değiştirilmiş imza");
  assert.equal(dogrulamaCoz(kod, F, randomBytes(32)), null, "başka anahtar");
  for (const k of ["", "x", `${R}.1`, `${R}.1.kisa`, `${R.toUpperCase()}.1.${kod.split(".")[2]}`, `${R}.1000.${kod.split(".")[2]}`, `../${kod}`]) {
    assert.equal(dogrulamaCoz(k, F, K), null, k);
  }
  assert.equal(dogrulamaAdresi("https://deneme.example", kod), `https://deneme.example/dogrula/${kod}`);
});

/* 2026-10-17 (reisim: "rapor doğrulama ekranında raporun kendisi de gözüksün"): sayfadaki PDF'in adresi kısa ömürlü jetonla (anayasa 5.1) */
test("PDF jetonu: süresi içinde, aynı firma ve kodla geçer; süresi geçmiş, ileri tarihli, başka firma / kod / anahtar ya da değiştirilmiş jeton geçmez", () => {
  const kod = dogrulamaKodu(F, R, 0, K), simdi = Date.UTC(2026, 9, 17, 12, 0);
  const j = pdfJetonu(F, kod, simdi, K);
  assert.match(j, /^\d+\.[A-Za-z0-9_-]{22}$/);
  assert.equal(pdfJetonuGecerli(j, F, kod, simdi, K), true);
  assert.equal(pdfJetonuGecerli(j, F, kod, simdi + (PDF_JETON_DK - 1) * 60_000, K), true, "süresi içinde");
  assert.equal(pdfJetonuGecerli(j, F, kod, simdi + (PDF_JETON_DK + 1) * 60_000, K), false, "süresi geçmiş");
  assert.equal(pdfJetonuGecerli(pdfJetonu(F, kod, simdi + 60 * 60_000, K), F, kod, simdi, K), false, "ileri tarihli");
  assert.equal(pdfJetonuGecerli(j, randomUUID(), kod, simdi, K), false, "başka firma");
  assert.equal(pdfJetonuGecerli(j, F, dogrulamaKodu(F, randomUUID(), 0, K), simdi, K), false, "başka kod");
  assert.equal(pdfJetonuGecerli(j, F, kod, simdi, randomBytes(32)), false, "başka anahtar");
  assert.equal(pdfJetonuGecerli(`${Number(j.split(".")[0]) + 5}.${j.split(".")[1]}`, F, kod, simdi, K), false, "bitişi uzatılmış");
  for (const x of ["", "x", "1.2", `${j}.x`]) assert.equal(pdfJetonuGecerli(x, F, kod, simdi, K), false, x);
});

test("alt şerit: adres verilince karekod (SVG) ve kaçışlı adres; verilmeyince yok", () => {
  const v = { ...ornekBelge("ZPKR02"), kesin: true };
  const yok = raporAltBilgisi(v);
  assert.equal(yok.includes("<svg"), false);
  assert.equal(yok.includes("Doğrulama:"), false);
  const adres = `https://deneme.example/dogrula/${dogrulamaKodu(F, R, 0, K)}`;
  const var_ = raporAltBilgisi({ ...v, dogrulama: adres });
  assert.ok(var_.includes("<svg") && /<path d="M\d/.test(var_), "karekod");
  assert.ok(var_.includes(`href="${adres}"`), "bağlantı");
  assert.ok(var_.includes("Bu rapor 5070 sayılı Elektronik İmza Kanunu"), "kanun cümlesi");
  const kotu = raporAltBilgisi({ ...v, dogrulama: `https://deneme.example/"><img src=x onerror=alert(1)>` });
  assert.equal(kotu.includes("<img"), false, "adres kaçışlı");
});
