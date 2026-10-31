/* NEREDEN GELDİ: 2026-10-31 lift denemesi (reisim: "Raporlara yazan iş bitince döngü plan_denetle'yi kendisi çalıştırır … Bu denemede 8 raporun hiçbiri
   onaya gidemiyordu ve S.A.Y bunu söylemedi"; sunum L3). Bu kilit tutar: (1) son sorudan bu yana rapora yazan işlem varsa ve ardından denetim yoksa
   denetim gerekir (plan ve raporlar girdilerden); (2) yazmadan sonra plan_denetle çağrıldıysa ya da sunucu notu eklendiyse gerekmez; (3) bir işte en
   çok iki kez; (4) yazmayan işte gerekmez; önceki sorunun yazmaları sayılmaz; (5) sonuç okuması: sorunlu rapor / hata → sorun var. Olumsuz kanıt:
   tests/bozan/say-bitis-denetimi.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { bitisDenetimi, DENETIM_ONEKI, denetimNotu, denetimOzeti, sorunVar } from "../src/modules/say/bitis-denetimi.ts";

const P = "11111111-1111-4111-8111-111111111111", R1 = "22222222-2222-4222-8222-222222222222", R2 = "33333333-3333-4333-8333-333333333333";
const soru = (t = "raporları hazırla") => ({ role: "user", content: [{ type: "text", text: t }] });
const cagri = (ad: string, girdi: object) => ({ role: "assistant", content: [{ type: "tool_use", id: `c-${ad}`, name: "islem", input: { ad, girdi } }] });
const sonuc = (ad: string) => ({ role: "user", content: [{ type: "tool_result", tool_use_id: `c-${ad}`, content: "{}" }] });
const cevap = { role: "assistant", content: [{ type: "text", text: "Hazır." }] };

test("rapora yazan işten sonra denetim gerekir; plan ve raporlar girdilerden", () => {
  const l = [soru(), cagri("rapor_ac", { plan: P, ekipman: ["x"] }), sonuc("rapor_ac"), cagri("raporlara_yaz", { raporlar: [R1, { rapor: R2 }] }), sonuc("raporlara_yaz"), cevap];
  assert.deepEqual(bitisDenetimi(l), { plan: P, raporlar: [R1, R2] });
});

test("denetlendiyse, yazma yoksa, önceki soruda yazıldıysa gerekmez; en çok iki kez", () => {
  const yaz = [cagri("rapor_yaz", { rapor: R1 }), sonuc("rapor_yaz")];
  assert.equal(bitisDenetimi([soru(), ...yaz, cagri("plan_denetle", { plan: P }), sonuc("plan_denetle"), cevap]), null, "S.A.Y kendisi denetledi");
  assert.equal(bitisDenetimi([soru(), cagri("plan_getir", { plan: P }), sonuc("plan_getir"), cevap]), null, "yazmayan iş");
  assert.equal(bitisDenetimi([soru("eski"), ...yaz, cevap, soru("teşekkürler"), cevap]), null, "önceki sorunun yazması");
  const not = { role: "user", content: [{ type: "text", text: denetimNotu("{}") }] };
  assert.equal(bitisDenetimi([soru(), ...yaz, cevap, not, cevap]), null, "notun ardından yazma yok");
  assert.deepEqual(bitisDenetimi([soru(), ...yaz, cevap, not, ...yaz, cevap]), { plan: null, raporlar: [R1] }, "düzeltmeden sonra bir kez daha");
  assert.equal(bitisDenetimi([soru(), ...yaz, cevap, not, ...yaz, cevap, not, ...yaz, cevap]), null, "üçüncüsü yok");
  assert.ok(denetimNotu("x").startsWith(DENETIM_ONEKI));
});

/* 2026-10-31 V21 madde 3 (reisim: "Bitiş denetiminin sonucu konuşmaya tam JSON olarak değil özet olarak girer: sayı ve farklı sorunlar") */
test("denetim özeti: sayı, farklı sorunlar ve raporları; plan notu sonda; JSON konuşmaya girmez", () => {
  const s = JSON.stringify({ islem: "plan_denetle", durum: "tamam", raporlar: [
    { rapor: R1, no: "DM-1", sorunlar: ["eksik: Kumpas: ölçüm cihazı eklenmedi", "fotoğraf yok"] }, { rapor: R2, no: "DM-2", sorunlar: ["eksik: Kumpas: ölçüm cihazı eklenmedi"] },
    { rapor: P, no: "DM-3", sorunlar: [] }], plan_notu: ["kabul edilmiş teklif yok: 3 rapor fiyat listesinden ücretlendirilir"] });
  assert.equal(denetimOzeti(s), "2 / 3 raporda sorun — eksik: Kumpas: ölçüm cihazı eklenmedi (2 rapor: DM-1, DM-2) · fotoğraf yok (1 rapor: DM-1). Plan notu: kabul edilmiş teklif yok: 3 rapor fiyat listesinden ücretlendirilir.");
  assert.equal(denetimOzeti(JSON.stringify({ durum: "tamam", raporlar: [{ no: "DM-1", sorunlar: [] }] })), "1 rapor denetlendi; sorun yok.");
  const cok = JSON.stringify({ durum: "tamam", raporlar: Array.from({ length: 9 }, (_, i) => ({ no: `DM-${i}`, sorunlar: ["fotoğraf yok"] })) });
  assert.equal(denetimOzeti(cok), "9 / 9 raporda sorun — fotoğraf yok (9 rapor).");
  assert.equal(denetimOzeti(JSON.stringify({ durum: "hata", neden: "x" })), "denetim yapılamadı: x");
  assert.equal(denetimOzeti("{"), "denetim sonucu okunamadı");
  assert.doesNotMatch(denetimNotu(s), /"raporlar"|\{/, "not JSON taşımaz");
  assert.ok(denetimNotu(s).includes("2 / 3 raporda sorun"));
});

test("sonuç okuması: sorunlu rapor ya da hata → sorun var", () => {
  assert.equal(sorunVar(JSON.stringify({ islem: "plan_denetle", durum: "tamam", raporlar: [{ rapor: R1, sorunlar: [] }] })), false);
  assert.equal(sorunVar(JSON.stringify({ islem: "plan_denetle", durum: "tamam", raporlar: [{ rapor: R1, sorunlar: ["fotoğraf yok"] }] })), true);
  assert.equal(sorunVar(JSON.stringify({ islem: "plan_denetle", durum: "hata", neden: "x" })), true);
  assert.equal(sorunVar(undefined), true);
});
