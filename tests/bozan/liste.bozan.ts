/* OLUMSUZ KANIT — tests/liste.test.ts (566, sunucuda sayfalı liste) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): liste.ts ve canDo.ts
   bellekte bozulup geçici klasörden içe aktarılır; veritabanı yerine sorguyu kaydeden sahte bir bağlantı. O zaman:
   1. görme kuralında "kendi" düzeyi açık bırakılınca denetçi BAŞKASININ raporunu da görür (koşulda yazan yok);
   2. aranan metin Türkçe küçük harfe çevrilmezse "IŞ" araması "ış"ı bulmaz (eski süzgeçle aynı sonuç vermez);
   3. sayfa sınırı kalkınca bütün satırlar tarayıcıya gider (donma — işin kendisi). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "liste-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
/* göreli içe aktarmalar mutlak yola; çıplak paket adı (zod) projenin node_modules'undan çözülür (geçici klasörde bulunamaz) */
const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`)
  .replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`);
let sira = 0;
async function bozuk<T>(yol: string, eski: string, yeni: string): Promise<T> {
  const k = kaynak(yol);
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<T>;
}
type CanDo = typeof import("../../src/server/yetki/canDo.ts");
type Liste = typeof import("../../src/server/liste/liste.ts");

/** sorguyu kaydeden sahte bağlantı: sayım satırı ve boş sonuç döndürür */
function sahteDb() {
  const sorgular: { sql: string; p: unknown[] }[] = [];
  return {
    sorgular,
    db: { sorgu: async (sql: string, p: unknown[] = []) => { sorgular.push({ sql, p }); return { rows: sql.includes("count(*)") ? [{ kayit: 0, toplam: 0, adet: 0 }] : [] }; } },
  };
}
const KAYNAK = { kaynak: "rapor r", secim: "r.id", metin: [], alanlar: { kod: "e.kod" }, cipler: {}, seciciler: {}, sira: {}, varsayilanSira: "r.olustu DESC", sayfa: 20 };

test("1. 'kendi' düzeyi açık bırakılınca denetçinin koşulunda yazan yok (kilidin koruduğu açık)", async () => {
  const m = await bozuk<CanDo>("src/server/yetki/canDo.ts", "  return `coalesce(${kendisi}, false)`;\n}", "  return \"true\";\n}");
  const p: unknown[] = [];
  const k = m.gorusKosulu({ id: "00000000-0000-4000-8000-000000000001", roller: ["denetci"] }, 14, { sahip: "r.hesap_id" }, (x) => { p.push(x); return `$${p.length}`; });
  assert.equal(k, "true", "bozuk: denetçi her raporu görür");
});

test("2. aranan metin Türkçe küçük harfe çevrilmezse 'IŞ' araması küçültülmeden gider (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Liste>("src/server/liste/liste.ts", "export const trKucuk = (s: string) => s.toLocaleLowerCase(\"tr\");", "export const trKucuk = (s: string) => s;");
  const { db, sorgular } = sahteDb();
  await m.listeGetir(db as never, KAYNAK, { sql: "true", p: [] }, { alan: { kod: "IŞ-0" } });
  assert.ok(sorgular[0].p.includes("IŞ-0") && !sorgular[0].p.includes("ış-0"), "bozuk: büyük harfle aranır");
});

test("3. sayfa sınırı kalkınca bütün satırlar istenir (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Liste>("src/server/liste/liste.ts", "ORDER BY ${sira} LIMIT ${k.sayfa} OFFSET ${(sayfa - 1) * k.sayfa}`", "ORDER BY ${sira}`");
  const { db, sorgular } = sahteDb();
  await m.listeGetir(db as never, KAYNAK, { sql: "true", p: [] }, {});
  assert.ok(sorgular.some((s) => s.sql.includes("ORDER BY") && !s.sql.includes("LIMIT")), "bozuk: sınırsız");
});
