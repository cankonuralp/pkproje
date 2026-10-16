/* NEREDEN GELDİ: sunum 595 madde 2, 9, 10 (reisim 2026-10-16: "format yapıcıda … satır sütun ekleyemiyorum"; K3 "evet" — cihaz tablosunun
   sütunları cihaz kaydından seçilir). Saf (veritabanısız): ölçüm cihazları tablosunun sütunları (varsayılan bugünkü 5 sütun; ekle / adı / sola-sağa /
   çıkar — en az bir sütun), uygunsuzluklar tablo olarak (No · Uygunsuzluk · Ağırlık; bölüm, fotoğraf) ya da bugünkü madde listesi, bilgi bölümünün
   dizilişi (1 · 2 · 3; 2 bugünkü), alanın belgede tam satırı; kimlikler tanımda tekil, eski format aynı çizilir, Bakanlık uyarısı, S.A.Y'ın işlemleri. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import type { BelgeVerisi } from "../src/belge/veri.ts";
import { cihazSutunlari } from "../src/format/duzen.ts";
import { kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import {
  bilgiDizilisiYaz, eksikTabloAlanlari, kimlikler, kusurTablosuYaz, ogeYaz, tabloSutunuEkle, tabloSutunuSil, tabloSutunuTasi, tabloSutunuYaz,
} from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";

const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const yer = (t: FormatTanimi, blok: string) => t.bolumler.findIndex((b) => b.blok === blok);
const CIHAZ = { turAd: "Topraklama ölçer", kod: "OC-1", marka: "Deneme", model: "T-2", seri: "S-9", kalTarih: "2026-01-10", kalBitis: "2027-01-10", sertifika: "K-77" };
const veri = (t: FormatTanimi, d: Partial<BelgeVerisi> = {}): BelgeVerisi => ({ ...ornekBelge("ZPKR02"), tanim: t, cihazlar: [CIHAZ], ...d });
const html = (t: FormatTanimi, d: Partial<BelgeVerisi> = {}) => renderToStaticMarkup(raporBelgesi(veri(t, d)) as never);
/** başlıkları verilen ilk tablonun başlık satırı */
const basliklar = (h: string, ilk: string) => {
  const tablo = h.split("<table>").find((x) => x.includes(`>${ilk}</th>`));
  return tablo ? [...tablo.split("</thead>")[0].matchAll(/<th class="rb-ab">([^<]*)<\/th>/g)].map((m) => m[1]) : [];
};
const gecerli = (t: FormatTanimi) => FormatTanimi.parse(JSON.parse(JSON.stringify(t)));

test("ölçüm cihazları: varsayılan bugünkü 5 sütun; eklenen sütun (marka) değeriyle, sola taşınan sütun yerinde; kimlikler tekil", () => {
  const t = Z2(), c = yer(t, "cihaz"), b = t.bolumler[c] as BolumOf<"cihaz">;
  assert.deepEqual(cihazSutunlari(b).map((s) => s.ad), ["Cihaz", "Kod / seri no", "Kalibrasyon tarihi", "Geçerlilik", "Sertifika no"]);
  assert.deepEqual(basliklar(html(t), "Cihaz"), ["Cihaz", "Kod / seri no", "Kalibrasyon tarihi", "Geçerlilik", "Sertifika no"]);
  const e = tabloSutunuEkle(t, c, "marka", "Markası");
  assert.ok(e.id);
  let y = gecerli(e.t);
  assert.deepEqual(basliklar(html(y), "Cihaz"), ["Cihaz", "Kod / seri no", "Kalibrasyon tarihi", "Geçerlilik", "Sertifika no", "Markası"]);
  y = tabloSutunuTasi(y, c, e.id!, -1);
  y = tabloSutunuYaz(y, c, e.id!, "Marka adı");
  const h = html(gecerli(y));
  assert.deepEqual(basliklar(h, "Cihaz"), ["Cihaz", "Kod / seri no", "Kalibrasyon tarihi", "Geçerlilik", "Marka adı", "Sertifika no"]);
  assert.match(h, /<td>Deneme<\/td><td>K-77<\/td>/);
  /* aynı bilgi iki kez eklenmez; kimlikler bütün tanımda tekil (cevaplar kimlikle saklanır) */
  assert.equal(tabloSutunuEkle(y, c, "marka").id, null);
  const ids = (y.bolumler[c] as BolumOf<"cihaz">).sutunlar!.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((x) => !x.startsWith("cs_")));
  const tumu = [...kimlikler(y)];
  assert.equal(new Set(tumu).size, tumu.length);
});

