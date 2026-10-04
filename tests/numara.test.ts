/* NEREDEN GELDİ: pkproje §3.5 (reisim 2026-09-23: "mantıklı şekilde proje numarası atama sistemi kur, aynı şekilde raporlar için de eşsiz
   isimlendirmeler olmalı"; karar 17–21) · KOD-GECIS §6 · ENGEL 4 (proje / rapor no eşsiz). GERÇEK PostgreSQL'de, iki firma:
   biçim, Türkiye saatiyle ay, aylık sıfırlama, rapor sırası kesintisiz (geri alınan işlem boşluk bırakmaz), aynı anda alınan numaralar
   çakışmaz, firmalar birbirinin sırasını görmez / etkilemez, sayaç geri alınamaz. Olumsuz kanıt: tests/bozan/numara.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { aayy, numaraAl, raporNoAl, revizyonNo } from "../src/server/numara/numara.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const EYLUL = new Date("2026-09-15T09:00:00Z");

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("AAYY Türkiye saatiyle: UTC'de 30 Eylül 21:30 = TSİ 1 Ekim 00:30 → 1026", () => {
  assert.equal(aayy(new Date("2026-09-30T20:59:00Z")), "0926");
  assert.equal(aayy(new Date("2026-09-30T21:30:00Z")), "1026");
  assert.equal(aayy(new Date("2026-12-31T21:00:00Z")), "0127");
});

test("proje no P-AAYY-SIRA: ayda 001'den, ay değişince yeniden 001; önek firma ayarından", async () => {
  const al = (simdi: Date, onek?: string) => kiraciIcinde(havuz, A, (db) => numaraAl(db, "proje", { simdi, onek }));
  assert.equal(await al(EYLUL), "P-0926-001");
  assert.equal(await al(EYLUL), "P-0926-002");
  assert.equal(await al(new Date("2026-10-02T09:00:00Z")), "P-1026-001");
  assert.equal(await al(EYLUL, "PR"), "P-0926-003".replace("P-", "PR-"));
  await assert.rejects(al(EYLUL, "p'; --"), /Geçersiz numara öneki/);
  assert.equal(await kiraciIcinde(havuz, A, (db) => numaraAl(db, "teklif", { simdi: EYLUL })), "T-0926-001");
});

test("rapor no XX-AAYY-SIRA-EK: firma kodu veritabanından, sıra ayla sıfırlanmaz, EK 5 hane rasgele; revizyon -R1", async () => {
  const r1 = await kiraciIcinde(havuz, A, (db) => raporNoAl(db, { simdi: EYLUL }));
  const r2 = await kiraciIcinde(havuz, A, (db) => raporNoAl(db, { simdi: new Date("2026-10-02T09:00:00Z") }));
  assert.match(r1, /^DA-0926-001-[0-9a-f]{5}$/);
  assert.match(r2, /^DA-1026-002-[0-9a-f]{5}$/, "ay değişti ama sıra sürdü");
  assert.notEqual(r1.slice(-5), r2.slice(-5));
  assert.equal(revizyonNo(r1, 1), `${r1}-R1`);
  assert.throws(() => revizyonNo(`${r1}-R1`, 2), /Geçersiz rapor numarası/);
});

test("KESİNTİSİZ: rapor oluşturan işlem geri alınırsa sıra da geri alınır (boşluk yok)", async () => {
  const once = await kiraciIcinde(havuz, A, (db) => raporNoAl(db, { simdi: EYLUL }));
  await assert.rejects(kiraciIcinde(havuz, A, async (db) => { await raporNoAl(db, { simdi: EYLUL }); throw new Error("kayıt düştü"); }), /kayıt düştü/);
  const sonra = await kiraciIcinde(havuz, A, (db) => raporNoAl(db, { simdi: EYLUL }));
  assert.equal(Number(sonra.split("-")[2]), Number(once.split("-")[2]) + 1);
});

test("EŞZAMANLI: aynı anda 20 rapor numarası → 20 farklı, ardışık sıra", async () => {
  const nolar = await Promise.all(Array.from({ length: 20 }, () => kiraciIcinde(havuz, B, (db) => raporNoAl(db, { simdi: EYLUL }))));
  const siralar = nolar.map((n) => Number(n.split("-")[2])).sort((x, y) => x - y);
  assert.deepEqual(siralar, Array.from({ length: 20 }, (_, i) => i + 1));
  assert.ok(nolar.every((n) => n.startsWith("DB-0926-")), "B'nin kodu, A'nın sırasından bağımsız");
});

test("KİRACI ve GERİ ALMA: firma sayacı başkasına görünmez; uygulama sayacı geri alamaz, silemez", async () => {
  const b = await kiraciIcinde(havuz, B, (db) => db.sorgu<{ firma_id: string }>("SELECT firma_id::text FROM numara_sayaci"));
  assert.ok(b.rows.length > 0 && b.rows.every((r) => r.firma_id === B));
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE numara_sayaci SET son = 1 WHERE tur = 'rapor'")), /geri alınamaz/);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("DELETE FROM numara_sayaci")), /permission denied/);
  await assert.rejects(raporNoAl({ sorgu: (m, d) => havuz.query(m, d as unknown[]) }), /Firma bağlamı yok/);
});
