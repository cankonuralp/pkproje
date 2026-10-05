/* NEREDEN GELDİ: pkproje §4.2 (PDF iskeleti: Ek-III bölümleri + fotoğraf eki, başlıkta firma künyesi), §3.8-2 (sonuç cümlesi yalnız seçilen
   sonuçla biter), karar 105 (onaylayan yalnız imza bölümünde "teknik" yeri varsa), RAPOR-FORMAT §1 ve §9-2 (belge formatın tanımından çizilir;
   önizleme = PDF), maket maket-belge.js (MB.belge, resmiBas). Saf çizici (src/belge/belge.ts) — veritabanı yok. Kaçış: React (ham HTML yok);
   kullanıcının yazdığı her değer metin olarak basılır (reisim 2026-10-04: "sızma, veri çalma"). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import type { BelgeVerisi } from "../src/belge/veri.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar } from "../src/format/tanim.ts";

const KOMP = SABLONLAR.KOMPRESOR.tanim;
const MADDELER = KOMP.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler) : []));
const PNG = "data:image/png;base64,iVBORw0KGgo=";
function veri(d: Partial<BelgeVerisi> = {}): BelgeVerisi {
  return {
    firma: { ad: "Deneme Muayene A.Ş.", kod: "DA", nusha: 2 }, no: "DA-1026-001-abcde", revizyon: 0, formatSira: 3, durum: "onayda",
    tur: { ad: "Hava tankı", kod: "HT", kontrolStd: ["TS EN 13445"] },
    kunye: { firmaAdi: "Deneme Sanayi A.Ş.", adres: "Deneme Cad. 1", sgk: null, isgNo: "ISG-1" },
    tarih: { bas: "2026-10-05T09:00", bit: "2026-10-05T10:30", sonraki: "2027-10-05", takip: null, rapor: "2026-10-05" },
    ekipman: { kod: "HT-1", marka: "Deneme Marka", model: "K-100", seri: "S-1", imal: "2015", konum: "Kazan dairesi", amac: null, bolum: "Üretim" },
    tanim: KOMP,
    cevaplar: Cevaplar.parse({
      alan: { marka: "Deneme K-100", imal: "2015", calisma: "10" },
      madde: Object.fromEntries(MADDELER.map((m, i) => [m.id, i === 0 ? { c: "Uygun değil", not: "Korozyon var" } : { c: "Uygun" }])),
      deger: { hidro: "17", ventil: "10" }, sonuc: "uygun_degil", yorum: "Deneme yorumu",
    }),
    cihazlar: [{ turAd: "Manometre", kod: "MN-01", marka: "Deneme", model: "M1", seri: "S-001", kalTarih: "2026-01-02", kalBitis: "2027-01-02", sertifika: "K-1" }],
    fotolar: [{ ad: "on.jpg", bolum: "foto", madde: null, src: PNG }, { ad: "korozyon.jpg", bolum: "kriter", madde: MADDELER[0].id, src: null }],
    sonuc: "uygun_degil",
    yazan: { ad: "Deneme Bir", meslek: "mak-muh", ekipnet: "123", diploma: "D-1", oda: null },
    onay: { ad: "Deneme Mekanik", zaman: "2026-10-05T08:00:00.000Z" }, imza: null,
    ...d,
  };
}
const ciz = (d: Partial<BelgeVerisi> = {}) => renderToStaticMarkup(raporBelgesi(veri(d)) as never);
const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("belge: başlık tablosu, bölümler formatın sırasıyla numaralı (1 Firma, 2 Ekipman, sonra format), değerler raporun kendisinden", () => {
  const m = metin(ciz());
  for (const x of ["Deneme Muayene A.Ş.", "Kompresör Periyodik Kontrol Raporu", "Doküman Kodu", "DA-FR-HT-3",
    "Rapor No : DA-1026-001-abcde", "1. Firma bilgileri", "2. Ekipman bilgileri", "Deneme Sanayi A.Ş.", "Deneme Cad. 1", "05.10.2026 09:00", "05.10.2027",
    "TS EN 13445", "HT-1", "Hava tankı", "Deneme K-100", "MN-01 / S-001", "02.01.2027", "K-1", "17 bar", "Deneme yorumu"]) {
    assert.ok(m.includes(x), `belgede yok: ${x}`);
  }
  /* format bölümleri saha ekranıyla aynı sırada numaralı */
  const adlar = [...m.matchAll(/(\d+)\. ([A-ZÇĞİÖŞÜa-zçğıöşü ]+?)(?= )/g)].map((x) => Number(x[1]));
  assert.deepEqual(adlar.slice(0, 3), [1, 2, 3]);
  assert.ok(!m.includes("SGK sicil numarası -"), "SGK boşsa Yok");
  assert.ok(m.includes("SGK sicil numarası Yok"));
});

