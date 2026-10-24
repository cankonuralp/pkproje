/* NEREDEN GELDİ: 2026-10-23 — reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim istiyorum".
   2026-10-24 (format kurucu serbest düzen) — reisim: "hangi firmanın hangi PDF formunu yüklersem yükleyeyim şablon o forma dönüşsün ve format
   kurucuda istediğim gibi düzenleyebileyim": basılı format PDF'inin okunanı SERBEST DÜZENE çevrilir (src/modules/rapor-format/basili.ts) — sabit
   iskelet yok, her tablo bir serbest tablo bölümü (birleşik hücreler, yan yana tablolar, hücrenin türü / kaynağı / görünümü, sahada çoğalan satır),
   belgenin yazı tipi; raporun yürümesi için gerekenler (sonuç, uzmanın imza yeri, fotoğraflar) formda yoksa sona. Belge formun ızgarasını çizer.
   2026-10-24 (yapay zekâsız okuma — reisim: "en baştan beri bunu istedim"): girdi PDF okuyucusunun çıktısı (pdf-tipler.ts BasiliHam); sonuç
   hücresinin cümlesi (m) belgede "m SÖZCÜK", formdaki hücre kenarı (0 yok · 1 ince · 2 kalın) her yanda belgenin çizgisi değilse görünümde (kn).
   Saf (veritabanısız); form UYDURMA (tests/yardimci/basili-ornek.ts). Olumsuz kanıt: tests/bozan/basili-format.bozan.ts.
   2026-10-24 (denetim): yan yana satırın ilk bölümünün oranı (70/30 belgede 70/30), satır yüksekliği yarım mm, bölümler arası aralık okumadan,
   eklenecek bölümlere yer (40 bölümlük okuma şablona çevrilir, sondaki atılır ve adı söylenir), kimlik üretimi hücre sayısıyla doğrusal (büyük
   okuma işlemde bekletmez); satırının yüksekliği formdan gelen hücrede üst / alt iç boşluk yok (formun satırı belgede uzamaz). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { raporDuzeni } from "../src/format/duzen.ts";
import { hucreBicemi, sahaTanimi, yerlesimSatirlari } from "../src/format/tablo.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { basilidanTanim } from "../src/modules/rapor-format/basili.ts";
import { gorunumYaz } from "../src/modules/rapor-format/kurucu.ts";
import { HAM, HAM_SONUC_KENAR } from "./yardimci/basili-ornek.ts";

const kur = () => basilidanTanim(structuredClone(HAM), "Vinç")!;
const tablo = (t: FormatTanimi, ad: string) => t.bolumler.find((b) => b.ad === ad) as BolumOf<"tablo">;

test("basılı formun okunanı serbest düzene çevrilir ve şemadan geçer", () => {
  const r = kur();
  const t = FormatTanimi.parse(r.tanim);
  assert.deepEqual(r.atilan, ["Bozuk bölüm"]);
  assert.equal(r.cevap, HAM.cevap);
  assert.equal(t.gorunum.serbest, true);
  assert.equal(t.gorunum.baslik, "VİNÇ MUAYENE FORMU");
  assert.equal(t.gorunum.formKodu, "FR.099");
  assert.equal(t.gorunum.altYazi, "FR.099 · 01.01.2026 · REV00");
  assert.deepEqual(t.gorunum.yazi, { tip: "tinos", boy: 8 });
  /* bölümler formun sırasıyla; sonuç ve imza formda var — eklenmez; fotoğraf formda yok — sonda */
  assert.deepEqual(t.bolumler.map((b) => `${b.blok}:${b.ad}`), [
    "tablo:Başlık", "tablo:1. Firma bilgileri", "tablo:2. Teknik özellikler", "tablo:Halat bilgileri", "tablo:Kanca bloğu", "tablo:Genel kontroller",
    "tablo:Halat ve kanca", "tablo:Ölçümler", "kusur:NOTLAR / UYGUNSUZLUKLAR", "tablo:Sonuç", "tablo:İmzalar", "foto:Fotoğraflar",
  ]);
  /* yan yana: ikinci tablo öncekinin yanında, oranıyla */
  const kanca = tablo(t, "Kanca bloğu"), halat = tablo(t, "Halat bilgileri");
  assert.equal(kanca.yan, true);
  assert.equal(kanca.oran, 50);
  /* 2026-10-24 (denetim): satırı açan ilk tablonun oranı da yazılır — önce atılıyordu, belgede pay bozuluyordu (70/30 → 62,5/37,5) */
  assert.deepEqual([halat.yan, halat.oran], [undefined, 50], "ilk tablo satırı açar, oranıyla");
});

