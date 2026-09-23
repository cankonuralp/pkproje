/* OLUMSUZ KANIT — tests/kiraci-izolasyonu.test.ts neyi koruyor: aynı sorgu RLS'yi aşabilen bir bağlantıyla (sahip /
   süper kullanıcı) koşunca İKİ firmanın satırı birden görünür. Yani izolasyon uygulama rolüne bağlıdır ve testteki
   "uygulama rolü süper kullanıcı değil, RLS'yi aşamaz" denetimi gerçek bir kapıdır. Kaynak diskte değiştirilmez. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

let kume: GomuluKume;

before(async () => { kume = await testKumesi(); });
after(async () => { await kume?.durdur(); });

test("RLS'yi aşan bağlantı iki firmanın izini birden görür; uygulama rolü yalnız kendininkini", async () => {
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  const havuz = havuzKur(kume.uygulama);
  try {
    const f = await sahip.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id");
    const [a, b] = f.rows.map((r) => r.id);
    for (const id of [a!, b!]) await kiraciIcinde(havuz, id, (db) => db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme', 'Plan açıldı')"));
    const uygulamaA = await kiraciIcinde(havuz, a!, (db) => db.sorgu("SELECT DISTINCT firma_id FROM denetim_izi"));
    assert.equal(uygulamaA.rowCount, 1);
    // süper kullanıcı RLS'yi her durumda aşar (FORCE bile bağlamaz) → iki firma
    await sahip.query("SELECT set_config('app.firma_id', $1, false)", [a]);
    const sahipGorur = await sahip.query("SELECT DISTINCT firma_id FROM denetim_izi");
    assert.equal(sahipGorur.rowCount, 2, "sahip bağlantısı iki firmayı görmeliydi (kilidin koruduğu açık)");
  } finally {
    await havuz.end();
    await sahip.end();
  }
});
