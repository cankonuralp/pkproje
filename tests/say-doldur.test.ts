/* NEREDEN GELDİ: 542 — S.A.Y RAPORA GİRER (sunum 541 onaylı; reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir ve fotoğrafı okuyup ilgili
   yerlere girişleri yap diyeceğim ve yapacak", "maketleri falan da onaylıyorum"). Saf kurallar (src/modules/raporlar/say-doldur.ts, src/modules/say/
   istek.ts, src/modules/say/server/say.ts islemMetni / raporGirdisi):
   · K1 emin olunmayan değer de girer, "belirsiz" işaretlenir · K2 dolu alanın üstüne yazılmaz (dolu sayılır), "üstüne yaz" yazar · tablo satırları
     boş satıra / sona (elle yazılan hücre ezilmez) · K4 cevapsız maddeler cevap setinin ilk seçeneği, sonuç · geri al yalnız S.A.Y'ın girdiği ve
     hâlâ duran değeri döndürür · yalnız formatta fotoğraftan doldurması açık bölümler okunur · kısa komutlar kuralla tanınır, soru yapay zekâya gider ·
     S.A.Y'ın cevabını sunucu sayılardan kurar (istemci serbest metin yazamaz). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { Cevaplar, FormatTanimi } from "../src/format/tanim.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { alanlariUygula, geriAl, maddeleriIsaretle, okumaHedefleri, sonucuYap, tabloyaUygula, yerDegeri, type Durum } from "../src/modules/raporlar/say-doldur.ts";
import { istekTani } from "../src/modules/say/istek.ts";
import { islemMetni, raporGirdisi } from "../src/modules/say/server/say.ts";

const bos = (): Durum => ({ ekipman: { marka: "", model: "Elle Model", seri: "", imal: "" }, cevaplar: Cevaplar.parse({}) });
const izinli = new Set(["marka", "model", "seri", "imal"]);

test("K1 · K2: boş alana girer (emin / belirsiz işaret), dolu alanın üstüne yazmaz; üstüne yaz dolu alanı da yazar; izinsiz alan atılır", () => {
  const okunan = [
    { alan: "marka", deger: "Deneme Marka", guven: "yuksek" }, { alan: "model", deger: "DM-100", guven: "yuksek" },
    { alan: "imal", deger: "2019", guven: "dusuk" }, { alan: "renk", deger: "Kırmızı", guven: "yuksek" }, { alan: "seri", deger: "  ", guven: "yuksek" },
  ];
  const u = alanlariUygula(bos(), "ekipman", okunan, izinli);
  assert.deepEqual(u.durum.ekipman, { marka: "Deneme Marka", model: "Elle Model", seri: "", imal: "2019" });
  assert.deepEqual(u.isaretler, [{ yer: { tur: "ekipman", id: "marka" }, guven: "emin" }, { yer: { tur: "ekipman", id: "imal" }, guven: "belirsiz" }]);
  assert.deepEqual(u.dolu.map((x) => x.alan), ["model"], "dolu alan sayılır, yazılmaz");
  const ustune = alanlariUygula(u.durum, "ekipman", u.dolu, izinli, true);
  assert.equal(ustune.durum.ekipman.model, "DM-100");
  /* bilgi bölümü cevaplara, test değeri değerlere */
  const b = alanlariUygula(bos(), "bilgi", [{ alan: "a1", deger: "x", guven: "orta" }], new Set(["a1"]));
  assert.equal(b.durum.cevaplar.alan.a1, "x");
  const t = alanlariUygula(bos(), "test", [{ alan: "d1", deger: "12", guven: "yuksek" }], new Set(["d1"]));
  assert.equal(t.durum.cevaplar.deger.d1, "12");
  assert.deepEqual(t.isaretler[0].yer, { tur: "deger", id: "d1" });
});

