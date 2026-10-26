/* NEREDEN GELDİ: reisim 2026-10-26 — "plan kabul edildiğinde gelmeli ki çevrim dışı çalışırken sorun olmamalı". Sayfa cihaza inerken sunucunun
   gömdüğü karar (plan kabul edilmiş mi, plan günü geldi mi, günlük süre) sahada bayatlıyordu: bağlantısız kabulden sonra "Rapor oluştur" görünmüyor,
   yeni rapor ekranı "kabul edilmemiş" diyor, ertesi gün "plan günü gelmedi" kalıyordu. Kapı ham bilgiden, cihazda (planlar/sema.ts raporKapisi;
   ekranlar ui/cihazKapisi.ts ve YeniRaporEkrani); plan kabul edilince paket beklemeden iner, bağlantı gelince 30 dakika beklenmez.
   Olumsuz kanıt: tests/bozan/cevrimdisi-kapi.bozan.ts. Paketin ham alanları gerçek PostgreSQL'de tests/islem.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { KABULSUZ_RAPOR, erkenRapor, raporKapisi } from "../src/modules/planlar/sema.ts";
import { oku } from "./yardimci/denetimler.ts";

test("raporKapisi: cihazda bekleyen kabul kabul sayılır; plan günü cihazın bugününe göre; ileti sunucununkiyle aynı", () => {
  const p = { durum: "bekliyor" as const, baslangic: "2026-10-27" };
  assert.equal(raporKapisi(p, "2026-10-27"), KABULSUZ_RAPOR, "kabul edilmemiş plan");
  assert.equal(raporKapisi(p, "2026-10-27", true), null, "cihazda bekleyen kabul: rapor açılır");
  assert.equal(raporKapisi({ ...p, durum: "kabul" }, "2026-10-26"), erkenRapor("2026-10-27", "2026-10-26"), "plan günü gelmedi");
  assert.equal(raporKapisi({ ...p, durum: "kabul" }, "2026-10-27"), null, "ertesi gün (paket önceki gün indi): açılır");
  assert.equal(raporKapisi({ ...p, durum: "reddedildi" }, "2026-10-27", true), KABULSUZ_RAPOR, "reddedilmiş plan bekleyen kabulle açılmaz");
  assert.equal(raporKapisi({ ...p, durum: "tamamlandi" }, "2026-10-27"), null, "tamamlanmışın engeli ayrı (TAMAMLANDI_RAPOR)");
  assert.match(erkenRapor("2026-10-27", "2026-10-26"), /^Plan günü 27\.10\.2026 henüz gelmedi \(bugün 26\.10\.2026\)/);
});

test("ekranlar kapıyı cihazda verir: sayfaya gömülü izin / erken / mesai okunmaz; kabulde paket iner; bağlanınca 30 dakika beklenmez", () => {
  const ekipman = oku("src/modules/planlar/ui/EkipmanBolumu.tsx"), plan = oku("src/modules/planlar/ui/PlanIciEkrani.tsx");
  for (const [ad, s] of [["EkipmanBolumu", ekipman], ["PlanIciEkrani", plan]] as const) {
    assert.ok(s.includes("useCihazKapisi(v)"), `${ad} cihaz kapısını kullanır`);
    assert.doesNotMatch(s, /v\.izin\.raporOlustur|v\.erken\b|v\.mesai\b/, `${ad} sayfaya gömülü kararı okumaz`);
  }
  const yeni = oku("src/modules/raporlar/ui/YeniRaporEkrani.tsx");
  assert.match(yeni, /raporKapisi\(\{ durum: p\.planDurum, baslangic: p\.planBaslangic \}, bugun, kabulBekliyor\)/, "yeni rapor ekranı kararı cihazda verir");
  assert.match(yeni, /bugun: cihazBugunu\(\)/, "bağlantısız raporun bugünü cihazın");
  assert.ok((plan.match(/planiCihazaIndir\(k\.id\)/g) ?? []).length >= 2, "kabul (bağlantılı ve kuyruktan) planı cihaza indirir");
  assert.match(oku("src/components/cevrimdisi/Cevrimdisi.tsx"), /addEventListener\("online", baglandi\)/, "bağlanınca zorla indirme");
});
