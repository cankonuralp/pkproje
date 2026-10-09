/* NEREDEN GELDİ: maket ekipman-turleri.html yirmi dördüncü tur (reisim 2026-09-27: "ekipmana göre hangi cihazların kullanılacağı ekipman
   türlerinden belirlenecek"; kontrol metodu standartları türde seçilir) · pkproje §11 303 (standart türe NUMARAYLA bağlanır, yeni sürüm türe
   kendiliğinden geçer) · reisim 2026-10-04: "rol değiştirme sızma veri çalma". GERÇEK PostgreSQL, iki firma. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { standartYukle } from "../src/modules/dokumanlar/server/dokumanlar.ts";
import { baglantiKaydet, baglantiSecenekleri, standardiKullananTurler, turKaydet, turKarti, type Kisi } from "../src/modules/ekipman-turleri/server/turler.ts";
import { cihazKaydet } from "../src/modules/olcum-cihazlari/server/cihazlar.ts";
import { BAKANLIK_STANDARTLARI } from "../src/tanim/standartlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "tb-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, DENETCI: Kisi, YON_B: Kisi;
let tur: string, ctA: string, ctB: string;
const PDF = { ad: "std.pdf", bayt: new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n") };
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const C = (kod: string, yeniTur: string) => ({ kod, tur: "yeni", yeniTur, marka: "", model: "", seri: "", aralik: "" });

async function hesapli(firma: string, eposta: string, roller: string[]) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, roller]))).rows[0].id;
}
const a = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, A, is);
const b = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is);

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  YON = kisi(await hesapli(A, "yonetici@deneme.example", ["firma_yoneticisi"]), "firma_yoneticisi");
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"]), "denetci");
  YON_B = kisi(await hesapli(B, "yonetici@deneme-b.example", ["firma_yoneticisi"]), "firma_yoneticisi");
  tur = tamam(await a((db) => turKaydet(db, YON, null, 0, { ad: "Deneme Vinç", kod: "DV", grup: "kaldirma", brans: "", periyot: "12", sure: "" }))).id;
  tamam(await a((db) => cihazKaydet(db, YON, null, 0, C("OC-1", "Yük hücresi"))));
  tamam(await b((db) => cihazKaydet(db, YON_B, null, 0, C("OC-1", "B türü"))));
  ctA = (await a((db) => db.sorgu<{ id: string }>("SELECT id::text FROM cihaz_turu"))).rows[0].id;
  ctB = (await b((db) => db.sorgu<{ id: string }>("SELECT id::text FROM cihaz_turu"))).rows[0].id;
  tamam(await a((db) => standartYukle(db, depo, YON, A, { no: "TS EN 280", surum: "2016", konu: "Deneme konu" }, PDF)));
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("bağlantı: standart numarayla, cihaz türü kimlikle; yeni standart sürümü türe kendiliğinden geçer", async () => {
  let k = (await a((db) => turKarti(db, YON, tur)))!;
  assert.deepEqual([k.standartlar, k.cihazTurleri], [[], []]);
  const eskiSurum = k.surum;
  tamam(await a((db) => baglantiKaydet(db, YON, tur, k.surum, { standartlar: ["TS EN 280", "TS EN 280"], cihazTurleri: [ctA] })));
  k = (await a((db) => turKarti(db, YON, tur)))!;
  assert.deepEqual(k.standartlar.map((s) => `${s.no}:${s.surumAdi}`), ["TS EN 280:2016"]);
  assert.deepEqual(k.cihazTurleri.map((c) => c.ad), ["Yük hücresi"]);
  tamam(await a((db) => standartYukle(db, depo, YON, A, { no: "TS EN 280", surum: "2020", konu: "Deneme konu" }, PDF)));
  assert.deepEqual((await a((db) => turKarti(db, YON, tur)))!.standartlar.map((s) => s.surumAdi), ["2020"], "yeni sürüm türe geçti");
  assert.deepEqual((await a((db) => standardiKullananTurler(db, "TS EN 280"))).map((t) => t.ad), ["Deneme Vinç"]);
  assert.deepEqual(await a((db) => baglantiKaydet(db, YON, tur, eskiSurum, { standartlar: [], cihazTurleri: [] })), { durum: "cakisma" });
});

test("ret: kütüphanede olmayan standart, başka firmanın cihaz türü; yalnız 'değiştirir'; başka firma türü değiştiremez", async () => {
  const k = (await a((db) => turKarti(db, YON, tur)))!;
  assert.deepEqual(await a((db) => baglantiKaydet(db, YON, tur, k.surum, { standartlar: ["TS EN 999"], cihazTurleri: [] })), { durum: "gecersiz", hatalar: { standartlar: "Standart kütüphanede yok." } });
  assert.deepEqual(await a((db) => baglantiKaydet(db, YON, tur, k.surum, { standartlar: [], cihazTurleri: [ctB] })), { durum: "gecersiz", hatalar: { cihazTurleri: "Cihaz türü bulunamadı." } });
  assert.deepEqual(await a((db) => baglantiKaydet(db, DENETCI, tur, k.surum, { standartlar: [], cihazTurleri: [] })), { durum: "yetkisiz" });
  assert.equal(await a((db) => baglantiSecenekleri(db, DENETCI)), null);
  assert.deepEqual(await b((db) => baglantiKaydet(db, YON_B, tur, k.surum, { standartlar: [], cihazTurleri: [ctB] })), { durum: "yok" });
  assert.deepEqual(await b((db) => standardiKullananTurler(db, "TS EN 280")), []);
  await assert.rejects(a((db) => db.sorgu("UPDATE ekipman_turu SET kontrol_std = array_fill('X'::text, ARRAY[21])")), /check/i);
});

/* 2026-10-09 (440): Bakanlık listesindeki standart kütüphaneye yüklenmeden de türe bağlanır (hazır kurulum bağlar; pencerede "yüklenmedi"),
   türde seçili olup kütüphanede olmayan standart kayıtta kalabilir (pencere düşürmesin); seçenekler branşıyla */
