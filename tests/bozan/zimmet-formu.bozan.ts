/* OLUMSUZ KANIT — tests/personel-dosya.test.ts "344 zimmet formu imzaya" neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosyalar.ts
   bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. Yetki denetimi kalkınca denetçi başka birinin adına zimmet formu gönderir (kişinin Onaylar'ına sahte imza isteği düşer).
   2. Önceki bekleyen formun iptali kalkınca yeni form gönderildiğinde eskisi de bekler — kişi eski (yanlış) kapsamı imzalayabilir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { personelEkle } from "../../src/modules/personel/server/personel.ts";
import { demirbasEkle, teslimEt } from "../../src/modules/zimmetler/server/zimmet.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/personel/server/dosyalar.ts");
const KOK = resolve("src/modules/personel/server");
const KAYNAK = readFileSync(join(KOK, "dosyalar.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "zimmet-formu-bozan-"));
const depo = klasorDepo(klasor);
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `d${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> >> endobj\n4 0 obj << /Length 18 >> stream\nBT (Zimmet) Tj ET\nendstream\nendobj\n"
  + "trailer << /Root 1 0 R >>\n%%EOF\n");
const uret = async () => PDF;
type K = { id: string; ad: string; roller: ("firma_yoneticisi" | "denetci")[] };

let kume: GomuluKume, havuz: Havuz, A: string, YON: K, DEN: K, pKisi: string;
before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    YON = { id: (await s.query<{ id: string }>("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'yon@deneme-a.example', 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text", [A])).rows[0].id,
      ad: "Deneme", roller: ["firma_yoneticisi"] };
  } finally { await s.end(); }
  const a = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, A, is, { hesapId: YON.id });
  const P = { eposta: "", imzaTel: "", basla: "2024-02-01", meslek: "elk-muh", meslekMetin: "", diploma: "", oda: "", ekipnet: "" };
  pKisi = ((await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme Kişi" }))) as { id: string }).id;
  const pDen = ((await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme Denetçi" }))) as { id: string }).id;
  const s2 = kume.sahipIstemci(); await s2.connect();
  try {
    DEN = { id: (await s2.query<{ id: string }>("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, 'den@deneme-a.example', 'Deneme', '{denetci}', 'etkin', $2) RETURNING id::text", [A, pDen])).rows[0].id,
      ad: "Deneme", roller: ["denetci"] };
  } finally { await s2.end(); }
  const d = ((await a((db) => demirbasEkle(db, YON, { kod: "dm-1", ad: "Deneme merdiven" }))) as { id: string }).id;
  await a((db) => teslimEt(db, depo, YON, A, { varlik: `d:${d}`, alan: pKisi, zaman: "2026-09-01T09:00", notu: "" }));
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("1. yetki denetimi kalkınca denetçi başkasının adına zimmet formu gönderir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("personelId: string, uret: ZimmetPdfUretici): Promise<Yazma> {\n  if (!yazar(kim)) return { durum: \"yetkisiz\" };\n",
    "personelId: string, uret: ZimmetPdfUretici): Promise<Yazma> {\n");
  const r = await kiraciIcinde(havuz, A, (db) => m.zimmetFormuGonder(db, depo, DEN, A, pKisi, uret), { hesapId: DEN.id });
  assert.equal(r.durum, "tamam", "bozuk: denetçi zimmet formu gönderdi");
});

test("2. önceki bekleyen formun iptali kalkınca iki form birden imza bekler (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    await kaynakBelgesiniIptal(db, kim, x.id);\n  }\n  const no = await numaraAl(db, \"zimmet\");\n",
    "  }\n  const no = await numaraAl(db, \"zimmet\");\n");
  for (let i = 0; i < 2; i++) assert.equal((await kiraciIcinde(havuz, A, (db) => m.zimmetFormuGonder(db, depo, YON, A, pKisi, uret), { hesapId: YON.id })).durum, "tamam");
  const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM belge_onay WHERE personel_id = $1 AND tur = 'zimmet' AND durum = 'bekliyor'", [pKisi]))).rows[0].n;
  assert.ok(n >= 2, `bozuk: ${n} form birden imza bekliyor`);
});
