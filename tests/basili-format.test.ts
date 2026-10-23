/* NEREDEN GELDİ: 2026-10-23 — reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim istiyorum",
   "bu pdfine bi bak nasıl gözüküyor", "sürüm 2 ne işe yarıyor orda o zaman yüklemem ne işe yaradı". Basılı format PDF'i yapay zekâyla okunur,
   formatın tamamına çevrilir (src/modules/rapor-format/basili.ts) ve belge forma benzer çizilir (belgenin başı yalnız ad, bölüm başlığı gri ve ortalı,
   etiket zeminsiz kalın, kontrol listesi iki sütun yan yana, numaralar baştan sona). Saf (veritabanısız); form UYDURMA (gerçek firmanın formu depoya
   girmez). Olumsuz kanıt: tests/bozan/basili-format.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { maddeNumaralari, raporDuzeni } from "../src/format/duzen.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { basilidanTanim } from "../src/modules/rapor-format/basili.ts";
import { gorunumYaz } from "../src/modules/rapor-format/kurucu.ts";
import { HAM } from "./yardimci/basili-ornek.ts";

test("basılı formun okunanı formatın tamamına çevrilir ve şemadan geçer", () => {
  const r = basilidanTanim(structuredClone(HAM), "Vinç");
  assert.ok(r, "çeviri null");
  const t = FormatTanimi.parse(r.tanim);
  assert.deepEqual(r.atilan, ["Olmayan bölüm türü"]);
  assert.equal(r.cevap, HAM.cevap);
  /* görünüm */
  assert.equal(t.gorunum.baslik, "VİNÇ MUAYENE FORMU");
  assert.equal(t.gorunum.formKodu, "FR.099");
  assert.equal(t.gorunum.basTuru, "ad");
  assert.deepEqual(t.gorunum.stil, { zemin: "gri", hiza: "orta", etiket: "kalin" });
  assert.equal(t.gorunum.altYazi, "FR.099 · 01.01.2026 · REV00");
  assert.deepEqual(t.gorunum.ekipmanAd, { kod: "Ekipman no / yeri" });
  /* firma satırları: sırası formun, kaynak bir kez, zorunlu (İSG-KATİP) eksikse sona */
  const fs = t.gorunum.firma!.satirlar;
  assert.deepEqual(fs.map((s) => s.kaynak), ["firma", "rapor_no", "adres", "bas", "sgk", "serbest", "isg"]);
  assert.equal(fs.find((s) => s.kaynak === "serbest")?.metin, "Sabit not");
  assert.equal(fs.find((s) => s.kaynak === "adres")?.tam, true);
  /* sıra: firma (kayıttan) · ekipman · cihaz (numarasız) · formun bölümleri · sonuç · imza · fotoğraf (numarasız) */
  assert.deepEqual(t.bolumler.map((b) => b.blok), ["bilgi", "bilgi", "cihaz", "bilgi", "liste", "kusur", "sonuc", "imza", "foto"]);
  const ekip = t.bolumler[1] as BolumOf<"bilgi">;
  assert.equal(ekip.tam, true);
  assert.equal(ekip.ad, "TEKNİK ÖZELLİKLER");
  assert.equal(ekip.dizilis, 3);
  assert.deepEqual(ekip.alanlar.map((a) => [a.ad, a.ekipman ?? null, a.tur]),
    [["Marka / Yapımcı", "marka", "metin"], ["Seri no", "seri", "metin"], ["Kapasite", null, "sayi"], ["Statik test yükü", null, "sayi"], ["İkinci marka", null, "metin"], ["Vinç tipi", null, "metin"]]);
  assert.equal(ekip.alanlar[3].formul, "[Kapasite] * 1,25");
  assert.equal(ekip.alanlar[2].birim, "kg");
  const halat = t.bolumler[3] as BolumOf<"bilgi">;
  assert.equal(halat.numarasiz, true);
  assert.deepEqual(halat.alanlar.map((a) => a.tam ?? false), [false, true]);
  const liste = t.bolumler[4] as BolumOf<"liste">;
  assert.deepEqual(liste.cevaplar, ["U", "UD", "X"]);
  assert.equal(liste.yanYana, true);
  assert.equal(liste.numara, "surekli");
  assert.deepEqual(liste.gruplar.map((g) => [g.ad, g.maddeler.map((m) => m.metin)]),
    [["GENEL KONTROLLER", ["Bakım kayıtları", "*Ray bağlantıları"]], ["YÜK TESTLERİ", ["*Dinamik yük deneyi (1,1 x P)"]]]);
  const sonuc = t.bolumler[6] as BolumOf<"sonuc">;
  assert.equal(sonuc.ad, "SONUÇ");
  assert.equal(sonuc.uygunMetin, "UYGUNDUR");
  assert.match(sonuc.cumle, /kullanılması$/);
  /* imza: kişiye uymayan satır düşer, uzmanın imza hücresi eklenir (e-imzanın yeri), onaylayan varsa iki kişi */
  const imza = t.bolumler[7] as BolumOf<"imza">;
  assert.deepEqual(imza.satirlar!.map((s) => [s.ad, s.kim, s.alan ?? null]),
    [["Ad Soyad", "uzman", "ad"], ["Diploma No", "uzman", "diploma"], ["Firma onayı", "teknik", "imza"], ["Kaşe", "diger", null], ["İmza", "uzman", "imza"]]);
  assert.deepEqual(imza.imzalar, ["uzman", "teknik"]);
  assert.equal(imza.numarasiz, true);
  /* kimlikler kurucunun (k_) ve tekil — şema zaten denetler */
  assert.ok(liste.gruplar.flatMap((g) => g.maddeler).every((m) => m.id.startsWith("k_")));
});

