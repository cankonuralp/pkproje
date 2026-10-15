/* NEREDEN GELDİ: 567 — 06-HATA-TAKIBI ("yakalanmayan hata ve reddedilen söz küresel yakalanır", "aynı hata kısılır, gürültü elenir", "bağlamıyla
   yazılır, yığın izi kırpılır", "defter sınırlıdır ve yalnız yetkili okur"), 09 B11 (hata kaydı büyümesi sınırlı) ve G2 (log ve hata kaydında kişisel
   veri yok); reisim 2026-10-15 analizi ("sitede donma … sızıntı … genel bi analiz yap") → "elindeki bütün işleri yap". Kilit:
   · maske (saf — tests/hata-maske.test.ts);
   · veritabanı (GERÇEK PostgreSQL, göç 0093): aynı hata 10 dakikada tek satır (sayı artar); sel sınırı (saatte 300 yeni, oturumsuzdan 60); budama
     (30 gün, en yeni 2000); uygulama rolü tabloyu okuyamaz ve doğrudan yazamaz (yalnız hata_yaz); yönetim rolü okur; işlev PUBLIC'e kapalı.
   Olumsuz kanıt: tests/bozan/hata.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type pg from "pg";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { hataListesiDb, hataYazDb } from "../src/server/db/hata.ts";
import { havuzKur, yonetimIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import type { HazirHata } from "../src/server/hata/maske.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, sahip: pg.Client;
before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci();
  await sahip.connect();
});
after(async () => { await sahip?.end(); await havuz?.end(); await kume?.durdur(); });

const HESAP = "00000000-0000-4000-8000-0000000000a1";
const hata = (mesaj: string, ek: Partial<HazirHata> = {}): HazirHata => ({
  kaynak: "istemci", mesaj, yer: "pencere", yigin: null, adres: "/planlar", alan: "deneme", hesap: HESAP, surum: "abc1234", cihaz: "Deneme tarayıcı", ...ek,
});
const satirlar = async () => (await sahip.query<{ mesaj: string; sayi: number; hesap: string | null }>("SELECT mesaj, sayi, hesap::text FROM hata_kaydi ORDER BY id")).rows;

test("veritabanı: aynı hata 10 dakikada tek satır, sayı artar; farklı hata ayrı satır; uzunluklar kırpılır, biçimsiz alan boş", async () => {
  assert.equal(await hataYazDb(havuz, hata("TypeError: x tanımsız")), true);
  assert.equal(await hataYazDb(havuz, hata("TypeError: x tanımsız")), true);
  assert.equal(await hataYazDb(havuz, hata("TypeError: x tanımsız", { yer: "sınır:uygulama" })), true, "başka yer — başka satır");
  assert.equal(await hataYazDb(havuz, hata("TypeError: x tanımsız", { kaynak: "sunucu" })), true, "başka kaynak — başka satır");
  assert.deepEqual((await satirlar()).map((r) => [r.mesaj, r.sayi]), [["TypeError: x tanımsız", 2], ["TypeError: x tanımsız", 1], ["TypeError: x tanımsız", 1]]);
  /* 10 dakikadan eski aynı hata yeni satır açar */
  await sahip.query("UPDATE hata_kaydi SET son = now() - interval '11 minutes'");
  assert.equal(await hataYazDb(havuz, hata("TypeError: x tanımsız")), true);
  assert.equal((await satirlar()).length, 4);
  /* uygulamayı atlayan uzun / biçimsiz değerler de veritabanında kırpılır */
  assert.equal(await hataYazDb(havuz, hata("y".repeat(900), { alan: "KÖTÜ alan", yigin: "z".repeat(5000), adres: "/" + "a".repeat(900) })), true);
  const u = (await sahip.query<{ m: number; a: string | null; y: number; d: number }>(
    "SELECT length(mesaj) AS m, alan AS a, length(yigin) AS y, length(adres) AS d FROM hata_kaydi WHERE mesaj LIKE 'yyy%'")).rows[0];
  assert.deepEqual(u, { m: 300, a: null, y: 1200, d: 200 });
  assert.equal(await hataYazDb(havuz, hata("   ")), false, "boş mesaj yazılmaz");
  await sahip.query("DELETE FROM hata_kaydi");
});

