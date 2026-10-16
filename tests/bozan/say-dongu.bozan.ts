/* OLUMSUZ KANIT — 2026-10-15 (pkproje §9 "S.A.Y CLAUDE GİBİ": A iş döngüsü, C satir_ekle, D sahte "yaptım") — tests/say-saf.test.ts ve
   tests/say-doldur.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ: src/server/yz/say.ts ve src/modules/raporlar/say-doldur.ts bellekte bozulur,
   göreli içe aktarmalar mutlak yola çevrilip geçici klasörden içe aktarılır. O zaman:
   1. döngünün devamında araç kullanımı kapanırsa (557'deki gibi tool_choice none) S.A.Y sonucu görünce bir daha araç çağıramaz — döngü tek tura
      düşer ("kalanları da ekleyeyim mi?");
   2. güvenlik değişikliğe bakmazsa 20'şer satır ekleyen aynı çağrı ikinci turda durdurulur (iş yarım kalır);
   3. ekran satır sayısını yok sayarsa "50 satır ekle" tek satır ekler;
   4. araç çağrısı çözülürken satır sayısı atılırsa (1'e inerse) "50 satır ekle" tek satıra döner;
   5. sahte "yaptım" denetimi kalkarsa aracı çağırmadan "Ekledim." diyen cevap kullanıcıya gider.
   2026-10-16 (S.A.Y 1. adım incelemesi — döngünün tek durma güvencesinin olumsuz kanıtı; istemcide başka durma yok):
   6. güvenlik hiç durmazsa ya da imzaya araç kimliği girerse (her turda yeni kimlik) aynı iş değişmeden yinelense de döngü sürer;
   7. güvenlik yalnız art arda iki adıma bakarsa değişiklik yapmayan A, B, A, B … hiç durmaz;
   8. durdurulmuş turda S.A.Y yine araç isterse komut ekrana dönerse (src/modules/say/server/say.ts "!h.durdur") döngü sürer;
   9. raporun tablo sınırı denetimi kalkarsa satir_ekle 300'ün üstüne çıkar — rapor kaydedilemez (Cevaplar şeması reddeder);
   10. sahte "yaptım" denetimi araçsız istekte de çalışırsa bilgi veren cevap ("taslağı yazdım") düzeltme turuna düşer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { Cevaplar, FormatTanimi } from "../../src/format/tanim.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";

const klasor = mkdtempSync(join(tmpdir(), "say-dongu-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
const SAY = kaynak("src/server/yz/say.ts"), DOLDUR = kaynak("src/modules/raporlar/say-doldur.ts");
/* sunucu modülü: göreli içe aktarmalara ek olarak çıplak "zod" projenin node_modules'undan (geçici klasörde bulunamaz) */
const SUNUCU = kaynak("src/modules/say/server/say.ts").replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`);
let sira = 0;
async function bozuk<T>(k: string, eski: string, yeni: string): Promise<T> {
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `m-${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Say = typeof import("../../src/server/yz/say.ts");
type Doldur = typeof import("../../src/modules/raporlar/say-doldur.ts");
const ozet = (yazildi: number, satir = 0) => ({ yazildi, ayni: 0, bekliyor: 0, yapilan: [], yazilamadi: [], satir });
const baglam = { roller: [], yer: "Rapor X", yardim: null, bekleyen: [], rapor: "HARİTA" };

test("1) döngünün devamında araç kullanımı kapanırsa döngü tek tura düşer", async () => {
  const m = await bozuk<Say>(SAY, "      ...(devam && p.durdur ? { tool_choice: { type: \"none\" } } : {}),", "      ...(devam ? { tool_choice: { type: \"none\" } } : {}),");
  const g = m.sayIstegi({ model: "haiku", kilavuz: [], baglam, gecmis: [], soru: "linye tablosuna 50 satır ekle",
    adimlar: [[{ komut: { tur: "yaz", girisler: [], satirlar: [{ tablo: "linye", adet: 17, degerler: {} }] }, ozet: ozet(0, 17) }]] }).govde as { tool_choice?: unknown };
  assert.deepEqual(g.tool_choice, { type: "none" }, "bozuk: S.A.Y sonucu görünce araç çağıramaz");
});

test("2) güvenlik değişikliğe bakmazsa 20'şer satır ekleyen aynı çağrı durdurulur", async () => {
  const m = await bozuk<Say>(SAY, "  if (degisen(son) !== 0) return false;\n", "");
  const komut = { tur: "yaz" as const, girisler: [], satirlar: [{ tablo: "linye", adet: 20, degerler: {} }] };
  assert.equal(m.donguTekrari([[{ komut, ozet: ozet(0, 20) }], [{ komut, ozet: ozet(0, 20) }]]), true, "bozuk: iş sürerken döngü durdu");
});

test("3) ekran satır sayısını yok sayarsa \"50 satır ekle\" tek satır ekler", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "    for (let i = 0; i < adet; i++) {", "    for (let i = 0; i < 1; i++) {");
  const u = m.komutlariUygula({ ekipman: {}, cevaplar: Cevaplar.parse({}) }, FormatTanimi.parse(SABLONLAR.ZPKR02.tanim), [], {},
    [{ tablo: "linye", adet: 50, degerler: {}, sira: { sutun: "no" } }]);
  assert.equal(u.durum.cevaplar.tablo.linye?.length, 1, "bozuk: 50 yerine 1 satır");
});

