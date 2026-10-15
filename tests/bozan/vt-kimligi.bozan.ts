/* OLUMSUZ KANIT — tests/vt-kimligi.test.ts (FIRMA-VT FV1, göç 0095) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): kiraci.ts bellekte
   bozulup geçici klasörden içe aktarılır ("pg" mutlak adrese çevrilir); göçler geçici klasöre kopyalanıp bellekte bozulur.
   1. kiraciIcinde vt_firma_dogrula'yı çağırmazsa başka firmanın işi (ortak firma, olmayan kimlik) bir firmanın KENDİ veritabanında koşar — yanlış
      havuz seçildiğinde veri karışır; testin "REDDEDİLİR" beklentisi bunu yakalar.
   2. firma tablosunun tetiği kalkarsa firma veritabanına başka firmanın satırı eklenir. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";
import { GOC_KLASORU, gocleriUygula } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Kiraci = typeof import("../../src/server/db/kiraci.ts");
const gecici = mkdtempSync(join(tmpdir(), "vt-kimligi-bozan-"));
const KAYNAK = readFileSync(resolve("src/server/db/kiraci.ts"), "utf8").replace('from "pg"', `from "${import.meta.resolve("pg")}"`);

async function bozukKiraci(eski: string, yeni: string): Promise<Kiraci> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `kiraci-${randomUUID()}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
function bozukGocler(eski: string, yeni: string): string {
  const klasor = join(gecici, `gocler-${randomUUID()}`);
  mkdirSync(klasor);
  for (const d of readdirSync(GOC_KLASORU)) {
    if (!d.endsWith(".sql")) continue;
    if (d.startsWith("0095_")) {
      const k = readFileSync(join(GOC_KLASORU, d), "utf8");
      assert.ok(k.includes(eski), `bozulacak satır göçte yok: ${eski}`);
      writeFileSync(join(klasor, d), k.replace(eski, () => yeni));
    } else copyFileSync(join(GOC_KLASORU, d), join(klasor, d));
  }
  return klasor;
}

let kume: GomuluKume;
const sahipler: pg.Client[] = [];
const havuzlar: Havuz[] = [];

/** kümede firma veritabanı: göçler (verilen klasörden), kimlik ve firma satırı kurulumdaki sırayla */
async function firmaVeritabani(ad: string, X: string, klasor?: string): Promise<{ sahip: pg.Client; havuz: Havuz }> {
  const y = kume.sahipIstemci("postgres");
  await y.connect();
  try { await y.query(`CREATE DATABASE ${ad} ENCODING 'UTF8' LOCALE 'C' TEMPLATE template0`); } finally { await y.end(); }
  const sahip = kume.sahipIstemci(ad);
  await sahip.connect();
  sahipler.push(sahip);
  await gocleriUygula(sahip, klasor);
  await sahip.query("UPDATE vt_kimlik SET tur = 'firma', firma_id = $1 WHERE tur = 'ortak'", [X]);
  await sahip.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES ($1, 'kendi-x', 'Kendi X Muayene', 'KX', 'kendi')", [X]);
  const havuz = havuzKur({ ...kume.uygulama, database: ad });
  havuzlar.push(havuz);
  return { sahip, havuz };
}

before(async () => { kume = await testKumesi(); });
after(async () => {
  for (const h of havuzlar) await h.end();
  for (const s of sahipler) await s.end();
  await kume?.durdur();
});

test("1. kiraciIcinde doğrulamayı çağırmazsa başka firmanın işi firma veritabanında koşar (kilidin koruduğu açık)", async () => {
  const X = randomUUID();
  const { havuz } = await firmaVeritabani("probata_bozan_1", X);
  /* sağlam kod reddeder */
  await assert.rejects(kiraciIcinde(havuz, randomUUID(), (db) => db.sorgu("SELECT 1")), (e: unknown) => (e as { code?: string }).code === "42501");
  const bozuk = await bozukKiraci("set_config('app.hesap_id', $2, true), vt_firma_dogrula($1::uuid)\"", "set_config('app.hesap_id', $2, true)\"");
  const baska = randomUUID();
  const r = await bozuk.kiraciIcinde(havuz, baska, (db) => db.sorgu<{ f: string }>("SELECT current_setting('app.firma_id') AS f"));
  assert.equal(r.rows[0].f, baska, "bozuk: başka firmanın işi firma veritabanında koştu");
});

test("2. firma tablosunun tetiği kalkarsa firma veritabanına başka firmanın satırı eklenir (kilidin koruduğu açık)", async () => {
  const X = randomUUID();
  const klasor = bozukGocler(
    "CREATE TRIGGER firma_vt_koru BEFORE INSERT OR UPDATE OF id ON firma FOR EACH ROW EXECUTE FUNCTION firma_vt_koru();",
    "-- (bozuk: tetik yok)");
  const { sahip } = await firmaVeritabani("probata_bozan_2", X, klasor);
  await sahip.query("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('baska', 'Başka Muayene', 'BA')");
  assert.equal((await sahip.query("SELECT count(*)::int AS n FROM firma")).rows[0].n, 2, "bozuk: ikinci firma eklendi");
});