test("sel sınırı: saatte 300 yeni satır (oturumsuzdan 60) — sonra yeni hata yazılmaz, bilinenin sayısı yine artar", async () => {
  await sahip.query(`INSERT INTO hata_kaydi (imza, kaynak, mesaj, hesap) SELECT md5(g::text), 'istemci', 'eski ' || g, NULL FROM generate_series(1, 60) g`);
  assert.equal(await hataYazDb(havuz, hata("oturumsuz yeni", { hesap: null })), false, "oturumsuz sınır dolu");
  assert.equal(await hataYazDb(havuz, hata("oturumlu yeni")), true, "oturumlunun sınırı ayrı");
  await sahip.query(`INSERT INTO hata_kaydi (imza, kaynak, mesaj, hesap) SELECT md5('o' || g), 'istemci', 'eski o' || g, $1::uuid FROM generate_series(1, 240) g`, [HESAP]);
  assert.equal(await hataYazDb(havuz, hata("bir yeni daha")), false, "saatte 300 dolu");
  assert.equal(await hataYazDb(havuz, hata("oturumlu yeni")), true, "bilinen hatanın sayısı artar");
  assert.equal((await satirlar()).find((r) => r.mesaj === "oturumlu yeni")!.sayi, 2);
  /* bir saat geçince yine yazılır */
  await sahip.query("UPDATE hata_kaydi SET ilk = now() - interval '2 hours', son = now() - interval '2 hours'");
  assert.equal(await hataYazDb(havuz, hata("saat sonra")), true);
  await sahip.query("DELETE FROM hata_kaydi");
});

test("budama: 30 günden eski düşer, en yeni 2000 kalır", async () => {
  await sahip.query(`INSERT INTO hata_kaydi (imza, kaynak, mesaj, ilk, son) VALUES (md5('eski'), 'sunucu', 'çok eski', now() - interval '40 days', now() - interval '40 days')`);
  await sahip.query(`INSERT INTO hata_kaydi (imza, kaynak, mesaj, ilk, son)
    SELECT md5('b' || g), 'sunucu', 'b' || g, now() - interval '2 hours', now() - interval '2 hours' - g * interval '1 second' FROM generate_series(1, 2005) g`);
  assert.equal(await hataYazDb(havuz, hata("yeni")), true);
  const r = (await sahip.query<{ n: number; eski: number; en_eski: string }>(
    "SELECT count(*)::int AS n, count(*) FILTER (WHERE mesaj = 'çok eski')::int AS eski, (SELECT mesaj FROM hata_kaydi ORDER BY son LIMIT 1) AS en_eski FROM hata_kaydi")).rows[0];
  assert.deepEqual(r, { n: 2000, eski: 0, en_eski: "b1999" });
  await sahip.query("DELETE FROM hata_kaydi");
});

test("yetki: uygulama rolü tabloyu okuyamaz ve doğrudan yazamaz (yalnız hata_yaz); yönetim rolü okur; işlev PUBLIC'e kapalı", async () => {
  await hataYazDb(havuz, hata("yetki denemesi"));
  await assert.rejects(havuz.query("SELECT * FROM hata_kaydi"), /permission denied|izin/i);
  await assert.rejects(havuz.query("INSERT INTO hata_kaydi (imza, kaynak, mesaj) VALUES (md5('x'), 'istemci', 'sahte')"), /permission denied|izin/i);
  await assert.rejects(havuz.query("DELETE FROM hata_kaydi"), /permission denied|izin/i);
  const l = await yonetimIcinde(havuz, (db) => hataListesiDb(db, 10));
  assert.deepEqual(l.map((h) => [h.kaynak, h.mesaj, h.alan, h.oturumlu, h.sayi]), [["istemci", "yetki denemesi", "deneme", true, 1]]);
  assert.equal("hesap" in l[0], false, "hesap kimliği yönetim listesine de gitmez (yalnız oturumlu mu)");
  await assert.rejects(yonetimIcinde(havuz, (db) => db.sorgu("DELETE FROM hata_kaydi")), /permission denied|izin/i, "yönetim yalnız okur");
  const p = (await sahip.query<{ p: boolean }>("SELECT has_function_privilege('public', 'hata_yaz(text, text, text, text, text, text, uuid, text, text)', 'EXECUTE') AS p")).rows[0];
  assert.equal(p.p, false);
  const r = (await sahip.query<{ r: boolean }>("SELECT relrowsecurity AS r FROM pg_class WHERE relname = 'hata_kaydi'")).rows[0];
  assert.equal(r.r, true, "satır güvenliği açık");
});
