/* NEREDEN GELDİ: FIRMA-VT.md §5.5, FV8 (sunum 579 onaylı, 2026-10-15) — PROBATA_GOC_DAGIT=uygula: "merkezde is_basla('goc_dagitim') kilidi; bütün
   hedeflerde özet denetimi, tek fark varsa hiçbirine başlanmaz; önce ortak, sonra açılış sırasıyla öteki projeler, ilk hatada durulur; sonunda yeniden
   denetle ve firma_vt.son_goc yazımı." Kalem satırı: "özet farkında hiçbir projeye başlanmaz; 2. projede düşerse 3.'ye dokunulmaz; eşzamanlı iki koşu."
   GERÇEK PostgreSQL, iki küme, üç veritabanı (tests/yardimci/coklu-vt.ts: merkez + ortak firma O, kendi-A ayrı kümede, kendi-B merkez kümesinde ikinci
   veritabanında) + Supabase Yönetim API taklidi (tests/yardimci/sahte-supabase-yonetim.ts — her istek kendi sahip bağlantısında; ref'siz yerel
   veritabanları "yerel-merkez" / "yerel-<firma kimliği>"). Göç klasörü: gerçek göçlerin kopyası + testin ek göçleri (9001, 9002 — uydurma tablolar).
   Kilitlenenler: özet farkı → 1, hiçbir projeye istek gitmez · ikinci projede düşen göç → 1, merkez ileri gitti (geri alınmaz), düşen proje geri alındı,
   üçüncüye hiç dokunulmadı · başarı → sırayla merkez, A, B; sonda denetim TAMAM, son_goc / goc_sayisi yazıldı, kilit iş kaydı "tamam"; ikinci koşu
   "uygulanacak göç yok" · eşzamanlı iki koşu → ikincisi kilidi bekler, göç her projede BİR kez · çıktıda sır yok. Olumsuz kanıt:
   tests/bozan/goc-uygula.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type pg from "pg";
import { gocDosyalari } from "../src/server/db/goc.ts";
import { gocDagit, type Ortam } from "../src/server/db/goc-dagit.ts";
import { cokluVtKur, type CokluVt } from "./yardimci/coklu-vt.ts";
import { pgProjesi, sahteYonetimKur, type SahteYonetim } from "./yardimci/sahte-supabase-yonetim.ts";

let v: CokluVt, s: SahteYonetim, ortam: Ortam;
const GOCLER = gocDosyalari();
const klasorler: string[] = [];
const ciktilar: string[] = [];
const D1 = { ad: "9001_dagit_deneme.sql", metin: "CREATE TABLE IF NOT EXISTS public.dagit_deneme (n integer);\n" };
const D2 = { ad: "9002_dagit_iki.sql", metin: "CREATE TABLE IF NOT EXISTS public.dagit_iki (n integer);\n" };

before(async () => {
  v = await cokluVtKur();
  s = await sahteYonetimKur();
  s.projeler.set("yerel-merkez", pgProjesi(() => v.merkezKume.sahipIstemci()));
  s.projeler.set(`yerel-${v.A.id}`, pgProjesi(() => v.ayriKume.sahipIstemci(v.A.baglanti.database)));
  s.projeler.set(`yerel-${v.B.id}`, pgProjesi(() => v.merkezKume.sahipIstemci("probata_kendi_b")));
  const u = v.merkezKume.uygulama;
  ortam = {
    PROBATA_VT_SUNUCU: u.host, PROBATA_VT_KAPI: String(u.port), PROBATA_VT_AD: u.database, PROBATA_VT_KULLANICI: u.user, PROBATA_VT_PAROLA: u.password,
    PROBATA_SIR_ANAHTARI: v.anahtar.toString("base64"), PROBATA_GOC_DAGIT: "uygula",
    PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_YONETIM_UC: s.url,
  };
});
after(async () => {
  await s?.kapat();
  await v?.kapat();
  for (const k of klasorler) rmSync(k, { recursive: true, force: true });
});

/** gerçek göçlerin kopyası + ek göçler */
function klasor(...ek: { ad: string; metin: string }[]): string {
  const k = mkdtempSync(join(tmpdir(), "goc-uygula-"));
  klasorler.push(k);
  for (const d of [...GOCLER, ...ek]) writeFileSync(join(k, d.ad), d.metin);
  return k;
}
async function kos(k: string, ek: Ortam = {}) {
  const satirlar: string[] = [];
  const kod = await gocDagit({ ortam: { ...ortam, ...ek }, yaz: (x) => satirlar.push(x), klasor: k });
  const cikti = satirlar.join("\n");
  ciktilar.push(cikti);
  return { kod, cikti };
}
const sahipleri = (): [string, pg.Client][] => [["merkez", v.merkezSahip], ["A", v.A.sahip], ["B", v.B.sahip]];
const gocVar = async (sahip: pg.Client, ad: string) =>
  Number((await sahip.query<{ n: string }>("SELECT count(*) AS n FROM goc WHERE ad = $1", [ad])).rows[0]!.n) === 1;
