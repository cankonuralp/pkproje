/* NEREDEN GELDİ: 495 — hata listesi 29 + 46 maketi onaylı (reisim 2026-10-11: "isteyenin istediği gibi bir şey yapabileceği bir sistem"; sunumda
   "yeni bir hesap gereken her rapor bugün kod işi" — çatal aşınma yüzdesi, 1,25 × kapasite yük testi). FORMÜL (src/format/formul.ts): firmanın kendi
   hesabı — sayı alanı, tablo sütunu, test değeri; eval yok, küçük çözücü; motor (sınır → Uygun / Uygun değil, kusur), belge, saha aynı formulUygula;
   formüllü öğe eksik sayılmaz; Excel'e ve fotoğraftan okumaya girmez; adı değişen öğenin formüllerdeki adı da değişir; yayın denetimi bilinmeyen
   adı söyler. SERBEST METİN bölümü (belgeye basılan sabit yazı). Olumsuz kanıt: tests/bozan/formul.bozan.ts. Tarayıcıda: e2e/rapor-format.spec.ts.
   556 (sunum 556 · 2. tur onaylı — reisim 2026-10-14: "hesaplama tuşu her kutucukta olmalı", "istediğim hesabı istediğim gibi yapabilmeliyim
   kısıtlama olmamalı", "değiştirilemez olmasın"): formül HER KUTUDA (alan her türde — kayıttan gelen, ekipman bilgisi dahil —, sütun, test değeri,
   madde cevabı); Excel işlevleri Türkçe / İngilizce adıyla; adlar formatın her kutusu (tablo dışında sütun = bütün satırlar, SÜTUN, tablo adı);
   ELLE YAZILAN KALIR (boşsa formül); S.A.Y formüllü kutuya da yazar (bilgiAlanlari / testAlanlari formulluDahil). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { formulAdDegistir, formulDenet, formulHesapla, formulUygula } from "../src/format/formul.ts";
import { degerlendir, sonucKurallari, yayinDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Bolum, Cevaplar, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { formuleEkle, ogeYaz } from "../src/modules/rapor-format/kurucu.ts";
import { parcaYerlestir } from "../src/modules/rapor-format/yapboz.ts";
import { bilgiAlanlari, tabloExceli, tabloSablonu, testAlanlari } from "../src/modules/raporlar/doldur.ts";

const yok = () => undefined;
const h = (f: string, d: Record<string, number | null> = {}) => formulHesapla(f, (a) => (a in d ? d[a] : undefined));

test("hesap: dört işlem önceliği, parantez, ondalık virgül, yüzde, eksi; × ÷ − işaretleri", () => {
  assert.equal(h("1 + 2 × 3"), 7);
  assert.equal(h("(1 + 2) * 3"), 9);
  assert.equal(h("1,25 × 2000"), 2500);
  assert.equal(h("10 ÷ 4"), 2.5);
  assert.equal(h("5 − 7"), -2);
  assert.equal(h("-3 + 1"), -2);
  assert.equal(h("50%"), 0.5);
  assert.equal(h("([İlk] − [Ölçülen]) / [İlk] × 100", { "İlk": 40, "Ölçülen": 35 }), 12.5);
  assert.equal(h("[a] / [b]", { a: 1, b: 0 }), null, "sıfıra bölme hesaplanamaz");
  assert.equal(h("[a] + 1", { a: null }), null, "boş değer hesaplanamaz");
  assert.equal(h("[yok] + 1"), null, "bilinmeyen ad hesaplanamaz");
  assert.equal(h("2 +"), null, "yarım formül");
  assert.equal(formulHesapla("process.exit()", yok), null, "eval yok — harf işaret değil");
});

test("kurucuda denetim: yapı hatası, bilinmeyen ad, kendine bakma; doğru formülde null", () => {
  const adlar = ["Kapasite", "Test yükü"];
  assert.equal(formulDenet("1,25 × [Kapasite]", adlar, "Test yükü"), null);
  assert.equal(formulDenet("1,25 × [kapasite]", adlar, "Test yükü"), null, "büyük / küçük harf önemsiz");
  assert.match(formulDenet("1,25 × [Kapasite", adlar, "Test yükü")!, /“\]” eksik/);
  assert.match(formulDenet("(1 + 2", adlar, "x")!, /parantez kapanmadı/);
  assert.match(formulDenet("1 2", adlar, "x")!, /fazladan/);
  /* 556 (2026-10-14): adlar artık her kutu — ileti "kutu yok" */
  assert.match(formulDenet("[Ağırlık] × 2", adlar, "x")!, /“Ağırlık” adında kutu yok/);
  assert.equal(formulDenet("[Test yükü] × 2", adlar, "Test yükü"), "Formül kendisine bakamaz.");
  assert.match(formulDenet("2 $ 3", adlar, "x")!, /“\$” anlaşılmadı/);
});

