/* NEREDEN GELDİ: maket standartlar.html (M7; reisim 2026-09-22: "her firma kendi standardını kendisi yükler", "muayene personellerinin
   standartlara ulaşabilmesini istiyorum"; 2026-09-28: "yüklenilen şeyler düzenlenebilir silinebilir olmalı") · KOD-GECIS §3 (standart no + sürüm
   eşsiz) · §4 (Dökümanlar: yöneticiler değiştirir, herkes görür, muhasebe görmez) · reisim 2026-10-04: "rol değiştirme sızma veri çalma".
   GERÇEK PostgreSQL, iki firma. */
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
import { dokumanKaldir, dokumanKaydet, dokumanListesi, DosyaHatasi, guncelStandartlar, standartKaldir, standartKarti, standartListesi, standartYukle, type Kisi }
  from "../src/modules/dokumanlar/server/dokumanlar.ts";
import { KRITER_BELGELERI } from "../src/tanim/kriterler.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "dok-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, DENETCI: Kisi, MUH: Kisi, PLAN: Kisi, YON_B: Kisi;
const PDF = { ad: "std.pdf", bayt: new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n") };
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const S = (ek: object = {}) => ({ no: "ts en 280", surum: "2016", konu: "Mobil yükseltilebilen iş platformları", ...ek });

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
  PLAN = kisi(await hesapli(A, "planlama@deneme.example", ["planlama"]), "planlama");
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"]), "denetci");
  MUH = kisi(await hesapli(A, "muhasebe@deneme.example", ["muhasebe"]), "muhasebe");
  YON_B = kisi(await hesapli(B, "yonetici@deneme-b.example", ["firma_yoneticisi"]), "firma_yoneticisi");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("kriter belgeleri kodda: iki belge, maddeler ve notlar dolu", () => {
  assert.deepEqual(KRITER_BELGELERI.map((x) => x.kod), ["ZPKK01", "ZPKK02"]);
  assert.ok(KRITER_BELGELERI.every((x) => x.maddeler.length > 5 && x.notlar.length > 0 && x.maddeler.every((m) => m.no && m.baslik && m.icerik)));
});

let ilk: string, ikinci: string;
test("standart yükle: no büyük harf, sürüm biçimi, PDF zorunlu; yeni sürüm eskisini önceki yapar; aynı sürüm ikinci kez yüklenmez", async () => {
  ilk = tamam(await a((db) => standartYukle(db, depo, YON, A, S(), PDF))).id;
  let k = (await a((db) => standartKarti(db, YON, ilk)))!;
  assert.deepEqual([k.no, k.surumAdi, k.guncel, k.yukleyen], ["TS EN 280", "2016", true, "Deneme"]);
  const g = await a((db) => standartYukle(db, depo, YON, A, { no: "x", surum: "16", konu: "" }, null));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["dosya", "konu", "no", "surum"]);
  assert.deepEqual(await a((db) => standartYukle(db, depo, YON, A, S(), PDF)), { durum: "gecersiz", hatalar: { surum: "Bu sürüm kütüphanede var." } });
  ikinci = tamam(await a((db) => standartYukle(db, depo, YON, A, S({ surum: "2013+A1:2015" }), PDF))).id;
  k = (await a((db) => standartKarti(db, YON, ilk)))!;
  assert.deepEqual([k.guncel, !!k.bitti, k.guncelId, k.surumler.length], [false, true, ikinci, 2]);
  assert.deepEqual((await a((db) => guncelStandartlar(db))).map((x) => `${x.no}:${x.surumAdi}`), ["TS EN 280:2013+A1:2015"]);
  /* PDF olmayan dosyada kayıt hiç yazılmaz */
  await assert.rejects(a((db) => standartYukle(db, depo, YON, A, S({ no: "TS EN 81-20", surum: "2020" }), { ad: "x.pdf", bayt: new TextEncoder().encode("metin") })), DosyaHatasi);
  assert.equal((await a((db) => standartListesi(db, YON)))!.length, 2);
  /* veritabanı da tutar: aynı numarada ikinci güncel sürüm girmez */
  await assert.rejects(a((db) => db.sorgu("INSERT INTO standart (no, surum_adi, konu, yukleyen) VALUES ('TS EN 280', '2020', 'Deneme konu', 'Y')")), /unique|duplicate|eşsiz/i);
});

