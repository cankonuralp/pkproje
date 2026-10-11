/* NEREDEN GELDİ: 460 — reisim 2026-10-09: "ekipman bilgileri kısmıda değiştirilebilir olsun zira yangın dolabı gibi ekipmanlarda farklı girdiler
   olabiliyor sabit olan tek şey firma bilgileri, cihazlar ve standartlar". Format tanımında "tam" ekipman bölümü ve ekipman kaydına bağlı alan
   (src/format/tanim.ts), düzen ve eski formatı çevirme (src/format/duzen.ts ekipmanTamYap), belge (src/belge/belge.ts), kâğıt yardımcısı
   (rapor-format/kurucu.ts ekipmanAlaniEkle). Kilitler: şema yanlış bağlamayı reddeder; eski format çevrilince belgenin METNİ aynı kalır (Bakanlık
   beşi ve kompresör); Bakanlık kilit denetimi çevrilmiş taslağı geçirir; tam bölümlü belgede 2. bölüm yalnız kod, tür ve formatın alanlarıdır.
   486 (reisim 2026-10-10, hata listesi 38: "silinemiyor hala ekipman bilgileri tablosu"): 2. bölümün TAMAMI silinir (kurucu.ts ekipmanBolumuKaldir —
   görünümde ekipman: false): belgede 2. bölüm yok, kod ve tür 1. bölümde, numaralar bir kayar, kurucu açılışta geri eklemez; geri eklenir. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { ekipmanTamYap, raporDuzeni, sabitEkipmanAlanlari } from "../src/format/duzen.ts";
import { degerlendir, kilitDenetimi, yayinDenetimi } from "../src/format/motor.ts";
import { bosFormat, grupFormati, SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, EKIPMAN_ALANLARI, FormatTanimi, type BolumOf, type FormatGirdisi } from "../src/format/tanim.ts";
import { ekipmanAlaniEkle, ekipmanBolumuGeriEkle, ekipmanBolumuKaldir, ogeSil, ogeYaz } from "../src/modules/rapor-format/kurucu.ts";
import { kurucuyaHazirla } from "../src/format/duzen.ts";
import { ekipmanAlanlari } from "../src/modules/raporlar/doldur.ts";
import { kullanim } from "../src/modules/rapor-format/kullanim.ts";
import { surumFarki } from "../src/modules/rapor-format/fark.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const belgeMetni = (t: FormatTanimi) => metin(renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR01"), tanim: t, ekipman: {
  kod: "DT-1", marka: "Deneme Marka", model: "M-1", seri: "S-1", imal: "2020", konum: "Deneme yeri", amac: "Deneme amacı", bolum: "Deneme bölümü",
} }) as never));
const tamBolumu = (t: FormatTanimi) => t.bolumler.find((b) => b.blok === "bilgi" && b.tam) as BolumOf<"bilgi">;
const bilgi = (alanlar: unknown[], tam = true) => ({ id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", tam, alanlar });
const sema = (bolumler: unknown[]) => FormatTanimi.safeParse({ sema: 1, bolumler } as FormatGirdisi);

test("şema: ekipman kaydına bağlı alan yalnız tam bölümde, yazı alanı, kayıttan değil, her biri bir kez; tam bölüm bir tane", () => {
  assert.equal(sema([bilgi([{ id: "a1", ad: "Marka", tur: "metin", ekipman: "marka" }])]).success, true);
  assert.equal(sema([bilgi([{ id: "a1", ad: "Marka", tur: "metin", ekipman: "marka" }], false)]).success, false, "tam olmayan bölümde bağlı alan");
  assert.equal(sema([bilgi([{ id: "a1", ad: "Marka", tur: "sayi", ekipman: "marka" }])]).success, false, "sayı türünde bağlı alan");
  assert.equal(sema([bilgi([{ id: "a1", ad: "Seri", tur: "metin", ekipman: "seri", kaynak: "seri_no" }])]).success, false, "hem kayıttan hem bağlı");
  assert.equal(sema([bilgi([{ id: "a1", ad: "Marka", tur: "metin", ekipman: "marka" }, { id: "a2", ad: "Marka 2", tur: "metin", ekipman: "marka" }])]).success, false, "iki kez");
  assert.equal(sema([bilgi([]), { ...bilgi([]), id: "ikinci" }]).success, false, "iki tam bölüm");
  assert.equal(sema([bilgi([{ id: "a1", ad: "Marka", tur: "metin", ekipman: "yok" }])]).success, false, "bilinmeyen ekipman alanı");
});

test("eski format çevrilince: tam bölüm, belgenin metni AYNI (Bakanlık beşi + kompresör), Bakanlık kilitleri geçer, ikinci çevirme değiştirmez", () => {
  for (const [ad, s] of Object.entries(SABLONLAR)) {
    const eski = s.tanim, yeni = ekipmanTamYap(eski);
    assert.equal(FormatTanimi.safeParse(yeni).success, true, `${ad}: şemadan geçer`);
    assert.ok(tamBolumu(yeni), `${ad}: tam bölüm var`);
    assert.deepEqual(sabitEkipmanAlanlari(yeni), [], `${ad}: sabit satır kalmadı`);
    assert.deepEqual(raporDuzeni(yeni, false).katilan.map((b) => b.id), [tamBolumu(yeni).id], `${ad}: 2. bölüme yalnız tam bölüm katılır`);
    assert.deepEqual(raporDuzeni(yeni, false).bolumler.map((x) => [x.b.id, x.no]), raporDuzeni(eski, false).bolumler.map((x) => [x.b.id, x.no]), `${ad}: öteki bölümler ve numaralar aynı`);
    assert.equal(belgeMetni(yeni), belgeMetni(eski), `${ad}: belgenin metni aynı`);
    assert.deepEqual(kilitDenetimi(yeni, eski), [], `${ad}: kilitli öğeler korunur`);
    assert.deepEqual(yayinDenetimi(yeni, eski).filter((x) => x.includes("Bakanlık")), [], `${ad}: yayın engeli yok`);
    assert.equal(ekipmanTamYap(yeni), yeni, `${ad}: ikinci çevirme aynısını döner`);
  }
  /* kompresör: eski sabit satırlar (formatta aynı adlı alanı olmayanlar) bağlı alan olur; 2. bölümde sabit satırı olan kayıttan alanlar çıkar */
  const k = tamBolumu(ekipmanTamYap(SABLONLAR.KOMPRESOR.tanim));
  assert.deepEqual(k.alanlar.map((a) => a.ekipman ?? a.id), ["seri", "konum", "amac", "bolum", "marka", "imal", "calisma", "hacim"]);
  assert.ok(!k.alanlar.some((a) => a.kaynak), "kod, seri no, kullanım yeri kayıttan alanları çıktı");
  /* boş format (437): yalnız kayıttan alanlı "Ekipman bilgileri" bölümü tam olur, yeni bölüm açılmaz */
  const bos = ekipmanTamYap(FormatTanimi.parse({ ...bosFormat("Deneme"), bolumler: bosFormat("Deneme").bolumler.map((b) => (b.blok === "bilgi" && b.tam
    ? { id: b.id, ad: b.ad, blok: "bilgi", alanlar: [{ id: "ekipman_kodu", ad: "Ekipman kodu", tur: "metin", kaynak: "ekipman_kodu" }] } : b)) }));
  assert.equal(bos.bolumler.filter((b) => b.blok === "bilgi").length, 2);
  assert.deepEqual(tamBolumu(bos).alanlar.map((a) => a.ekipman), ["marka", "model", "seri", "imal", "konum", "amac", "bolum"]);
  /* ekipman bölümü hiç yoksa 1. bölümün kopyasından sonra açılır */
  const yok = ekipmanTamYap(FormatTanimi.parse({ sema: 1, bolumler: [SABLONLAR.KOMPRESOR.tanim.bolumler[0], { id: "not", ad: "Not", blok: "not" }] }));
  assert.deepEqual(yok.bolumler.map((b) => b.id), ["firma", "ekipman", "not"]);
});

