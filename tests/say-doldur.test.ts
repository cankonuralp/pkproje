/* NEREDEN GELDİ: 542 — S.A.Y RAPORA GİRER (sunum 541 onaylı; reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir ve fotoğrafı okuyup ilgili
   yerlere girişleri yap diyeceğim ve yapacak", "maketleri falan da onaylıyorum"). Saf kurallar (src/modules/raporlar/say-doldur.ts, src/modules/say/
   istek.ts, src/modules/say/server/say.ts islemMetni / raporGirdisi):
   · K1 emin olunmayan değer de girer, "belirsiz" işaretlenir · K2 dolu alanın üstüne yazılmaz (dolu sayılır), "üstüne yaz" yazar · tablo satırları
     boş satıra / sona (elle yazılan hücre ezilmez) · K4 cevapsız maddeler cevap setinin ilk seçeneği, sonuç · geri al yalnız S.A.Y'ın girdiği ve
     hâlâ duran değeri döndürür · yalnız formatta fotoğraftan doldurması açık bölümler okunur · kısa komutlar kuralla tanınır, soru yapay zekâya gider ·
     S.A.Y'ın cevabını sunucu sayılardan kurar (istemci serbest metin yazamaz).
   550 (sunum 546 K6 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum … aynı claude kullanır gibi"): ekranda kalan
   komutlar yalnız "fotoğrafları oku (ve gir)", "geri al", "evet / üstüne yaz"; "maddeleri uygun işaretle", "sonucu … yap" ve birleşik istekler
   Haiku'ya gider · Haiku'nun "rapora_yaz" girişleri (komutlariUygula): yer kimliğiyle, türüne göre denetlenir, kişi istediği için dolu alana da yazılır,
   tabloya yeni satır açılır, formüllü sütuna / bilinmeyen yere yazılmaz (nedeniyle döner), madde cevabı bölümün seçeneklerinden, geri al. */
import assert from "node:assert/strict";
import { ELLE_GEREKCE, ELLE_SONUC } from "../src/format/motor.ts";
import { test } from "node:test";
import { Cevaplar, FormatTanimi, TABLO_SATIR_EN_COK } from "../src/format/tanim.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { alanlariUygula, geriAl, GIRIS_EN_COK, komutlariUygula, maddeleriIsaretle, okumaHedefleri, SATIR_EKLE_EN_COK, sonucOzeti, sonucuYap, tabloyaUygula, yerDegeri,
  type Durum } from "../src/modules/raporlar/say-doldur.ts";
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

test("kısa komutlar kuralla tanınır (yalnız oku / geri al / üstüne yaz); öteki her istek Haiku'ya gider", () => {
  for (const [m, i] of [
    ["Fotoğrafları oku ve gir", "oku"], ["fotoğrafı okuyup gir", "oku"], ["etiketi oku", "oku"], ["oku ve gir", "oku"], ["Panoyu doldur", null], ["pano kapağı kırık", null],
    /* 550: maddeler / sonuç / birleşik istek Haiku'ya (cümlenin tamamını yapar) */
    ["bütün maddeleri uygun işaretle", null], ["Maddeleri uygun yap.", null], ["sonucu uygun yap", null], ["Sonucu uygun değil yap", null],
    ["4.2'yi uygun değil işaretle ve sonucu uygun değil yap", null], ["fotoğrafları oku ve 1. satıra 3000 yaz", null], ["Fotoğrafları oku ve maddeleri işaretle", null],
    ["üstüne yaz", "ustune"], ["dolu alanları da değiştir", "ustune"], ["evet", "ustune"],
    ["geri al", "geri"], ["fotoğrafı okuyabilir misin?", null], ["Sonuç ne olmalı", null], ["maddeler uygun mu", null], ["nasıl fotoğraf eklerim", null],
    ["merhaba", null], ["", null],
  ] as const) assert.equal(istekTani(m), i, m);
});

