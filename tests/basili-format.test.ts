/* NEREDEN GELDİ: 2026-10-23 — reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim istiyorum".
   2026-10-24 (format kurucu serbest düzen) — reisim: "hangi firmanın hangi PDF formunu yüklersem yükleyeyim şablon o forma dönüşsün ve format
   kurucuda istediğim gibi düzenleyebileyim": basılı format PDF'inin okunanı SERBEST DÜZENE çevrilir (src/modules/rapor-format/basili.ts) — sabit
   iskelet yok, her tablo bir serbest tablo bölümü (birleşik hücreler, yan yana tablolar, hücrenin türü / kaynağı / görünümü, sahada çoğalan satır),
   belgenin yazı tipi; raporun yürümesi için gerekenler (sonuç, uzmanın imza yeri, fotoğraflar) formda yoksa sona. Belge formun ızgarasını çizer.
   Saf (veritabanısız); form UYDURMA (tests/yardimci/basili-ornek.ts). Olumsuz kanıt: tests/bozan/basili-format.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { raporDuzeni } from "../src/format/duzen.ts";
import { sahaTanimi } from "../src/format/tablo.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { basilidanTanim } from "../src/modules/rapor-format/basili.ts";
import { gorunumYaz } from "../src/modules/rapor-format/kurucu.ts";
import { HAM } from "./yardimci/basili-ornek.ts";

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
  assert.equal(halat.yan, undefined, "ilk tablo satırı açar (oran yalnız yan olanda yazılır)");
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