test("ölçüm cihazları: sütun çıkarılır, son sütun çıkmaz; iki kez aynı bilgi şemadan geçmez", () => {
  const t = Z2(), c = yer(t, "cihaz");
  let y = t;
  for (const s of cihazSutunlari(t.bolumler[c] as BolumOf<"cihaz">)) y = tabloSutunuSil(y, c, (y.bolumler[c] as BolumOf<"cihaz">).sutunlar?.find((x) => x.alan === s.alan)?.id ?? s.id);
  const kalan = cihazSutunlari(y.bolumler[c] as BolumOf<"cihaz">);
  assert.equal(kalan.length, 1);
  assert.deepEqual(basliklar(html(gecerli(y)), kalan[0].ad), [kalan[0].ad]);
  const bozuk = JSON.parse(JSON.stringify(y));
  bozuk.bolumler[c].sutunlar.push({ id: "k_t99", ad: "Yine", alan: kalan[0].alan });
  assert.equal(FormatTanimi.safeParse(bozuk).success, false);
  assert.deepEqual(eksikTabloAlanlari(y.bolumler[c]).length, 9);
});

test("uygunsuzluklar: tablo olarak (No · Uygunsuzluk · Ağırlık; bölüm eklenir) — işaret kalkınca bugünkü madde listesi, tanım aynı", () => {
  const t = Z2(), k = yer(t, "kusur"), l = yer(t, "liste"), lb = t.bolumler[l] as BolumOf<"liste">;
  const m = lb.gruplar[0].maddeler[0];
  const d = { cevaplar: Cevaplar.parse({ madde: { [m.id]: { c: lb.cevaplar[1] } }, sonuc: "uygun_degil" }), sonuc: "uygun_degil" as const };
  assert.match(html(t, d), /<ul class="rb-kusurlar">/);
  let y = kusurTablosuYaz(t, k, true);
  assert.deepEqual(basliklar(html(gecerli(y), d), "Uygunsuzluk"), ["No", "Uygunsuzluk", "Ağırlık"]);
  y = tabloSutunuEkle(y, k, "bolum").t;
  const h = html(gecerli(y), d);
  assert.deepEqual(basliklar(h, "Uygunsuzluk"), ["No", "Uygunsuzluk", "Ağırlık", "Bölüm"]);
  assert.ok(h.includes(`<td class="rb-orta">1</td><td>${m.metin.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}`), "1. satırda madde");
  assert.ok(h.includes(`<td>${lb.ad}</td>`), "bölüm adı");
  assert.equal(h.includes("rb-kusurlar"), false);
  assert.equal(JSON.stringify(kusurTablosuYaz(y, k, false)), JSON.stringify(t));
  /* son sütun çıkınca da madde listesine döner */
  let z = kusurTablosuYaz(t, k, true);
  for (const s of (z.bolumler[k] as BolumOf<"kusur">).sutunlar!) z = tabloSutunuSil(z, k, s.id);
  assert.equal(JSON.stringify(z), JSON.stringify(t));
});

