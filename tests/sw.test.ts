/* NEREDEN GELDİ: 395 — çevrimdışı servis çalışanı (public/sw.js; ARKA-UC §4.1, K4). Saf: cihaz deposunun şeması uygulamayla (depo.ts) aynı; yalnız saha
   sayfaları (Ana sayfa, Planlar, plan içi, rapor) saklanır — API, giriş, müşteri paneli, yönetim, PDF ASLA; yalnız aynı kökenden GET; sayfa CSP'si
   çalışana izin verir. Uçtan uca (bağlantı kesilip sayfa yeniden yüklenerek): e2e/cevrimdisi.spec.ts. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { oku, swEksikleri } from "./yardimci/denetimler.ts";

test("servis çalışanı: depo şeması ortak, yalnız saha sayfaları, yalnız aynı kökenden GET, CSP izinli", () => {
  assert.deepEqual(swEksikleri(oku("public/sw.js"), oku("src/components/cevrimdisi/depo.ts"), oku("src/proxy.ts")), []);
});
