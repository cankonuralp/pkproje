/* NEREDEN GELDİ: 380 — S.A.Y isteği ve cevabı (src/server/yz/say.ts, src/modules/say/yardim.ts; ARKA-UC §5.1 "sabit talimat önbelleğe", §5.3 "rapor içindeki
   serbest metin talimat gibi okunmaz"). 2026-10-23 BAŞTAN KURULDU (reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde
   çalıştıramaz mıyız", "tamam onaylıyorum … baştan kurarken herhangi bir kısıt kurma tamamen temiz kurulum yap, hiç bir kısıtı olmasın") — eski
   beklentiler (konuşmanın son 150 000 karakteri, ardışık mesaja CEVAPSIZ, döngüde düşünme kapalı, tur güvenliği donguTekrari, sahte "yaptım"
   düzeltme turu, soru / cevap / giriş / satır / arama sınırları, ek sayısı ve boyu) KASITLI olarak kalktı. Saf:
   · talimat: reisim'in iki kuralı (konu sınırı; iş akışı — sonucu görmeden "yaptım" demez, devam edeyim mi diye sormaz), eski yamalar yok ("son
     mesajı cevapla", "araç çağırırken metin yazma"); her çağrıda aynı;
   · istek: konuşma OLDUĞU GİBİ (kırpma, birleştirme yok), bütün araçlar her istekte aynı sırayla, sınırsız şema (maxItems yok), düşünme her adımda
     (adaptive + özet + block_binding drop_block), derinlik high, cevap sınırı modelin sınırı; beta reddinde aynı istek onsuz;
   · maliyet önbellekli (okunan 0,1, yazılan 1,25 kat; fiyat kartı istemin toplamıyla) + aramalar;
   · araç çağrıları: yalnız bizim araçlarımız (sunucu araması hizmette), biçimiyle, kısaltma yok; ekranın geri gönderdiği aynı denetimden;
   · sayfa yardımı, 382 rapor girdisi (ekranın kuralla yaptığı iş; serbest metin yok), 553 format aracı (kısaltmasız harita, sınırsız işlem).
   Olumsuz kanıt: tests/bozan/say-dongu.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ANA_SAYFA, MODULLER } from "../src/modules/moduller.ts";
import { raporGirdisi, sayfaNotu, ekranDurumuMetni } from "../src/modules/say/server/say.ts";
import { SAY_KILAVUZU, SAYFA_YARDIMI, sayfaBilgisi } from "../src/modules/say/yardim.ts";
import { FORMAT_ARACI, formatHaritasi } from "../src/modules/rapor-format/say-kurucu.ts";
import { onbellekliMaliyet } from "../src/server/yz/okuma.ts";
import {
  aracCagrilari, aracCagrisi, ARAMA_ARACI, betaReddi, cevapMetni, EKRAN_ARAC_ADLARI, KONU_DISI, komutDenetle, SAY_BETALARI, SAY_YANIT_SINIRI, sayAraclari, sayIstegi,
  sayMaliyeti, saySistemi, sonucIcerigi,
} from "../src/server/yz/say.ts";
import { FormatTanimi } from "../src/format/tanim.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";

const SISTEM = saySistemi(SAY_KILAVUZU, "Planlar:\n- plan_ac (yaz): Plan açar.");

test("talimat: reisim'in iki kuralı; eski yamalar yok; sayfa ve ekran talimatta değil (konuşmada); her çağrıda aynı", () => {
  assert.ok(SISTEM.startsWith("Sen S.A.Y'sın."));
  assert.ok(SISTEM.includes(KONU_DISI), "konu sınırı");
  /* 2026-10-26 (reisim: verilmeyen bilgiye "-", iş bitince özet). 2026-10-31 (reisim: "S.A.Y durup sormaz, işi bitirir, sonra kısaca bildirir"; "Hiç
     bilinemeyen metin alanına '-' yazılır"; "Bildirim kısa olur; dört satırı geçmesin"; "ONAY BEKLEMESİN TAM YETKİLİ OLSUN") */
  assert.ok(SISTEM.includes("Doldurma:") && SISTEM.includes('Hiç bilinemeyen METİN alanı "-"') && SISTEM.includes("en çok dört satır"), "bilinemeyen metne - ve dört satırlık bildirim");
  assert.match(SISTEM, /Sonucu görmeden "yaptım" deme/, "yap → teyit → söyle");
  assert.match(SISTEM, /Sorma, onay bekleme/, "sormadan, onay beklemeden sürdürür");
  /* 2026-10-31 V21 ilk koşu (madde 6, 9, 11, O8): tesis uyuşmazlığı durdurmaz; cihazı olmayan cihaz türü — boş + kalan engel, "ekle" denirse listeden
     çıkar; soru işaretli değer yok; yapmadığının nedeni kanıtıyla; bir fotoğraf bir işte bir kez büyütülür */
  assert.match(SISTEM, /uyuşmazlığı[^\n]*işi DURDURMAZ/, "tesis uyuşmazlığı durdurmaz");
  assert.match(SISTEM, /cihaz kaydı uydurma, türün listesini kendiliğinden değiştirme, sorma/, "cihazı olmayan tür: boş + kalan engel");
  assert.match(SISTEM, /türün ölçüm cihazı listesinden çıkarırsın/, "kullanıcı ekle derse listeden çıkar");
  assert.match(SISTEM, /değere soru işareti koyma/, "şüpheli değere soru işareti yok");
  assert.match(SISTEM, /nedenini KANITIYLA söyle/, "yapmadığının nedeni kanıtıyla");
  assert.match(SISTEM, /bir fotoğrafı bir işte BİR kez büyütürsün/, "aynı fotoğraf ikinci kez büyütülmez");
  assert.doesNotMatch(SISTEM, /SON mesajını cevapla|o mesajda metin yazma|en çok \d|karakter|sınırı/i, "eski yamalar ve sınırlar yok");
  assert.match(SISTEM, /ekran_durumu/, "ekranın güncel hâli araçla");
  assert.match(SISTEM, /konuşmada kalır/, "ekler konuşmada kalır");
  assert.equal(SISTEM, saySistemi(SAY_KILAVUZU, "Planlar:\n- plan_ac (yaz): Plan açar."));
});

