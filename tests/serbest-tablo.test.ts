/* NEREDEN GELDİ: 2026-10-24 — reisim: "hangi firmanın hangi PDF formunu yüklersem yükleyeyim şablon o forma dönüşsün ve format kurucuda İSTEDİĞİM
   GİBİ düzenleyebileyim … araçta 'bu girilir, bu girilemez' sınırı kalmasın"; maket docs/maket/format-serbest.html onaylı ("Maketi onaylıyorum,
   koda geç"). Format tanımının serbest tablo bölümü (src/format/tablo.ts, tanim.ts blok "tablo"): birleştir / ayır, satır ve sütun ekle / sil (birleşik
   hücre büyür / küçülür), sütun genişliği, kenarlar, görünüm; şema (taşma, üst üste binme, cevaplı hücrenin kimliği); sanal bölümler — cevaplar
   mevcut alan / madde / tablo cevaplarıdır: motor kusuru ve eksiği aynı yoldan bulur; belge değerleri ızgarada basar; yan yana yerleşim; kurucunun
   belge yazısı ayarı. Saf (veritabanısız). Olumsuz kanıt: tests/bozan/serbest-tablo.bozan.ts.
   2026-10-24 (denetim — basılı formun iki sütunlu kontrol listesi): sıra numaraları ve sahadaki madde sırası sütun sütun (önce sol sütun, alt
   başlıkla bölünen sütun dizisi sırasıyla); yan yana iki listede maddeye ötekinin yazısı karışmaz. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { degerlendir } from "../src/format/motor.ts";
import {
  ayir, birlestir, diziSirasi, genislet, hucreBicemi, kapsama, kenarYaz, maddeMetni, sahaTanimi, satirEkle, satirSil, siraNumaralari, stilYaz, sutunEkle, sutunGenisligi, sutunSil,
  sutunYuzdeleri, yerlesimSatirlari, yeniTablo, type TabloBolumu,
} from "../src/format/tablo.ts";
import { Bolum, Cevaplar, FormatTanimi, type Hucre } from "../src/format/tanim.ts";
import { belgeYazisiYaz, yeniBolum } from "../src/modules/rapor-format/kurucu.ts";

/** her konum tam bir hücreye ait (boşluk ve üst üste binme yok) */
const tam = (b: TabloBolumu) => kapsama(b).every((s) => s.every((n) => n !== null)) && Bolum.safeParse(b).success;
const yaz = (b: TabloBolumu, r: number, c: number, m: string): TabloBolumu => ({ ...b, hucreler: b.hucreler.map((h) => (h.r === r && h.c === c ? { ...h, m } : h)) });

test("yeni tablo: R × C boş hücre, eşit sütun, şemadan geçer; kurucunun yeni bölümü 3 × 4", () => {
  const b = yeniTablo("t1", "Tablo", 3, 4);
  assert.equal(b.hucreler.length, 12);
  assert.deepEqual(sutunYuzdeleri(b), [25, 25, 25, 25]);
  assert.ok(tam(b));
  const t = FormatTanimi.parse({ sema: 1, bolumler: [] });
  const y = yeniBolum(t, "tablo", "Serbest tablo");
  assert.ok(y.blok === "tablo" && y.hucreler.length === 12 && y.satirlar.length === 3);
});

test("birleştir: içerik sol üstteki (boşsa ilk dolu), seçim birleşik hücreyi tam kapsayacak kadar büyür; ayır geri açar", () => {
  let b = yaz(yeniTablo("t1", "T", 3, 3), 1, 1, "orta");
  b = birlestir(b, { r1: 0, c1: 0, r2: 1, c2: 1 });
  const h = b.hucreler.find((x) => x.r === 0 && x.c === 0)!;
  assert.deepEqual([h.rs, h.cs, h.m], [2, 2, "orta"]);
  assert.ok(tam(b));
  assert.equal(b.hucreler.length, 6);
  /* birleşik hücrenin bir köşesine dokunan seçim onu tam kapsar */
  assert.deepEqual(genislet(b, { r1: 1, c1: 1, r2: 2, c2: 2 }), { r1: 0, c1: 0, r2: 2, c2: 2 });
  const a = ayir(b, { r1: 1, c1: 1, r2: 1, c2: 1 });
  assert.equal(a.hucreler.length, 9);
  assert.ok(tam(a));
  assert.equal(a.hucreler.find((x) => x.r === 0 && x.c === 0)!.m, "orta");
});

