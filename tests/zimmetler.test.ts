/* NEREDEN GELDİ: maket zimmetler.html (M4 2. tur; 62 fotoğraf isteğe bağlı, 63 ayrı depo rolü yok, 59 kalibrasyonu geçmiş cihaz zimmette kalabilir) ·
   KOD-GECIS §4 (Zimmetler: yöneticiler değiştirir, planlama görür, denetçi kendi zimmeti, muhasebe görmez) · reisim 2026-10-04: "rol değiştirme
   sızma veri çalma". Her teslim değişmez kayıt; teslim eden sunucuda "kimde"den. GERÇEK PostgreSQL, iki firma. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { cihazKaydet, cihazKarti, cihazKonum, cihazListesi } from "../src/modules/olcum-cihazlari/server/cihazlar.ts";
import { personelAyrildi, personelEkle } from "../src/modules/personel/server/personel.ts";
import { demirbasEkle, FotoHatasi, teslimEt, varlikKarti, zimmetListeleri, type Kisi } from "../src/modules/zimmetler/server/zimmet.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "zimmet-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, PLAN: Kisi, DENETCI: Kisi, MUH: Kisi, YON_B: Kisi;
let pDenetci: string, pIkinci: string;
const P = { ad: "Deneme Kişi", eposta: "", imzaTel: "", basla: "2024-02-01", meslek: "elk-muh", meslekMetin: "", diploma: "", oda: "", ekipnet: "" };
const bayt = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const seg = (isaret: number, govde: string) => bayt([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 0xff], govde);
/* uydurma JPEG (tests/dosya.test.ts ile aynı yapı): JFIF + tablo + tarama */
const JPEG = bayt([0xff, 0xd8], [...seg(0xe0, "JFIF\0\x01\x01")], [...seg(0xdb, "\0" + "\x01".repeat(64))], [0xff, 0xda, 0, 2], "goruntu-verisi", [0xff, 0xd9]);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const T = (varlik: string, alan: string, saat = "10:00") => ({ varlik, alan, zaman: `2026-10-01T${saat}`, notu: "" });

