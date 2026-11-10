/* NEREDEN GELDİ: 2026-11-10 — reisim: "1 ve 2 ve 4 5 i yap" (liste 5: "S.A.Y kayıttan oynatma sınavı"); onaylı sunum (5 Kasım, S.A.Y öğrenme):
   "Benim her düzeltmemden sonra son iyi işler yeniden oynatılır: S.A.Y'a aynı istek verilir, işlemlerin cevabı kayıttan gelir, gerçek veriye
   dokunulmaz. S.A.Y aynı doğru adımları seçiyorsa geçer." Bu kilit çekirdeği tutar (src/server/yz/sinav.ts — saf; yapay zekâ çağrısı taklit):
   (1) kayıt mesajlara çevrilirken araç çağrısı ↔ sonuç sırayla eşlenir, kimlikler tutarlıdır; eşleşmeyen yerde kayıt KESİLİR (uydurulmaz);
       internet araması geçmişe girmez; (2) soru yalnız kullanıcının yazdığı mesajdan sonraki ilk karardır, o ana kadarki konuşmayı taşır, sonrasını
       taşımaz (cevap sızmaz); (3) karşılaştırma: ilk asıl araç, yardımcı araçlar sayılmaz, araçsız cevap araçsız cevapla; (4) koşu: düşen çağrı
       "sorulamadı" (kalmış sayılmaz), oran sorulanlar içinde, hiç sorulamadıysa sonuç yok; toplam soru sınırı.
   Olumsuz kanıt: tests/bozan/say-sinav.bozan.ts. Uydurma veri. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { GECME_ORANI, karsilastir, kayitMesajlari, sinavKos, sinavSonucu, sinavSorulari, type KayitIletisi, type SinavMesaji } from "../src/server/yz/sinav.ts";

const u = (...t: string[]): KayitIletisi => ({ rol: "user", bloklar: t.map((text) => ({ type: "text", text })) });
const sonuc = (...t: string[]): KayitIletisi => ({ rol: "user", bloklar: t.map((text) => ({ type: "tool_result", text })) });
const a = (...b: ({ arac: string; girdi?: unknown } | string)[]): KayitIletisi =>
  ({ rol: "assistant", bloklar: b.map((x) => (typeof x === "string" ? { type: "text", text: x } : { type: "tool_use", name: x.arac, input: x.girdi ?? {} })) });

/* iki işli uydurma kayıt: (1) raporları oluştur → plan_hazirlik → rapor_ac + raporlara_yaz → bildirim; (2) soru → araçsız cevap */
const KAYIT: KayitIletisi[] = [
  { rol: "system", bloklar: [{ type: "text", text: "Sayfa: /planlar/x" }] },
  u("Fotoğraflardan raporları oluştur"),
  a({ arac: "islemler", girdi: { modul: "Planlar" } }, { arac: "plan_hazirlik", girdi: { plan: "p1" } }),
  sonuc("dizin", "plan: 2 ekipman"),
  a({ arac: "rapor_ac", girdi: { plan: "p1" } }),
  sonuc("2 rapor açıldı"),
  a({ arac: "raporlara_yaz" }),
  { rol: "user", bloklar: [{ type: "tool_result", text: "yazılamadı", hata: true }] },
  a("2 rapor yazıldı."),
  u("Kalibrasyon ne zaman biter?"),
  a("Cihaz kartında yazar."),
];

