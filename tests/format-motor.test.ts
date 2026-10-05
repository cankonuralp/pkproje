/* NEREDEN GELDİ: RAPOR-FORMAT.md (AA10, onaylı 2026-10-02; §8.3 "saha ekranı ve PDF bu tanımdan çizilir; çizen motor kodda tek") · KOD-GECIS K3
   ilk kalemi ("Format motoru: ZPKR01, ZPKR02, kompresör tanımdan") · ZPKK01 / ZPKK02 formülleri (maket MV.noktaHesap, MV.linyeHesap, MV.pdHesap,
   MV.ziHesap — sayılar maketle aynı) · AA9 (fotoğraf zorunluluğu ve kusur derecesi kural, başlangıçta kapalı) · AA11 (şablonda örnek değer yok). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { linyeHesap, noktaHesap, pdHesap, rcdTestYeter, sayiOku, sinirSonucu, ziHesap } from "../src/format/hesap.ts";
import { degerlendir, kilitDenetimi, kilitliKimlikler, yayinDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type FormatGirdisi } from "../src/format/tanim.ts";

const T = (k: string) => structuredClone(SABLONLAR[k].tanim);
const C = (x: object = {}) => Cevaplar.parse(x);

test("hesaplar maketle aynı sayıları verir (ZPKK01 / ZPKK02)", () => {
  assert.equal(sayiOku("0,34"), 0.34); assert.ok(Number.isNaN(sayiOku(""))); assert.ok(Number.isNaN(sayiOku("1,2,3")));
  assert.deepEqual(noktaHesap({ egri: "C", In: 63, zx: "0,21" }), { ia: 630, zs: 0.365, zx: 0.21, ik: 1095, not: 1, agir: false });
  assert.equal(noktaHesap({ egri: "B", In: 16, zx: "0,95" }).not, 1);                 // Zs = 230 / 80 = 2,875
  assert.equal(noktaHesap({ egri: "C", In: 25, zx: "1,12", rcd: "300" }).not, 4);     // aşıyor, RCD var
  assert.deepEqual([noktaHesap({ egri: "C", In: 25, zx: "1,12" }).not, noktaHesap({ egri: "C", In: 25, zx: "1,12" }).agir], [2, true]);
  assert.deepEqual([noktaHesap({ egri: "C", In: 16, zx: "0,5", priz: true }).not, noktaHesap({ egri: "C", In: 16, zx: "0,5", priz: true, rcd: "30" }).not], [5, 1]);
  assert.equal(noktaHesap({ egri: "C", In: 16, zx: "" }).not, null);
  assert.deepEqual([rcdTestYeter(30, "21", "24"), rcdTestYeter(30, "31", "24"), rcdTestYeter(30, "21", "201"), rcdTestYeter(30, "", "24")], [true, false, false, null]);
  assert.deepEqual(linyeHesap({ akim: 16, ib: "10", iz: "24", faz: "2,5", npen: "2,5", pe: "2,5", icu: "6", rcd: "30", id: "21", td: "18" }, "4,8"), { uygun: true, neden: [] });
  assert.deepEqual(linyeHesap({ akim: 32, ib: "35", iz: "41", faz: "50", npen: "25", pe: "16", icu: "4" }, "4,8")!.neden,
    ["Icu 4 kA < kısa devre akımı 4,8 kA", "Ib ≤ In ≤ Iz sağlanmıyor", "N/PEN kesiti faz kesitinden küçük", "PE kesiti yetersiz"]);
  assert.equal(linyeHesap({ akim: 16, icu: "6" }, "4,8"), null, "etiketten okunan Icu tek başına sonuç doğurmaz");
  assert.deepEqual([pdHesap({ kesit: "16" }), pdHesap({ kesit: "4", tkesit: "2" })!.neden.length, pdHesap({})], [{ uygun: true, neden: [] }, 2, null]);
  assert.deepEqual([ziHesap({ direnc: "180" })!.uygun, ziHesap({ direnc: "50" })!.uygun, ziHesap({ direnc: "" })], [true, false, null]);
  assert.deepEqual([sinirSonucu("<=", 2, "0,8"), sinirSonucu(">=", 16.5, "16"), sinirSonucu(undefined, undefined, "1"), sinirSonucu("<=", 2, "")], [true, false, null, null]);
});

test("şablonlar şemadan geçer, örnek değer taşımaz, yayın denetimi temiz; Bakanlık formatında zorunlu öğeler kilitli", () => {
  for (const [k, s] of Object.entries(SABLONLAR)) {
    assert.deepEqual(yayinDenetimi(s.tanim), [], k);
    assert.ok(!JSON.stringify(s.tanim).includes("ornek"), `${k}: örnek değer`);
  }
  const z2 = SABLONLAR.ZPKR02.tanim;
  assert.deepEqual(z2.bolumler.map((b) => b.id), ["firma", "ekipman", "termal", "cihaz", "gozle", "fonk", "linye", "pd", "zi", "foto", "kusur", "yorum", "sonuc", "imza"]);
  const gozle = z2.bolumler.find((b) => b.blok === "liste")!;
  assert.equal(gozle.blok === "liste" && gozle.gruplar.flatMap((g) => g.maddeler).length, 27);
  assert.ok(kilitliKimlikler(z2).has("g6_2") && kilitliKimlikler(z2).has("ik3") && kilitliKimlikler(z2).has("dogrudan"));
  assert.equal(kilitliKimlikler(SABLONLAR.KOMPRESOR.tanim).size, 0, "genel türde kilit yok");
  assert.deepEqual(SABLONLAR.ZPKR01.tanim.kurallar, { foto: false, derece: false, oneri: true }, "AA9: fotoğraf ve derece kapalı");
});

test("şema: kimlik tekil, seçim alanının seçeneği olur, sınır sayı olur; bozuk tanım yazılmaz", () => {
  const g = (b: object[]) => FormatTanimi.safeParse({ sema: 1, bolumler: b });
  assert.equal(g([{ id: "a", ad: "A", blok: "not" }, { id: "a", ad: "B", blok: "kusur" }]).success, false);
  assert.equal(g([{ id: "a", ad: "A", blok: "bilgi", alanlar: [{ id: "x", ad: "X", tur: "secim" }] }]).success, false);
  assert.equal(g([{ id: "a", ad: "A", blok: "test", degerler: [{ id: "x", ad: "X", op: "<=", sinir: "2" }] }]).success, false);
  assert.equal(g([{ id: "A b", ad: "A", blok: "not" }]).success, false, "kimlik biçimi");
  assert.equal(g([{ id: "a", ad: "A", blok: "betik" }]).success, false, "bilinmeyen blok");
  assert.equal(FormatTanimi.safeParse({ sema: 2, bolumler: [] }).success, false, "bilinmeyen şema sürümü");
  assert.equal(g([{ id: "a", ad: "A", blok: "foto", enAz: 5, enCok: 2 }]).success, false);
});

test("yayın denetimi: boş bölüm, sınırsız tablo, sonuç / imza yok, kilitli öğe silinmiş", () => {
  const t = T("ZPKR02");
  t.bolumler = t.bolumler.filter((b) => b.id !== "fonk" && b.id !== "imza");
  const gozle = t.bolumler.find((b) => b.id === "gozle");
  if (gozle?.blok === "liste") gozle.gruplar[0].maddeler.splice(0, 1);
  t.bolumler.push({ id: "bos", ad: "Boş tablo", blok: "olcum", kilit: false, satir: "ekle", enAz: 0, sutunlar: [{ id: "a", ad: "A", giris: "sayi", zorunlu: false }] });
  const l = yayinDenetimi(t, SABLONLAR.ZPKR02.tanim);
  for (const p of ["“Boş tablo” tablosunda", "İmza alanları bölümü yok.", "zorunlu öğesi silinmiş: fonk", "silinmiş: g1_1", "silinmiş: ik3", "silinmiş: imza"])
    assert.ok(l.some((x) => x.includes(p)), `${p} — ${l.join(" | ")}`);
});

/* 2026-10-04 (308, RAPOR-FORMAT §3 "silinemez, yalnız sırası / görünümü değişir; eksikse yayınlanmaz — tek engel"): kilitli öğenin yalnız silinmesi
   değil, özünün değişmesi, kilidinin kaldırılması, zorunluluğunun gevşemesi ve resmî form kodunun / başlığının değişmesi de engel. */
