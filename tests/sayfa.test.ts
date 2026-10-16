/* NEREDEN GELDİ: 2026-10-16 — reisim: "herhangi bir tabloda 20 den sonrası sayfalı olacak demiştim örnek atmıştım bu sanırım yapılmamış bunu da
   düzelt herhangi bir liste tablo, ekranda çok fazla veri olunca ekran kasacağı için 20 den fazlası sayfalı olsun diğer sayfalara doğru aksın"
   (örnek: saha raporunda pano sigortaları (linye) ölçüm tablosu 35+ satır tek sayfadaydı; pkproje §9 2026-10-15 "S.A.Y CLAUDE GİBİ" (3)).
   Sayfa hesabı saf: src/components/liste/sayfa.ts (ekranın parçası Sayfalayici.tsx useSayfa) + saha raporunun sayfaları src/modules/raporlar/sayfa-yeri.ts
   (tablo değişince hangi sayfa, Onaya gönder'in eksiği ve S.A.Y'ın işareti hangi sayfayı açar; kontrol listesinin sayfası). Kilitlenen: sayfa sayısı,
   20 ve altında sayfalama yok, genel satır numarası, eklenen satırın sayfası, silmede boş sayfada kalınmaz, bölümün EN ÜSTTEKİ eksiğinin sayfası;
   2026-10-16 (inceleme): tablonun İLK DEĞİŞEN satırı (değerce — yeni nesne değişiklik sayılmaz), kontrol maddesinin yeri, maddelerin sayfa dilimi
   (gruplar boyunca, numara genel). Olumsuz kanıt: tests/bozan/sayfa.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { degisenSayfa, sayfaDilimi, sayfaHesapla, satirSayfasi, TABLO_SAYFA } from "../src/components/liste/sayfa.ts";
import { satirAnahtari } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { alanYeri, hedefSayfalari, ilkDegisenSatirlar, maddeDilimi, maddeSiralari, sayfalariYaz, satirYeri } from "../src/modules/raporlar/sayfa-yeri.ts";
import { KALIP } from "../src/styles/kalip.ts";

test("sayfa boyu kalıptan: 20 (kalip.ts sayfa.tablo)", () => {
  assert.equal(KALIP.sayfa.tablo, 20);
  assert.equal(TABLO_SAYFA, KALIP.sayfa.tablo);
});

test("sayfa sayısı; 20 ve altında sayfalayıcı yok, 21'de iki sayfa", () => {
  assert.deepEqual([0, 1, 20, 21, 40, 41, 55].map((n) => sayfaHesapla(n, 1).sayfaSayisi), [1, 1, 1, 2, 2, 3, 3]);
  assert.equal(sayfaHesapla(20, 1).sayfali, false);
  assert.equal(sayfaHesapla(21, 1).sayfali, true);
  assert.equal(sayfaHesapla(0, 1).sayfali, false);
});

test("genel satır numarası: 2. sayfanın ilk satırı 21; dilim yalnız sayfanın satırları", () => {
  const l = Array.from({ length: 45 }, (_, i) => i + 1);
  const h = sayfaHesapla(l.length, 2);
  assert.deepEqual([h.sayfa, h.bas, h.son], [2, 20, 40]);
  const d = sayfaDilimi(l, h);
  assert.equal(d.length, 20);
  assert.equal(d[0], 21, "2. sayfanın ilk satırının numarası 21");
  assert.deepEqual(sayfaDilimi(l, sayfaHesapla(l.length, 3)), [41, 42, 43, 44, 45]);
});

test("istenen sayfa sınırlı: sayfa sayısını aşan sona, 1'in altı başa (boş sayfada kalınmaz)", () => {
  assert.equal(sayfaHesapla(21, 5).sayfa, 2);
  assert.equal(sayfaHesapla(21, 0).sayfa, 1);
  assert.equal(sayfaHesapla(21, Number.NaN).sayfa, 1);
  assert.equal(sayfaHesapla(0, 3).sayfa, 1);
});

test("satırın sayfası (sıra 0'dan)", () => {
  assert.deepEqual([0, 19, 20, 39, 40].map((i) => satirSayfasi(i)), [1, 1, 2, 2, 3]);
});

test("satır eklenince eklenen İLK satırın sayfası açılır; çok satır eklenince eklemenin başladığı sayfa", () => {
  assert.equal(degisenSayfa(20, 21, 1), 2, "21. satır eklenince 2. sayfa");
  assert.equal(degisenSayfa(19, 20, 1), 1, "20. satır 1. sayfada");
  assert.equal(degisenSayfa(25, 26, 1), 2, "1. sayfadayken eklenen 26. satırın sayfası");
  assert.equal(degisenSayfa(0, 50, 1), 1, "boş tabloya 50 satır: ilk eklenen 1. sayfada");
  assert.equal(degisenSayfa(25, 55, 1), 2, "25 satıra 30 satır: ilk eklenen 26. satır 2. sayfada");
  assert.equal(degisenSayfa(40, 41, 1), 3);
});

test("satır silinince sayfa taşmaz: son sayfanın son satırı silinince bir önceki sayfa", () => {
  assert.equal(degisenSayfa(21, 20, 2), 1, "21. satır silindi — 2. sayfa boş kalmaz");
  assert.equal(degisenSayfa(41, 40, 3), 2);
  assert.equal(degisenSayfa(30, 29, 2), 2, "sayfada satır kaldıkça aynı sayfa");
  assert.equal(degisenSayfa(30, 30, 2), 2, "satır sayısı aynı: sayfa aynı");
  assert.equal(degisenSayfa(5, 0, 1), 1);
});

test("saha raporu: alan anahtarından tablo satırı (motorun satirAnahtari ile birebir); tablo dışı alan null", () => {
  assert.deepEqual(satirYeri(satirAnahtari("linye", 22, "devre")), { bolum: "linye", satir: 22 });
  assert.deepEqual(satirYeri(satirAnahtari("pd", 0, "_gerekce")), { bolum: "pd", satir: 0 });
  assert.deepEqual(satirYeri(satirAnahtari("linye", 3, "not")), { bolum: "linye", satir: 3 });
  for (const a of ["tarih.bas", "linye", "m12", "m12.foto", "m12.derece", "kunye.firma", "cihaz.t1"]) assert.equal(satirYeri(a), null, a);
});

test("saha raporu: tablo başına EN ÜSTTEKİ satırın sayfası (eksiğe git, S.A.Y işareti)", () => {
  assert.deepEqual(hedefSayfalari([{ bolum: "linye", satir: 30 }, { bolum: "linye", satir: 22 }, { bolum: "pd", satir: 3 }, { bolum: "linye", satir: 45 }]),
    { linye: 2, pd: 1 });
  assert.deepEqual(hedefSayfalari([]), {});
  assert.deepEqual(hedefSayfalari([{ bolum: "linye", satir: 19 }, { bolum: "linye", satir: 20 }]), { linye: 1 });
});

/* 2026-10-16 (inceleme bulgusu: S.A.Y aynı işte 3. satıra yazıp sona 5 satır eklediğinde akış S.A.Y'ın açtığı sayfayı eziyordu; Excel boş satırlara
   yazınca sayfa açılmıyordu): tek kural — tablo değişince İLK DEĞİŞEN satırın sayfası */