/* KOMPRESOR şablonu: bilgi alanı "Çalışma basıncı" (sayı, bar), test değerleri hidro / ventil. Hidrostatik deney basıncı formülle: 1,5 × çalışma */
function formulluKompresor(): FormatTanimi {
  const t = structuredClone(FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim));
  const test = t.bolumler.find((b) => b.blok === "test") as BolumOf<"test">;
  const hidro = test.degerler.find((d) => d.id === "hidro")!;
  hidro.formul = "1,5 × [Çalışma basıncı]";
  hidro.op = ">="; hidro.sinir = 15;
  /* çatal aşınması tablosu: ilk kalınlık, ölçülen, aşınma = formül (≤ 10) */
  const tablo: Bolum = Bolum.parse({ id: "catal", ad: "Çatal aşınması", blok: "olcum", satir: "ekle", sutunlar: [
    { id: "ilk", ad: "İlk kalınlık", giris: "sayi", birim: "mm" }, { id: "olc", ad: "Ölçülen", giris: "sayi", birim: "mm", zorunlu: true },
    { id: "asin", ad: "Aşınma", giris: "sayi", birim: "%", formul: "([İlk kalınlık] − [Ölçülen]) / [İlk kalınlık] × 100", op: "<=", sinir: 10, zorunlu: true }] });
  t.bolumler.splice(t.bolumler.findIndex((b) => b.blok === "test"), 0, tablo);
  return FormatTanimi.parse(t);
}

test("motor: formüllü test değeri girdiden hesaplanır, sınırdan Uygun / Uygun değil, eksik sayılmaz; tablo sütunu aynı satırdan, sınır dışı kusur", () => {
  const t = formulluKompresor();
  const c = Cevaplar.parse({ alan: { calisma: "10" }, deger: { ventil: "10" }, tablo: { catal: [{ ilk: "40", olc: "35" }, { ilk: "40", olc: "38" }] } });
  const u = formulUygula(t, c);
  assert.equal(u.deger.hidro, "15");
  assert.deepEqual(u.tablo.catal.map((s) => s.asin), ["12,5", "5"]);
  assert.equal(c.deger.hidro, undefined, "kaydedilen cevaplar değişmez");
  const d = degerlendir(t, c);
  assert.equal(d.degerler.hidro, true, "15 ≥ 15");
  assert.ok(!d.eksikler.some((e) => e.alan === "hidro"), "formüllü değer eksik değil");
  assert.ok(!d.eksikler.some((e) => e.alan.endsWith(".asin")), "formüllü sütun eksik değil");
  assert.deepEqual(d.satirlar.catal.map((s) => s.uygun), [false, true]);
  assert.ok(d.kusurlar.some((k) => k.bolum === "catal" && k.metin.includes("Aşınma 12,5 % (sınır ≤ 10)")), JSON.stringify(d.kusurlar));
  /* girdisi boşsa hesaplanamaz — sonuç çıkmaz, formül eksik sayılmaz; girdinin kendisi zorunluysa o eksik */
  const bos = degerlendir(t, Cevaplar.parse({ tablo: { catal: [{ ilk: "40" }] } }));
  assert.equal(bos.degerler.hidro, null);
  assert.deepEqual(bos.eksikler.filter((e) => e.bolum === "catal").map((e) => e.ad), ["Çatal aşınması · 1. satır · Ölçülen"]);
  /* 556 (reisim 2026-10-14: "şu işlemlerin sonucudur gibi açıklama olmasın"): sonuç kurallarında formülün hesabı yazılmaz; sınırı yazar */
  const kurallar = sonucKurallari(t.bolumler.find((b) => b.id === "catal") as BolumOf<"olcum">);
  assert.ok(!kurallar.some((k) => k.includes("kendiliğinden") || k.includes("[Ölçülen]")), JSON.stringify(kurallar));
  assert.ok(kurallar.some((k) => k.startsWith("Aşınma ≤ 10")), JSON.stringify(kurallar));
});

