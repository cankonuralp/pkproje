/* OLUMSUZ KANIT — tests/firma-kurulum.test.ts (FIRMA-VT FV10) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): kurulum.ts / kurulum-hata.ts
   bellekte bozulup geçici klasörden içe aktarılır; GERÇEK PostgreSQL merkez + Yönetim API taklidi (projenin donanımı uydurma: SQL'i kaydeder, satır
   döndürmez — bozanlar yalnız ilk adımlara bakar). O zaman:
   1. proje adımında adla arama kalkınca yanıtı kaybolan açılıştan sonra İKİNCİ proje açılır (Supabase'te proje açmada tekrar koruması yok — fatura);
   2. 403 yeniden denenen sayılınca yetkisi yetmeyen anahtarla kurulum "durdu"ya düşmez, boşuna dener;
   3. rol adımında SCRAM özeti yerine düz parola gönderilince uygulama parolası Yönetim API'sine (ve onun günlüğüne) gider. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type pg from "pg";
import type { KurulumOrtami } from "../../src/modules/yonetim/server/kurulum.ts";
import { baglantiCoz } from "../../src/server/db/baglanti.ts";
import { yonlendiriciKur, type Yonlendirici } from "../../src/server/db/firma-havuzu.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { isBasla, isBitir } from "../../src/server/db/is.ts";
import { havuzKur, yonetimFirmadaIcinde, yonetimIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { supabaseYonetimi } from "../../src/server/dis/supabase-yonetim.ts";
import { parolaOzeti } from "../../src/server/kimlik/parola.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { sahteYonetimKur, type SahteYonetim } from "../yardimci/sahte-supabase-yonetim.ts";

const gecici = mkdtempSync(join(tmpdir(), "firma-kurulum-bozan-"));
const ANA = randomBytes(32);
const YE = "yonetici@probata.example";
let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, s: SahteYonetim, y: Yonlendirici, o: KurulumOrtami;

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci(); await sahip.connect();
  const yid = (await sahip.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti, durum, totp_sir) VALUES ($1, 'Deneme Yönetici', $2, 'etkin', 'v1.uydurma-dogrulama-anahtari') RETURNING id::text",
    [YE, await parolaOzeti("yonetim-parola-2026")])).rows[0]!.id;
  s = await sahteYonetimKur();
  /* uydurma donanım: SQL'i kabul eder, satır döndürmez; havuzcu yerel ama kapalı kapı (deneme adımı bağlanamaz — bozanlar oraya varmaz) */
  s.projeKur = async () => ({ yurutucu: async () => [], havuzcu: [{ db_host: "127.0.0.1", db_port: 1, db_name: "proje_vt", pool_mode: "transaction" }] });
  y = yonlendiriciKur({ merkez: () => havuz, anahtar: () => ANA, merkezYerel: true });
  o = {
    merkez: (is) => yonetimIcinde(havuz, is, { yoneticiId: yid }),
    firmada: (kayit, id, is) => yonetimFirmadaIcinde(y.firmaHavuzu(kayit), id, is, { yoneticiEposta: YE }),
    api: supabaseYonetimi({ uc: s.url, anahtar: s.anahtar, yerel: true }, { bekle: async () => {} }), yerel: true, orgut: "probata-deneme",
    anaAnahtar: ANA, merkezYerel: true, depoUc: "http://127.0.0.1:1", firmaHavuzu: (k) => y.firmaHavuzu(k),
    gocKilidi: { al: () => isBasla(havuz, "goc_dagitim"), birak: async (id, t) => { await isBitir(havuz, id, t ? "tamam" : "hata", { kurulum: 1 }); } },
    butceMs: 20_000,
  };
});
after(async () => { await y?.kapat(); await havuz?.end(); await sahip?.end(); await s?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

const KURULUM = "src/modules/yonetim/server/kurulum.ts", HATA = "src/modules/yonetim/server/kurulum-hata.ts";
const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, a: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), a)).href}"`);
let sira = 0;
type Modul = typeof import("../../src/modules/yonetim/server/kurulum.ts");
const yaz = (metin: string) => { const p = join(gecici, `m-${sira++}.ts`); writeFileSync(p, metin); return pathToFileURL(p).href; };
async function bozukKurulum(eski: string, yeni: string, hataUrl?: string): Promise<Modul> {
  let k = kaynak(KURULUM);
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  k = k.replace(eski, () => yeni);
  if (hataUrl) k = k.replace(pathToFileURL(resolve(HATA)).href, hataUrl);
  return import(yaz(k)) as Promise<Modul>;
}
async function bozukHata(eski: string, yeni: string): Promise<Modul> {
  const k = kaynak(HATA);
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  return bozukKurulum("", "", yaz(k.replace(eski, () => yeni)));
}
async function baslat(m: Modul, alt: string, kod: string): Promise<string> {
  const r = await m.kurulumBaslat(o, { unvan: `Bozan ${kod} Muayene A.Ş.`, alt, kod, yon: "Bozan Yönetici", eposta: `yonetici@${alt}.example` }, [], "localhost", null);
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  return r.durum === "tamam" ? r.id : "";
}
const projeAcmalari = (ad: string) => s.istekler.filter((i) => i.yontem === "POST" && i.yol === "/v1/projects" && JSON.parse(i.govde).name === ad).length;

