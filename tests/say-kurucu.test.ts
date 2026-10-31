/* NEREDEN GELDİ: 553 — S.A.Y format yapıcıda (reisim 2026-10-14: "elektrikte hesaplamalarda olsun bu vb hesaplamalar için format yapıcıda formül kısmı
   olsun mesela (RCa=480/RCd) … konuşarak ilgili formatı yapabiliyo olalım"). Saf (src/modules/rapor-format/say-kurucu.ts):
   · harita: bölümler (kimlik, tür, ad), öğeler (kimlik, ad, tür, birim, formül, sınır), kontrol listesinin grupları ve maddeleri;
   · işlemler: bölüm ekle (sonuç / not / imzadan önce ya da verilen bölümün ardına), aynı istekte ADIYLA öğe ekle, formül köşeli parantezli biçime,
     sınır; öğe değiştir / çıkar (kimlikle ya da adıyla); madde ve grup; bölüm adı / sil (ölçüm cihazları bölümü çıkmaz); yapılamayan nedeniyle;
     girdi bozulmaz (yeni nesne). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { formulUygula } from "../src/format/formul.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";

const T = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);

test("harita: bölüm ve öğe kimlikleri, türler, birim, formül, sınır; liste grupları ve maddeleri", () => {
  const h = formatHaritasi(T());
  assert.match(h, /^## linye · ölçüm tablosu · Pano sigortaları \(linye\)/m);
  assert.match(h, /^- icu · Icu · sütun, sayı \(kA\)$/m);
  assert.match(h, /^  cevaplar: Uygun \/ Uygun değil \/ Uygulanamaz$/m);
  assert.match(h, /^- g1_1 · Kablo şebeke tarafı$/m);
});

test("işlemler: \"RC ölçümü\" tablosu, RCd ve RCa = 480 / RCd (adıyla, aynı istekte); sınır; hesap çalışır", () => {
  const t0 = T(), once = JSON.stringify(t0);
  const r = formatIslemleri(t0, [
    { islem: "bolum_ekle", tur: "olcum", ad: "RC ölçümü", sonra: "linye" },
    { islem: "oge_ekle", bolum: "RC ölçümü", ad: "RCd", tur: "sayi", birim: "Ω" },
    { islem: "oge_ekle", bolum: "rc ölçümü", ad: "RCa", formul: "RCa = 480/RCd", op: "<=", sinir: "50" },
  ]);
  assert.deepEqual(r.gecersiz, []);
  assert.equal(JSON.stringify(t0), once, "girdi değişmedi");
  const i = r.t.bolumler.findIndex((b) => b.ad === "RC ölçümü");
  assert.equal(r.t.bolumler[i - 1].id, "linye", "verilen bölümün ardına");
  const b = r.t.bolumler[i] as BolumOf<"olcum">;
  assert.deepEqual(b.sutunlar.map((s) => [s.ad, s.giris, s.birim ?? null, s.formul ?? null, s.op ?? null, s.sinir ?? null]),
    [["RCd", "sayi", "Ω", null, null, null], ["RCa", "sayi", null, "480 ÷ [RCd]", "<=", 50]]);
  assert.ok(r.yapilan.some((x) => x.includes("RCa (formül 480 ÷ [RCd])")));
  const u = formulUygula(r.t, Cevaplar.parse({ tablo: { [b.id]: [{ [b.sutunlar[0].id]: "4" }] } }));
  assert.equal(u.tablo[b.id][0][b.sutunlar[1].id], "120");
});

test("işlemler: öğe değiştir / çıkar (adıyla), madde, grup, bölüm adı; yer verilmezse sonuçtan önce; yapılamayanlar nedeniyle", () => {
  const r = formatIslemleri(T(), [
    { islem: "oge_degistir", bolum: "linye", oge: "Icu", birim: "A", formul: "Ib × 2" },
    { islem: "oge_sil", bolum: "linye", oge: "td" },
    { islem: "oge_ekle", bolum: "Gözle kontrol", ad: "Pano etiketi okunaklı" },
    { islem: "grup_ekle", bolum: "Gözle kontrol", ad: "Ek kontroller" },
    { islem: "oge_ekle", bolum: "Gözle kontrol", grup: "Ek kontroller", ad: "Kapak menteşesi" },
    { islem: "bolum_adi", bolum: "linye", ad: "Pano sigortaları" },
    { islem: "bolum_ekle", tur: "test", ad: "Ek ölçümler" },
    { islem: "bolum_sil", bolum: "cihaz" }, { islem: "bolum_ekle", tur: "imza" }, { islem: "oge_sil", bolum: "linye", oge: "yok" },
    { islem: "oge_ekle", bolum: "yok", ad: "x" }, { islem: "ucur", bolum: "linye" },
  ]);
  const linye = r.t.bolumler.find((b) => b.id === "linye") as BolumOf<"olcum">;
  assert.equal(linye.ad, "Pano sigortaları");
  assert.deepEqual([linye.sutunlar.find((s) => s.id === "icu")?.birim, linye.sutunlar.find((s) => s.id === "icu")?.formul], ["A", "[Ib] × 2"]);
  assert.ok(!linye.sutunlar.some((s) => s.id === "td"));
  const liste = r.t.bolumler.find((b) => b.blok === "liste") as BolumOf<"liste">;
  assert.ok(liste.gruplar.at(-2)!.maddeler.some((m) => m.metin === "Pano etiketi okunaklı"));
  assert.deepEqual([liste.gruplar.at(-1)!.ad, liste.gruplar.at(-1)!.maddeler.map((m) => m.metin)], ["Ek kontroller", ["Kapak menteşesi"]]);
  const ek = r.t.bolumler.findIndex((b) => b.ad === "Ek ölçümler"), sonuc = r.t.bolumler.findIndex((b) => b.blok === "sonuc" || b.blok === "not" || b.blok === "imza");
  assert.ok(ek >= 0 && ek < sonuc, "sonuç / not / imzadan önce");
  assert.ok(r.t.bolumler.some((b) => b.blok === "cihaz"), "ölçüm cihazları bölümü çıkmadı");
  assert.equal(r.gecersiz.length, 5, r.gecersiz.join(" | "));
});

/* 2026-10-31 (S.A.Y belge formatları — reisim: "önerdiklerini kabul ediyorum"): serbest tablo hücre hücre — haritada [satır,sütun] ve içerik; "tablo" işlemi
   kâğıttaki tuşlarla aynı işlevlerle (tablo.ts): hücre yaz (yazı, elle doldurulan yer — kimlik yeni ve tekil —, kayıt), satır / sütun ekle-sil, birleştir /
   ayır; geçersiz istek nedeniyle, girdi bozulmaz. Olumsuz kanıt: bozan say-kurucu-tablo. */
