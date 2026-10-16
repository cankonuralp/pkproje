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
   komut olur (yalnız tanınan adlar, biçimiyle), arama sayılır; eski hızlı soruların ("eksik", "sonuc") girdisi kalktı.
   557 (sunum 557 · 2. tur — reisim 2026-10-14: "site dışı gereksiz sorulara da cevap veriyor, vermesin", "istek yapılmadan yapıldı dememesi …
   komut gelsin, yapılsın, doğruluğunu teyit et, yapıldıysa yapıldı de, yapılamadıysa sebebi ile yaz", "geçmiş sorularda takılı kalıyor"): talimatta
   reisim'in istediği İKİ kural (konu sınırı; iş akışı — sonucu görmeden "yaptım" demez); kullanıcının ardışık mesajları BİRLEŞMEZ (araya
   CEVAPSIZ); işin sonucu ikinci çağrıyla (araç kullanımı ve düşünme kapalı, araç bloğu + sonucu konuşmanın sonunda); çağrı düşerse sonucu sunucu
   sayılardan yazar (isSonucuMetni).
   2026-10-15 (pkproje §9 "S.A.Y CLAUDE GİBİ" — reisim: "yap işte yap dedim", "saçma sapan sınırlar koyma"): (A) işin sonucu döngünün devamı —
   S.A.Y yeniden araç çağırabilir (tool_choice yok), tek güvenlik aynı iş aynı girdiyle değişmeden yinelenince durmak; talimat "devam edeyim mi" demez;
   (B) yanıt / giriş / satır sınırları işe engel değil, ekranla sunucu aynı; (C) satir_ekle çağrısı biçimiyle, kimlikli komut; (D) aracı çağırmadan
   "yaptım" diyen cevap sahte sayılır, düzeltme turu. Olumsuz kanıt: tests/bozan/say-dongu.bozan.ts.
   2026-10-16 (S.A.Y 1. adım incelemesi — kasıtlı beklenti değişiklikleri, gerekçeleri yerinde): satir_ekle raporun tablo sınırında (TABLO_SATIR_EN_COK;
   5 000 satır açılabiliyordu, rapor kaydedilemiyordu); döngü turunun ayırması isteğin ölçülen boyundan, tabanı aşmadıkça ilk çağrıyla aynı
   (taban 100 000 fiyat eşiğinde olduğundan her tur ~3 kat ayırıyordu); tek güvenlik değişiklik yapmayan A, B, A, B yinelenmesini de görür; sahte
   "yaptım" denetimi yalnız istekte iş yapan araç varken. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ANA_SAYFA, MODULLER } from "../src/modules/moduller.ts";
import { raporGirdisi } from "../src/modules/say/server/say.ts";
import { SAY_KILAVUZU, SAYFA_YARDIMI, sayfaBilgisi } from "../src/modules/say/yardim.ts";
import { GIRIS_EN_COK, SATIR_EKLE_EN_COK as EKRAN_SATIR_EKLE_EN_COK } from "../src/modules/raporlar/say-doldur.ts";
import { maliyetHesapla } from "../src/server/yz/okuma.ts";
import { ARAMA_ARACI, CEVAP_SINIRI, CEVAPSIZ, DONGU_DURDU, donguTekrari, DUZELTME, duzeltmeIstegi, GECMIS_HARF, isAraciVar, isSonucuMetni, istekGirisi, isYapildi,
  KOMUT_GIRIS_EN_COK, komutBlogu, komutDenetle, KONU_DISI, konusma, RAPOR_ARACLARI, SAHTE_YEDEK, sahteYapildi, SATIR_EKLE_EN_COK, SAY_GECMIS, SAY_GIRIS_UST,
  SAY_YANIT_SINIRI, sayEnCokMaliyet, sayIstegi, saySistemi, sayYanitiCoz, SORU_SINIRI, toplamOzet, yapildiDiyor, type IsOzeti, type SayAdimi,
  type SayKomutu } from "../src/server/yz/say.ts";