test("yeni formatlar (grup formatı, boş format) tam bölümlü; bağlı alanların hepsi; belgede 2. bölüm kod, tür ve formatın alanları — sıra ve ad formattan", () => {
  for (const t of [grupFormati({ ad: "Yangın dolabı", grup: "diger" }), bosFormat("Deneme")]) {
    assert.deepEqual(tamBolumu(t).alanlar.filter((a) => a.ekipman).map((a) => a.ekipman), [...EKIPMAN_ALANLARI]);
    assert.deepEqual(sabitEkipmanAlanlari(t), []);
  }
  /* yangın dolabı gibi: marka, model çıkar; "Seri no" adı değişir; yeni alan eklenir */
  let t = grupFormati({ ad: "Yangın dolabı", grup: "diger" });
  const i = t.bolumler.findIndex((b) => b.blok === "bilgi" && b.tam);
  t = ogeSil(ogeSil(t, i, "e_marka"), i, "e_model");
  t = ogeYaz(t, i, "e_seri", { ad: "Dolap no", tur: "sayi", zorunlu: true });
  assert.deepEqual(tamBolumu(t).alanlar.find((a) => a.id === "e_seri"), { id: "e_seri", ad: "Dolap no", tur: "metin", zorunlu: false, kilit: false, ekipman: "seri" },
    "bağlı alanın yalnız adı değişir");
  t = FormatTanimi.parse({ ...t, bolumler: t.bolumler.map((b, j) => (j === i && b.blok === "bilgi" ? { ...b, alanlar: [...b.alanlar, { id: "hortum", ad: "Hortum uzunluğu", tur: "sayi", birim: "m" }] } : b)) });
  const m = belgeMetni(t);
  const iki = m.slice(m.indexOf("2. Ekipman bilgileri"), m.indexOf("3. "));
  assert.match(iki, /Ekipman kodu DT-1 Ekipman türü Deneme türü Dolap no S-1 İmal yılı 2020 Kullanım yeri Deneme yeri Kullanım amacı Deneme amacı Ekipman bölümü Deneme bölümü/);
  assert.match(iki, /Hortum uzunluğu/);
  assert.doesNotMatch(iki, /Marka|Model/, "çıkarılan satır belgede yok");
  /* geri ekleme: yalnız eksik olan, bir kez */
  const g = ekipmanAlaniEkle(t, i, "marka");
  assert.equal(tamBolumu(g).alanlar.filter((a) => a.ekipman === "marka").length, 1);
  assert.equal(ekipmanAlaniEkle(g, i, "marka"), g, "ikinci kez eklenmez");
  assert.equal(FormatTanimi.safeParse(g).success, true);
});