test("kilit denetimi: sıra serbest, kilitsiz ekleme serbest; kilitli öğe silinemez, değişmez, kilidi / zorunluluğu kalkmaz; form kodu sabit", () => {
  const k = SABLONLAR.ZPKR02.tanim;
  const t = T("ZPKR02");
  t.bolumler.reverse();
  const ek = t.bolumler.find((b) => b.id === "ekipman");
  if (ek?.blok === "bilgi") { ek.alanlar.reverse(); ek.alanlar.push({ id: "firma_ek", ad: "Firma ek alanı", tur: "metin", zorunlu: false, kilit: false }); }
  t.kurallar.foto = true;
  assert.deepEqual(kilitDenetimi(t, k), [], "sıra, kilitsiz yeni alan ve kurallar serbest");
  const d = T("ZPKR02");
  const b = (id: string) => d.bolumler.find((x) => x.id === id)!;
  const ekipman = b("ekipman"), fonk = b("fonk"), linye = b("linye"), gozle = b("gozle"), sonuc = b("sonuc");
  if (ekipman.blok === "bilgi") {
    ekipman.alanlar.find((a) => a.id === "sebeke")!.secenekler = ["TT"];
    ekipman.alanlar.find((a) => a.id === "kurulus")!.zorunlu = false;
    ekipman.alanlar.find((a) => a.id === "gerilim")!.kilit = false;
  }
  if (fonk.blok === "test") fonk.degerler.find((x) => x.id === "zx")!.sinir = 5;
  if (linye.blok === "olcum") { linye.sutunlar = linye.sutunlar.filter((s) => s.id !== "icu"); linye.enAz = 0; }
  if (gozle.blok === "liste") gozle.cevaplar = ["Uygun", "Uygun değil"];
  if (sonuc.blok === "sonuc") sonuc.cumle = "Başka cümle";
  d.gorunum.formKodu = "ZPKR99";
  const l = kilitDenetimi(d, k);
  for (const p of ["değiştirilmiş: sebeke", "zorunluluğu kaldırılmış: kurulus", "kilidi kaldırılmış: gerilim", "değiştirilmiş: zx", "silinmiş: linye.icu",
    "değiştirilmiş: linye", "değiştirilmiş: gozle", "değiştirilmiş: sonuc", "form kodu ve başlığı değiştirilemez: ZPKR02"]) {
    assert.ok(l.some((x) => x.includes(p)), `${p} — ${l.join(" | ")}`);
  }
  assert.deepEqual(kilitDenetimi(T("KOMPRESOR"), SABLONLAR.KOMPRESOR.tanim), []);
  const kom = T("KOMPRESOR"); kom.bolumler = []; kom.gorunum.baslik = "Başka";
  assert.deepEqual(kilitDenetimi(kom, SABLONLAR.KOMPRESOR.tanim), [], "kilitsiz (genel) şablonda engel yok");
});

