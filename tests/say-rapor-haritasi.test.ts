/* NEREDEN GELDİ: 550 — S.A.Y kuralsız (sunum 546 K6; reisim 2026-10-14: "yapay zeka asistanı S.A.Y. de herhangi bir kısıt kural vb olmasını
   istemiyorum oradan direk haiku ile konuşmak aynı claud kullanır gibi"). 384'teki özetin (yalnız adlar ve sayılar) yerine RAPOR HARİTASI: Haiku
   rapora istenen girişi yer kimlikleriyle yazar. Saf, ZPKR02 şablonuyla:
   · haritada ekipman / bilgi / test alanları, tablo (sütun kimlikleri, satırlar), kontrol maddeleri (cevap seçenekleri), sonuç, yorum — ŞU ANKİ
     değerleriyle (kaydedilmemiş değişiklik dahil); künye (firma, müşteri, tesis, adres) GİTMEZ;
   · haritadaki HER yer kimliği ekranın uygulayıcısında (raporlar/say-doldur.ts komutlariUygula) tanınır — ikisi aynı listeden kopmasın;
   · şemaya uymayan cevap harita üretmez; çok büyük rapor sınırda kısalır.
   557 (sunum 557 · 2. tur — reisim: "el ile girebildiğim değerleri say asistan ile giremiyor"): elle girilebilen her yer haritada — künyenin YERİ
   ve kilidi (DEĞERİ GİTMEZ: müşteri / kişi bilgisi), kontrol tarihleri, uygunluk notu / satır sonucu / satır silme, ölçüm cihazları (kodlarıyla). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi } from "../src/format/tanim.ts";
import { komutlariUygula } from "../src/modules/raporlar/say-doldur.ts";
import { HARITA_SINIRI, raporHaritasi } from "../src/modules/say/rapor-haritasi.ts";

const T = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const linye = T.bolumler.find((b) => b.blok === "olcum" && b.id === "linye");
const liste = T.bolumler.find((b) => b.blok === "liste");

test("harita: yer kimlikleri ve şu anki değerler; künye yok", () => {
  if (!linye || linye.blok !== "olcum" || !liste || liste.blok !== "liste") throw new Error("ZPKR02 bölümleri yok");
  const m1 = liste.gruplar[0].maddeler[0];
  const c = { ...Cevaplar.parse({}), madde: { [m1.id]: { c: liste.cevaplar[1], derece: "agir", not: "Kapak kırık" } }, tablo: { linye: [{ [linye.sutunlar[1].id]: "Aydınlatma" }] },
    yorum: "Uzman notu", sonuc: "uygun" as const, kunye: { firma_adi: "Gizli Müşteri A.Ş." } };
  const h = raporHaritasi(T, "Elektrik iç tesisatı", { cevaplar: c, ekipman: { marka: "Örnek Marka", seri: "" } })!;
  assert.ok(h);
  assert.match(h, /^Ekipman türü: Elektrik iç tesisatı\./);
  assert.match(h, /- e:marka · Marka \(yazı\) = "Örnek Marka"/);
  assert.match(h, /- e:seri · Seri no \(yazı\) = —/);
  assert.ok(h.includes(`## ${linye.ad} — tablo; hücre kimliği t:linye:`), "tablo başlığı ve hücre kimliği");
  assert.match(h, /- 1\. satır: .*="Aydınlatma"/);
  assert.ok(h.includes(`- m:${m1.id} · ${m1.metin} = "${liste.cevaplar[1]}" (ağır kusur) not "Kapak kırık"`), "madde, cevap, derece, not");
  assert.match(h, /- sonuc · Sonuç \(uygun \/ uygun değil\) = "uygun"/);
  assert.match(h, /- yorum · Muayene uzmanının yorumu \(yazı\) = "Uzman notu"/);
  assert.ok(!h.includes("Gizli Müşteri"), "künyenin değeri gitmez");
  /* 557: künye yeri (değersiz, kilitli olan işaretli), satır sonucu ve silme yönergesi */
  assert.match(h, /^- k:firma · Firma adı \(yazı\)$/m);
  assert.match(h, /^- k:sgk · SGK DETSİS NO \(yazı; kilitli — elle de değiştirilemez\)$/m);
  assert.ok(h.includes("Satır silmek: t:linye:<satır no> = sil"));
  assert.ok(h.includes("Sayı kutularına elle olduğu gibi sayı olmayan yazı da yazılır (ör. -)."));
});

