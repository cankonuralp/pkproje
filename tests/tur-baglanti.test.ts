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
import { elleStandartlar, elleStandartSil, standartYukle } from "../src/modules/dokumanlar/server/dokumanlar.ts";
import { baglantiKaydet, baglantiSecenekleri, formatStandartlariniBagla, standardiKullananTurler, standartElleEkle, turKaydet, turKarti, type Kisi } from "../src/modules/ekipman-turleri/server/turler.ts";
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

/* 2026-10-26 (göç 0107 — reisim: "bu ekranda sadece dökümanlarda ekli olan standartlar gözüküyor burada el ile ekleme olmalı", "PDF'ten şablon
   kurulunca formatta yazan standartlar da türe kendiliğinden eklenecek eğer standartlar kütüphanede yok ise el ile ekleme yöntemi ile eklenecek") */
test("elle standart: listede olmayan eklenir (türün branşıyla), seçeneklerde ve bağlantıda geçerli; kütüphanedeki yeniden eklenmez; değişmez; B görmez; kullanılan silinmez", async () => {
  const e = tamam(await a((db) => standartElleEkle(db, YON, tur, { no: " ts en 99999-2 ", konu: "Deneme elle standart" })));
  assert.deepEqual(e.secenek, { no: "TS EN 99999-2", konu: "Deneme elle standart", brans: "m", yuklu: false });
  assert.equal((await a((db) => standartElleEkle(db, DENETCI, tur, { no: "TS EN 99998", konu: "x y" }))).durum, "yetkisiz");
  assert.equal((await a((db) => standartElleEkle(db, YON, tur, { no: "12", konu: "x y" }))).durum, "gecersiz");
  const k = tamam(await a((db) => standartElleEkle(db, YON, tur, { no: "TS EN 280", konu: "Başka ad" })));
  assert.deepEqual(k.secenek, { no: "TS EN 280", konu: "Deneme konu", brans: "m", yuklu: true }, "kütüphanedeki olduğu gibi döner");
  assert.deepEqual((await a((db) => elleStandartlar(db))).map((x) => x.no), ["TS EN 99999-2"]);
  assert.ok((await a((db) => baglantiSecenekleri(db, YON)))!.standartlar.some((x) => x.no === "TS EN 99999-2" && !x.yuklu));
  let kart = (await a((db) => turKarti(db, YON, tur)))!;
  tamam(await a((db) => baglantiKaydet(db, YON, tur, kart.surum, { standartlar: [...kart.standartlar.map((x) => x.no), "TS EN 99999-2"], cihazTurleri: kart.cihazTurleri.map((x) => x.id) })));
  assert.equal((await b((db) => db.sorgu("SELECT 1 FROM standart_tanim"))).rowCount, 0, "B, A'nın elle eklediğini görmez");
  await assert.rejects(a((db) => db.sorgu("UPDATE standart_tanim SET konu = 'değişti'")), /değişmez/);
  const id = (await a((db) => elleStandartlar(db)))[0].id;
  const sil = () => kiraciIcinde(havuz, A, (db) => elleStandartSil(db, YON, id), { hesapId: YON.id });
  assert.deepEqual(await sil(), { durum: "red", neden: "Standart silinemez: 1 ekipman türünün kontrol metodunda seçili." });
  kart = (await a((db) => turKarti(db, YON, tur)))!;
  tamam(await a((db) => baglantiKaydet(db, YON, tur, kart.surum, { standartlar: kart.standartlar.map((x) => x.no).filter((n) => n !== "TS EN 99999-2"), cihazTurleri: kart.cihazTurleri.map((x) => x.id) })));
  assert.deepEqual(await sil(), { durum: "tamam", ad: "TS EN 99999-2" });
  assert.deepEqual(await a((db) => elleStandartlar(db)), []);
});

test("formattaki standartlar türe bağlanır: kütüphanedeki ve Bakanlık'taki olduğu gibi, olmayan elle eklenir (adı yoksa numarası); var olan kalır; yetkisiz kişide hiçbir şey", async () => {
  const bak = BAKANLIK_STANDARTLARI[0];
  const once = (await a((db) => turKarti(db, YON, tur)))!.standartlar.map((x) => x.no);
  assert.deepEqual(await a((db) => formatStandartlariniBagla(db, DENETCI, tur, [{ no: "TS EN 77777", konu: "" }])), []);
  const yeni = await a((db) => formatStandartlariniBagla(db, YON, tur, [{ no: "TS EN 280", konu: "" }, { no: bak.no, konu: "" }, { no: "TS EN 77777", konu: "" }, { no: "TS EN 77777", konu: "x" }]));
  assert.deepEqual(yeni, ["TS EN 280", bak.no, "TS EN 77777"].filter((n) => !once.includes(n)));
  assert.deepEqual((await a((db) => turKarti(db, YON, tur)))!.standartlar.map((x) => x.no), [...once, ...yeni]);
  assert.deepEqual((await a((db) => elleStandartlar(db))).map((x) => [x.no, x.konu]), [["TS EN 77777", "TS EN 77777"]]);
  assert.deepEqual(await a((db) => formatStandartlariniBagla(db, YON, tur, [{ no: "TS EN 77777", konu: "" }])), [], "ikinci kez bağlanmaz");
});
