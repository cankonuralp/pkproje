/* OLUMSUZ KANIT — tests/goc-uygula.test.ts (FIRMA-VT FV8, "uygula" kipi) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/db/goc-uygula.ts
   bellekte bozulup geçici klasörden içe aktarılır ve doğrudan çağrılır (hedefler sabit: kendi-A, kendi-B; sonraki denetim "tamam" sayılır); GERÇEK
   PostgreSQL (tests/yardimci/coklu-vt.ts) + Yönetim API taklidi. O zaman:
   1. önce-hepsinde özet denetimi kalkınca bir projede uygulanmış göç değiştirilmişken öteki projelere (merkeze) göç gider;
   2. ilk hatada durma kalkınca ikinci projede düşen göçten sonra üçüncü projeye de dokunulur;
   3. kilit kalkınca eşzamanlı iki derleme aynı göçü aynı projeye iki kez gönderir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type pg from "pg";
import { gocDosyalari } from "../../src/server/db/goc.ts";
import { havuzKur, type Havuz } from "../../src/server/db/kiraci.ts";
import { supabaseYonetimi, yonetimAyari } from "../../src/server/dis/supabase-yonetim.ts";
import { cokluVtKur, type CokluVt } from "../yardimci/coklu-vt.ts";
import { pgProjesi, sahteYonetimKur, type SahteYonetim } from "../yardimci/sahte-supabase-yonetim.ts";

const gecici = mkdtempSync(join(tmpdir(), "goc-uygula-bozan-"));
let v: CokluVt, s: SahteYonetim, merkez: Havuz;
const GOCLER = gocDosyalari();
const D1 = { ad: "9001_dagit_deneme.sql", metin: "CREATE TABLE IF NOT EXISTS public.dagit_deneme (n integer);\n" };
before(async () => {
  v = await cokluVtKur();
  s = await sahteYonetimKur();
  s.projeler.set("yerel-merkez", pgProjesi(() => v.merkezKume.sahipIstemci()));
  s.projeler.set(`yerel-${v.A.id}`, pgProjesi(() => v.ayriKume.sahipIstemci(v.A.baglanti.database)));
  s.projeler.set(`yerel-${v.B.id}`, pgProjesi(() => v.merkezKume.sahipIstemci("probata_kendi_b")));
  merkez = havuzKur(v.merkezKume.uygulama);
});
after(async () => { await merkez?.end(); await s?.kapat(); await v?.kapat(); rmSync(gecici, { recursive: true, force: true }); });

const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, a: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), a)).href}"`);
let sira = 0;
type Modul = typeof import("../../src/server/db/goc-uygula.ts");
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const k = kaynak("src/server/db/goc-uygula.ts");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(gecici, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<Modul>;
}
function klasor(...ek: { ad: string; metin: string }[]): string {
  const k = mkdtempSync(join(gecici, "k-"));
  for (const d of [...GOCLER, ...ek]) writeFileSync(join(k, d.ad), d.metin);
  return k;
}
const kos = (m: Modul, k: string) => {
  const dosyalar = gocDosyalari(k);
  return m.gocUygula({
    merkez, api: supabaseYonetimi(yonetimAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_YONETIM_UC: s.url })), yerel: true,
    merkezProje: "yerel-merkez", dosyalar, beklenen: { son: dosyalar.at(-1)!.ad, sayi: dosyalar.length }, yaz: () => {}, durdu: () => false,
    hedefler: async () => [{ firmaId: v.A.id, kisaAd: "kendi-a", ref: null, kurulumTamam: true }, { firmaId: v.B.id, kisaAd: "kendi-b", ref: null, kurulumTamam: true }],
    denetle: async () => ({ kod: 0, guncel: [] }),
  });
};
const sahipler = (): pg.Client[] => [v.merkezSahip, v.A.sahip, v.B.sahip];
const gocVar = async (c: pg.Client, ad: string) => Number((await c.query<{ n: string }>("SELECT count(*) AS n FROM goc WHERE ad = $1", [ad])).rows[0]!.n) === 1;
async function temizle(ad: string, tablo: string) {
  for (const c of sahipler()) { await c.query("DELETE FROM goc WHERE ad = $1", [ad]); await c.query(`DROP TABLE IF EXISTS public.${tablo}`); }
}

test("1. özet denetimi kalkınca değiştirilmiş göçlü projeye rağmen merkeze göç gider (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    if (sorun) { y(", "    if (false && sorun) { y(");
  const ilk = GOCLER[0]!;
  await v.B.sahip.query("UPDATE goc SET ozet = repeat('0', 64) WHERE ad = $1", [ilk.ad]);
  try {
    await kos(m, klasor(D1));
    assert.equal(await gocVar(v.merkezSahip, D1.ad), true, "bozuk: özet farkına rağmen merkeze uygulandı — testin 'hiçbir projeye' beklentisi düşer");
  } finally {
    await v.B.sahip.query("UPDATE goc SET ozet = $2 WHERE ad = $1", [ilk.ad, ilk.ozet]);
    await temizle(D1.ad, "dagit_deneme");
  }
});

test("2. ilk hatada durma kalkınca ikinci projede düşen göçten sonra üçüncüye dokunulur (kilidin koruduğu açık)", async () => {
  const m = await bozuk("          return 1;\n        }\n        ozet.uygulanan++;", "          continue;\n        }\n        ozet.uygulanan++;");
  const dusen = { ad: D1.ad, metin: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM vt_kimlik WHERE firma_id = '${v.A.id}') THEN RAISE EXCEPTION 'deneme'; END IF; END $$;\n` };
  try {
    await kos(m, klasor(dusen));
    assert.equal(await gocVar(v.B.sahip, D1.ad), true, "bozuk: üçüncü proje (kendi-B) değişti — testin 'dokunulmadı' beklentisi düşer");
  } finally {
    await temizle(D1.ad, "dagit_deneme");
  }
});

test("3. kilit kalkınca eşzamanlı iki koşu aynı göçü merkeze iki kez gönderir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    kilit = await isBasla(a.merkez, KILIT);", '    kilit = "00000000-0000-4000-8000-000000000000";');
  const asil = s.projeler.get("yerel-merkez")!;
  s.projeler.set("yerel-merkez", async (sql) => { if (sql.startsWith("BEGIN;")) await new Promise((c) => setTimeout(c, 1500)); return asil(sql); });
  const once = s.istekler.length;
  try {
    const k = klasor(D1);
    await Promise.all([kos(m, k), kos(m, k)]);
    const merkezeGiden = s.istekler.slice(once).filter((i) => i.proje === "yerel-merkez" && i.sql.includes(`VALUES ('${D1.ad}'`)).length;
    assert.equal(merkezeGiden, 2, "bozuk: göç merkeze iki kez gönderildi — testin 'her projede bir kez' beklentisi düşer");
  } finally {
    s.projeler.set("yerel-merkez", asil);
    await temizle(D1.ad, "dagit_deneme");
  }
});
