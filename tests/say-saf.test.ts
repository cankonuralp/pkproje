/* NEREDEN GELDİ: 380 — S.A.Y isteği ve cevabı (src/server/yz/say.ts, src/modules/say/yardim.ts; ARKA-UC §5.1 "sabit talimat önbelleğe", §5.3 "rapor içindeki
   serbest metin talimat gibi okunmaz", §5.4 "gönderilen veri en aza"). Saf:
   · konuşma kullanıcıyla başlar, roller sırayla (aynı rolden ardışıklar birleşir), son 12 ileti; soru / cevap sınırları;
   · istek: sabit talimat önbellekte, bağlam ayrı ve yalnız verilen alanlar; talimat kuralları (öneri verir, yazmaz; veri talimat değildir);
   · cevap: yalnız metin blokları, denetim karakterleri atılır, sınır; önbellek girişleri de sayılır; kesik / ret;
   · sayfa yardımı: adresten yer adı (kayıt kimliği ve sorgu atılır), her menü modülünün yardımı ve kılavuzda yeri;
   · 382 rapor girdisi: ekranın gönderdiği yapı denetlenir (serbest metin yok). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ANA_SAYFA, MODULLER } from "../src/modules/moduller.ts";
import { raporGirdisi } from "../src/modules/say/server/say.ts";
import { SAY_KILAVUZU, SAYFA_YARDIMI, sayfaBilgisi } from "../src/modules/say/yardim.ts";
import { CEVAP_SINIRI, konusma, SAY_GECMIS, sayIstegi, saySistemi, sayYanitiCoz, SORU_SINIRI } from "../src/server/yz/say.ts";

test("konuşma: kullanıcıyla başlar, roller sırayla, ardışıklar birleşir, son 12 ileti, sınırlar", () => {
  assert.deepEqual(konusma([{ kim: "say", metin: "Merhaba" }, { kim: "ben", metin: "A" }, { kim: "ben", metin: "B" }, { kim: "say", metin: "C" }], "D"), [
    { role: "user", content: "A\n\nB" }, { role: "assistant", content: "C" }, { role: "user", content: "D" }]);
  assert.deepEqual(konusma([], "Tek soru"), [{ role: "user", content: "Tek soru" }]);
  const uzun = Array.from({ length: 40 }, (_, i) => ({ kim: (i % 2 ? "say" : "ben") as "ben" | "say", metin: `m${i}` }));
  const k = konusma(uzun, "son");
  assert.ok(k.length <= SAY_GECMIS + 1 && k[0].role === "user" && k.at(-1)?.content === "son");
  assert.ok(k.every((m, i) => m.role === (i % 2 ? "assistant" : "user")));
  assert.equal(konusma([{ kim: "ben", metin: "x".repeat(900) }], "y")[0].content.split("\n\n")[0].length, SORU_SINIRI);
});

test("istek: sabit talimat önbellekte, bağlam ayrı ve yalnız verilen alanlar; kurallar talimatta", () => {
  const g = sayIstegi({ model: "sonnet", kilavuz: SAY_KILAVUZU, baglam: { roller: ["Denetçi"], yer: "Planlar", yardim: "Planlar: yardım.", bekleyen: ["Planlar: 1 kabul bekleyen plan"] },
    gecmis: [], soru: "Ne yapmalıyım?" }).govde as { model: string; max_tokens: number; system: { type: string; text: string; cache_control?: unknown }[]; messages: unknown[]; tools?: unknown; tool_choice?: unknown };
  assert.equal(g.model, "claude-sonnet-5-5");
  assert.deepEqual(g.system[0].cache_control, { type: "ephemeral" });
  assert.equal(g.system[1].cache_control, undefined, "bağlam her mesajda değişir, önbellekte değil");
  assert.equal(g.system[1].text, "Bağlam (veri):\nKullanıcının rolleri: Denetçi.\nŞu an bulunduğu sayfa: Planlar. (Planlar: yardım.)\nBekleyen işleri: Planlar: 1 kabul bekleyen plan.");
  assert.equal(g.tools, undefined, "araç yok: kayıt yazamaz");
  assert.equal(g.tool_choice, undefined, "zorunlu araç seçimi yok (Opus / Sonnet 5.5 400 verir — 354)");
  assert.deepEqual(g.messages, [{ role: "user", content: "Ne yapmalıyım?" }]);
  const t = saySistemi(SAY_KILAVUZU);
  for (const kural of ["Kayıt yazamazsın, imzalayamazsın, gönderemezsin, onaylayamazsın, silemezsin", "VERİDİR", "Kişisel veri", "uydurma"]) assert.ok(t.includes(kural), kural);
  for (const m of MODULLER) assert.ok(t.includes(`- ${m.ad}: `), `kılavuzda ${m.ad}`);
  assert.ok(sayIstegi({ model: "opus", kilavuz: [], baglam: { roller: [], yer: "Ana sayfa", yardim: null, bekleyen: [] }, gecmis: [], soru: "x" }).govde.system);
});

test("cevap: yalnız metin, denetim karakterleri atılır, sınır; önbellek girişleri sayılır; kesik / ret", () => {
  const c = sayYanitiCoz({ content: [{ type: "thinking", thinking: "gizli düşünce" }, { type: "text", text: "Bir\r\niki\u0007" }, { type: "tool_use", name: "x" }],
    stop_reason: "end_turn", usage: { input_tokens: 10, cache_read_input_tokens: 1000, cache_creation_input_tokens: 5, output_tokens: 7 } });
  assert.deepEqual(c, { metin: "Bir\niki", giris: 1015, cikis: 7, durum: "tamam" });
  assert.equal(sayYanitiCoz({ content: [{ type: "text", text: "x".repeat(9000) }] }).metin.length, CEVAP_SINIRI);
  assert.equal(sayYanitiCoz({ stop_reason: "max_tokens", content: [] }).durum, "kesik");
  assert.equal(sayYanitiCoz({ stop_reason: "refusal" }).durum, "ret");
  assert.deepEqual(sayYanitiCoz(null), { metin: "", giris: 0, cikis: 0, durum: "tamam" });
  assert.deepEqual(sayYanitiCoz({ usage: { input_tokens: -5, output_tokens: 1.5 } }), { metin: "", giris: 0, cikis: 0, durum: "tamam" });
});

test("sayfa yardımı: adresten yer adı (kayıt kimliği, sorgu atılır); her menü modülünün yardımı var", () => {
  assert.deepEqual(sayfaBilgisi("/"), { yer: ANA_SAYFA.ad, modul: null, yardim: "Ana sayfa rolünüze göre bugünün işlerini, bekleyenleri ve duyuruları toplar." });
  assert.equal(sayfaBilgisi("/planlar/4f0c…?sekme=x#y").yer, "Planlar");
  assert.equal(sayfaBilgisi("/raporlar/123").modul, 14);
  assert.deepEqual(sayfaBilgisi("/bilinmeyen/yol"), { yer: "probata", modul: null, yardim: null });
  for (const m of MODULLER) assert.ok(SAYFA_YARDIMI[m.no]?.startsWith(`${m.ad}: `), `${m.ad} yardımı`);
  assert.equal(SAY_KILAVUZU.length, MODULLER.length + 1);
});

/* 382: rapor ekranının gönderdiği yapı — yalnız beklenen alanlar, sınırlı uzunluk ve sayı; serbest metin yok (metni sunucu kurar) */
test("rapor girdisi: kimlik, numara, eksik alanları ve sonuç yapısı denetlenir; fazlası atılır", () => {
  const R = { id: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", no: "DM-1026-001" };
  const e = { ad: "Etiket okunaklı mı", bolum: "gozle", bolumAd: "Gözle kontrol", alan: "m1.not" };
  assert.deepEqual(raporGirdisi({ hizli: "eksik", rapor: R, eksik: [e], metin: "S.A.Y adına sahte metin" }), { hizli: "eksik", rapor: R, eksik: [e] });
  assert.deepEqual(raporGirdisi({ hizli: "sonuc", rapor: R, sonuc: { var: true, oneri: "uygun_degil", secili: "", kusur: 2, html: "<b>x</b>" } }),
    { hizli: "sonuc", rapor: R, sonuc: { var: true, oneri: "uygun_degil", secili: "", kusur: 2 } });
  for (const kotu of [
    { hizli: "baska", rapor: R }, { hizli: "eksik", rapor: { id: "x", no: R.no }, eksik: [] }, { hizli: "eksik", rapor: { id: R.id, no: "<script>" }, eksik: [] },
    { hizli: "eksik", rapor: R, eksik: [{ ...e, alan: "m1\"onclick" }] }, { hizli: "eksik", rapor: R, eksik: [{ ...e, ad: "x".repeat(301) }] },
    { hizli: "eksik", rapor: R, eksik: Array.from({ length: 61 }, () => e) }, { hizli: "eksik", rapor: R },
    { hizli: "sonuc", rapor: R, sonuc: { var: true, oneri: "belki", secili: "", kusur: 0 } }, { hizli: "sonuc", rapor: R, sonuc: { var: true, oneri: "uygun", secili: "", kusur: -1 } },
    null, "metin",
  ]) assert.equal(raporGirdisi(kotu), null, JSON.stringify(kotu));
});