test("tablo: boş satıra yalnız boş hücre, kalanı sona; işaretler son tablonun sırasıyla; elle yazılan hücre ezilmez", () => {
  const b = { id: "linye", sutunlar: [{ id: "no" }, { id: "devre" }, { id: "zx" }] } as unknown as Parameters<typeof tabloyaUygula>[1];
  const d: Durum = { ...bos(), cevaplar: { ...Cevaplar.parse({}), tablo: { linye: [{ no: "F1", devre: "Elle", zx: "" }, {}] } } };
  const u = tabloyaUygula(d, b, [{ degerler: { zx: "0,8" }, guven: "yuksek" }, { degerler: { no: "F2", devre: "Priz", bilinmeyen: "x" }, guven: "dusuk" }]);
  assert.deepEqual(u.durum.cevaplar.tablo.linye, [{ no: "F1", devre: "Elle", zx: "0,8" }, { no: "F2", devre: "Priz" }], "boş açılmış satır düşer");
  assert.deepEqual(u.isaretler, [
    { yer: { tur: "hucre", bolum: "linye", satir: 0, sutun: "zx" }, guven: "emin" },
    { yer: { tur: "hucre", bolum: "linye", satir: 1, sutun: "no" }, guven: "belirsiz" }, { yer: { tur: "hucre", bolum: "linye", satir: 1, sutun: "devre" }, guven: "belirsiz" },
  ]);
  assert.equal(yerDegeri(u.durum, { tur: "hucre", bolum: "linye", satir: 1, sutun: "no" }), "F2");
  assert.deepEqual(tabloyaUygula(d, b, []).geri, [], "okunan yoksa iş yok");
});

test("geri al: yalnız S.A.Y'ın girdiği ve hâlâ duran değer önceki hâline döner; kişinin sonradan değiştirdiğine dokunulmaz", () => {
  const u = alanlariUygula(bos(), "ekipman", [{ alan: "marka", deger: "M", guven: "yuksek" }, { alan: "seri", deger: "S", guven: "yuksek" }], izinli);
  const elle: Durum = { ...u.durum, ekipman: { ...u.durum.ekipman, seri: "Elle seri" } };
  const g = geriAl(elle, u.geri);
  assert.equal(g.sayi, 1);
  assert.deepEqual([g.durum.ekipman.marka, g.durum.ekipman.seri], ["", "Elle seri"]);
  const b = { id: "t", sutunlar: [{ id: "no" }] } as unknown as Parameters<typeof tabloyaUygula>[1];
  const tu = tabloyaUygula(bos(), b, [{ degerler: { no: "1" }, guven: "yuksek" }]);
  assert.deepEqual(geriAl(tu.durum, tu.geri).durum.cevaplar.tablo.t, [], "tablo önceki hâline");
});

test("K4: cevapsız maddeler ilk seçenekle (Uygun), cevaplanmış madde değişmez; sonuç; geri al", () => {
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const liste = t.bolumler.find((b) => b.blok === "liste")!;
  if (liste.blok !== "liste") throw new Error("liste yok");
  const [m1, m2] = liste.gruplar.flatMap((g) => g.maddeler);
  const d: Durum = { ...bos(), cevaplar: { ...Cevaplar.parse({}), madde: { [m1.id]: { c: liste.cevaplar[1], not: "kapak kırık" } } } };
  const u = maddeleriIsaretle(d, t);
  assert.deepEqual(u.durum.cevaplar.madde[m1.id], { c: liste.cevaplar[1], not: "kapak kırık" }, "cevaplanmış madde değişmez");
  assert.equal(u.durum.cevaplar.madde[m2.id].c, liste.cevaplar[0]);
  assert.equal(u.isaretler.length, liste.gruplar.flatMap((g) => g.maddeler).length - 1);
  assert.equal(geriAl(u.durum, u.geri).durum.cevaplar.madde[m2.id], undefined);
  const s = sonucuYap(d, "uygun_degil");
  assert.equal(s.durum.cevaplar.sonuc, "uygun_degil");
  assert.equal(sonucuYap(s.durum, "uygun_degil").geri.length, 0, "zaten öyleyse iş yok");
});

test("okunacak bölümler: formatta fotoğraftan doldurması açık olanlar (ekipman bilgileri, tablo); kapalı bölüm yok", () => {
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const h = okumaHedefleri(t);
  assert.ok(h.has("ekipman"), "ekipman bilgileri (etiket)");
  for (const b of t.bolumler) {
    if (b.id === "ekipman" || (b.blok === "bilgi" && b.tam)) continue;   // 2. bölüm (ekipman bilgileri) "ekipman" anahtarıyla okunur
    const acik = (b.blok === "olcum" && b.doldur?.foto !== false) || (b.blok !== "olcum" && b.doldur?.foto === true && !(b.blok === "bilgi" && b.tam));
    assert.equal(h.has(b.id), acik, `${b.ad}`);
  }
  const kapali = FormatTanimi.parse({ ...SABLONLAR.ZPKR02.tanim, bolumler: SABLONLAR.ZPKR02.tanim.bolumler.map((b) => (b.blok === "olcum" ? { ...b, doldur: { foto: false, excel: true } } : b)) });
  assert.ok(![...okumaHedefleri(kapali).values()].some((x) => x.tur === "tablo"), "fotoğraftan doldurma kapalı tablo okunmaz");
});

