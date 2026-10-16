/* NEREDEN GELDİ: sunum 595 madde 1 (reisim K1 "Evet, hepsi": "“+ İmza yeri” (uzman, teknik yönetici, ikinci uzman, tesis yetkilisi)"). Saf
   (veritabanısız): bölüm ayarında ikinci muayene uzmanı ve tesis yetkilisi eklenir / çıkarılır (varsayılan satırlarıyla), kişinin bilgileri
   kısıtlı (tesis yetkilisinde ad · unvan · imza; unvan uzmanda yok), belge değerleri (ikinci uzman kaydından — seçilmemişse "-", imzaları boş
   hücre, tesis yetkilisi sahada yazılan — kaçışlı), eski format aynı, cevap şeması, saha ekranının hangi girişleri göstereceği, S.A.Y'ın işlemi.
   Sunucu denetimi (ekipten, yazan dışında) tests/raporlar.test.ts'te. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import type { BelgeVerisi } from "../src/belge/veri.ts";
import { imzaGirisleri, imzaSatirlari } from "../src/format/duzen.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, imzaAlanlari, type BolumOf } from "../src/format/tanim.ts";
import { eksikImzaAlanlari, imzaKisisiYaz, imzaSatiriEkle } from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";

const KOMP = () => FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const yer = (t: FormatTanimi) => t.bolumler.findIndex((b) => b.blok === "imza");
const imzaB = (t: FormatTanimi) => t.bolumler[yer(t)] as BolumOf<"imza">;
const metin = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
const html = (t: FormatTanimi, d: Partial<BelgeVerisi> = {}) => renderToStaticMarkup(raporBelgesi({ ...ornekBelge("KOMPRESOR"), tanim: t, ...d }) as never);
const ikiYer = () => { const t = KOMP(), i = yer(t); return FormatTanimi.parse(imzaKisisiYaz(imzaKisisiYaz(t, i, "uzman2", true), i, "tesis", true)); };

test("kurucu: ikinci uzman (4 satır) ve tesis yetkilisi (3 satır) eklenir, çıkarılınca format eskisi; bilgiler kişiye göre", () => {
  const t = KOMP(), i = yer(t), y = ikiYer(), l = imzaSatirlari(imzaB(y));
  assert.deepEqual(l.filter((s) => s.kim === "uzman2").map((s) => s.alan), ["ad", "meslek", "ekipnet", "imza"]);
  assert.deepEqual(l.filter((s) => s.kim === "tesis").map((s) => [s.ad, s.alan]), [["Tesis yetkilisi", "ad"], ["Unvanı", "unvan"], ["İmzası", "imza"]]);
  assert.deepEqual(imzaB(y).imzalar, imzaB(t).imzalar, "eski alan imzalar yalnız uzman / teknik");
  const geri = imzaKisisiYaz(imzaKisisiYaz(y, i, "uzman2", false), i, "tesis", false);
  assert.deepEqual(imzaSatirlari(imzaB(geri)).map((s) => [s.ad, s.kim, s.alan]), imzaSatirlari(imzaB(t)).map((s) => [s.ad, s.kim, s.alan]));
  assert.deepEqual(imzaAlanlari("tesis"), ["ad", "unvan", "imza"]);
  assert.ok(!imzaAlanlari("uzman").includes("unvan") && !imzaAlanlari("uzman2").includes("zaman"));
  assert.equal(imzaSatiriEkle(y, i, "tesis", "meslek").id, null, "tesis yetkilisinin mesleği yok");
  assert.deepEqual(eksikImzaAlanlari(imzaB(y), "uzman2"), ["diploma", "oda", "eposta", "tel"]);
  const z = imzaSatiriEkle(y, i, "uzman2", "diploma");
  assert.ok(z.id && FormatTanimi.safeParse(z.t).success);
  const bozuk = { ...y, bolumler: y.bolumler.map((b, j) => (j === i ? { ...b, satirlar: [...imzaSatirlari(imzaB(y)), { id: "k_i99", ad: "X", kim: "tesis", alan: "ekipnet" }] } : b)) };
  assert.equal(FormatTanimi.safeParse(bozuk).success, false, "şema tesis yetkilisinin EKİPNET'ini reddeder");
});

test("belge: ikinci uzman kaydından (seçilmemişse -), tesis yetkilisi sahada yazılan (kaçışlı), imzaları boş hücre; eski format aynı", () => {
  const t = KOMP(), y = ikiYer();
  const c = Cevaplar.parse({ imzaci: { tesisAd: "Deneme <Yetkili>", tesisUnvan: "Tesis müdürü" } });
  const ikinci = { ad: "Deneme İkinci", meslek: "diger", meslekMetin: "Elektrik mühendisi", ekipnet: "EK-2", diploma: null, oda: null };
  const m = metin(html(y, { cevaplar: c, ikinci }));
  for (const x of ["İkinci muayene uzmanı Deneme İkinci", "Mesleği Elektrik mühendisi", "Yetkili kişi kayıt no (EKİPNET) EK-2", "Tesis yetkilisi Deneme <Yetkili>", "Unvanı Tesis müdürü"]) {
    assert.ok(m.includes(x), `belgede yok: ${x}`);
  }
  assert.ok(!html(y, { cevaplar: c }).includes("<Yetkili>"), "sahada yazılan kaçışlı");
  assert.ok(metin(html(y)).includes("İkinci muayene uzmanı -"), "seçilmemişse -");
  assert.equal(html(t, { cevaplar: c, ikinci }), html(t, { cevaplar: c }), "imza yeri olmayan formatta ikinci uzman basılmaz");
  assert.equal(html(KOMP()), html(t), "eski format aynı");
});

test("cevaplar ve saha: ikinci uzman kimlik biçiminde; boş başlar; saha girişleri formatın satırlarından", () => {
  assert.deepEqual(Cevaplar.parse({}).imzaci, {});
  assert.equal(Cevaplar.safeParse({ imzaci: { uzman2: "x' OR 1=1" } }).success, false);
  assert.equal(Cevaplar.safeParse({ imzaci: { tesisAd: "a".repeat(121) } }).success, false);
  assert.deepEqual(imzaGirisleri(KOMP()), { uzman2: false, tesis: false });
  assert.deepEqual(imzaGirisleri(ikiYer()), { uzman2: true, tesis: true });
});

test("S.A.Y: imza_satiri ekle kisi uzman2 / tesis (unvan); tesis yetkilisine meslek eklenmez — nedeniyle döner", () => {
  const t = imzaKisisiYaz(KOMP(), yer(KOMP()), "tesis", true), b = imzaB(t).id;
  const r = formatIslemleri(t, [
    { islem: "imza_satiri", bolum: b, eylem: "ekle", kisi: "uzman2", bilgi: "ad" },
    { islem: "imza_satiri", bolum: b, eylem: "ekle", kisi: "tesis", bilgi: "meslek" },
    { islem: "imza_satiri", bolum: b, eylem: "ekle", kisi: "kimse", bilgi: "ad" },
  ]);
  assert.deepEqual([r.yapilan.length, r.gecersiz.length], [1, 2], JSON.stringify(r));
  assert.ok(imzaSatirlari(imzaB(r.t)).some((s) => s.kim === "uzman2" && s.alan === "ad" && s.ad === "İkinci muayene uzmanı"));
  assert.ok(formatHaritasi(r.t).includes("Tesis yetkilisi · Unvanı"));
});