test("saha raporu: tablonun ilk değişen satırı — ekleme, yazma, silme; değerce aynı yeni nesne değişiklik değil", () => {
  const satir = (n: number) => Array.from({ length: n }, (_, i) => ({ no: `F${i + 1}` }));
  const once = { linye: satir(35), pd: satir(2) };
  /* sona 5 satır (Son satırı kopyala, S.A.Y satir_ekle): eklenen ilk satır (36.) — 2. sayfa */
  assert.deepEqual(ilkDegisenSatirlar(once, { ...once, linye: [...once.linye, ...satir(5)] }), { linye: 35 });
  /* aynı işte 3. satıra yazılıp sona satır eklendi: 3. satır — S.A.Y'ın yazdığı görünür (1. sayfa) */
  const yazili = once.linye.map((s, i) => (i === 2 ? { ...s, devre: "Priz" } : s));
  assert.deepEqual(ilkDegisenSatirlar(once, { ...once, linye: [...yazili, ...satir(5)] }), { linye: 2 });
  assert.equal(satirSayfasi(ilkDegisenSatirlar(once, { ...once, linye: [...yazili, ...satir(5)] }).linye), 1);
  /* Excel boş var olan satıra yazdı (sayı değişmedi): yazılan satır */
  assert.deepEqual(ilkDegisenSatirlar(once, { ...once, linye: once.linye.map((s, i) => (i === 27 ? { ...s, devre: "Kombi" } : s)) }), { linye: 27 });
  /* 26. satır silindi: o sıra; değişmeyen tablo (pd) listede yok */
  assert.deepEqual(ilkDegisenSatirlar(once, { ...once, linye: once.linye.filter((_, i) => i !== 25) }), { linye: 25 });
  /* değerce aynı yeni nesneler (cihazdaki kayıt yüklendi, geri alındı): değişiklik yok — sayfa atlamaz */
  assert.deepEqual(ilkDegisenSatirlar(once, { linye: satir(35), pd: satir(2) }), {});
  assert.deepEqual(ilkDegisenSatirlar(once, once), {});
  /* yeni tablo ve boşalan tablo: 0 */
  assert.deepEqual(ilkDegisenSatirlar({}, { yeni: satir(1) }), { yeni: 0 });
  assert.deepEqual(ilkDegisenSatirlar(once, { linye: once.linye }), { pd: 0 });
});

