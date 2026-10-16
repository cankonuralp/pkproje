/* NEREDEN GELDİ: FIRMA-VT.md §5.5, FV8 (2026-10-16) — göç koşucusu bir yürütücü üzerinden (sahip bağlantısı ya da Supabase Yönetim API'si); API'de
   göç başına TEK istek ve tek işlem: "Göçlerde BEGIN/COMMIT/CONCURRENTLY yok (taradım). Hepsi tek işlemde koşabilir." SAF. Kilitlenenler:
   · gocFarki: eksik (dosya sırasıyla), değiştirilmiş (özet tutmuyor), kodda olmayan (veritabanı ileride);
   · gocleriUygula yürütücüyle: eksikleri sırayla, değiştirilmiş göçte durur (uygulamaz), uygulanmışı atlar; düşen göç adıyla yukarı;
   · Yönetim API yürütücüsü: kayıtlılar goc tablosu yoksa boş; göç tek istekte — BEGIN; SET LOCAL ROLE postgres; goc tablosu; göç; kaydı; COMMIT;
     biçimsiz ad / özet gömülmez;
   · bütün göç dosyalarında işlem ifadesi (BEGIN / COMMIT / ROLLBACK / CONCURRENTLY / VACUUM) yok — tek işlemde koşar. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { gocDosyalari, gocFarki, gocleriUygula, type GocDosyasi, type GocYurutucu } from "../src/server/db/goc.ts";
import { yonetimApiYurutucu, type SupabaseYonetimi } from "../src/server/dis/supabase-yonetim.ts";

const g = (ad: string, ozet = ad.padEnd(64, "0").replace(/[^0-9a-f]/g, "a").slice(0, 64)): GocDosyasi => ({ ad, metin: `-- ${ad}\nSELECT 1;`, ozet });
const A = g("0001_a.sql"), B = g("0002_b.sql"), C = g("0003_c.sql");

test("gocFarki: eksik (sırayla), değiştirilmiş, kodda olmayan", () => {
  const f = gocFarki(new Map([[A.ad, A.ozet], [B.ad, "f".repeat(64)], ["0099_ileri.sql", "e".repeat(64)]]), [A, B, C]);
  assert.deepEqual(f.eksik.map((x) => x.ad), [C.ad]);
  assert.deepEqual(f.degismis, [B.ad]);
  assert.deepEqual(f.fazla, ["0099_ileri.sql"]);
  assert.deepEqual(gocFarki(new Map(), [A, B]).eksik.map((x) => x.ad), [A.ad, B.ad]);
});

test("gocleriUygula yürütücüyle: eksikleri sırayla uygular, uygulanmışı atlar; değiştirilmişte durur; düşen göç adıyla", async () => {
  const kayit = new Map([[A.ad, A.ozet]]);
  const uygulanan: string[] = [];
  const bellek: GocYurutucu = { kayitli: async () => new Map(kayit), uygula: async (x) => { uygulanan.push(x.ad); kayit.set(x.ad, x.ozet); } };
  const dene = await import("node:fs/promises");
  const os = await import("node:os"), path = await import("node:path");
  const k = await dene.mkdtemp(path.join(os.tmpdir(), "goc-yurutucu-"));
  try {
    for (const x of [A, B, C]) await dene.writeFile(path.join(k, x.ad), x.metin);
    const dosyalar = gocDosyalari(k);
    kayit.set(A.ad, dosyalar[0]!.ozet);
    assert.deepEqual(await gocleriUygula(bellek, k), [B.ad, C.ad]);
    assert.deepEqual(uygulanan, [B.ad, C.ad]);
    assert.deepEqual(await gocleriUygula(bellek, k), [], "ikinci koşu boş");
    kayit.set(A.ad, "0".repeat(64));
    await assert.rejects(gocleriUygula(bellek, k), /değiştirilmiş: 0001_a\.sql/);
    kayit.set(A.ad, dosyalar[0]!.ozet);
    kayit.delete(C.ad);
    const dusen: GocYurutucu = { kayitli: async () => new Map(kayit), uygula: async () => { throw new Error("iç"); } };
    await assert.rejects(gocleriUygula(dusen, k), /Göç uygulanamadı: 0003_c\.sql/);
  } finally {
    await dene.rm(k, { recursive: true, force: true });
  }
});

test("Yönetim API yürütücüsü: goc tablosu yoksa boş; göç TEK istekte — BEGIN, SET LOCAL ROLE postgres, tablo, göç, kayıt, COMMIT; biçimsiz ad / özet gömülmez", async () => {
  const istekler: { proje: string; sql: string }[] = [];
  let tabloVar = false;
  const api: Pick<SupabaseYonetimi, "sorgu"> = {
    async sorgu<T>(proje: string, sql: string) {
      istekler.push({ proje, sql });
      if (sql.includes("to_regclass")) return [{ var: tabloVar }] as T[];
      if (sql.startsWith("SELECT ad, ozet")) return [{ ad: A.ad, ozet: A.ozet }] as T[];
      return [] as T[];
    },
  };
  const y = yonetimApiYurutucu(api, "abcdefghij0123456789");
  assert.equal((await y.kayitli()).size, 0);
  assert.equal(istekler.length, 1, "tablo yokken okunmadı");
  tabloVar = true;
  assert.deepEqual([...(await y.kayitli())], [[A.ad, A.ozet]]);
  istekler.length = 0;
  await y.uygula(B);
  assert.equal(istekler.length, 1, "göç başına tek istek");
  const sql = istekler[0]!.sql;
  assert.equal(istekler[0]!.proje, "abcdefghij0123456789");
  assert.match(sql, /^BEGIN;\nSET LOCAL ROLE postgres;\nCREATE TABLE IF NOT EXISTS public\.goc /);
  assert.ok(sql.includes(B.metin) && sql.endsWith(`INSERT INTO public.goc (ad, ozet) VALUES ('${B.ad}', '${B.ozet}');\nCOMMIT;`), sql);
  await assert.rejects(y.uygula({ ...B, ad: "0002_b'); DROP TABLE x; --.sql" }), /biçimsiz/);
  await assert.rejects(y.uygula({ ...B, ozet: "z".repeat(64) }), /biçimsiz/);
  assert.equal(istekler.length, 1, "biçimsiz göç gönderilmedi");
});

test("bütün göç dosyalarında işlem ifadesi yok (BEGIN / COMMIT / ROLLBACK / CONCURRENTLY / VACUUM) — tek işlemde, tek istekte koşar", () => {
  const yorumsuz = (m: string) => m.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
  const kotu = gocDosyalari().filter((d) => {
    /* plpgsql gövdesindeki BEGIN … END bloğu işlem değildir: yalnız ifade başındaki BEGIN; / START TRANSACTION / COMMIT / ROLLBACK aranır */
    const m = yorumsuz(d.metin);
    return /(^|;)\s*(BEGIN\s*;|START\s+TRANSACTION|COMMIT\b|ROLLBACK\b|END\s*;?\s*$)/im.test(m.replace(/\$\$[\s\S]*?\$\$/g, " ")) || /\bCONCURRENTLY\b|\bVACUUM\b/i.test(m);
  }).map((d) => d.ad);
  assert.deepEqual(kotu, []);
});