test("değerlendirme ZPKR02: boş rapor eksikleri listeler; olumsuz madde, sınır dışı değer, linye kusuru kusur listesine düşer; öneri uygun değil", () => {
  const t = SABLONLAR.ZPKR02.tanim;
  const bos = degerlendir(t, C());
  assert.ok(bos.eksikler.some((e) => e.alan === "g1_1") && bos.eksikler.some((e) => e.alan === "zx") && bos.eksikler.some((e) => e.alan === "sonuc"));
  assert.ok(!bos.eksikler.some((e) => e.alan === "firma_adi"), "kayıttan gelen alan eksik sayılmaz");
  assert.ok(!bos.eksikler.some((e) => e.alan === "dkd_tip"), "isteğe bağlı değer eksik sayılmaz");
  assert.equal(bos.oneri, "uygun");
  const madde: Record<string, { c: string }> = {};
  for (const b of t.bolumler) if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) madde[m.id] = { c: "Uygun" };
  madde.g3_4 = { c: "Uygun değil", not: "Pleksi koruma yok" } as never;
  const r = degerlendir(t, C({
    madde, deger: { zx: "0,41", zln: "0,2", ff: "398", ln: "229", npe: "1,2", ik3: "4,8" },
    tablo: { linye: [{ no: "F3", devre: "Kompresör", tip: "C", akim: "32", ib: "35", iz: "41" }], zi: [{ yer: "ADP önü", direnc: "180" }] },
  }));
  assert.deepEqual(r.kusurlar.map((k) => k.metin), [
    "Pano iç kapak, faza erişim engeli veya pleksi koruma: Pleksi koruma yok",
    "Panodan ölçülen faz-toprak çevrim empedansı (Zx): 0,41 Ω (sınır ≤ 0,37 Ω)",
    "F3: Ib ≤ In ≤ Iz sağlanmıyor",
  ]);
  assert.equal(r.oneri, "uygun_degil");
  assert.deepEqual([r.degerler.zx, r.degerler.npe, r.degerler.zln], [false, true, null]);
  assert.deepEqual(r.satirlar.zi, [{ uygun: true, neden: [], oneriNot: null }]);
  /* kural kapalıysa öneri yok */
  const k = structuredClone(t); k.kurallar.oneri = false;
  assert.equal(degerlendir(k, C({ madde })).oneri, "uygun");
});

