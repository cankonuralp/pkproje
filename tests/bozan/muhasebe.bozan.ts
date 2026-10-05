/* OLUMSUZ KANIT — tests/muhasebe.test.ts neyi koruyor (327; göç 0039). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre
   kopyalanır, 0039 bellekte bozulur, kopyadan koşulur. Fatura süper kullanıcıyla, tetiksiz kurulur (ölçülen şey tahsilat).
   1. Kalan denetimi olmasaydı faturanın tutarından fazla tahsilat yazılırdı (açık alacak eksiye düşer).
   2. Tarih denetimi olmasaydı fatura tarihinden önceki bir güne tahsilat yazılırdı.
   3. Kaydeden veritabanında damgalanmasaydı istemcinin yazdığı kimlik "kaydeden" olurdu. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

let kume: GomuluKume;
const gecici = mkdtempSync(join(tmpdir(), "muhasebe-bozan-"));
const acilan: { supa: SupabaseBenzeri; havuz: Havuz }[] = [];

/** 0039'u bozarak Supabase taklidi veritabanı açar; A firması, müşteri, 1.000,00 TL'lik fatura (dünkü tarihli; süper kullanıcıyla, tetiksiz) */
async function bozuk(ad: string, eski: string, yeni: string) {
  const klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const g of readdirSync(GOC_KLASORU)) {
    if (!g.endsWith(".sql")) continue;
    if (g.startsWith("0039_")) {
      const k = readFileSync(join(GOC_KLASORU, g), "utf8");
      assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, g), k.replace(eski, yeni));
    } else copyFileSync(join(GOC_KLASORU, g), join(klasor, g));
  }
  const supa = await supabaseBenzeri(kume, ad, klasor);
  const havuz = havuzKur({ ...kume.uygulama, database: ad });
  acilan.push({ supa, havuz });
  const q = async (sql: string, p: unknown[] = []) => (await supa.sahip.query<{ id: string }>(sql, p)).rows[0].id;
  const A = await q("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text");
  const m = await q("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Bir A.Ş.', 'Deneme Bir') RETURNING id::text", [A]);
  await supa.sahip.query("SET session_replication_role = replica");
  let f: string;
  try {
    f = await q(`INSERT INTO fatura (firma_id, no, musteri_id, tarih, vade_gun, vade, kdv, ara, kdv_tutar, toplam)
      VALUES ($1, 'KMF202600000001', $2, current_date - 1, 30, current_date + 29, 20, 100000, 0, 100000) RETURNING id::text`, [A, m]);
  } finally { await supa.sahip.query("SET session_replication_role = origin"); }
  return { havuz, A, f };
}

before(async () => { kume = await testKumesi(); });
after(async () => {
  for (const x of acilan) { await x.havuz.end(); await x.supa.kapat(); }
  await kume?.durdur();
  rmSync(gecici, { recursive: true, force: true });
});

test("0039'da kalan denetimi kalkınca faturanın tutarından fazla tahsilat yazılır (kilidin koruduğu açık)", async () => {
  const { havuz, A, f } = await bozuk("muhasebe_bozuk1", "  IF odenen + NEW.tutar > f.toplam THEN", "  IF false THEN");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO tahsilat (fatura_id, tarih, tutar, yontem) VALUES ($1, current_date, 999999, 'nakit')", [f]));
  assert.equal(r.rowCount, 1, "kalandan fazla tahsilat yazıldı");
});

test("0039'da tarih denetimi kalkınca fatura tarihinden önceki güne tahsilat yazılır", async () => {
  const { havuz, A, f } = await bozuk("muhasebe_bozuk2", "  IF NEW.tarih < f.tarih THEN", "  IF false THEN");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO tahsilat (fatura_id, tarih, tutar, yontem) VALUES ($1, current_date - 10, 100, 'nakit')", [f]));
  assert.equal(r.rowCount, 1, "faturadan önceki tahsilat yazıldı");
});

test("0039'da kaydeden damgası kalkınca istemcinin yazdığı kimlik kaydeden olur", async () => {
  const { havuz, A, f } = await bozuk("muhasebe_bozuk3",
    "  NEW.kaydeden := NULLIF(current_setting('app.hesap_id', true), '')::uuid;\n  RETURN NEW;\nEND $$;\nALTER FUNCTION tahsilat_koru()",
    "  RETURN NEW;\nEND $$;\nALTER FUNCTION tahsilat_koru()");
  const sahte = "00000000-0000-4000-8000-000000000001";
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ k: string }>(
    "INSERT INTO tahsilat (fatura_id, tarih, tutar, yontem, kaydeden) VALUES ($1, current_date, 100, 'nakit', $2) RETURNING kaydeden::text AS k", [f, sahte]));
  assert.equal(r.rows[0].k, sahte, "istemcinin kimliği yazıldı");
});