/* 550: Haiku'nun "rapora_yaz" girişleri */
test("rapora_yaz: yer kimliğiyle, türüne göre; dolu alana da; tabloya yeni satır; formüllü / bilinmeyen yer yazılmaz; madde seçenekten; geri al", () => {
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const tablo = t.bolumler.find((b) => b.blok === "olcum" && b.id === "linye");
  const liste = t.bolumler.find((b) => b.blok === "liste");
  if (!tablo || tablo.blok !== "olcum" || !liste || liste.blok !== "liste") throw new Error("ZPKR02 bölümleri yok");
  const icu = tablo.sutunlar.find((s) => s.ad === "Icu")!, tip = tablo.sutunlar.find((s) => s.giris === "secim")!, m1 = liste.gruplar[0].maddeler[0];
  const d: Durum = { ...bos(), cevaplar: { ...Cevaplar.parse({}), tablo: { linye: [{ [icu.id]: "6" }] } } };
  const u = komutlariUygula(d, t, [
    { yer: "e:model", deger: "DM-200" },                                  // dolu alan (Elle Model) — kişi istedi, yazılır
    { yer: "e:imal", deger: "19x9" },                                     // yıl değil
    { yer: `t:linye:1:${icu.id}`, deger: "3000" }, { yer: `t:linye:3:${icu.id}`, deger: "10" },   // 3. satır: 2. ve 3. satır açılır
    { yer: `t:linye:1:${tip.id}`, deger: (tip.secenekler ?? [])[1] ?? "C" }, { yer: `t:linye:1:${tip.id}`, deger: "Z" },
    { yer: `m:${m1.id}`, deger: liste.cevaplar[1].toLocaleUpperCase("tr") }, { yer: `m:${m1.id}#derece`, deger: "ağır" }, { yer: `m:${m1.id}#not`, deger: "Kapak kırık" },
    { yer: "m:olmayan", deger: "Uygun" }, { yer: "t:olmayan:1:x", deger: "1" }, { yer: "x:y", deger: "1" },
  ]);
  assert.equal(u.durum.ekipman.model, "DM-200");
  assert.equal(u.durum.ekipman.imal, "");
  const l = u.durum.cevaplar.tablo.linye;
  assert.deepEqual([l.length, l[0][icu.id], l[1], l[2][icu.id]], [3, "3000", {}, "10"]);
  assert.equal(l[0][tip.id], (tip.secenekler ?? [])[1] ?? "C");
  assert.deepEqual(u.durum.cevaplar.madde[m1.id], { c: liste.cevaplar[1], derece: "agir", not: "Kapak kırık" });
  /* 2026-10-14 (557): yapılamayanlar sonuçta yer kimliği + ad + nedenle (gecersiz artık "ad: neden" — S.A.Y'a okunur ad gider) */
  assert.deepEqual(u.sonuclar.filter((s) => s.durum === "yazilamadi").map((s) => s.yer.split(":")[0]), ["e", "t", "m", "t", "x"], u.gecersiz.join(" | "));
  assert.ok(u.gecersiz.every((g) => /: ./.test(g)), "her yapılamayanın nedeni var");
  assert.ok(u.isaretler.some((i) => i.yer.tur === "hucre" && i.yer.satir === 2) && u.isaretler.every((i) => i.guven === "emin"));
  /* geri al: hepsi önceki hâline (kişi sonradan değiştirmediyse) */
  const g = geriAl(u.durum, u.geri);
  assert.deepEqual([g.durum.ekipman.model, g.durum.cevaplar.tablo.linye, g.durum.cevaplar.madde[m1.id]], ["Elle Model", [{ [icu.id]: "6" }], undefined]);
  /* formüllü sütun ve formatta olmayan sonuç / yorum yazılmaz */
  const f = FormatTanimi.parse({ ...SABLONLAR.ZPKR02.tanim, bolumler: SABLONLAR.ZPKR02.tanim.bolumler.filter((b) => b.blok !== "sonuc" && b.blok !== "not") });
  const v = komutlariUygula(bos(), f, [{ yer: "sonuc", deger: "uygun" }, { yer: "yorum", deger: "x" }]);
  assert.equal(v.gecersiz.length, 2);
  const s = komutlariUygula(bos(), t, [{ yer: "sonuc", deger: "Uygun değil" }]);
  assert.equal(t.bolumler.some((b) => b.blok === "sonuc") ? s.durum.cevaplar.sonuc : "uygun_degil", "uygun_degil");
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
  assert.equal(islemMetni({ istek: "geri", soru: "x", sayi: 3 }), "3 girişi geri aldım.");
  assert.equal(islemMetni({ istek: "ustune", soru: "x", sayi: 2 }), "2 dolu alanı okunan değerle değiştirdim. Kaydetmeyi unutmayın.");
  for (const kotu of [
    { istek: "sil", soru: "x", sayi: 0 }, { istek: "oku", soru: "x", sayi: 0 }, { istek: "geri", soru: "", sayi: 0 }, { istek: "geri", soru: "x".repeat(301), sayi: 0 },
    { istek: "geri", soru: "x", sayi: -1 }, { istek: "geri", soru: "x", sayi: 1, okuma },
    { istek: "maddeler", soru: "x", sayi: 1 }, { istek: "sonuc_uygun", soru: "x", sayi: 1 },   // 550: kalktı (Haiku rapora_yaz ile)
    { istek: "oku", soru: "x", sayi: 0, okuma: { ...okuma, bolumler: [{ ad: "x".repeat(121), alan: 0, satir: 0, belirsiz: 0 }] } },
    { istek: "oku", soru: "x", sayi: 0, okuma: { ...okuma, dolu: Array.from({ length: 61 }, () => "a") } },
    { istek: "oku", soru: "x", sayi: 0, okuma: { ...okuma, neden: "x".repeat(301) } },
  ]) assert.equal(raporGirdisi({ hizli: "islem", rapor: R, islem: kotu }), null, JSON.stringify(kotu));
});