test("formül formüle bakar (zincir); döngü hesaplanamaz", () => {
  const t = formulluKompresor();
  const test = t.bolumler.find((b) => b.blok === "test") as BolumOf<"test">;
  test.degerler.find((d) => d.id === "ventil")!.formul = "[Hidrostatik deney basıncı] ÷ 1,5";
  assert.equal(formulUygula(t, Cevaplar.parse({ alan: { calisma: "10" } })).deger.ventil, "10");
  const dongu = structuredClone(t);
  const dt = dongu.bolumler.find((b) => b.blok === "test") as BolumOf<"test">;
  dt.degerler.find((d) => d.id === "hidro")!.formul = "[Emniyet ventili açma basıncı] + 1";
  assert.equal(formulUygula(dongu, Cevaplar.parse({ alan: { calisma: "10" } })).deger.hidro, undefined, "döngü: değer boş");
});

test("kurucu: adı değişen sütun / değer formüllerde de değişir; 556: formül her türde", () => {
  const t = formulluKompresor();
  const i = t.bolumler.findIndex((b) => b.id === "catal");
  const y = ogeYaz(t, i, "olc", { ad: "Ölçülen kalınlık" });
  const s = (y.bolumler[i] as BolumOf<"olcum">).sutunlar.find((x) => x.id === "asin")!;
  assert.equal(s.formul, "([İlk kalınlık] − [Ölçülen kalınlık]) / [İlk kalınlık] × 100");
  const ki = t.bolumler.findIndex((b) => b.blok === "bilgi" && b.alanlar.some((a) => a.id === "calisma"));
  const z = ogeYaz(t, ki, "calisma", { ad: "Çalışma basıncı (PS)" });
  const hidro = (z.bolumler.find((b) => b.blok === "test") as BolumOf<"test">).degerler.find((d) => d.id === "hidro")!;
  assert.equal(hidro.formul, "1,5 × [Çalışma basıncı (PS)]");
  assert.equal(formulAdDegistir("[a] + [A] + [b]", "a", "x"), "[x] + [x] + [b]");
  /* 556 (2026-10-14, eskiden "metin sütunda formül yok"): yazı sütununun da formülü olur */
  const metin = ogeYaz(t, i, "asin", { tur: "metin" });
  assert.equal((metin.bolumler[i] as BolumOf<"olcum">).sutunlar.find((x) => x.id === "asin")!.formul, "([İlk kalınlık] − [Ölçülen]) / [İlk kalınlık] × 100");
});

test("Excel ve fotoğraftan okuma formüllü öğeyi yazmaz; şablonda yok", () => {
  const t = formulluKompresor();
  const tablo = t.bolumler.find((b) => b.id === "catal") as BolumOf<"olcum">;
  assert.deepEqual(tabloSablonu(tablo.sutunlar), [["İlk kalınlık (mm)", "Ölçülen (mm)"]]);
  const x = tabloExceli([["İlk kalınlık", "Ölçülen", "Aşınma"], ["40", "35", "99"]], tablo.sutunlar);
  assert.deepEqual(x.satirlar, [{ ilk: "40", olc: "35" }]);
  assert.ok(!testAlanlari(t.bolumler.find((b) => b.blok === "test") as BolumOf<"test">).some((a) => a.id === "hidro"));
  const b = structuredClone(t.bolumler.find((y) => y.blok === "bilgi" && y.alanlar.some((a) => a.id === "calisma")) as BolumOf<"bilgi">);
  b.alanlar.find((a) => a.id === "calisma")!.formul = "2 × 3";
  assert.ok(!bilgiAlanlari(b).some((a) => a.id === "calisma"));
  /* 556: S.A.Y elle yazılabilen her kutuya yazar — formüllü olanlar da */
  assert.ok(bilgiAlanlari(b, true).some((a) => a.id === "calisma"));
  assert.ok(testAlanlari(t.bolumler.find((b) => b.blok === "test") as BolumOf<"test">, true).some((a) => a.id === "hidro"));
});

