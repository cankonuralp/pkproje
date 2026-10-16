/* NEREDEN GELDİ: sunum 595 madde 4, 6, 7, 8, 11–15 (reisim 2026-10-16: "format yapıcıda bu ve benzeri kısımlarda değişiklik yapamıyorum, tıklayıp
   değiştiremiyorum, satır sütun ekleyemiyorum"). Kâğıtta görünen sabit başlıklar ve sözcükler formatın; öğelerin sırası değişir. Saf (veritabanısız):
   eski format aynı çizilir (bugünkü yazıyla aynı yazılan kalkar), belgede başlıklar / Sonuç sütununun yeri / sonuç sözcükleri / yönlendirme / başlık
   tablosu / sayfa altı / ekipman satır adları, öğe taşıma (madde grubun ucundan komşu gruba), Bakanlık uyarısı, S.A.Y'ın işlemleri. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import type { BelgeVerisi } from "../src/belge/veri.ts";
import { kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { bolumBasligiYaz, gorunumBasligiYaz, notSatiriYaz, ogeTasi, sonucYeriYaz } from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";

const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const yer = (t: FormatTanimi, blok: string) => t.bolumler.findIndex((b) => b.blok === blok);
const veri = (t: FormatTanimi, d: Partial<BelgeVerisi> = {}): BelgeVerisi => ({ ...ornekBelge("ZPKR02"), tanim: t, ...d });
const html = (t: FormatTanimi, d: Partial<BelgeVerisi> = {}) => renderToStaticMarkup(raporBelgesi(veri(t, d)) as never);
const metin = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("bugünkü yazıyla aynı ya da boş yazılan başlık kalkar; eski format aynı çizilir", () => {
  const t = Z2(), o = yer(t, "olcum"), te = yer(t, "test"), s = yer(t, "sonuc");
  let y = bolumBasligiYaz(t, o, "sonuc", " Sonuç ");
  y = bolumBasligiYaz(y, o, "not", "");
  y = te >= 0 ? bolumBasligiYaz(y, te, "deger", "Değer") : y;
  y = bolumBasligiYaz(y, s, "uygun", "uygundur");
  y = gorunumBasligiYaz(y, "bas_no", "Rapor No");
  y = gorunumBasligiYaz(y, "alt_yazi", "{firma} · {kod}");
  assert.equal(JSON.stringify(y), JSON.stringify(t));
  assert.equal(html(y), html(t));
});

test("belge: ölçüm tablosunun başlıkları ve Sonuç sütununun yeri (son · baş · gizli); kontrol listesi ve test başlıkları", () => {
  const t = Z2(), o = yer(t, "olcum"), b = t.bolumler[o] as BolumOf<"olcum">;
  const satir = Cevaplar.parse({ tablo: { [b.id]: [Object.fromEntries(b.sutunlar.map((s) => [s.id, "1"]))] } });
  let y = bolumBasligiYaz(t, o, "sira", "Nokta");
  y = bolumBasligiYaz(y, o, "sonuc", "Değerlendirme");
  const ilkSatir = (h: string) => {
    const tablo = h.split("<table>").find((x) => x.includes("Nokta"))!;
    return [...tablo.matchAll(/<th class="rb-ab">([^<]*)<\/th>/g)].map((m) => m[1]);
  };
  const son = ilkSatir(html(y, { cevaplar: satir }));
  assert.deepEqual([son[0], son.at(-1)], ["Nokta", "Değerlendirme"]);
  const bas = ilkSatir(html(sonucYeriYaz(y, o, "bas"), { cevaplar: satir }));
  assert.deepEqual(bas.slice(0, 2), ["Nokta", "Değerlendirme"]);
  const gizli = ilkSatir(html(sonucYeriYaz(y, o, "gizli"), { cevaplar: satir }));
  assert.equal(gizli.includes("Değerlendirme"), false);
  assert.equal(gizli.length, b.sutunlar.length + 1);
  assert.equal(sonucYeriYaz(sonucYeriYaz(y, o, "bas"), o, "son").bolumler[o].blok === "olcum" && "sonucYeri" in (sonucYeriYaz(sonucYeriYaz(y, o, "bas"), o, "son").bolumler[o]), false);
  const l = yer(y, "liste");
  const m = metin(html(bolumBasligiYaz(bolumBasligiYaz(y, l, "madde", "Kontrol edilen"), l, "sonuc", "Durum")));
  assert.ok(m.includes("No Kontrol edilen Durum"), m.slice(0, 2000));
});

test("belge: sonuç sözcükleri, yorumun yönlendirmesi ve satır sayısı, başlık tablosu etiketleri, sayfa altı ({firma}, {kod}), ekipman satır adları", () => {
  const t = Z2(), s = yer(t, "sonuc"), n = yer(t, "not");
  let y = bolumBasligiYaz(t, s, "uygun", "KULLANIMA UYGUNDUR");
  y = bolumBasligiYaz(y, s, "uygun_degil", "UYGUN DEĞİLDİR, KULLANILAMAZ");
  y = bolumBasligiYaz(y, n, "yonlendirme", "Varsa öneriler yazılır.");
  y = notSatiriYaz(y, n, 4);
  y = gorunumBasligiYaz(y, "bas_no", "Rapor numarası");
  y = gorunumBasligiYaz(y, "alt_yazi", "{firma} · {kod} · Gizlidir");
  y = gorunumBasligiYaz(y, "ekipman_kod", "Ekipman no");
  const v = (d: Partial<BelgeVerisi>) => metin(html(y, d));
  assert.ok(v({ sonuc: "uygun" }).includes("KULLANIMA UYGUNDUR"));
  assert.ok(v({ sonuc: "uygun_degil" }).includes("UYGUN DEĞİLDİR, KULLANILAMAZ"));
  const bos = v({ cevaplar: Cevaplar.parse({}) });
  assert.ok(bos.includes("Varsa öneriler yazılır."), "yorum boşsa yönlendirme");
  const dolu = v({ cevaplar: Cevaplar.parse({ yorum: "Deneme yorumu" }) });
  assert.ok(dolu.includes("Deneme yorumu") && !dolu.includes("Varsa öneriler yazılır."), "yorum varsa yorum");
  assert.match(html(y), /<p class="rb-kutu-metin" style="min-height:5.00em">/);
  assert.ok(metin(html(y)).includes("Rapor numarası"));
  assert.ok(metin(html(y)).includes("Deneme Muayene A.Ş. · ZPKR02 · Gizlidir"));
  assert.ok(metin(html(y)).includes("Ekipman no"));
});

test("öğe sırası: alan, sütun, değer yukarı / aşağı; madde grubun ucundan komşu gruba; uçta aynı tanım", () => {
  const t = Z2(), l = yer(t, "liste"), b = t.bolumler[l] as BolumOf<"liste">;
  const ilkGrupSon = b.gruplar[0].maddeler.at(-1)!.id;
  const y = ogeTasi(t, l, ilkGrupSon, 1);
  const yb = y.bolumler[l] as BolumOf<"liste">;
  assert.equal(yb.gruplar[1].maddeler[0].id, ilkGrupSon, "sonraki grubun başına");
  assert.equal(yb.gruplar[0].maddeler.length, b.gruplar[0].maddeler.length - 1);
  assert.equal((ogeTasi(y, l, ilkGrupSon, -1).bolumler[l] as BolumOf<"liste">).gruplar[0].maddeler.at(-1)!.id, ilkGrupSon, "geri");
  assert.equal(ogeTasi(t, l, b.gruplar[0].maddeler[0].id, -1), t, "en üstteki yukarı çıkmaz");
  const o = yer(t, "olcum"), ob = t.bolumler[o] as BolumOf<"olcum">;
  const s = ogeTasi(t, o, ob.sutunlar[0].id, 1).bolumler[o] as BolumOf<"olcum">;
  assert.deepEqual(s.sutunlar.slice(0, 2).map((x) => x.id), [ob.sutunlar[1].id, ob.sutunlar[0].id]);
  assert.ok(FormatTanimi.safeParse(y).success);
});

test("Bakanlık formatında başlık / sözcük / yer değişince yayın uyarısı; S.A.Y baslik, sonuc_yeri, not_satiri, oge_tasi", () => {
  const z = Z2(), o = yer(z, "olcum"), s = yer(z, "sonuc");
  for (const y of [bolumBasligiYaz(z, o, "sonuc", "Değerlendirme"), sonucYeriYaz(z, o, "gizli"), bolumBasligiYaz(z, s, "uygun", "UYGUNDUR"), gorunumBasligiYaz(z, "alt_yazi", "Gizlidir")]) {
    assert.ok(kilitDenetimi(y, z).length > 0, "uyarı yok");
  }
  const b = z.bolumler[o] as BolumOf<"olcum">;
  const r = formatIslemleri(z, [
    { islem: "baslik", bolum: b.id, alan: "sonuc", ad: "Değerlendirme" },
    { islem: "baslik", alan: "alt_yazi", ad: "{firma} · gizli" },
    { islem: "sonuc_yeri", bolum: b.id, yer: "bas" },
    { islem: "not_satiri", bolum: "yorum", satir: 3 },
    { islem: "oge_tasi", bolum: b.id, oge: b.sutunlar[0].ad, eylem: "asagi" },
    { islem: "baslik", bolum: b.id, alan: "uygun", ad: "x" },
    { islem: "sonuc_yeri", bolum: "yorum", yer: "bas" },
  ]);
  assert.deepEqual([r.yapilan.length, r.gecersiz.length], [5, 2], JSON.stringify(r));
  const h = formatHaritasi(r.t);
  assert.match(h, /sonuç “Değerlendirme” \(belgede başta\)/);
  assert.match(h, /sayfa altı: “\{firma\} · gizli”/);
  assert.ok(FormatTanimi.safeParse(r.t).success);
});
