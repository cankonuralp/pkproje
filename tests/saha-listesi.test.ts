/* NEREDEN GELDİ: 2026-11-08 SAHA LİSTESİ (sunum claude.ai 4ApGDVAfUgvm8C5nTSRVbh sürüm 2 — reisim: "rapor açıp tek tek ekipman için kontrol etmekten çok farksız değil daha hızlı olabilir",
   "say asistana oku demediği sürece okumaz ve sonuçta token gitmez", "yap"; K1–K6 önerilerle). Saf kurallar:
   · Uygun → bütün maddeler uygun (önceki rapordan gelen olumsuz seçim de ezilir), sonuç uygun; Değil → seçilenler olumsuz (cevap setinin 2. öğesi) + not, kalanlar uygun, sonuç uygun değil;
     formüllü madde yazılmaz; formatta madde yoksa not raporun yorumuna; bilinmeyen madde söylenir;
   · K1: "Kalanları uygun işaretle" işaretli satıra dokunmaz; raporda girilecekler ölçüm / test bölümleri; saatler çakışmasız sıralanır;
   · K3 K4: tahmini tutar canlı ölçümle tutarlı (10 fotoğraf + 2 yazı ≈ 0,03 $), komut kişinin yazacağı cümle; K6: bant bugünü kapsayan planı, yoksa en yakın tarihliyi seçer, kişinin seçimi önce.
   Rapor açma + yazma gerçek PostgreSQL'de tests/raporlar.test.ts; kuyruk tests/kuyruk.test.ts; uçtan uca e2e/saha-listesi.spec.ts. Olumsuz kanıt: tests/bozan/saha-listesi.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { Cevaplar, type FormatTanimi } from "../src/format/tanim.ts";
import { girilecekler, kalanlariUygun, maddeAra, sahaBaslangici, sahaCevaplari, sahaMaddeleri, SahaRaporuGirdisi, type SahaIsareti } from "../src/modules/raporlar/saha-listesi.ts";
import { bantPlani, okuKomutu, tahminiTutar, tahminMetni, tutarMetni, type BantPlani } from "../src/modules/say-chat/saha.ts";

const CEVAP = ["Uygun", "Uygun Değil", "Kapsam Dışı"];
const madde = (id: string, metin: string, formul?: string) => ({ id, metin, kilit: false, ...(formul ? { formul } : {}) });
const T = { bolumler: [
  { blok: "liste", id: "l1", ad: "Kontrol", cevaplar: CEVAP, gruplar: [{ id: "g1", ad: "Halat", maddeler: [madde("m1", "Taşıyıcı halat durumu"), madde("m2", "Makara"), madde("m3", "Hesaplı", "=1")] }, { id: "g2", ad: "Emniyet", maddeler: [madde("m4", "Acil durdurma")] }] },
  { blok: "olcum", id: "o1", ad: "Yük deneyi" },
  { blok: "test", id: "t1", ad: "Basınç testi" },
  { blok: "foto", id: "f1", ad: "Fotoğraflar" },
] } as unknown as Pick<FormatTanimi, "bolumler">;
const BOS = Cevaplar.parse({});

test("Uygun: bütün maddeler uygun — önceki rapordan gelen olumsuz seçim de ezilir; formüllü madde yazılmaz; sonuç uygun", () => {
  const c = Cevaplar.parse({ madde: { m1: { c: "Uygun Değil", not: "eski" }, m2: { c: "Kapsam Dışı" } }, yorum: "eski yorum" });
  const r = sahaCevaplari(T, c, { sonuc: "uygun", maddeler: ["m1"], not: "yok sayılır" });
  assert.deepEqual(r.cevaplar.madde, { m1: { c: "Uygun" }, m2: { c: "Uygun" }, m4: { c: "Uygun" } });
  assert.equal(r.cevaplar.sonuc, "uygun");
  assert.equal(r.cevaplar.yorum, "eski yorum", "uygunda yorum değişmez");
  assert.deepEqual(r.bilinmeyen, []);
});

test("Değil: seçilenler cevap setinin 2. öğesi + not, kalanlar uygun; sonuç uygun değil; birden çok madde", () => {
  const r = sahaCevaplari(T, BOS, { sonuc: "degil", maddeler: ["m1", "m4"], not: "Aşınmış" });
  assert.deepEqual(r.cevaplar.madde, { m1: { c: "Uygun Değil", not: "Aşınmış" }, m2: { c: "Uygun" }, m4: { c: "Uygun Değil", not: "Aşınmış" } });
  assert.equal(r.cevaplar.sonuc, "uygun_degil");
  assert.equal(r.cevaplar.yorum, "", "not maddede; yoruma yazılmaz");
});

test("formatta madde yoksa ya da madde bulunamadıysa not kaybolmaz: raporun yorumuna; bulunamayan söylenir; formüllü madde seçilemez", () => {
  const yok = { bolumler: [{ blok: "olcum", id: "o1", ad: "Ölçüm" }] } as unknown as Pick<FormatTanimi, "bolumler">;
  const r = sahaCevaplari(yok, BOS, { sonuc: "degil", maddeler: [], not: "Kablo ezik" });
  assert.equal(r.cevaplar.yorum, "Kablo ezik");
  assert.equal(r.cevaplar.sonuc, "uygun_degil");
  const b = sahaCevaplari(T, BOS, { sonuc: "degil", maddeler: ["yok", "m3"], not: "x" });
  assert.deepEqual(b.bilinmeyen, ["yok", "m3"]);
  assert.equal(b.cevaplar.yorum, "x");
  assert.deepEqual(sahaMaddeleri(T).map((m) => m.id), ["m1", "m2", "m4"], "formüllü madde listede yok");
});

test("kuyruk girdisi şemadan geçer: sonuç iki değerli, madde ve fotoğraf sınırlı; varsayılanlar boş", () => {
  const P = "11111111-1111-4111-8111-111111111111";
  assert.deepEqual(SahaRaporuGirdisi.parse({ plan: P, ekipman: P, sonuc: "uygun" }), { plan: P, ekipman: P, sonuc: "uygun", maddeler: [], not: null, sohbet: [] });
  assert.equal(SahaRaporuGirdisi.safeParse({ plan: P, ekipman: P, sonuc: "belki" }).success, false);
  assert.equal(SahaRaporuGirdisi.safeParse({ plan: "x", ekipman: P, sonuc: "uygun" }).success, false);
  assert.equal(SahaRaporuGirdisi.safeParse({ plan: P, ekipman: P, sonuc: "degil", maddeler: Array(21).fill("m") }).success, false);
});

test("K1: Kalanları uygun işaretle yalnız işaretsizi işaretler; madde araması; raporda girilecekler; saatler çakışmasız", () => {
  const degil: SahaIsareti = { sonuc: "degil", maddeler: ["m1"], not: "n", sohbet: ["s"] };
  const y = kalanlariUygun({ a: degil }, ["a", "b"]);
  assert.equal(y.a, degil, "işaretli satıra dokunmaz");
  assert.equal(y.b!.sonuc, "uygun");
  assert.deepEqual(maddeAra(sahaMaddeleri(T), "HALAT").map((m) => m.id), ["m1", "m2"], "grup adında da; Türkçe küçük harf");
  assert.deepEqual(maddeAra(sahaMaddeleri(T), "acil durd").map((m) => m.id), ["m4"]);
  assert.equal(maddeAra(sahaMaddeleri(T), "").length, 3);
  assert.deepEqual(girilecekler(T), ["Yük deneyi", "Basınç testi"]);
  assert.equal(sahaBaslangici("08:30", null), "08:30");
  assert.equal(sahaBaslangici("08:30", "08:00"), "08:30", "önceki rapor mesaiden önce bittiyse mesai");
  assert.equal(sahaBaslangici("08:30", "09:15"), "09:15", "önceki raporun bitişinden devam");
});

test("K3 K4: tahmin canlı ölçümle tutarlı; tutar metni; komut kişinin yazacağı cümle", () => {
  assert.ok(Math.abs(tahminiTutar(10, 2) - 0.034) < 0.001, "10 fotoğraf + 2 yazı: ölçüm 0,034 $ (2026-11-07)");
  assert.equal(tahminMetni(10, 2), "≈ 0,03 $");
  assert.equal(tahminMetni(0, 1), "≈ 0,01 $", "en az bir sent");
  assert.equal(tutarMetni(0.0339), "0,03 $");
  assert.equal(tutarMetni(0.004), "0,01 $'dan az");
  assert.equal(okuKomutu("P-1126-005"), "Chatten oku, P-1126-005 planına yaz");
  assert.equal(okuKomutu(null), "Chatten oku");
});

test("K6: bant — kişinin seçimi önce; yoksa bugünü kapsayan; yoksa en yakın tarihli; plan yoksa null", () => {
  const p = (id: string, baslangic: string, bitis = baslangic): BantPlani => ({ id, no: id, tesis: "t", baslangic, bitis, kalan: 1 });
  const l = [p("gelecek", "2026-11-20"), p("bugun", "2026-11-06", "2026-11-09"), p("eski", "2026-10-01")];
  assert.equal(bantPlani(l, "2026-11-08", null)?.id, "bugun");
  assert.equal(bantPlani(l, "2026-11-08", "eski")?.id, "eski", "seçim");
  assert.equal(bantPlani(l, "2026-11-08", "silinmis")?.id, "bugun", "seçilen listede yoksa");
  assert.equal(bantPlani([p("gelecek", "2026-11-20"), p("eski", "2026-10-01")], "2026-11-08", null)?.id, "gelecek", "12 gün sonrası 38 gün öncesinden yakın");
  assert.equal(bantPlani([], "2026-11-08", null), null);
});
