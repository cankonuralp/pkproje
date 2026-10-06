/* OLUMSUZ KANIT — tests/muhasebe.test.ts "fatura özeti" neyi koruyor (340). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): muhasebe.ts bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. Fatura özeti verisi Muhasebe yetkisini atlayıp (yönetici gibi) okununca denetçi faturanın tutarını ve alıcısını PDF'te alır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/muhasebe/server/muhasebe.ts");
const KOK = resolve("src/modules/muhasebe/server");
const KAYNAK = readFileSync(join(KOK, "muhasebe.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "fatura-ozeti-bozan-"));
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, "m.ts");
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume, havuz: Havuz;
before(async () => { kume = await testKumesi(); havuz = havuzKur(kume.uygulama); });
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("fatura özeti verisi yetkiyi atlayınca denetçi faturanın tutarını ve alıcısını alır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  const f = await faturaKarti(db, kim, id);\n", "  const f = await faturaKarti(db, { ...kim, roller: [\"firma_yoneticisi\"], matris: undefined } as Kisi, id);\n");
  const s = kume.sahipIstemci(); await s.connect();
  let A: string, den: string, fatura: string;
  try {
    await s.query("SET session_replication_role = replica");
    A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    den = (await s.query<{ id: string }>("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'den@deneme-a.example', 'Deneme', '{denetci}', 'etkin') RETURNING id::text", [A])).rows[0].id;
    const mu = (await s.query<{ id: string }>("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Bir A.Ş.', 'Deneme Bir') RETURNING id::text", [A])).rows[0].id;
    fatura = (await s.query<{ id: string }>(`INSERT INTO fatura (firma_id, no, musteri_id, tarih, vade_gun, vade, kdv, ara, kdv_tutar, toplam)
      VALUES ($1, 'DEN2026000000001', $2, '2026-10-05', 30, '2026-11-04', 20, 100000, 20000, 120000) RETURNING id::text`, [A, mu])).rows[0].id;
  } finally { await s.end(); }
  const DEN = { id: den, ad: "Deneme", roller: ["denetci" as const] };
  const v = await kiraciIcinde(havuz, A, (db) => m.faturaBelgesiVerisi(db, DEN, fatura), { hesapId: den });
  assert.equal(v?.toplam, 120000, "bozuk: denetçi fatura özetini aldı");
});
