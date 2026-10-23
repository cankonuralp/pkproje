/* NEREDEN GELDİ: 2026-10-23 — S.A.Y baştan (reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde çalıştıramaz mıyız"):
   yapay zekânın cevabı AKIŞLA gelir (src/server/yz/akis.ts) ve konuşmaya OLDUĞU GİBİ girer — düşünme bloğu imzasıyla, araç çağrısının girdisi
   parçalardan birleşmiş, sunucu araçlarının sonuçları; bilinmeyen blok ve parça kaybolmaz. Saf:
   · SSE çerçevesi parça sınırlarından bağımsız (olay ortasından bölünen akış aynı sonucu verir; \r\n, yorum satırı);
   · birikim: metin, düşünme + imza, araç girdisi (JSON parçaları), alıntı, bilinmeyen parça, durma nedeni ve kullanım; dinleyici metin ve düşünmeyi
     geldikçe alır; bozuk araç girdisi boş nesne olur (yardımcı işaret geri gönderilmez); akış içi hata.
   Olumsuz kanıt: tests/bozan/say-dongu.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { AkisBirikimi, sseAyir } from "../src/server/yz/akis.ts";

const olay = (tur: string, veri: object) => `event: ${tur}\ndata: ${JSON.stringify({ type: tur, ...veri })}\n\n`;
const AKIS = [
  olay("message_start", { message: { id: "msg_1", model: "claude-haiku-5-5", content: [], stop_reason: null, usage: { input_tokens: 10, cache_read_input_tokens: 90 } } }),
  ": yorum satırı\n\n",
  olay("content_block_start", { index: 0, content_block: { type: "thinking", thinking: "" } }),
  olay("content_block_delta", { index: 0, delta: { type: "thinking_delta", thinking: "Haritaya " } }),
  olay("content_block_delta", { index: 0, delta: { type: "thinking_delta", thinking: "bakmalıyım." } }),
  olay("content_block_delta", { index: 0, delta: { type: "signature_delta", signature: "imza==" } }),
  olay("content_block_stop", { index: 0 }),
  olay("content_block_start", { index: 1, content_block: { type: "text", text: "" } }),
  olay("content_block_delta", { index: 1, delta: { type: "text_delta", text: "Bakıyorum" } }),
  olay("content_block_delta", { index: 1, delta: { type: "citations_delta", citation: { type: "page_location", cited_text: "x" } } }),
  olay("content_block_stop", { index: 1 }),
  olay("content_block_start", { index: 2, content_block: { type: "tool_use", id: "toolu_1", name: "rapora_yaz", input: {} } }),
  olay("content_block_delta", { index: 2, delta: { type: "input_json_delta", partial_json: "{\"girisler\": [{\"yer\": \"a:se" } }),
  olay("content_block_delta", { index: 2, delta: { type: "input_json_delta", partial_json: "ri\", \"deger\": \"Ç-12\"}]}" } }),
  olay("content_block_stop", { index: 2 }),
  olay("content_block_start", { index: 3, content_block: { type: "yeni_blok", veri: "a" } }),
  olay("content_block_delta", { index: 3, delta: { type: "yeni_delta", veri: "b", sayi: 3 } }),
  olay("content_block_stop", { index: 3 }),
  olay("message_delta", { delta: { stop_reason: "tool_use", stop_sequence: null }, usage: { output_tokens: 42 } }),
  "event: ping\ndata: {\"type\": \"ping\"}\n\n",
  olay("message_stop", {}),
].join("");

function birik(parcalar: readonly string[]) {
  const b = new AkisBirikimi(), t = { kalan: "" }, metin: string[] = [], dusunce: string[] = [];
  for (const p of parcalar) for (const o of sseAyir(t, p)) b.olay(o.olay, JSON.parse(o.veri), { metin: (d) => metin.push(d), dusunce: (d) => dusunce.push(d) });
  return { b, metin, dusunce };
}

test("akış: blok blok birikir — düşünme + imza, metin + alıntı, araç girdisi parçalardan, bilinmeyen blok; durma nedeni ve kullanım", () => {
  const { b, metin, dusunce } = birik([AKIS]);
  assert.ok(b.bitti && !b.hata);
  assert.deepEqual(b.icerik(), [
    { type: "thinking", thinking: "Haritaya bakmalıyım.", signature: "imza==" },
    { type: "text", text: "Bakıyorum", citations: [{ type: "page_location", cited_text: "x" }] },
    { type: "tool_use", id: "toolu_1", name: "rapora_yaz", input: { girisler: [{ yer: "a:seri", deger: "Ç-12" }] } },
    { type: "yeni_blok", veri: "ab", sayi: 3 },
  ]);
  assert.equal(b.mesaj?.stop_reason, "tool_use");
  assert.deepEqual(b.mesaj?.usage, { input_tokens: 10, cache_read_input_tokens: 90, output_tokens: 42 });
  assert.deepEqual(metin, ["Bakıyorum"]);
  assert.deepEqual(dusunce, ["Haritaya ", "bakmalıyım."]);
});

test("çerçeve parça sınırlarından bağımsız: her karakterde bölünen ve \\r\\n'li akış aynı sonucu verir", () => {
  const tek = birik([AKIS]).b.icerik();
  assert.deepEqual(birik([...AKIS]).b.icerik(), tek, "her karakter ayrı parça");
  assert.deepEqual(birik([AKIS.replace(/\n/g, "\r\n")]).b.icerik(), tek, "\\r\\n");
  const t = { kalan: "" };
  assert.deepEqual(sseAyir(t, "event: a\ndata: {\"x\":"), []);
  assert.deepEqual(sseAyir(t, "1}\n\n"), [{ olay: "a", veri: "{\"x\":1}" }]);
});

test("bozuk araç girdisi boş nesne (yardımcı işaret geri gönderilmez); akış içi hata; message_start'sız olay yok sayılır", () => {
  const b = new AkisBirikimi();
  b.olay("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
  assert.equal(b.mesaj, null);
  b.olay("message_start", { message: { id: "m", model: "x", content: [], usage: {} } });
  b.olay("content_block_start", { index: 0, content_block: { type: "tool_use", id: "t", name: "islem", input: {} } });
  b.olay("content_block_delta", { index: 0, delta: { type: "input_json_delta", partial_json: "{\"ad\": " } });
  b.olay("content_block_stop", { index: 0 });
  assert.deepEqual(b.icerik(), [{ type: "tool_use", id: "t", name: "islem", input: {} }]);
  b.olay("error", { error: { type: "overloaded_error", message: "Overloaded" } });
  assert.deepEqual(b.hata, { type: "overloaded_error", message: "Overloaded" });
});
