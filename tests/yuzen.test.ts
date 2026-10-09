/* NEREDEN GELDİ: 452 — reisim 2026-10-09: "seçmeli yere tıklıyoruz tüm sayfa kayıyor", "bu ve benzeri kaymalar kabul edilemez" (Araç ekle
   penceresinde liste alanları itiyor, takvim pencerenin altında kesiliyordu). Açılır katmanlar üst katmanda yüzer; yerini saf iki işlev seçer:
   alanın altı (sığmıyorsa ve üstte daha çok yer varsa üstü, en az 120 px), ekranın kenarından taşmaz (8 px pay). Tarayıcıdaki davranış
   e2e/secim.spec.ts ("pencerede: liste ve takvim yüzer") ve site taraması (açılır katman denetimi). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { yuzenSol, yuzenYer } from "../src/components/secim/yuzen.ts";

test("yer: altta yer varsa altta; sığmıyor ve üstte daha çok yer varsa üstte; yükseklik ekrana göre kısalır", () => {
  /* ekran 800; alan 100–140 → altta 800−140−14 = 646 */
  assert.deepEqual(yuzenYer({ top: 100, bottom: 140 }, 800, 300, 320), { ust: false, enCok: 320 });
  /* alan ekranın dibinde (700–740): altta 46, üstte 686 → üstte */
  assert.deepEqual(yuzenYer({ top: 700, bottom: 740 }, 800, 300, 320), { ust: true, enCok: 320 });
  /* kısa katman altta sığıyorsa dipte de altta */
  assert.equal(yuzenYer({ top: 600, bottom: 640 }, 800, 100, 320).ust, false);
  /* iki yanda da yer azsa çok olan tarafta, en az 120 */
  assert.deepEqual(yuzenYer({ top: 150, bottom: 190 }, 360, 300, 320), { ust: false, enCok: 156 }, "altta 156, üstte 136: altta");
  assert.deepEqual(yuzenYer({ top: 220, bottom: 260 }, 360, 300, 320), { ust: true, enCok: 206 }, "altta 86, üstte 206: üstte");
  assert.equal(yuzenYer({ top: 20, bottom: 60 }, 160, 300, 320).enCok, 120);
});

test("sol: alanın solundan (sağa hizalıda sağından); ekranın kenarından taşmaz", () => {
  assert.equal(yuzenSol({ left: 100, right: 300 }, 1000, 220, "sol"), 100);
  assert.equal(yuzenSol({ left: 100, right: 300 }, 1000, 220, "sag"), 80);
  assert.equal(yuzenSol({ left: 900, right: 980 }, 1000, 340, "sol"), 1000 - 340 - 8, "sağ kenara dayanınca içeri alınır");
  assert.equal(yuzenSol({ left: 2, right: 60 }, 1000, 220, "sag"), 8, "sol kenarda 8 px pay");
});
