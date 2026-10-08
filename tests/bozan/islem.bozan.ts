/* OLUMSUZ KANIT — tests/islem.test.ts neyi koruyor (392, göç 0076). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): islem.ts bellekte bozulup geçici
   klasörden içe aktarılır; göçler geçici klasöre kopyalanıp 0076 bellekte bozulur (Supabase benzeri veritabanı). O zaman:
   1) kimliğe danışma kilidi kalkınca aynı kimlik aynı anda iki istekte gelirse iş İKİ KEZ yapılır (çevrimdışı kuyruk yeniden denerken çift kayıt);
   2) "önceden işlendi mi" denetimi kalkınca aynı kimlik ikinci kez gelince iş yeniden yapılır (ardından kayıt çakışır, istek düşer);
   3) "kimlik başkasında mı" denetimi kalkınca başka kişinin kimliğiyle gelen istekte iş YAPILIR (sonra kayıt çakışır — temiz ret yerine hata);
   4) kişi süzgeci politikadan kalkınca aynı firmada bir çalışan ötekinin işlemlerini (rapor içerikli sonuçlarını) görür. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri } from "../yardimci/supabase.ts";

type Islem = typeof import("../../src/server/islem/islem.ts");
const KOK = resolve("src/server/islem");
const KAYNAK = readFileSync(join(KOK, "islem.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "islem-bozan-"));
let sira = 0, kume: GomuluKume, havuz: Havuz, A = "";

async function bozukIslem(eski: string, yeni: string): Promise<Islem> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`);
  const yol = join(gecici, `i${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const bekle = (ms: number) => new Promise((coz) => setTimeout(coz, ms));
/** işi sayar; yavaş iş (ikinci istek "önceden işlendi mi"yi iş bitmeden sorsun) */
function sayac() {
  const s = { n: 0, is: async () => { s.n++; await bekle(300); return { durum: "tamam" }; } };
  return s;
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-islem', 'Bozuk İşlem', 'BI') RETURNING id::text")).rows[0].id; }
  finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1) danışma kilidi kalkınca aynı kimlik aynı anda iki istekte iş iki kez yapılır", async () => {
  const m = await bozukIslem("  await db.sorgu(\"SELECT pg_advisory_xact_lock(hashtextextended($1, 0))\", [`islem:${k.id}`]);\n", "");
  const s = sayac(), hesap = randomUUID(), k = { id: randomUUID(), tur: "rapor.kaydet", kayit: randomUUID(), zaman: null };
  await Promise.allSettled([1, 2].map(() => kiraciIcinde(havuz, A, (db) => m.tekSeferlik(db, k, s.is), { hesapId: hesap })));
  assert.equal(s.n, 2, "bozuk: iş iki kez yapıldı");
});

test("2) 'önceden işlendi mi' denetimi kalkınca aynı kimlik ikinci kez gelince iş yeniden yapılır", async () => {
  const m = await bozukIslem("  if (once) return once.tur === k.tur && once.kayit_id === k.kayit ? { durum: \"tekrar\", sonuc: once.sonuc } : { durum: \"kimlik_kullanildi\" };\n", "");
  const s = sayac(), hesap = randomUUID(), k = { id: randomUUID(), tur: "rapor.kaydet", kayit: randomUUID(), zaman: null };
  await kiraciIcinde(havuz, A, (db) => m.tekSeferlik(db, k, s.is), { hesapId: hesap });
  await assert.rejects(kiraciIcinde(havuz, A, (db) => m.tekSeferlik(db, k, s.is), { hesapId: hesap }), /duplicate key|yinelenen|benzersiz/i);
  assert.equal(s.n, 2, "bozuk: aynı kimlik ikinci kez işlendi");
});

test("3) 'kimlik başkasında mı' denetimi kalkınca başkasının kimliğiyle iş yapılır (sonra kayıt çakışır)", async () => {
  const m = await bozukIslem("  if ((await db.sorgu<{ v: boolean }>(\"SELECT islem_kimlik_baskasinda($1) AS v\", [k.id])).rows[0].v) return { durum: \"kimlik_kullanildi\" };\n", "");
  const s = sayac(), k = { id: randomUUID(), tur: "rapor.kaydet", kayit: randomUUID(), zaman: null };
  await kiraciIcinde(havuz, A, (db) => m.tekSeferlik(db, k, s.is), { hesapId: randomUUID() });
  await assert.rejects(kiraciIcinde(havuz, A, (db) => m.tekSeferlik(db, k, s.is), { hesapId: randomUUID() }), /duplicate key|yinelenen|benzersiz/i);
  assert.equal(s.n, 2, "bozuk: başka kişinin kimliğiyle iş yapıldı");
});

test("4) kişi süzgeci politikadan kalkınca aynı firmada bir çalışan ötekinin işlemlerini görür", async () => {
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  const ESKI = "      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)\n";
  for (const d of readdirSync(GOC_KLASORU)) {
    if (!d.endsWith(".sql")) continue;
    if (d.startsWith("0076_")) {
      const k = readFileSync(join(GOC_KLASORU, d), "utf8");
      assert.ok(k.includes(ESKI), "bozulacak satır göçte yok");
      writeFileSync(join(klasor, d), k.replace(ESKI, "      USING (firma_id = gecerli_firma())\n"));
    } else copyFileSync(join(GOC_KLASORU, d), join(klasor, d));
  }
  const supa = await supabaseBenzeri(kume, "islem_bozuk", klasor);
  const h = havuzKur({ ...kume.uygulama, database: "islem_bozuk" });
  try {
    const f = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-islem-4', 'Bozuk İşlem 4', 'BJ') RETURNING id::text")).rows[0].id;
    const birinci = randomUUID(), ikinci = randomUUID();
    await kiraciIcinde(h, f, (db) => db.sorgu("INSERT INTO islem (id, tur, kayit_id, sonuc) VALUES ($1, 'rapor.kaydet', $2, '{\"durum\":\"tamam\"}')", [randomUUID(), randomUUID()]),
      { hesapId: birinci });
    const n = (await kiraciIcinde(h, f, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM islem"), { hesapId: ikinci })).rows[0].n;
    assert.equal(n, 1, "bozuk: başka çalışanın işlemi görünüyor");
  } finally { await h.end(); await supa.kapat(); }
});
