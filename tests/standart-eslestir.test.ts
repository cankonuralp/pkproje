/* NEREDEN GELDİ: 428 — reisim 2026-10-09: "Denetçi muayene yaparken standarta tıklayınca pop-up olarak standart açılmalı okuyabilmeli
   yanlışlıkla tıklaması ihtimaline karşı önceden sorsun evet denirse açılsın". Formatın standart metni atıflara bölünür, her atıf firmanın
   kütüphanesindeki en uzun eşleşen numarayla (numaranın ardından rakam / harf gelmez) ya da Bakanlık kriter belgesiyle eşlenir
   (src/modules/dokumanlar/eslestir.ts); formatın kriter belgeleri form kodundan ve madde standardından (src/tanim/kriterler.ts formatKriterleri).
   Olumsuz kanıt: tests/bozan/standart-eslestir.bozan.ts. Pencere ve önce-sor akışı uçtan uca: e2e/saha-raporu.spec.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { atiflar, kriterKodu, standartBul } from "../src/modules/dokumanlar/eslestir.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { formatKriterleri } from "../src/tanim/kriterler.ts";

const KUTUPHANE = [{ no: "TS EN 62305" }, { no: "TS EN 62305-3" }, { no: "TS EN 62305-30" }, { no: "TS 622" }, { no: "TS HD 60364-6" }];

test("atıflar: ' · ' ve ';' ayırır; kriter belgesi atfı (ZPKKnn · ad) tek atıf; boş metin atıfsız", () => {
  assert.deepEqual(atiflar("TS EN 62305-3 Madde 6 · TS EN 62561 · TS EN 61643-11"), ["TS EN 62305-3 Madde 6", "TS EN 62561", "TS EN 61643-11"]);
  assert.deepEqual(atiflar("TS HD 60364-6; TS 622"), ["TS HD 60364-6", "TS 622"]);
  assert.deepEqual(atiflar("ZPKK02 · Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri Periyodik Kontrol Kriterleri").length, 1);
  assert.deepEqual([atiflar(""), atiflar(undefined), atiflar("   ")], [[], [], []]);
  assert.deepEqual([kriterKodu("zpkk03 · x"), kriterKodu("ZPKK0"), kriterKodu("TS EN 62305")], ["ZPKK03", null, null]);
});

test("standart bul: en uzun numara; ardından rakam / harf gelen numara eşleşmez; büyük-küçük harf ve boşluk fark etmez", () => {
  assert.equal(standartBul("TS EN 62305-3 Madde 5.3", KUTUPHANE)?.no, "TS EN 62305-3");
  assert.equal(standartBul("ts en  62305-30:2020", KUTUPHANE)?.no, "TS EN 62305-30");
  assert.equal(standartBul("TS EN 62305-4 Madde 2", KUTUPHANE)?.no, "TS EN 62305", "parça yoksa seri");
  assert.equal(standartBul("TS 6225 Bölüm 2", KUTUPHANE), null, "TS 622, TS 6225'i tutmaz");
  assert.equal(standartBul("TS 622 Yapıların Yıldırımdan Korunması", KUTUPHANE)?.no, "TS 622");
  assert.equal(standartBul("Elektrik İç Tesisleri Yönetmeliği", KUTUPHANE), null);
  assert.equal(standartBul("TS EN 62305-3", []), null);
});

test("formatın kriter belgeleri: Bakanlık form kodundan ve madde standardındaki ZPKKnn'den; genel formatta yok", () => {
  assert.deepEqual(formatKriterleri(SABLONLAR.ZPKR02.tanim).map((x) => x.kod), ["ZPKK02"]);
  assert.deepEqual(formatKriterleri(SABLONLAR.ZPKR04.tanim).map((x) => x.kod), ["ZPKK04"]);
  assert.deepEqual(formatKriterleri(SABLONLAR.KOMPRESOR.tanim), []);
});
