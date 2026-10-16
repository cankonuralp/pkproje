/* NEREDEN GELDİ: sunum 595 madde 16 (reisim 2026-10-16: "format yapıcıda … değişiklik yapamıyorum"): fotoğraf bölümünde yalnız en az / en çok
   sayısı vardı, kutular adsızdı. Saf (veritabanısız): adlı fotoğraf kutuları (adı, sırası, çıkar; son çıkınca liste kalkar — eski format aynı;
   kimlik tanımda tekil), belgede kutunun fotoğrafı kendi bölümünde kutunun adıyla (ekteki madde fotoğraflarına karışmaz), parça kopyasında yeni
   kimlik, Bakanlık uyarısı, S.A.Y'ın foto_kutusu işlemi. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { fotoKutusuEkle, fotoKutusuSil, fotoKutusuTasi, fotoKutusuYaz, kimlikler } from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";
import { parcaKopyasi } from "../src/modules/rapor-format/yapboz.ts";

const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const yer = (t: FormatTanimi, blok: string) => t.bolumler.findIndex((b) => b.blok === blok);
const gecerli = (t: FormatTanimi) => FormatTanimi.parse(JSON.parse(JSON.stringify(t)));
const kutulu = () => {
  const t = Z2(), f = yer(t, "foto");
  const a = fotoKutusuEkle(t, f, "Etiket"), b = fotoKutusuEkle(a.t, f, "Genel görünüm");
  return { t: gecerli(b.t), f, etiket: a.id!, genel: b.id! };
};

test("kurucu: kutu eklenir, adı yazılır, taşınır, çıkarılır; son çıkınca tanım eskisi; kimlik tanımda tekil", () => {
  const t0 = Z2(), { t, f, etiket, genel } = kutulu();
  assert.ok(f >= 0, "ZPKR02'de fotoğraf bölümü");
  assert.deepEqual((t.bolumler[f] as BolumOf<"foto">).kutular!.map((k) => k.ad), ["Etiket", "Genel görünüm"]);
  let y = fotoKutusuTasi(fotoKutusuYaz(t, f, genel, "  Genel   görünüm (ön) "), f, genel, -1);
  assert.deepEqual((y.bolumler[f] as BolumOf<"foto">).kutular!.map((k) => k.ad), ["Genel görünüm (ön)", "Etiket"]);
  assert.equal(fotoKutusuYaz(y, f, etiket, " "), y);
  const tumu = [...kimlikler(y)];
  assert.equal(new Set(tumu).size, tumu.length);
  y = fotoKutusuSil(fotoKutusuSil(y, f, etiket), f, genel);
  assert.equal(JSON.stringify(y), JSON.stringify(t0));
});

test("belge: kutunun fotoğrafı kendi bölümünde, kutu sırasıyla ve adıyla; kutusuz fotoğraf da; madde fotoğraflarının ekine karışmaz", () => {
  const { t, f, etiket, genel } = kutulu(), fb = t.bolumler[f];
  const fotolar = [
    { ad: "IMG_2.jpg", bolum: fb.id, madde: null, src: null },
    { ad: "IMG_1.jpg", bolum: fb.id, madde: genel, src: null },
    { ad: "IMG_3.jpg", bolum: fb.id, madde: etiket, src: null },
  ];
  const h = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t, fotolar }) as never);
  const altlar = [...h.matchAll(/<figcaption>([^<]*)<\/figcaption>/g)].map((m) => m[1]);
  assert.deepEqual(altlar, ["Etiket", "Genel görünüm", "IMG_2.jpg"]);
  assert.equal(h.includes("Kontrol maddelerinin fotoğrafları"), false);
});

test("parça kopyası: fotoğraf kutuları yeni kimlikle (tanımda tekil) — kopya eklenince tanım geçerli", () => {
  const { t, f } = kutulu();
  const k = parcaKopyasi(t, t.bolumler[f]);
  assert.ok(k && k.blok === "foto" && k.kutular?.length === 2);
  assert.ok(k.kutular!.every((x) => !kimlikler(t).has(x.id)));
  assert.ok(FormatTanimi.safeParse({ ...t, bolumler: [...t.bolumler, k] }).success);
});

test("Bakanlık formatında kutu yayında uyarı; S.A.Y foto_kutusu ve haritası", () => {
  const t = Z2(), f = yer(t, "foto"), b = t.bolumler[f];
  assert.ok(kilitDenetimi(fotoKutusuEkle(t, f, "Etiket").t, t).length > 0);
  const s = formatIslemleri(t, [
    { islem: "foto_kutusu", bolum: b.id, eylem: "ekle", ad: "Etiket" },
    { islem: "foto_kutusu", bolum: b.id, eylem: "ekle", ad: "Pano içi" },
    { islem: "foto_kutusu", bolum: b.id, eylem: "yukari", oge: "Pano içi" },
    { islem: "foto_kutusu", bolum: b.id, eylem: "degistir", oge: "Etiket", ad: "Etiket plakası" },
    { islem: "foto_kutusu", bolum: b.id, eylem: "cikar", oge: "yok" },
  ]);
  assert.equal(s.yapilan.length, 4, s.gecersiz.join(" | "));
  assert.deepEqual((gecerli(s.t).bolumler[f] as BolumOf<"foto">).kutular!.map((k) => k.ad), ["Pano içi", "Etiket plakası"]);
  assert.ok(formatHaritasi(s.t).includes("kutular:"));
});
