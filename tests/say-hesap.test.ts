/* NEREDEN GELDİ: 2026-10-31, kalem 6 — E7, E8, E9 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; beceriler B05, B06, B07). Saat hesabını ve
   toplu denetimi model değil sunucu yapar; seçenek "Uygun" / "Uygun " farkıyla yazılamıyordu. Bu kilit tutar: (1) saatler sırayla, süre + ara; sonraki
   kontrol periyottan, ayın günü taşarsa ayın son günü; gece yarısı taşması bildirilir; girişler haritanın biçiminde; (2) çakışma çiftleri; (3) seçenek
   önce birebir, sonra boşluk / Türkçe harf eşitlemesi, iki seçeneğe uyan yazılmaz; (4) denetim: gönderilmiş, eksik, fotoğraf (yok / çok), boş hücre,
   künye boş — künyenin değeri hiçbir sorunda yok; işlemler katalogda. Olumsuz kanıt: tests/bozan/say-hesap.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kapasiteCeliskisi, raporSorunlari } from "../src/modules/raporlar/denetle.ts";
import { aySonra, cakismalar, saatGirisleri, saatPlani } from "../src/modules/raporlar/saat-plani.ts";
import { secimKutusu } from "../src/modules/raporlar/say-doldur.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";

test("saat planı: sırayla, süre + ara; sonraki kontrol periyottan; gece yarısı taşması", () => {
  const p = saatPlani({ gun: "2026-10-27", baslangic: "10:00", ara: 0, raporlar: [{ id: "a", sure: 10, periyot: 12 }, { id: "b", sure: 10, periyot: 3 }, { id: "c", sure: 40, periyot: 1 }] });
  assert.deepEqual(p.map((x) => [x.bas.slice(11), x.bit.slice(11), x.sonraki]), [["10:00", "10:10", "2027-10-27"], ["10:10", "10:20", "2027-01-27"], ["10:20", "11:00", "2026-11-27"]]);
  assert.deepEqual(saatPlani({ gun: "2026-10-27", baslangic: "14:20", ara: 5, raporlar: [{ id: "a", sure: 40, periyot: 12 }, { id: "b", sure: 10, periyot: 12 }] }).map((x) => x.bas.slice(11)), ["14:20", "15:05"]);
  assert.equal(aySonra("2026-01-31", 1), "2026-02-28");
  assert.equal(aySonra("2028-01-31", 1), "2028-02-29");
  assert.equal(saatPlani({ gun: "2026-10-27", baslangic: "23:50", ara: 0, raporlar: [{ id: "a", sure: 30, periyot: 12 }] })[0]!.tasma, true);
  /* 2026-11-01 V21 T1: rapor tarihi = kontrol günü, saat yazılan her yerde */
  assert.deepEqual(saatGirisleri(p[0]!), [{ yer: "tarih:bas", deger: "27.10.2026 10:00" }, { yer: "tarih:bit", deger: "27.10.2026 10:10" }, { yer: "tarih:sonraki", deger: "27.10.2027" }, { yer: "tarih:rapor", deger: "27.10.2026" }]);
  assert.throws(() => saatPlani({ gun: "27.10.2026", baslangic: "10:00", ara: 0, raporlar: [] }));
});

test("çakışma çiftleri: kesişen aralıklar; uç uca değen çakışma değil", () => {
  assert.deepEqual(cakismalar([{ id: "a", bas: "2026-10-27T10:00", bit: "2026-10-27T11:00" }, { id: "b", bas: "2026-10-27T10:30", bit: "2026-10-27T10:40" },
    { id: "c", bas: "2026-10-27T11:00", bit: "2026-10-27T11:10" }, { id: "d", bas: null, bit: null }]), [["a", "b"]]);
});

test("seçenek eşitleme: birebir önce; boşluk ve Türkçe harf; iki seçeneğe uyan yazılmaz", () => {
  assert.deepEqual(secimKutusu("Uygun", ["Uygun ", "Uygun değil"]), { v: "Uygun " });
  assert.deepEqual(secimKutusu("UYGULANMAZ", ["Uygulanmaz"]), { v: "Uygulanmaz" });
  assert.deepEqual(secimKutusu("İyi", ["iyi"]), { v: "iyi" });
  assert.deepEqual(secimKutusu("Uygun", ["Uygun", "Uygun "]), { v: "Uygun" }, "birebir önce");
  assert.ok("neden" in secimKutusu("uygun", ["Uygun", "Uygun "]), "iki seçeneğe uyuyor");
});

