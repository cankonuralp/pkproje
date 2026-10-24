/* OLUMSUZ KANIT — tests/basili-format.test.ts ve tests/yz-basili.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur, göreli içe
   aktarmalar mutlak yola çevrilir):
   (2026-10-24 serbest düzen)
   1. Birleşik hücrenin kapladığı yer satırda atlanmazsa hücreler üst üste biner — tanım şemadan geçmez, şablon hiç kurulmaz.
   2. Formda uzmanın imza yeri yokken eklenmezse e-imzanın yeri kalmaz.
   3. Formda sonuç hücresi yokken eklenmezse raporun sonucu seçilemez.
   4. Şemaya birleşik tür (anyOf) girerse hizmetin karmaşıklık sınırı aşılabilir — sayaç yakalar.
   5. Belgede yan yana dalı kalkınca yan yana tablolar alt alta çizilir (formun görünümü kaybolur). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
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

test("birleşik hücrenin yeri atlanmazsa hücreler üst üste biner, şablon kurulmaz", async () => {
  const m = await ceviri("while (c < C && dolu.has(`${r},${c}`)) c++;", "");
  assert.equal(m.basilidanTanim(structuredClone(HAM), "Vinç")?.tanim.bolumler.find((b) => b.ad === "Başlık"), undefined, "bozuk: başlık tablosu kurulmadı");
});

test("uzmanın imza yeri eklenmezse e-imzanın yeri yok", async () => {
  const m = await ceviri(`if (!hucreVar((h) => h.tur === "imza" && h.kim === "uzman")) {`, "if (false) {");
  const t = m.basilidanTanim({}, "Vinç")!.tanim;
  assert.ok(!t.bolumler.some((b) => b.blok === "tablo" && b.hucreler.some((h) => h.tur === "imza")), "bozuk: imza yeri yok");
});

test("sonuç hücresi eklenmezse raporun sonucu seçilemez", async () => {
  const m = await ceviri(`if (!hucreVar((h) => h.tur === "sonuc")) ekTablo(`, "if (false) ekTablo(");
  const t = m.basilidanTanim({}, "Vinç")!.tanim;
  assert.ok(!t.bolumler.some((b) => b.blok === "tablo" && b.hucreler.some((h) => h.tur === "sonuc")), "bozuk: sonuç yok");
});

test("şemaya birleşik tür girerse karmaşıklık sayacı yakalar", async () => {
  const m = await bozuk<typeof import("../../src/server/yz/basili.ts")>("src/server/yz/basili.ts",
    `const s = { type: "string" } as const,`, `const s = { anyOf: [{ type: "string" }, { type: "null" }] } as const,`);
  assert.ok(semaKarmasikligi(m.BASILI_SEMASI).birlesik > 0, "bozuk: birleşik tür sayıldı");
});

test("belgede yan yana dalı kalkınca yan yana tablolar alt alta çizilir", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "const bolumSatirlari = () => yerlesimSatirlari(duzen.bolumler).flatMap((s, j) => s.ogeler.length === 1",
    "const bolumSatirlari = () => yerlesimSatirlari(duzen.bolumler.map((x) => ({ ...x, b: { ...x.b, yan: undefined } }))).flatMap((s, j) => s.ogeler.length === 1");
  const t = (await import("../../src/modules/rapor-format/basili.ts")).basilidanTanim(structuredClone(HAM), "Vinç")!.tanim;
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.doesNotMatch(h, /class="rb-yan"/, "bozuk: yan yana yok");
});
