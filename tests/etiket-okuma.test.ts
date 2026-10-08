/* NEREDEN GELDİ: 385 — etiket plakasından okuma (ARKA-UC §5.2 "aynı çatı: ekipman etiket plakası (marka / model / seri / imal yılı)"; maket
   maket-rapor.js etiket-oku; §8.10 ilkesi: okunan ÖNERİ, denetçi uygulamadan yazılmaz). Saf (src/server/yz/etiket.ts):
   · istek: fotoğraf + yapılandırılmış çıktı şeması (alan seçenekleri sabit), zorunlu araç yok, firma / müşteri / kişi bilgisi yok;
   · cevap: alan başına ilki; bilinmeyen alan, boş / sınırı aşan değer, geçersiz ya da gelecek imal yılı atılır; denetim karakterleri temizlenir;
     güven bilinmiyorsa "dusuk" (tek tek uygulanır); kesik / ret; token sayıları. Olumsuz kanıt: tests/bozan/etiket-okuma.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ETIKET_ALANLARI, etiketIstegi, etiketYanitiCoz } from "../src/server/yz/etiket.ts";

const BUGUN = new Date("2026-10-08T09:00:00Z");
const cevap = (alanlar: unknown, ek: Record<string, unknown> = {}) => ({ content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify({ alanlar, not: null }) }],
  stop_reason: "end_turn", usage: { input_tokens: 3000, output_tokens: 120 }, ...ek });

test("istek: fotoğraf + şema (alan seçenekleri sabit), zorunlu araç yok, kişi / firma bilgisi yok", () => {
  const g = etiketIstegi({ model: "sonnet", resim: new Uint8Array([1, 2, 3]), tur: "png" }).govde as Record<string, unknown> & {
    messages: { content: { type: string; source?: { media_type: string; data: string } }[] }[]; output_config: { format: { schema: { properties: { alanlar: { items: { properties: { alan: { enum: string[] } } } } } } } };
  };
  assert.equal(g.model, "claude-sonnet-5-5");
  assert.equal(g.tool_choice, undefined);
  assert.deepEqual(g.output_config.format.schema.properties.alanlar.items.properties.alan.enum, ["marka", "model", "seri", "imal"]);
  assert.deepEqual(g.messages[0].content[0].source, { type: "base64", media_type: "image/png", data: Buffer.from([1, 2, 3]).toString("base64") });
  assert.doesNotMatch(JSON.stringify(g), /firma_adi|müşteri|unvan|@|sk-ant/i);
  assert.deepEqual(ETIKET_ALANLARI.map(([a, , en]) => [a, en]), [["marka", 40], ["model", 40], ["seri", 30], ["imal", 4]]);
});

test("cevap: alan başına ilki; bilinmeyen alan, boş / uzun değer, geçersiz / gelecek yıl atılır; güven bilinmiyorsa düşük", () => {
  const c = etiketYanitiCoz(cevap([
    { alan: "marka", deger: "  Deneme\u0007 Marka  ", guven: "yuksek" },
    { alan: "marka", deger: "İkinci", guven: "yuksek" },
    { alan: "model", deger: "DM-100", guven: "belki" },
    { alan: "seri", deger: "x".repeat(31), guven: "yuksek" },
    { alan: "imal", deger: "2099", guven: "yuksek" },
    { alan: "renk", deger: "Kırmızı", guven: "yuksek" },
    { alan: "seri", deger: "", guven: "yuksek" },
    "bozuk",
  ]), BUGUN);
  assert.deepEqual(c.okunan, [{ alan: "marka", deger: "Deneme Marka", guven: "yuksek" }, { alan: "model", deger: "DM-100", guven: "dusuk" }]);
  assert.deepEqual([c.giris, c.cikis, c.durum], [3000, 120, "tamam"]);
  for (const yil of ["19x1", "1899", "2027", "201"]) assert.deepEqual(etiketYanitiCoz(cevap([{ alan: "imal", deger: yil, guven: "yuksek" }]), BUGUN).okunan, [], yil);
  assert.deepEqual(etiketYanitiCoz(cevap([{ alan: "imal", deger: "2019", guven: "orta" }]), BUGUN).okunan, [{ alan: "imal", deger: "2019", guven: "orta" }]);
  assert.equal(etiketYanitiCoz(cevap([], { stop_reason: "refusal" }), BUGUN).durum, "ret");
  assert.equal(etiketYanitiCoz(cevap([], { stop_reason: "max_tokens" }), BUGUN).durum, "kesik");
  assert.deepEqual(etiketYanitiCoz({ content: [{ type: "text", text: "json değil" }] }, BUGUN).okunan, []);
  assert.deepEqual(etiketYanitiCoz(null, BUGUN), { okunan: [], giris: 0, cikis: 0, durum: "tamam" });
});
