/* OLUMSUZ KANIT — tests/firma-satirlari.test.ts neyi koruyor (sunum 595 madde 3: 1. bölümün satırları formatın; SGK, İSG-KATİP, başlangıç zorunlu).
   Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden içe aktarılır.
   1. Kurucunun zorunlu satır koruması olmasaydı SGK satırı formattan çıkar — Bakanlık raporunda SGK sicil numarası basılmazdı.
   2. Bakanlık özünde firma bilgileri olmasaydı Bakanlık formatının 1. bölümü değişince yayında uyarı çıkmazdı.
   3. Belge firma satırlarını formattan okumasaydı kurucuda eklenen satır (proje no) belgeye basılmazdı (kâğıt ve belge ayrılırdı). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { firmaSatirlari } from "../../src/format/duzen.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi } from "../../src/format/tanim.ts";
import { firmaSatiriEkle } from "../../src/modules/rapor-format/kurucu.ts";

const klasor = mkdtempSync(join(tmpdir(), "firma-satirlari-bozan-"));
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

test("1: zorunlu satır koruması kalkınca SGK satırı formattan çıkar (tanım şemadan geçmez)", async () => {
  const m = await bozuk<typeof import("../../src/modules/rapor-format/kurucu.ts")>("src/modules/rapor-format/kurucu.ts",
    "  return !s || FIRMA_ZORUNLU.includes(s.kaynak) ? t : firmaYaz", "  return !s ? t : firmaYaz");
  const t = FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
  const y = m.firmaSatiriSil(t, firmaSatirlari(t).find((s) => s.kaynak === "sgk")!.id);
  assert.equal(firmaSatirlari(y).some((s) => s.kaynak === "sgk"), false, "bozuk: SGK çıktı");
  assert.equal(FormatTanimi.safeParse(y).success, false);
});

test("2: Bakanlık özünde firma bilgileri olmayınca Bakanlık formatının 1. bölümü değişse de uyarı çıkmaz", async () => {
  const m = await bozuk<typeof import("../../src/format/motor.ts")>("src/format/motor.ts",
    `  if (kilitVar && firmaOzu(t) !== firmaOzu(kaynak)) sorun("değiştirilmiş", "firma", "Firma bilgileri");\n`, "");
  const z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  assert.deepEqual(m.kilitDenetimi(firmaSatiriEkle(z, "plan_no").t, z), [], "bozuk: uyarı yok");
});

test("3: belge firma satırlarını formattan okumayınca eklenen proje no belgeye basılmaz", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts",
    "...firmaSatirlari(t).map((s): Cift", "...firmaSatirlari({ gorunum: { ...t.gorunum, firma: undefined } }).map((s): Cift");
  const t = firmaSatiriEkle(FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim), "plan_no").t;
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("KOMPRESOR"), tanim: t, planNo: "P-1026-0007" }) as never);
  assert.equal(h.includes("P-1026-0007"), false, "bozuk: proje no basılmadı");
});