const tanim = { bolumler: [{ id: "f", blok: "foto", ad: "Fotoğraflar" }, { id: "t", blok: "olcum", ad: "Tüpler", sutunlar: [{ id: "no" }, { id: "tip" }, { id: "hesap", formul: "=1" }] }] };
test("denetim sorunları; künye değeri yazılmaz; işlemler katalogda", () => {
  const s = raporSorunlari({ durum: "onayda", tanim: tanim as never, cevaplar: { tablo: { t: [{ no: "1", tip: "" }, { no: "", tip: "KKT" }] } } as never,
    fotolar: [{ bolum: "f", madde: null }, { bolum: "f", madde: null }, { bolum: "f", madde: null, okuma: true }], kunye: { firmaAdi: "Deneme Tesisi", sgk: "" } },
    [{ ad: "Marka" }]);
  assert.deepEqual(s, ["gönderilmiş (durum: onayda)", "eksik: Marka", "2 genel fotoğraf (ekipman başına bir)", "Tüpler: 2 boş hücre", "künye boş: SGK / DETSİS"]);
  assert.doesNotMatch(JSON.stringify(s), /Deneme Tesisi/);
  /* 2026-10-31 V21 ilk koşu: taslağın durumu "taslak"tır — "gönderilmiş" sayılmaz (KOD HATASI: "yeni" ile karşılaştırılıyordu, her taslak "gönderilmiş" çıkıyordu) */
  assert.deepEqual(raporSorunlari({ durum: "taslak", tanim: tanim as never, cevaplar: { tablo: {} } as never, fotolar: [], kunye: { firmaAdi: "x", sgk: "1" } }, []), ["fotoğraf yok"]);
  /* V21 madde 3: kontrol günü planın günlerinin dışındaysa uyarı; içindeyse yok; plan verilmezse yok */
  const r = (bas: string, plan: { baslangic: string; bitis: string } | null) => raporSorunlari({ durum: "taslak", tanim: { bolumler: [] } as never, cevaplar: { tablo: {} } as never,
    fotolar: [], kunye: { firmaAdi: "x", sgk: "1" }, tarih: { bas } }, [], plan);
  assert.deepEqual(r("2026-10-31T09:00:00+03:00", { baslangic: "2026-10-10", bitis: "2026-10-10" }), ["kontrol günü 31.10.2026 plan günlerinin (10.10.2026) dışında"]);
  assert.deepEqual(r("2026-10-11T09:00:00+03:00", { baslangic: "2026-10-10", bitis: "2026-10-12" }), []);
  assert.deepEqual(r("2026-10-13T09:00:00+03:00", { baslangic: "2026-10-10", bitis: "2026-10-12" }), ["kontrol günü 13.10.2026 plan günlerinin (10.10.2026 – 12.10.2026) dışında"]);
  assert.deepEqual(r("2026-10-31T09:00:00+03:00", null), []);
  /* 2026-11-01 V21 T3: "kapasite" adlı sayı alanları / test değerleri birbirinden farklıysa uyarı; aynıysa, tek alansa ya da boşsa yok */
  const kt = { bolumler: [{ id: "b", blok: "bilgi", ad: "B", alanlar: [{ id: "kap", ad: "Kaldırma kapasitesi", tur: "sayi" }, { id: "not", ad: "Kapasite notu", tur: "metin" }] },
    { id: "t", blok: "test", ad: "T", degerler: [{ id: "beyan", ad: "Beyan kapasitesi" }, { id: "din", ad: "Dinamik yük", not: "%110" }] }] };
  const kc = (alan: Record<string, string>, deger: Record<string, string>) => kapasiteCeliskisi({ tanim: kt as never, cevaplar: { alan, deger, tablo: {} } as never, ekipman: {} });
  assert.equal(kc({ kap: "4200", not: "x" }, { beyan: "3500", din: "4620" }), "kapasite değerleri çelişiyor: Kaldırma kapasitesi 4200 ≠ Beyan kapasitesi 3500");
  assert.equal(kc({ kap: "4.200" }, { beyan: "4200" }), null, "aynı değer");
  assert.equal(kc({ kap: "4200" }, {}), null, "tek alan");
  assert.equal(kc({}, { beyan: "3500" }), null);
  for (const a of ["rapor_saat_plani", "raporlara_yaz", "plan_denetle"]) assert.ok(ISLEM_KATALOGU.some((t) => t.ad === a), a);
  assert.equal(ISLEM_KATALOGU.find((t) => t.ad === "plan_denetle")!.tur, "oku", "denetim yazmaz");
});

/* 2026-10-31 (reisim: "önerdiklerini kabul ediyorum" — sonuç–madde denetimi): seçilen sonuç maddelerin önerisiyle çelişirse sorun; uyuşursa yok */
test("denetim: sonuç maddelerle çelişiyor", async () => {
  const { SABLONLAR } = await import("../src/format/sablonlar.ts");
  const { Cevaplar, FormatTanimi } = await import("../src/format/tanim.ts");
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const liste = t.bolumler.find((b) => b.blok === "liste")!;
  if (liste.blok !== "liste") throw new Error("liste yok");
  const m = liste.gruplar[0]!.maddeler[0]!.id;
  const rapor = (sonuc: string, c: string) => raporSorunlari({ durum: "yeni", tanim: t, cevaplar: Cevaplar.parse({ madde: { [m]: { c } }, sonuc }), fotolar: [],
    kunye: { firmaAdi: "x", sgk: "1" } }, []).filter((x) => x.startsWith("sonuç"));
  assert.match(rapor("uygun", liste.cevaplar[1]!).join(), /sonuç “Uygun” ama maddeler \/ ölçümler “Uygun değil” diyor \(1 kusur\)/);
  assert.deepEqual(rapor("uygun_degil", liste.cevaplar[1]!), []);
  assert.deepEqual(rapor("uygun", liste.cevaplar[0]!), []);
});
