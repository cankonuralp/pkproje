/* NEREDEN GELDİ: 2026-11-05 — reisim: "müşterilerin yaptırdığı işlere göre sürekli kendini eğitme sistemi", "benim 1 kere yaptırdığım işi claude … bir dahaki sefer
   daha iyi yapıyor … geri planda çalışsın ve kullanıcının tokeninden yemesin"; sunum 7UcQ3N2BJRQkLHq4Whad16 ("önerilerinin yeni hali uygundur"; göç 0121).
   Bu kilit tutar (saf): (1) işin özeti son sorudan — adımlar, hata, S.A.Y'ın yazdığı raporlar (okuyan işlem rapor saymaz), düzeltme sözü / geri al;
   (2) adlar, e-posta, uzun numara gizlenir (sözcüğün parçası değil); (3) örnek seçimi iş türü başına en ucuz üç, eski örnek daha iyisi gelmeden düşmez
   (K3: öğrenilen silinmez); (4) hafıza metni sınırlı, boşsa boş; (5) kaynak kilidi: iş bitince özet, konuşmanın başında hafıza, gece işi rotada,
   yapay zekâ çağrısı yok. Olumsuz kanıt: tests/bozan/say-ogrenme.bozan.ts. Uydurma veri. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { adimMetni, hafizaMetni, HAFIZA_EN_COK, isOzeti, maskele, ornekSec, type Ornek } from "../src/server/yz/ogrenme.ts";

const R1 = "11111111-1111-4111-8111-111111111111", R2 = "22222222-2222-4222-8222-222222222222", R3 = "33333333-3333-4333-8333-333333333333";
const soru = (t: string) => [{ role: "user", content: [{ type: "text", text: "[M01] etiket" }, { type: "text", text: t }] }, { role: "system", content: "Sayfa: Planlar" }];

test("işin özeti: son soru, adımlar, hata, yazılan raporlar", () => {
  const m = [
    ...soru("eski iş"), { role: "assistant", content: [{ type: "text", text: "tamam" }] },
    ...soru("forkliftlerin raporlarını yaz"),
    { role: "assistant", content: [{ type: "tool_use", id: "a", name: "islem", input: { ad: "rapor_getir", girdi: { rapor: R3 } } },
      { type: "tool_use", id: "b", name: "raporlara_yaz", input: { raporlar: [{ rapor: R1 }, { rapor: R2 }] } }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "a", content: "..." }, { type: "tool_result", tool_use_id: "b", content: "Yapılmadı: rapor kilitli" }] },
    { role: "assistant", content: [{ type: "tool_use", id: "c", name: "raporlara_yaz", input: { raporlar: [{ rapor: R1 }] } }, { type: "tool_use", id: "d", name: "rapora_yaz", input: {} }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "c", content: "yazıldı" }] },
  ];
  const o = isOzeti(m, R3)!;
  assert.equal(o.soru, "forkliftlerin raporlarını yaz");
  assert.deepEqual(o.adimlar, [{ ad: "rapor_getir" }, { ad: "raporlara_yaz", hata: true }, { ad: "raporlara_yaz" }, { ad: "rapora_yaz" }]);
  assert.deepEqual(o.raporlar.sort(), [R1, R2, R3].sort(), "okuyan rapor_getir sayılmaz; ekranın rapora_yaz'ı ekrandaki rapor");
  assert.equal(o.hata, 1); assert.equal(o.tur, "rapor"); assert.equal(o.duzeltme, false);
  assert.equal(isOzeti([{ role: "user", content: "x" }]), null, "sayfa notu yoksa iş yok");
});

test("düzeltme: söz ya da geri al; tür ilk iş gören işlem", () => {
  assert.equal(isOzeti([...soru("Hayır, yanlış olmuş")])!.duzeltme, true);
  assert.equal(isOzeti([...soru("hayırlı olsun")])!.duzeltme, false, "sözcüğün parçası değil");
  const g = isOzeti([...soru("şunu yap"), { role: "assistant", content: [{ type: "tool_use", id: "a", name: "beceri_oku", input: {} }, { type: "tool_use", id: "b", name: "geri_al", input: {} }] }])!;
  assert.equal(g.duzeltme, true); assert.equal(g.tur, "geri_al");
  assert.equal(isOzeti([...soru("merhaba")])!.tur, "soru");
});

test("gizleme: adlar, e-posta, uzun numara", () => {
  const s = maskele("Örnek Sanayi A.Ş. Merkez tesisindeki FRK-12345 seri için ali@ornek.com, Ahmet Yılmaz söyledi; ÖRNEK SANAYİ A.Ş. tekrar", ["Örnek Sanayi A.Ş.", "Merkez", "Ahmet Yılmaz", "Ah"]);
  assert.equal(s, "<ad> <ad> tesisindeki <no> seri için <e-posta>, <ad> söyledi; <ad> tekrar");
  assert.equal(maskele("Merkezi binada 8 forklift", ["Merkez"]), "Merkezi binada 8 forklift", "sözcüğün parçası gizlenmez");
});

test("örnek seçimi: tür başına en ucuz üç; eskisi daha iyisi gelmeden kalır", () => {
  const o = (id: string, tur: string, maliyet: number | null, zaman = "2026-11-01T00:00:00Z"): Ornek => ({ id, tur, soru: "x", adimlar: "a", istek: 3, maliyet, zaman, rapor: 0 });
  const eski = [o("e1", "rapor · Forklift", 20_000), o("e2", "rapor · Forklift", 50_000)];
  const ad = (id: string, tur: string, maliyet: number) => ({ id, tur, soru: "Ahmet Yılmaz için", adimlar: [{ ad: "a" }, { ad: "a" }, { ad: "b" }], istek: 2, maliyet, zaman: "2026-11-05T00:00:00Z", rapor: 1 });
  const l = ornekSec(eski, [ad("y1", "rapor · Forklift", 30_000), ad("y2", "rapor · Forklift", 10_000), ad("y3", "teklif_kaydet", 5_000)], ["Ahmet Yılmaz"]);
  assert.deepEqual(l.map((x) => x.id), ["y2", "e1", "y1", "y3"], "en ucuz üç; e2 düştü");
  assert.equal(l[0]!.soru, "<ad> için"); assert.equal(l[0]!.adimlar, "a ×2 → b");
  assert.deepEqual(ornekSec(eski, [], []).map((x) => x.id), ["e1", "e2"], "yeni aday yoksa öğrenilen silinmez");
});

test("hafıza metni: türlerin kod düzeni + örnekler; sınırlı; boşsa boş", () => {
  assert.equal(hafizaMetni([], [{ ad: "Forklift", kod: "F", onek: null }]), "");
  const m = hafizaMetni([{ id: "1", tur: "rapor · Forklift", soru: "raporları yaz", adimlar: "rapor_ac ×8 → raporlara_yaz", istek: 6, maliyet: 33_000, zaman: "", rapor: 8 }],
    [{ ad: "Forklift", kod: "F", onek: "FRK-" }]);
  assert.match(m, /^S\.A\.Y hafızası/); assert.match(m, /Forklift \(FRK-…\)/); assert.match(m, /1\. rapor · Forklift — 8 rapor — 6 istek · 0,033 \$\. İstek: "raporları yaz"/);
  const cok = Array.from({ length: 200 }, (_, i): Ornek => ({ id: String(i), tur: `t${i}`, soru: "x".repeat(300), adimlar: "a", istek: 1, maliyet: 1, zaman: "", rapor: 0 }));
  assert.ok(hafizaMetni(cok, []).length <= HAFIZA_EN_COK);
  assert.equal(adimMetni([{ ad: "a", hata: true }, { ad: "a", hata: true }, { ad: "a" }]), "a (hata) ×2 → a");
});

test("kaynak kilidi: iş bitince özet; konuşmanın başında hafıza; gece rotada; yapay zekâ çağrısı yok", () => {
  const d = readFileSync("src/modules/say/server/dongu.ts", "utf8"), s = readFileSync("src/modules/say/server/say.ts", "utf8");
  const o = readFileSync("src/server/yz/ogrenme.ts", "utf8"), r = readFileSync("src/app/api/is/gece/route.ts", "utf8");
  assert.ok(d.includes("await isKaydiYaz(db, v.is, oz)") && !d.includes('yaz({ t: "bitti", yenile }); return; }'), "her bitişte özet");
  assert.ok(s.includes("(await konusmaSonu(db)) ? null : await hafizaNotu(db)") && s.includes("[...(hafiza ? [hafiza] : []), sayfaNotu(b, simdi)"), "yalnız konuşmanın başında");
  assert.ok(r.includes("sayOgrenmeIsi(merkezHavuzu()"), "gece işi");
  assert.doesNotMatch(o, /anthropic|akis\.ts|fetch\(/i, "öğrenme yapay zekâ çağırmaz — kullanıcının jetonundan yemez");
});
