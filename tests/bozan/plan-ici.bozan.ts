/* OLUMSUZ KANIT — tests/plan-ici.test.ts neyi koruyor (310). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler / modül dosyası geçici klasöre
   kopyalanır, bellekte bozulur, kopyadan koşulur.
   1. 0024'teki akış tetiği olmasaydı plan "kabul bekliyor"dan doğrudan "tamamlandı"ya geçer, tarih elle yazılırdı (denetimsiz kapanış, uydurma damga).
   2. Not damga tetiği olmasaydı notu yazan hesap uydurulurdu (karar 27: not kimin, değişmez).
   3. Sunucuda plan_kabul_red denetimi olmasaydı ekipte olmayan planlamacı tarafsızlık beyanını denetçi yerine onaylardı.
   4. Künye düzenlenirken denetçinin gördüğü künye saklanmasaydı denetçinin ekranı kendiliğinden değişirdi (§3.4: "kendiliğinden geçmez"). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { bugunTr, planAc, type Kisi } from "../../src/modules/planlar/server/planlar.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const AKIS = "CREATE OR REPLACE TRIGGER plan_akis BEFORE INSERT OR UPDATE ON plan FOR EACH ROW EXECUTE FUNCTION plan_akis();";
const NOT = "CREATE OR REPLACE TRIGGER plan_not_damga BEFORE INSERT ON plan_not FOR EACH ROW EXECUTE FUNCTION plan_not_damga();";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
let havuz: Havuz;
let A: string;
const gecici = mkdtempSync(join(tmpdir(), "plan-ici-bozan-"));
const depo = klasorDepo(join(gecici, "depo"));

let sira = 0;
async function bozukModul<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const metin = readFileSync(kaynak, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(kaynak), yol)).href}"`);
  const hedef = join(gecici, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href) as Promise<M>;
}

/** firmaya müşteri, tesis, tür, ekipman, denetçi (hesaplı) ve planlamacı; plan açılır (ekipte denetçi) */
async function kur(h: Havuz, firma: string) {
  const q = (sql: string, p: unknown[] = []) => kiraciIcinde(h, firma, async (db) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id);
  const m = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Sanayi A.Ş.', 'Deneme') RETURNING id::text");
  const tesis = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m]);
  const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'HT-1', 'x') RETURNING id::text", [tesis, tur]);
  const per = await q("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Bir', '2024-01-01', 'mak-muh') RETURNING id::text");
  const den: Kisi = { id: await q("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ('d@deneme.example', 'Deneme', '{denetci}', 'etkin', $1) RETURNING id::text", [per]), ad: "Deneme", roller: ["denetci"] };
  const plan: Kisi = { id: await q("INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('p@deneme.example', 'Deneme', '{planlama}', 'etkin') RETURNING id::text"), ad: "Deneme", roller: ["planlama"] };
  const is = <T,>(k: Kisi, x: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(h, firma, x, { hesapId: k.id });
  const r = await is(plan, (db) => planAc(db, depo, plan, firma, { tesis, baslangic: bugunTr(), bitis: bugunTr(), ekip: [{ personel: per }] }));
  assert.ok(r.durum === "tamam", JSON.stringify(r));
  return { den, plan, id: r.id, is };
}

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0024_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(AKIS) && k.includes(NOT), "bozulacak satırlar kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(AKIS, "").replace(NOT, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "plan_ici_bozuk", klasor);
  [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  havuz = havuzKur({ ...kume.uygulama, database: "plan_ici_bozuk" });
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("akış tetiği olmayınca plan 'kabul bekliyor'dan doğrudan 'tamamlandı'ya geçer, tarihler elle yazılır (kilidin koruduğu açık)", async () => {
  const { id } = await kur(havuz, A);
  await kiraciIcinde(havuz, A, (db) => db.sorgu(
    "UPDATE plan SET durum = 'tamamlandi', kabul = '2000-01-01', kabul_eden = 'x', beyan = repeat('b', 30), kontrol_tamam = '2000-01-01', bitti = '2000-01-01' WHERE id = $1", [id]));
  const p = (await supa.sahip.query<{ durum: string; bitti: Date }>("SELECT durum, bitti FROM plan WHERE id = $1", [id])).rows[0];
  assert.deepEqual([p.durum, p.bitti.getUTCFullYear()], ["tamamlandi", 2000], "denetimsiz kapanış, uydurma tarih");
});

test("not damga tetiği olmayınca notu yazan hesap uydurulur", async () => {
  const id = (await supa.sahip.query<{ id: string }>("SELECT id::text FROM plan LIMIT 1")).rows[0].id;
  const sahte = "00000000-0000-4000-8000-000000000001";
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO plan_not (plan_id, metin, yazan, yazan_hesap) VALUES ($1, 'sahte', 'x', $2)", [id, sahte]));
  assert.equal((await supa.sahip.query<{ h: string }>("SELECT yazan_hesap::text AS h FROM plan_not WHERE metin = 'sahte'")).rows[0].h, sahte);
});

/* 3–4: göçler BOZULMAMIŞ (tetikler yerinde) — kümenin kendi veritabanı; bozulan sunucu kodu */
async function saglam() {
  const s = kume.sahipIstemci(); await s.connect();
  const C = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ($1, 'Deneme C', 'DC') RETURNING id", [`deneme-c${sira}`]).finally(() => s.end())).rows[0].id;
  const h = havuzKur(kume.uygulama);
  return { h, ...(await kur(h, C)) };
}
type PlanIci = typeof import("../../src/modules/planlar/server/plan-ici.ts");

test("sunucuda kabul / red denetimi kalkınca ekipte olmayan planlamacı beyanı denetçi yerine onaylar", async () => {
  const m = await bozukModul<PlanIci>("src/modules/planlar/server/plan-ici.ts",
    `  if (!canDoEylem(kim, "plan_kabul_red", { atananlar: e.atananlar })) return { durum: "yetkisiz" };\n`, "");
  const { h, plan, id, is } = await saglam();
  try {
    const v = (await is(plan, (db) => m.planIci(db, plan, id)))!;
    assert.equal((await is(plan, (db) => m.planKabul(db, plan, id, v.surum, true))).durum, "tamam", "planlamacı kabul etti");
  } finally { await h.end(); }
});

test("künye düzenlenirken denetçinin gördüğü künye saklanmayınca denetçinin ekranı kendiliğinden değişir", async () => {
  const m = await bozukModul<PlanIci>("src/modules/planlar/server/plan-ici.ts",
    "    if (s.gorulen === null) degerler.gorulen = { firma_adi: p.firma_adi, adres: p.adres, sgk: p.sgk, isg_no: s.isg_no };\n", "");
  const { h, plan, den, id, is } = await saglam();
  try {
    const v = (await is(plan, (db) => m.planIci(db, plan, id)))!;
    assert.equal((await is(plan, (db) => m.kunyeDuzenle(db, plan, id, v.surum, { firmaAdi: "Yeni Ünvan A.Ş." }))).durum, "tamam");
    const d = (await is(den, (db) => m.planIci(db, den, id)))!;
    assert.equal(d.kunye.firmaAdi, "Yeni Ünvan A.Ş.", "denetçinin künyesi Güncelle'siz değişti");
  } finally { await h.end(); }
});
