/* OLUMSUZ KANIT — tests/kunye.test.ts (492) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden içe
   aktarılır (göreli içe aktarmalar asıl dosyalara çevrilir).
   · Varsayılan kilit kalkınca SGK ve İSG-KATİP her formatta sahada değişir (reisim: "sadece sgk no ve isg katip no değiştirilemez olsun").
   · Sunucunun kilit denetimi kalkınca kilitli bilgiye yazılan değişiklik hatasız geçer.
   · Geçerli künyede kilit yok sayılınca kilitli bilginin (elle kurulmuş istekle yazılmış) değişikliği belgeye basılır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";

const gecici = mkdtempSync(join(tmpdir(), "kunye-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
const KUNYE = "src/format/kunye.ts", YOL = { "./tanim.ts": "src/format/tanim.ts" };
type Kunye = typeof import("../../src/format/kunye.ts");

async function bozuk(ad: string, eski: string, yeni: string): Promise<Kunye> {
  let s = readFileSync(resolve(KUNYE), "utf8");
  assert.ok(s.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  s = s.replace(eski, () => yeni);
  for (const [goreli, gercek] of Object.entries(YOL)) s = s.replaceAll(`"${goreli}"`, JSON.stringify(pathToFileURL(resolve(gercek)).href));
  const yol = join(gecici, `${ad}.ts`);
  writeFileSync(yol, s);
  return import(pathToFileURL(yol).href) as Promise<Kunye>;
}
const T = SABLONLAR.KOMPRESOR.tanim;
const KOPYA = { firmaAdi: "Deneme Sanayi A.Ş.", adres: null, sgk: "1".repeat(26), isgNo: "ISG-1" };

test("1. varsayılan kilit kalkınca SGK ve İSG-KATİP sahada değişir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("varsayilan", "new Set(t.gorunum.kilitli ?? VARSAYILAN_KILITLI)", "new Set(t.gorunum.kilitli ?? [])");
  assert.equal(m.kilitliKunye(T).size, 0, "bozuk: hiçbir bilgi kilitli değil");
  assert.equal(m.gecerliKunye(KOPYA, "", { sgk: "9999" }, m.kilitliKunye(T)).sgk, "9999");
});

test("2. sunucunun kilit denetimi kalkınca kilitli bilgiye yazılan değişiklik hatasız geçer (kilidin koruduğu açık)", async () => {
  const m = await bozuk("denetim", "if (d[a] !== undefined && k.has(a)) h[", "if (false) h[");
  assert.deepEqual(m.kunyeKilitHatalari(T, { sgk: "9999", isg: "X" }), {}, "bozuk: kilitli SGK / İSG-KATİP hatasız");
});

test("3. geçerli künyede kilit yok sayılınca kilitli bilginin değişikliği belgeye geçer (kilidin koruduğu açık)", async () => {
  const m = await bozuk("gecerli", "if (v === undefined || kilitli.has(a)) continue;", "if (v === undefined) continue;");
  assert.equal(m.gecerliKunye(KOPYA, "", { sgk: "9999" }, m.kilitliKunye(T)).sgk, "9999", "bozuk: kilitli SGK değişti");
});