test("ızgara: birleşik hücreler HTML tablosu gibi yerleşir, görünüm ve türler formdan", () => {
  const t = kur().tanim;
  const bas = tablo(t, "Başlık");
  assert.deepEqual(bas.sutun, [16, 52, 14, 18]);
  assert.equal(bas.satirlar.length, 3);
  /* 2. ve 3. satırın hücreleri birleşik logo ve adın sağına yerleşir */
  assert.deepEqual(bas.hucreler.map((h) => `${h.r},${h.c}:${h.tur}${h.rs ? `:rs${h.rs}` : ""}`),
    ["0,0:gorsel:rs3", "0,1:yazi:rs3", "0,2:yazi", "0,3:kayit", "1,2:yazi", "1,3:kayit", "2,2:yazi", "2,3:kayit"]);
  assert.deepEqual(bas.hucreler[1].s, { k: true, a: "o", b: 14 });
  const firma = tablo(t, "1. Firma bilgileri");
  assert.deepEqual(firma.hucreler[0], { r: 0, c: 0, cs: 4, tur: "yazi", m: "1. FİRMA BİLGİLERİ", s: { k: true, a: "o", z: "#F2DCDB" } });
  assert.deepEqual(firma.hucreler.filter((h) => h.tur === "kayit").map((h) => h.kaynak), ["firma", "bas", "adres", "sgk", "isg"]);
  assert.equal(firma.hucreler.find((h) => h.kaynak === "adres")?.cs, 3);
  /* sahada doldurulan: tür, birim, formül, seçenekler; kimlik kurucunun ve tekil */
  const teknik = tablo(t, "2. Teknik özellikler");
  const alanlar = teknik.hucreler.filter((h) => h.tur === "alan");
  assert.deepEqual(alanlar.map((h) => [h.ad, h.alan, h.birim ?? null]), [["Kapasite", "sayi", "kg"], ["Statik test yükü", "sayi", "kg"], ["Vinç tipi", "secim", null]]);
  assert.equal(alanlar[1].formul, "[Kapasite] * 1,25");
  assert.ok(alanlar.every((h) => h.id?.startsWith("k_c")));
  /* taşan birleşme tabloya sığdırılır */
  const hk = tablo(t, "Halat ve kanca");
  assert.deepEqual(hk.hucreler.filter((h) => h.r === 2).map((h) => [h.m, h.cs ?? 1, h.rs ?? 1]), [["taşan", 3, 1]]);
  assert.deepEqual(hk.cevaplar, ["U", "UD", "X"]);
  /* sahada çoğalan satır: kimliği var, hücreleri cevaplı */
  const olc = tablo(t, "Ölçümler");
  assert.equal(olc.satirlar[1].tekrar, true);
  assert.match(olc.satirlar[1].id ?? "", /^k_r\d+$/);
  /* imza: uzman ve teknik yer, e-imza */
  const imza = tablo(t, "İmzalar");
  assert.deepEqual(imza.hucreler.filter((h) => h.tur === "imza").map((h) => [h.kim, h.eimza]), [["uzman", true], ["teknik", true]]);
});