import { TABLO_SATIR_EN_COK } from "../src/format/tanim.ts";

test("konuşma: kullanıcıyla başlar, roller sırayla, kullanıcının ardışıkları birleşmez (557), en yeniler (ileti ve karakter sınırı), sınırlar", () => {
  /* 557 (reisim: "geçmiş sorularda takılı kalıyor"): cevapsız kalan "A" yeni soruyla birleşmez — araya CEVAPSIZ; S.A.Y'ın ardışıkları birleşir */
  assert.deepEqual(konusma([{ kim: "say", metin: "Merhaba" }, { kim: "ben", metin: "A" }, { kim: "ben", metin: "B" }, { kim: "say", metin: "C" }, { kim: "say", metin: "C2" }], "D"), [
    { role: "user", content: "A" }, { role: "assistant", content: CEVAPSIZ }, { role: "user", content: "B" }, { role: "assistant", content: "C\n\nC2" }, { role: "user", content: "D" }]);
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
  /* 557: reisim'in istediği iki kural — konu sınırı (tek cümle) ve iş akışı; "her konuda" kalktı; yalnız son mesaj cevaplanır */
  assert.ok(t.includes(KONU_DISI) && !t.includes("her konuda"), "konu sınırı");
  assert.ok(t.includes("SON mesajını cevapla"), "son mesaj");
  assert.ok(t.includes("Sonucu görmeden") && t.includes("yazılamayan ve nedeni"), "iş akışı: sonuç görmeden yaptım yok");
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

/* 553 (reisim 2026-10-14: "konuşarak ilgili formatı yapabiliyo olalım"): format yapıcıdayken bağlamda format haritası ve modülün aracı
   (formati_duzenle); cevaptaki çağrı "format" komutu olur — işlemler nesne, sayı ve boy sınırlı (anlamı ekran denetler) */
test("553 format: harita bağlamda, araç yalnız haritayla; formati_duzenle çağrısı format komutu (nesneler, sınırlı)", async () => {
  const { FORMAT_ARACI } = await import("../src/modules/rapor-format/say-kurucu.ts");
  const g = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "Ekipman türleri", yardim: null, bekleyen: [], format: "FORMAT HARİTASI" }, gecmis: [], soru: "x",
    formatAraci: [FORMAT_ARACI] }).govde as { system: { text: string }[]; tools: { name: string }[] };
  assert.ok(g.system[1].text.includes("Açık format taslağı (format yapıcıda, kaydedilmemiş değişiklikler dahil):\nFORMAT HARİTASI"));
  assert.deepEqual(g.tools.map((t) => t.name), ["formati_duzenle", "web_search"]);
  const yok = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "Planlar", yardim: null, bekleyen: [] }, gecmis: [], soru: "x", formatAraci: [FORMAT_ARACI] }).govde as { tools: { name: string }[] };
  assert.deepEqual(yok.tools.map((t) => t.name), ["web_search"], "harita yoksa format aracı gitmez");
  const c = sayYanitiCoz({ content: [{ type: "tool_use", name: "formati_duzenle", input: { islemler: [{ islem: "oge_ekle", bolum: "linye", ad: "RCa", formul: "480/RCd" }, "x", [1], { islem: "y".repeat(5000) }] } }] });
  assert.deepEqual(c.komutlar, [{ tur: "format", islemler: [{ islem: "oge_ekle", bolum: "linye", ad: "RCa", formul: "480/RCd" }] }]);
});

/* 557 → 2026-10-15 (A — pkproje §9 "S.A.Y CLAUDE GİBİ"; reisim: "sik sik duruyor tekrar tekrar soruyor", "yap işte yap dedim"; kasıtlı beklenti
   değişikliği): işin sonucu artık DÖNGÜNÜN devamı — eski beklenti "ikinci çağrıda araç kullanımı kapalı (tool_choice none), arama yok, harita gitmez"
   idi; S.A.Y sonucu görünce bir daha araç çağıramadığı için "kalanları da ekleyeyim mi?" diye soruyordu. Yeni: adımlar konuşmanın sonunda (araç
   bloğu + sonucu, hizmetin kimliğiyle), düşünme kapalı, tool_choice YOK (auto), araçlar ve arama durur, bağlam (harita) her turda; yalnız aynı iş
   aynı girdiyle hiçbir şey değiştirmeden yinelenirse tool_choice none + "döngü durdu" notu. Çağrı düşerse sonucu sunucu yazar (557 aynı). */
