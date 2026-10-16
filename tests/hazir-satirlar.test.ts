/* NEREDEN GELDİ: sunum 595 madde 5 (reisim 2026-10-16: "satır sütun ekleyemiyorum"): ölçüm tablosunda hazır satırlar — "Sabit satırlar" seçilse de
   satırlar tanımlanamıyordu. Saf (veritabanısız): satırlar formatta (adı, sırası, çıkar; son çıkınca liste kalkar — eski format aynı), yeni raporda
   adlarıyla gelir (ilkCevaplar), sıra sütununda adı (belge), kusur metninde adı (motor), satır kopyası adı taşımaz, Bakanlık uyarısı, S.A.Y. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { degerlendir, ELLE_GEREKCE, ELLE_SONUC, kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, HAZIR_AD, type BolumOf } from "../src/format/tanim.ts";
import { hazirSatirEkle, hazirSatirSil, hazirSatirTasi, hazirSatirYaz } from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";
import { ilkCevaplar } from "../src/modules/raporlar/ornek.ts";
import { satirKopyasi } from "../src/modules/raporlar/tablo.ts";

const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const yer = (t: FormatTanimi) => t.bolumler.findIndex((b) => b.blok === "olcum");
const gecerli = (t: FormatTanimi) => FormatTanimi.parse(JSON.parse(JSON.stringify(t)));
const hazirli = () => {
  const t = Z2(), o = yer(t);
  return { t: gecerli(["L1-N", "L2-N", "L3-N"].reduce((y, ad) => hazirSatirEkle(y, o, ad), t)), o };
};

test("kurucu: hazır satır eklenir, adı yazılır, taşınır, çıkarılır; son çıkınca liste kalkar (eski format aynı)", () => {
  const t0 = Z2(), { t, o } = hazirli();
  assert.deepEqual((t.bolumler[o] as BolumOf<"olcum">).hazir, ["L1-N", "L2-N", "L3-N"]);
  let y = hazirSatirYaz(t, o, 1, "  L2 -  N ");
  y = hazirSatirTasi(y, o, 2, -1);
  assert.deepEqual((y.bolumler[o] as BolumOf<"olcum">).hazir, ["L1-N", "L3-N", "L2 - N"]);
  assert.equal(hazirSatirYaz(y, o, 0, "   "), y, "boş ad yazılmaz");
  assert.equal(hazirSatirTasi(y, o, 0, -1), y, "uçtaki yukarı gitmez");
  for (let j = 2; j >= 0; j--) y = hazirSatirSil(y, o, j);
  assert.equal(JSON.stringify(y), JSON.stringify(t0));
});

test("yeni rapor: hazır satırlar adlarıyla gelir (değerler boş); hazırsız tabloda satır yok (bugünkü gibi)", () => {
  const { t, o } = hazirli(), b = t.bolumler[o];
  assert.deepEqual(ilkCevaplar(t).tablo[b.id], [{ [HAZIR_AD]: "L1-N" }, { [HAZIR_AD]: "L2-N" }, { [HAZIR_AD]: "L3-N" }]);
  assert.equal(Object.hasOwn(ilkCevaplar(Z2()).tablo, b.id), false);
});

test("belge: sıra sütununda hazır satırın adı, denetçinin eklediği satırda numarası; kusur metninde adı", () => {
  const { t, o } = hazirli(), b = t.bolumler[o] as BolumOf<"olcum">;
  const satirlar = [...ilkCevaplar(t).tablo[b.id], {}];
  satirlar[0] = { ...satirlar[0], [ELLE_SONUC]: "uygun_degil", [ELLE_GEREKCE]: "Deneme gerekçesi yazıldı" };
  const cevaplar = Cevaplar.parse({ ...ilkCevaplar(t), tablo: { [b.id]: satirlar } });
  const h = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t, cevaplar }) as never);
  for (const ad of ["L1-N", "L2-N", "L3-N"]) assert.ok(h.includes(`<td class="rb-orta">${ad}</td>`), ad);
  assert.ok(h.includes('<td class="rb-orta">4</td>'), "eklenen satır numarasıyla");
  const d = degerlendir(t, cevaplar);
  assert.ok(d.kusurlar.some((k) => k.metin.startsWith("L1-N:")), JSON.stringify(d.kusurlar.map((k) => k.metin)));
});

test("satır kopyası hazır satırın adını taşımaz", () => {
  assert.deepEqual(satirKopyasi({ [HAZIR_AD]: "L1-N", a: "F3" }, "a"), { a: "F4" });
});

test("Bakanlık formatında hazır satır yayında uyarı; S.A.Y hazir_satir işlemi ve haritası", () => {
  const t = Z2(), o = yer(t), b = t.bolumler[o];
  assert.ok(kilitDenetimi(hazirSatirEkle(t, o, "L1-N"), t).length > 0);
  const s = formatIslemleri(t, [
    { islem: "hazir_satir", bolum: b.id, eylem: "ekle", ad: "1. kat" },
    { islem: "hazir_satir", bolum: b.id, eylem: "ekle", ad: "2. kat" },
    { islem: "hazir_satir", bolum: b.id, eylem: "degistir", oge: "2", ad: "Çatı" },
    { islem: "hazir_satir", bolum: b.id, eylem: "yukari", oge: "Çatı" },
    { islem: "hazir_satir", bolum: b.id, eylem: "cikar", oge: "yok" },
  ]);
  assert.equal(s.yapilan.length, 4, s.gecersiz.join(" | "));
  assert.equal(s.gecersiz.length, 1);
  assert.deepEqual((s.t.bolumler[o] as BolumOf<"olcum">).hazir, ["Çatı", "1. kat"]);
  assert.ok(formatHaritasi(s.t).includes("hazır satırlar (denetçi de ekler): 1) Çatı · 2) 1. kat"));
});