test("değerlendirme: zorunlu işaretli bağlı alan cevaplarda aranmaz (değeri raporun ekipman bilgisinde)", () => {
  const t = FormatTanimi.parse({ sema: 1, bolumler: [bilgi([{ id: "a1", ad: "Marka", tur: "metin", ekipman: "marka", zorunlu: true }, { id: "a2", ad: "Basınç", tur: "metin", zorunlu: true }])] });
  assert.deepEqual(degerlendir(t, Cevaplar.parse({})).eksikler.map((e) => e.alan), ["a2"]);
});

test("486: ekipman bölümünün tamamı silinir — belgede 2. bölüm yok, kod ve tür 1. bölümde, numaralar bir kayar; kurucu geri eklemez; geri eklenir", () => {
  const z = kurucuyaHazirla(SABLONLAR.ZPKR01.tanim);
  const once = raporDuzeni(z, false), sil = ekipmanBolumuKaldir(z), d = raporDuzeni(sil, false);
  assert.equal(FormatTanimi.safeParse(sil).success, true, "şemadan geçer");
  assert.deepEqual([once.ekipman, d.ekipman, d.tam, d.katilan.length], [true, false, null, 0]);
  assert.equal(sil.bolumler.some((b) => b.blok === "bilgi" && b.tam), false, "tam bölüm çıktı");
  /* ilk format bölümünün numarası bir azaldı; cihazlı raporda cihaz bölümü 2 */
  assert.equal(Number(d.bolumler[0].no), Number(once.bolumler[0].no) - 1);
  assert.equal(raporDuzeni(sil, true).cihazNo, "2");
  assert.equal(raporDuzeni(z, true).cihazNo, "3");
  /* kurucu açılışı (ekipmanTamYap) ve eski formatın sabit satırları bölümü geri getirmez */
  assert.deepEqual(kurucuyaHazirla(sil), sil);
  assert.deepEqual(sabitEkipmanAlanlari(sil), []);
  assert.deepEqual(ekipmanAlanlari(sil).alanlar, [], "fotoğraftan / Excel'den doldurulacak ekipman alanı yok");
  /* belge: "2. Ekipman bilgileri" yok, kod ve tür 1. bölümde */
  const b = belgeMetni(sil);
  assert.doesNotMatch(b, /2\s*\.?\s*Ekipman bilgileri/);
  assert.match(b, /1\s*\.?\s*Firma bilgileri.*Ekipman kodu DT-1 Ekipman türü Deneme türü/);
  assert.doesNotMatch(b, /Deneme Marka/, "silinen bölümün alanları belgede yok");
  /* kullanım kutusu ve sürüm farkı */
  assert.equal(kullanim(sil).bolum, kullanim(z).bolum - 1);
  assert.ok(surumFarki(z, sil).some((x) => x.metin.startsWith("Ekipman bilgileri bölümü kaldırıldı")), JSON.stringify(surumFarki(z, sil)));
  /* geri ekle: tam bölüm, ekipman kaydına bağlı varsayılan alanlarla; numaralar eskisi gibi */
  const geri = ekipmanBolumuGeriEkle(sil);
  assert.equal(geri.gorunum.ekipman, undefined);
  assert.ok(tamBolumu(geri)?.alanlar.some((a) => a.ekipman === "marka"));
  assert.deepEqual(raporDuzeni(geri, false).bolumler.map((x) => x.no), once.bolumler.map((x) => x.no));
  assert.match(belgeMetni(geri), /2\s*\.?\s*Ekipman bilgileri/);
  /* Bakanlık bölümü silindi: yayında uyarı (engel değil) */
  assert.ok(kilitDenetimi(sil, SABLONLAR.ZPKR01.tanim).length > 0);
});