test("A iş döngüsü: adımlar konuşmanın sonunda, düşünme kapalı, araç kullanımı AÇIK (tur sınırı yok); yalnız aynı iş değişmeden yinelenince durur", async () => {
  const { FORMAT_ARACI } = await import("../src/modules/rapor-format/say-kurucu.ts");
  const ozet = (yazildi: number, ek: Partial<IsOzeti> = {}): IsOzeti => ({ yazildi, ayni: 0, bekliyor: 0, yapilan: [], yazilamadi: [], ...ek });
  const yaz: SayKomutu = { tur: "yaz", girisler: [], satirlar: [{ tablo: "linye", adet: 20, degerler: {}, sira: { sutun: "no" } }], id: "toolu_1" };
  const adimlar: SayAdimi[][] = [[{ komut: yaz, ozet: ozet(0, { satir: 20, yapilan: ["Linye · 20 satır eklendi (1–20. satır)"] }) }],
    [{ komut: { ...yaz, id: "toolu_2" }, ozet: ozet(0, { satir: 20 }) }, { komut: { tur: "geri", id: "toolu_3" }, ozet: ozet(1) }]];
  const g = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "Rapor X", yardim: null, bekleyen: [], rapor: "HARİTA" }, gecmis: [{ kim: "ben", metin: "eski" }],
    soru: "linye tablosuna 50 satır ekle", adimlar }).govde as { messages: { role: string; content: unknown }[]; tools: { name: string }[]; tool_choice?: unknown; thinking: unknown; system: { text: string }[] };
  assert.equal(g.tool_choice, undefined, "S.A.Y yeniden araç çağırabilir (auto) — döngü tek tura düşmez");
  assert.deepEqual(g.thinking, { type: "disabled" });
  assert.deepEqual(g.tools.map((t) => t.name), ["rapora_yaz", "fotograflari_oku", "geri_al", "web_search"]);
  assert.ok(g.system[1].text.includes("Açık rapor (kullanıcının şu an yazdığı"), "bağlam her turda (güncel harita)");
  assert.deepEqual(g.messages.slice(-5).map((m) => m.role), ["user", "assistant", "user", "assistant", "user"]);
  assert.deepEqual(g.messages.at(-5), { role: "user", content: "linye tablosuna 50 satır ekle" });
  assert.deepEqual(g.messages.at(-4), { role: "assistant", content: [{ type: "tool_use", id: "toolu_1", name: "rapora_yaz",
    input: { girisler: [], satir_ekle: [{ tablo: "linye", adet: 20, degerler: {}, sira: { sutun: "no" } }] } }] });
  const sonuc = g.messages.at(-1)!.content as { type: string; tool_use_id: string; content: string }[];
  assert.deepEqual(sonuc.map((x) => [x.type, x.tool_use_id]), [["tool_result", "toolu_2"], ["tool_result", "toolu_3"]]);
  assert.deepEqual(JSON.parse(sonuc[0].content), { yazilan: 0, zaten_oyle: 0, eklenen_satir: 20, yazilamayan: [] });
  assert.ok(!sonuc[1].content.includes(DONGU_DURDU));
  /* kimliksiz / tekrar eden kimlik: istek içinde tekil */
  const t = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "x", yardim: null, bekleyen: [] }, gecmis: [], soru: "s",
    adimlar: [[{ komut: { tur: "oku" }, ozet: ozet(0) }], [{ komut: { tur: "oku" }, ozet: ozet(0) }, { komut: { tur: "geri", id: "say_2_1" }, ozet: ozet(0) }]] }).govde as { messages: { content: unknown }[] };
  const kimlikler = t.messages.flatMap((m) => (Array.isArray(m.content) ? (m.content as { id?: string }[]).flatMap((b) => (b.id ? [b.id] : [])) : []));
  assert.equal(kimlikler.length, 3);
  assert.equal(new Set(kimlikler).size, kimlikler.length, kimlikler.join(","));
  /* format: araç tanımı konuşmadaki çağrı için durur; arama da */
  const f = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "x", yardim: null, bekleyen: [] }, gecmis: [], soru: "s", formatAraci: [FORMAT_ARACI],
    adimlar: [[{ komut: { tur: "format", islemler: [{ islem: "x" }] }, ozet: ozet(1) }]] }).govde as { tools: { name: string }[]; tool_choice?: unknown };
  assert.deepEqual([f.tools.map((x) => x.name), f.tool_choice], [["formati_duzenle", "web_search"], undefined]);
  /* tek güvenlik: aynı iş aynı girdiyle, hiçbir şey değişmedi → tool_choice none + not (kullanıcıya görünen bir sınır değil) */
  const ayni: SayAdimi[][] = [[{ komut: { tur: "geri", id: "a" }, ozet: ozet(0) }], [{ komut: { tur: "geri", id: "b" }, ozet: ozet(0) }]];
  assert.equal(donguTekrari(ayni), true);
  const d = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "x", yardim: null, bekleyen: [] }, gecmis: [], soru: "s", adimlar: ayni, durdur: true }).govde as
    { tool_choice: unknown; messages: { content: unknown }[] };
  assert.deepEqual(d.tool_choice, { type: "none" });
  assert.ok(String((d.messages.at(-1)!.content as { content?: string }[]).at(-1)?.content).endsWith(DONGU_DURDU));
  /* değişiklik yaptığı sürece aynı çağrı yinelenebilir (20'şer satır); tek adım; farklı girdi → durmaz */
  assert.equal(donguTekrari(adimlar.slice(0, 1)), false);
  assert.equal(donguTekrari([adimlar[0], [{ komut: { ...yaz, id: "x" }, ozet: ozet(0, { satir: 20 }) }]]), false, "20 satır eklendi — sürer");
  assert.equal(donguTekrari([adimlar[0], [{ komut: { ...yaz, satirlar: [{ tablo: "linye", adet: 10, degerler: {} }] }, ozet: ozet(0) }]]), false, "girdi farklı");
  assert.equal(donguTekrari([[{ komut: yaz, ozet: ozet(0, { satir: 20 }) }], [{ komut: yaz, ozet: ozet(0) }]]), true, "aynı girdi, eklenen yok — durur");
  /* 2026-10-16: değişiklik yapmayan iki ayrı çağrı sırayla yinelenince (A, B, A, B) — art arda olmasalar da durur; değişiklik yapan yineleme sürer */
  const A1: SayKomutu = { tur: "yaz", girisler: [{ yer: "t:linye:1:akim", deger: "1" }] }, B1: SayKomutu = { tur: "yaz", girisler: [{ yer: "t:linye:1:akim", deger: "bir" }] };
  const yok = (k: SayKomutu, id: string): SayAdimi[] => [{ komut: { ...k, id }, ozet: ozet(0, { yazilamadi: [{ ad: "In", neden: "sayı olmalı" }] }) }];
  assert.equal(donguTekrari([yok(A1, "a"), yok(B1, "b")]), false, "iki farklı deneme — sürer");
  assert.equal(donguTekrari([yok(A1, "a"), yok(B1, "b"), yok(A1, "c")]), true, "A, B, A: A daha önce değişikliksizdi — durur");
  assert.equal(donguTekrari([[{ komut: A1, ozet: ozet(1) }], yok(B1, "b"), yok(A1, "c")]), false, "A önce değişiklik yaptıydı, art arda değil — sürer");
  assert.equal(donguTekrari([yok(A1, "a"), yok(B1, "b"), [{ komut: A1, ozet: ozet(1) }]]), false, "son adım değişiklik yaptı — sürer");
  /* toplam ve "iş yapıldı mı" (D) */
  assert.deepEqual(toplamOzet(adimlar), { yazildi: 1, ayni: 0, bekliyor: 0, satir: 40, yapilan: ["Linye · 20 satır eklendi (1–20. satır)"], yazilamadi: [] });
  assert.equal(isYapildi(adimlar), true);
  assert.equal(isYapildi(ayni), false);
  /* ilk çağrıda bunlar yok (düşünme açık, araç seçimi verilmez) */
  const ilk = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "x", yardim: null, bekleyen: [] }, gecmis: [], soru: "s" }).govde as Record<string, unknown>;
  assert.ok(!("tool_choice" in ilk) && !("thinking" in ilk));
  /* yedek cevap: yalnız sayılar ve nedenler */
  assert.equal(isSonucuMetni({ yazildi: 144, ayni: 2, bekliyor: 0, yapilan: [], yazilamadi: [] }), "Yaptım: 144 giriş rapora yazıldı.\n2 giriş zaten öyleydi.");
  assert.equal(isSonucuMetni({ yazildi: 0, ayni: 0, bekliyor: 0, yapilan: [], yazilamadi: [{ ad: "SGK", neden: "bu formatta kilitli; elle de değiştirilemiyor" }] }),
    "Yapamadım:\n- SGK: bu formatta kilitli; elle de değiştirilemiyor");
  assert.equal(isSonucuMetni({ yazildi: 1, ayni: 0, bekliyor: 0, yapilan: ["RCa sütunu eklendi"], yazilamadi: [{ ad: "x", neden: "y" }] }), "Yaptım:\n- RCa sütunu eklendi\nYapamadıklarım:\n- x: y");
  assert.equal(isSonucuMetni({ yazildi: 0, ayni: 0, bekliyor: 0, yapilan: [], yazilamadi: [] }), "Bir değişiklik olmadı.");
});

