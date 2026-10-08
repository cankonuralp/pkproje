/* OLUMSUZ KANIT — tests/islem.test.ts'in plan işleri (400) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): planlar/server/islem-baglanti.ts
   bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir). GERÇEK PostgreSQL. O zaman:
   1) cihazda okunan beyan metninin özeti zorunlu olmaktan çıkınca özetsiz gelen kabul, "metin değişti mi" denetimini ATLAR — eski (sonradan
      değişmiş) beyanı okuyan denetçinin bağlantısız kabulü geçer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { planIslemi } from "../../src/modules/planlar/server/islem-baglanti.ts";
import { planIci } from "../../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../../src/modules/planlar/server/planlar.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Baglanti = typeof import("../../src/modules/planlar/server/islem-baglanti.ts");
const KOK = resolve("src/modules/planlar/server");
const KAYNAK = readFileSync(join(KOK, "islem-baglanti.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "plan-islem-bozan-"));
const depo = klasorDepo(mkdtempSync(join(tmpdir(), "plan-islem-depo-")));
let sira = 0, kume: GomuluKume, havuz: Havuz, A = "", t1 = "", denP = "";
let PLAN: Kisi, DEN: Kisi;

async function bozuk(eski: string, yeni: string): Promise<Baglanti> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`);
  const yol = join(gecici, `p${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const q = async (metin: string, p: unknown[] = []) => (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(metin, p))).rows[0].id;
async function hesap(eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = await q("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]);
  return { id, ad, roller: roller as Kisi["roller"] };
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-plan-islem', 'Bozuk Plan İşlem', 'BP') RETURNING id::text")).rows[0].id; }
  finally { await s.end(); }
  denP = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi', '2024-01-01', 'mak-muh', '123') RETURNING id::text");
  PLAN = await hesap("plan@boz-plan.example", ["planlama"], "Deneme Planlama");
  DEN = await hesap("den@boz-plan.example", ["denetci"], "Deneme Denetçi", denP);
  const m = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir Sanayi A.Ş.', 'Deneme Bir') RETURNING id::text");
  t1 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m]);
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

async function yeniPlan(): Promise<{ id: string; surum: number }> {
  const r = await kiraciIcinde(havuz, A, (db) => planAc(db, depo, PLAN, A, { tesis: t1, baslangic: bugunTr(), bitis: bugunTr(),
    ekip: [{ personel: denP, isgNo: "ISG-1", kaydet: false }] }), { hesapId: PLAN.id });
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  const id = (r as { id: string }).id;
  return { id, surum: (await kiraciIcinde(havuz, A, (db) => planIci(db, DEN, id), { hesapId: DEN.id }))!.surum };
}

test("1) beyan özeti zorunlu olmaktan çıkınca özetsiz gelen kabul metin denetimini atlar ve geçer", async () => {
  /* bozulmamış: özetsiz kabul reddedilir */
  const p0 = await yeniPlan();
  const saglam = await kiraciIcinde(havuz, A, (db) => planIslemi(db, DEN, "plan.kabul", p0.id, p0.surum, { beyanOnay: true }), { hesapId: DEN.id });
  assert.equal(saglam.durum, "gecersiz");
  const m = await bozuk("beyanOzet: z.string().min(1).max(64) });", "beyanOzet: z.string().min(1).max(64).optional() });");
  const p1 = await yeniPlan();
  const r = await kiraciIcinde(havuz, A, (db) => m.planIslemi(db, DEN, "plan.kabul", p1.id, p1.surum, { beyanOnay: true }), { hesapId: DEN.id });
  assert.equal(r.durum, "tamam", "bozuk: okunan metnin özeti olmadan kabul geçti");
});