test("bilgi bölümünün dizilişi (1 · 2 · 3) ve alanın tam satırı; 2 ve 'kendiliğinden' tanımdan kalkar", () => {
  /* kayıttan gelmeyen alanlı bilgi bölümü (ZPKR02'de ekipman bilgileri) */
  const t = Z2(), tamIcin = t.bolumler.findIndex((b) => b.blok === "bilgi" && b.alanlar.length >= 3 && b.alanlar.every((a) => !a.kaynak));
  assert.ok(tamIcin >= 0, "üç alanlı bilgi bölümü");
  const b = t.bolumler[tamIcin] as BolumOf<"bilgi">;
  const sutunSayisi = (h: string) => {
    const tablo = h.split("<table>").find((x) => x.includes(`>${b.alanlar[0].ad}</td>`) && x.includes(`>${b.alanlar[1].ad}</td>`))!;
    return (tablo.split("</colgroup>")[0].match(/<col /g) ?? []).length;
  };
  const tamBolumde = b.tam === true;
  if (!tamBolumde) {
    assert.equal(sutunSayisi(html(t)), 4);
    assert.equal(sutunSayisi(html(gecerli(bilgiDizilisiYaz(t, tamIcin, 3)))), 6);
    assert.equal(sutunSayisi(html(gecerli(bilgiDizilisiYaz(t, tamIcin, 1)))), 2);
  }
  assert.equal(JSON.stringify(bilgiDizilisiYaz(bilgiDizilisiYaz(t, tamIcin, 3), tamIcin, 2)), JSON.stringify(t));
  const a = b.alanlar.find((x) => !x.tam && x.tur !== "coklu" && (x.secenekler?.length ?? 0) <= 3)!;
  const y = gecerli(ogeYaz(t, tamIcin, a.id, { tam: true }));
  assert.equal((y.bolumler[tamIcin] as BolumOf<"bilgi">).alanlar.find((x) => x.id === a.id)!.tam, true);
  assert.equal(JSON.stringify(ogeYaz(y, tamIcin, a.id, { tam: null })), JSON.stringify(t));
});

test("Bakanlık formatında sütun / diziliş değişikliği yayında uyarı; geri alınan (aynı sütunlar) uyarmaz", () => {
  const t = Z2(), c = yer(t, "cihaz");
  const e = tabloSutunuEkle(t, c, "seri");
  assert.ok(kilitDenetimi(e.t, t).length > 0);
  const geri = tabloSutunuSil(e.t, c, e.id!);
  assert.deepEqual(kilitDenetimi(geri, t), []);
  const i = t.bolumler.findIndex((b) => b.blok === "bilgi" && b.kilit);
  if (i >= 0) assert.ok(kilitDenetimi(bilgiDizilisiYaz(t, i, 3), t).length > 0);
});

test("S.A.Y: tablo_sutunu (ekle / değiştir / taşı / çıkar; uygunsuzlukta tablo / liste) ve dizilis — haritada görünür", () => {
  const t = Z2(), c = t.bolumler[yer(t, "cihaz")], k = t.bolumler[yer(t, "kusur")];
  const bi = t.bolumler.find((b) => b.blok === "bilgi")!;
  const s = formatIslemleri(t, [
    { islem: "tablo_sutunu", bolum: c.id, eylem: "ekle", alan: "model", ad: "Model no" },
    { islem: "tablo_sutunu", bolum: c.id, eylem: "yukari", oge: "Model no" },
    { islem: "tablo_sutunu", bolum: c.id, eylem: "cikar", oge: "Sertifika no" },
    { islem: "tablo_sutunu", bolum: k.id, eylem: "tablo" },
    { islem: "tablo_sutunu", bolum: k.id, eylem: "ekle", alan: "foto" },
    { islem: "dizilis", bolum: bi.id, dizilis: 3 },
    { islem: "tablo_sutunu", bolum: c.id, eylem: "ekle", alan: "uydurma" },
    { islem: "dizilis", bolum: bi.id, dizilis: 5 },
  ]);
  assert.equal(s.yapilan.length, 6, s.gecersiz.join(" | "));
  assert.equal(s.gecersiz.length, 2);
  const y = gecerli(s.t);
  assert.deepEqual(cihazSutunlari(y.bolumler[yer(y, "cihaz")] as BolumOf<"cihaz">).map((x) => x.ad), ["Cihaz", "Kod / seri no", "Kalibrasyon tarihi", "Geçerlilik", "Model no"]);
  assert.deepEqual((y.bolumler[yer(y, "kusur")] as BolumOf<"kusur">).sutunlar!.map((x) => x.alan), ["sira", "metin", "agir", "foto"]);
  const harita = formatHaritasi(y);
  assert.ok(harita.includes("Model no · model"), harita.slice(0, 3000));
  assert.ok(harita.includes("belgede bir satırda 3 bilgi"));
});