test("sanal bölümler: alanlar bilgi, cevap hücreleri madde, çoğalan satır ölçüm tablosu, sonuç ve imza — numarasız düzen", () => {
  const t = kur().tanim;
  const s = sahaTanimi(t);
  const bloklar = s.bolumler.map((b) => b.blok);
  assert.ok(bloklar.includes("sonuc") && bloklar.includes("imza") && bloklar.includes("olcum") && bloklar.includes("liste"));
  const genel = s.bolumler.find((b) => b.blok === "liste" && b.ad === "Genel kontroller") as BolumOf<"liste">;
  assert.deepEqual(genel.gruplar[0].maddeler.map((m) => m.metin), ["Bakım kayıtları", "*Ray bağlantıları"]);
  const olc = s.bolumler.find((b) => b.blok === "olcum") as BolumOf<"olcum">;
  assert.equal(olc.id, tablo(t, "Ölçümler").satirlar[1].id);
  assert.deepEqual(olc.sutunlar.map((x) => [x.ad, x.giris, x.olumsuz ?? null]), [["Ölçüm", "metin", null], ["Değer", "sayi", null], ["Sonuç", "secim", ["UD"]]]);
  /* serbest düzen: sabit bölüm yok, numara yok */
  const d = raporDuzeni(t, false);
  assert.equal(d.ekipman, false);
  assert.ok(d.bolumler.every((x) => x.no === null));
});

test("boş ya da bozuk okuma da geçerli bir şablon verir: sonuç, uzmanın imza yeri ve fotoğraflar eklenir", () => {
  for (const ham of [{}, { bolumler: "x", yazi: 5 }, { bolumler: [null, { tur: "tablo", sutunlar: [50, 50], satirlar: [{ hucreler: [{ tur: "imza", kim: "teknik" }] }] }] }]) {
    const r = basilidanTanim(ham as Record<string, unknown>, "Vinç");
    assert.ok(r);
    FormatTanimi.parse(r.tanim);
    assert.equal(r.tanim.gorunum.baslik, "Vinç Periyodik Kontrol Raporu");
    assert.equal(r.tanim.gorunum.serbest, true);
    const h = r.tanim.bolumler.flatMap((b) => (b.blok === "tablo" ? b.hucreler : []));
    assert.ok(h.some((x) => x.tur === "sonuc"), "sonuç hücresi");
    assert.ok(h.some((x) => x.tur === "imza" && x.kim === "uzman" && x.eimza), "uzmanın imza yeri");
    assert.ok(r.tanim.bolumler.some((b) => b.blok === "foto"));
  }
});

test("belge formun ızgarasında: sabit parça yok, birleşik hücre, yan yana tablolar, yazı tipi ve şerit zemini", () => {
  const t = kur().tanim;
  const h = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.match(h, /<article class="rb-sayfa rb-serbest"/);
  assert.doesNotMatch(h, /class="rb-bas"/, "başlık tablosu yok");
  assert.doesNotMatch(h, /Firma bilgileri<\/h2>/, "sabit firma bölümü yok");
  assert.match(h, /<td rowSpan="3"[^>]*>VİNÇ MUAYENE FORMU<\/td>/i);
  assert.match(h, /<td colSpan="4" style="[^"]*font-family:Tinos[^"]*font-size:8pt;font-weight:700[^"]*text-align:center[^"]*background-color:#F2DCDB">1\. FİRMA BİLGİLERİ<\/td>/);
  /* yan yana: tek satırda iki bölüm, oranlarıyla */
  assert.match(h, /<div class="rb-yan"[^>]*><section class="rb-bolum rb-tablo-bolum" style="flex:50 1 0;min-width:0[^"]*">.*HALAT BİLGİLERİ.*<section class="rb-bolum rb-tablo-bolum" style="flex:50 1 0/);
  /* kayıttan gelen değer: müşterinin unvanı (örnek belge künyesi) */
  assert.ok(h.includes(ornekBelge("ZPKR02").kunye.firmaAdi));
  /* Bakanlık formatı (serbest değil) aynen: başlık tablosu, numaralı bölümler */
  const z = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: FormatTanimi.parse(SABLONLAR.ZPKR02.tanim) }) as never);
  assert.match(z, /<article class="rb-sayfa" /);
  assert.match(z, /<table class="rb-bas"><colgroup>/);
});

