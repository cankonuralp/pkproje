/* OLUMSUZ KANIT — tests/format-kurucu.test.ts neyi koruyor (K4 Format kurucu). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): kurucu.ts bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. Yeni kimlik var olanlara bakmadan verilince iki bölüm aynı kimliği alır — cevaplar karışır, tanım şemadan geçmez.
   2. Kilit denetimi kalkınca Bakanlık bölümü kurucudan silinir.
   459: cihaz bölümü koruması kalkınca sabit ölçüm cihazları bölümü silinir (tests/kurucu-turden.test.ts). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { FormatTanimi } from "../../src/format/tanim.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";

type Modul = typeof import("../../src/modules/rapor-format/kurucu.ts");
const KOK = resolve("src/modules/rapor-format");
const KAYNAK = readFileSync(join(KOK, "kurucu.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "format-kurucu-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `k-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
after(() => rmSync(klasor, { recursive: true, force: true }));

test("yeni kimlik var olanlara bakmadan verilince iki bölüm aynı kimliği alır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  while (var_.has(`k_${onek}${n}`) || ek.has(`k_${onek}${n}`)) n++;\n", "");
  let t = structuredClone(SABLONLAR.ZPKR02.tanim);
  t = { ...t, bolumler: [...t.bolumler, m.yeniBolum(t, "not", "Bir")] };
  t = { ...t, bolumler: [...t.bolumler, m.yeniBolum(t, "not", "İki")] };
  assert.equal(FormatTanimi.safeParse(t).success, false, "bozuk: aynı kimlik iki bölümde");
});

test("kilit denetimi kalkınca Bakanlık bölümü kurucudan silinir", async () => {
  const m = await bozuk("(t.bolumler[i]?.kilit ? t : { ...t, bolumler: t.bolumler.filter((_, j) => j !== i) })", "({ ...t, bolumler: t.bolumler.filter((_, j) => j !== i) })");
  const t = structuredClone(SABLONLAR.ZPKR02.tanim), k = t.bolumler.findIndex((b) => b.kilit);
  assert.equal(m.bolumSil(t, k).bolumler.length, t.bolumler.length - 1, "bozuk: kilitli bölüm silindi");
});

/* 426: öğe düzenleyicide kilit koruması kalkınca Bakanlık maddesinin metni kurucudan değişir; olumsuz seçenek süzgeci kalkınca seçeneklerde
   olmayan değer "uygun değil" listesine girer (tanım şemadan geçmez) */
test("öğe düzenleyicinin kilit koruması kalkınca Bakanlık maddesinin metni değişir", async () => {
  const m = await bozuk("const yeni = m.kilit ? {", "const yeni = false ? {");
  const t = SABLONLAR.ZPKR02.tanim, i = t.bolumler.findIndex((b) => b.id === "gozle");
  const y = m.ogeYaz(t, i, "g1_1", { ad: "değişti" });
  const b = y.bolumler[i];
  assert.ok(b.blok === "liste" && b.gruplar[0].maddeler[0].metin === "değişti", "bozuk: kilitli madde değişti");
});

test("olumsuz seçenek süzgeci kalkınca seçeneklerde olmayan değer kalır, tanım şemadan geçmez", async () => {
  const m = await bozuk("const olumsuz = (y.olumsuz ?? c.olumsuz)?.filter((o) => gecerli.includes(o));", "const olumsuz = (y.olumsuz ?? c.olumsuz);");
  const t = FormatTanimi.parse({ sema: 1, bolumler: [{ id: "x", ad: "X", blok: "olcum", sutunlar: [{ id: "a", ad: "A" }] }] });
  const y = m.ogeYaz(t, 0, "a", { tur: "secim", secenekler: ["U", "UD"], olumsuz: ["YOK"] });
  assert.equal(FormatTanimi.safeParse(y).success, false, "bozuk: geçersiz tanım üretildi");
});

/* 427: bölüm düzeni kilidi kalkınca Bakanlık bölümünün üst başlığı kurucudan değişir (resmî numaralar kayar) */
test("bölüm düzeninde kilit denetimi kalkınca Bakanlık bölümünün üst başlığı değişir", async () => {
  const m = await bozuk("  if (!b || b.kilit) return t;\n  const alt", "  if (!b) return t;\n  const alt");
  const z = SABLONLAR.ZPKR04.tanim, i = z.bolumler.findIndex((b) => b.id === "gozle");
  assert.equal(m.bolumDuzeni(z, i, { ust: "Başka" }).bolumler[i].ust, "Başka", "bozuk: kilitli bölümün üst başlığı değişti");
});

test("459: cihaz bölümü koruması kalkınca ölçüm cihazları bölümü kurucudan silinir (tests/kurucu-turden.test.ts)", async () => {
  const m = await bozuk(`(t.bolumler[i]?.blok === "cihaz" ? t
  : (`, `((`);
  const t = structuredClone(SABLONLAR.KOMPRESOR.tanim), i = t.bolumler.findIndex((b) => b.blok === "cihaz");
  assert.equal(m.bolumSil(t, i).bolumler.some((b) => b.blok === "cihaz"), false, "bozuk: sabit cihaz bölümü silindi");
});

test("469: alt başlık ekle alt bayrağını koymazsa yeni bölüm ana numara alır (tests/alt-baslik.test.ts)", async () => {
  const m = await bozuk('blok, alt: true, ...govde });', "blok, ...govde });");
  const { raporDuzeni } = await import("../../src/format/duzen.ts");
  const z = SABLONLAR.ZPKR02.tanim, li = z.bolumler.findIndex((b) => b.blok === "liste");
  const y = m.altBaslikEkle(z, li + 1, z.bolumler[li]);
  assert.doesNotMatch(raporDuzeni(y.t, false).bolumler.find((x) => x.b.id === y.id)!.no ?? "", /\./, "bozuk: alt başlık değil, ana bölüm");
});