test("yayın denetimi formül hatasını söyler; belge hesaplanan değeri ve serbest metni basar", () => {
  const t = formulluKompresor();
  const bozuk = structuredClone(t);
  ((bozuk.bolumler.find((b) => b.blok === "test") as BolumOf<"test">).degerler.find((d) => d.id === "hidro")!).formul = "1,5 × [Basınç]";
  assert.ok(yayinDenetimi(bozuk).some((s) => s.includes("formülü: “Basınç” adında kutu yok")), JSON.stringify(yayinDenetimi(bozuk)));
  assert.ok(!yayinDenetimi(t).some((s) => s.includes("formülü")));
  const m = parcaYerlestir(t, "b:metin", t.bolumler.length)!;
  const mb = m.t.bolumler[m.t.bolumler.length - 1];
  assert.ok(mb.blok === "metin" && mb.metin.length > 0, "serbest metin parçası başlangıç yazısıyla");
  assert.ok(FormatTanimi.safeParse(m.t).success);
  const bm = { ...m.t, bolumler: m.t.bolumler.map((b) => (b.blok === "metin" ? { ...b, ad: "Yöntem notu", metin: "Deney basıncı 1,5 katıdır.\nİkinci satır." } : b)) };
  const o = ornekBelge("KOMPRESOR");
  const html = renderToStaticMarkup(raporBelgesi({ ...o, tanim: bm, cevaplar: Cevaplar.parse({ ...o.cevaplar, alan: { calisma: "10" }, tablo: { catal: [{ ilk: "40", olc: "35" }] } }) }) as never);
  assert.match(html, /12,5/, "tablodaki aşınma");
  assert.match(html, />15 bar</, "hidrostatik deney basıncı 1,5 × 10");
  assert.match(html, /Deney basıncı 1,5 katıdır\./);
  assert.match(html, /İkinci satır\./);
  assert.ok(yayinDenetimi({ ...m.t, bolumler: m.t.bolumler.map((b) => (b.blok === "metin" ? { ...b, metin: " " } : b)) }).some((s) => s.includes("bölümü boş")));
});

/* 495 düzeltmesi (deneme makinesi b51af0f, masaüstü ve tablet: "[Iz] −[Ib]") — saklanan formülün sonundaki boşluk kırpılıyor, işaretten sonra
   eklenen adın önündeki boşluk kayboluyordu */
test("kurucu: formüle ad / işaret ekleme tek boşlukla birleşir, kırpılmış sondan sonra da; parantezin içine boşluk yok; imleç eklenenin sonunda", () => {
  let f = "", i = 0;
  /* kurucu.ts istege: saklanan formül kırpılır — imleç kırpılmış değerin içinde kalır */
  const bas = (x: string) => { const r = formuleEkle(f, i, i, x); f = r.formul.trim(); i = Math.min(r.imlec, f.length); };
  for (const x of ["[Iz]", "−", "[Ib]"]) bas(x);
  assert.equal(f, "[Iz] − [Ib]");
  f = ""; i = 0;
  for (const x of ["(", "[A]", "+", "[B]", ")", "÷", "2"]) bas(x);
  assert.equal(f, "([A] + [B]) ÷ 2");
  assert.equal(formulHesapla(f, (a) => ({ A: 3, B: 5 } as Record<string, number>)[a]), 4);
  /* ortaya ekleme: imleç eklenenin sonunda, sağdaki parça yerinde */
  assert.deepEqual(formuleEkle("[A] + [C]", 6, 6, "[B]"), { formul: "[A] + [B] [C]", imlec: 9 });
  assert.deepEqual(formuleEkle("[A]", 0, 3, "[B]"), { formul: "[B]", imlec: 3 }, "seçili parça yerine");
});