test("satır / sütun ekle ve sil: birleşik hücre büyür / küçülür, ızgara bütün kalır, son satır silinmez", () => {
  let b = birlestir(yeniTablo("t1", "T", 2, 3), { r1: 0, c1: 0, r2: 0, c2: 2 });
  b = sutunEkle(b, 1);
  assert.equal(b.hucreler.find((x) => x.r === 0)!.cs, 4, "araya giren sütun birleşik hücreyi büyütür");
  assert.equal(b.sutun.length, 4);
  assert.ok(tam(b));
  b = sutunEkle(b, 4);
  assert.equal(b.hucreler.find((x) => x.r === 0)!.cs, 4, "sona eklenen sütun birleşik hücrenin dışında");
  assert.ok(tam(b));
  b = sutunSil(b, 0);
  assert.equal(b.hucreler.find((x) => x.r === 0 && x.c === 0)!.cs, 3);
  assert.ok(tam(b));
  b = birlestir(b, { r1: 0, c1: 3, r2: 1, c2: 3 });
  b = satirEkle(b, 1);
  assert.equal(b.hucreler.find((x) => x.r === 0 && x.c === 3)!.rs, 3);
  assert.ok(tam(b));
  b = satirSil(satirSil(b, 2), 1);
  assert.equal(b.satirlar.length, 1);
  assert.ok(tam(b));
  assert.equal(satirSil(b, 0), b, "son satır kalır");
  /* stil komşudan: yeni satır üstündekinin görünümüyle */
  const z = stilYaz(yeniTablo("t2", "T", 1, 2), { r1: 0, c1: 0, r2: 0, c2: 1 }, "z", "#E7E7E7");
  assert.ok(satirEkle(z, 1).hucreler.filter((x) => x.r === 1).every((x) => x.s?.z === "#E7E7E7"));
});

test("sütun genişliği komşudan alınır; kenar: dış / iç / tek kenar / yok; görünüm satır içi biçemde", () => {
  const b = sutunGenisligi(yeniTablo("t1", "T", 1, 4), 1, 40);
  assert.deepEqual(sutunYuzdeleri(b), [25, 40, 10, 25]);
  let k = kenarYaz(yeniTablo("t2", "T", 2, 2), { r1: 0, c1: 0, r2: 1, c2: 1 }, "ic", 2, 1);
  const sol = k.hucreler.find((x) => x.r === 0 && x.c === 0)!;
  assert.deepEqual(sol.s!.kn, { u: 1, a: 2, s: 1, g: 2 });
  k = kenarYaz(k, { r1: 0, c1: 0, r2: 1, c2: 1 }, "yok", 1);
  assert.ok(k.hucreler.every((x) => Object.values(x.s!.kn!).every((v) => v === 0)));
  const st = hucreBicemi({ s: { k: true, a: "o", z: "#F2DCDB", f: "tinos", b: 12, kn: { u: 2, a: 0, s: 1, g: 1 } } }, { cizgi: "#1F3B70" });
  assert.deepEqual([st.borderTop, st.borderBottom, st.fontFamily, st.fontSize, st.fontWeight, st.textAlign, st.backgroundColor],
    ["2px solid #1F3B70", "0", "Tinos, 'Times New Roman', serif", "12pt", "700", "center", "#F2DCDB"]);
});

/* sahada doldurulan bir form: etiket + alan, iki madde (cevap), çoğalan ölçüm satırı, sonuç, imza */
function form(): FormatTanimi {
  const h = (r: number, c: number, o: Omit<Hucre, "r" | "c">): Hucre => ({ r, c, ...o });
  const tablo: TabloBolumu = {
    id: "kontrol", ad: "Kontroller", blok: "tablo", kilit: false, sutun: [10, 60, 30], cevaplar: ["U", "UD", "X"],
    satirlar: [{}, {}, {}, {}, { tekrar: true, id: "olc" }, {}],
    hucreler: [
      h(0, 0, { tur: "yazi", m: "Kapasite", cs: 2 }), h(0, 2, { tur: "alan", id: "kap", alan: "sayi", birim: "kg", zorunlu: true }),
      h(1, 0, { tur: "sira" }), h(1, 1, { tur: "yazi", m: "Fren" }), h(1, 2, { tur: "cevap", id: "m1" }),
      h(2, 0, { tur: "sira" }), h(2, 1, { tur: "yazi", m: "Halat" }), h(2, 2, { tur: "cevap", id: "m2" }),
      h(3, 0, { tur: "yazi", m: "No" }), h(3, 1, { tur: "yazi", m: "Yük" }), h(3, 2, { tur: "yazi", m: "Sonuç" }),
      h(4, 0, { tur: "sira" }), h(4, 1, { tur: "alan", id: "yuk", alan: "sayi" }), h(4, 2, { tur: "cevap", id: "ys" }),
      h(5, 0, { tur: "sonuc", secenekler: ["UYGUNDUR", "UYGUN DEĞİLDİR"], cs: 2 }), h(5, 2, { tur: "imza", kim: "uzman", eimza: true }),
    ],
  };
  return FormatTanimi.parse({ sema: 1, bolumler: [tablo], gorunum: { formKodu: "", baslik: "Deneme", dayanak: [], talimat: "", cevap: "acilir", serbest: true } });
}

