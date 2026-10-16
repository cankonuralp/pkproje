/* OLUMSUZ KANIT — tests/yonetim-firmada.test.ts (FIRMA-VT FV9) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): firma-tarafi.ts bellekte bozulup
   geçici klasörden içe aktarılır; GERÇEK PostgreSQL (tests/yardimci/coklu-vt.ts). O zaman:
   1. dondurmada sıra ters (önce merkez) olunca firma tarafına ulaşılamazken merkez dondurulur, firma veritabanında giriş açık kalır — iki taraf ayrışır;
   2. kendi projeli firmada anahtar yazılınca merkezin izi atlanırsa yönetimin değişikliği merkezde görünmez (K4: "iki taraf denetim izinde"). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import type { YonetimCalistirici } from "../../src/modules/yonetim/server/firma-tarafi.ts";
import { havuzKur, yonetimFirmadaIcinde, yonetimIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { parolaOzeti } from "../../src/server/kimlik/parola.ts";
import { cokluVtKur, type CokluVt } from "../yardimci/coklu-vt.ts";

const gecici = mkdtempSync(join(tmpdir(), "yonetim-firmada-bozan-"));
let v: CokluVt, hA: Havuz, c: YonetimCalistirici;
const YE = "yonetici@probata.example";
before(async () => {
  v = await cokluVtKur();
  hA = havuzKur(v.A.baglanti);
  const y = (await v.merkezSahip.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti, durum, totp_sir) VALUES ($1, 'Deneme Yönetici', $2, 'etkin', 'v1.uydurma-dogrulama-anahtari') RETURNING id::text",
    [YE, await parolaOzeti("yonetim-parola-2026")])).rows[0]!.id;
  c = { merkez: (is) => yonetimIcinde(v.merkez, is, { yoneticiId: y }), firmada: (_k, id, is) => yonetimFirmadaIcinde(hA, id, is, { yoneticiEposta: YE }) };
});
after(async () => { await hA?.end(); await v?.kapat(); rmSync(gecici, { recursive: true, force: true }); });

const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, a: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), a)).href}"`);
let sira = 0;
type Modul = typeof import("../../src/modules/yonetim/server/firma-tarafi.ts");
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const k = kaynak("src/modules/yonetim/server/firma-tarafi.ts");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(gecici, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<Modul>;
}
const durumlar = async () => [
  (await v.merkezSahip.query<{ d: string }>("SELECT durum AS d FROM firma WHERE id = $1", [v.A.id])).rows[0]!.d,
  (await v.A.sahip.query<{ d: string }>("SELECT durum AS d FROM firma WHERE id = $1", [v.A.id])).rows[0]!.d,
];

test("1. dondurmada sıra ters olunca firma tarafına ulaşılamazken merkez dondurulur — iki taraf ayrışır (kilidin koruduğu açık)", async () => {
  const m = await bozuk(`  if (durum === "dondu") {
    const f = await firmaTarafi();`, `  if (durum === "dondu") {
    await merkez();
    const f = await firmaTarafi();`);
  const kopuk: YonetimCalistirici = { merkez: c.merkez, firmada: async () => { throw new Error("ulaşılamadı"); } };
  try {
    await m.firmaDurumuYonet(kopuk, v.A.id, "dondu");
    assert.deepEqual(await durumlar(), ["dondu", "etkin"], "bozuk: merkez dondu, firmada giriş açık — testin 'merkez değişmedi' beklentisi düşer");
  } finally {
    await v.merkezSahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.A.id]);
  }
});

test("2. kendi projelide anahtar yazılınca merkezin izi atlanırsa yönetimin değişikliği merkezde görünmez (kilidin koruduğu açık)", async () => {
  const m = await bozuk('  if (y.vt === "kendi") {\n    await c.merkez((db) => db.sorgu("SELECT yonetim_firmada_iz($1, \'ayar.yz_anahtari\'', '  if (false) {\n    await c.merkez((db) => db.sorgu("SELECT yonetim_firmada_iz($1, \'ayar.yz_anahtari\'');
  const r = await m.yzAnahtariYonet(c, v.A.id, "sk-ant-uydurmaAnahtarDegil0123456789wxyz", randomBytes(32));
  assert.equal(r.durum, "tamam");
  const iz = await v.merkezSahip.query("SELECT 1 FROM yonetim_izi WHERE hedef_firma = $1 AND ne = 'ayar.yz_anahtari'", [v.A.id]);
  assert.equal(iz.rowCount, 0, "bozuk: merkezde iz yok — testin 'merkezin izi' beklentisi düşer");
});