/* 552 (reisim 2026-10-14: "elektrikte hesaplamalarda olsun … format yapıcıda formül kısmı olsun mesela (RCa=480/RCd)"): yazıldığı gibi — boşluksuz
   ad parantezsiz, baştaki "Ad =" atılır; kurucu kaydederken köşeli parantezli biçime çevirir (ad değişince formüldeki adı da değişir) */
test("552: \"RCa = 480/RCd\" yazıldığı gibi hesaplanır; kaydedilince \"480 ÷ [RCd]\"; boşluklu ad köşeli parantezle", async () => {
  const { formulDuzelt } = await import("../src/format/formul.ts");
  assert.equal(h("RCa = 480/RCd", { RCd: 4 }), 120);
  assert.equal(h("= 2 × Ib + 1", { Ib: 3 }), 7);
  assert.equal(formulDenet("RCa = 480/RCd", ["RCd"], "RCa"), null);
  assert.ok(formulDenet("480 / RCD testi", ["RCD testi IΔ"], "x")!.includes("boşluklu ad köşeli parantezle yazılır: [RCD testi…]"), "boşluklu ad parantezsiz anlaşılmaz");
  /* 556 (2026-10-14): "=" karşılaştırmadır — "a = b = c" artık b = c; iki "=" yan yana yanlış */
  assert.equal(formulDenet("a = b = c", ["b", "c"], "a"), null);
  assert.match(formulDenet("a = b = = c", ["b", "c"], "a")!, /“=” yanlış yerde/);
  assert.equal(formulDuzelt("RCa = 480/RCd"), "480 ÷ [RCd]");
  assert.equal(formulDuzelt("2 * (Ib - 1)"), "2 × ([Ib] − 1)");
  assert.equal(formulDuzelt("-3 + 1,5"), "−3 + 1,5");
  assert.equal(formulDuzelt("([İlk kalınlık] − [Ölçülen]) / [İlk kalınlık] × 100"), "([İlk kalınlık] − [Ölçülen]) ÷ [İlk kalınlık] × 100");
  assert.equal(formulDuzelt("2 $ 3"), "2 $ 3", "anlaşılmayan olduğu gibi (kurucu hatayı gösterir)");
  /* kurucu: tablo sütununa yazılınca köşeli parantezli; RCd'nin adı değişince formül de */
  const t = FormatTanimi.parse({ ...SABLONLAR.ZPKR02.tanim, bolumler: [...SABLONLAR.ZPKR02.tanim.bolumler, { id: "rc", ad: "RC ölçümü", blok: "olcum", satir: "ekle",
    sutunlar: [{ id: "rcd", ad: "RCd", giris: "sayi" }, { id: "rca", ad: "RCa", giris: "sayi" }] }] });
  const i = t.bolumler.findIndex((b) => b.id === "rc");
  const y = ogeYaz(t, i, "rca", { formul: "RCa = 480/RCd" });
  const s = (y.bolumler[i] as BolumOf<"olcum">).sutunlar.find((x) => x.id === "rca")!;
  assert.equal(s.formul, "480 ÷ [RCd]");
  const z = ogeYaz(y, i, "rcd", { ad: "RC direnci" });
  assert.equal((z.bolumler[i] as BolumOf<"olcum">).sutunlar.find((x) => x.id === "rca")!.formul, "480 ÷ [RC direnci]");
  const u = formulUygula(z, Cevaplar.parse({ tablo: { rc: [{ rcd: "4" }] } }));
  assert.equal(u.tablo.rc[0].rca, "120");
});