test("numaralar formdaki gibi: numarasız cihaz ve alt tablo sayılmaz — 3 tespit, 4 notlar, 5 sonuç; maddeler baştan sona", () => {
  const t = basilidanTanim(structuredClone(HAM), "Vinç")!.tanim;
  const d = raporDuzeni(t, false);
  assert.deepEqual(d.bolumler.map((x) => `${x.no ?? "-"} ${x.b.ad.split(" ")[0]}`), ["- Kullanılan", "- Halat", "3 TESPİT", "4 NOTLAR", "5 SONUÇ", "- KONTROLÜ", "- Fotoğraflar"]);
  const liste = t.bolumler.find((b) => b.blok === "liste") as BolumOf<"liste">;
  assert.deepEqual([...maddeNumaralari(liste).values()], ["1", "2", "3"]);
  assert.deepEqual([...maddeNumaralari({ ...liste, numara: undefined }).values()], ["1.1", "1.2", "2.1"]);
});

test("boş ya da bozuk okuma da geçerli bir iskelet verir (yapay zekânın cevabı şemaya uymasa da kurucu açılır)", () => {
  for (const ham of [{}, { bolumler: "x", ekipman: 5, firmaSatirlari: [null, 3], imza: { satirlar: [{}] } }]) {
    const r = basilidanTanim(ham as Record<string, unknown>, "Vinç");
    assert.ok(r);
    FormatTanimi.parse(r.tanim);
    assert.equal(r.tanim.gorunum.baslik, "Vinç Periyodik Kontrol Raporu");
    assert.equal(r.tanim.gorunum.firma, undefined, "firma satırları yoksa bugünkü satırlar");
    assert.ok(r.tanim.bolumler.some((b) => b.blok === "cihaz") && r.tanim.bolumler.some((b) => b.blok === "foto"));
  }
  /* teknik bölüm yoksa ekipman bölümü kalkar (kod ve tür 1. bölümde) */
  const r = basilidanTanim({ ...structuredClone(HAM), ekipman: { var: false, ad: "", dizilis: 2, alanlar: [] } }, "Vinç")!;
  assert.equal(r.tanim.gorunum.ekipman, false);
  assert.ok(!r.tanim.bolumler.some((b) => b.blok === "bilgi" && b.tam));
});

test("belge formun görünümünde: yalnız ad başlığı, gri ortalı bölüm başlığı, kalın etiket, iki sütun yan yana liste", () => {
  const t = basilidanTanim(structuredClone(HAM), "Vinç")!.tanim;
  const h = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.match(h, /<article class="rb-sayfa rb-z-gri rb-h-orta rb-e-kalin"/);
  assert.match(h, /<table class="rb-bas rb-bas-yalniz"><tbody><tr><td class="rb-bas-ad">VİNÇ MUAYENE FORMU<\/td><\/tr><\/tbody><\/table>/);
  assert.doesNotMatch(h, /rb-logo/, "logo / firma / doküman tablosu yok");
  /* iki sütun: 6 sütun, başlıklar iki kez; 5 satır (2 grup + 3 madde) → solda 3, sağda 2 */
  const liste = /<h2>3\. TESPİT[^<]*<\/h2><table>(.*?)<\/table>/.exec(h)?.[1] ?? "";
  assert.equal((liste.match(/<col /g) ?? []).length, 6);
  assert.equal((liste.match(/<th /g) ?? []).length, 6);
  assert.equal((liste.match(/<tr>/g) ?? []).length, 4, "başlık + 3 satır");
  assert.match(liste, /<td [^>]*class="rb-grup"[^>]*>GENEL KONTROLLER<\/td>.*<td class="rb-orta">2<\/td><td>\*Ray bağlantıları<\/td>/);
  assert.match(liste, /<td class="rb-orta">3<\/td><td>\*Dinamik yük deneyi \(1,1 x P\)<\/td>/);
  /* Bakanlık görünümünde (stilsiz format) sınıf yok, tablo başlık — eski formatlar aynı çizilir */
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
