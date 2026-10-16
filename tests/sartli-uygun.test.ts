/* NEREDEN GELDİ: sunum 595 madde 12 (reisim K1 "Evet, hepsi": "iki seçeneğin metni yazılır; üçüncü seçenek eklenir (ör. şartlı uygun)"). Saf
   (veritabanısız): sonuç bölümünde üçüncü seçenek açılır / kapanır (kapanınca eski format aynı), sözcüğü yazılır; belge sözcüğü basar; öneri —
   kusur dereceleri soruluyorsa ağır kusur yoksa "şartlı uygun"; S.A.Y rapora "şartlı uygun" yazar (seçenek kapalıysa yazamaz), formatta açar;
   Bakanlık formatında açmak yayında uyarı. Veritabanı (CHECK, uygunsuzluk) tests/onaylar.test.ts ve raporlar.test.ts'te. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { sartliAcik, sonucSozcugu } from "../src/format/duzen.ts";
import { degerlendir, kilitDenetimi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { bolumBasligiYaz, sartliYaz } from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";
import { ilkCevaplar } from "../src/modules/raporlar/ornek.ts";
import { komutlariUygula } from "../src/modules/raporlar/say-doldur.ts";

const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const yer = (t: FormatTanimi, blok: string) => t.bolumler.findIndex((b) => b.blok === blok);
const metin = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("kurucu: şartlı uygun açılır, sözcüğü yazılır; kapanınca sözcük de kalkar — eski format aynı; Cevaplar üç değeri alır", () => {
  const t = Z2(), s = yer(t, "sonuc");
  assert.equal(sartliAcik(t), false);
  let y = sartliYaz(t, s, true);
  assert.ok(sartliAcik(y));
  assert.equal(sartliYaz(y, s, true), y, "zaten açık");
  assert.equal(JSON.stringify(bolumBasligiYaz(y, s, "sartli", "şartlı uygundur")), JSON.stringify(y), "bugünkü sözcük yazılmaz");
  y = bolumBasligiYaz(y, s, "sartli", "ŞARTLI UYGUNDUR");
  assert.equal((FormatTanimi.parse(y).bolumler[s] as BolumOf<"sonuc">).sartliMetin, "ŞARTLI UYGUNDUR");
  assert.equal(JSON.stringify(sartliYaz(y, s, false)), JSON.stringify(t));
  assert.equal(Cevaplar.parse({ sonuc: "sartli" }).sonuc, "sartli");
  assert.equal(Cevaplar.safeParse({ sonuc: "belki" }).success, false);
});

test("belge: şartlı uygun sonucu formatın sözcüğüyle (cümleli) ya da adıyla (cümlesiz)", () => {
  const t = Z2(), s = yer(t, "sonuc"), y = FormatTanimi.parse(bolumBasligiYaz(sartliYaz(t, s, true), s, "sartli", "ŞARTLI UYGUNDUR"));
  const b = y.bolumler[s] as BolumOf<"sonuc">;
  assert.equal(sonucSozcugu(b, "sartli"), "ŞARTLI UYGUNDUR");
  const h = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: y, sonuc: "sartli" }) as never);
  assert.ok(b.cumle.trim() ? h.includes("<b>ŞARTLI UYGUNDUR</b>") : metin(h).includes("Sonuç: Şartlı uygun"), metin(h).slice(-1500));
  const cumlesiz = FormatTanimi.parse({ ...y, bolumler: y.bolumler.map((x, j) => (j === s ? { ...x, cumle: "" } : x)) });
  assert.ok(metin(renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: cumlesiz, sonuc: "sartli" }) as never)).includes("Sonuç: Şartlı uygun"));
});

test("öneri: dereceler soruluyor ve şartlı açıksa — hafif kusur → şartlı uygun, ağır kusur → uygun değil; şartlı kapalıysa uygun değil", () => {
  const t0 = Z2(), s = yer(t0, "sonuc"), l = yer(t0, "liste"), lb = t0.bolumler[l] as BolumOf<"liste">, m = lb.gruplar[0].maddeler[0];
  const t = FormatTanimi.parse({ ...sartliYaz(t0, s, true), kurallar: { ...t0.kurallar, oneri: true, derece: true } });
  const c = (derece: "hafif" | "agir") => Cevaplar.parse({ ...ilkCevaplar(t), madde: { ...ilkCevaplar(t).madde, [m.id]: { c: lb.cevaplar[1], not: "Deneme kusuru", derece } } });
  assert.equal(degerlendir(t, ilkCevaplar(t)).oneri, "uygun");
  assert.equal(degerlendir(t, c("hafif")).oneri, "sartli");
  assert.equal(degerlendir(t, c("agir")).oneri, "uygun_degil");
  const kapali = FormatTanimi.parse({ ...t0, kurallar: { ...t0.kurallar, oneri: true, derece: true } });
  assert.equal(degerlendir(kapali, c("hafif")).oneri, "uygun_degil");
  const dercesiz = FormatTanimi.parse({ ...t, kurallar: { ...t.kurallar, derece: false } });
  assert.equal(degerlendir(dercesiz, c("hafif")).oneri, "uygun_degil", "derece sorulmuyorsa kusurun ağırlığı bilinmez");
});

test("S.A.Y: rapora 'şartlı uygun' yazar (formatta açıksa), kapalıysa nedeniyle yazamaz; format yapıcıda açar; Bakanlık formatında yayında uyarı", () => {
  const t0 = Z2(), s = yer(t0, "sonuc"), acik = sartliYaz(t0, s, true);
  const u = komutlariUygula({ ekipman: {}, cevaplar: ilkCevaplar(acik) }, acik, [{ yer: "sonuc", deger: "şartlı uygun" }]);
  assert.equal(u.durum.cevaplar.sonuc, "sartli");
  const k = komutlariUygula({ ekipman: {}, cevaplar: ilkCevaplar(t0) }, t0, [{ yer: "sonuc", deger: "şartlı uygun" }]);
  assert.equal(k.durum.cevaplar.sonuc, "");
  assert.ok(k.sonuclar.some((r) => r.durum === "yazilamadi" && /şartlı uygun/.test(r.neden ?? "")), JSON.stringify(k.sonuclar));
  const f = formatIslemleri(t0, [{ islem: "sartli_secenek", bolum: t0.bolumler[s].id, acik: true }, { islem: "sartli_secenek", bolum: t0.bolumler[s].id, acik: true }]);
  assert.deepEqual([f.yapilan.length, f.gecersiz.length], [1, 1]);
  assert.ok(sartliAcik(f.t));
  assert.ok(formatHaritasi(f.t).includes("şartlı uygun “şartlı uygundur”"));
  assert.ok(kilitDenetimi(acik, t0).length > 0);
});
