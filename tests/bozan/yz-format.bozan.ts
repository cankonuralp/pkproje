/* OLUMSUZ KANIT — tests/yz-format.test.ts (497) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden
   içe aktarılır (göreli içe aktarmalar asıl dosyalara çevrilir).
   · Bölüm türü süzülmeseydi yapay zekâ ikinci bir ölçüm cihazları bölümü önerebilirdi (formatta tektir, türden gelir).
   · "Uygula" Bakanlık işaretini korumasaydı Bakanlık maddeleri firmanın maddesi sayılır, yayında "Bakanlık formatından ayrılan" uyarısı kaybolurdu.
   · Öneri sayısı sınırlanmasaydı yapay zekâ yüzlerce öneriyle kâğıdı doldurabilirdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";

const gecici = mkdtempSync(join(tmpdir(), "yz-format-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const s = readFileSync(resolve(kaynak), "utf8");
  assert.ok(s.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const c = s.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, y: string) => `from "${pathToFileURL(resolve(dirname(resolve(kaynak)), y)).href}"`);
  const yol = join(gecici, `kopya-${sira++}.ts`);
  writeFileSync(yol, c);
  return import(pathToFileURL(yol).href) as Promise<M>;
}
type Oneri = typeof import("../../src/modules/rapor-format/yz-oneri.ts");
type Format = typeof import("../../src/server/yz/format.ts");
const T = FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const Z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);

test("1. bölüm türü süzülmeyince ölçüm cihazları bölümü önerilebilir (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Oneri>("src/modules/rapor-format/yz-oneri.ts",
    'const BLOKLAR = ["bilgi", "liste", "olcum", "test", "foto", "metin", "not", "kusur", "sonuc", "imza"] as const;',
    'const BLOKLAR = ["bilgi", "liste", "olcum", "test", "foto", "metin", "not", "kusur", "sonuc", "imza", "cihaz"] as const;');
  assert.notEqual(m.hamdanBolum(T, { ad: "Cihazlar", blok: "cihaz" }), null, "bozuk: cihaz bölümü önerildi");
});

test("2. Uygula Bakanlık işaretini korumayınca madde firmanın maddesi olur (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Oneri>("src/modules/rapor-format/yz-oneri.ts",
    "return { ...x, id: e.id, ...(e.kilit !== undefined ? { kilit: e.kilit } : {}) };", "return { ...x, id: e.id };");
  const gozle = Z.bolumler.find((b) => b.blok === "liste" && b.kilit) as BolumOf<"liste">;
  const ilk = gozle.gruplar[0].maddeler[0];
  assert.ok(ilk.kilit, "örnek: Bakanlık maddesi");
  const bolum = m.hamdanBolum(Z, { ad: gozle.ad, blok: "liste", gruplar: [{ ad: gozle.gruplar[0].ad, maddeler: [ilk.metin] }] })!;
  const y = m.oneriUygula(Z, { id: "o1", tur: "degistir", hedef: gozle.id, aciklama: "", bolum })!;
  const yb = y.bolumler.find((b) => b.id === gozle.id) as BolumOf<"liste">;
  assert.equal(yb.gruplar[0].maddeler[0].kilit, false, "bozuk: Bakanlık işareti kalktı");
});

test("3. öneri sayısı sınırlanmayınca 12 öneri gelir (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Format>("src/server/yz/format.ts", "ham.oneriler.slice(0, EN_COK_ONERI)", "ham.oneriler");
  const c = m.formatYanitiCoz({ content: [{ type: "text", text: JSON.stringify({ cevap: "", oneriler: Array.from({ length: 12 }, () => ({})) }) }] });
  assert.equal(c.oneriler.length, 12, "bozuk: sınır yok");
});