test("kayıt → mesajlar: çağrı ↔ sonuç sırayla eşlenir, kimlikler tutarlı; hata bayrağı taşınır; sistem notu yerinde", () => {
  const { mesajlar, kararlar } = kayitMesajlari(KAYIT);
  assert.equal(mesajlar.length, KAYIT.length);
  assert.deepEqual(mesajlar[0], { role: "system", content: "Sayfa: /planlar/x" });
  const cagri = (mesajlar[2]!.content as Record<string, unknown>[]).map((b) => [b.type, b.id, b.name]);
  assert.deepEqual(cagri, [["tool_use", "sinav_2_0", "islemler"], ["tool_use", "sinav_2_1", "plan_hazirlik"]]);
  assert.deepEqual((mesajlar[3]!.content as Record<string, unknown>[]).map((b) => [b.type, b.tool_use_id, b.content]),
    [["tool_result", "sinav_2_0", "dizin"], ["tool_result", "sinav_2_1", "plan: 2 ekipman"]]);
  assert.equal((mesajlar[7]!.content as Record<string, unknown>[])[0]!.is_error, true);
  /* her araç çağrısının bir sonucu, her sonucun bir çağrısı var (hizmet eşleşmeyen konuşmayı reddeder) */
  const idler = (tur: string, alan: string) => mesajlar.flatMap((m) => (Array.isArray(m.content) ? m.content : []).filter((b) => b.type === tur).map((b) => b[alan]));
  assert.deepEqual(idler("tool_use", "id"), idler("tool_result", "tool_use_id"));
  assert.deepEqual(kararlar.map((k) => [k.mesaj, k.adlar]), [[2, ["islemler", "plan_hazirlik"]], [10, []]]);
});

test("tutarsız kayıt kesilir: sonuç sayısı çağrıyla eşleşmiyorsa oradan sonrası alınmaz, uydurulmaz; internet araması geçmişe girmez", () => {
  const eksik: KayitIletisi[] = [u("Yaz"), a({ arac: "rapor_ac" }, { arac: "rapor_yaz" }), sonuc("yalnız biri"), a("bitti"), u("Sonra?"), a("x")];
  const k = kayitMesajlari(eksik);
  assert.equal(k.mesajlar.length, 2, "eşleşmeyen sonuçtan önce kesilir");
  assert.deepEqual(k.kararlar.map((x) => x.adlar), [["rapor_ac", "rapor_yaz"]]);
  const cevapsiz: KayitIletisi[] = [u("Yaz"), a({ arac: "rapor_ac" }), u("Araya giren mesaj"), a("x")];
  assert.equal(kayitMesajlari(cevapsiz).mesajlar.length, 2, "cevapsız çağrıdan sonra kullanıcı mesajı: kesilir");
  const arama: KayitIletisi[] = [u("Standardı bul"), { rol: "assistant", bloklar: [{ type: "server_tool_use", name: "web_search", input: {} }, { type: "text", text: "Buldum." }] }];
  const s = kayitMesajlari(arama);
  assert.deepEqual(s.mesajlar[1], { role: "assistant", content: [{ type: "text", text: "Buldum." }] }, "arama çağrısı geçmişte yok (sonucu kayıtta yok)");
  assert.deepEqual(s.kararlar[0]!.adlar, ["web_search"], "kararda sayılır");
  assert.deepEqual(kayitMesajlari([u("x"), a({ arac: "KÖTÜ AD" })]).kararlar[0]!.adlar, [], "biçimsiz araç adı alınmaz");
});

test("sorular: yalnız kullanıcının yazdığından sonraki ilk karar; soru o ana kadarki konuşmayı taşır, cevabı ve sonrasını taşımaz; soru sınırı", () => {
  const l = sinavSorulari(KAYIT);
  assert.deepEqual(l.map((q) => [q.sira, q.soru, q.beklenen, q.mesajlar.length]),
    [[0, "Fotoğraflardan raporları oluştur", ["islemler", "plan_hazirlik"], 2], [1, "Kalibrasyon ne zaman biter?", [], 10]]);
  assert.equal(l[0]!.mesajlar.at(-1)!.role, "user", "soru kullanıcının mesajıyla biter");
  assert.ok(!JSON.stringify(l[0]!.mesajlar).includes("plan_hazirlik"), "beklenen cevap soruya sızmaz");
  assert.ok(JSON.stringify(l[1]!.mesajlar).includes("raporlara_yaz"), "ikinci soru ilk işin tamamını taşır");
  assert.equal(sinavSorulari(KAYIT, 1).length, 1);
  assert.deepEqual(sinavSorulari([a("selam")]), [], "kullanıcı mesajı olmayan kayıtta soru yok");
});

