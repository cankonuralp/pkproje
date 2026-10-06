/* NEREDEN GELDİ: maket maket-veri.js MV.ayMaliyet / MV.isKarlilik / MV.ayGelirGider / MV.donemGelirGider (2026-09-27 reisim: "plan yapıldığında denetçi
   maaşı yakıt araç kira bedeli ofis giderleri vergiler vb tüm giderler etki edecek şekilde kazanç ve gider hesaplanarak kar hesaplanacak kar yüzdesi
   yazacak iş başına"; "gelir gidere göre bilançoda olacak"; L3 toplam) · maket gider-excel-ice (Excel'den yükle satır denetimi). Saf hesap, elle
   hesaplanmış değerlerle (328). Veritabanı tarafı tests/muhasebe.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { giderExceli, giderSatirlari, oranOku, tarihOku, tutarOku } from "../src/modules/muhasebe/excel.ts";
import { tabloOku } from "../src/components/disa/oku.ts";
import { ayGelirGider, ayMaliyet, bordroAy, donemGelirGider, gunlukMaliyet, isKarlilik, oncekiAy, sonAylar, type KarVerisi } from "../src/modules/muhasebe/karlilik.ts";
import { GiderGirdisi, giderKdv } from "../src/modules/muhasebe/sema.ts";

const V: KarVerisi = {
  kisiler: [
    { id: "d1", ad: "Deneme Bir", basla: "2026-01-01", ayrildi: null, denetci: true },
    { id: "d2", ad: "Deneme İki", basla: "2026-01-01", ayrildi: null, denetci: true },
    { id: "o1", ad: "Deneme Ofis", basla: "2026-01-01", ayrildi: null, denetci: false },
    { id: "x1", ad: "Deneme Ayrılan", basla: "2025-01-01", ayrildi: "2026-07-15", denetci: true },
  ],
  bordrolar: [
    { personelId: "d1", ay: "2026-09", maliyet: 2_200_000 },
    { personelId: "d2", ay: "2026-08", maliyet: 4_400_000 },
    { personelId: "o1", ay: "2026-09", maliyet: 1_100_000 },
    { personelId: "x1", ay: "2026-07", maliyet: 9_999_999 },
  ],
  sabitAylik: 2_200_000,
  giderler: [
    { tarih: "2026-09-10", planId: "P1", tutar: 12_000, oran: 20, durum: "odendi" },
    { tarih: "2026-09-05", planId: null, tutar: 22_000, oran: 10, durum: "onaylandi" },
    { tarih: "2026-09-11", planId: "P1", tutar: 99_999, oran: 20, durum: "red" },
  ],
  raporlar: [
    { planId: "P1", personelId: "d1", gun: "2026-09-10" }, { planId: "P1", personelId: "d1", gun: "2026-09-10" },
    { planId: "P2", personelId: "d1", gun: "2026-09-10" }, { planId: "P2", personelId: "d1", gun: "2026-09-10" },
    { planId: "P1", personelId: "d2", gun: "2026-09-10" },
  ],
};

test("KDV dahil tutardan KDV ve KDV hariç (kuruş, yuvarlanır); gider şeması", () => {
  assert.deepEqual(giderKdv(12_000, 20), { kdv: 2_000, haric: 10_000 });
  assert.deepEqual(giderKdv(22_000, 10), { kdv: 2_000, haric: 20_000 });
  assert.deepEqual(giderKdv(100, 0), { kdv: 0, haric: 100 });
  assert.deepEqual(giderKdv(101, 1), { kdv: 1, haric: 100 });
  const g = GiderGirdisi.safeParse({ tarih: "2026-09-10", tur: "yakit", tutar: "1.250,00", oran: "20", aciklama: " ", is: "", personel: "" });
  assert.ok(g.success);
  assert.deepEqual([g.data.tutar, g.data.oran, g.data.aciklama, g.data.is, g.data.odeme], [125_000, 20, null, null, "odendi"]);
  for (const [k, v] of [["oran", "7"], ["tur", "uzay"], ["tutar", "0"], ["is", "x"], ["odeme", "red"], ["aciklama", "a".repeat(121)]]) {
    assert.equal(GiderGirdisi.safeParse({ tarih: "2026-09-10", tur: "yakit", tutar: "1", oran: "20", [k]: v }).success, false, k);
  }
});

test("bordro: ayın bordrosu, yoksa önceki son, o da yoksa ilk (tahmini); günlük maliyet ÷ 22", () => {
  assert.equal(bordroAy(V, "d1", "2026-09")?.ay, "2026-09");
  assert.equal(bordroAy(V, "d2", "2026-09")?.ay, "2026-08", "önceki son");
  assert.equal(bordroAy(V, "d1", "2026-08")?.ay, "2026-09", "hiç önceki yok: ilk");
  assert.equal(bordroAy(V, "yok", "2026-09"), null);
  assert.equal(gunlukMaliyet(V, "d1", "2026-09"), 100_000);
  assert.equal(gunlukMaliyet(V, "d2", "2026-09"), 200_000);
});

test("ay maliyeti: çalışanlar (ayrılan sonraki aylarda yok), denetçi / diğer maaş, işe bağlı ve genel masraf (KDV hariç, red hariç), denetçi-günü payı", () => {
  const a = ayMaliyet(V, "2026-09");
  assert.deepEqual({ ...a }, { ay: "2026-09", kisi: 3, denetciSayisi: 2, maasDenetci: 6_600_000, maasDiger: 1_100_000, sabit: 2_200_000, genel: 20_000, masraf: 10_000,
    bordroVar: true, gunPay: 75_455 });
  const t = ayMaliyet(V, "2026-07");
  assert.equal(t.kisi, 4, "ayrıldığı ay hâlâ sayılır");
  assert.equal(t.bordroVar, true);
  assert.equal(ayMaliyet(V, "2026-06").bordroVar, false, "o ay hiç bordro yok: tahmini");
});

test("iş kârı: gelir − işe bağlı masraf − denetçi maliyeti (kişi-gün, aynı gün iki işe bölünür) − genel gider payı", () => {
  const k = isKarlilik(V, { id: "P1", tarih: "2026-09-10", gelir: 1_000_000 });
  assert.deepEqual(k.kisiler, [{ kisi: "d1", ad: "Deneme Bir", gun: 0.5, gunluk: 100_000 }, { kisi: "d2", ad: "Deneme İki", gun: 1, gunluk: 200_000 }]);
  assert.deepEqual([k.rapor, k.gun, k.dogrudan, k.personel, k.genel, k.gider, k.kar, k.oran, k.tahmini], [3, 1.5, 10_000, 250_000, 113_183, 373_183, 626_817, 62.7, false]);
  const bos = isKarlilik(V, { id: "P9", tarih: "2026-09-01", gelir: 0 });
  assert.deepEqual([bos.gider, bos.kar, bos.oran], [0, 0, 0], "raporu ve masrafı olmayan iş");
});

test("gelir-gider: ay (o ay denetlenen işlerin raporlananı − maaş − masraf − sabit) ve dönem toplamı, aylara göre", () => {
  const isler = [{ id: "P1", tarih: "2026-09-10", gelir: 1_000_000 }, { id: "P2", tarih: "2026-09-10", gelir: 500_000 }, { id: "P3", tarih: "2026-08-01", gelir: 300_000 }];
  const a = ayGelirGider(V, "2026-09", isler);
  assert.deepEqual([a.isler, a.gelir, a.gider, a.kar, a.oran], [["P1", "P2"], 1_500_000, 9_930_000, -8_430_000, -562]);
  const d = donemGelirGider(V, ["2026-08", "2026-09"], isler);
  assert.deepEqual([d.ay, d.isler, d.gelir, d.gider, d.kar, d.maas, d.masraf, d.genel, d.sabit, d.tahmini], [2, ["P3", "P1", "P2"], 1_800_000, 19_830_000, -18_030_000,
    15_400_000, 10_000, 20_000, 4_400_000, 0]);
  assert.equal(donemGelirGider(V, ["2026-06"], isler).tahmini, 1);
  assert.equal(ayGelirGider(V, "2026-06", isler).oran, null, "gelir yok");
  assert.deepEqual(sonAylar("2026-02", 4), ["2026-02", "2026-01", "2025-12", "2025-11"]);
  assert.equal(oncekiAy("2026-01"), "2025-12");
});

test("Excel'den yükle: başlık atlanır, boş satır yok sayılır; tarih, tür (ad ya da anahtar), tutar, KDV oranı, açıklama, proje no satır satır denetlenir", () => {
  assert.equal(tarihOku("1.2.2026"), "2026-02-01");
  assert.equal(tarihOku("31.02.2026"), null);
  assert.equal(tarihOku("2026-09-10"), "2026-09-10");
  const planlar = new Map([["P-0926-001", "plan-1"]]);
  const l = giderSatirlari([
    ["Tarih", "Tür", "Tutar (KDV dahil)", "KDV oranı", "Açıklama", "Proje no"],
    ["05.10.2026", "Yakıt", "1.250,00", "", "Deneme", ""],
    ["", "", "", "", "", ""],
    ["06.10.2026", "Yakıt", "10", "20", "", ""],
    ["01.10.2026", "Uzay", "10", "20", "", ""],
    ["01.10.2026", "konaklama", "1250.50", "%10", "Otel", "p-0926-001"],
    ["01.10.2026", "Yol", "abc", "20", "", ""],
    ["01.10.2026", "Yol", "10", "7", "", ""],
    ["01.10.2026", "Yol", "10", "20", "", "P-9999-001"],
    ["01.10.2026", "Yol", "10", "20", "a".repeat(121), ""],
  ], planlar, "2026-10-05");
  assert.deepEqual(l.map((x) => [x.satir, x.ok, x.neden]), [
    [2, true, ""], [4, false, "İleri tarihli, atlanır"], [5, false, "Tür bulunamadı"], [6, true, ""], [7, false, "Tutar geçersiz"],
    [8, false, "KDV oranı %20, %10, %1 ya da %0"], [9, false, "Proje no bulunamadı"], [10, false, "Açıklama en çok 120 karakter"],
  ]);
  assert.deepEqual([l[0].tur, l[0].tutar, l[0].oran, l[0].plan], ["yakit", 125_000, 20, null], "oran boşsa türün varsayılanı");
  assert.deepEqual([l[3].tur, l[3].tutar, l[3].oran, l[3].plan], ["konaklama", 125_050, 10, "plan-1"]);
  assert.equal(giderSatirlari([["05.10.2026", "Yakıt", "1", "", "", ""]], planlar, "2026-10-05")[0].ok, true, "başlıksız dosya");
});

/* 2026-10-06 (328 incelemesi; maket tutarOku / oranOku): Excel'in sakladığı sayı hücresi her ondalıkta, Türkçe yazım ortak şemayla; yüzde biçimli
   oran (0.2); tür yalnız kendi anahtarı; tutar üst sınırı satırda; dışa aktarımda tutarlar sayı hücresi */