test("557: tarih ve cihazlar canlı hâlden; künye değeri hiç gitmez", () => {
  const c = { ...Cevaplar.parse({}), kunye: { firma: "Gizli Müşteri A.Ş.", adres: "Gizli Sokak 1" } };
  const h = raporHaritasi(T, "x", { cevaplar: c, ekipman: {}, tarih: { bas: "2026-10-14T09:30", bit: "", sonraki: "2027-10-14", takip: "", rapor: "2026-10-14" },
    cihazlar: [{ turId: "t1", turAd: "Topraklama ölçer", secili: "c1", secenekler: [{ id: "c1", kod: "C-01", ad: "Marka M" }, { id: "c2", kod: "C-02", ad: "" }] }, { turAd: "eksik" }] })!;
  assert.match(h, /^- tarih:bas · Periyodik kontrol başlangıç tarihi ve saati \(tarih ve saat: GG\.AA\.YYYY SS:DD\) = "14\.10\.2026 09:30"$/m);
  assert.match(h, /^- tarih:bit · .* = —$/m);
  assert.match(h, /^- cihaz:t1 · Topraklama ölçer = "C-01"; seçilebilir: C-01 \(Marka M\), C-02$/m);
  assert.ok(!/Gizli/.test(h), "künyenin değeri gitmez");
});

test("haritadaki her yer kimliği ekranın uygulayıcısında tanınır", () => {
  const h = raporHaritasi(T, "Elektrik iç tesisatı", { cevaplar: Cevaplar.parse({}), ekipman: {} })!;
  const h2 = raporHaritasi(T, "Elektrik iç tesisatı", { cevaplar: Cevaplar.parse({}), ekipman: {}, tarih: { bas: "", bit: "", sonraki: "", takip: "", rapor: "" },
    cihazlar: [{ turId: "t1", turAd: "Ölçer", secili: null, secenekler: [] }] })!;
  const yerler = [...h2.matchAll(/^- ((?:[eadmk]:[^ ]+)|(?:tarih|cihaz):[^ ]+|sonuc|yorum) · /gm)].map((x) => x[1]);
  assert.ok(yerler.some((y) => y.startsWith("k:")) && yerler.some((y) => y.startsWith("tarih:")) && yerler.some((y) => y.startsWith("cihaz:")), "557 yerleri haritada");
  assert.ok(yerler.length > 20, `yer sayısı ${yerler.length}`);
  for (const yer of yerler) {
    const u = komutlariUygula({ ekipman: {}, cevaplar: Cevaplar.parse({}), tarih: { bas: "", bit: "", sonraki: "", takip: "", rapor: "" } }, T, [{ yer, deger: "" }],
      { cihazlar: [{ turId: "t1", turAd: "Ölçer", secili: null, secenekler: [] }] });
    assert.ok(!u.gecersiz.some((g) => /yer yok|madde yok|satırı yok/.test(g)), `${yer}: ${u.gecersiz.join(" | ")}`);
  }
  const tablolar = [...h.matchAll(/hücre kimliği t:([^:]+):/g)].map((x) => x[1]);
  for (const b of tablolar) {
    const s = (T.bolumler.find((x) => x.id === b) as { sutunlar: { id: string; formul?: string }[] }).sutunlar.find((x) => !x.formul)!;
    assert.deepEqual(komutlariUygula({ ekipman: {}, cevaplar: Cevaplar.parse({}) }, T, [{ yer: `t:${b}:1:${s.id}`, deger: "" }]).gecersiz, [], b);
  }
});

test("şemaya uymayan cevap harita üretmez; çok büyük rapor sınırda kısalır", () => {
  assert.equal(raporHaritasi(T, "x", { cevaplar: { alan: 5 }, ekipman: {} }), null);
  const satirlar = Array.from({ length: 300 }, () => Object.fromEntries((linye && linye.blok === "olcum" ? linye.sutunlar : []).map((s) => [s.id, "x".repeat(190)])));
  const h = raporHaritasi(T, "x", { cevaplar: { ...Cevaplar.parse({}), tablo: { linye: satirlar } }, ekipman: {} })!;
  assert.ok(h.length <= HARITA_SINIRI + 100, String(h.length));
  assert.match(h, /… ve 180 satır daha|kısaltıldı/);
});
