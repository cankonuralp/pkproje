/* NEREDEN GELDİ: 347 — deneme yayınında dosyalar Vercel'in geçici klasöründeydi (işlev örnekleri arasında kayboluyordu); kalıcı firma deposu K7.
   Veritabanı deposu (0049 depo_nesne, PROBATA_DEPO=vt): anahtar biçimi, yazılan değişmez (ikinci yazma yok, güncelleme / silme hakkı yok), anahtarın
   firması satırın firması (başka firmanın anahtarına yazılamaz, okunamaz), çağıranın işleminde yazılır (geri alınınca nesne de yok), dosya
   yüklemesiyle uçtan uca. GERÇEK PostgreSQL, iki firma. Olumsuz kanıt: tests/bozan/depo-vt.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { dosyaAnahtari } from "../src/server/dosya/anahtar.ts";
import { vtDepo } from "../src/server/dosya/depo.ts";
import { dosyaYukle } from "../src/server/dosya/dosya.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A: string, B: string;
const bayt = (s: string) => new TextEncoder().encode(s);
const PDF = bayt("%PDF-1.7\n1 0 obj<<>>endobj\n%%EOF");
const anahtar = (firmaId: string) => dosyaAnahtari({ firmaId, modul: "deneme", kayitId: randomUUID(), dosyaId: randomUUID() });

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("yaz / oku: anahtarın firmasının işleminde; aynı anahtara ikinci kez yazılmaz; yanlış biçim ve yol aşma reddedilir", async () => {
  const d = vtDepo(() => havuz), k = anahtar(A);
  await d.yaz(k, bayt("içerik-1"));
  assert.equal(new TextDecoder().decode(await d.oku(k)), "içerik-1");
  await assert.rejects(d.yaz(k, bayt("içerik-2")), /duplicate|unique|eşsiz/i, "yazılan değişmez");
  assert.equal(new TextDecoder().decode(await d.oku(k)), "içerik-1");
  for (const kotu of ["../x", `firma/${A}/../../etc/passwd`, "firma/x/y/z/w"]) {
    await assert.rejects(d.yaz(kotu, bayt("x")), /Geçersiz depo anahtarı/);
    await assert.rejects(d.oku(kotu), /Geçersiz depo anahtarı/);
  }
  await assert.rejects(d.oku(anahtar(A)), /Depoda böyle bir nesne yok/);
});

test("KİRACI: başka firmanın anahtarına başka firmanın işleminde yazılamaz, okunamaz; uygulama rolü güncelleyemez, silemez", async () => {
  const d = vtDepo(() => havuz), kA = anahtar(A);
  await d.yaz(kA, bayt("A'nın"));
  /* B'nin işleminde A'nın anahtarı: yazma RLS / denetimle reddedilir, okuma bulamaz */
  await assert.rejects(kiraciIcinde(havuz, B, (db) => d.yaz(anahtar(A), bayt("sızma"), db)), /row-level security|check constraint|depo_nesne/i);
  await assert.rejects(kiraciIcinde(havuz, B, (db) => d.oku(kA, db)), /Depoda böyle bir nesne yok/);
  /* veritabanı da tutar: anahtarın firması satırın firması */
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO depo_nesne (anahtar, bayt) VALUES ($1, '\\x01')", [anahtar(B)])), /check|row-level/i);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE depo_nesne SET bayt = '\\x02'")), /permission denied|izin/i);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("DELETE FROM depo_nesne")), /permission denied|izin/i);
});

test("çağıranın işleminde: işlem geri alınınca nesne de yok; dosya yüklemesi içeriği aynı işlemde yazar", async () => {
  const d = vtDepo(() => havuz), k = anahtar(A);
  await assert.rejects(kiraciIcinde(havuz, A, async (db) => { await d.yaz(k, bayt("geri alınacak"), db); throw new Error("işlem düştü"); }), /işlem düştü/);
  await assert.rejects(d.oku(k), /Depoda böyle bir nesne yok/, "geri alınan işlemin nesnesi kalmadı");
  const y = await kiraciIcinde(havuz, A, (db) => dosyaYukle(db, d, { firmaId: A, modul: "deneme", kayitId: randomUUID(), ad: "belge.pdf", bayt: PDF, izinli: ["pdf"], kim: "Deneme" }));
  assert.ok(y.tamam);
  const a = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ anahtar: string }>("SELECT anahtar FROM dosya WHERE id = $1", [y.tamam ? y.id : ""]))).rows[0].anahtar;
  assert.deepEqual(await d.oku(a), PDF);
});
