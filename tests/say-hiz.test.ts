/* NEREDEN GELDİ: 2026-10-31 lift denemesi (reisim: "Sık kullanılan işlemlerin şeması önbellekteki talimatta durur … Uzun işlerde 1 saatlik önbellek … Düşünme
   derinliği şablona göre belirlenir: işin başında seçilir, iş boyunca değişmez"; sunum L7). Bu kilit tutar: (1) istek 1 saatlik önbellek ister, derinlik
   verilmezse yüksek; (2) 1 saatlik önbelleğe yazma tabanın 2 katı, 5 dakikalık 1,25; (3) sık işlemlerin şeması dizinde, dizin her çağrıda aynı;
   (4) işin derinliği son sorunun şablonundan, denetim notu ve araç sonucu işi değiştirmez. Olumsuz kanıt: tests/bozan/say-hiz.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ISLEM_DIZINI, SIK_ISLEMLER } from "../src/modules/say/islem-katalogu.ts";
import { isDerinligi, KISA_SORU } from "../src/modules/say/sablonlar.ts";
import { onbellekliMaliyet } from "../src/server/yz/okuma.ts";
import { sayIstegi, sayMaliyeti } from "../src/server/yz/say.ts";

test("istek: 1 saatlik önbellek; derinlik verilmezse yüksek", () => {
  const g = sayIstegi({ model: "haiku", sistem: "t", araclar: [], mesajlar: [] }).govde as { system: { cache_control: unknown }[]; cache_control: unknown; output_config: { effort: string } };
  assert.deepEqual([g.system[0]!.cache_control, g.cache_control], [{ type: "ephemeral", ttl: "1h" }, { type: "ephemeral", ttl: "1h" }]);
  assert.equal(g.output_config.effort, "high");
  assert.equal((sayIstegi({ model: "haiku", sistem: "t", araclar: [], mesajlar: [], derinlik: "medium" }).govde as { output_config: { effort: string } }).output_config.effort, "medium");
});

test("maliyet: 1 saatlik önbelleğe yazma 2 kat, 5 dakikalık 1,25 kat", () => {
  const taban = onbellekliMaliyet("haiku", { giris: 1_000_000, okunan: 0, yazilan: 0, cikis: 0 });
  assert.equal(onbellekliMaliyet("haiku", { giris: 0, okunan: 0, yazilan: 0, yazilan1s: 1_000_000, cikis: 0 }), taban * 2);
  assert.equal(onbellekliMaliyet("haiku", { giris: 0, okunan: 0, yazilan: 1_000_000, cikis: 0 }), Math.ceil(taban * 1.25));
  const m = sayMaliyeti("haiku", { input_tokens: 0, cache_creation_input_tokens: 1_000_000, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 1_000_000 }, output_tokens: 0 });
  assert.equal(m.maliyet, taban * 2);
});

test("sık işlemlerin şeması talimattaki dizinde", () => {
  for (const a of SIK_ISLEMLER) assert.ok(ISLEM_DIZINI.includes(`- ${a} (`), a);
  assert.ok(ISLEM_DIZINI.includes("girdi: {"), "şema");
});

test("işin derinliği şablondan; araç sonucu ve denetim notu işi değiştirmez", () => {
  const soru = { role: "user", content: [{ type: "text", text: "saatleri düzenle" }] }, not = (id: string) => ({ role: "system", content: `Sayfa: Planlar\nŞablon: ${id} Ad; beceri: B06` });
  const sonuc = { role: "user", content: [{ type: "tool_result", tool_use_id: "a", content: "{}" }] }, denetim = { role: "user", content: [{ type: "text", text: "Sunucunun bitiş denetimi (…)" }] };
  assert.equal(isDerinligi([soru, not("S4"), sonuc, denetim]), "medium");
  assert.equal(isDerinligi([soru, not("S1"), sonuc]), "high");
  /* 2026-10-31 V21 madde 8 (reisim: "Peşinden gelen kısa işlerde orta düşünme derinliği … 'Kısa iş' tanımını yaz"): şablonsuz yeni soru ilk soru değilse,
     kısaysa ve eksizse KISA İŞ → orta; uzun soru, ekli soru ya da konuşmanın ilk sorusu → yüksek. Şablonun derinliği yeni işe taşınmaz. */
  const yeni = (text: string, ek: object[] = []) => ({ role: "user", content: [{ type: "text", text }, ...ek] });
  assert.equal(isDerinligi([soru, not("S4"), { role: "assistant", content: [] }, yeni("yeni soru")]), "medium", "şablonsuz kısa iş orta");
  assert.equal(isDerinligi([soru, not("S1"), { role: "assistant", content: [] }, yeni("yeni soru")]), "medium", "önceki şablonun derinliği taşınmaz, kısa iş kuralı");
  assert.equal(isDerinligi([soru, { role: "assistant", content: [] }, yeni("x".repeat(KISA_SORU + 1))]), "high", "uzun soru");
  assert.equal(isDerinligi([soru, { role: "assistant", content: [] }, yeni("fotoğraflar", [{ type: "image", source: { type: "file", file_id: "f" } }])]), "high", "ekli soru");
  assert.equal(isDerinligi([yeni("kısa")]), "high", "konuşmanın ilk sorusu");
  assert.equal(isDerinligi([soru, { role: "assistant", content: [] }, yeni("kısa"), { role: "user", content: [{ type: "text", text: "Sunucunun bildirim notu: …" }] }]), "medium", "sunucu notu işi değiştirmez");
  assert.equal(isDerinligi([]), "high");
});