test("değerlendirme ZPKR01: uygunluk notu seçilir (öneri hesaptan), kusuru not belirler; not seçilmeyen satır eksik", () => {
  const t = SABLONLAR.ZPKR01.tanim;
  const r = degerlendir(t, C({ tablo: { nokta: [
    { ad: "ADP · ana şalter", egri: "C", inom: "63", zx: "0,21", not: "1" },
    { ad: "Havalandırma motoru", egri: "C", inom: "25", zx: "1,12", rcd: "300", not: "4" },
    { ad: "Kompresör besleme", egri: "C", inom: "32", zx: "1,5", not: "2" },
    { ad: "Ofis prizleri", egri: "B", inom: "20", zx: "0,4" },
  ] } }));
  assert.deepEqual(r.satirlar.nokta.map((x) => x.oneriNot), [1, 4, 2, 1]);
  assert.deepEqual(r.kusurlar.map((k) => [k.metin.slice(0, 26), k.agir]), [["Kompresör besleme: Not-2 —", true]]);
  assert.ok(r.eksikler.some((e) => e.alan === "nokta#3.not"));
  assert.ok(r.eksikler.some((e) => e.alan === "selektif") === false, "selektivite tablosu isteğe bağlı");
});

test("kurallar: kusur derecesi açıksa sorulur ve ağır işaretlenir (AA9 başlangıçta kapalı); foto en az; cihaz eklenmedi", () => {
  const t = T("KOMPRESOR");
  t.kurallar.derece = true;
  const f = t.bolumler.find((b) => b.blok === "foto"); if (f?.blok === "foto") f.enAz = 2;
  const r = degerlendir(t, C({ madde: { k1: { c: "Uygun değil" }, k2: { c: "Uygun değil", derece: "agir" } }, foto: { foto: 1 } }));
  assert.ok(r.eksikler.some((e) => e.alan === "k1.derece") && !r.eksikler.some((e) => e.alan === "k2.derece"));
  assert.deepEqual(r.kusurlar.map((k) => k.agir), [false, true]);
  assert.ok(r.eksikler.some((e) => e.ad === "En az 2 fotoğraf") && r.eksikler.some((e) => e.ad === "Ölçüm cihazı eklenmedi"));
  /* bilinmeyen cevap eksik sayılır (istemciden gelen değer cevap setinde olmalı) */
  assert.ok(degerlendir(t, C({ madde: { k1: { c: "Belki" } } })).eksikler.some((e) => e.alan === "k1"));
});