test("şema: tablonun dışına taşan, üst üste binen, kimliksiz cevaplı hücre ve kimliksiz çoğalan satır reddedilir; kimlik bütün tanımda tekil", () => {
  const t = form(), b = t.bolumler[0] as TabloBolumu;
  const dene = (y: TabloBolumu) => FormatTanimi.safeParse({ ...t, bolumler: [y] }).success;
  assert.ok(dene(b));
  assert.ok(!dene({ ...b, hucreler: [...b.hucreler.slice(1), { r: 0, c: 0, cs: 4, tur: "yazi", m: "taşar" }] }), "taşan");
  assert.ok(!dene({ ...b, hucreler: [...b.hucreler, { r: 0, c: 1, tur: "yazi", m: "biner" }] }), "üst üste");
  assert.ok(!dene({ ...b, hucreler: b.hucreler.map((x) => (x.id === "m1" ? { ...x, id: undefined } : x)) }), "kimliksiz cevap");
  assert.ok(!dene({ ...b, hucreler: b.hucreler.map((x) => (x.id === "m2" ? { ...x, id: "m1" } : x)) }), "kimlik iki kez");
  assert.ok(!dene({ ...b, satirlar: b.satirlar.map((x) => (x.tekrar ? { tekrar: true } : x)) }), "kimliksiz çoğalan satır");
});

test("motor: cevap hücresi madde, çoğalan satır ölçüm tablosu, zorunlu alan eksik, sonuç seçilmedi — kusurlar ve öneri aynı yoldan", () => {
  const t = form();
  const c = Cevaplar.parse({ madde: { m1: { c: "U" }, m2: { c: "UD", not: "Kopuk tel" } }, tablo: { olc: [{ yuk: "500", ys: "U" }, { yuk: "600", ys: "UD" }] } });
  const d = degerlendir(t, c);
  assert.deepEqual(d.kusurlar.map((k) => k.metin), ["Halat: Kopuk tel", "600: Sonuç: UD"]);
  assert.deepEqual(d.eksikler.map((e) => e.ad).sort(), ["Kapasite", "Sonuç seçilmedi"]);
  assert.equal(d.oneri, "uygun_degil");
  /* sıra no: okuma sırasıyla */
  assert.deepEqual([...siraNumaralari(t).entries()], [["kontrol:1,0", 1], ["kontrol:2,0", 2]], "çoğalan satırın sırası kendi kopyalarında");
  /* sanal bölümler sahada: bilgi alanı soldaki birleşik yazının adıyla */
  const s = sahaTanimi(t);
  const bilgi = s.bolumler.find((b) => b.blok === "bilgi");
  assert.ok(bilgi?.blok === "bilgi" && bilgi.alanlar[0].ad === "Kapasite" && bilgi.alanlar[0].birim === "kg");
});

test("belge: değerler ızgarada — alan birimiyle, madde cevabı, çoğalan satır kopya kopya (sıra no), sonuç sözcüğü, uzmanın e-imza yeri", () => {
  const t = form();
  const v = { ...ornekBelge("ZPKR02"), tanim: t, sonuc: "uygun" as const, kesin: true,
    cevaplar: Cevaplar.parse({ alan: { kap: "5000" }, madde: { m1: { c: "U" }, m2: { c: "X" } }, tablo: { olc: [{ yuk: "500", ys: "U" }, { yuk: "600", ys: "U" }] } }) };
  const h = renderToStaticMarkup(raporBelgesi(v) as never);
  assert.match(h, />5000 kg<\/td>/);
  assert.match(h, />Fren<\/td><td[^>]*>U<\/td>/);
  assert.match(h, />1<\/td><td[^>]*>500<\/td><td[^>]*>U<\/td>/, "çoğalan satırın sırası tablonun içinde");
  assert.match(h, />2<\/td><td[^>]*>600<\/td>/);
  assert.match(h, /<td colSpan="2"[^>]*>UYGUNDUR<\/td>/);
  assert.match(h, /href="probata-eimza:uzman"/);
});

