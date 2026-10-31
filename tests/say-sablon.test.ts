/* NEREDEN GELDİ: 2026-10-31, kalem 8 — E6, E10, K5 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; maket 1–3; 2026-10-14 "tek hazır tuş" kararı
   2026-10-23'te değişti). Bu kilit tutar: (1) her önerinin becerisi var, sayfası uygulamanın bir sayfası, ikinci onaylılar işaretli; (2) sayfaya göre öneri:
   raporda ilk öneri "Fotoğrafları oku ve gir", planda saha bilgisinden raporlar; kişisel belgeli öneri yalnız firma yöneticisine; son kullanılan öne; (3) komut
   okunur, zorunlu girdi denetlenir, şablon notu talimatı değiştirmez ("önce sun" notta); (4) sunucu şablonu kimlikle ve rolle kabul eder; plan özeti ve
   "önce mevcut ekipman" uyarısı katalogda. Olumsuz kanıt: tests/bozan/say-sablon.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { becerileriOku } from "../src/modules/say/beceriler.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";
import { eksikGirdiler, sablonNotu, SABLONLAR, sayfaOnerileri } from "../src/modules/say/sablonlar.ts";

const ID = "0f2a3d00-1fa3-47a0-8f5e-4e5f6c000001";
test("kayıt: 31 öneri, kimlikler tekil, beceriler var, ikinci onaylılar işaretli", () => {
  assert.equal(SABLONLAR.length, 31);
  assert.equal(new Set(SABLONLAR.map((s) => s.id)).size, 31);
  const kodlar = new Set(becerileriOku().map((b) => b.kod));
  for (const s of SABLONLAR) assert.ok(kodlar.has(s.beceri), `${s.id}: ${s.beceri} yok`);
  assert.deepEqual(SABLONLAR.filter((s) => s.ikinciOnay).map((s) => s.id).sort(), ["S12", "S15", "S17", "S21", "S24", "S9"].sort());
});

test("sayfaya göre: raporda ilk 'Fotoğrafları oku ve gir'; planda saha bilgisi; kişisel belgeli yalnız yöneticiye; son kullanılan öne", () => {
  assert.equal(sayfaOnerileri(`/raporlar/${ID}`, ["denetci"])[0]!.id, "S13");
  const plan = sayfaOnerileri(`/planlar/${ID}?sekme=ekipman`, ["denetci"]);
  assert.equal(plan[0]!.id, "S1");
  assert.ok(plan.length >= 11);
  assert.deepEqual(sayfaOnerileri("/personel", ["denetci"]).map((s) => s.id), [], "denetçi Ş14 / Ş15'i görmez");
  assert.deepEqual(sayfaOnerileri("/personel", ["firma_yoneticisi"]).map((s) => s.id), ["S14", "S15"]);
  assert.equal(sayfaOnerileri(`/planlar/${ID}`, ["denetci"], ["S8"])[0]!.id, "S8");
  assert.deepEqual(sayfaOnerileri("/yonetim", ["firma_yoneticisi"]), [], "Yönetim'de S.A.Y yok");
});

test("komut, zorunlu girdi ve şablon notu", () => {
  const s1 = SABLONLAR.find((s) => s.id === "S1")!;
  assert.equal(s1.komut({ gun: "2026-10-27", saat: "10:00", sgk: "" }), "Bu planın raporlarını eklediğim saha bilgisine göre hazırla. Kontrol günü 27.10.2026, saatler 10:00'ten başlasın. Kaydet, gönderme.");
  const s4 = SABLONLAR.find((s) => s.id === "S4")!;
  assert.deepEqual(eksikGirdiler(s4, { gun: "", saat: "10:00" }), ["Gün"]);
  const n = sablonNotu(s1, { gun: "2026-10-27", onceSun: true });
  assert.match(n, /^Şablon: S1 Saha bilgisinden raporları hazırla; beceri: B01; girdiler: \{.*\}; önce sun: evet/);
  assert.match(sablonNotu(s4, {}), /önce sun: hayır/);
});

test("kaynak kilidi: sunucu şablonu kimlik ve rolle kabul eder; ekran önerileri gösterir; plan özeti ve mevcut ekipman uyarısı", () => {
  const s = readFileSync("src/modules/say/server/say.ts", "utf8"), d = readFileSync("src/modules/say/server/dongu.ts", "utf8");
  assert.ok(s.includes("SABLONLAR.find((x) => x.id === g.sablon!.id && (!x.roller || x.roller.some("), "şablon kimlikle ve rolle");
  assert.ok(d.includes("sablon: z.object({ id: z.string().regex(/^S\\d{1,2}$/)"), "girdi şeması");
  assert.ok(readFileSync("src/modules/say/ui/SayAsistan.tsx", "utf8").includes("<Oneriler yol={yol}"));
  assert.equal(ISLEM_KATALOGU.find((t) => t.ad === "plan_hazirlik")?.tur, "oku");
  assert.ok(readFileSync("src/modules/planlar/say-islemleri.ts", "utf8").includes("mevcutUyarisi(b, v.plan, [ham.tur]"));
});
