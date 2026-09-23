/* NEREDEN GELDİ: CLAUDE.md §2 "satır seviyesi kiracı izolasyonu veritabanında; her sorgu kiracı süzgeçli tek veri
   erişim katmanından geçer" + anayasa 5.4 "tenant izolasyonu kuralın kendisinde". Kaynak projede izolasyon kuralda
   duruyordu ama gerçek veritabanında kanıtlayan test yoktu. Bu test GERÇEK PostgreSQL'de (gömülü) koşar:
   iki firma açılır, her biri yalnız kendi satırını görür/yazar; kiracısız bağlantı hiçbir satır görmez; uygulama rolü
   süper kullanıcı değildir ve RLS'yi aşamaz; göçler iki kez koşunca şema değişmez.
   Olumsuz kanıt: tests/bozan/kiraci-izolasyonu.bozan.ts (süper kullanıcı bağlantısı iki firmayı birden görür). */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import pg from "pg";
import { gocleriUygula } from "../src/server/db/goc.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { firmaKimligi, havuzKur, kiraciIcinde } from "../src/server/db/kiraci.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: pg.Pool;
let firmaA: string;
let firmaB: string;

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  try {
    // örnek veri UYDURMADIR (CLAUDE.md §7)
    const r = await sahip.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A Muayene', 'DA'), ('deneme-b', 'Deneme B Muayene', 'DB') RETURNING id");
    [firmaA, firmaB] = r.rows.map((x) => x.id);
  } finally {
    await sahip.end();
  }
});

after(async () => {
  await havuz?.end();
  await kume?.durdur();
});

test("uygulama veritabanı UTF-8; Türkçe harfler bozulmadan gidip gelir (küme şablonu SQL_ASCII olsa da)", async () => {
  const r = await havuz.query<{ kod: string }>("SELECT pg_encoding_to_char(encoding) AS kod FROM pg_database WHERE datname = current_database()");
  assert.equal(r.rows[0].kod, "UTF8");
  const metin = "ĞÜŞİÖÇ ğüşıöç — Çorlu / Tekirdağ";
  const geri = await havuz.query<{ m: string; n: number }>("SELECT $1::text AS m, length($1::text) AS n", [metin]);
  assert.deepEqual(geri.rows[0], { m: metin, n: [...metin].length });
});

test("alt alan adından firma kimliği bulunur; olmayan ad null döner", async () => {
  assert.equal(await firmaKimligi(havuz, "deneme-a"), firmaA);
  assert.equal(await firmaKimligi(havuz, "olmayan"), null);
});

test("her firma yalnız kendi denetim izini yazar ve görür", async () => {
  await kiraciIcinde(havuz, firmaA, (db) => db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme Kişi', 'Plan açıldı')"));
  await kiraciIcinde(havuz, firmaB, (db) => db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme Kişi', 'Plan kabul edildi')"));
  const a = await kiraciIcinde(havuz, firmaA, (db) => db.sorgu<{ firma_id: string; ne: string }>("SELECT firma_id, ne FROM denetim_izi"));
  const b = await kiraciIcinde(havuz, firmaB, (db) => db.sorgu<{ firma_id: string; ne: string }>("SELECT firma_id, ne FROM denetim_izi"));
  assert.deepEqual(a.rows.map((r) => [r.firma_id, r.ne]), [[firmaA, "Plan açıldı"]]);
  assert.deepEqual(b.rows.map((r) => [r.firma_id, r.ne]), [[firmaB, "Plan kabul edildi"]]);
});

test("firma tablosunda her firma yalnız kendini görür", async () => {
  const a = await kiraciIcinde(havuz, firmaA, (db) => db.sorgu<{ kisa_ad: string }>("SELECT kisa_ad FROM firma"));
  assert.deepEqual(a.rows.map((r) => r.kisa_ad), ["deneme-a"]);
});

test("başka firmanın adına yazmak reddedilir (WITH CHECK)", async () => {
  await assert.rejects(
    kiraciIcinde(havuz, firmaA, (db) => db.sorgu("INSERT INTO denetim_izi (firma_id, kim, ne) VALUES ($1, 'Deneme', 'Sızma denemesi')", [firmaB])),
    /row-level security/);
  const b = await kiraciIcinde(havuz, firmaB, (db) => db.sorgu("SELECT 1 FROM denetim_izi WHERE ne = 'Sızma denemesi'"));
  assert.equal(b.rowCount, 0);
});

test("kiracısız bağlantı hiçbir satır görmez (varsayılan: kapalı)", async () => {
  const r = await havuz.query("SELECT count(*)::int AS n FROM denetim_izi");
  assert.equal(r.rows[0].n, 0);
});

test("önceki kiracının ayarı havuzdaki bağlantıya sızmaz", async () => {
  await kiraciIcinde(havuz, firmaA, (db) => db.sorgu("SELECT 1"));
  const r = await havuz.query("SELECT current_setting('app.firma_id', true) AS ayar");
  assert.ok(r.rows[0].ayar === null || r.rows[0].ayar === "");
});

test("denetim izi yalnız eklenir: uygulama rolü güncelleyemez, silemez", async () => {
  await assert.rejects(kiraciIcinde(havuz, firmaA, (db) => db.sorgu("UPDATE denetim_izi SET ne = 'değişti'")), /permission denied/);
  await assert.rejects(kiraciIcinde(havuz, firmaA, (db) => db.sorgu("DELETE FROM denetim_izi")), /permission denied/);
});

test("uygulama rolü süper kullanıcı değil, RLS'yi aşamaz, tabloların sahibi değil", async () => {
  const r = await havuz.query<{ rolsuper: boolean; rolbypassrls: boolean }>("SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user");
  assert.deepEqual(r.rows[0], { rolsuper: false, rolbypassrls: false });
  const s = await havuz.query<{ n: number }>("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND tableowner = current_user");
  assert.equal(s.rows[0].n, 0);
});

test("firma_id taşıyan her tabloda RLS açık ve ZORUNLU (FORCE)", async () => {
  const r = await havuz.query<{ tablo: string; rls: boolean; zorunlu: boolean }>(`
    SELECT c.relname AS tablo, c.relrowsecurity AS rls, c.relforcerowsecurity AS zorunlu
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND (c.relname = 'firma' OR EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'firma_id' AND NOT a.attisdropped))
    ORDER BY 1`);
  assert.ok(r.rows.length >= 2);
  for (const t of r.rows) assert.deepEqual([t.tablo, t.rls, t.zorunlu], [t.tablo, true, true]);
});

test("göçler iki kez koşunca hiçbir şey uygulanmaz ve hata vermez (idempotent)", async () => {
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  try {
    assert.deepEqual(await gocleriUygula(sahip), []);
  } finally {
    await sahip.end();
  }
});