test("yerleşim: yan yana bölümler bir satırda, oranlar yüzdeye; serbest olmayan formatta yan yana da çalışır", () => {
  const l = [{ b: { yan: undefined, oran: 60 } }, { b: { yan: true, oran: 30 } }, { b: { yan: true, oran: 10 } }, { b: { yan: undefined, oran: undefined } }];
  const s = yerlesimSatirlari(l);
  assert.equal(s.length, 2);
  assert.equal(s[0].ogeler.length, 3);
  assert.deepEqual(s[0].oranlar, [60, 30, 10]);
  assert.deepEqual(s[1].oranlar, [100]);
});

test("kurucu: sabit bölümler ve belgenin yazısı yazılır; varsayılana dönen değer tanımdan kalkar", () => {
  const t = FormatTanimi.parse({ sema: 1, bolumler: [] });
  let y = belgeYazisiYaz(t, { serbest: true, tip: "tinos", boy: 8 });
  assert.equal(y.gorunum.serbest, true);
  assert.deepEqual(y.gorunum.yazi, { tip: "tinos", boy: 8 });
  y = belgeYazisiYaz(y, { serbest: false, tip: undefined, boy: undefined });
  assert.ok(!("serbest" in y.gorunum) && !("yazi" in y.gorunum));
  FormatTanimi.parse(y);
});

test("iki sütunlu liste: sıra numaraları ve madde sırası sütun dizisiyle (sol 1–3, sağ 4–5; sağdaki alt başlık diziyi böler); madde kendi yanının yazısı", () => {
  const h = (r: number, c: number, o: Omit<Hucre, "r" | "c">): Hucre => ({ r, c, ...o });
  /* No | Madde | Cevap || No | Madde | Cevap; sağda 2. satır alt başlık */
  const hucreler: Hucre[] = [h(0, 0, { tur: "yazi", m: "No" }), h(0, 1, { tur: "yazi", m: "Madde" }), h(0, 2, { tur: "yazi", m: "S" }), h(0, 3, { tur: "yazi", m: "No" }),
    h(0, 4, { tur: "yazi", m: "Madde" }), h(0, 5, { tur: "yazi", m: "S" })];
  for (let r = 1; r <= 3; r++) {
    hucreler.push(h(r, 0, { tur: "sira" }), h(r, 1, { tur: "yazi", m: `Sol ${r}` }), h(r, 2, { tur: "cevap", id: `l${r}` }));
    if (r === 2) hucreler.push(h(r, 3, { tur: "yazi", m: "No" }), h(r, 4, { tur: "yazi", m: "Alt baslik" }), h(r, 5, { tur: "yazi", m: "S" }));
    else hucreler.push(h(r, 3, { tur: "sira" }), h(r, 4, { tur: "yazi", m: `Sag ${r}` }), h(r, 5, { tur: "cevap", id: `s${r}` }));
  }
  const b: TabloBolumu = { id: "k", ad: "K", blok: "tablo", kilit: false, sutun: [5, 35, 10, 5, 35, 10], cevaplar: ["U", "UD"], satirlar: [{}, {}, {}, {}], hucreler };
  const t = FormatTanimi.parse({ sema: 1, bolumler: [b] });
  assert.deepEqual([...siraNumaralari(t).entries()], [["k:1,0", 1], ["k:2,0", 2], ["k:3,0", 3], ["k:1,3", 4], ["k:3,3", 5]]);
  assert.deepEqual(diziSirasi(hucreler.filter((x) => x.tur === "cevap")).map((x) => x.id), ["l1", "l2", "l3", "s1", "s3"]);
  const liste = sahaTanimi(t).bolumler.find((x) => x.blok === "liste");
  assert.ok(liste && liste.blok === "liste");
  assert.deepEqual(liste.gruplar[0].maddeler.map((m) => m.metin), ["Sol 1", "Sol 2", "Sol 3", "Sag 1", "Sag 3"]);
  /* alt başlık satırındaki sol madde: sağdaki alt başlığın yazısı karışmaz */
  assert.equal(maddeMetni(b, hucreler.find((x) => x.id === "l2")!), "Sol 2");
  /* tek sütunlu liste: okuma sırası aynı */
  const tek = FormatTanimi.parse({ sema: 1, bolumler: [{ id: "t", ad: "T", blok: "tablo", kilit: false, sutun: [10, 90], satirlar: [{}, {}], hucreler: [h(0, 0, { tur: "sira" }), h(0, 1, { tur: "yazi", m: "a" }), h(1, 0, { tur: "sira" }), h(1, 1, { tur: "yazi", m: "b" })] }] });
  assert.deepEqual([...siraNumaralari(tek).entries()], [["t:0,0", 1], ["t:1,0", 2]]);
});
