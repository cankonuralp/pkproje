/* OLUMSUZ KANIT — tests/talepler.test.ts "talep formu" neyi koruyor (341). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): talepler.ts bellekte bozulup
   geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. İzin formunun erişim denetimi (talep eden ya da firma yöneticisi) kalkınca başka bir çalışan kişinin izin formunu (tarihler, gerekçe) alır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/talepler/server/talepler.ts");
const KOK = resolve("src/modules/talepler/server");
const KAYNAK = readFileSync(join(KOK, "talepler.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "talep-formu-bozan-"));
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, "t.ts");
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume, havuz: Havuz;
before(async () => { kume = await testKumesi(); havuz = havuzKur(kume.uygulama); });
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("izin formunun erişim denetimi kalkınca başka çalışan kişinin izin formunu alır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    if (!x || !(x.personel_id === ben || izinYonetir(kim))) return null;\n", "    if (!x) return null;\n");
  const s = kume.sahipIstemci(); await s.connect();
  let A: string, plan: string, izin: string;
  try {
    await s.query("SET session_replication_role = replica");
    A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    const den = (await s.query<{ id: string }>("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Denetçi', '2024-01-01', 'mak-muh') RETURNING id::text", [A])).rows[0].id;
    const pp = (await s.query<{ id: string }>("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Planlama', '2024-01-01', 'mak-tek') RETURNING id::text", [A])).rows[0].id;
    plan = (await s.query<{ id: string }>("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, 'plan@deneme-a.example', 'Deneme', '{planlama}', 'etkin', $2) RETURNING id::text", [A, pp])).rows[0].id;
    izin = (await s.query<{ id: string }>("INSERT INTO izin_talebi (firma_id, no, personel_id, tur, bas, bit, gun, aciklama) VALUES ($1, 'I-1026-001', $2, 'rapor', '2026-10-12', '2026-10-12', 1, 'Deneme sağlık') RETURNING id::text", [A, den])).rows[0].id;
  } finally { await s.end(); }
  const PLAN = { id: plan, ad: "Deneme", roller: ["planlama" as const] };
  const v = await kiraciIcinde(havuz, A, (db) => m.talepFormuVerisi(db, PLAN, "izin", izin), { hesapId: plan });
  assert.equal(v?.no, "I-1026-001", "bozuk: başkasının izin formu alındı");
});
