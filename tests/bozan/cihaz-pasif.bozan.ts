/* OLUMSUZ KANIT — tests/kesin-silme.test.ts "pasif" (358) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): cihazlar.ts bellekte bozulur,
   geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir). Zimmet denetimi kalkınca kişinin zimmetindeki cihaz pasife alınır —
   pasif cihaz Zimmetler'den düşer, kişiden geri teslim alınamaz (çıkmaz kayıt). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/olcum-cihazlari/server/cihazlar.ts");
const KOK = resolve("src/modules/olcum-cihazlari/server");
const KAYNAK = readFileSync(join(KOK, "cihazlar.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const ZIMMET = "    if ((await kimdeHaritasi(db)).cihaz.get(id)) return { durum: \"red\", neden: `${c.kod} bir kişinin zimmetinde; önce Zimmetler'den depoya teslim alın.` };\n";
const gecici = mkdtempSync(join(tmpdir(), "cihaz-pasif-bozan-"));
let kume: GomuluKume, havuz: Havuz;

before(async () => { kume = await testKumesi(); havuz = havuzKur(kume.uygulama); });
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("zimmet denetimi kalkınca kişinin zimmetindeki cihaz pasife alınır (kilidin koruduğu açık)", async () => {
  assert.ok(KAYNAK.includes(ZIMMET), "bozulacak satır kaynakta yok");
  const yol = join(gecici, "cihazlar.ts");
  writeFileSync(yol, KAYNAK.replace(ZIMMET, () => ""));
  const m: Modul = await import(pathToFileURL(yol).href);
  const s = kume.sahipIstemci(); await s.connect();
  let A: string;
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id; } finally { await s.end(); }
  const t = await kiraciIcinde(havuz, A, async (db) => ({
    yon: (await db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('yon@deneme-a.example', 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text")).rows[0].id,
    per: (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Bir', '2024-01-01', 'elk-muh') RETURNING id::text")).rows[0].id,
  }));
  const yon = { id: t.yon, ad: "Deneme", roller: ["firma_yoneticisi"] } as Parameters<Modul["cihazPasif"]>[1];
  const r = await kiraciIcinde(havuz, A, async (db) => {
    const c = await m.cihazKaydet(db, yon, null, 0, { kod: "BZ-P", tur: "yeni", yeniTur: "Deneme ölçer", marka: "", model: "", seri: "", aralik: "" });
    assert.equal(c.durum, "tamam");
    const id = (c as { id: string }).id;
    await db.sorgu("INSERT INTO zimmet_hareket (cihaz_id, alan_personel, zaman) VALUES ($1, $2, now())", [id, t.per]);
    return m.cihazPasif(db, yon, id, 0, true);
  }, { hesapId: t.yon });
  assert.equal(r.durum, "tamam", "bozuk: zimmetteki cihaz pasife alındı");
});
