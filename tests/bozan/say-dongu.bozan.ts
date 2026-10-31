/* OLUMSUZ KANIT — tests/say-saf.test.ts ve tests/say-akis.test.ts (2026-10-23 S.A.Y BAŞTAN — reisim: "say asistanı direk claude da haiku nasıl
   çalışıyor ise direk o şekilde çalıştıramaz mıyız", "hiç bir kısıtı olmasın") neyi koruyor. Eski kanıtlar (tur güvenliği, sahte "yaptım" düzeltme
   turu, döngüde araç seçimi) çekirdekle birlikte KASITLI olarak kalktı. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/yz/say.ts ve
   src/server/yz/akis.ts bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) iş adımlarında düşünme yeniden kapatılırsa (eski "thinking disabled") S.A.Y akıl yürütmeden çalışır — reisim'in "aptal davranıyor" şikâyetinin
      ana nedeni;
   2) konuşma yeniden kırpılırsa (eski "son 150 000 karakter" / son N ileti) S.A.Y verilen dosyayı ve yaptığı işi unutur; düşünme blokları da geçersiz;
   3) araç listesi sayfaya göre değişirse konuşmanın düşünmeleri geçersiz olur (talimat / araçlar konuşma boyunca aynı olmalı);
   4) düşünmenin imzası biriktirilmezse düşünme bloğu geri gönderilemez (hizmet reddeder ya da düşürür);
   5) araç girdisinin parçaları birleştirilmezse (yalnız son parça) çağrının girdisi bozulur;
   6) bilinmeyen blok ya da parça atılırsa konuşma olduğu gibi geri gönderilmez. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "say-dongu-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
const SAY = kaynak("src/server/yz/say.ts"), AKIS = kaynak("src/server/yz/akis.ts");
let sira = 0;
async function bozuk<T>(k: string, eski: string, yeni: string): Promise<T> {
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `m-${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Say = typeof import("../../src/server/yz/say.ts");
type Akis = typeof import("../../src/server/yz/akis.ts");
const MESAJLAR = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `ileti ${i}` }));
const istek = (m: Say, araclar: readonly object[] = m.sayAraclari({ name: "formati_duzenle" })) =>
  m.sayIstegi({ model: "haiku", sistem: "s", araclar, mesajlar: MESAJLAR }).govde as { thinking: { type: string }; messages: unknown[]; tools: { name: string }[] };

test("1) iş adımlarında düşünme kapatılırsa S.A.Y akıl yürütmeden çalışır", async () => {
  const m = await bozuk<Say>(SAY, "        : { type: \"adaptive\", display: \"summarized\", block_binding: { prefix_mismatch_behavior: \"drop_block\" } },",
    "        : { type: \"disabled\" },");
  assert.equal(istek(m).thinking.type, "disabled", "bozuk: düşünme kapalı");
});

test("2) konuşma kırpılırsa S.A.Y dosyayı ve yaptığı işi unutur", async () => {
  const m = await bozuk<Say>(SAY, "      messages: p.mesajlar,", "      messages: p.mesajlar.slice(-12),");
  assert.notDeepEqual(istek(m).messages, MESAJLAR, "bozuk: konuşmanın başı gitti");
});

test("3) araç listesi sayfaya göre değişirse düşünmeler geçersiz olur", async () => {
  const m = await bozuk<Say>(SAY, "export const sayAraclari = (formatAraci: object): readonly object[] => [...ISLEM_ARACLARI, BECERI_ARACI, ...GORSEL_ARACLARI, FORM_ARACI, EKRAN_ARACI, ...RAPOR_ARACLARI, formatAraci, FORMAT_PDF_ARACI, PDF_GONDER_ARACI, ARAMA_ARACI];",
    "export const sayAraclari = (formatAraci: object, rapor = false): readonly object[] => [...ISLEM_ARACLARI, BECERI_ARACI, ...GORSEL_ARACLARI, FORM_ARACI, EKRAN_ARACI, ...(rapor ? RAPOR_ARACLARI : []), formatAraci, FORMAT_PDF_ARACI, PDF_GONDER_ARACI, ARAMA_ARACI];");
  assert.ok(!istek(m).tools.some((t) => t.name === "rapora_yaz"), "bozuk: rapor araçları yalnız rapordayken");
});

const birik = (m: Akis, metin: string) => {
  const b = new m.AkisBirikimi(), t = { kalan: "" };
  for (const o of m.sseAyir(t, metin)) b.olay(o.olay, JSON.parse(o.veri));
  return b.icerik();
};
const olay = (tur: string, veri: object) => `event: ${tur}\ndata: ${JSON.stringify({ type: tur, ...veri })}\n\n`;
const BAS = olay("message_start", { message: { id: "m", model: "x", content: [], usage: {} } });

test("4) düşünmenin imzası biriktirilmezse düşünme bloğu geri gönderilemez", async () => {
  const m = await bozuk<Akis>(AKIS, "      if (p.type === \"signature_delta\") { b.signature = String(b.signature ?? \"\") + String(p.signature ?? \"\"); return; }\n",
    "      if (p.type === \"signature_delta\") return;\n");
  const l = birik(m, BAS + olay("content_block_start", { index: 0, content_block: { type: "thinking", thinking: "" } })
    + olay("content_block_delta", { index: 0, delta: { type: "signature_delta", signature: "imza" } }));
  assert.equal((l[0] as { signature?: string }).signature, undefined, "bozuk: imza yok");
});

test("5) araç girdisinin parçaları birleştirilmezse girdi bozulur", async () => {
  const m = await bozuk<Akis>(AKIS, "this.json.set(i, (this.json.get(i) ?? \"\") + String(p.partial_json ?? \"\"));", "this.json.set(i, String(p.partial_json ?? \"\"));");
  const l = birik(m, BAS + olay("content_block_start", { index: 0, content_block: { type: "tool_use", id: "t", name: "islem", input: {} } })
    + olay("content_block_delta", { index: 0, delta: { type: "input_json_delta", partial_json: "{\"ad\": " } })
    + olay("content_block_delta", { index: 0, delta: { type: "input_json_delta", partial_json: "\"plan_ac\"}" } })
    + olay("content_block_stop", { index: 0 }));
  assert.deepEqual(l[0].input, {}, "bozuk: girdi kayboldu");
});

test("6) bilinmeyen parça atılırsa konuşma olduğu gibi geri gönderilmez", async () => {
  const eski = "      for (const [k, x] of Object.entries(p)) {\n        if (k === \"type\") continue;\n        b[k] = typeof x === \"string\" && typeof b[k] === \"string\" ? (b[k] as string) + x : x;\n      }\n";
  const m = await bozuk<Akis>(AKIS, eski, "");
  const l = birik(m, BAS + olay("content_block_start", { index: 0, content_block: { type: "yeni", veri: "a" } })
    + olay("content_block_delta", { index: 0, delta: { type: "yeni_delta", veri: "b" } }));
  assert.equal(l[0].veri, "a", "bozuk: parça atıldı");
});