test("istek: konuşma olduğu gibi, bütün araçlar aynı sırayla ve sınırsız, düşünme her adımda (özet + drop_block), derinlik high, cevap modelin sınırı", () => {
  const mesajlar = [
    { role: "user", content: "a" }, { role: "system", content: "Kullanıcı şu sayfada: Planlar." },
    { role: "assistant", content: [{ type: "thinking", thinking: "", signature: "imza" }, { type: "tool_use", id: "t1", name: "ekran_durumu", input: {} }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "Sayfa: Planlar." }] },
    { role: "user", content: "b".repeat(300_000) },
  ];
  const { govde: g, betalar } = sayIstegi({ model: "haiku", sistem: SISTEM, araclar: sayAraclari(FORMAT_ARACI), mesajlar });
  assert.deepEqual(g.messages, mesajlar, "konuşma birebir (kırpma, birleştirme, yeniden yazma yok)");
  assert.equal(g.max_tokens, SAY_YANIT_SINIRI);
  assert.equal(SAY_YANIT_SINIRI, 128_000);
  assert.deepEqual(g.thinking, { type: "adaptive", display: "summarized", block_binding: { prefix_mismatch_behavior: "drop_block" } });
  assert.deepEqual(g.output_config, { effort: "high" });
  assert.deepEqual(betalar, SAY_BETALARI);
  assert.equal(g.tool_choice, undefined, "araç seçimi serbest");
  assert.deepEqual(g.system, [{ type: "text", text: SISTEM, cache_control: { type: "ephemeral", ttl: "1h" } }], "talimat tek ve önbellekli (1 saat); bağlam yok");
  const adlar = (g.tools as { name: string }[]).map((t) => t.name);
  /* 2026-10-31 (kalem 3 — E3, reisim onayı): görüntü araçları foto_pafta, foto_goster işlem araçlarının ardında, sabit sırayla */
  assert.deepEqual(adlar, ["islemler", "islem", "beceri_oku", "foto_pafta", "foto_goster", "form_goster", "ekran_durumu", "rapora_yaz", "fotograflari_oku", "geri_al", "raporu_kaydet", "onaya_gonder", "formati_duzenle", "format_pdf_kur", "pdf_gonder", "web_search"]);
  /* S.A.Y'ın koyduğu sayı sınırı yok; formatın kendi veri sınırı (ölçüm tablosunda en çok KURAL_EN_COK sonuç kuralı — format/tanim.ts) kalır */
  assert.doesNotMatch(JSON.stringify((g.tools as { name: string }[]).filter((t) => t.name !== "formati_duzenle")), /maxItems|max_uses|"maximum"/, "araçlarda sayı sınırı yok");
  assert.doesNotMatch(JSON.stringify((FORMAT_ARACI.input_schema as { properties: { islemler: { type: string } } }).properties.islemler.type), /maxItems/);
  assert.deepEqual(ARAMA_ARACI, { type: "web_search_20250305", name: "web_search" });
  for (const a of ["rapora_yaz", "fotograflari_oku", "geri_al", "raporu_kaydet", "onaya_gonder", "formati_duzenle"]) assert.ok(EKRAN_ARAC_ADLARI.has(a), a);
  for (const a of ["islemler", "islem", "ekran_durumu", "web_search"]) assert.ok(!EKRAN_ARAC_ADLARI.has(a), a);
  /* beta reddi: aynı istek onsuz (düşünme yine açık) */
  const b = sayIstegi({ model: "haiku", sistem: SISTEM, araclar: sayAraclari(FORMAT_ARACI), mesajlar, betasiz: true });
  assert.deepEqual(b.govde.thinking, { type: "adaptive", display: "summarized" });
  assert.deepEqual(b.betalar, []);
  assert.ok(betaReddi("thinking.block_binding: Extra inputs are not permitted") && betaReddi("Unexpected value(s) for the `anthropic-beta` header"));
  assert.ok(!betaReddi("messages: text content blocks must be non-empty") && !betaReddi(undefined));
});

