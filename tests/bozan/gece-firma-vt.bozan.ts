/* OLUMSUZ KANIT — tests/gece-firma-vt.test.ts (FIRMA-VT FV6) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/is/firmalar.ts
   bellekte bozulup geçici klasörden içe aktarılır; GERÇEK PostgreSQL (tests/yardimci/coklu-vt.ts — merkez + iki kendi projeli firma). O zaman:
   1. havuz bulucusu yok sayılınca kendi projeli firmaların gece işi hiç koşmaz (merkezde reddedilir) — o firmalarda saklama süresi, e-posta yok;
   2. ulaşılamayan firma işi "hata" bitirmezse o gece koşmayan firma "tamam" görünür (zamanlayıcı ve iş kaydı sessiz);
   3. başlamadan düşen her şey "hatali_firma" sayılırsa ulaşılamayan firma ile adımı düşen firma ayırt edilmez. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { yonlendiriciKur, type Yonlendirici } from "../../src/server/db/firma-havuzu.ts";
import { firmaCoz, firmaCozId } from "../../src/server/db/merkez.ts";
import type { Sorgulayici } from "../../src/server/db/kiraci.ts";
import { cokluVtKur, type CokluVt } from "../yardimci/coklu-vt.ts";

const klasor = mkdtempSync(join(tmpdir(), "gece-firma-vt-bozan-"));
let v: CokluVt, y: Yonlendirici;
before(async () => {
  v = await cokluVtKur();
  y = yonlendiriciKur({ merkez: () => v.merkez, anahtar: () => v.anahtar, merkezYerel: true,
    coz: { ad: (k) => firmaCoz(v.merkez, k), id: (i) => firmaCozId(v.merkez, i) } });
});
after(async () => { await y?.kapat(); await v?.kapat(); rmSync(klasor, { recursive: true, force: true }); });

const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, a: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), a)).href}"`);
let sira = 0;
type Firmalar = typeof import("../../src/server/is/firmalar.ts");
async function bozuk(eski: string, yeni: string): Promise<Firmalar> {
  const k = kaynak("src/server/is/firmalar.ts");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `m-${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Firmalar>;
}
const adim = async (db: Sorgulayici) => { await db.sorgu("SELECT 1"); return { sayilar: { n: 1 }, kalan: false }; };
const bul = (id: string) => y.havuzKimlikle(id);

test("1. havuz bulucusu yok sayılınca kendi projeli firmaların gece işi koşmaz (kilidin koruduğu açık)", async () => {
  const m = await bozuk("const h = havuzBul ? await havuzBul(f) : havuz;", "const h = havuz; void havuzBul;");
  const o = await m.firmalardaKos(v.merkez, "gece_bozan", 30_000, { n: 0 }, adim, bul);
  assert.deepEqual([o.firma, o.ulasilamayan], [1, 2], "bozuk: yalnız ortak firma dolaşıldı");
});

test("2. ulaşılamayan firma işi 'hata' bitirmezse koşmayan firma 'tamam' görünür (kilidin koruduğu açık)", async () => {
  const m = await bozuk('const durum = o.hatali_firma || o.ulasilamayan ? "hata" : "tamam";', 'const durum = o.hatali_firma ? "hata" : "tamam";');
  const o = await m.firmalardaKos(v.merkez, "gece_bozan", 30_000, { n: 0 }, adim);
  assert.deepEqual([o.durum, o.ulasilamayan], ["tamam", 2], "bozuk: iki firma koşmadı, iş tamam");
});

test("3. başlamadan düşen 'hatali_firma' sayılırsa ulaşılamayan ayırt edilmez (kilidin koruduğu açık)", async () => {
  const m = await bozuk("if (basladi) o.hatali_firma++; else o.ulasilamayan++;", "void basladi; o.hatali_firma++;");
  const o = await m.firmalardaKos(v.merkez, "gece_bozan", 30_000, { n: 0 }, adim);
  assert.deepEqual([o.hatali_firma, o.ulasilamayan], [2, 0], "bozuk: ulaşılamayan firmalar hatalı sayıldı");
});
