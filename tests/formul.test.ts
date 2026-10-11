/* NEREDEN GELDİ: 495 — hata listesi 29 + 46 maketi onaylı (reisim 2026-10-11: "isteyenin istediği gibi bir şey yapabileceği bir sistem"; sunumda
   "yeni bir hesap gereken her rapor bugün kod işi" — çatal aşınma yüzdesi, 1,25 × kapasite yük testi). FORMÜL (src/format/formul.ts): firmanın kendi
   hesabı — sayı alanı, tablo sütunu, test değeri; eval yok, küçük çözücü; motor (sınır → Uygun / Uygun değil, kusur), belge, saha aynı formulUygula;
   formüllü öğe eksik sayılmaz; Excel'e ve fotoğraftan okumaya girmez; adı değişen öğenin formüllerdeki adı da değişir; yayın denetimi bilinmeyen
   adı söyler. SERBEST METİN bölümü (belgeye basılan sabit yazı). Olumsuz kanıt: tests/bozan/formul.bozan.ts. Tarayıcıda: e2e/rapor-format.spec.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { formulAdDegistir, formulDenet, formulHesapla, formulUygula } from "../src/format/formul.ts";
import { degerlendir, sonucKurallari, yayinDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Bolum, Cevaplar, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { ogeYaz } from "../src/modules/rapor-format/kurucu.ts";
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
  assert.match(formulDenet("[Ağırlık] × 2", adlar, "x")!, /“Ağırlık” adında sayı yok/);
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
  assert.ok(sonucKurallari(t.bolumler.find((b) => b.id === "catal") as BolumOf<"olcum">)
    .includes("Aşınma = ([İlk kalınlık] − [Ölçülen]) / [İlk kalınlık] × 100 (kendiliğinden hesaplanır)"));
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

test("kurucu: adı değişen sütun / değer formüllerde de değişir; formül yalnız sayıda", () => {
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
  const metin = ogeYaz(t, i, "asin", { tur: "metin" });
  assert.equal((metin.bolumler[i] as BolumOf<"olcum">).sutunlar.find((x) => x.id === "asin")!.formul, undefined, "metin sütunda formül yok");
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
});

test("yayın denetimi formül hatasını söyler; belge hesaplanan değeri ve serbest metni basar", () => {
  const t = formulluKompresor();
  const bozuk = structuredClone(t);
  ((bozuk.bolumler.find((b) => b.blok === "test") as BolumOf<"test">).degerler.find((d) => d.id === "hidro")!).formul = "1,5 × [Basınç]";
  assert.ok(yayinDenetimi(bozuk).some((s) => s.includes("formülü: “Basınç” adında sayı yok")), JSON.stringify(yayinDenetimi(bozuk)));
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