/** bu testin başından (bas) bu yana o göçü uygulayan istekler (2026-10-16 ilk koşu: önceki testin aynı adlı göç istekleri de sayılıyordu) */
const uygulamaIstekleri = (ad: string, bas: number) => s.istekler.slice(bas).filter((i) => i.sql.includes(`INSERT INTO public.goc (ad, ozet) VALUES ('${ad}'`));

test("özet farkı (bir firmada uygulanmış göç değiştirilmiş) → 1, adıyla; HİÇBİR projeye göç gitmez", async () => {
  const ilk = GOCLER[0]!;
  await v.B.sahip.query("UPDATE goc SET ozet = repeat('0', 64) WHERE ad = $1", [ilk.ad]);
  try {
    const once = s.istekler.length;
    const r = await kos(klasor(D1));
    assert.equal(r.kod, 1, r.cikti);
    assert.match(r.cikti, /firma kendi-b: ÖZET FARKI — 1 uygulanmış göç değiştirilmiş \(ilk 0000_/);
    assert.match(r.cikti, /DURDU: hiçbir projeye göç uygulanmadı/);
    assert.equal(s.istekler.slice(once).filter((i) => i.sql.startsWith("BEGIN;")).length, 0, "hiçbir projeye göç isteği gitmedi");
    for (const [ad, sahip] of sahipleri()) assert.equal(await gocVar(sahip, D1.ad), false, ad);
  } finally {
    await v.B.sahip.query("UPDATE goc SET ozet = $2 WHERE ad = $1", [ilk.ad, ilk.ozet]);
  }
});

test("ikinci projede (kendi-A) düşen göç → 1, adıyla; merkez ileri gitti, A geri alındı, üçüncüye (kendi-B) hiç dokunulmadı", async () => {
  const dusen = { ad: D1.ad, metin: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM vt_kimlik WHERE firma_id = '${v.A.id}') THEN RAISE EXCEPTION 'deneme düşüşü'; END IF; END $$;\n` };
  const once = s.istekler.length;
  const r = await kos(klasor(dusen));
  try {
    assert.equal(r.kod, 1, r.cikti);
    assert.match(r.cikti, /firma kendi-a: 9001_dagit_deneme\.sql UYGULANAMADI — yönetim API'si 400, SQLSTATE P0001/);
    assert.match(r.cikti, /sonraki projelere dokunulmadı; ileri giden projeler geri alınmaz/);
    assert.equal(await gocVar(v.merkezSahip, D1.ad), true, "merkez ileri gitti");
    assert.equal(await gocVar(v.A.sahip, D1.ad), false, "A'nın işlemi geri alındı");
    assert.equal(await gocVar(v.B.sahip, D1.ad), false, "B'ye uygulanmadı");
    assert.deepEqual(s.istekler.slice(once).filter((i) => i.sql.startsWith("BEGIN;")).map((i) => i.proje), ["yerel-merkez", `yerel-${v.A.id}`],
      "sıra: merkez, A; B'ye göç isteği yok");
    assert.ok(!r.cikti.includes("deneme düşüşü"), "sunucunun iletisi çıktıda yok");
  } finally {
    await v.merkezSahip.query("DELETE FROM goc WHERE ad = $1", [D1.ad]);
  }
});

test("başarı: sırayla merkez, A, B; sonda denetim TAMAM; son_goc / goc_sayisi yazıldı; kilit iş kaydı 'tamam'; ikinci koşu 'uygulanacak göç yok'", async () => {
  const k = klasor(D1);
  const once = s.istekler.length;
  const r = await kos(k);
  assert.equal(r.kod, 0, r.cikti);
  assert.match(r.cikti, /kip: uygula \(Supabase Yönetim API'si\) · beklenen 9001_dagit_deneme\.sql \/ \d+/);
  assert.match(r.cikti, /3 göç uygulanacak \(3 projede\)\./);
  assert.match(r.cikti, /uygulandı: 3 göç\./);
  assert.match(r.cikti, /TAMAM: 3 veritabanı güncel\./);
  assert.deepEqual(uygulamaIstekleri(D1.ad, once).map((i) => i.proje), ["yerel-merkez", `yerel-${v.A.id}`, `yerel-${v.B.id}`]);
  assert.ok(s.istekler.slice(once).every((i) => !i.sql.startsWith("BEGIN;") || i.sql.includes("SET LOCAL ROLE postgres;")));
  for (const [ad, sahip] of sahipleri()) {
    assert.equal(await gocVar(sahip, D1.ad), true, ad);
    assert.equal((await sahip.query("SELECT to_regclass('public.dagit_deneme') IS NOT NULL AS v")).rows[0].v, true, `${ad}: tablo`);
  }
  const kayit = (await v.merkezSahip.query<{ firma_id: string; son_goc: string; goc_sayisi: number }>(
    "SELECT firma_id::text, son_goc, goc_sayisi FROM firma_vt WHERE firma_id = ANY($1::uuid[]) ORDER BY firma_id", [[v.A.id, v.B.id]])).rows;
  assert.deepEqual(kayit.map((x) => [x.son_goc, x.goc_sayisi]), [[D1.ad, GOCLER.length + 1], [D1.ad, GOCLER.length + 1]]);
  const is = (await v.merkezSahip.query<{ durum: string; ozet: Record<string, number> }>(
    "SELECT durum, ozet FROM is_calisma WHERE ad = 'goc_dagitim' ORDER BY basladi DESC LIMIT 1")).rows[0]!;
  assert.deepEqual([is.durum, is.ozet.proje, is.ozet.uygulanan], ["tamam", 3, 3]);
  /* ikinci koşu: uygulanacak yok, yine 0; göç isteği gitmez */
  const once2 = s.istekler.length;
  const r2 = await kos(k);
  assert.equal(r2.kod, 0, r2.cikti);
  assert.match(r2.cikti, /uygulanacak göç yok\./);
  assert.equal(s.istekler.slice(once2).filter((i) => i.sql.startsWith("BEGIN;")).length, 0);
  /* denetle kipi de güncel görür (ölçüt aynı) */
  const d = await kos(k, { PROBATA_GOC_DAGIT: "denetle" });
  assert.equal(d.kod, 0, d.cikti);
});

test("eşzamanlı iki koşu: ikincisi kilidi bekler; göç her projede BİR kez; ikisi de 0", async () => {
  const k = klasor(D1, D2);
  const asil = s.projeler.get("yerel-merkez")!;
  /* merkezdeki göç yavaş: iki koşu üst üste biner */
  s.projeler.set("yerel-merkez", async (sql) => { if (sql.startsWith("BEGIN;")) await new Promise((c) => setTimeout(c, 1500)); return asil(sql); });
  try {
    const once = s.istekler.length;
    const [r1, r2] = await Promise.all([kos(k), kos(k)]);
    assert.deepEqual([r1.kod, r2.kod], [0, 0], `${r1.cikti}\n---\n${r2.cikti}`);
    assert.ok([r1, r2].some((r) => /kilit bekleniyor/.test(r.cikti)), "biri kilidi bekledi");
    assert.ok([r1, r2].some((r) => /uygulanacak göç yok/.test(r.cikti)), "bekleyen, uygulanmış buldu");
    assert.deepEqual(uygulamaIstekleri(D2.ad, once).map((i) => i.proje).sort(), ["yerel-merkez", `yerel-${v.A.id}`, `yerel-${v.B.id}`].sort(), "her projede bir kez");
  } finally {
    s.projeler.set("yerel-merkez", asil);
  }
});

test("anahtarsız uygula → 1, hiçbir projeye istek gitmez; uç yerel değilse → 1; bütün çıktılarda sır yok", async () => {
  const once = s.istekler.length;
  const a = await kos(klasor(D1, D2), { PROBATA_SUPABASE_YONETIM_ANAHTARI: "" });
  assert.equal(a.kod, 1);
  assert.match(a.cikti, /HATA: Supabase yönetim anahtarı yok \(PROBATA_SUPABASE_YONETIM_ANAHTARI\)/);
  const u = await kos(klasor(D1, D2), { PROBATA_SUPABASE_YONETIM_UC: "https://api.supabase.com.kotu.example" });
  assert.equal(u.kod, 1);
  assert.match(u.cikti, /yalnız yerel adres/);
  assert.equal(s.istekler.length, once, "istek gitmedi");
  const hepsi = ciktilar.join("\n");
  for (const sir of [s.anahtar, ortam.PROBATA_VT_PAROLA!, ortam.PROBATA_SIR_ANAHTARI!, v.A.baglanti.password]) assert.ok(!hepsi.includes(sir), "sır çıktıda yok");
});
