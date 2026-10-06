/* OLUMSUZ KANIT — tests/egitimler.test.ts "345 katılım formu" neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): egitimler.ts bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. Yetki denetimi kalkınca denetçi bir eğitim kaydının katılım formunu başkasının imzasına gönderir.
   2. "Önceki kayıt" denetimi kalkınca yenilenmiş (eski) eğitimin formu imzaya gider — kişi geçersiz tarihli formu imzalar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/egitimler/server/egitimler.ts");
const KOK = resolve("src/modules/egitimler/server");
const KAYNAK = readFileSync(join(KOK, "egitimler.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "egitim-formu-bozan-"));
const depo = klasorDepo(klasor);
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `e${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> >> endobj\n4 0 obj << /Length 18 >> stream\nBT (Egitim) Tj ET\nendstream\nendobj\n"
  + "trailer << /Root 1 0 R >>\n%%EOF\n");
const uret = async () => PDF;

let kume: GomuluKume, havuz: Havuz, A: string, yon: string, den: string, guncel: string, onceki: string;
before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    await s.query("SET session_replication_role = replica");
    const q = async (sql: string, p: unknown[]) => (await s.query<{ id: string }>(sql, p)).rows[0].id;
    A = await q("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text", []);
    const pKisi = await q("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Kişi', '2024-01-01', 'mak-muh') RETURNING id::text", [A]);
    const pDen = await q("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Denetçi', '2024-01-01', 'mak-muh') RETURNING id::text", [A]);
    yon = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'yon@deneme-a.example', 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text", [A]);
    den = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, 'den@deneme-a.example', 'Deneme', '{denetci}', 'etkin', $2) RETURNING id::text", [A, pDen]);
    const tur = await q("INSERT INTO egitim_turu (firma_id, ad, tekrar_ay) VALUES ($1, 'Deneme eğitimi', 12) RETURNING id::text", [A]);
    onceki = await q("INSERT INTO egitim_kaydi (firma_id, personel_id, tur_id, tarih, tekrar, kurum, onceki) VALUES ($1, $2, $3, '2024-03-01', '2025-03-01', 'Firma içi', true) RETURNING id::text", [A, pKisi, tur]);
    guncel = await q("INSERT INTO egitim_kaydi (firma_id, personel_id, tur_id, tarih, tekrar, kurum) VALUES ($1, $2, $3, '2025-03-01', '2026-03-01', 'Firma içi') RETURNING id::text", [A, pKisi, tur]);
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("1. yetki denetimi kalkınca denetçi katılım formunu imzaya gönderir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("export async function katilimFormuGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, kayitId: string, uret: EgitimPdfUretici): Promise<Yazma> {\n  if (!degistirir(kim)) return { durum: \"yetkisiz\" };\n",
    "export async function katilimFormuGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, kayitId: string, uret: EgitimPdfUretici): Promise<Yazma> {\n");
  const DEN = { id: den, ad: "Deneme", roller: ["denetci" as const] };
  const r = await kiraciIcinde(havuz, A, (db) => m.katilimFormuGonder(db, depo, DEN, A, guncel, uret), { hesapId: den });
  assert.equal(r.durum, "tamam", "bozuk: denetçi formu gönderdi");
});

test("2. önceki kayıt denetimi kalkınca yenilenmiş eğitimin formu imzaya gider (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  if (x.onceki) return { durum: \"red\", neden: \"Önceki kaydın formu gönderilmez; güncel kayıttan gönderin.\" };\n", "");
  const YON = { id: yon, ad: "Deneme", roller: ["firma_yoneticisi" as const] };
  const r = await kiraciIcinde(havuz, A, (db) => m.katilimFormuGonder(db, depo, YON, A, onceki, uret), { hesapId: yon });
  assert.equal(r.durum, "tamam", "bozuk: önceki kaydın formu gönderildi");
});
