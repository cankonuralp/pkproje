/* NEREDEN GELDİ: 2026-11-09 — reisim: "senesi yaklaşan aranması gereken müşteriler için teklifler de teklif hazırla tuşunun yanına yaklaşan muayeneler tuşu olsun ve
   orada sadece gelecek muayenesine son 2 ay kalan müşteriler - tesisler gözüksün uyarı balonu olsun"; "teklif gönder diyince ön izleme ile müşterinin mailine
   gönderilecek mail düzenlenebilsin"; "telefonda pdf ön izlemesi ekrana sığmıyor". Saf: 2 aylık aralık, geçen 2 ay, açık plan, balon sayısı, e-postanın hazır metni ve
   girdi kuralları, kâğıdın ölçeği; kaynak kilidi: önizleme tek üreticiden. Veritabanıyla: tests/teklifler.test.ts. Olumsuz kanıt: tests/bozan/yaklasan.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { belgeOlcegi, KAGIT_GENISLIGI } from "../src/components/belge-onizleme/olcek.ts";
import { dogrula } from "../src/sema/ortak.ts";
import { teklifEpostasi, TeklifEpostaGirdisi } from "../src/modules/teklifler/sema.ts";
import { ayEkle, buDonemTeklifi, kalanYazi, teklifBekliyor, yaklasanSayilari, yaklasanTesisler } from "../src/modules/teklifler/yaklasan.ts";
import { onizlemeKacaklari } from "./yardimci/belge-onizleme.ts";

const BUGUN = "2026-11-09";
const e = (tesisId: string, sonraki: string | null, turId = "t1") => ({ tesisId, turId, sonraki });

test("yalnız son 2 ay: 2 aydan uzak tarih listede yok, sınır dahil; tarih yoksa sayılmaz", () => {
  const l = yaklasanTesisler([e("uzak", "2027-01-10"), e("sinir", "2027-01-09"), e("yakin", "2026-12-01"), e("bos", null)], BUGUN);
  assert.deepEqual(l.map((x) => x.tesisId), ["yakin", "sinir"]);
  assert.equal(l[1].kalan, 61);
});

test("tarihi geçen 2 ay daha 'geçti' olarak kalır, daha eskisi düşer", () => {
  const l = yaklasanTesisler([e("gecen", "2026-11-01"), e("sinir", "2026-09-09"), e("eski", "2026-09-08")], BUGUN);
  assert.deepEqual(l.map((x) => [x.tesisId, x.kalan]), [["sinir", -61], ["gecen", -8]]);
});

test("tesis başına: en yakın tarih, aralığa giren / toplam ekipman, türler; eski bir ekipman tarihi tesisin tarihini bozmaz", () => {
  const l = yaklasanTesisler([e("a", "2026-12-20", "t1"), e("a", "2026-12-01", "t2"), e("a", "2027-08-01", "t1"), e("a", "2020-01-01", "t3")], BUGUN);
  assert.equal(l.length, 1);
  assert.deepEqual([l[0].sonraki, l[0].ekipman, l[0].toplam, [...l[0].turler].sort()], ["2026-12-01", 2, 4, ["t1", "t2"]]);
});

test("açık planı olan tesis listede yok", () => {
  assert.deepEqual(yaklasanTesisler([e("a", "2026-12-01"), e("b", "2026-12-02")], BUGUN, new Set(["a"])).map((x) => x.tesisId), ["b"]);
});

test("balon yalnız teklif bekleyeni sayar: yok, taslak, süresi dolmuş; gönderilen / kabul / red saymaz; geçen kırmızı, yaklaşan sarı", () => {
  assert.deepEqual([null, "taslak", "suresi", "gonderildi", "kabul", "red"].map((d) => teklifBekliyor(d as Parameters<typeof teklifBekliyor>[0])), [true, true, true, false, false, false]);
  assert.deepEqual(yaklasanSayilari([{ kalan: -3, bekliyor: true }, { kalan: 0, bekliyor: true }, { kalan: 20, bekliyor: true }, { kalan: -9, bekliyor: false }, { kalan: 9, bekliyor: false }]), { gecen: 1, yaklasan: 2 });
});

test("bu dönemin teklifi: muayeneden en çok 3 ay önce; geçen yılın teklifi sayılmaz", () => {
  assert.equal(buDonemTeklifi("2026-09-01", "2026-12-01"), true);
  assert.equal(buDonemTeklifi("2026-08-31", "2026-12-01"), false);
  assert.equal(buDonemTeklifi("2025-11-20", "2026-12-01"), false);
  assert.equal(ayEkle("2026-11-09", 2), "2027-01-09");
  assert.deepEqual([kalanYazi(0), kalanYazi(3), kalanYazi(-5)], ["Bugün", "3 gün kaldı", "5 gün geçti"]);
});

test("e-postanın hazır metni: ilgili kişi, tesis, muayene günü, tutar + KDV, gönderen; kişi yoksa ünvan", () => {
  const b = { firma: "Deneme Muayene", no: "T-1126-001", unvan: "Deneme A.Ş.", ilgili: "Deneme Yetkili", tesisler: ["Merkez", "Depo"], tutar: 100000, kdv: 20, gecerlilik: 30, muayene: "2026-12-01", gonderen: "Deneme Planlama" };
  const m = teklifEpostasi(b);
  assert.equal(m.konu, "Deneme Muayene · T-1126-001 periyodik kontrol teklifi");
  for (const p of ["Sayın Deneme Yetkili,", "Merkez, Depo için periyodik kontrol", "kontrol tarihi: 01.12.2026", "Tutar: 1.000,00 TL + KDV (KDV dahil 1.200,00 TL)", "Geçerlilik: 30 gün", "Deneme Planlama\nDeneme Muayene"]) assert.ok(m.govde.includes(p), p);
  const n = teklifEpostasi({ ...b, ilgili: null, tesisler: [], muayene: null });
  assert.ok(n.govde.startsWith("Sayın Deneme A.Ş.,") && n.govde.includes("\nPeriyodik kontrol hizmeti") && !n.govde.includes("kontrol tarihi"));
});

test("gönderim girdisi: alıcı 1–5 ve geçerli, tekrar yok; konu / ileti boş olamaz, verilmezse hazır metin; konu tek satır", () => {
  const h = (g: unknown) => { const r = dogrula(TeklifEpostaGirdisi, g); return r.tamam ? null : r.hatalar; };
  for (const kime of [[], ["x"], ["a@b.example", "A@b.example"], Array.from({ length: 6 }, (_, i) => `k${i}@b.example`)]) assert.ok(h({ kime }), JSON.stringify(kime));
  assert.equal(h({ kime: ["a@b.example"] }), null, "metin verilmezse hazır metin");
  assert.ok(h({ kime: ["a@b.example"], konu: "  " })?.konu);
  assert.ok(h({ kime: ["a@b.example"], govde: " \n " })?.govde);
  const r = dogrula(TeklifEpostaGirdisi, { kime: ["a@b.example"], konu: "Bir\r\nİki", govde: "Satır\n\nSatır" });
  assert.ok(r.tamam);
  if (r.tamam) assert.deepEqual([r.veri.konu, r.veri.govde], ["Bir İki", "Satır\n\nSatır"]);
});

test("kâğıt kaba sığar: dar kapta küçülür, yuvarlama taşırmaz; geniş kapta büyümez", () => {
  assert.equal(belgeOlcegi(KAGIT_GENISLIGI + 400), 1);
  assert.equal(belgeOlcegi(KAGIT_GENISLIGI), 1);
  assert.equal(belgeOlcegi(0), 1, "ölçülemeyen kap");
  for (const w of [320, 343, 375, 600, 793]) { const o = belgeOlcegi(w); assert.ok(o < 1 && KAGIT_GENISLIGI * o <= w, String(w)); }
});

test("belge önizlemesi tek üreticiden: rb-onizleme sınıfı başka yerde elle yazılmaz", () => {
  assert.deepEqual(onizlemeKacaklari(), []);
});