/* 557 (sunum 557 · 2. tur — reisim 2026-10-14: "el ile girebildiğim değerleri say asistan ile giremiyor", "yapıldıysa yapıldı de, yapılamadıysa sebebi
   ile yaz"): S.A.Y elle ne giriliyorsa onu girer, ekranın denetimiyle — sayı kutusuna "-", künye (kilitli olmayan; kayıttakiyle aynısı değişiklik
   değil), kontrol tarihleri, çoklu seçim, uygunluk notu, satır sonucu + gerekçe, satır silme, ölçüm cihazı (ekranda bekler); her girişin sonucu */
test("557 rapora_yaz: elle ne giriliyorsa — sayıya yazı, künye, tarih, çoklu seçim, not, satır sonucu, satır silme, cihaz; her girişin sonucu", () => {
  const t = FormatTanimi.parse({ sema: 1, bolumler: [
    { id: "genel", ad: "Genel", blok: "bilgi", alanlar: [{ id: "kapsam", ad: "Kapsam", tur: "coklu", secenekler: ["Aydınlatma", "Priz", "Motor"] }] },
    { id: "notlu", ad: "Notlu tablo", blok: "olcum", sutunlar: [{ id: "in", ad: "In", giris: "sayi" }], notlar: [{ metin: "Uygun", kusur: false }, { metin: "Yetersiz", kusur: true }] },
    { id: "linye", ad: "Linye", blok: "olcum", sutunlar: [{ id: "icu", ad: "Icu", giris: "sayi" }, { id: "devre", ad: "Devre", giris: "metin" }] },
  ] });
  const d: Durum = { ekipman: {}, cevaplar: { ...Cevaplar.parse({}), tablo: { linye: [{ icu: "6" }, { icu: "10" }, { icu: "16" }], notlu: [{ in: "16" }] } },
    tarih: { bas: "2026-10-14T09:00", bit: "", sonraki: "2027-10-14", takip: "", rapor: "2026-10-14" } };
  const u = komutlariUygula(d, t, [
    { yer: "t:linye:1:icu", deger: "-" }, { yer: "t:linye:2:icu", deger: "1.5" }, { yer: "t:linye:3:icu", deger: "16" },   // sayıya yazı · ondalık · aynı
    { yer: "t:linye:1:devre", deger: "x".repeat(121) },                                                                     // ekrandaki sınırdan uzun
    { yer: "k:firma", deger: "Yeni Unvan" }, { yer: "k:sgk", deger: "123" }, { yer: "k:adres", deger: "Kayıttaki adres" },
    { yer: "tarih:bit", deger: "14.10.2026 11:30" }, { yer: "tarih:takip", deger: "31.02.2027" }, { yer: "tarih:sonraki", deger: "15.10.2027" },
    { yer: "a:kapsam", deger: "priz, Aydınlatma" }, { yer: "a:kapsam", deger: "Priz, Pompa" },
    { yer: "t:notlu:1:not", deger: "Not-2" }, { yer: "t:notlu:1:sonuc", deger: "uygun" },
    { yer: "t:linye:1:sonuc", deger: "uygun değil" }, { yer: "t:linye:1:gerekce", deger: "Yerinde ölçüldü, değer düşük." },
    { yer: "t:linye:2", deger: "sil" }, { yer: "t:linye:9", deger: "sil" },
    { yer: "cihaz:tur1", deger: "C-01" }, { yer: "cihaz:tur1", deger: "YOK-9" },
  ], { kunyeKilit: new Set(["sgk"] as const), kunyeKayit: { adres: "Kayıttaki adres" },
    cihazlar: [{ turId: "tur1", turAd: "Topraklama ölçer", secili: null, secenekler: [{ id: "c1", kod: "C-01", ad: "Marka M" }] }] });
  const s = (yer: string) => u.sonuclar.filter((x) => x.yer === yer).map((x) => `${x.durum}${x.neden ? `: ${x.neden}` : ""}`);
  /* tablo: 2. satır silindi — 1. satır "-", eski 3. satır 2. oldu */
  assert.deepEqual(u.durum.cevaplar.tablo.linye.map((r) => r.icu), ["-", "16"]);
  assert.deepEqual(s("t:linye:2:icu"), ["yazildi"], "1.5 yazıldı (sonra satır silindi)");
  assert.deepEqual(s("t:linye:3:icu"), ["ayni"]);
  assert.match(s("t:linye:1:devre")[0], /^yazilamadi: bu kutuya en çok 120 karakter/);
  assert.equal(u.durum.cevaplar.kunye.firma, "Yeni Unvan");
  assert.match(s("k:sgk")[0], /kilitli; elle de değiştirilemiyor/);
  assert.equal("adres" in u.durum.cevaplar.kunye, false, "kayıttakiyle aynısı değişiklik değil");
  assert.equal(u.durum.tarih?.bit, "2026-10-14T11:30");
  assert.equal(u.durum.tarih?.sonraki, "2027-10-15");
  assert.match(s("tarih:takip")[0], /^yazilamadi: tarih GG\.AA\.YYYY/);
  assert.deepEqual(u.durum.cevaplar.alan.kapsam, ["Aydınlatma", "Priz"], "seçeneklerin sırası, büyük / küçük harf seçenekten");
  assert.match(s("a:kapsam")[1], /Pompa seçeneklerde yok/);
  assert.equal(u.durum.cevaplar.tablo.notlu[0].not, "2");
  assert.match(s("t:notlu:1:sonuc")[0], /uygunluk notundan çıkar/);
  assert.deepEqual([u.durum.cevaplar.tablo.linye[0][ELLE_SONUC], u.durum.cevaplar.tablo.linye[0][ELLE_GEREKCE]], ["uygun_degil", "Yerinde ölçüldü, değer düşük."]);
  assert.deepEqual(s("t:linye:9"), ["yazilamadi: tabloda bu satır yok"]);
  assert.deepEqual(u.cihaz, [{ yer: "cihaz:tur1", ad: "Ölçüm cihazı · Topraklama ölçer", turId: "tur1", cihazId: "c1" }]);
  assert.deepEqual(s("cihaz:tur1")[0], "bekliyor");
  assert.match(s("cihaz:tur1")[1], /zimmetinizde böyle bir cihaz yok \(seçilebilir: C-01\)/);
  const o = sonucOzeti(u.sonuclar);
  assert.equal(o.yazilamadi.length, u.sonuclar.filter((x) => x.durum === "yazilamadi").length);
  assert.ok(o.yazilamadi.every((x) => x.ad && x.neden), "her yapılamayanın adı ve nedeni");
  /* "kurala göre": elle sonuç ve gerekçe birlikte kalkar */
  const k = komutlariUygula(u.durum, t, [{ yer: "t:linye:1:sonuc", deger: "kurala göre" }]);
  assert.deepEqual([k.durum.cevaplar.tablo.linye[0][ELLE_SONUC], k.durum.cevaplar.tablo.linye[0][ELLE_GEREKCE]], [undefined, undefined]);
  /* geri al: tablo, künye, tarih önceki hâline */
  const g = geriAl(u.durum, u.geri);
  assert.deepEqual(g.durum.cevaplar.tablo.linye.map((r) => r.icu), ["6", "10", "16"]);
  assert.equal(g.durum.cevaplar.kunye.firma, undefined);
  assert.equal(g.durum.tarih?.bit, "");
});

