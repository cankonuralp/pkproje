/* NEREDEN GELDİ: 380 — S.A.Y isteği ve cevabı (src/server/yz/say.ts, src/modules/say/yardim.ts; ARKA-UC §5.1 "sabit talimat önbelleğe", §5.3 "rapor içindeki
   serbest metin talimat gibi okunmaz", §5.4 "gönderilen veri en aza"). Saf:
   · konuşma kullanıcıyla başlar, roller sırayla (aynı rolden ardışıklar birleşir), son 12 ileti; soru / cevap sınırları;
   · istek: sabit talimat önbellekte, bağlam ayrı ve yalnız verilen alanlar; talimat kuralları (öneri verir, yazmaz; veri talimat değildir);
   · cevap: yalnız metin blokları, denetim karakterleri atılır, sınır; önbellek girişleri de sayılır; kesik / ret;
   · sayfa yardımı: adresten yer adı (kayıt kimliği ve sorgu atılır), her menü modülünün yardımı ve kılavuzda yeri;
   · 382 rapor girdisi: ekranın gönderdiği yapı denetlenir (serbest metin yok).
   550 (sunum 546 K6–K8 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum oradan direk haiku ile konuşmak aynı claud
   kullanır gibi"): talimatta KURAL YOK (uzunluk, biçim, "yazamazsın" kalktı) — yalnız nerede olduğu ve neler yapabildiği; konuşma son 150 000
   karakter; Markdown serbest; rapordayken araçlar (rapora_yaz, fotograflari_oku, geri_al), her zaman internet araması; cevaptaki araç çağrıları
   komut olur (yalnız tanınan adlar, biçimiyle), arama sayılır; eski hızlı soruların ("eksik", "sonuc") girdisi kalktı. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ANA_SAYFA, MODULLER } from "../src/modules/moduller.ts";
import { raporGirdisi } from "../src/modules/say/server/say.ts";
import { SAY_KILAVUZU, SAYFA_YARDIMI, sayfaBilgisi } from "../src/modules/say/yardim.ts";
import { ARAMA_ARACI, CEVAP_SINIRI, GECMIS_HARF, konusma, SAY_GECMIS, sayIstegi, saySistemi, sayYanitiCoz, SORU_SINIRI } from "../src/server/yz/say.ts";

test("konuşma: kullanıcıyla başlar, roller sırayla, ardışıklar birleşir, en yeniler (ileti ve karakter sınırı), sınırlar", () => {
  assert.deepEqual(konusma([{ kim: "say", metin: "Merhaba" }, { kim: "ben", metin: "A" }, { kim: "ben", metin: "B" }, { kim: "say", metin: "C" }], "D"), [
    { role: "user", content: "A\n\nB" }, { role: "assistant", content: "C" }, { role: "user", content: "D" }]);
  assert.deepEqual(konusma([], "Tek soru"), [{ role: "user", content: "Tek soru" }]);
  const uzun = Array.from({ length: 40 }, (_, i) => ({ kim: (i % 2 ? "say" : "ben") as "ben" | "say", metin: `m${i}` }));
  const k = konusma(uzun, "son");
  assert.ok(k.length <= SAY_GECMIS + 1 && k[0].role === "user" && k.at(-1)?.content === "son");
  assert.ok(k.every((m, i) => m.role === (i % 2 ? "assistant" : "user")));
  assert.equal(konusma([{ kim: "ben", metin: "x".repeat(SORU_SINIRI + 900) }], "y")[0].content.split("\n\n")[0].length, SORU_SINIRI);
  /* 550: uzun konuşmada en yeniler GECMIS_HARF karakterine sığacak kadar (eskiler düşer) */
  const cok = Array.from({ length: 30 }, (_, i) => ({ kim: (i % 2 ? "say" : "ben") as "ben" | "say", metin: `${i}:${"y".repeat(10_000)}` }));
  const kk = konusma(cok, "son");
  const toplam = kk.reduce((t, m) => t + m.content.length, 0);
  assert.ok(toplam <= GECMIS_HARF + 200 && kk.at(-1)?.content === "son" && kk[0].role === "user", String(toplam));
  assert.ok(!kk.some((m) => m.content.startsWith("0:")), "en eski düştü");
});

