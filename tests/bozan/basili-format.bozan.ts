/* OLUMSUZ KANIT — tests/basili-format.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur, göreli içe aktarmalar mutlak yola
   çevrilir):
   (2026-10-24 serbest düzen)
   1. Birleşik hücrenin kapladığı yer satırda atlanmazsa hücreler üst üste biner — tanım şemadan geçmez, şablon hiç kurulmaz.
   2. Formda uzmanın imza yeri yokken eklenmezse e-imzanın yeri kalmaz.
   3. Formda sonuç hücresi yokken eklenmezse raporun sonucu seçilemez.
   4. Belgede yan yana dalı kalkınca yan yana tablolar alt alta çizilir (formun görünümü kaybolur).
   (2026-10-24 yapay zekâsız okuma — yapay zekâ isteğinin şema sayacı, istek dosyasıyla birlikte kalktı)
   5. Çeviri sonuç hücresinin cümlesini atarsa belge yalnız sözcüğü basar.
   6. Belgede sonuç cümlesi dalı kalkınca cümle basılmaz.
   7. Çeviri formun kenarını görünüme yazmazsa kenarsız / kalın kenarlı hücre belgenin çizgisiyle çizilir.
   (2026-10-24 denetim)
   8. Satırı açan ilk bölümün oranı atılırsa formun 70 / 30'u belgede 62,5 / 37,5 olur.
   9. Satır yüksekliği tam mm'ye yuvarlanırsa 4,5 mm'lik satır 5 mm olur (form belgede uzar).
   10. Eklenecek bölümlere yer bırakılmazsa 40 bölümlük okuma şablona hiç çevrilemez.
   11. Kimlik sayacı ilerlemezse cevap hücrelerinin kimliği tekrarlanır, okuma şablona çevrilmez.
   12. Belgede satırının yüksekliği formdan gelen hücreye üst / alt iç boşluk verilirse formun satırı uzar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { HAM, HAM_SONUC_KENAR } from "../yardimci/basili-ornek.ts";

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

test("belgede yan yana dalı kalkınca yan yana tablolar alt alta çizilir", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "const yerlesim = yerlesimSatirlari(duzen.bolumler);",
    "const yerlesim = yerlesimSatirlari(duzen.bolumler.map((x) => ({ ...x, b: { ...x.b, yan: undefined } })));");
  const t = (await import("../../src/modules/rapor-format/basili.ts")).basilidanTanim(structuredClone(HAM), "Vinç")!.tanim;
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.doesNotMatch(h, /class="rb-yan"/, "bozuk: yan yana yok");
});

const sonucHucresi = (t: import("../../src/format/tanim.ts").FormatTanimi) =>
  t.bolumler.flatMap((b) => (b.blok === "tablo" ? b.hucreler : [])).find((h) => h.tur === "sonuc");

test("çeviri sonuç cümlesini atarsa belge yalnız sözcüğü basar", async () => {
  const m = await ceviri("case \"sonuc\": hucre = { ...ortak, tur, ...(metin ? { m: metin } : {}), secenekler:", "case \"sonuc\": hucre = { ...ortak, tur, secenekler:");
  const t = m.basilidanTanim(structuredClone(HAM_SONUC_KENAR), "Vinç")!.tanim;
  assert.equal(sonucHucresi(t)?.m, undefined, "bozuk: cümle yok");
  const h = renderToStaticMarkup((await import("../../src/belge/belge.ts")).raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.doesNotMatch(h, /Ekipman kullanıma UYGUNDUR/, "bozuk: belgede cümle yok");
});

test("belgede sonuç cümlesi dalı kalkınca cümle basılmaz", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts",
    "return x.m?.trim() ? satirSatir([x.m.trimEnd(), sozcuk].filter(Boolean).join(\" \")) : sozcuk;", "return sozcuk;");
  const t = (await import("../../src/modules/rapor-format/basili.ts")).basilidanTanim(structuredClone(HAM_SONUC_KENAR), "Vinç")!.tanim;
  assert.equal(sonucHucresi(t)?.m, "Ekipman kullanıma");
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.doesNotMatch(h, /Ekipman kullanıma UYGUNDUR/, "bozuk: yalnız sözcük");
});

test("çeviri kenarı yazmazsa kenarsız hücre belgenin çizgisiyle çizilir", async () => {
  const m = await ceviri("  if (kn) s.kn = kn;\n", "");
  const t = m.basilidanTanim(structuredClone(HAM_SONUC_KENAR), "Vinç")!.tanim;
  const h = renderToStaticMarkup((await import("../../src/belge/belge.ts")).raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.doesNotMatch(h, /<td style="border-top:0;border-bottom:0;border-left:0;border-right:0;[^"]*">Kenarsız<\/td>/, "bozuk: kenarsız hücre çizgili");
});

const paragraf = (ad: string, ek: Record<string, unknown> = {}) => ({ ad, tur: "tablo", yan: false, oran: 100, sutunlar: [100], cevaplar: [],
  satirlar: [{ tekrar: false, yukseklik: 0, hucreler: [{ metin: ad, tur: "yazi", sutunBirlesim: 1, satirBirlesim: 1 }] }], ...ek });

test("satırı açan ilk bölümün oranı atılırsa 70 / 30 belgede 62,5 / 37,5 olur", async () => {
  const ham = { bolumler: [paragraf("Sol", { oran: 70 }), paragraf("Sag", { yan: true, oran: 30 })] };
  const { yerlesimSatirlari } = await import("../../src/format/tablo.ts");
  const oranlar = (m: Ceviri) => yerlesimSatirlari(m.basilidanTanim(structuredClone(ham), "Vinç")!.tanim.bolumler.slice(0, 2).map((b) => ({ b })))[0].oranlar;
  assert.deepEqual(oranlar(await import("../../src/modules/rapor-format/basili.ts")), [70, 30], "sağlam: 70 / 30");
  const m = await ceviri("...((yan || satirAcar) && oran ? { oran } : {})", "...(yan && oran ? { oran } : {})");
  assert.deepEqual(oranlar(m), [62.5, 37.5], "bozuk: pay bozuldu");
});

test("satır yüksekliği tam mm'ye yuvarlanırsa 4,5 mm'lik satır 5 mm olur", async () => {
  const ham = { bolumler: [paragraf("A", { satirlar: [{ tekrar: false, yukseklik: 4.5, hucreler: [{ metin: "x", tur: "yazi" }] }] })] };
  const y = (m: Ceviri) => (m.basilidanTanim(structuredClone(ham), "Vinç")!.tanim.bolumler[0] as { satirlar: { y?: number }[] }).satirlar[0].y;
  assert.equal(y(await import("../../src/modules/rapor-format/basili.ts")), 4.5, "sağlam: 4,5");
  assert.equal(y(await ceviri("Math.min(250, yarimMm(hs.yukseklik))", "Math.min(250, Math.round(hs.yukseklik))")), 5, "bozuk: 5");
});

test("eklenecek bölümlere yer bırakılmazsa 40 bölümlük okuma şablona çevrilemez", async () => {
  const ham = { bolumler: Array.from({ length: 40 }, (_, i) => paragraf(`P${i}`)) };
  assert.ok((await import("../../src/modules/rapor-format/basili.ts")).basilidanTanim(structuredClone(ham), "Vinç"), "sağlam: çevrildi");
  const m = await ceviri("while (bolumler.length && bolumler.length + eksik() > BOLUM_EN_COK) sondan.unshift(bolumler.pop()!.ad);", "");
  assert.equal(m.basilidanTanim(structuredClone(ham), "Vinç"), null, "bozuk: çevrilemedi");
});

test("kimlik sayacı ilerlemezse cevap hücrelerinin kimliği tekrarlanır, tablo şablona alınmaz", async () => {
  const ham = { bolumler: [{ ad: "Liste", tur: "tablo", yan: false, oran: 100, sutunlar: [50, 50], cevaplar: [],
    satirlar: [{ tekrar: false, yukseklik: 4, hucreler: [{ tur: "cevap" }, { tur: "cevap" }] }] }] };
  assert.deepEqual((await import("../../src/modules/rapor-format/basili.ts")).basilidanTanim(structuredClone(ham), "Vinç")!.atilan, [], "sağlam: alındı");
  const r = (await ceviri("    sayac.set(onek, n + 1);\n", "")).basilidanTanim(structuredClone(ham), "Vinç");
  assert.ok(!r || r.atilan.includes("Liste"), "bozuk: kimlik tekrarı");
});

test("satırının yüksekliği formdan gelen hücreye üst / alt iç boşluk verilirse formun satırı uzar", async () => {
  const ham = { bolumler: [paragraf("A", { satirlar: [{ tekrar: false, yukseklik: 4, hucreler: [{ metin: "Formdan", tur: "yazi" }] }] })] };
  const t = (await import("../../src/modules/rapor-format/basili.ts")).basilidanTanim(structuredClone(ham), "Vinç")!.tanim;
  const belge = (m: typeof import("../../src/belge/belge.ts")) => renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  assert.match(belge(await import("../../src/belge/belge.ts")), /padding:0\.00mm 0\.60mm[^"]*">Formdan</, "sağlam: üst / alt boşluk yok");
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "hucreBicemi(x, yz, !!b.satirlar[x.r]?.y)", "hucreBicemi(x, yz)");
  assert.match(belge(m), /padding:0\.36mm 0\.60mm[^"]*">Formdan</, "bozuk: boşluk var");
});
