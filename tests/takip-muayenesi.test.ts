/* NEREDEN GELDİ: reisim 2026-10-26 — "birisi daha önce muayene yapmışsa ve o muayeneye başka bir denetçi gidecekse onun için takip muayenesi
   açılabilmeli önceki metinler gelmeli"; maket ve dört karar onaylı ("Takip muayenesi maketi ve kararlar uygun, başla"): numara ana + -T1, plan
   içinde ekipman satırından, ekipteki uzman açar, giderilen kapanır. Bu kilit tutar: numara (takibin takibi ilk numaradan, kullanılan atlanır,
   revizyon …-T1-R1); göçte "devam" kapanışı (aynı ref) ve uygulamanın ayarı imzalı sürümden ÖNCE koyması (yoksa giderilmeyen madde "giderildi" olur);
   müşteri listesinde "devam" satırı yok (çift satır olmaz); plan satırında tuş; saha ekranında canlı durum. Veritabanıyla uçtan uca:
   tests/onaylar.test.ts "takip muayenesi". Olumsuz kanıt: tests/bozan/takip-muayenesi.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { revizyonNo, takipNo } from "../src/server/numara/numara.ts";
import { oku } from "./yardimci/denetimler.ts";

export const KURALLAR = {
  goc: (g: string) => /WHEN u\.ref = ANY \(d\) THEN 'devam'/.test(g) && /set_config\('app\.devam_ref', '', true\)/.test(g),
  imza: (r: string) => {
    const ayar = r.indexOf("set_config('app.devam_ref'"), surum = r.indexOf("await ekle(db, SURUM,");
    return ayar > 0 && surum > ayar;
  },
  musteri: (m: string) => m.includes("WHERE u.kapanis IS DISTINCT FROM 'devam'"),
  ekran: (plan: string, saha: string) => plan.includes("takipAcEylemi(planId, e.id)") && /new Set\(d\.kusurlar\.map\(\(k\) => k\.ref\)\)/.test(saha),
};

test("numara: ana + -T1; takibin takibi ilk numaradan; kullanılan atlanır; revizyon …-T1-R1", () => {
  const ana = "DA-1026-014-ab12c";
  assert.equal(takipNo(ana, []), `${ana}-T1`);
  assert.equal(takipNo(`${ana}-T1`, [`${ana}-T1`]), `${ana}-T2`);
  assert.equal(takipNo(ana, [`${ana}-T1`, `${ana}-T3`, "DA-1026-0140-ab12c-T7"]), `${ana}-T4`, "başka kökün numarası sayılmaz");
  assert.equal(revizyonNo(`${ana}-T1`, 1), `${ana}-T1-R1`);
  assert.throws(() => takipNo("uydurma", []), /Geçersiz/);
});

test("kapanış: göç 'devam'ı ref'le verir ve ayarı boşaltır; imzada ayar sürümden önce; müşteri listesi 'devam'ı göstermez; ekran tuşu ve canlı durum", () => {
  assert.ok(KURALLAR.goc(oku("src/server/db/gocler/0108_takip_muayenesi.sql")));
  assert.ok(KURALLAR.imza(oku("src/modules/raporlar/server/raporlar.ts")));
  assert.ok(KURALLAR.musteri(oku("src/modules/raporlar/server/musteri-baglanti.ts")));
  assert.ok(KURALLAR.ekran(oku("src/modules/planlar/ui/EkipmanBolumu.tsx"), oku("src/modules/raporlar/ui/SahaRaporu.tsx")));
});