test("1. adla arama kalkınca yanıtı kaybolan açılıştan sonra ikinci proje açılır (kilidin koruduğu açık)", async () => {
  const m = await bozukKurulum("      let p = (await o.api.projeler()).find((x) => x.ad === ad);",
    "      let p = undefined as { id: string; ad: string; durum: string } | undefined;");
  const id = await baslat(m, "bozan-a", "BA");
  s.hatalar.push({ yontem: "POST", yol: /^\/v1\/projects$/, durum: "kaybol", kez: 1 });
  await m.kurulumIlerlet(o, id);
  await m.kurulumIlerlet(o, id);
  assert.equal(projeAcmalari(`probata-bozan-a-${id.slice(0, 8)}`), 2, "bozuk: iki proje — testin 'proje açma isteği bir kez' beklentisi düşer");
});

test("2. 403 yeniden denenen sayılınca kurulum durmaz, boşuna dener (kilidin koruduğu açık)", async () => {
  const m = await bozukHata('if (h.durum === 401 || h.durum === 403) return { sinif: "kalici", kod: "yetki" };',
    'if (h.durum === 401 || h.durum === 403) return { sinif: "yeniden", kod: "yetki" };');
  const id = await baslat(m, "bozan-b", "BB");
  s.hatalar.push({ yontem: "GET", yol: /^\/v1\/projects$/, durum: 403, kez: 1 });
  const g = await m.kurulumIlerlet(o, id);
  assert.deepEqual([g?.durum, g?.kod], ["hata", "yetki"], "bozuk: 403'te 'hata' (yeniden) — testin 'durdu' beklentisi düşer");
});

test("3. rol adımında düz parola gönderilince uygulama parolası Yönetim API'sine gider (kilidin koruduğu açık)", async () => {
  const m = await bozukKurulum("      await o.api.sorgu(p, `ALTER ROLE probata_uygulama LOGIN PASSWORD '${ozet}'`);",
    "      await o.api.sorgu(p, `ALTER ROLE probata_uygulama LOGIN PASSWORD '${parola}'`);");
  const id = await baslat(m, "bozan-c", "BC");
  await m.kurulumIlerlet(o, id);   // proje açılır (uydurma donanım); hazırlık bekler
  await sahip.query("UPDATE firma_kurulum SET adim = 'rol', durum = 'calisiyor', kira = NULL, kira_bitis = NULL WHERE firma_id = $1", [id]);
  await m.kurulumIlerlet(o, id);   // rol → havuzcu → depo → deneme (bağlanamaz)
  const sif = (await sahip.query<{ p: string }>("SELECT parola_sifreli AS p FROM firma_vt WHERE firma_id = $1", [id])).rows[0]!.p;
  const parola = baglantiCoz(sif, id, null, "uygulama_parolasi", ANA);
  assert.ok(s.istekler.some((i) => i.govde.includes(parola)), "bozuk: düz parola istekte — testin 'API'ye gitmedi' beklentisi düşer");
});