test("standart kaldır: güncel kaldırılınca önceki yeniden güncel; silme hakkı yok", async () => {
  const k = (await a((db) => standartKarti(db, YON, ikinci)))!;
  const r = tamam(await a((db) => standartKaldir(db, YON, ikinci, k.surum)));
  assert.equal(r.guncel, ilk);
  assert.equal((await a((db) => standartKarti(db, YON, ilk)))!.guncel, true);
  assert.equal(await a((db) => standartKarti(db, YON, ikinci)), null);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM standart")), /permission denied|izin/i);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM dokuman")), /permission denied|izin/i);
});

test("diğer dökümanlar: yükle, dosya değiştir (tarih bugün), kaldır; tür listeden", async () => {
  const g = await a((db) => dokumanKaydet(db, depo, YON, A, null, 0, { ad: "", tur: "Roman", kod: "", rev: "" }, null));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["ad", "dosya", "tur"]);
  const id = tamam(await a((db) => dokumanKaydet(db, depo, YON, A, null, 0, { ad: "Muayene prosedürü", tur: "Prosedür", kod: "KM-PR-01", rev: "Rev. 6" }, PDF))).id;
  const d = (await a((db) => dokumanListesi(db, YON)))![0];
  assert.deepEqual([d.ad, d.kod, d.rev], ["Muayene prosedürü", "KM-PR-01", "Rev. 6"]);
  tamam(await a((db) => dokumanKaydet(db, depo, YON, A, id, d.surum, {}, PDF)));
  const d2 = (await a((db) => dokumanListesi(db, YON)))![0];
  assert.notEqual(d2.dosyaId, d.dosyaId);
  tamam(await a((db) => dokumanKaldir(db, YON, id, d2.surum)));
  assert.deepEqual(await a((db) => dokumanListesi(db, YON)), []);
});

test("YETKİ: denetçi ve planlama görür ve PDF açar, yükleyemez; muhasebe görmez, açamaz; başka firma açamaz", async () => {
  const id = tamam(await a((db) => dokumanKaydet(db, depo, YON, A, null, 0, { ad: "Kalite el kitabı", tur: "Kalite el kitabı", kod: "", rev: "" }, PDF))).id;
  const std = (await a((db) => standartKarti(db, DENETCI, ilk)))!;
  assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, std.dosyaId, DOSYA_ERISIMI)), "denetçi standardı okur");
  const dok = (await a((db) => dokumanListesi(db, PLAN)))!.find((x) => x.id === id)!;
  assert.ok(await a((db) => dosyaIndirilebilir(db, PLAN, dok.dosyaId, DOSYA_ERISIMI)));
  assert.deepEqual(await a((db) => standartYukle(db, depo, DENETCI, A, S({ surum: "2030" }), PDF)), { durum: "yetkisiz" });
  assert.deepEqual(await a((db) => dokumanKaldir(db, PLAN, id, 0)), { durum: "yetkisiz" });
  assert.equal(await a((db) => standartListesi(db, MUH)), null);
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, std.dosyaId, DOSYA_ERISIMI)), null);
  assert.equal(await b((db) => dosyaIndirilebilir(db, YON_B, std.dosyaId, DOSYA_ERISIMI)), null);
  assert.equal(await b((db) => standartKarti(db, YON_B, ilk)), null);
  assert.deepEqual(await b((db) => standartListesi(db, YON_B)), []);
  assert.deepEqual(await b((db) => standartKaldir(db, YON_B, ilk, std.surum)), { durum: "yok" });
});