/* 2026-10-15 (C — pkproje §9 "S.A.Y CLAUDE GİBİ"; reisim "yap işte yap dedim"; "aynı tabloya 50 satır ekle" 17 satırda kalıyordu): satir_ekle — tek
   komutla N satır: her satıra aynı değerler, artan sıra sütunu (başlangıç verilmezse sütundaki son sayıdan, önekiyle), her hücre elle yazılır gibi
   denetlenir (uymayan değer boş kalır, nedeni sütun başına bir kez), girisler önce; bütün iş tablonun tek geri alması; bilinmeyen tablo ve sınır
   dışı satır sayısı nedeniyle. (B) eski 300 giriş / 100 satır ileri sınırı kalktı (5 000 — yalnız bozuk girişe karşı). Olumsuz kanıt:
   tests/bozan/say-dongu.bozan.ts (satır sayısı yok sayılırsa, tablo sınırı denetimi kalkarsa).
   2026-10-16 (S.A.Y 1. adım incelemesi — kasıtlı beklenti değişikliği: eskisi 700 satırlık tabloyu "başarı" sayıyordu, ama raporun kendi şeması
   (Cevaplar.tablo) en çok 300 satır kabul ediyor — böyle bir rapor kaydedilemez, S.A.Y'ın haritası da kurulamazdı): tablonun satırı raporun
   sınırında (TABLO_SATIR_EN_COK); sınırı aşan satir_ekle kalemi nedeniyle "yazılamadı" (yarım yazılmaz), sınırın ötesindeki hücre nedeniyle; sonuç
   her zaman Cevaplar şemasından geçer; toplu Geri al tablo için geri dönen hücreleri sayar */
