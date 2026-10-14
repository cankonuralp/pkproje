/* NEREDEN GELDİ: 550 — S.A.Y kuralsız (sunum 546 K6; reisim 2026-10-14: "yapay zeka asistanı S.A.Y. de herhangi bir kısıt kural vb olmasını
   istemiyorum oradan direk haiku ile konuşmak aynı claud kullanır gibi"). 384'teki özetin (yalnız adlar ve sayılar) yerine RAPOR HARİTASI: Haiku
   rapora istenen girişi yer kimlikleriyle yazar. Saf, ZPKR02 şablonuyla:
   · haritada ekipman / bilgi / test alanları, tablo (sütun kimlikleri, satırlar), kontrol maddeleri (cevap seçenekleri), sonuç, yorum — ŞU ANKİ
     değerleriyle (kaydedilmemiş değişiklik dahil); künye (firma, müşteri, tesis, adres) GİTMEZ;
   · haritadaki HER yer kimliği ekranın uygulayıcısında (raporlar/say-doldur.ts komutlariUygula) tanınır — ikisi aynı listeden kopmasın;
   · şemaya uymayan cevap harita üretmez; çok büyük rapor sınırda kısalır. */
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
  assert.ok(!h.includes("Gizli Müşteri"), "künye gitmez");
});

test("haritadaki her yer kimliği ekranın uygulayıcısında tanınır", () => {
  const h = raporHaritasi(T, "Elektrik iç tesisatı", { cevaplar: Cevaplar.parse({}), ekipman: {} })!;
  const yerler = [...h.matchAll(/^- ((?:[eadm]:[^ ]+)|sonuc|yorum) · /gm)].map((x) => x[1]);
  assert.ok(yerler.length > 20, `yer sayısı ${yerler.length}`);
  for (const yer of yerler) {
    const u = komutlariUygula({ ekipman: {}, cevaplar: Cevaplar.parse({}) }, T, [{ yer, deger: "" }]);
    assert.ok(!u.gecersiz.some((g) => /yer yok|madde yok/.test(g)), `${yer}: ${u.gecersiz.join(" | ")}`);
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