async function hesapli(firma: string, eposta: string, roller: string[], personelId: string | null = null) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [eposta, roller, personelId]))).rows[0].id;
}
const a = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, A, is);
const b = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is);
let cihaz: string, demirbas: string;

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  YON = kisi(await hesapli(A, "yonetici@deneme.example", ["firma_yoneticisi"]), "firma_yoneticisi");
  PLAN = kisi(await hesapli(A, "planlama@deneme.example", ["planlama"]), "planlama");
  MUH = kisi(await hesapli(A, "muhasebe@deneme.example", ["muhasebe"]), "muhasebe");
  YON_B = kisi(await hesapli(B, "yonetici@deneme-b.example", ["firma_yoneticisi"]), "firma_yoneticisi");
  pDenetci = tamam(await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme Denetçi" }))).id;
  pIkinci = tamam(await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme İkinci" }))).id;
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"], pDenetci), "denetci");
  cihaz = tamam(await a((db) => cihazKaydet(db, YON, null, 0, { kod: "OC-1", tur: "yeni", yeniTur: "Deneme ölçer", marka: "", model: "", seri: "", aralik: "" }))).id;
  demirbas = tamam(await a((db) => demirbasEkle(db, YON, { kod: "dm-1", ad: "Deneme merdiven" }))).id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("teslim: depodan kişiye, kişiden kişiye, depoya; teslim eden sunucuda 'kimde'den; aynı yere teslim ve kalibrasyondaki cihaz reddedilir", async () => {
  const c = `c:${cihaz}`;
  assert.deepEqual((await a((db) => varlikKarti(db, YON, c)))?.kimde, { tip: "depo" });
  tamam(await a((db) => teslimEt(db, depo, YON, A, T(c, pDenetci, "09:00"))));
  let k = (await a((db) => varlikKarti(db, YON, c)))!;
  assert.deepEqual(k.kimde, { tip: "kisi", id: pDenetci, ad: "Deneme Denetçi" });
  assert.deepEqual([k.hareketler[0].eden, k.hareketler[0].alan], ["Depo", "Deneme Denetçi"]);
  assert.deepEqual(await a((db) => teslimEt(db, depo, YON, A, T(c, pDenetci, "09:30"))), { durum: "gecersiz", hatalar: { alan: "Varlık zaten Deneme Denetçi zimmetinde." } });
  tamam(await a((db) => teslimEt(db, depo, YON, A, { ...T(c, pIkinci, "11:00"), eden: "sahte" })));   // istemcinin "eden"i yok sayılır
  k = (await a((db) => varlikKarti(db, YON, c)))!;
  assert.deepEqual([k.hareketler[0].eden, k.hareketler[0].alan], ["Deneme Denetçi", "Deneme İkinci"]);
  tamam(await a((db) => teslimEt(db, depo, YON, A, T(c, "depo", "12:00"))));
  assert.deepEqual(await a((db) => teslimEt(db, depo, YON, A, T(c, "depo", "12:30"))), { durum: "gecersiz", hatalar: { alan: "Varlık zaten depoda." } });
  const kart = (await a((db) => cihazKarti(db, YON, cihaz)))!;
  tamam(await a((db) => cihazKonum(db, YON, cihaz, kart.surum, "lab")));
  assert.deepEqual(await a((db) => teslimEt(db, depo, YON, A, T(c, pDenetci, "13:00"))), { durum: "gecersiz", hatalar: { varlik: "Varlık kalibrasyonda; dönünce depodan teslim edilir." } });
  tamam(await a((db) => cihazKonum(db, YON, cihaz, kart.surum + 1, "depo")));
  const g = await a((db) => teslimEt(db, depo, YON, A, { varlik: "x", alan: "", zaman: "2026-02-30T10:00", notu: "" }));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["alan", "varlik", "zaman"]);
});

test("hareket DEĞİŞMEZ: uygulama rolü güncelleyemez, silemez; ayrılan personele teslim edilmez", async () => {
  await assert.rejects(a((db) => db.sorgu("UPDATE zimmet_hareket SET notu = 'değişti'")), /permission denied|izin/i);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM zimmet_hareket")), /permission denied|izin/i);
  const ayrilan = tamam(await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme Ayrılan" }))).id;
  tamam(await a((db) => personelAyrildi(db, YON, ayrilan, 0, "2026-09-01")));
  assert.deepEqual(await a((db) => teslimEt(db, depo, YON, A, T(`d:${demirbas}`, ayrilan))), { durum: "gecersiz", hatalar: { alan: "Teslim alan seçilmeli." } });
});

test("FOTOĞRAF: yalnız JPEG / PNG; biri reddedilirse teslim hiç kaydedilmez; fotoğrafı hareketi gören açar", async () => {
  const d = `d:${demirbas}`;
  const once = (await a((db) => varlikKarti(db, YON, d)))!.hareketler.length;
  await assert.rejects(a((db) => teslimEt(db, depo, YON, A, T(d, pIkinci, "14:00"), [{ ad: "x.jpg", bayt: JPEG }, { ad: "y.jpg", bayt: new TextEncoder().encode("%PDF-1.4") }])), FotoHatasi);
  assert.equal((await a((db) => varlikKarti(db, YON, d)))!.hareketler.length, once, "teslim geri alındı");
  tamam(await a((db) => teslimEt(db, depo, YON, A, T(d, pDenetci, "15:00"), [{ ad: "teslim.jpg", bayt: JPEG }])));
  const foto = (await a((db) => varlikKarti(db, YON, d)))!.hareketler[0].fotolar[0];
  assert.ok(await a((db) => dosyaIndirilebilir(db, PLAN, foto, DOSYA_ERISIMI)), "planlama (görür) açar");
  assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, foto, DOSYA_ERISIMI)), "teslim alan denetçi açar");
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, foto, DOSYA_ERISIMI)), null, "muhasebe açamaz");
  assert.equal(await b((db) => dosyaIndirilebilir(db, YON_B, foto, DOSYA_ERISIMI)), null, "başka firma açamaz");
});

