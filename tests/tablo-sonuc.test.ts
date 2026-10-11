/* NEREDEN GELDİ: 486 — reisim 2026-10-10: "test tablosu olan yerler de, son satırı kopyala, satırları otomatik sırala, gibi tuşlar da olsun ve
   yazdığım işlere yarasın"; "rcd testleri tablosunda uygun uygun değil otomatik geliyor ? neden elle seçilmiyor ? neye göre otomatik uygun uygun
   değil diyor ? bununda açıklamasını yap"; ekran görüntüsünde linye tablosunun başı "No | No | Devre". Saf işlevler: satır kopyası (kimlik / no bir
   artar), doğal sıra, sıra sütununun başlığı, Sonuç sütununun kuralları (ekranda "Sonuç neye göre çıkar?" — motorun değerlendirmesiyle aynı).
   Olumsuz kanıt: tests/bozan/tablo-sonuc.bozan.ts. Tarayıcıda: e2e/foto-oku.spec.ts (kopyala / sırala / Tip listesi). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { siraBasligi } from "../src/format/duzen.ts";
import { degerlendir, sonucKurallari } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Bolum, Cevaplar, type BolumOf } from "../src/format/tanim.ts";
import { satirKopyala, satirKopyasi, satirlariSirala, siraliMi, sonrakiKod } from "../src/modules/raporlar/tablo.ts";

const olcum = (sablon: keyof typeof SABLONLAR, id: string) => {
  const b = SABLONLAR[sablon].tanim.bolumler.find((x) => x.id === id);
  assert.ok(b && b.blok === "olcum", `${sablon} ${id} ölçüm tablosu değil`);
  return b as BolumOf<"olcum">;
};

test("sonraki kod: sondaki sayı bir artar, sıfır dolgusu korunur; sayısız değer aynen", () => {
  assert.equal(sonrakiKod("F3"), "F4");
  assert.equal(sonrakiKod("X09"), "X10");
  assert.equal(sonrakiKod("099"), "100");
  assert.equal(sonrakiKod("7"), "8");
  assert.equal(sonrakiKod("Priz 2. kat"), "Priz 3. kat");
  assert.equal(sonrakiKod("L1-9"), "L1-10");
  assert.equal(sonrakiKod("Ana pano"), "Ana pano");
  assert.equal(sonrakiKod("12345678901234567890"), "12345678901234567891", "büyük sayı taşmaz");
});

test("kopya: bütün değerler (uygunluk notu dahil) gelir, ilk sütun bir artar, satırın hemen altına; tablonun dışındaki sıra tabloyu bozmaz", () => {
  const l: Record<string, string>[] = [{ no: "F1", devre: "Aydınlatma", tip: "C", not: "1" }, { no: "F2", devre: "Priz" }];
  assert.deepEqual(satirKopyasi(l[0], "no"), { no: "F2", devre: "Aydınlatma", tip: "C", not: "1" });
  assert.deepEqual(satirKopyala(l, 0, "no").map((s) => s.no), ["F1", "F2", "F2"]);
  assert.deepEqual(satirKopyala(l, 1, "no").map((s) => `${s.no} ${s.devre}`), ["F1 Aydınlatma", "F2 Priz", "F3 Priz"]);
  assert.deepEqual(satirKopyala(l, 5, "no"), l);
  assert.deepEqual(satirKopyala(l, -1, "no"), l);
  assert.deepEqual(satirKopyasi({ devre: "x" }, "no"), { devre: "x" }, "ilk sütun boşsa eklenmez");
  assert.notEqual(satirKopyala(l, 0, "no")[1], l[0], "kopya yeni nesne (değişince asıl satır değişmez)");
});

test("sıra: doğal (F2 < F10; Türkçe — c < ç), boşlar sona, eşitler eski sırasında; sıralıysa söylenir", () => {
  const l: Record<string, string>[] = [{ no: "F10" }, { no: "" }, { no: "F2" }, { no: "ç1" }, { no: "c1" }, { no: "F2", d: "ikinci" }];
  assert.deepEqual(satirlariSirala(l, "no").map((s) => `${s.no}${s.d ?? ""}`), ["c1", "ç1", "F2", "F2ikinci", "F10", ""]);
  assert.equal(siraliMi(l, "no"), false);
  assert.equal(siraliMi(satirlariSirala(l, "no"), "no"), true);
  assert.deepEqual(l.map((s) => s.no), ["F10", "", "F2", "ç1", "c1", "F2"], "asıl tablo değişmez");
});

test("sıra sütununun başlığı: formatın kendi \"No\" sütunu varsa \"Sıra\" (\"No | No\" olmasın), yoksa \"No\"", () => {
  assert.equal(siraBasligi(olcum("ZPKR02", "linye")), "Sıra");
  assert.equal(siraBasligi(olcum("ZPKR01", "nokta")), "No");
  assert.equal(siraBasligi({ sutunlar: [{ ad: " no. " }] }), "Sıra");
  assert.equal(siraBasligi({ sutunlar: [{ ad: "Nokta no" }] }), "No");
});

test("Sonuç kuralları: Bakanlık hesabı ve sütun sınırları okunur cümleyle; RCD kuralı motorun değerlendirmesiyle aynı", () => {
  const linye = sonucKurallari(olcum("ZPKR02", "linye"));
  assert.ok(linye.includes("Ib ≤ In ≤ Iz") && linye.includes("N/PEN kesiti ≥ faz kesiti"), linye.join(" | "));
  assert.ok(linye.some((k) => /RCD IΔn yazılmışsa .*IΔ ≤ .*IΔn .*TΔ ≤ 200 ms/.test(k)), linye.join(" | "));
  const sel = olcum("ZPKR01", "selektif");
  assert.ok(sonucKurallari(sel)[0].includes("IΔ ≤ anma akımı IΔn ve açma süresi TΔ ≤ 200 ms"));
  assert.ok(sonucKurallari(olcum("ZPKR01", "nokta")).some((k) => k === "RCD testi TΔ ≤ 200 ms"), "sütun sınırı");
  /* motorla aynı: TΔ 250 ms → Uygun değil, 150 ms → Uygun; IΔ IΔn'den büyük → Uygun değil */
  const t = SABLONLAR.ZPKR01.tanim;
  const d = degerlendir(t, Cevaplar.parse({ tablo: { selektif: [{ ad: "A", idn: "30", id: "25", td: "250" }, { ad: "B", idn: "30", id: "25", td: "150" }, { ad: "C", idn: "30", id: "45", td: "20" }] } }));
  assert.deepEqual(d.satirlar.selektif.map((x) => x.uygun), [false, true, false]);
  /* kuralı olmayan tablo: liste boş (ekranda "sonuç kuralı yok"); olumsuz seçenek kuralı */
  const bos = Bolum.parse({ id: "b1", ad: "Serbest", blok: "olcum", sutunlar: [{ id: "s1", ad: "Ad", giris: "metin" }] }) as BolumOf<"olcum">;
  assert.deepEqual(sonucKurallari(bos), []);
  const evet = Bolum.parse({ id: "b2", ad: "Kapı", blok: "olcum", sutunlar: [{ id: "s1", ad: "Kilit çalışıyor", giris: "evet", olumsuz: ["hayir"] }] }) as BolumOf<"olcum">;
  assert.deepEqual(sonucKurallari(evet), ["Kilit çalışıyor: Hayır seçilirse Uygun değil"]);
});
