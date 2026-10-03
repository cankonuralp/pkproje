/* NEREDEN GELDİ: kalıp 15 (süzgeç satırı) + kalıp 8 (ve/veya, imkânsız birleşim) + anayasa 2.8 (dürüst sayaç) — maketteki tek üreticinin
   (docs/assets/maket-ortak.js) uygulamadaki karşılığı src/components/liste/suzgec.ts. K0 (2026-10-03). Maket dersleri:
   · 2026-09-24: ayrılan kişi sayaca giriyordu ("16 kişi", listede 15) → toplam görünüm anahtarının içinden sayılır;
   · reisim 2026-09-28: alan alan arama kutusu olan listede genel arama yok, her kutu kendi alanında arar;
   · Temizle sıralamayı ve görünüm anahtarını sıfırlamaz (süzgeç değiller);
   · 143 ekipman = 15 sayfa: tuşlar tek satır (ilk · … · ±1 · … · son). */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  imkansiz, listele, sayfaOgeleri, siraSonraki, suzgecVar, temizle, uygulanan, yeniDurum, type SuzgecTanimi,
} from "../src/components/liste/suzgec.ts";

interface Kisi { ad: string; il: string; durum: "calisiyor" | "ayrildi"; kod: string; yas: number }
const KISILER: Kisi[] = [
  { ad: "Ayşe Örnek", il: "İzmir", durum: "calisiyor", kod: "K-2", yas: 31 },
  { ad: "Işıl Deneme", il: "Ankara", durum: "calisiyor", kod: "K-10", yas: 44 },
  { ad: "Mert Uydurma", il: "İzmir", durum: "ayrildi", kod: "K-1", yas: 28 },
];
const TANIM: SuzgecTanimi<Kisi> = {
  ad: "Kişilerde ara", ipucu: "Ad, il", birim: "kişi", imkansiz: "Bir kişi aynı anda iki ilde olamaz",
  metin: (k) => `${k.ad} ${k.il}`,
  cipler: [
    { k: "izmir", ad: "İzmir", grup: "il", test: (k) => k.il === "İzmir" },
    { k: "ankara", ad: "Ankara", grup: "il", test: (k) => k.il === "Ankara" },
    { k: "genc", ad: "35 altı", test: (k) => k.yas < 35 },
  ],
  seciciler: [
    { k: "gorunum", ad: "Görünüm", bas: "calisan", secenek: () => [["calisan", "Çalışanlar"], ["hepsi", "Hepsi"]],
      gecer: (k, v) => v === "hepsi" || k.durum === "calisiyor" },
    { k: "il", ad: "İl", secenek: () => [["tumu", "Tümü"], ["İzmir", "İzmir"]], gecer: (k, v) => v === "tumu" || k.il === v },
    { k: "sira", ad: "Sıralama", siralama: true, secenek: () => [["varsayilan", "Varsayılan"]], gecer: () => true },
  ],
  siraAnahtari: { kod: (k) => k.kod, yas: (k) => k.yas },
};

test("başlangıç: görünüm anahtarı içinde toplam, süzgeç yok", () => {
  const d = yeniDurum(TANIM);
  const s = listele(TANIM, d, KISILER);
  assert.equal(s.toplam, 2);
  assert.equal(s.liste.length, 2);
  assert.equal(s.hal, "dolu");
  assert.equal(suzgecVar(TANIM, d), false);
});

test("arama Türkçe harfe duyarsız değil, Türkçe küçültür (İ → i, I → ı)", () => {
  const d = { ...yeniDurum(TANIM), ara: "izmir" };
  assert.deepEqual(listele(TANIM, d, KISILER).liste.map((k) => k.ad), ["Ayşe Örnek"]);
  const d2 = { ...yeniDurum(TANIM), ara: "ışıl" };
  assert.deepEqual(listele(TANIM, d2, KISILER).liste.map((k) => k.ad), ["Işıl Deneme"]);
  assert.equal(uygulanan(TANIM, d), 1);
});