test("4) araç çağrısı çözülürken satır sayısı atılırsa tek satıra döner", async () => {
  const m = await bozuk<Say>(SAY, "  return [{ tablo, adet, degerler, ...(sira ? { sira } : {}) }];", "  return [{ tablo, adet: 1, degerler, ...(sira ? { sira } : {}) }];");
  const c = m.sayYanitiCoz({ content: [{ type: "tool_use", id: "t1", name: "rapora_yaz", input: { satir_ekle: [{ tablo: "linye", adet: 50 }] } }] });
  assert.deepEqual(c.komutlar, [{ tur: "yaz", id: "t1", girisler: [], satirlar: [{ tablo: "linye", adet: 1, degerler: {} }] }], "bozuk: satır sayısı atıldı");
});

test("5) sahte \"yaptım\" denetimi kalkarsa aracı çağırmadan \"Ekledim.\" diyen cevap geçer", async () => {
  const m = await bozuk<Say>(SAY, "  return c.durum === \"tamam\" && yapildiDiyor(c.metin);", "  return false;");
  assert.equal(m.sahteYapildi({ content: [{ type: "text", text: "50 satırı ekledim." }], stop_reason: "end_turn" }, false), false, "bozuk: sahte cevap yakalanmadı");
});

const ayni = [[{ komut: { tur: "geri" as const, id: "a" }, ozet: ozet(0) }], [{ komut: { tur: "geri" as const, id: "b" }, ozet: ozet(0) }]];
test("6) güvenlik hiç durmazsa ya da imzaya araç kimliği girerse aynı iş değişmeden yinelense de döngü sürer", async () => {
  const hic = await bozuk<Say>(SAY, "  if (degisen(son) !== 0) return false;\n", "  return false;\n");
  assert.equal(hic.donguTekrari(ayni), false, "bozuk: güvenlik hiç durmuyor");
  const kimlikli = await bozuk<Say>(SAY, "const b = komutBlogu(x.komut); return [b.name, b.input];", "const b = komutBlogu(x.komut); return [b.id, b.name, b.input];");
  assert.equal(kimlikli.donguTekrari(ayni), false, "bozuk: her turda yeni kimlik — aynı iş hiç eşleşmez");
});

test("7) güvenlik yalnız art arda iki adıma bakarsa değişiklik yapmayan A, B, A … hiç durmaz", async () => {
  const m = await bozuk<Say>(SAY, " || adimlar.slice(0, -2).some((a) => degisen(a) === 0 && imza(a) === s)", "");
  const k = (deger: string, id: string) => [{ komut: { tur: "yaz" as const, girisler: [{ yer: "t:linye:1:akim", deger }], id }, ozet: ozet(0) }];
  assert.equal(m.donguTekrari([k("1", "a"), k("bir", "b"), k("1", "c"), k("bir", "d")]), false, "bozuk: A, B, A, B sürdü");
});

test("8) durdurulmuş turda S.A.Y yine araç isterse komut ekrana döner — döngü sürer", async () => {
  type Sunucu = typeof import("../../src/modules/say/server/say.ts");
  const m = await bozuk<Sunucu>(SUNUCU, "    if (!h.durdur && !ek.yedek && komutlar.length && c.durum !== \"ret\") return", "    if (!ek.yedek && komutlar.length && c.durum !== \"ret\") return");
  /* veritabanı taklidi: kapanış kaydı yazılır gibi (komut dönüşü sohbete yazmadan olur) */
  const db = { sorgu: async () => ({ rows: [], rowCount: 0 }) } as unknown as Parameters<Sunucu["sayIsSonucuKaydet"]>[0];
  const h = { durum: "hazir", istek: { govde: {} }, anahtar: "", model: "haiku", ay: "2026-10", ust: 0, yer: "Rapor X", rapor: null, format: null,
    komutRapor: true, komutFormat: false, ozet: ozet(0), durdur: true, yapildi: false } as Parameters<Sunucu["sayIsSonucuKaydet"]>[1];
  const y = await m.sayIsSonucuKaydet(db, h, { content: [{ type: "tool_use", id: "g3", name: "geri_al", input: {} }], stop_reason: "tool_use",
    usage: { input_tokens: 10, output_tokens: 1 } });
  assert.ok(y.durum === "tamam" && y.komutlar?.length === 1, "bozuk: durdurulmuş turda komut döndü");
});

test("9) raporun tablo sınırı denetimi kalkarsa satir_ekle 300'ün üstüne çıkar — rapor kaydedilemez", async () => {
  const m = await bozuk<Doldur>(DOLDUR, "    if (once.length + adet > TABLO_SATIR_EN_COK) {", "    if (false) {");
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const d = { ekipman: {}, cevaplar: { ...Cevaplar.parse({}), tablo: { linye: Array.from({ length: 290 }, (_, i) => ({ no: String(i + 1) })) } } };
  const u = m.komutlariUygula(d, t, [], {}, [{ tablo: "linye", adet: 20, degerler: {}, sira: { sutun: "no" } }]);
  assert.equal(u.durum.cevaplar.tablo.linye.length, 310);
  assert.equal(Cevaplar.safeParse(u.durum.cevaplar).success, false, "bozuk: rapor şemadan geçmiyor");
});

test("10) sahte \"yaptım\" denetimi araçsız istekte de çalışırsa bilgi veren cevap düzeltme turuna düşer", async () => {
  const m = await bozuk<Say>(SAY, "  Array.isArray(govde.tools) && (govde.tools as { name?: unknown }[]).some((t) => !!t && typeof t === \"object\" && t.name !== ARAMA_ARACI.name);",
    "  true;");
  const g = m.sayIstegi({ model: "haiku", kilavuz: [], baglam: { roller: [], yer: "Planlar", yardim: null, bekleyen: [] }, gecmis: [], soru: "kontrol listesi" }).govde;
  assert.equal(m.isAraciVar(g) && m.sahteYapildi({ content: [{ type: "text", text: "Size bir kontrol listesi oluşturdum:" }], stop_reason: "end_turn" }, false), true,
    "bozuk: araçsız bilgi veren cevap sahte sayıldı");
});
