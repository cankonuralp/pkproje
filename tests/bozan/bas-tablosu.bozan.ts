/* OLUMSUZ KANIT — tests/bas-tablosu.test.ts neyi koruyor (sunum 595 madde 13). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup
   geçici klasörden içe aktarılır.
   1. Belge hücrelerin sırasını formattan almasaydı format yapıcıda taşınan hücre belgede yerinde kalırdı.
   2. Eklenebilecek bilgiler başlık tablosundakileri ayıklamasaydı aynı bilgi iki kez eklenir, format kaydedilemezdi (şema reddeder).
   3. Hücre bugünkü sıraya dönünce sıra tanımdan silinmeseydi gidip gelen hücre formatı "değişmiş" bırakırdı.
   4. Bakanlık denetimi başlık tablosunun satırlarına ve hücre sırasına bakmasaydı Bakanlık formatına satır eklemek uyarısız yayınlanırdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi } from "../../src/format/tanim.ts";
import { basHucreTasi, basSatiriEkle } from "../../src/modules/rapor-format/kurucu.ts";

const klasor = mkdtempSync(join(tmpdir(), "bas-tablosu-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`)
    .replace(/from "((?!node:|file:)[a-z@][^"]*)"/g, (_, y: string) => `from "${import.meta.resolve(y)}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
const KOMP = () => FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);

test("1: belge hücre sırasını formattan almayınca taşınan hücre belgede yerinde kalır", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts",
    "...basSirasi(t).map((x) => x === \"logo\"", "...([\"logo\", \"firma\", \"akr\", \"ad\", \"dok\"] as const).map((x) => x === \"logo\"");
  const t = basHucreTasi(KOMP(), "dok", -1);
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("KOMPRESOR"), tanim: t }) as never);
  assert.ok(h.indexOf("rb-bas-ad") < h.indexOf("rb-dok"), "bozuk: doküman bilgisi öne geçti");
});

test("2: eklenebilecekler ayıklanmayınca aynı bilgi ikinci kez eklenir ve format geçersiz olur", async () => {
  const m = await bozuk<typeof import("../../src/modules/rapor-format/kurucu.ts")>("src/modules/rapor-format/kurucu.ts",
    "BAS_KAYNAKLARI.filter((k) => k === \"serbest\" || !l.some((s) => s.kaynak === k))", "BAS_KAYNAKLARI.filter(() => true)");
  const y = m.basSatiriEkle(KOMP(), "no");
  assert.notEqual(y.id, null, "bozuk: eklenmedi");
  assert.equal(FormatTanimi.safeParse(y.t).success, false, "bozuk: şema kabul etti");
});

test("3: bugünkü sıra silinmeyince gidip gelen hücre formatı değişmiş bırakır", async () => {
  const m = await bozuk<typeof import("../../src/modules/rapor-format/kurucu.ts")>("src/modules/rapor-format/kurucu.ts",
    "if (yeni.every((x, k) => x === BAS_HUCRELERI[k])) delete g.basSira; else g.basSira = yeni;", "g.basSira = yeni;");
  const t = KOMP();
  assert.notEqual(JSON.stringify(m.basHucreTasi(m.basHucreTasi(t, "akr", 1), "akr", -1)), JSON.stringify(t), "bozuk: tanım aynı kaldı");
});

test("4: Bakanlık denetimi başlık tablosunun satırlarına bakmayınca satır eklemek uyarısız geçer", async () => {
  const m = await bozuk<typeof import("../../src/format/motor.ts")>("src/format/motor.ts",
    "bas: basSatirlari(x).map((s) => ({ ad: s.ad, kaynak: s.kaynak, metin: s.metin })), basSira: basSirasi(x),", "bas: x.gorunum.bas,");
  const z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  assert.deepEqual(m.kilitDenetimi(basSatiriEkle(z, "revizyon").t, z), [], "bozuk: uyarı verdi");
});