test("belge: kusur açıklamaları motordan (madde + açıklama + fotoğraf adı); sonuç cümlesi yalnız seçilen sonuçla; nüsha yazıyla; imzasız şeridi", () => {
  const m = metin(ciz());
  assert.ok(m.includes(`* ${MADDELER[0].metin}: Korozyon var (Fotoğraf: korozyon.jpg)`), "kusur satırı");
  assert.match(m, /uygun değildir \./, "seçilen sonuç");
  assert.ok(!m.includes("uygundur / uygun değildir"), "iki seçenek birden yazılmaz (§3.8-2)");
  assert.ok(m.includes("Bu rapor iki (2) nüsha olarak hazırlanmıştır."));
  assert.ok(m.includes("İmzasız önizleme"));
  const u = metin(ciz({ sonuc: "uygun", cevaplar: Cevaplar.parse({ madde: Object.fromEntries(MADDELER.map((x) => [x.id, { c: "Uygun" }])), sonuc: "uygun" }) }));
  assert.ok(u.includes("Kusur yok."));
  assert.ok(/uygundur \./.test(u) && !u.includes("uygun değildir"));
  const imzali = metin(ciz({ imza: { zaman: "2026-10-05T12:00:00.000Z", yontem: "imzalı PDF" } }));
  assert.ok(!imzali.includes("İmzasız önizleme") && imzali.includes("Güvenli elektronik imza (imzalı PDF) · 05.10.2026 15:00"));
});

test("belge: onaylayan teknik yönetici yalnız imza bölümünde teknik yeri varsa (karar 105); imza bölümü yoksa Yetkili kişi sonda", () => {
  assert.ok(metin(ciz()).includes("Onaylayan teknik yönetici Deneme Mekanik"));
  const tanim = { ...KOMP, bolumler: KOMP.bolumler.map((b) => (b.blok === "imza" ? { ...b, imzalar: ["uzman" as const] } : b)) };
  assert.ok(!metin(ciz({ tanim })).includes("Deneme Mekanik"));
  const imzasiz = { ...KOMP, bolumler: KOMP.bolumler.filter((b) => b.blok !== "imza") };
  const m = metin(ciz({ tanim: imzasiz }));
  assert.match(m, /\d+\. Yetkili kişi Adı soyadı Deneme Bir/);
});

test("belge: fotoğraflar gömülü (veri adresi), madde fotoğrafı ekte madde adıyla; dış adres yok", () => {
  const html = ciz();
  assert.ok(html.includes(`src="${PNG}"`));
  assert.ok(metin(html).includes(`Ek. Kontrol maddelerinin fotoğrafları`));
  assert.ok(metin(html).includes(`korozyon.jpg · ${MADDELER[0].metin}`));
  assert.equal(/src="(?!data:)/.test(html), false, "yalnız veri adresi");
});

test("belge: kullanıcının yazdığı değerler kaçışlı — betik, olay özniteliği ve sahte etiket metin olarak basılır", () => {
  const kotu = `<script>alert(1)</script><img src=x onerror=alert(2)>`;
  const html = ciz({
    kunye: { firmaAdi: kotu, adres: kotu, sgk: kotu, isgNo: kotu },
    cevaplar: Cevaplar.parse({ alan: { marka: kotu }, madde: { [MADDELER[0].id]: { c: "Uygun değil", not: kotu } }, yorum: kotu, sonuc: "uygun_degil" }),
    fotolar: [{ ad: kotu, bolum: "foto", madde: null, src: null }],
  });
  assert.equal(html.includes("<script"), false);
  assert.equal(/<img[^>]*onerror/i.test(html), false);
  assert.ok(html.includes("&lt;script&gt;"));
});

test("belge: Bakanlık şablonları (ZPKR01, ZPKR02) boş raporla çizilir — form kodu ve başlık formatın, ölçüm tablosu ve uygunluk notları", () => {
  for (const k of ["ZPKR01", "ZPKR02"] as const) {
    const t = SABLONLAR[k].tanim;
    const m = metin(ciz({ tanim: t, cevaplar: Cevaplar.parse({}), sonuc: null, fotolar: [], cihazlar: [] }));
    assert.ok(m.includes(`Doküman Kodu : ${k}`), k);
    assert.ok(m.includes(t.gorunum.baslik), k);
    for (const b of t.bolumler.filter((x) => x.blok !== "bilgi")) assert.ok(m.includes(b.ad), `${k}: ${b.ad}`);
    if (k === "ZPKR01") assert.ok(m.includes("Not-1: Uygun."), "uygunluk notları");
  }
});
