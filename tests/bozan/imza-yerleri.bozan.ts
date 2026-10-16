/* OLUMSUZ KANIT — tests/imza-yerleri.test.ts neyi koruyor (sunum 595 madde 1). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup
   geçici klasörden içe aktarılır.
   1. Belge ikinci uzmanın satırlarını seçilen kişinin kaydından değil raporu yazandan alsaydı iki imza yerinde aynı kişi basılırdı.
   2. Tesis yetkilisinin bilgileri kısıtlanmasaydı formata tesis yetkilisinin EKİPNET'i girer, belgede kayıtta olmayan bilgi boş basılırdı.
   3. İkinci uzman cevabı kimlik biçiminde denetlenmeseydi rapora her türlü yazı kimlik diye girerdi. */
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
import { imzaKisisiYaz } from "../../src/modules/rapor-format/kurucu.ts";

const klasor = mkdtempSync(join(tmpdir(), "imza-yerleri-bozan-"));
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
const imzaYeri = (t: FormatTanimi) => t.bolumler.findIndex((b) => b.blok === "imza");

test("1: belge ikinci uzmanı yazandan alınca iki imza yerinde aynı kişi basılır", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts",
    "if (s.kim === \"uzman2\") return s.alan === \"imza\" ? \"\" : !v.ikinci ? \"-\" : s.alan === \"ad\" ? v.ikinci.ad : kisiDegeri(v.ikinci, s.alan);",
    "if (s.kim === \"uzman2\") return s.alan === \"imza\" ? \"\" : s.alan === \"ad\" ? v.yazan.ad : kisiDegeri(v.yazan, s.alan);");
  const t = imzaKisisiYaz(KOMP(), imzaYeri(KOMP()), "uzman2", true);
  const ikinci = { ad: "Deneme İkinci", meslek: "diger", meslekMetin: null, ekipnet: null, diploma: null, oda: null };
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("KOMPRESOR"), tanim: t, ikinci }) as never);
  assert.equal(h.includes("Deneme İkinci"), false, "bozuk: ikinci uzman basıldı");
});

test("2: tesis yetkilisinin bilgileri kısıtlanmayınca şema EKİPNET'ini kabul eder", async () => {
  const m = await bozuk<typeof import("../../src/format/tanim.ts")>("src/format/tanim.ts",
    "kim === \"tesis\" ? [\"ad\", \"unvan\", \"imza\"] : []", "kim === \"tesis\" ? IMZA_ALANLARI : []");
  const t = imzaKisisiYaz(KOMP(), imzaYeri(KOMP()), "tesis", true), i = imzaYeri(t);
  const b = t.bolumler[i] as { satirlar?: unknown[] };
  const y = { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...x, satirlar: [...(b.satirlar ?? []), { id: "k_i99", ad: "X", kim: "tesis", alan: "ekipnet" }] } : x)) };
  assert.equal(m.FormatTanimi.safeParse(y).success, true, "bozuk: reddetti");
});

test("3: ikinci uzman kimlik biçiminde denetlenmeyince her yazı kabul edilir", async () => {
  const m = await bozuk<typeof import("../../src/format/tanim.ts")>("src/format/tanim.ts",
    "    uzman2: z.string().regex(/^[0-9a-f-]{36}$/, \"Kişi seçin.\").optional(),", "    uzman2: z.string().optional(),");
  assert.equal(m.Cevaplar.safeParse({ imzaci: { uzman2: "x' OR 1=1" } }).success, true, "bozuk: reddetti");
});