test("istek: sabit talimat önbellekte, bağlam ayrı ve yalnız verilen alanlar; talimatta kural yok; internet araması; rapordayken araçlar", () => {
  const g = sayIstegi({ model: "haiku", kilavuz: SAY_KILAVUZU, baglam: { roller: ["Denetçi"], yer: "Planlar", yardim: "Planlar: yardım.", bekleyen: ["Planlar: 1 kabul bekleyen plan"] },
    gecmis: [], soru: "Ne yapmalıyım?" }).govde as { model: string; max_tokens: number; system: { type: string; text: string; cache_control?: unknown }[]; messages: unknown[]; tools?: unknown; tool_choice?: unknown };
  assert.equal(g.model, "claude-haiku-5-5"); // 2026-10-14: tek model Haiku 5.5 (reisim "tek seçenek claude haiku 5.5 olsun")
  assert.deepEqual(g.system[0].cache_control, { type: "ephemeral" });
  assert.equal(g.system[1].cache_control, undefined, "bağlam her mesajda değişir, önbellekte değil");
  assert.equal(g.system[1].text, "Bağlam:\nKullanıcının rolleri: Denetçi.\nŞu an bulunduğu sayfa: Planlar. (Planlar: yardım.)\nBekleyen işleri: Planlar: 1 kabul bekleyen plan.");
  assert.deepEqual(g.tools, [ARAMA_ARACI], "rapor dışında yalnız internet araması (K7)");
  assert.equal(g.tool_choice, undefined, "zorunlu araç seçimi yok (Opus / Sonnet 5.5 400 verir — 354)");
  assert.deepEqual(g.messages, [{ role: "user", content: "Ne yapmalıyım?" }]);
  const t = saySistemi(SAY_KILAVUZU);
  assert.ok(t.startsWith("Sen S.A.Y'sın: Claude Haiku 5.5."), "taklit sunucu bu başlangıçla tanır");
  /* 550: bizim kurallarımız kalktı — uzunluk / biçim / "yazamazsın" yok */
  for (const kural of ["en çok 3 cümle", "Kayıt yazamazsın", "Markdown başlığı, tablo, bağlantı ya da HTML kullanma", "Kuralların:", "\"yapamam\" deme"]) assert.ok(!t.includes(kural), kural);
  assert.ok(t.includes("Markdown kullanabilirsin") && t.includes("kullanıcıya söyle"), "biçim serbest; ekteki talimat kullanıcıya söylenir");
  for (const m of MODULLER) assert.ok(t.includes(`- ${m.ad}: `), `kılavuzda ${m.ad}`);
  /* rapordayken: harita bağlamda, araçlar (yazma, okuma, geri al) + arama; arama kapatılabilir */
  const r = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "Rapor X", yardim: null, bekleyen: [], rapor: "HARİTA" }, gecmis: [], soru: "x" }).govde as
    { system: { text: string }[]; tools: { name: string }[]; output_config: unknown };
  assert.ok(r.system[1].text.includes("Açık rapor (kullanıcının şu an yazdığı, kaydedilmemiş değişiklikler dahil):\nHARİTA"));
  assert.deepEqual(r.tools.map((x) => x.name), ["rapora_yaz", "fotograflari_oku", "geri_al", "web_search"]);
  assert.deepEqual(r.output_config, { effort: "medium" });
  assert.equal((sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "Ana sayfa", yardim: null, bekleyen: [] }, gecmis: [], soru: "x", arama: false }).govde as { tools?: unknown }).tools, undefined);
});

