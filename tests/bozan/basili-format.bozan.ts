/* OLUMSUZ KANIT — tests/basili-format.test.ts ve tests/yz-basili.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur, göreli içe
   aktarmalar mutlak yola çevrilir):
   1. Firma bilgilerinde zorunlu satır (İSG-KATİP) formda yoksa eklenmezse tanım şemadan geçmez — basılı formdan şablon hiç kurulmaz.
   2. Uzmanın imza hücresi eklenmezse imza bölümünde e-imzanın yeri kalmaz.
   3. Formda cihaz bölümü yokken numarasız cihaz bölümü eklenmezse kurucu numaralı ekler, formun numaraları kayar (3 tespit → 4).
   4. Şemaya birleşik tür (anyOf) girerse hizmetin karmaşıklık sınırı aşılabilir — sayaç yakalar.
   5. Belgede iki sütun dalı kalkınca kontrol listesi tek sütun çizilir (formun görünümü kaybolur). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { raporDuzeni } from "../../src/format/duzen.ts";
import { HAM } from "../yardimci/basili-ornek.ts";
import { semaKarmasikligi } from "../yardimci/denetimler.ts";

const klasor = mkdtempSync(join(tmpdir(), "basili-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  const kok = resolve(dosya, "..");
  /* göreli içe aktarmalar ve paket (react) mutlak adrese: geçici klasörde de çözülsün */
  const kaynak = readFileSync(dosya, "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`)
    .replace(/from "react"/g, `from "${import.meta.resolve("react")}"`);
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Ceviri = typeof import("../../src/modules/rapor-format/basili.ts");
const ceviri = (eski: string, yeni: string) => bozuk<Ceviri>("src/modules/rapor-format/basili.ts", eski, yeni);

test("zorunlu firma satırı eklenmezse şablon kurulmaz (tanım şemadan geçmez)", async () => {
  const m = await ceviri("if (firmaSatirlar.length) for (const z of FIRMA_ZORUNLU)", "if (false) for (const z of FIRMA_ZORUNLU)");
  assert.equal(m.basilidanTanim(structuredClone(HAM), "Vinç"), null, "bozuk: çeviri kurulmadı");
});

test("uzmanın imza hücresi eklenmezse e-imzanın yeri yok", async () => {
  const m = await ceviri(`if (satirlar.length && !satirlar.some((s) => s.kim === "uzman" && s.alan === "imza"))`, "if (false)");
  const imza = m.basilidanTanim(structuredClone(HAM), "Vinç")!.tanim.bolumler.find((b) => b.blok === "imza");
  assert.ok(imza?.blok === "imza");
  assert.ok(!imza.satirlar!.some((s) => s.kim === "uzman" && s.alan === "imza"), "bozuk: uzmanın imza hücresi yok");
});

test("numarasız cihaz bölümü eklenmezse formda cihaz bölümü yok (kurucu numaralı ekler, numaralar kayar)", async () => {
  const m = await ceviri(`if (!bolumler.some((b) => b.blok === "cihaz")) bolumler.splice(`, "if (false) bolumler.splice(");
  const t = m.basilidanTanim(structuredClone(HAM), "Vinç")!.tanim;
  assert.ok(!t.bolumler.some((b) => b.blok === "cihaz"), "bozuk: cihaz bölümü yok");
  /* kurucu açılışta numaralı ekler: tespit 4 olur */
  const { kurucuyaHazirla } = await import("../../src/format/duzen.ts");
  assert.equal(raporDuzeni(kurucuyaHazirla(t), false).bolumler.find((x) => x.b.blok === "liste")?.no, "4");
});

test("şemaya birleşik tür girerse karmaşıklık sayacı yakalar", async () => {
  const m = await bozuk<typeof import("../../src/server/yz/basili.ts")>("src/server/yz/basili.ts",
    `const s = { type: "string" } as const,`, `const s = { anyOf: [{ type: "string" }, { type: "null" }] } as const,`);
  assert.ok(semaKarmasikligi(m.BASILI_SEMASI).birlesik > 16, "bozuk: sınır aşıldı");
});

test("belgede iki sütun dalı kalkınca liste tek sütun çizilir", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "if (b.yanYana && !ek.length) {", "if (false) {");
  const t = (await import("../../src/modules/rapor-format/basili.ts")).basilidanTanim(structuredClone(HAM), "Vinç")!.tanim;
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  const liste = /<h2>3\. TESPİT[^<]*<\/h2><table>(.*?)<\/table>/.exec(h)?.[1] ?? "";
  assert.equal((liste.match(/<col /g) ?? []).length, 3, "bozuk: tek sütun");
});
