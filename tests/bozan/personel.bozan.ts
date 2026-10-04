/* OLUMSUZ KANIT — tests/personel.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): personel.ts bellekte bozulup geçici klasörden
   içe aktarılır. (1) "Değiştirmek yalnız yaz düzeyinde" kalkınca canDo'nun "kendi = gör + değiştir" kuralı denetçiye kendi mesleğini / sicilini
   değiştirtir. (2) "kendi" süzgeci kalkınca denetçi bütün personeli (e-postalar dahil) görür. K2 (2026-10-04). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/personel/server/personel.ts");
const KOK = resolve("src/modules/personel/server");
const KAYNAK = readFileSync(join(KOK, "personel.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "personel-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `p-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume, havuz: Havuz, A: string, pId: string, hId: string, digerId: string;
before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows[0].id; }
  finally { await s.end(); }
  [pId, digerId] = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Denetçi', '2024-01-01', 'teknisyen'), ('Deneme Diğer', '2024-01-01', 'mak-muh') RETURNING id::text"))).rows.map((r) => r.id);
  hId = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ('d@deneme.example', 'Deneme', '{denetci}', 'etkin', $1) RETURNING id::text", [pId]))).rows[0].id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

const DENETCI = () => ({ id: hId, ad: "Deneme", roller: ["denetci" as const] });

test("'yalnız yaz düzeyi değiştirir' kalkınca denetçi kendi mesleğini yetkili mesleğe çevirir", async () => {
  const m = await bozuk('const degistirebilir = (kim: YetkiHesabi, matris?: Partial<Matris> | null) => duzey(kim, MODUL, matris) === "yaz";',
    'const degistirebilir = (kim: YetkiHesabi, matris?: Partial<Matris> | null) => duzey(kim, MODUL, matris) !== "yok";');
  const r = await kiraciIcinde(havuz, A, (db) => m.personelGuncelle(db, DENETCI(), pId, 0, { ad: "Deneme Denetçi", basla: "2024-01-01", meslek: "mak-muh", eposta: "", imzaTel: "", meslekMetin: "", diploma: "", oda: "", ekipnet: "" }));
  assert.equal(r.durum, "tamam", "bozuk: denetçi kendi mesleğini değiştirdi");
});

test("'kendi' süzgeci kalkınca denetçi bütün personeli görür", async () => {
  const m = await bozuk(`const kendi = d === "kendi" || d === "brans" ? await hesabinPersoneli(db, kim.id) : null;
  if ((d === "kendi" || d === "brans") && !kendi) return [];`, "const kendi = null as string | null;");
  const l = await kiraciIcinde(havuz, A, (db) => m.personelListesi(db, DENETCI()));
  assert.ok(l!.some((x) => x.id === digerId), "bozuk: başkasının kaydı listede");
});