test("YETKİ: planlama görür ama teslim edemez; denetçi yalnız kendi zimmetini ve hareketlerini görür, teslim edemez; muhasebe görmez", async () => {
  tamam(await a((db) => teslimEt(db, depo, YON, A, T(`c:${cihaz}`, pDenetci, "16:00"))));
  assert.deepEqual(await a((db) => teslimEt(db, depo, PLAN, A, T(`c:${cihaz}`, "depo", "17:00"))), { durum: "yetkisiz" });
  assert.deepEqual(await a((db) => demirbasEkle(db, PLAN, { kod: "DM-9", ad: "Deneme" })), { durum: "yetkisiz" });
  assert.equal((await a((db) => zimmetListeleri(db, PLAN)))!.varliklar.length, 2);
  const kendi = (await a((db) => zimmetListeleri(db, DENETCI)))!;
  assert.deepEqual(kendi.varliklar.map((v) => v.kod).sort(), ["DM-1", "OC-1"]);
  assert.ok(kendi.varliklar.every((v) => v.kimde.tip === "kisi" && v.kimde.id === pDenetci), "yalnız kendi zimmeti");
  assert.ok(kendi.hareketler.every((h) => h.eden === "Deneme Denetçi" || h.alan === "Deneme Denetçi"), "yalnız taraf olduğu hareketler");
  assert.deepEqual(kendi.kisiler, [], "kişi listesi verilmez");
  assert.deepEqual(await a((db) => teslimEt(db, depo, DENETCI, A, T(`c:${cihaz}`, "depo", "17:00"))), { durum: "yetkisiz" });
  assert.equal(await a((db) => zimmetListeleri(db, MUH)), null);
  /* Ölçüm cihazları "kendi" düzeyi: denetçi zimmetindeki cihazı görür */
  assert.deepEqual((await a((db) => cihazListesi(db, DENETCI)))!.cihazlar.map((c) => c.kod), ["OC-1"]);
  assert.equal((await a((db) => cihazKarti(db, DENETCI, cihaz)))?.kod, "OC-1");
  tamam(await a((db) => teslimEt(db, depo, YON, A, T(`c:${cihaz}`, pIkinci, "18:00"))));
  assert.deepEqual((await a((db) => cihazListesi(db, DENETCI)))!.cihazlar, [], "zimmetten çıkınca görmez");
  assert.equal(await a((db) => cihazKarti(db, DENETCI, cihaz)), null);
});

test("KİRACI: B, A'nın varlığını göremez, teslim edemez; veritabanı başka firmanın cihazına / personeline hareket bağlamaz", async () => {
  assert.equal(await b((db) => varlikKarti(db, YON_B, `c:${cihaz}`)), null);
  assert.deepEqual(await b((db) => teslimEt(db, depo, YON_B, B, T(`c:${cihaz}`, "depo"))), { durum: "gecersiz", hatalar: { varlik: "Varlık seçilmeli." } });
  const pB = tamam(await b((db) => personelEkle(db, YON_B, { ...P, ad: "Deneme B Kişi" }))).id;
  await assert.rejects(b((db) => db.sorgu("INSERT INTO zimmet_hareket (cihaz_id, alan_personel, zaman) VALUES ($1, $2, now())", [cihaz, pB])), /foreign key|yabancı anahtar/i);
  const bDemirbas = tamam(await b((db) => demirbasEkle(db, YON_B, { kod: "DM-1", ad: "B merdiven" }))).id;
  await assert.rejects(b((db) => db.sorgu("INSERT INTO zimmet_hareket (demirbas_id, alan_personel, zaman) VALUES ($1, $2, now())", [bDemirbas, pDenetci])), /foreign key|yabancı anahtar/i);
  await assert.rejects(b((db) => db.sorgu("INSERT INTO zimmet_hareket (cihaz_id, demirbas_id, zaman) VALUES (NULL, NULL, now())")), /check/i);
});
