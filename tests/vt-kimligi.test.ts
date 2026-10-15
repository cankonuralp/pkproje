/* NEREDEN GELDİ: FIRMA-VT.md FV1 (sunum 579; reisim 2026-10-15: "supabase ve resend bağlantılarını firma açarken biz buradan panelden yapalım") — her
   yeni firmanın verisi KENDİ veritabanında olacak, eskiler ortak veritabanında kalacak. Hangi havuzun seçileceğini kod belirler (FV3); bir hata ya da
   saldırı bir firmanın işini başka firmanın veritabanına götürürse veri karışmamalı. Son kapı veritabanında: her veritabanı kimliğini bilir (vt_kimlik,
   göç 0095) ve kiraciIcinde her işlemin başında vt_firma_dogrula'yı çağırır. Bu test GERÇEK PostgreSQL'de iki veritabanıyla koşar: ortak + bir
   firmanın kendi veritabanı (aynı kümede ikinci veritabanı; göçler aynen uygulanır, kimlik kurulumdaki gibi yazılır).
   Olumsuz kanıt: tests/bozan/vt-kimligi.bozan.ts (kiraciIcinde doğrulamayı çağırmazsa başka firmanın işi firma veritabanında koşar; firma tablosunun
   tetiği kalkarsa firma veritabanına ikinci firma eklenir). */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import pg from "pg";
import { gocleriUygula } from "../src/server/db/goc.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { firmaKimligi, havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { testKumesi } from "./yardimci/kume.ts";

const FIRMA_VT = "probata_firma_x";
let kume: GomuluKume;
let ortak: Havuz;
let firmaVt: Havuz;
let sahipOrtak: pg.Client;
let sahipFirma: pg.Client;
let A: string;          // ortak veritabanındaki firma
let X: string;          // kendi veritabanındaki firma
const yetkisiz = (e: unknown) => (e as { code?: string }).code === "42501";

