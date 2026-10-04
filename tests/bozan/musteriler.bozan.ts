/* OLUMSUZ KANIT — tests/musteriler.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   1) tesis → müşteri bağı yalnız müşteri kimliğiyle olsaydı (firma + müşteri birlikte değil), B firması kendi bağlamında A'nın müşterisine tesis
      satırı yazardı: yabancı anahtar denetimi satır güvenliğine (RLS) bakmaz. Göçler geçici klasöre, 0012'deki bağ bellekte gevşetilerek kopyalanır.
   2) "değiştirmek yalnız yaz düzeyinde" denetimi "görür" düzeyine gevşeseydi denetçi müşteri eklerdi (musteriler.ts bellekte bozulur). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const BAG = "  FOREIGN KEY (firma_id, musteri_id) REFERENCES musteri (firma_id, id),";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "musteri-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0012_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(BAG), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(BAG, "  FOREIGN KEY (musteri_id) REFERENCES musteri (id),"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "musteri_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("bağ yalnız müşteri kimliğiyle olunca B firması A'nın müşterisine tesis yazar (kilidin koruduğu açık)", async () => {
  const [A, B] = (await supa.sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "musteri_bozuk" });
  try {
    const m = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme A Müşteri', 'Deneme') RETURNING id::text"))).rows[0].id;
    await kiraciIcinde(havuz, B, (db) => db.sorgu("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Sızma')", [m]));
    const n = await supa.sahip.query("SELECT 1 FROM tesis t JOIN musteri m ON m.id = t.musteri_id WHERE t.firma_id <> m.firma_id");
    assert.equal(n.rowCount, 1, "B'nin tesisi A'nın müşterisine bağlandı");
  } finally { await havuz.end(); }
});

test("'yalnız yaz düzeyi değiştirir' gevşeyince denetçi müşteri ekler", async () => {
  const dosya = "src/modules/musteriler/server/musteriler.ts";
  let k = readFileSync(dosya, "utf8");
  const eski = 'const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";';
  assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
  k = k.replace(eski, "const degistirir = gorur;")
    .replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(dirname(dosya), y)).href}"`);
  const yol = join(gecici, "musteriler-bozuk.ts");
  writeFileSync(yol, k);
  const m = await import(pathToFileURL(yol).href) as typeof import("../../src/modules/musteriler/server/musteriler.ts");
  const db = { sorgu: async (metin: string) => (metin.startsWith("INSERT INTO musteri") ? { rows: [{ id: "00000000-0000-4000-8000-000000000001", surum: 0 }], rowCount: 1 } : { rows: [], rowCount: 0 }) } as never;
  const r = await m.musteriKaydet(db, { id: "x", ad: "Deneme", roller: ["denetci"] }, null, 0, { unvan: "Deneme Ltd.", kisa: "", vd: "", vno: "", eposta: "", tel: "", ilgili: "" }, false);
  assert.equal(r.durum, "tamam", "bozuk: denetçi müşteri ekledi");
});