test("kısa komutlar kuralla tanınır; soru ve tanınmayan yapay zekâya gider", () => {
  for (const [m, i] of [
    ["Fotoğrafları oku ve gir", "oku"], ["fotoğrafı okuyup gir", "oku"], ["etiketi oku", "oku"], ["oku ve gir", "oku"], ["Panoyu doldur", "oku"], ["pano kapağı kırık", null],
    ["bütün maddeleri uygun işaretle", "maddeler"], ["Maddeleri uygun yap.", "maddeler"], ["sonucu uygun yap", "sonuc_uygun"],
    ["Sonucu uygun değil yap", "sonuc_uygun_degil"], ["üstüne yaz", "ustune"], ["dolu alanları da değiştir", "ustune"], ["evet", "ustune"],
    ["geri al", "geri"], ["fotoğrafı okuyabilir misin?", null], ["Sonuç ne olmalı", null], ["maddeler uygun mu", null], ["nasıl fotoğraf eklerim", null],
    ["merhaba", null], ["", null],
  ] as const) assert.equal(istekTani(m), i, m);
});

test("S.A.Y'ın cevabı sayılardan; girdi yapısı denetlenir (serbest metin yalnız soru ve formatın adları, sınırlı)", () => {
  const R = { id: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", no: "DM-1026-001" };
  const okuma = { okunan: 2, okunamayan: 1, neden: "Fotoğraf bozuk.", bolumler: [{ ad: "Ekipman bilgileri", alan: 3, satir: 0, belirsiz: 1 }, { ad: "Pano", alan: 0, satir: 12, belirsiz: 0 }],
    dolu: ["Marka"] };
  const g = raporGirdisi({ hizli: "islem", rapor: R, islem: { istek: "oku", soru: "Fotoğrafları oku ve gir", sayi: 2, okuma, metin: "sahte" } });
  assert.deepEqual(g, { hizli: "islem", rapor: R, islem: { istek: "oku", soru: "Fotoğrafları oku ve gir", sayi: 2, okuma } });
  assert.equal(islemMetni(g!.islem!), [
    "2 fotoğrafı okudum.", "- Ekipman bilgileri: 3 alan (1 değerden emin değilim, sarı)", "- Pano: 12 satır",
    "Dolu olduğu için değiştirmediğim: Marka. Değiştireyim mi?", "1 fotoğraf okunamadı: Fotoğraf bozuk.", "Kaydetmeyi unutmayın.",
  ].join("\n"));
  assert.match(islemMetni({ istek: "oku", soru: "x", sayi: 0, okuma: { okunan: 0, okunamayan: 0, neden: null, bolumler: [], dolu: [] } }), /^Okunacak fotoğraf yok/);
  assert.equal(islemMetni({ istek: "maddeler", soru: "x", sayi: 5 }), "5 maddeyi “Uygun” işaretledim. Kaydetmeyi unutmayın.");
  assert.equal(islemMetni({ istek: "sonuc_uygun_degil", soru: "x", sayi: 1, var: true }), "Sonucu “Uygun değil” yaptım. Kaydetmeyi unutmayın.");
  assert.equal(islemMetni({ istek: "sonuc_uygun", soru: "x", sayi: 0, var: false }), "Bu raporun formatında sonuç alanı yok.");
  assert.equal(islemMetni({ istek: "geri", soru: "x", sayi: 3 }), "3 girişi geri aldım.");
  for (const kotu of [
    { istek: "sil", soru: "x", sayi: 0 }, { istek: "oku", soru: "x", sayi: 0 }, { istek: "maddeler", soru: "", sayi: 0 }, { istek: "maddeler", soru: "x".repeat(301), sayi: 0 },
    { istek: "maddeler", soru: "x", sayi: -1 }, { istek: "maddeler", soru: "x", sayi: 1, okuma },
    { istek: "oku", soru: "x", sayi: 0, okuma: { ...okuma, bolumler: [{ ad: "x".repeat(121), alan: 0, satir: 0, belirsiz: 0 }] } },
    { istek: "oku", soru: "x", sayi: 0, okuma: { ...okuma, dolu: Array.from({ length: 61 }, () => "a") } },
    { istek: "oku", soru: "x", sayi: 0, okuma: { ...okuma, neden: "x".repeat(301) } },
  ]) assert.equal(raporGirdisi({ hizli: "islem", rapor: R, islem: kotu }), null, JSON.stringify(kotu));
});