/* ── 556 ── */
/** her türde formüllü kutular: tarih, yazı, evet, seçim, tablo, test değeri, madde */
function her556(): FormatTanimi {
  const t = formulluKompresor();
  return FormatTanimi.parse({ ...t, bolumler: [...t.bolumler,
    { id: "ek", ad: "Ek bilgiler", blok: "bilgi", alanlar: [
      { id: "kt", ad: "Kontrol", tur: "tarih" }, { id: "st", ad: "Sonraki", tur: "tarih", formul: "SERİTARİH([Kontrol]; 12)" },
      { id: "st2", ad: "Bir yıl sonra", tur: "tarih", formul: "[Kontrol] + 365" },
      { id: "dr", ad: "Durum", tur: "metin", formul: "EĞER([Çalışma basıncı] > 8; \"Yüksek\"; \"Normal\")" },
      { id: "ev", ad: "Yüksek mi", tur: "evet", formul: "[Çalışma basıncı] > 8" },
      { id: "bl", ad: "Bağlantı", tur: "secim", secenekler: ["Flanş", "Vida"], formul: "\"vida\"" },
      { id: "et", ad: "Etiket", tur: "metin", formul: "\"K-\" & [Çalışma basıncı]" }] },
    { id: "tb", ad: "Ölçümler", blok: "olcum", satir: "ekle", sutunlar: [{ id: "no", ad: "No", giris: "sayi" }, { id: "dg", ad: "Değer", giris: "sayi" },
      { id: "iki", ad: "İki kat", giris: "sayi", formul: "[Değer] × 2" }, { id: "or", ad: "Ort", giris: "sayi", formul: "ORTALAMA(SÜTUN([Değer]))" }] },
    { id: "ts", ad: "Toplamlar", blok: "test", degerler: [{ id: "tp", ad: "Toplam", formul: "TOPLA([Değer])" },
      { id: "dy", ad: "Bul", formul: "DÜŞEYARA(2; [Ölçümler]; 2; YANLIŞ)" }, { id: "kac", ad: "Kaç", formul: "EĞERSAY([Değer]; \">5\")" }] },
    { id: "ls", ad: "Ek kontrol", blok: "liste", cevaplar: ["Uygun", "Uygun değil", "Uygulanamaz"], gruplar: [{ id: "g1", ad: "", maddeler: [
      { id: "m1", metin: "Değerler sınırda", formul: "EĞER(MAK([Değer]) <= 7; \"Uygun\"; \"Uygun değil\")" }] }] }] });
}
const C556 = () => Cevaplar.parse({ alan: { calisma: "10", kt: "2026-10-14" }, tablo: { tb: [{ no: "1", dg: "4" }, { no: "2", dg: "8" }, { no: "3", dg: "6", iki: "99" }] } });

test("556: Excel işlevleri Türkçe ve İngilizce adıyla; ayraç ; (sayının içinde olmayan , de); bilinmeyen işlev söylenir", () => {
  assert.equal(h("TOPLA(1; 2; 3)"), 6);
  assert.equal(h("SUM(1, 2, 3)"), 6);
  assert.equal(h("yuvarla(2,345; 2)"), 2.35);
  assert.equal(h("EĞER(2 > 1; 10; 20)"), 10);
  assert.equal(h("KAREKÖK(16) + MAK(1; 5)"), 9);
  assert.equal(h("2 ^ 3"), 8);
  assert.match(formulDenet("YOKİŞLEV(1)", [], "x")!, /“YOKİŞLEV” adında işlev yok/);
});

test("556: formül her kutuda — tarih, yazı (EĞER), evet, seçim, birleştirme; tablo sütunu aynı satırdan, SÜTUN bütün satırlar; DÜŞEYARA tablo adıyla; madde", () => {
  const t = her556(), c = C556();
  const u = formulUygula(t, c);
  assert.deepEqual([u.alan.st, u.alan.st2, u.alan.dr, u.alan.ev, u.alan.bl, u.alan.et], ["2027-10-14", "2027-10-14", "Yüksek", "evet", "Vida", "K-10"]);
  assert.deepEqual(u.tablo.tb.map((s) => [s.iki, s.or]), [["8", "6"], ["16", "6"], ["99", "6"]], "elle yazılan (99) kalır");
  assert.deepEqual([u.deger.tp, u.deger.dy, u.deger.kac], ["18", "8", "2"]);
  assert.equal(u.madde.m1?.c, "Uygun değil", "MAK(4; 8; 6) = 8 > 7");
  const d = degerlendir(t, c);
  assert.ok(!d.eksikler.some((e) => e.alan === "m1"), "formüllü madde cevaplı");
  assert.ok(d.kusurlar.some((k) => k.ref === "m1"), "hesaplanan Uygun değil kusur");
  assert.ok(!yayinDenetimi(t).some((s) => s.includes("formülü")), JSON.stringify(yayinDenetimi(t)));
});

