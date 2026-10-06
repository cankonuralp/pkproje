/* OLUMSUZ KANIT — tests/depo-vt.test.ts "anahtarın firması satırın firması" neyi koruyor (0049). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler
   geçici klasöre kopyalanır, 0049'daki depo_nesne_firma denetimi bellekte kaldırılır. O zaman B firması kendi işleminde A'nın anahtar alanına
   (firma/<A>/…) nesne yazar — A'nın dosyası yüklenmeden önce aynı anahtarı tutup içeriğini zehirleyebilir. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../../src/server/db/kiraci.ts";
import { dosyaAnahtari } from "../../src/server/dosya/anahtar.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const DENETIM = ",\n  CONSTRAINT depo_nesne_firma CHECK (split_part(anahtar, '/', 2) = firma_id::text)\n";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "depo-vt-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0049_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(DENETIM), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(DENETIM, "\n"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "depo_vt_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("anahtar ↔ firma denetimi kalkınca B, A'nın anahtar alanına nesne yazar (kilidin koruduğu açık)", async () => {
  const [A, B] = (await supa.sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id::text")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "depo_vt_bozuk" });
  try {
    const k = dosyaAnahtari({ firmaId: A, modul: "deneme", kayitId: randomUUID(), dosyaId: randomUUID() });
    await kiraciIcinde(havuz, B, (db) => db.sorgu("INSERT INTO depo_nesne (anahtar, bayt) VALUES ($1, '\\x01')", [k]));
    const n = (await kiraciIcinde(havuz, B, (db) => db.sorgu("SELECT 1 FROM depo_nesne WHERE anahtar = $1", [k]))).rowCount;
    assert.equal(n, 1, "bozuk: B, A'nın anahtar alanına yazdı");
  } finally { await havuz.end(); }
});