/* 2026-10-15 (A + B + C): talimat "devam edeyim mi" demez; sınırlar işe engel değil; araç çağrıları kimlikleriyle komut, satir_ekle biçimiyle; ekranın
   geri gönderdiği komut aynı denetimden geçer */
test("A talimat · B sınırlar · C satir_ekle çağrısı: kimlikli komut, biçim denetimi; ekranın geri gönderdiği komut aynı denetimden", () => {
  const t = saySistemi(SAY_KILAVUZU);
  assert.ok(t.includes("İş bitene kadar araç çağırmayı sürdür; kullanıcıya devam edeyim mi diye sorma. Yalnız bilgi gerçekten eksikse sor."));
  assert.ok(!t.includes("Cevabını yalnız bu sonuçla yaz"), "tek turluk ifade kalktı");
  /* B: 8 000 / 300 / 100 → işe engel olmayacak kadar; ekranla sunucu aynı */
  assert.ok(SAY_YANIT_SINIRI >= 32_000, String(SAY_YANIT_SINIRI));
  assert.ok(KOMUT_GIRIS_EN_COK >= 5_000);
  /* 2026-10-16 (kasıtlı beklenti değişikliği — eskisi "SATIR_EKLE_EN_COK >= 5 000"): satır sayısı raporun kendi tablo sınırı (Cevaplar.tablo);
     5 000 satır açılabiliyordu, 300'ün üstündeki rapor kaydedilemiyordu */
  assert.equal(SATIR_EKLE_EN_COK, TABLO_SATIR_EN_COK);
  assert.equal(KOMUT_GIRIS_EN_COK, GIRIS_EN_COK);
  assert.equal(SATIR_EKLE_EN_COK, EKRAN_SATIR_EKLE_EN_COK);
  assert.ok(sayEnCokMaliyet("haiku") >= maliyetHesapla("haiku", 100_000, SAY_YANIT_SINIRI), "ayırma yanıt sınırıyla tutarlı");
  /* 2026-10-16 (kasıtlı beklenti değişikliği — eskisi "50 000 ek giriş ayırmayı büyütür": tahmin sabit tabanın ÜSTÜNE ekleniyordu; taban fiyat
     eşiğinde olduğundan her döngü turu üst fiyata çıkıp ~3 kat ayırıyordu): üçüncü değer isteğin ölçülen giriş tahmini — tabanı aşmadıkça ilk
     çağrıyla aynı fiyat diliminde; aşınca büyür */
  assert.equal(sayEnCokMaliyet("haiku", 0, 5_000), sayEnCokMaliyet("haiku"), "küçük döngü turu ilk çağrıyla aynı ayırma");
  assert.equal(sayEnCokMaliyet("haiku", 0, SAY_GIRIS_UST), sayEnCokMaliyet("haiku"));
  assert.ok(sayEnCokMaliyet("haiku", 0, 150_000) > sayEnCokMaliyet("haiku"), "isteğin boyu tabanı aşınca ayırma büyür");
  assert.ok(sayEnCokMaliyet("haiku", 0, 150_000) >= maliyetHesapla("haiku", 150_000, SAY_YANIT_SINIRI));
  /* isteğin boyu: ölçülür (JSON / 2), eklerin baytları sayılmaz — ekler sayısıyla girer */
  const kucuk = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "x", yardim: null, bekleyen: [] }, gecmis: [], soru: "s" }).govde;
  const ekli = sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "x", yardim: null, bekleyen: [] }, gecmis: [], soru: "s",
    ekler: [{ tur: "jpeg", bayt: new Uint8Array(600_000) }] }).govde;
  assert.ok(istekGirisi(kucuk) > 100 && istekGirisi(kucuk) < SAY_GIRIS_UST, String(istekGirisi(kucuk)));
  assert.ok(istekGirisi(ekli) < istekGirisi(kucuk) + 1_000, "fotoğrafın baytları tahmine girmez");
  assert.ok(sayEnCokMaliyet("haiku", 1, istekGirisi(ekli)) > sayEnCokMaliyet("haiku"), "ek sayısıyla ayırma büyür");
  const yaz = RAPOR_ARACLARI[0] as unknown as { input_schema: { properties: Record<string, { maxItems?: number }> } };
  assert.equal(yaz.input_schema.properties.girisler.maxItems, KOMUT_GIRIS_EN_COK);
  assert.ok(yaz.input_schema.properties.satir_ekle, "satir_ekle aracın şemasında");
  const c = sayYanitiCoz({ content: [
    { type: "tool_use", id: "toolu_01A", name: "rapora_yaz", input: { satir_ekle: [{ tablo: "linye", adet: 50, degerler: { tip: "B", akim: 16 }, sira: { sutun: "no", baslangic: "1", onek: "F" } },
      { tablo: "", adet: 3 }, { tablo: "x", adet: 0 }, "bozuk"] } },
    { type: "tool_use", id: "kimlik geçersiz!", name: "geri_al", input: {} }], stop_reason: "tool_use" });
  assert.deepEqual(c.komutlar, [{ tur: "yaz", id: "toolu_01A", girisler: [], satirlar: [{ tablo: "linye", adet: 50, degerler: { tip: "B", akim: "16" }, sira: { sutun: "no", baslangic: 1, onek: "F" } }] },
    { tur: "geri" }]);
  assert.deepEqual(komutDenetle(c.komutlar[0]), c.komutlar[0], "ekranın geri gönderdiği komut aynı biçimde");
  for (const kotu of [null, "x", { tur: "sil" }, { tur: "yaz", girisler: "x" }, { tur: "format", islemler: [] }]) assert.equal(komutDenetle(kotu), null, JSON.stringify(kotu));
  assert.deepEqual(komutBlogu(c.komutlar[0]).input, { girisler: [], satir_ekle: [{ tablo: "linye", adet: 50, degerler: { tip: "B", akim: "16" }, sira: { sutun: "no", baslangic: 1, onek: "F" } }] });
});