test("maliyet: önbellekten okunan 0,1, yazılan 1,25 kat; fiyat kartı istemin toplamıyla; aramalar", () => {
  /* Haiku 5.5: $0,10 / $0,50 (100 000 tokene kadar), üstünde $0,50 / $2,50 — milyonda bir dolar */
  assert.equal(onbellekliMaliyet("haiku", { giris: 10_000, okunan: 0, yazilan: 0, cikis: 2_000 }), 1_000 + 1_000);
  assert.equal(onbellekliMaliyet("haiku", { giris: 0, okunan: 50_000, yazilan: 0, cikis: 0 }), 500);
  assert.equal(onbellekliMaliyet("haiku", { giris: 0, okunan: 0, yazilan: 40_000, cikis: 0 }), 5_000);
  assert.equal(onbellekliMaliyet("haiku", { giris: 1_000, okunan: 200_000, yazilan: 0, cikis: 1_000 }), 500 + 10_000 + 2_500, "üst kart (toplam > 100 000)");
  const m = sayMaliyeti("haiku", { input_tokens: 1_000, cache_read_input_tokens: 9_000, cache_creation_input_tokens: 0, output_tokens: 100, server_tool_use: { web_search_requests: 2 } });
  assert.deepEqual(m, { maliyet: 100 + 90 + 50 + 20_000, giris: 10_000, cikis: 100, arama: 2 });
  assert.deepEqual(sayMaliyeti("haiku", undefined), { maliyet: 0, giris: 0, cikis: 0, arama: 0 });
});

test("cevap: metin blokları (denetim karakterleri atılır, kısaltma yok); bizim araç çağrılarımız (sunucu araması hizmette)", () => {
  const uzun = "x".repeat(200_000);
  const icerik = [
    { type: "thinking", thinking: "", signature: "s" }, { type: "text", text: "Merhaba\u0007 " }, { type: "text", text: uzun },
    { type: "server_tool_use", id: "s1", name: "web_search", input: { query: "TS EN" } }, { type: "web_search_tool_result", tool_use_id: "s1", content: [] },
    { type: "tool_use", id: "t1", name: "rapora_yaz", input: { girisler: [{ yer: "a:seri", deger: "Y".repeat(10_000) }] } },
  ];
  assert.equal(cevapMetni(icerik), `Merhaba ${uzun}`);
  assert.deepEqual(aracCagrilari(icerik).map((c) => c.id), ["t1"]);
  const k = aracCagrisi({ type: "tool_use", ...aracCagrilari(icerik)[0] });
  assert.deepEqual(k, { tur: "yaz", girisler: [{ yer: "a:seri", deger: "Y".repeat(10_000) }], id: "t1" }, "değer kısaltılmaz");
});