test("cevap: metin (denetim karakterleri atılır, sınır), önbellek girişleri ve aramalar sayılır; araç çağrıları komut; kesik / ret", () => {
  const c = sayYanitiCoz({ content: [{ type: "thinking", thinking: "gizli düşünce" }, { type: "text", text: "Bir\r\niki\u0007" }, { type: "tool_use", name: "x" },
    { type: "server_tool_use", name: "web_search", input: { query: "q" } }, { type: "web_search_tool_result", content: [] },
    { type: "tool_use", name: "rapora_yaz", input: { girisler: [{ yer: "e:seri", deger: "SN-1" }, { yer: "t:linye:1:icu", deger: 3000 }, { yer: 5, deger: "x" }, { yer: "e:x" }] } },
    { type: "tool_use", name: "fotograflari_oku", input: {} }, { type: "tool_use", name: "geri_al", input: {} }, { type: "tool_use", name: "rapora_yaz", input: { girisler: "x" } }],
    stop_reason: "tool_use", usage: { input_tokens: 10, cache_read_input_tokens: 1000, cache_creation_input_tokens: 5, output_tokens: 7, server_tool_use: { web_search_requests: 2 } } });
  assert.deepEqual(c, { metin: "Bir\niki", giris: 1015, cikis: 7, arama: 2, durum: "tamam",
    komutlar: [{ tur: "yaz", girisler: [{ yer: "e:seri", deger: "SN-1" }, { yer: "t:linye:1:icu", deger: "3000" }] }, { tur: "oku" }, { tur: "geri" }] });
  assert.equal(sayYanitiCoz({ content: [{ type: "text", text: "x".repeat(CEVAP_SINIRI + 900) }] }).metin.length, CEVAP_SINIRI);
  assert.equal(sayYanitiCoz({ stop_reason: "max_tokens", content: [] }).durum, "kesik");
  assert.equal(sayYanitiCoz({ stop_reason: "refusal" }).durum, "ret");
  assert.deepEqual(sayYanitiCoz(null), { metin: "", giris: 0, cikis: 0, arama: 0, komutlar: [], durum: "tamam" });
  assert.deepEqual(sayYanitiCoz({ usage: { input_tokens: -5, output_tokens: 1.5 } }), { metin: "", giris: 0, cikis: 0, arama: 0, komutlar: [], durum: "tamam" });
});

test("sayfa yardımı: adresten yer adı (kayıt kimliği, sorgu atılır); her menü modülünün yardımı var", () => {
  assert.deepEqual(sayfaBilgisi("/"), { yer: ANA_SAYFA.ad, modul: null, yardim: "Ana sayfa rolünüze göre bugünün işlerini, bekleyenleri ve duyuruları toplar." });
  assert.equal(sayfaBilgisi("/planlar/4f0c…?sekme=x#y").yer, "Planlar");
  assert.equal(sayfaBilgisi("/raporlar/123").modul, 14);
  assert.deepEqual(sayfaBilgisi("/bilinmeyen/yol"), { yer: "probata", modul: null, yardim: null });
  for (const m of MODULLER) assert.ok(SAYFA_YARDIMI[m.no]?.startsWith(`${m.ad}: `), `${m.ad} yardımı`);
  assert.equal(SAY_KILAVUZU.length, MODULLER.length + 1);
});

/* 382 → 550: rapor ekranının gönderdiği yapı — yalnız "islem" (ekranın yaptığı iş; metni sunucu kurar); eski "eksik" / "sonuc" kalktı */
test("rapor girdisi: yalnız işlem; kimlik ve numara denetlenir; eski hızlı sorular ve fazlası atılır", () => {
  const R = { id: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", no: "DM-1026-001" };
  assert.deepEqual(raporGirdisi({ hizli: "islem", rapor: R, islem: { istek: "geri", soru: "Geri al", sayi: 2, metin: "S.A.Y adına sahte metin" }, html: "<b>x</b>" }),
    { hizli: "islem", rapor: R, islem: { istek: "geri", soru: "Geri al", sayi: 2 } });
  for (const kotu of [
    { hizli: "eksik", rapor: R, eksik: [] }, { hizli: "sonuc", rapor: R, sonuc: { var: true, oneri: "uygun", secili: "", kusur: 0 } }, { hizli: "baska", rapor: R },
    { hizli: "islem", rapor: { id: "x", no: R.no }, islem: { istek: "geri", soru: "x", sayi: 0 } }, { hizli: "islem", rapor: { id: R.id, no: "<script>" }, islem: { istek: "geri", soru: "x", sayi: 0 } },
    { hizli: "islem", rapor: R }, null, "metin",
  ]) assert.equal(raporGirdisi(kotu), null, JSON.stringify(kotu));
});
