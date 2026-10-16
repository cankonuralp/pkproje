/* OLUMSUZ KANIT — tests/supabase-yonetim.test.ts (FIRMA-VT FV8) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/dis/supabase-yonetim.ts
   bellekte bozulup geçici klasörden içe aktarılır; Yönetim API'si yerel taklit (tests/yardimci/sahte-supabase-yonetim.ts). O zaman:
   1. uç denetimi kalkınca PAT'i taşıyan istemci başka bir sunucuya (yerel olmayan adrese) yönlendirilebilir;
   2. "yerel-…" proje adının yerel uç koşulu kalkınca yayında da kabul edilir (gerçek API'ye anlamsız / tehlikeli yol gider);
   3. 429 deneme sınırı kalkınca istemci sonsuza dek dener (derleme takılır);
   4. hata iletisi sunucunun gövdesini yazınca tablo adı / değer çıktıya düşer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { sahteYonetimKur, type SahteYonetim } from "../yardimci/sahte-supabase-yonetim.ts";

const klasor = mkdtempSync(join(tmpdir(), "supabase-yonetim-bozan-"));
let s: SahteYonetim;
const REF = "abcdefghij0123456789";
before(async () => {
  s = await sahteYonetimKur();
  s.projeler.set(REF, async () => [{ n: 1 }]);
  s.projeler.set("bozuk00000000000000x", async () => { throw Object.assign(new Error("relation \"gizli_tablo\" already exists"), { code: "42P07" }); });
});
after(async () => { await s?.kapat(); rmSync(klasor, { recursive: true, force: true }); });

const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, a: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), a)).href}"`);
let sira = 0;
type Modul = typeof import("../../src/server/dis/supabase-yonetim.ts");
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const k = kaynak("src/server/dis/supabase-yonetim.ts");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<Modul>;
}

test("1. uç denetimi kalkınca anahtar yerel olmayan sunucuya yönlendirilebilir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  if (ucOrtam && !YEREL_UC.test(ucOrtam)) throw", "  if (false && ucOrtam && !YEREL_UC.test(ucOrtam)) throw");
  const a = m.yonetimAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_YONETIM_UC: "https://kotu.example" });
  assert.equal(a.uc, "https://kotu.example", "bozuk: uzak uç kabul edildi — testin 'yalnız yerel' beklentisi düşer");
});

test("2. 'yerel-…' adının yerel uç koşulu kalkınca yayında kabul edilir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("REF.test(proje) || (yerel && YEREL_PROJE.test(proje))", "REF.test(proje) || YEREL_PROJE.test(proje)");
  assert.equal(m.projeGecerli("yerel-merkez", false), true, "bozuk: yayında yerel ad geçti");
});

test("3. 429 deneme sınırı kalkınca istemci sınırsız dener (kilidin koruduğu açık)", async () => {
  const m = await bozuk("if (y.status === 429 && deneme < YONETIM.enCok429) {", "if (y.status === 429) {");
  let bekleyis = 0;
  const y = m.supabaseYonetimi(m.yonetimAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_YONETIM_UC: s.url }), { bekle: async () => { bekleyis++; } });
  s.sinir429 = 8;
  assert.deepEqual(await y.sorgu(REF, "SELECT 1"), [{ n: 1 }]);
  s.sinir429 = 0;
  assert.equal(bekleyis, 8, "bozuk: 3'ten fazla deneme — testin 'dördüncüde hata' beklentisi düşer");
});

test("4. hata iletisi sunucunun gövdesini yazınca tablo adı çıktıya düşer (kilidin koruduğu açık)", async () => {
  const m = await bozuk("throw new YonetimHatasi(y.status, sqlDurumu(govde));", "throw new Error(govde);");
  const y = m.supabaseYonetimi(m.yonetimAyari({ PROBATA_SUPABASE_YONETIM_ANAHTARI: s.anahtar, PROBATA_SUPABASE_YONETIM_UC: s.url }));
  const h = await y.sorgu("bozuk00000000000000x", "CREATE TABLE x ()").then(() => null, (e: unknown) => e as Error);
  assert.match(String(h?.message), /gizli_tablo/, "bozuk: sunucu iletisi çıktıda");
});