test("cevaplar şeması sınırları tutar (istemciden gelen rapor içeriği)", () => {
  assert.equal(Cevaplar.safeParse({ foto: { foto: -1 } }).success, false);
  /* 2026-10-05 (C18): fotoğraf sayısı bölüm başına. Aynı gün çapraz inceleme: eski satırın tek sayısı reddedilmez, boş kayda çevrilir (sayı olarak
     kabul edilmez — sunucu sayıları raporun kendi listesinden hesaplar); eskiden burada "reddedilir" bekleniyordu */
  assert.deepEqual(Cevaplar.parse({ foto: 3 }).foto, {}, "sayı bölüm başına kayda çevrilmez, boşalır");
  assert.equal(Cevaplar.safeParse({ sonuc: "belki" }).success, false);
  assert.equal(Cevaplar.safeParse({ tablo: { a: Array.from({ length: 301 }, () => ({})) } }).success, false);
  assert.equal(Cevaplar.safeParse({ alan: { a: "x".repeat(2001) } }).success, false);
  const g: FormatGirdisi = { sema: 1, bolumler: [] };
  assert.deepEqual(FormatTanimi.parse(g).kurallar, { foto: false, derece: false, oneri: true });
});

/* 2026-10-05 (312; pkproje §3.8-5 temel zorunlular, C4, C18, AA9): fotoğraf bölüm başına sayılır (termal ile fotoğraflar ayrı); hazır şablonlarda
   fotoğraf en az 1; "Uygun değil" maddenin açıklaması zorunlu; maddede fotoğraf yalnız kural açıksa zorunlu (başlangıçta kapalı). */
test("fotoğraf ve kusur açıklaması: bölüm başına sayı, şablonda en az 1, olumsuz maddede açıklama zorunlu, maddede fotoğraf kural açıksa", () => {
  const z = T("ZPKR02");
  const bolum = (id: string) => z.bolumler.find((b) => b.id === id);
  assert.equal((bolum("foto") as { enAz: number }).enAz, 1, "fotoğraflar en az 1");
  assert.equal((bolum("termal") as { enAz: number }).enAz, 0, "termal isteğe bağlı");
  assert.ok(degerlendir(z, C({ foto: { termal: 3 } })).eksikler.some((e) => e.alan === "foto"), "termal fotoğrafı fotoğraflar bölümünü doldurmaz");
  assert.ok(!degerlendir(z, C({ foto: { foto: 1 } })).eksikler.some((e) => e.alan === "foto"));
  assert.equal((T("KOMPRESOR").bolumler.find((b) => b.blok === "foto") as { enAz: number }).enAz, 1);
  const t = T("KOMPRESOR");
  const r = degerlendir(t, C({ madde: { k1: { c: "Uygun değil" }, k2: { c: "Uygun değil", not: "Korozyon" } } }));
  assert.ok(r.eksikler.some((e) => e.alan === "k1.not" && e.ad.endsWith("· kusur açıklaması")) && !r.eksikler.some((e) => e.alan === "k2.not"));
  assert.ok(!r.eksikler.some((e) => e.alan.endsWith(".foto")), "maddede fotoğraf başlangıçta zorunlu değil (AA9)");
  t.kurallar.foto = true;
  const f = degerlendir(t, C({ madde: { k1: { c: "Uygun değil", not: "x" }, k2: { c: "Uygun değil", not: "y", foto: 1 } } }));
  assert.ok(f.eksikler.some((e) => e.alan === "k1.foto") && !f.eksikler.some((e) => e.alan === "k2.foto"));
});

/* 2026-10-05 (313-314 çapraz inceleme): 312'den önce açılan raporlarda foto tek sayıydı — şema geriye uyumlu okur (sayı → boş kayıt; sunucu
   sayıları raporun kendi listesinden yeniden hesaplar). Yoksa eski satır şemadan geçmez, cevaplar boş görünür ve Kaydet gerçek cevapları silerdi. */
test("cevaplar: eski raporun sayı olan foto alanı okunur (boş kayıt), madde cevapları kaybolmaz", () => {
  const c = Cevaplar.parse({ madde: { k1: { c: "Uygun değil", not: "Korozyon" } }, foto: 0 });
  assert.deepEqual([c.foto, c.madde.k1], [{}, { c: "Uygun değil", not: "Korozyon" }]);
  assert.deepEqual(Cevaplar.parse({ foto: 3 }).foto, {});
  assert.equal(Cevaplar.safeParse({ foto: "3" }).success, false, "sayı dışında yanlış tür yine reddedilir");
});