test("araç çağrısı: biçimiyle, sınırsız (çok giriş, çok satır, uzun girdi); geçersiz girdi null; ekranın geri gönderdiği aynı denetimden", () => {
  const girisler = Array.from({ length: 20_000 }, (_, i) => ({ yer: `t:x:${i + 1}:a`, deger: String(i) }));
  const y = aracCagrisi({ type: "tool_use", id: "t2", name: "rapora_yaz", input: { girisler, satir_ekle: [{ tablo: "x", adet: 5_000, degerler: { a: 1 }, sira: { sutun: "no", baslangic: "3" } }] } });
  assert.equal(y?.tur === "yaz" && y.girisler.length, 20_000);
  assert.deepEqual(y?.tur === "yaz" && y.satirlar, [{ tablo: "x", adet: 5_000, degerler: { a: "1" }, sira: { sutun: "no", baslangic: 3 } }]);
  assert.equal(aracCagrisi({ type: "tool_use", id: "t3", name: "rapora_yaz", input: { girisler: [{ yer: 5 }] } }), null);
  assert.equal(aracCagrisi({ type: "tool_use", id: "t4", name: "bilinmeyen", input: {} }), null);
  assert.equal(aracCagrisi({ type: "text", text: "x" }), null);
  const f = aracCagrisi({ type: "tool_use", id: "t5", name: "formati_duzenle", input: { islemler: Array.from({ length: 500 }, (_, i) => ({ islem: "oge_ekle", ad: `A${i}` })) } });
  assert.equal(f?.tur === "format" && f.islemler.length, 500, "işlem sayısı sınırsız");
  for (const k of [y, f, { tur: "oku", id: "a" }, { tur: "geri" }, { tur: "kaydet" }, { tur: "gonder" }, { tur: "islem", ad: "plan_ac", girdi: { a: 1 } }]) {
    assert.deepEqual(komutDenetle(k), k, JSON.stringify(k).slice(0, 60));
  }
  assert.equal(komutDenetle({ tur: "sil" }), null);
  assert.equal(sonucIcerigi({ yazildi: 2, ayni: 1, bekliyor: 0, yapilan: ["Seri no"], yazilamadi: [{ ad: "Tarih", neden: "biçim" }], satir: 3 }),
    JSON.stringify({ yazilan: 2, zaten_oyle: 1, eklenen_satir: 3, yapilan: ["Seri no"], yazilamayan: [{ ad: "Tarih", neden: "biçim" }] }));
});