test("C satir_ekle: 50 satır tek komutla — sıra sütunu, değerler denetimli, girisler önce, geri al; B: büyük giriş", () => {
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const d: Durum = { ...bos(), cevaplar: { ...Cevaplar.parse({}), tablo: { linye: [{ no: "F1" }, { no: "F2", devre: "Elle" }] } } };
  const u = komutlariUygula(d, t, [{ yer: "t:linye:1:devre", deger: "Aydınlatma" }], {},
    [{ tablo: "linye", adet: 50, degerler: { tip: "c", akim: "16", devre: "x".repeat(200), bilinmeyen: "1" }, sira: { sutun: "no" } }]);
  const l = u.durum.cevaplar.tablo.linye;
  assert.equal(l.length, 52);
  assert.equal(u.satir, 50);
  assert.deepEqual([l[2].no, l[3].no, l[51].no], ["F3", "F4", "F52"], "son sayıdan önekiyle devam");
  assert.ok(l.slice(2).every((s) => s.tip === "C" && s.akim === "16" && !("devre" in s)), "her satıra aynı (seçenek seçenekten); uymayan boş kalır");
  assert.equal(l[0].devre, "Aydınlatma", "girisler önce");
  const s = u.sonuclar.filter((x) => x.yer === "satir_ekle:linye");
  assert.deepEqual(s.filter((x) => x.durum === "yazildi").map((x) => x.ad), ["Pano sigortaları (linye) · 50 satır eklendi (3–52. satır)"]);
  const red = s.filter((x) => x.durum === "yazilamadi").map((x) => `${x.ad}: ${x.neden}`);
  assert.equal(red.length, 2, `sütun başına bir kez: ${red.join(" | ")}`);
  assert.ok(red.some((x) => /Devre \(50 satır\): bu kutuya en çok 120 karakter/.test(x)) && red.some((x) => /bilinmeyen \(50 satır\): tabloda böyle bir sütun yok/.test(x)), red.join(" | "));
  assert.equal(u.isaretler.filter((i) => i.yer.tur === "hucre" && i.yer.satir >= 2).length, 150, "eklenen hücreler işaretli (no, tip, In)");
  /* geri al: tablo önceki hâline (tek iş) */
  assert.deepEqual(geriAl(u.durum, u.geri).durum.cevaplar.tablo.linye, [{ no: "F1" }, { no: "F2", devre: "Elle" }]);
  /* boş tablo 1'den; başlangıç, artış, önek verilirse onlar; iki kalem sırayla */
  const b = komutlariUygula(bos(), t, [], {}, [{ tablo: "linye", adet: 3, degerler: {}, sira: { sutun: "no" } },
    { tablo: "linye", adet: 2, degerler: {}, sira: { sutun: "no", baslangic: 10, artis: 5, onek: "S" } }]);
  assert.deepEqual(b.durum.cevaplar.tablo.linye.map((x) => x.no), ["1", "2", "3", "S10", "S15"]);
  assert.equal(b.satir, 5);
  /* değersiz satır da eklenir (elle "Satır ekle" gibi) */
  assert.equal(komutlariUygula(bos(), t, [], {}, [{ tablo: "linye", adet: 4, degerler: {} }]).durum.cevaplar.tablo.linye.length, 4);
  /* bilinmeyen tablo, sınır dışı satır sayısı: nedeniyle, satır yok */
  const k = komutlariUygula(bos(), t, [], {}, [{ tablo: "yok", adet: 5, degerler: {} }, { tablo: "linye", adet: 0, degerler: {} },
    { tablo: "linye", adet: SATIR_EKLE_EN_COK + 1, degerler: {} }]);
  assert.deepEqual(k.sonuclar.map((x) => x.durum), ["yazilamadi", "yazilamadi", "yazilamadi"]);
  assert.ok(k.sonuclar.every((x) => x.neden), "her biri nedenli");
  assert.equal(k.satir, 0);
  /* B: 300'ün üstünde giriş (eskiden atılıyordu) ve 100 satırdan ileri yeni satır (eskiden "satır çok ileride") — raporun tablo sınırının içinde */
  const N = TABLO_SATIR_EN_COK;
  const cok = [...Array.from({ length: N }, (_, i) => ({ yer: `t:linye:${i + 1}:akim`, deger: String(i + 1) })),
    ...Array.from({ length: N }, (_, i) => ({ yer: `t:linye:${i + 1}:tip`, deger: "c" })), ...Array.from({ length: 100 }, (_, i) => ({ yer: `t:linye:${i + 1}:devre`, deger: "D" }))];
  assert.ok(cok.length > 300 && cok.length <= GIRIS_EN_COK);
  const c = komutlariUygula(bos(), t, cok);
  assert.equal(c.durum.cevaplar.tablo.linye.length, N);
  assert.equal(c.sonuclar.filter((x) => x.durum === "yazildi").length, cok.length);
  assert.equal(c.satir, N);
  assert.ok(Cevaplar.safeParse(c.durum.cevaplar).success, "rapor kaydedilebilir (şemadan geçer)");
  assert.equal(geriAl(c.durum, c.geri).sayi, cok.length, "toplu Geri al geri dönen hücreleri sayar (tablo tek giriş değil)");
  assert.equal(komutlariUygula(bos(), t, [{ yer: "t:linye:250:akim", deger: "1" }]).durum.cevaplar.tablo.linye.length, 250);
  assert.ok(GIRIS_EN_COK >= 5_000);
  /* 2026-10-16: raporun tablo sınırı — sınırın ötesindeki hücre nedeniyle; sınırı aşan satir_ekle yazılmaz (yarım tablo yok), nedeninde kalan yer */
  const s301 = komutlariUygula(bos(), t, [{ yer: `t:linye:${N + 1}:akim`, deger: "1" }]);
  assert.deepEqual([s301.sonuclar[0].durum, s301.durum.cevaplar.tablo.linye], ["yazilamadi", undefined]);
  assert.match(s301.sonuclar[0].neden ?? "", new RegExp(`en çok ${N} satır`));
  const dolu: Durum = { ...bos(), cevaplar: { ...Cevaplar.parse({}), tablo: { linye: Array.from({ length: N - 10 }, (_, i) => ({ no: String(i + 1) })) } } };
  const asan = komutlariUygula(dolu, t, [], {}, [{ tablo: "linye", adet: 11, degerler: {}, sira: { sutun: "no" } }]);
  assert.equal(asan.durum.cevaplar.tablo.linye.length, N - 10, "yarım yazılmadı");
  assert.deepEqual([asan.satir, asan.sonuclar.map((x) => x.durum)], [0, ["yazilamadi"]]);
  assert.match(asan.sonuclar[0].neden ?? "", /en çok 10 satır daha eklenebilir/);
  const sigan = komutlariUygula(dolu, t, [], {}, [{ tablo: "linye", adet: 10, degerler: {}, sira: { sutun: "no" } }]);
  assert.deepEqual([sigan.durum.cevaplar.tablo.linye.length, sigan.durum.cevaplar.tablo.linye.at(-1)?.no, sigan.satir], [N, String(N), 10]);
  assert.ok(Cevaplar.safeParse(sigan.durum.cevaplar).success);
  assert.equal(geriAl(sigan.durum, sigan.geri).sayi, 10, "10 eklenen satır (her biri No) — 10 giriş");
});