test("440 bağlantı: Bakanlık standardı yüklenmeden seçilir; seçenekler branşı ve yüklü bilgisiyle; seçili olan kalabilir", async () => {
  const sec = (await a((db) => baglantiSecenekleri(db, YON)))!;
  assert.deepEqual(sec.standartlar.find((s) => s.no === "TS EN 280"), { no: "TS EN 280", konu: "Deneme konu", brans: "m", yuklu: true });
  assert.deepEqual(sec.standartlar.find((s) => s.no === "TS HD 60364-6"), { no: "TS HD 60364-6", konu: BAKANLIK_STANDARTLARI.find((h) => h.no === "TS HD 60364-6")!.konu, brans: "e", yuklu: false });
  let k = (await a((db) => turKarti(db, YON, tur)))!;
  tamam(await a((db) => baglantiKaydet(db, YON, tur, k.surum, { standartlar: ["TS HD 60364-6", "TS EN 280"], cihazTurleri: [] })));
  k = (await a((db) => turKarti(db, YON, tur)))!;
  assert.deepEqual(k.standartlar.map((s) => [s.no, s.id === null]), [["TS HD 60364-6", true], ["TS EN 280", false]], "yüklenmemiş: kütüphane kimliği yok");
  /* listede olmayan ama türde seçili olan (ör. kütüphaneden kaldırılmış) kayıtta kalabilir; yenisi eklenemez */
  await a((db) => db.sorgu("UPDATE ekipman_turu SET kontrol_std = kontrol_std || ARRAY['TS EN 999'], surum = surum + 1 WHERE id = $1", [tur]));
  k = (await a((db) => turKarti(db, YON, tur)))!;
  tamam(await a((db) => baglantiKaydet(db, YON, tur, k.surum, { standartlar: ["TS EN 999"], cihazTurleri: [] })));
  k = (await a((db) => turKarti(db, YON, tur)))!;
  assert.deepEqual(await a((db) => baglantiKaydet(db, YON, tur, k.surum, { standartlar: ["TS EN 999", "TS EN 998"], cihazTurleri: [] })),
    { durum: "gecersiz", hatalar: { standartlar: "Standart kütüphanede yok." } });
});