test("saha raporu: açık sayfalar değişmiyorsa aynı nesne (yazarken her tuşta yeniden çizim yok)", () => {
  const s = { linye: 2, gozle: 1 };
  assert.equal(sayfalariYaz(s, { linye: 2 }), s);
  assert.equal(sayfalariYaz(s, {}), s);
  assert.deepEqual(sayfalariYaz(s, { linye: 1, pd: 3 }), { linye: 1, gozle: 1, pd: 3 });
});

test("saha raporu: kontrol maddesinin yeri (grupları boyunca genel sıra) — cevabı, kusur açıklaması, derecesi, fotoğrafı aynı yerde", () => {
  const t = SABLONLAR.ZPKR02.tanim, b = t.bolumler.find((x) => x.id === "gozle");
  if (!b || b.blok !== "liste") throw new Error("ZPKR02 gözle kontrol listesi yok");
  const maddeler = b.gruplar.flatMap((g) => g.maddeler);
  assert.ok(maddeler.length > 20, "Bakanlık formatının kontrol listesi 20'den çok");
  const yer = maddeSiralari(t);
  const m21 = maddeler[20].id;
  for (const a of [m21, `${m21}.not`, `${m21}.derece`, `${m21}.foto`]) assert.deepEqual(alanYeri(a, yer), { bolum: "gozle", satir: 20 }, a);
  assert.deepEqual(alanYeri(satirAnahtari("linye", 22, "devre"), yer), { bolum: "linye", satir: 22 });
  for (const a of ["tarih.bas", "linye", "kunye.firma", "cihaz.t1"]) assert.equal(alanYeri(a, yer), null, a);
  /* eksiğe git: 21. madde ve 3. maddenin eksiği → 1. sayfa (en üstteki); yalnız 21. madde → 2. sayfa */
  assert.deepEqual(hedefSayfalari([alanYeri(`${m21}.not`, yer)!, alanYeri(maddeler[2].id, yer)!]), { gozle: 1 });
  assert.deepEqual(hedefSayfalari([alanYeri(m21, yer)!]), { gozle: 2 });
});

test("saha raporu: kontrol listesinin sayfası — 20 madde gruplar boyunca, grup başlığı taşan sayfada da, numara genel", () => {
  const b = SABLONLAR.ZPKR02.tanim.bolumler.find((x) => x.id === "gozle");
  if (!b || b.blok !== "liste") throw new Error("ZPKR02 gözle kontrol listesi yok");
  const toplam = b.gruplar.reduce((n, g) => n + g.maddeler.length, 0);
  const s1 = sayfaHesapla(toplam, 1), s2 = sayfaHesapla(toplam, 2);
  const d1 = maddeDilimi(b.gruplar, s1.bas, s1.son), d2 = maddeDilimi(b.gruplar, s2.bas, s2.son);
  assert.equal(d1.reduce((n, x) => n + x.maddeler.length, 0), 20);
  assert.equal(d2.reduce((n, x) => n + x.maddeler.length, 0), toplam - 20);
  /* iki sayfanın maddeleri bütün liste, sırasıyla, tekrarsız */
  assert.deepEqual([...d1, ...d2].flatMap((x) => x.maddeler.map((y) => y.m.id)), b.gruplar.flatMap((g) => g.maddeler.map((m) => m.id)));
  /* 2. sayfanın ilk maddesi: grubunun gerçek sırası (mi) ve grubun sırası (gi) — numara "N.gi+1.mi+1" genel kalır */
  const ilk = d2[0], gercek = b.gruplar[ilk.gi].maddeler.findIndex((m) => m.id === ilk.maddeler[0].m.id);
  assert.equal(ilk.maddeler[0].mi, gercek);
  for (const x of [...d1, ...d2]) for (const y of x.maddeler) assert.equal(b.gruplar[x.gi].maddeler[y.mi].id, y.m.id);
  /* sayfaya taşan grup iki sayfada da (başlığı yeniden yazılır) */
  assert.equal(d1.at(-1)?.gi, d2[0].gi);
  /* maddesiz grup yerinin düştüğü sayfada; boş listede bütün gruplar */
  const g = [{ id: "a", maddeler: [1, 2, 3] }, { id: "bos", maddeler: [] }, { id: "c", maddeler: [4] }, { id: "son", maddeler: [] }];
  assert.deepEqual(maddeDilimi(g, 0, 2).map((x) => x.g.id), ["a"]);
  assert.deepEqual(maddeDilimi(g, 2, 4).map((x) => x.g.id), ["a", "bos", "c", "son"]);
  assert.deepEqual(maddeDilimi([{ id: "x", maddeler: [] }, { id: "y", maddeler: [] }], 0, 0).map((x) => x.g.id), ["x", "y"]);
});