/* 2026-10-15 (D — bir cevapta S.A.Y aracı çağırmadan "Yaptım" dedi; reisim "yap işte yap dedim"): yapılmış iş söyleyen Türkçe kalıplar saf bir
   işlevde; araç çağrısı yoksa ve bu mesajın işinde yapılan bir şey yoksa cevap sahte sayılır, düzeltme turu konuşmaya eklenir */
test("D sahte \"yaptım\": kalıplar; araç çağrısı ya da yapılmış iş varsa sahte değil; düzeltme turu", () => {
  for (const m of ["Yaptım.", "50 satırı ekledim", "Seri no alanına **yazdım**.", "Maddeleri işaretledim ve sonucu değiştirdim.", "Tamam, giriyorum.", "Raporu kaydettim",
    "Hepsini doldurduk!", "yaptim", "EKLEDİM", "Formatı güncelledim; tabloyu sildim."]) assert.equal(yapildiDiyor(m), true, m);
  for (const m of ["Yapamadım: SGK kilitli.", "Ekleyemedim çünkü tablo yok.", "Hangi değeri yazayım?", "Raporu okudum.", "İnternette aradım ve buldum.",
    "Hesapladım: 480 / 2 = 240.", "Satır eklendi mi kontrol edin.", "Plan tamamlandı.", "Ekledim mi?", "Rapor onaylandı; müşteriye açıldı.", "Bu alanı siz doldurun.", ""]) {
    assert.equal(yapildiDiyor(m), false, m);
  }
  const metin = (text: string, ek: object[] = []) => ({ content: [{ type: "text", text }, ...ek], stop_reason: ek.length ? "tool_use" : "end_turn" });
  assert.equal(sahteYapildi(metin("Ekledim."), false), true, "araçsız \"ekledim\" — sahte");
  assert.equal(sahteYapildi(metin("Ekledim.", [{ type: "tool_use", id: "t", name: "rapora_yaz", input: {} }]), false), false, "araç çağrısı var");
  assert.equal(sahteYapildi(metin("Yaptım: 50 satır eklendi."), true), false, "bu mesajın işinde yapılan var");
  assert.equal(sahteYapildi(metin("Bunu yapamadım."), false), false);
  assert.equal(sahteYapildi({ ...metin("Ekledim"), stop_reason: "refusal" }, false), false);
  const istek = { govde: { model: "m", messages: [{ role: "user", content: "50 satır ekle" }] } };
  const d = duzeltmeIstegi(istek, metin("Ekledim.")).govde as { messages: { role: string; content: string }[]; model: string };
  assert.deepEqual(d.messages, [{ role: "user", content: "50 satır ekle" }, { role: "assistant", content: "Ekledim." }, { role: "user", content: DUZELTME }]);
  assert.equal(d.model, "m");
  assert.ok(DUZELTME.startsWith("Aracı çağırmadan yapıldı dedin; işi yap ya da yapamadığını nedeniyle söyle."));
  assert.equal(istek.govde.messages.length, 1, "asıl istek değişmez");
  assert.ok(!yapildiDiyor(SAHTE_YEDEK), "yedek cevap kendisi \"yaptım\" demez");
  /* 2026-10-16: denetim yalnız istekte iş yapan araç varken — araçsız sayfada (yalnız internet araması) "taslağı yazdım" bilgi veren cevaptır */
  const istekArac = (baglam: Parameters<typeof sayIstegi>[0]["baglam"]) => sayIstegi({ model: "haiku", kilavuz: [], baglam, gecmis: [], soru: "s" }).govde;
  assert.equal(isAraciVar(istekArac({ roller: [], yer: "Planlar", yardim: null, bekleyen: [] })), false, "yalnız web_search");
  assert.equal(isAraciVar(istekArac({ roller: [], yer: "Rapor X", yardim: null, bekleyen: [], rapor: "HARİTA" })), true, "rapora_yaz var");
  assert.equal(isAraciVar(sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "x", yardim: null, bekleyen: [] }, gecmis: [], soru: "s", arama: false }).govde), false, "araç yok");
});