test("serbest tablo: harita hücreleri gösterir; hücre yaz, satır / sütun, birleştir / ayır", () => {
  const t0 = FormatTanimi.parse({ sema: 1, gorunum: { serbest: true }, bolumler: [] });
  const r = formatIslemleri(t0, [
    { islem: "bolum_ekle", tur: "tablo", ad: "Sözleşme" },
    { islem: "tablo", bolum: "Sözleşme", eylem: "hucre", r: 0, c: 0, hucre: { tur: "yazi", yazi: "Müşteri yetkilisi" } },
    { islem: "tablo", bolum: "Sözleşme", eylem: "hucre", r: 0, c: 1, hucre: { tur: "alan", deger: "metin", zorunlu: true } },
    { islem: "tablo", bolum: "Sözleşme", eylem: "hucre", r: 1, c: 1, hucre: { tur: "alan", deger: "secim", secenekler: ["Havale", "Nakit"] } },
    { islem: "tablo", bolum: "Sözleşme", eylem: "hucre", r: 2, c: 0, hucre: { tur: "kayit", veri: "musteri_unvan" } },
    { islem: "tablo", bolum: "Sözleşme", eylem: "birlestir", r: 2, c: 2, r2: 2, c2: 3 },
    { islem: "tablo", bolum: "Sözleşme", eylem: "satir_ekle" },
    { islem: "tablo", bolum: "Sözleşme", eylem: "sutun_sil", c: 3 },
  ]);
  assert.deepEqual(r.gecersiz, []);
  assert.equal(r.yapilan.length, 8);
  const b = r.t.bolumler[0] as BolumOf<"tablo">;
  assert.equal(b.satirlar.length, 4);
  assert.equal(b.sutun.length, 3);
  const h = (rr: number, cc: number) => b.hucreler.find((x) => x.r === rr && x.c === cc)!;
  assert.equal(h(0, 0).m, "Müşteri yetkilisi");
  assert.ok(h(0, 1).tur === "alan" && h(0, 1).zorunlu && /^k_h\d+$/.test(h(0, 1).id!));
  assert.notEqual(h(0, 1).id, h(1, 1).id, "kimlik tekil");
  assert.equal(h(2, 0).veri, "musteri_unvan");
  assert.equal(h(2, 2).cs, undefined, "birleşik hücrenin sütunu silinince kapsam daralır");
  const m = formatHaritasi(r.t);
  assert.match(m, /^- \[0,0\] · yazı “Müşteri yetkilisi”$/m);
  assert.match(m, /^- \[1,1\] · elle doldurulan \(secim: Havale \/ Nakit\)$/m);
  assert.match(m, /^- \[2,0\] · kayıttan: musteri_unvan$/m);
  const k = formatIslemleri(r.t, [
    { islem: "tablo", bolum: "Sözleşme", eylem: "hucre", r: 9, c: 0, hucre: { tur: "yazi" } },
    { islem: "tablo", bolum: "Sözleşme", eylem: "hucre", r: 0, c: 0, hucre: { tur: "alan", deger: "secim" } },
    { islem: "tablo", bolum: "Sözleşme", eylem: "uçur", r: 0, c: 0 },
  ]);
  assert.equal(k.gecersiz.length, 3);
  assert.match(k.gecersiz.join(" "), /tabloda yok.*seçenekleri.*eylem şunlardan/);
  assert.equal(JSON.stringify(k.t), JSON.stringify(r.t), "geçersiz istek tabloyu değiştirmez");
});
