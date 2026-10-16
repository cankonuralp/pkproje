/* NEREDEN GELDİ: sunum 595 madde 6, 7 (reisim 2026-10-16: "satır sütun ekleyemiyorum"): test bölümü 4 sütun, kontrol listesi 3 sütun sabitti.
   Saf (veritabanısız): kontrol listesine açıklama / standart maddesi / fotoğraf / serbest yazı sütunu, test bölümüne yazı / sayı / seçim sütunu
   (en çok 4; adı, sırası, çıkar; son çıkınca liste kalkar — eski format aynı), sahada yazılan Cevaplar.ek'te (eski rapor boş ek ile okunur),
   belgede sütunlar değerleriyle, Bakanlık uyarısı, S.A.Y'ın format işlemi ve rapora yazması (x:<öğe>:<sütun>). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, ekAnahtari, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { ekSutunEkle, ekSutunSil, ekSutunTasi, ekSutunYaz, eksikEkSutunlar } from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";
import { ilkCevaplar } from "../src/modules/raporlar/ornek.ts";
import { komutlariUygula } from "../src/modules/raporlar/say-doldur.ts";
import { raporHaritasi } from "../src/modules/say/rapor-haritasi.ts";
import { parcaKopyasi } from "../src/modules/rapor-format/yapboz.ts";

const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const yer = (t: FormatTanimi, blok: string) => t.bolumler.findIndex((b) => b.blok === blok);
const gecerli = (t: FormatTanimi) => FormatTanimi.parse(JSON.parse(JSON.stringify(t)));
const html = (t: FormatTanimi, c: Cevaplar, fotolar: { ad: string; bolum: string; madde: string | null; src: null }[] = []) =>
  renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t, cevaplar: c, fotolar }) as never);
const basliklar = (h: string, ilk: string) => {
  const tablo = h.split("<table>").find((x) => x.includes(`>${ilk}</th>`));
  return tablo ? [...tablo.split("</thead>")[0].matchAll(/<th class="rb-ab">([^<]*)<\/th>/g)].map((m) => m[1]) : [];
};

test("kontrol listesi: açıklama / standart / fotoğraf tek, serbest yazı çok; en çok 4; taşı, adı; son çıkınca tanım eskisi", () => {
  const t = Z2(), l = yer(t, "liste");
  let y = t;
  for (const a of ["aciklama", "std", "yazi"] as const) y = ekSutunEkle(y, l, a).t;
  assert.equal(ekSutunEkle(y, l, "aciklama").id, null, "açıklama iki kez olmaz");
  const e = ekSutunEkle(y, l, "yazi", "İkinci not");
  assert.ok(e.id);
  y = gecerli(e.t);
  assert.deepEqual(eksikEkSutunlar(y.bolumler[l]), [], "4 sütun dolu");
  y = ekSutunTasi(y, l, e.id!, -1);
  y = ekSutunYaz(y, l, e.id!, { ad: "Gözlem" });
  assert.deepEqual((y.bolumler[l] as BolumOf<"liste">).ekSutunlar!.map((s) => s.ad), ["Açıklama", "Standart maddesi", "Gözlem", "Not"]);
  for (const s of (y.bolumler[l] as BolumOf<"liste">).ekSutunlar!) y = ekSutunSil(y, l, s.id);
  assert.equal(JSON.stringify(y), JSON.stringify(t));
});

test("test bölümü: seçim sütunu Var / Yok ile başlar, seçenekleri yazılır; yazı ve sayı", () => {
  const t = Z2(), d = yer(t, "test");
  assert.ok(d >= 0, "ZPKR02'de test bölümü");
  const e = ekSutunEkle(t, d, "secim", "Durum");
  assert.deepEqual((e.t.bolumler[d] as BolumOf<"test">).ekSutunlar![0].secenekler, ["Var", "Yok"]);
  const y = gecerli(ekSutunYaz(e.t, d, e.id!, { secenekler: [" Açık ", "Kapalı", "", "Açık"] }));
  assert.deepEqual((y.bolumler[d] as BolumOf<"test">).ekSutunlar![0].secenekler, ["Açık", "Kapalı"]);
  assert.deepEqual(eksikEkSutunlar(y.bolumler[d]), ["yazi", "sayi", "secim"]);
});

test("belge: kontrol listesinin ve test bölümünün ek sütunları değerleriyle; eski rapor (ek yok) okunur", () => {
  assert.deepEqual(Cevaplar.parse({}).ek, {});
  const t = Z2(), l = yer(t, "liste"), d = yer(t, "test");
  let y = ekSutunEkle(t, l, "aciklama").t;
  const yaziId = ekSutunEkle(y, l, "yazi", "Gözlem");
  y = ekSutunEkle(yaziId.t, l, "foto").t;
  const ts = ekSutunEkle(y, d, "yazi", "Açıklama notu");
  y = gecerli(ts.t);
  const lb = y.bolumler[l] as BolumOf<"liste">, m = lb.gruplar[0].maddeler[0], tb = y.bolumler[d] as BolumOf<"test">, dg = tb.degerler[0];
  const c0 = ilkCevaplar(y);
  const c = Cevaplar.parse({ ...c0, madde: { ...c0.madde, [m.id]: { c: lb.cevaplar[0], not: "Etiket soluk" } },
    ek: { [ekAnahtari(m.id, yaziId.id!)]: "Deneme gözlemi", [ekAnahtari(dg.id, ts.id!)]: "Deneme açıklaması" } });
  const h = html(y, c, [{ ad: "Foto 1", bolum: lb.id, madde: m.id, src: null }]);
  const lbas = Object.values({ no: "No", madde: "Kontrol maddesi", sonuc: "Sonuç" });
  assert.deepEqual(basliklar(h, "Gözlem"), [...lbas, "Açıklama", "Gözlem", "Fotoğraf"]);
  for (const v of ["Etiket soluk", "Deneme gözlemi", "Foto 1", "Deneme açıklaması"]) assert.ok(h.includes(`<td>${v}</td>`), v);
  assert.ok(basliklar(h, "Açıklama notu").includes("Açıklama notu"));
});

test("Bakanlık formatında ek sütun yayında uyarı", () => {
  const t = Z2(), l = yer(t, "liste");
  assert.ok(kilitDenetimi(ekSutunEkle(t, l, "std").t, t).length > 0);
});

test("S.A.Y: format işlemi (kontrol listesi / test sütunu) ve rapora yazma x:<öğe>:<sütun> — seçim seçeneklerden", () => {
  const t = Z2(), lb = t.bolumler[yer(t, "liste")], tb = t.bolumler[yer(t, "test")];
  const s = formatIslemleri(t, [
    { islem: "tablo_sutunu", bolum: lb.id, eylem: "ekle", alan: "yazi", ad: "Gözlem" },
    { islem: "tablo_sutunu", bolum: tb.id, eylem: "ekle", alan: "secim", ad: "Durum", secenekler: ["Açık", "Kapalı"] },
    { islem: "tablo_sutunu", bolum: lb.id, eylem: "ekle", alan: "uydurma" },
  ]);
  assert.equal(s.yapilan.length, 2, s.gecersiz.join(" | "));
  const y = gecerli(s.t);
  assert.ok(formatHaritasi(y).includes("ek sütunlar"));
  const l2 = y.bolumler[yer(y, "liste")] as BolumOf<"liste">, t2 = y.bolumler[yer(y, "test")] as BolumOf<"test">;
  const m = l2.gruplar[0].maddeler[0], dg = t2.degerler[0], gs = l2.ekSutunlar![0], ds = t2.ekSutunlar![0];
  const u = komutlariUygula({ ekipman: {}, cevaplar: ilkCevaplar(y) }, y, [
    { yer: `x:${m.id}:${gs.id}`, deger: "Deneme gözlemi" },
    { yer: `x:${dg.id}:${ds.id}`, deger: "kapalı" },
    { yer: `x:${dg.id}:${ds.id}`, deger: "Yarı açık" },
  ]);
  assert.equal(u.durum.cevaplar.ek[ekAnahtari(m.id, gs.id)], "Deneme gözlemi");
  assert.equal(u.durum.cevaplar.ek[ekAnahtari(dg.id, ds.id)], "Kapalı");
  assert.equal(u.sonuclar.filter((r) => r.durum === "yazilamadi").length, 1, JSON.stringify(u.sonuclar));
  assert.ok(u.isaretler.some((i) => i.yer.tur === "ek"));
  const harita = raporHaritasi(y, "Deneme türü", { cevaplar: u.durum.cevaplar, ekipman: {} }) ?? "";
  assert.ok(harita.includes(`x:${m.id}:${gs.id} (Gözlem) = "Deneme gözlemi"`), harita.slice(0, 4000));
});

test("parça kopyası: ek sütunlu kontrol listesi kopyalanınca tanım geçerli (sütun kimliği bölüm içinde tekil, ölçüm tablosu gibi)", () => {
  const t = Z2(), l = yer(t, "liste"), y = ekSutunEkle(t, l, "yazi").t;
  const k = parcaKopyasi(y, y.bolumler[l]);
  assert.ok(k);
  const r = FormatTanimi.safeParse({ ...y, bolumler: [...y.bolumler, k] });
  assert.ok(r.success, r.success ? "" : r.error.issues.map((x) => x.message).join(" | "));
});
