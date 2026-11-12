/* NEREDEN GELDİ: 2026-11-12 — reisim: "yazılan raporda süre bazlı olarak 13.30 - 14.00 de yapılan ekipmanın başında olmalı … log kayıtları düzgün
   olmalı" (pkproje.md §11 T7; maket yerel/maket/turkak-modeli.html 5. bölüm). Günlük çizelge: bir günde kim, hangi saatte, hangi ekipmanın başındaydı —
   kişi kişi, saate göre; elle yazılan saat ve sapmalı kontrol işaretli; çubukların yeri saat aralığına göre. Veritabanı tarafı tests/raporlar.test.ts
   "kontrol saati (0128)". Olumsuz kanıt: tests/bozan/gunluk.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { cubuk, gunlukCizelge, gunlukTablo, type GunlukKontrol } from "../src/modules/raporlar/gunluk.ts";

const GUN = "2026-11-12";
const k = (kisiId: string, kisi: string, raporId: string, bas: string, bit: string | null, ek: Partial<GunlukKontrol> = {}): GunlukKontrol => ({
  kisiId, kisi, raporId, raporNo: `XX-1126-${raporId}`, ekipman: `EKP-${raporId}`, tur: "Forklift", musteri: "Örnek Sanayi", bas: `${GUN}T${bas}`,
  bit: bit ? `${GUN}T${bit}` : null, elle: false, sapmalar: [], ...ek });
const L = [
  k("p2", "Mert Kol", "021", "09:00", "09:50"),
  k("p1", "Deniz Arı", "007", "13:30", "14:02", { sapmalar: ["Bir fotoğraf kontrol saatleri dışında çekilmiş (12.11.2026 13:12)."] }),
  k("p1", "Deniz Arı", "001", "09:10", "09:42", { elle: true }),
  k("p1", "Deniz Arı", "008", "14:05", null),
];

test("günlük çizelge: kişi kişi (ada göre), saate göre; süre, toplam; elle yazılan ve sapmalı kontrol işaretli; süren kontrolün süresi yok", () => {
  const c = gunlukCizelge(L, GUN);
  assert.deepEqual(c.kisiler.map((x) => [x.kisi, x.toplamDk, x.satirlar.map((s) => s.raporId)]), [["Deniz Arı", 64, ["001", "007", "008"]], ["Mert Kol", 50, ["021"]]]);
  const d = c.kisiler[0]!.satirlar;
  assert.deepEqual(d.map((s) => [s.sure, s.dikkat, s.durum]), [
    [32, true, "Saat elle yazıldı"], [32, true, "Bir fotoğraf kontrol saatleri dışında çekilmiş (12.11.2026 13:12)."], [null, false, "Sürüyor"]]);
  assert.deepEqual(c.aralik, { bas: 8, bit: 18 }, "olağan aralık 08–18");
  assert.deepEqual(gunlukTablo(c).slice(0, 2), [["Kişi", "Müşteri", "Ekipman", "Tür", "Rapor", "Başlangıç", "Bitiş", "Süre (dk)", "Durum"],
    ["Deniz Arı", "Örnek Sanayi", "EKP-001", "Forklift", "XX-1126-001", "09:10", "09:42", 32, "Saat elle yazıldı"]]);
  assert.deepEqual(gunlukCizelge([], GUN), { kisiler: [], aralik: { bas: 8, bit: 18 } });
});

test("çubuklar: yer ve en saat aralığına göre; erken / geç kontrol aralığı genişletir; süren kontrol en az ende; gece yarısını aşan kesilir", () => {
  const c = gunlukCizelge(L, GUN), d = c.kisiler[0]!.satirlar;
  assert.deepEqual(cubuk(d[0]!, c.aralik, GUN), { sol: 11.67, en: 5.33 });   // 09:10 – 09:42, 08–18 arası 600 dk
  assert.deepEqual(cubuk(d[2]!, c.aralik, GUN), { sol: 60.83, en: 0.6 });    // 14:05, sürüyor
  const genis = gunlukCizelge([...L, k("p3", "Ece Tan", "030", "06:30", "19:20")], GUN);
  assert.deepEqual(genis.aralik, { bas: 6, bit: 20 });
  const gece = gunlukCizelge([{ ...k("p3", "Ece Tan", "031", "23:30", null), bit: "2026-11-13T00:20" }], GUN);
  assert.deepEqual(gece.aralik, { bas: 8, bit: 24 });
  assert.deepEqual(cubuk(gece.kisiler[0]!.satirlar[0]!, gece.aralik, GUN), { sol: 96.88, en: 3.13 }, "23:30'dan gün sonuna");
  assert.equal(gece.kisiler[0]!.satirlar[0]!.sure, 50, "süre gerçek süre (gün sonunda kesilmez)");
});
