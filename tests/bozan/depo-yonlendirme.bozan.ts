/* OLUMSUZ KANIT — tests/depo-yonlendirme.test.ts (FV5, depo yönlendirici) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): depo.ts bellekte
   bozulup geçici klasörden içe aktarılır; depolar bellekte sahte. O zaman:
   1. çözülemeyen firma ortak depoya düşerse dondurulmuş / kurulumdaki / olmayan firmanın dosyası ortak depoya YAZILIR;
   2. deposu kurulmamış kendi projeli firma ortak depoya düşerse o firmanın dosyası ortak firmaların deposuna karışır;
   3. gece taşıması firmaya bakmazsa kendi projeli firmanın işleminde ORTAK depo çağrılır (o firmanın nesneleri ortak Storage'a taşınırdı);
   4. depo önbelleği sürüme bakmazsa yenilenen (döndürülen) gizli anahtarla gelen kayıt eski depoda kalır. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import type pg from "pg";
import type { FirmaVtKaydi } from "../../src/server/db/baglanti.ts";
import type { Sorgulayici } from "../../src/server/db/kiraci.ts";
import type { FirmaCozumu } from "../../src/server/db/merkez.ts";
import type { Depo, TasimaSonucu } from "../../src/server/dosya/depo.ts";

const klasor = mkdtempSync(join(tmpdir(), "depo-yonlendirme-bozan-"));
after(() => { rmSync(klasor, { recursive: true, force: true }); });

const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
let sira = 0;
type DepoModulu = typeof import("../../src/server/dosya/depo.ts");
async function bozuk(eski: string, yeni: string): Promise<DepoModulu> {
  const k = kaynak("src/server/dosya/depo.ts");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<DepoModulu>;
}

const ORTAK = "00000000-0000-4000-8000-0000000000aa", KENDI = "00000000-0000-4000-8000-0000000000bb";
const DEPOSUZ = "00000000-0000-4000-8000-0000000000cc", YOK = "00000000-0000-4000-8000-0000000000dd";
const anahtar = (f: string) => `firma/${f}/deneme/${randomUUID()}/${randomUUID()}`;
const bayt = (x: string) => new TextEncoder().encode(x);
function bellek(): { d: Depo; nesneler: Map<string, Uint8Array>; tasi: number } {
  const o = { nesneler: new Map<string, Uint8Array>(), tasi: 0 };
  const d: Depo = {
    async yaz(k, b) { o.nesneler.set(k, b); },
    async oku(k) { const b = o.nesneler.get(k); if (!b) throw new Error("Depoda böyle bir nesne yok"); return b; },
    async copSil(k) { o.nesneler.delete(k); },
    async oksuzSay() { return null; },
    async tasi(): Promise<TasimaSonucu> { o.tasi++; return { tasinan: 1, bayt: 1, hatali: 0, kalan: false }; },
  };
  return Object.assign(o, { d });
}
const kayit = (firmaId: string, surum = 1, depo: FirmaVtKaydi["depo"] = { url: "http://127.0.0.1:1", gizliSifreli: "v1.a.b.c", kova: "probata" }): FirmaVtKaydi => ({
  firmaId, ref: null, sunucu: "127.0.0.1", kapi: 6543, vtAd: "probata_firma", kullanici: "probata_uygulama", parolaSifreli: "v1.a.b.c", depo, surum,
});
function kur(m: DepoModulu) {
  const ortak = bellek(), kendiler: Map<string, ReturnType<typeof bellek>> = new Map();
  const cozumler = new Map<string, FirmaCozumu | null>([
    [ORTAK, { id: ORTAK, kisaAd: "ortak-a", vt: "ortak" }],
    [KENDI, { id: KENDI, kisaAd: "kendi-b", vt: "kendi", kayit: kayit(KENDI) }],
    [DEPOSUZ, { id: DEPOSUZ, kisaAd: "kendi-c", vt: "kendi", kayit: kayit(DEPOSUZ, 1, null) }],
    [YOK, null],
  ]);
  const y = m.yonlendiriciDepo({
    ortak: ortak.d, kayit: async (id) => cozumler.get(id) ?? null,
    firmaDeposu: (k) => { if (!k.depo) return null; const b = bellek(); kendiler.set(`${k.firmaId}:${k.surum}`, b); return b.d; },
  });
  return { y, ortak, kendiler, cozumler };
}
const islemi = (firma: string): Sorgulayici => ({
  sorgu: async <S extends pg.QueryResultRow>() => ({ rows: [{ f: firma }] as unknown as S[], rowCount: 1, command: "SELECT", oid: 0, fields: [] }) as pg.QueryResult<S>,
});

test("1. çözülemeyen firma ortak depoya düşerse olmayan / dondurulmuş firmanın dosyası ortak depoya yazılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk(
    'if (!c || c.id !== firmaId) throw new Error("Dosyanın firması çözülemedi; dosya hiçbir depoya yazılmaz, hiçbir depodan okunmaz.");',
    'if (!c || c.id !== firmaId) return { depo: a.ortak, ortak: true };');
  const { y, ortak } = kur(m);
  const k = anahtar(YOK);
  await y.yaz(k, bayt("x"));
  assert.ok(ortak.nesneler.has(k), "bozuk: çözülemeyen firmanın dosyası ortak depoda");
});

test("2. deposu kurulmamış kendi projeli firma ortak depoya düşerse dosyası ortak firmaların deposuna karışır (kilidin koruduğu açık)", async () => {
  const m = await bozuk(
    'if (!d) throw new Error("Firmanın dosya deposu kurulmadı; dosya başka bir depoya yazılmaz.");',
    "if (!d) return { depo: a.ortak, ortak: true };");
  const { y, ortak } = kur(m);
  const k = anahtar(DEPOSUZ);
  await y.yaz(k, bayt("x"));
  assert.ok(ortak.nesneler.has(k), "bozuk: deposuz firmanın dosyası ortak depoda");
});

test("3. gece taşıması firmaya bakmazsa kendi projeli firmanın işleminde ortak depo çağrılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("return s.ortak && ortak.tasi ? ortak.tasi(db, sinir) : { ...TASINACAK_YOK };", "void s; return ortak.tasi!(db, sinir);");
  const { y, ortak } = kur(m);
  await y.tasi!(islemi(KENDI), { adet: 10, bayt: 100 });
  assert.equal(ortak.tasi, 1, "bozuk: kendi projelinin taşıması ortak depoya gitti");
});

test("4. depo önbelleği sürüme bakmazsa yenilenen kayıt eski depoda kalır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("if (v && v.kayit.surum >= c.kayit.surum) {", "if (v) {");
  const { y, kendiler, cozumler } = kur(m);
  await y.yaz(anahtar(KENDI), bayt("1"));
  cozumler.set(KENDI, { id: KENDI, kisaAd: "kendi-b", vt: "kendi", kayit: kayit(KENDI, 2) });
  const k = anahtar(KENDI);
  await y.yaz(k, bayt("2"));
  assert.ok(!kendiler.has(`${KENDI}:2`), "bozuk: yeni sürümün deposu kurulmadı");
  assert.ok(kendiler.get(`${KENDI}:1`)!.nesneler.has(k), "bozuk: yeni sürümle gelen yazma eski depoda");
});