test("kurucu: görünüm yazılır; Bakanlık görünümüne dönen değer tanımdan kalkar (eski tanımla birebir)", () => {
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  let y = gorunumYaz(t, { basTuru: "ad", stil: { zemin: "gri" } });
  y = gorunumYaz(y, { stil: { hiza: "orta" } });
  assert.equal(y.gorunum.basTuru, "ad");
  assert.deepEqual(y.gorunum.stil, { zemin: "gri", hiza: "orta" });
  y = gorunumYaz(y, { basTuru: "tablo", stil: { zemin: "pembe", hiza: "sol" } });
  assert.deepEqual(JSON.parse(JSON.stringify(y.gorunum)), JSON.parse(JSON.stringify(t.gorunum)));
  assert.ok(!("stil" in y.gorunum) && !("basTuru" in y.gorunum));
  FormatTanimi.parse(y);
});

test("sonuç hücresinin cümlesi belgede sözcükle birlikte; formdaki kenarsız / kalın kenar görünüme geçer, belgenin çizgisi yazılmaz", () => {
  const t = basilidanTanim(structuredClone(HAM_SONUC_KENAR), "Vinç")!.tanim;
  const b = tablo(t, "Sonuç cümlesi");
  const hucre = (r: number, c: number) => b.hucreler.find((x) => x.r === r && x.c === c)!;
  assert.deepEqual(hucre(0, 1), { r: 0, c: 1, tur: "sonuc", m: "Ekipman kullanıma", secenekler: ["UYGUNDUR", "UYGUN DEĞİLDİR"] });
  assert.deepEqual(hucre(0, 0).s, { kn: { u: 0, a: 0, s: 0, g: 0 } });
  assert.deepEqual(hucre(1, 0).s, { kn: { u: 2, a: 1, s: 1, g: 1 } }, "okunamayan yan belgenin çizgisi");
  assert.equal(hucre(1, 1).s, undefined);
  /* formda sonuç var: sona ayrıca sonuç tablosu eklenmez */
  assert.equal(t.bolumler.filter((x) => x.blok === "tablo" && x.hucreler.some((y) => y.tur === "sonuc")).length, 1);
  const h = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.match(h, />Ekipman kullanıma UYGUNDUR<\/td>/);
  assert.match(h, /<td style="border-top:0;border-bottom:0;border-left:0;border-right:0;[^"]*">Kenarsız<\/td>/);
  assert.match(h, /<td style="border-top:2px solid #000000;border-bottom:1px solid #000000;[^"]*">Kalın üst<\/td>/);
});

/* ── 2026-10-24 DENETİM KİLİTLERİ ── */
const paragraf = (ad: string, ek: Record<string, unknown> = {}) => ({ ad, tur: "tablo", yan: false, oran: 100, sutunlar: [100], cevaplar: [],
  satirlar: [{ tekrar: false, yukseklik: 0, hucreler: [{ metin: ad, tur: "yazi", sutunBirlesim: 1, satirBirlesim: 1 }] }], ...ek });

test("yan yana satırın ilk bölümünün oranı da yazılır: formun 70 / 30'u belgede 70 / 30", () => {
  const t = basilidanTanim({ bolumler: [paragraf("Sol", { oran: 70 }), paragraf("Sag", { yan: true, oran: 30 })] }, "Vinç")!.tanim;
  assert.deepEqual(t.bolumler.slice(0, 2).map((b) => [b.ad, b.yan ?? false, b.oran]), [["Sol", false, 70], ["Sag", true, 30]]);
  assert.deepEqual(yerlesimSatirlari(t.bolumler.slice(0, 2).map((b) => ({ b }))).map((x) => x.oranlar), [[70, 30]]);
  /* tek başına satır oran almaz */
  assert.equal(basilidanTanim({ bolumler: [paragraf("Tek", { oran: 70 })] }, "Vinç")!.tanim.bolumler[0].oran, undefined);
});

