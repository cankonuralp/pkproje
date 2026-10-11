/* NEREDEN GELDİ: 486 — reisim 2026-10-10: "test tablosu olan yerler de, son satırı kopyala, satırları otomatik sırala, gibi tuşlar da olsun ve
   yazdığım işlere yarasın"; "rcd testleri tablosunda uygun uygun değil otomatik geliyor ? neden elle seçilmiyor ? neye göre otomatik uygun uygun
   değil diyor ? bununda açıklamasını yap"; ekran görüntüsünde linye tablosunun başı "No | No | Devre". Saf işlevler: satır kopyası (kimlik / no bir
   artar), sıra sütununun başlığı, Sonuç sütununun kuralları (ekranda "Sonuç neye göre çıkar?" — motorun değerlendirmesiyle aynı).
   488 (reisim 2026-10-11): "Sırala" ve satırın Kopyala işareti kalktı ("sırala tuşu da kalksın … düzgün çalışmıyor zaten") — doğal sıra testi
   kalktı; hata listesi 54 kararı: denetçi satırın sonucunu GEREKÇEYLE elle değiştirir (motor.ts ELLE_SONUC / ELLE_GEREKCE), kural sonucu saklanır,
   belgede "(elle; kural: …)" ve gerekçe; uygunluk notlu tabloda yok sayılır; kopyaya geçmez.
   Olumsuz kanıt: tests/bozan/tablo-sonuc.bozan.ts. Tarayıcıda: e2e/foto-oku.spec.ts (son satırı kopyala / elle sonuç / Tip listesi). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { siraBasligi } from "../src/format/duzen.ts";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { degerlendir, ELLE_GEREKCE, ELLE_SONUC, sonucKurallari } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Bolum, Cevaplar, type BolumOf } from "../src/format/tanim.ts";
import { satirKopyala, satirKopyasi, sonrakiKod } from "../src/modules/raporlar/tablo.ts";

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

test("488 elle sonuç: denetçinin seçimi kural sonucunun yerine geçer, kural saklanır; Uygun'a çevrilen kusur olmaz, Uygun değil'e çevrilende gerekçe yazar", () => {
  const t = SABLONLAR.ZPKR02.tanim;
  const rcdKotu = { no: "F1", devre: "Priz", tip: "C", akim: "16", rcd: "30", id: "25", td: "250" };   // kural: RCD testi yetersiz
  const iyi = { no: "F2", devre: "Aydınlatma", tip: "B", akim: "16", ib: "10", iz: "20" };              // kural: Uygun
  const d0 = degerlendir(t, Cevaplar.parse({ tablo: { linye: [rcdKotu, iyi] } }));
  assert.deepEqual(d0.satirlar.linye.map((x) => [x.uygun, x.elle]), [[false, undefined], [true, undefined]]);
  assert.ok(d0.kusurlar.some((k) => k.ref === "linye#0"));
  const d = degerlendir(t, Cevaplar.parse({ tablo: { linye: [
    { ...rcdKotu, [ELLE_SONUC]: "uygun", [ELLE_GEREKCE]: "Test cihazı yeniden ölçtü, 180 ms" },
    { ...iyi, [ELLE_SONUC]: "uygun_degil", [ELLE_GEREKCE]: "Kablo yalıtımı ısınmış görünüyor" },
    { ...iyi, no: "F3", [ELLE_SONUC]: "uygun_degil", [ELLE_GEREKCE]: "kısa" },
    { ...iyi, no: "F4", [ELLE_SONUC]: "bilinmeyen" },
  ] } }));
  const [a, b, c, e] = d.satirlar.linye;
  assert.deepEqual([a.uygun, a.elle], [true, { kural: false, gerekce: "Test cihazı yeniden ölçtü, 180 ms" }]);
  assert.deepEqual([b.uygun, b.elle?.kural], [false, true]);
  assert.deepEqual([e.uygun, e.elle], [true, undefined], "tanınmayan değer yok sayılır");
  assert.ok(!d.kusurlar.some((k) => k.ref === "linye#0"), "Uygun'a çevrilen satır kusur değil");
  assert.ok(d.kusurlar.some((k) => k.ref === "linye#1" && k.metin.includes("Denetçi: Kablo yalıtımı ısınmış görünüyor")));
  assert.deepEqual(d.eksikler.filter((x) => x.alan.endsWith(ELLE_GEREKCE)).map((x) => x.alan), [`linye#2.${ELLE_GEREKCE}`], "gerekçe en az 10 harf");
  assert.equal(c.uygun, false);
  /* uygunluk notlu tabloda (ZPKR01 seçicilik) elle sonuç yok sayılır — not zaten elle seçilir */
  const s = degerlendir(SABLONLAR.ZPKR01.tanim, Cevaplar.parse({ tablo: { selektif: [{ ad: "A", idn: "30", id: "25", td: "250", [ELLE_SONUC]: "uygun", [ELLE_GEREKCE]: "uzun bir gerekçe yazısı" }] } }));
  assert.deepEqual([s.satirlar.selektif[0].uygun, s.satirlar.selektif[0].elle], [false, undefined]);
  /* kopya elle sonucu taşımaz */
  assert.deepEqual(satirKopyasi({ no: "F1", [ELLE_SONUC]: "uygun", [ELLE_GEREKCE]: "uzun bir gerekçe" }, "no"), { no: "F2" });
  /* belge: "(elle; kural: …)" ve tablonun altında gerekçe */
  const o = ornekBelge("ZPKR02");
  const html = renderToStaticMarkup(raporBelgesi({ ...o, cevaplar: { ...o.cevaplar, tablo: { ...o.cevaplar.tablo, linye: [{ ...rcdKotu, [ELLE_SONUC]: "uygun", [ELLE_GEREKCE]: "Test cihazı yeniden ölçtü, 180 ms" }] } } }) as never);
  assert.match(html, /Uygun \(elle; kural: Uygun değil\)/);
  assert.match(html, /1\. satırın sonucu muayene uzmanınca değiştirildi \(kural: Uygun değil\): Test cihazı yeniden ölçtü, 180 ms/);
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