test("çip sayıları çipler hariç süzgeçten; veya / ve; aynı gruptan iki çip 've' ile imkânsız", () => {
  const d = { ...yeniDurum(TANIM), secili: ["izmir", "ankara"] };
  assert.equal(listele(TANIM, d, KISILER).liste.length, 2);
  const ve = { ...d, kip: "ve" as const };
  const s = listele(TANIM, ve, KISILER);
  assert.equal(s.liste.length, 0);
  assert.equal(imkansiz(TANIM, ve), true);
  assert.equal(s.hal, "imkansiz");
  const farkliGrup = { ...yeniDurum(TANIM), secili: ["izmir", "genc"], kip: "ve" as const };
  assert.equal(imkansiz(TANIM, farkliGrup), false);
  assert.equal(listele(TANIM, farkliGrup, KISILER).liste.length, 1);
  assert.equal(listele(TANIM, farkliGrup, KISILER).tb.length, 2);
});

test("süzgeç boş ≠ veri yok ≠ görünüm boş", () => {
  assert.equal(listele(TANIM, { ...yeniDurum(TANIM), ara: "yok" }, KISILER).hal, "suzgec-bos");
  assert.equal(listele(TANIM, yeniDurum(TANIM), []).hal, "veri-yok");
  assert.equal(listele(TANIM, yeniDurum(TANIM), [KISILER[2]]).hal, "gorunum-bos");
});

test("Temizle süzgeci sıfırlar; sıralama ve görünüm anahtarı kalır, sayılmaz", () => {
  const d = { ...yeniDurum(TANIM), ara: "a", secili: ["genc"], sec: { gorunum: "hepsi", il: "İzmir", sira: "kod-artan" } };
  assert.equal(uygulanan(TANIM, d), 3);
  const t = temizle(TANIM, d);
  assert.equal(t.ara, "");
  assert.deepEqual(t.secili, []);
  assert.deepEqual(t.sec, { gorunum: "hepsi", il: "tumu", sira: "kod-artan" });
  assert.equal(suzgecVar(TANIM, t), false);
});

test("alan alan arama: her kutu kendi alanında arar", () => {
  const t: SuzgecTanimi<Kisi> = { ...TANIM, alanlar: [{ k: "kod", ad: "Kod", metin: (k) => k.kod }, { k: "il", ad: "İl", metin: (k) => k.il }] };
  const d = { ...yeniDurum(t), alan: { kod: "k-1", il: "ankara" } };
  assert.deepEqual(listele(t, d, KISILER).liste.map((k) => k.kod), ["K-10"]);
  assert.equal(uygulanan(t, d), 2);
});

test("sıralama: başlık döngüsü artan → azalan → varsayılan; kod sayısal sırada (K-2 < K-10)", () => {
  assert.equal(siraSonraki("varsayilan", "kod"), "kod-artan");
  assert.equal(siraSonraki("kod-artan", "kod"), "kod-azalan");
  assert.equal(siraSonraki("kod-azalan", "kod"), "varsayilan");
  assert.equal(siraSonraki("yas-artan", "kod"), "kod-artan");
  const d = { ...yeniDurum(TANIM), sec: { ...yeniDurum(TANIM).sec, gorunum: "hepsi", sira: "kod-artan" } };
  assert.deepEqual(listele(TANIM, d, KISILER).liste.map((k) => k.kod), ["K-1", "K-2", "K-10"]);
  const az = { ...d, sec: { ...d.sec, sira: "yas-azalan" } };
  assert.deepEqual(listele(TANIM, az, KISILER).liste.map((k) => k.yas), [44, 31, 28]);
});

test("sayfalama: sayfa boyu, taşan sayfa sona çekilir", () => {
  const t = { ...TANIM, sayfa: 2 };
  const d = { ...yeniDurum(t), sec: { ...yeniDurum(t).sec, gorunum: "hepsi" }, sayfa: 9 };
  const s = listele(t, d, KISILER);
  assert.equal(s.sayfaSayisi, 2);
  assert.equal(s.sayfa, 2);
  assert.equal(s.gorunen.length, 1);
});

test("sayfa tuşları: 7 ve altı hepsi; fazlası ilk · … · ±1 · … · son", () => {
  assert.equal(sayfaOgeleri(7, 4).length, 7);
  const o = sayfaOgeleri(15, 8).map((x) => (x.tur === "ara" ? "…" : x.komsu ? `(${x.no})` : String(x.no)));
  assert.deepEqual(o, ["1", "…", "(7)", "8", "(9)", "…", "15"]);
  assert.deepEqual(sayfaOgeleri(15, 1).map((x) => (x.tur === "ara" ? "…" : x.no)), [1, 2, "…", 15]);
});