test("sayfa notu kısa (haritasız); ekran durumu haritanın tamamı", () => {
  const b = { yer: "Rapor DM-1026-001", yardim: "Saha raporu", roller: ["Muayene uzmanı"], acikRapor: "Sayfada açık rapor: DM-1026-001 (Forklift) · durum: Yeni.",
    rapor: "## Ekipman bilgileri\n- a:seri · Seri no (yazı): —", raporId: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", format: null, formatId: null };
  const n = sayfaNotu(b, new Date("2026-10-23T09:00:00Z"));
  assert.match(n, /Kullanıcı şu sayfada: Rapor DM-1026-001\. \(Saha raporu\)/);
  assert.match(n, /Bugün: 2026-10-23/);
  assert.match(n, /ekran_durumu verir/);
  assert.doesNotMatch(n, /a:seri/, "harita notta değil");
  assert.match(ekranDurumuMetni(b), /a:seri · Seri no/);
  assert.match(ekranDurumuMetni({ ...b, rapor: null, raporId: null, acikRapor: null }), /açık değil/);
});

test("sayfa yardımı: adresten yer adı (kayıt kimliği, sorgu atılır); her menü modülünün yardımı var", () => {
  assert.deepEqual(sayfaBilgisi("/"), { yer: ANA_SAYFA.ad, modul: null, yardim: "Ana sayfa rolünüze göre bugünün işlerini, bekleyenleri ve duyuruları toplar." });
  assert.equal(sayfaBilgisi("/planlar/4f0c…?sekme=x#y").yer, "Planlar");
  assert.equal(sayfaBilgisi("/raporlar/123").modul, 14);
  assert.deepEqual(sayfaBilgisi("/bilinmeyen/yol"), { yer: "probata", modul: null, yardim: null });
  for (const m of MODULLER) assert.ok(SAYFA_YARDIMI[m.no]?.startsWith(`${m.ad}: `), `${m.ad} yardımı`);
  assert.equal(SAY_KILAVUZU.length, MODULLER.length + 1);
});

/* 382 → 550: rapor ekranının gönderdiği yapı — yalnız "islem" (ekranın kuralla yaptığı iş; metni sunucu kurar) */
test("rapor girdisi: yalnız işlem; kimlik ve numara denetlenir; eski hızlı sorular ve fazlası atılır", () => {
  const R = { id: "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f", no: "DM-1026-001" };
  assert.deepEqual(raporGirdisi({ hizli: "islem", rapor: R, islem: { istek: "geri", soru: "Geri al", sayi: 2, metin: "S.A.Y adına sahte metin" }, html: "<b>x</b>" }),
    { hizli: "islem", rapor: R, islem: { istek: "geri", soru: "Geri al", sayi: 2 } });
  for (const kotu of [
    { hizli: "eksik", rapor: R, eksik: [] }, { hizli: "baska", rapor: R },
    { hizli: "islem", rapor: { id: "x", no: R.no }, islem: { istek: "geri", soru: "x", sayi: 0 } }, { hizli: "islem", rapor: { id: R.id, no: "<script>" }, islem: { istek: "geri", soru: "x", sayi: 0 } },
    { hizli: "islem", rapor: R }, null, "metin",
  ]) assert.equal(raporGirdisi(kotu), null, JSON.stringify(kotu));
});

/* 553 → 2026-10-23: format haritası formatın TAMAMI (40 000 karakter sınırı ve madde kısaltması kalktı); aracın işlem sayısı sınırsız */
test("553 format: harita kısaltmasız; formati_duzenle şemasında sayı sınırı yok", () => {
  const t = FormatTanimi.parse(structuredClone(SABLONLAR.ZPKR02.tanim));
  const uzun = "M".repeat(5_000);
  const liste = t.bolumler.find((b) => b.blok === "liste");
  if (liste && liste.blok === "liste") liste.gruplar[0].maddeler[0].metin = uzun;
  const h = formatHaritasi(t);
  if (liste) assert.ok(h.includes(uzun), "madde metni kısaltılmaz");
  assert.doesNotMatch(h, /kısaltıldı/);
  assert.doesNotMatch(JSON.stringify((FORMAT_ARACI.input_schema as { properties: { islemler: unknown } }).properties.islemler).slice(0, 40), /maxItems/);
});

/* 2026-10-31 (reisim'in kabulü: "Geri al — yalnız S.A.Y'ın yeni açtığı kayıtlar"): ekranda geri alınacak değişiklik yoksa "geri al" S.A.Y'a gider; talimat
   yalnız bu işte açılan kayıtları silme işlemiyle geri almayı söyler */
test("geri al: ekranda yoksa S.A.Y'a; talimatta yalnız açtığı kayıtlar", async () => {
  const { readFileSync } = await import("node:fs");
  assert.match(SISTEM, /Geri al: kullanıcı yaptığın işin geri alınmasını isterse bu işte AÇTIĞIN kayıtları/);
  assert.match(SISTEM, /yalnız senin açtıkların silinir, kullanılmış kayıt silinmez/);
  assert.ok(readFileSync("src/modules/say/ui/SayAsistan.tsx", "utf8").includes(`!(istek === "geri" && !sonEylem("geri"))`), "ekranda geri alınacak yoksa yapay zekâya");
});