test("satır yüksekliği yarım mm'ye (formun ölçüsü); bölümler arası aralık okumadan", () => {
  const ham = { yazi: { tip: "arimo", boy: 8, ara: 0 }, bolumler: [paragraf("A", { satirlar: [4.5, 6.5, 4].map((yukseklik) => ({ tekrar: false, yukseklik, hucreler: [{ metin: "x", tur: "yazi" }] })) })] };
  const t = basilidanTanim(ham, "Vinç")!.tanim;
  assert.deepEqual((t.bolumler[0] as BolumOf<"tablo">).satirlar.map((s) => s.y), [4.5, 6.5, 4]);
  assert.deepEqual(t.gorunum.yazi, { tip: "arimo", boy: 8, ara: 0 });
});

test("40 bölümlük okuma da şablona çevrilir: eklenecekler (sonuç, uzmanın imzası, fotoğraflar) için sondaki bölümler atılır, adı söylenir", () => {
  const r = basilidanTanim({ bolumler: Array.from({ length: 40 }, (_, i) => paragraf(`Paragraf ${i + 1}`)) }, "Vinç");
  assert.ok(r, "çeviri null");
  assert.equal(r.tanim.bolumler.length, 40);
  assert.deepEqual(r.atilan, ["Paragraf 40", "Paragraf 39", "Paragraf 38"]);
  assert.deepEqual(r.tanim.bolumler.slice(-3).map((b) => b.ad), ["Sonuç", "Muayene uzmanı", "Fotoğraflar"]);
});

test("kimlik üretimi hücre sayısıyla doğrusal: 32 000 cevap hücreli okuma kısa sürede çevrilir", () => {
  const C = 20, R = 200;
  const bolum = (n: number) => ({ ad: `Liste ${n}`, tur: "tablo", yan: false, oran: 100, sutunlar: Array.from({ length: C }, () => 5), cevaplar: [],
    satirlar: Array.from({ length: R }, () => ({ tekrar: false, yukseklik: 4, hucreler: Array.from({ length: C }, () => ({ tur: "cevap", sutunBirlesim: 1, satirBirlesim: 1 })) })) });
  const bas = performance.now();
  const r = basilidanTanim({ bolumler: Array.from({ length: 8 }, (_, i) => bolum(i + 1)) }, "Vinç");
  const sure = performance.now() - bas;
  assert.ok(r && r.atilan.length === 0);
  const id = r.tanim.bolumler.flatMap((b) => (b.blok === "tablo" ? b.hucreler.map((h) => h.id) : [])).filter(Boolean);
  assert.equal(id.length, 32_000);
  assert.equal(new Set(id).size, id.length, "kimlikler tekil");
  assert.ok(sure < 8000, `çeviri ${Math.round(sure)} ms`);
});

test("satırının yüksekliği formdan gelen hücrede üst / alt iç boşluk yok; elle kurulan satırda var", () => {
  assert.equal(hucreBicemi({}, {}, true).padding, "0.00mm 0.60mm");
  assert.equal(hucreBicemi({}, {}).padding, "0.36mm 0.60mm");
  const t = basilidanTanim({ bolumler: [paragraf("A", { satirlar: [{ tekrar: false, yukseklik: 4, hucreler: [{ metin: "Formdan", tur: "yazi" }] }] })] }, "Vinç")!.tanim;
  const h = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.match(h, /<td style="[^"]*padding:0\.00mm 0\.60mm[^"]*">Formdan<\/td>/);
});