test("Excel okuma: sayı hücresi (nokta ondalık, uzun kesir) ve Türkçe yazım; yüzde biçimli oran; nesne özelliği tür değildir; çok büyük tutar satırda atlanır", async () => {
  /* 2026-10-06 (329–332 incelemesi): " 3.200 TL" eskiden 3,20 TL okunuyordu (test bu yanlışı kilitliyordu) — metin hücresi ve binlik öbek Türkçe */
  assert.deepEqual(["999.996", "1250.0999999999999", "1250", "1.250,50", "1250,5", " 3.200 TL", "12.500", "1.250.000", "3.200", "abc", "-5"].map(tutarOku),
    [100_000, 125_010, 125_000, 125_050, 125_050, 320_000, 1_250_000, 125_000_000, 320_000, null, null]);
  assert.deepEqual(["20", "%20", "0.2", "0,1", "0.01", "", "x"].map(oranOku), [20, 20, 20, 10, 1, null, NaN]);
  const l = giderSatirlari([
    ["05.10.2026", "constructor", "1", "20", "", ""], ["05.10.2026", "__proto__", "1", "20", "", ""], ["05.10.2026", "Yakıt", "2.000.000.000,00", "20", "", ""],
    ["05.10.2026", "Yakıt", "999.996", "0.2", "", ""], ["05.10.2026", "Konaklama", "1100", "0,1", "", ""],
  ], new Map(), "2026-10-05");
  assert.deepEqual(l.map((x) => [x.ok, x.neden, x.tutar, x.oran]), [[false, "Tür bulunamadı", 100, 20], [false, "Tür bulunamadı", 100, 20],
    [false, "Tutar çok büyük", 200_000_000_000, 20], [true, "", 100_000, 20], [true, "", 110_000, 10]]);
  const b = await tabloOku("giderler.xlsx", giderExceli([{ no: "G-1026-001", tarih: "2026-10-05", tur: "yakit", tutar: 125_050, oran: 20, aciklama: null, isNo: null, personel: null, durum: "odendi",
    odeme: "2026-10-05", belge: false }]));
  assert.deepEqual(b[1].slice(3, 7), ["1250.5", "20", "208.42", "1042.08"], "tutar, oran, KDV ve KDV hariç SAYI hücresi (metin olsaydı \"1.250,50\")");
});