before(async () => {
  kume = await testKumesi();
  ortak = havuzKur(kume.uygulama);
  sahipOrtak = kume.sahipIstemci();
  await sahipOrtak.connect();
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  A = (await sahipOrtak.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('ortak-a', 'Ortak A Muayene', 'OA') RETURNING id")).rows[0].id;
  X = randomUUID();
  /* firmanın kendi veritabanı: aynı kümede ikinci veritabanı, göçler aynen; kimlik ve firma satırı kurulumdaki sırayla (FV10: kimlik → firma) */
  const y = kume.sahipIstemci("postgres");
  await y.connect();
  try { await y.query(`CREATE DATABASE ${FIRMA_VT} ENCODING 'UTF8' LOCALE 'C' TEMPLATE template0`); } finally { await y.end(); }
  sahipFirma = kume.sahipIstemci(FIRMA_VT);
  await sahipFirma.connect();
  await gocleriUygula(sahipFirma);
  await sahipFirma.query("UPDATE vt_kimlik SET tur = 'firma', firma_id = $1 WHERE tur = 'ortak'", [X]);
  await sahipFirma.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES ($1, 'kendi-x', 'Kendi X Muayene', 'KX', 'kendi')", [X]);
  /* merkezde (ortak) X'in kaydı: verisi kendi veritabanında */
  await sahipOrtak.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES ($1, 'kendi-x', 'Kendi X Muayene', 'KX', 'kendi')", [X]);
  firmaVt = havuzKur({ ...kume.uygulama, database: FIRMA_VT });
});

after(async () => {
  await ortak?.end();
  await firmaVt?.end();
  await sahipOrtak?.end();
  await sahipFirma?.end();
  await kume?.durdur();
});

test("her veritabanı kimliğini bilir: ortakta 'ortak', firma veritabanında 'firma' + firma; uygulama rolü kimlik tablosunu okuyamaz, yazamaz", async () => {
  assert.deepEqual((await sahipOrtak.query("SELECT tur, firma_id FROM vt_kimlik")).rows, [{ tur: "ortak", firma_id: null }]);
  assert.deepEqual((await sahipFirma.query("SELECT tur, firma_id FROM vt_kimlik")).rows, [{ tur: "firma", firma_id: X }]);
  for (const h of [ortak, firmaVt]) {
    await assert.rejects(h.query("SELECT * FROM vt_kimlik"), yetkisiz);
    await assert.rejects(h.query("UPDATE vt_kimlik SET tur = 'ortak', firma_id = NULL"), yetkisiz);
  }
});

test("ortak veritabanı: ortak firma çalışır; olmayan kimlik bugünkü gibi boş döner; kendi projesine geçmiş firma REDDEDİLİR", async () => {
  await kiraciIcinde(ortak, A, (db) => db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme Kişi', 'Plan açıldı')"));
  const a = await kiraciIcinde(ortak, A, (db) => db.sorgu<{ ne: string }>("SELECT ne FROM denetim_izi"));
  assert.deepEqual(a.rows.map((r) => r.ne), ["Plan açıldı"]);
  const yok = await kiraciIcinde(ortak, randomUUID(), (db) => db.sorgu("SELECT * FROM denetim_izi"));
  assert.equal(yok.rowCount, 0);
  await assert.rejects(kiraciIcinde(ortak, X, (db) => db.sorgu("SELECT 1")), yetkisiz);
  await assert.rejects(kiraciIcinde(ortak, X, (db) => db.sorgu("SELECT 1"), { musteri: { id: randomUUID(), tesisler: null } }), yetkisiz);
});

test("firma veritabanı: kendi firması çalışır; başka firmanın işi (ortak firma, olmayan kimlik, müşteri işlemi) REDDEDİLİR — yanlış havuzda veri karışmaz", async () => {
  await kiraciIcinde(firmaVt, X, (db) => db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme Kişi', 'Rapor yazıldı')"));
  const x = await kiraciIcinde(firmaVt, X, (db) => db.sorgu<{ ne: string; firma_id: string }>("SELECT ne, firma_id FROM denetim_izi"));
  assert.deepEqual(x.rows, [{ ne: "Rapor yazıldı", firma_id: X }]);
  for (const baska of [A, randomUUID()]) {
    await assert.rejects(kiraciIcinde(firmaVt, baska, (db) => db.sorgu("SELECT 1")), yetkisiz);
    await assert.rejects(kiraciIcinde(firmaVt, baska, (db) => db.sorgu("SELECT 1"), { musteri: { id: randomUUID(), tesisler: null } }), yetkisiz);
  }
  /* ortaktaki A'nın izi firma veritabanına sızmadı, X'inki ortakta yok */
  assert.equal((await sahipFirma.query("SELECT count(*)::int AS n FROM denetim_izi WHERE firma_id <> $1", [X])).rows[0].n, 0);
  assert.equal((await sahipOrtak.query("SELECT count(*)::int AS n FROM denetim_izi WHERE firma_id = $1", [X])).rows[0].n, 0);
});

test("firma veritabanına başka firma eklenemez; kimlik bir kez 'firma' olunca değişmez, silinmez; başka firmalı veritabanı 'firma' olamaz", async () => {
  await assert.rejects(sahipFirma.query("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('baska', 'Başka Muayene', 'BA')"), yetkisiz);
  await assert.rejects(sahipFirma.query("UPDATE firma SET id = gen_random_uuid() WHERE id = $1", [X]), yetkisiz);
  await assert.rejects(sahipFirma.query("UPDATE vt_kimlik SET firma_id = gen_random_uuid()"), yetkisiz);
  await assert.rejects(sahipFirma.query("UPDATE vt_kimlik SET tur = 'ortak', firma_id = NULL"), yetkisiz);
  await assert.rejects(sahipFirma.query("DELETE FROM vt_kimlik"), yetkisiz);
  /* ortakta firmalar var: ortak veritabanı bir firmanın veritabanına çevrilemez */
  await assert.rejects(sahipOrtak.query("UPDATE vt_kimlik SET tur = 'firma', firma_id = $1", [A]), yetkisiz);
  assert.deepEqual((await sahipFirma.query("SELECT tur, firma_id FROM vt_kimlik")).rows, [{ tur: "firma", firma_id: X }]);
});

test("alt alan adından firma: ortakta kendi projeli firma bulunmaz (yönlendirme merkezden — FV2/FV3), firma veritabanında kendi firması bulunur", async () => {
  assert.equal(await firmaKimligi(ortak, "ortak-a"), A);
  assert.equal(await firmaKimligi(ortak, "kendi-x"), null);
  assert.equal(await firmaKimligi(firmaVt, "kendi-x"), X);
  assert.equal(await firmaKimligi(firmaVt, "ortak-a"), null);
});

test("dondurulmuş firma işlemde reddedilmez (dondurma girişte ve oturumda — tests/yonetim.test.ts); göçler iki kez koşunca kimlik aynı kalır", async () => {
  await sahipOrtak.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [A]);
  try {
    await kiraciIcinde(ortak, A, (db) => db.sorgu("SELECT 1"));
    assert.equal(await firmaKimligi(ortak, "ortak-a"), null);
  } finally {
    await sahipOrtak.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [A]);
  }
  assert.deepEqual(await gocleriUygula(sahipFirma), []);
  assert.deepEqual(await gocleriUygula(sahipOrtak), []);
  assert.deepEqual((await sahipFirma.query("SELECT tur, firma_id FROM vt_kimlik")).rows, [{ tur: "firma", firma_id: X }]);
  assert.deepEqual((await sahipOrtak.query("SELECT tur, firma_id FROM vt_kimlik")).rows, [{ tur: "ortak", firma_id: null }]);
});