test("556: elle yazılan kalır, boşaltılınca formül; formulDegeri kendi değeri yokmuş gibi; kayıttan gelen ve ekipman bilgisinde öncelik", async () => {
  const { formulDegeri } = await import("../src/format/formul.ts");
  const t = her556(), c = C556();
  assert.equal(formulDegeri(t, c, { tur: "hucre", bolum: "tb", satir: 2, sutun: "iki" }), "12");
  assert.equal(formulUygula(t, { ...c, alan: { ...c.alan, dr: "Elle" } }).alan.dr, "Elle");
  assert.equal(formulUygula(t, { ...c, alan: { ...c.alan, dr: "" } }).alan.dr, "Yüksek", "boş kutu formülden");
  assert.equal(formulUygula(t, { ...c, madde: { m1: { c: "Uygun" } } }).madde.m1.c, "Uygun", "seçilen cevap kalır");
  /* kayıttan gelen alan: kendi > formül > kayıttaki; ekipman bilgisi: ekipman > formül */
  const k = FormatTanimi.parse({ ...t, bolumler: [...t.bolumler, { id: "kb", ad: "Kayıt", blok: "bilgi", alanlar: [
    { id: "kn", ad: "Kontrol tarihi", tur: "metin", kaynak: "kontrol_tarihi" }, { id: "gs", ad: "Gelecek", tur: "tarih", formul: "[Kontrol tarihi] + 30" }] },
    { id: "eb", ad: "Ekipman bilgileri", blok: "bilgi", tam: true, alanlar: [{ id: "sr", ad: "Seri", tur: "metin", ekipman: "seri", formul: "\"S-\" & [Çalışma basıncı]" }] }] });
  const ek = { kaynak: { kontrol_tarihi: "14.10.2026" }, ekipman: {} };
  assert.equal(formulUygula(k, c, ek).alan.gs, "2026-11-13", "kayıttan gelen tarih formülde tarih");
  assert.equal(formulUygula(k, c, ek).alan.sr, "S-10", "ekipman bilgisi boş: formül");
  assert.equal(formulUygula(k, c, { ...ek, ekipman: { seri: "A1" } }).alan.sr, undefined, "ekipman bilgisi dolu: formül yazılmaz");
});

test("556: kaydedilen biçim — işlev adı Türkçe ve büyük harfli, yazı tırnakla, ayraç \"; \"; kurucu madde ve kayıttan gelen alanın formülünü yazar, adı değişen madde formüllerde de", () => {
  const t = her556();
  const li = t.bolumler.findIndex((b) => b.id === "ls");
  const y = ogeYaz(t, li, "m1", { formul: "if(mak([Değer])<=7;\"Uygun\";\"Uygun değil\")" });
  const m1 = (y.bolumler[li] as BolumOf<"liste">).gruplar[0].maddeler[0];
  assert.equal(m1.formul, "EĞER(MAK([Değer]) <= 7; \"Uygun\"; \"Uygun değil\")");
  const ti = t.bolumler.findIndex((b) => b.id === "tb");
  const z = ogeYaz(y, ti, "dg", { ad: "Ölçülen değer" });
  assert.equal((z.bolumler[li] as BolumOf<"liste">).gruplar[0].maddeler[0].formul, "EĞER(MAK([Ölçülen değer]) <= 7; \"Uygun\"; \"Uygun değil\")", "tablo dışından anılan sütun adı da değişir");
  const kb = FormatTanimi.parse({ ...t, bolumler: [...t.bolumler, { id: "kb", ad: "Kayıt", blok: "bilgi", alanlar: [{ id: "kn", ad: "Kontrol tarihi", tur: "metin", kaynak: "kontrol_tarihi" }] }] });
  const w = ogeYaz(kb, kb.bolumler.length - 1, "kn", { formul: "\"x\"" });
  assert.equal((w.bolumler[w.bolumler.length - 1] as BolumOf<"bilgi">).alanlar[0].formul, "\"x\"");
});