test("karşılaştırma: ilk asıl araç gelenlerin içindeyse geçer; yardımcı araçlar sayılmaz; araçsız cevap yalnız araçsız cevapla", () => {
  assert.equal(karsilastir(["islemler", "plan_hazirlik"], ["plan_hazirlik"]).gecti, true, "dizine bakmadan aynı araç");
  assert.equal(karsilastir(["plan_hazirlik"], ["beceri_oku", "ekran_durumu", "plan_hazirlik", "rapor_ac"]).gecti, true);
  assert.equal(karsilastir(["plan_hazirlik", "rapor_ac"], ["rapor_ac"]).gecti, false, "ilk adım atlandı");
  assert.equal(karsilastir(["plan_hazirlik"], ["rapor_getir", "rapor_getir"]).gecti, false);
  assert.equal(karsilastir([], []).gecti, true);
  assert.equal(karsilastir([], ["islemler"]).gecti, true, "yalnız yardımcı araç: araçsız sayılır");
  assert.equal(karsilastir([], ["rapor_ac"]).gecti, false, "soruya iş yaparak cevap");
  assert.equal(karsilastir(["rapor_ac"], []).gecti, false, "iş yerine yazı");
  assert.deepEqual(karsilastir(["islemler", "rapor_ac"], ["beceri_oku", "rapor_ac"]), { gecti: true, beklenen: ["rapor_ac"], gelen: ["rapor_ac"] });
});

test("koşu: sorular sırayla sorulur; düşen çağrı sorulamadı (kalmış sayılmaz); oran sorulanlarda; hiç sorulamadıysa sonuç yok; toplam sınır", async () => {
  const gelen: SinavMesaji[][] = [];
  const iyi = await sinavKos([KAYIT], async (m) => { gelen.push(m); return gelen.length === 1 ? ["plan_hazirlik"] : []; });
  assert.deepEqual([iyi.soru, iyi.sorulan, iyi.gecen, iyi.kalan, iyi.sorulamayan, iyi.oran, iyi.gecti], [2, 2, 2, 0, 0, 1, true]);
  assert.deepEqual(gelen.map((m) => m.length), [2, 10], "her soruda o ana kadarki konuşma");
  const kotu = await sinavKos([KAYIT], async () => ["rapor_getir"]);
  assert.deepEqual([kotu.gecen, kotu.kalan, kotu.gecti], [0, 2, false]);
  assert.deepEqual(kotu.sorular[0], { sira: 0, soru: "Fotoğraflardan raporları oluştur", beklenen: ["plan_hazirlik"], gelen: ["rapor_getir"], gecti: false });
  let n = 0;
  const yarim = await sinavKos([KAYIT], async () => { if (n++ === 0) throw new Error("ağ"); return []; });
  assert.deepEqual([yarim.sorulan, yarim.sorulamayan, yarim.gecen, yarim.oran, yarim.gecti], [1, 1, 1, 1, true], "düşen çağrı oranı düşürmez");
  const hic = await sinavKos([KAYIT], async () => null);
  assert.deepEqual([hic.sorulan, hic.oran, hic.gecti], [0, null, null], "hiç sorulamadı: geçti de kaldı da denmez");
  assert.equal((await sinavKos([KAYIT, KAYIT, KAYIT], async () => [], { toplamEnCok: 3 })).soru, 3, "toplam soru sınırı");
  /* geçme oranı: 5 sorudan 4'ü (0,8) geçer, 3'ü kalır */
  const s = (gecen: number) => sinavSonucu(Array.from({ length: 5 }, (_, i) => ({ sira: i, soru: "x", beklenen: [], gelen: [], gecti: i < gecen })));
  assert.equal(GECME_ORANI, 0.8);
  assert.deepEqual([s(4).gecti, s(3).gecti], [true, false]);
});
