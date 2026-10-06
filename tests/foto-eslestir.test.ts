/* NEREDEN GELDİ: 354 — 350–351 çapraz incelemesi: maket rapor.html Z3 nokta-oku / noktaYaz "ölçü aletinin ekranından okunan Zx, Zx'i boş noktalara
   yazılır"; kod her okunanı tablonun sonuna ekleyip adı / eğrisi boş yeni satır açıyordu. Saf (veritabanısız): hedef değeri boş var olan satır (sırayla,
   her satıra bir okunan), yoksa yeni satır; uygulama yalnız boş hücreye yazar (elle girilen ezilmez), boş açılmış satır düşer; kısmi uygulamadan sonra
   kalanlar gösterilen yerlerine düşer. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { okunanHedefleri, okunanlariUygula } from "../src/modules/raporlar/foto-eslestir.ts";

const NOKTA = [{ ad: "Pano A", egri: "C", zx: "" }, { ad: "Pano B", egri: "B", zx: "0,41" }, { ad: "Pano C", egri: "C", zx: "" }, { ad: "", egri: "", zx: "" }];

test("hedef: okunanın bütün sütunları boş olan, değeri olan var olan satır; yoksa yeni satır", () => {
  const okunan = [{ degerler: { zx: "0,31" } }, { degerler: { zx: "0,52" } }, { degerler: { zx: "0,77" } }];
  assert.deepEqual(okunanHedefleri(NOKTA, okunan), [0, 2, null], "Zx'i boş noktalar sırayla (dolu B atlanır, boş açılmış satır hedef değil), sonra yeni");
  assert.deepEqual(okunanHedefleri([], [{ degerler: { no: "F1" } }]), [null], "boş tablo: yeni satır");
  assert.deepEqual(okunanHedefleri([{ no: "F1", akim: "" }], [{ degerler: { no: "F2", akim: "16" } }]), [null], "satırın No'su dolu: yazılmaz, yeni satır");
  assert.deepEqual(okunanHedefleri([{ no: "F1", akim: "" }], [{ degerler: { akim: "16" } }]), [0]);
  assert.deepEqual(okunanHedefleri(NOKTA, [{ degerler: {} }]), [null]);
});

test("uygula: yalnız boş hücre, boş açılmış satır düşer, yeniler sona; kısmi uygulama gösterilen yerleri bozmaz", () => {
  const okunan: { degerler: Record<string, string> }[] = [{ degerler: { zx: "0,31" } }, { degerler: { zx: "0,52" } }, { degerler: { zx: "0,77", egri: "D" } }];
  const h = okunanHedefleri(NOKTA, okunan);
  const tum = okunanlariUygula(NOKTA, okunan.map((o, i) => ({ ...o, hedef: h[i] })));
  assert.deepEqual(tum, [
    { ad: "Pano A", egri: "C", zx: "0,31" }, { ad: "Pano B", egri: "B", zx: "0,41" }, { ad: "Pano C", egri: "C", zx: "0,52" }, { zx: "0,77", egri: "D" },
  ]);
  /* önce 1. ve 3. (emin olunanlar), sonra 2. (emin değil): kart 2.'yi 3. satıra göstermişti, oraya düşer */
  const ilk = okunanlariUygula(NOKTA, [0, 2].map((i) => ({ ...okunan[i], hedef: h[i] })));
  assert.deepEqual(ilk.map((s) => s.zx), ["0,31", "0,41", "", "0,77"]);
  const kalan = [okunan[1]];
  const h2 = okunanHedefleri(ilk, kalan);
  assert.deepEqual(h2, [2]);
  assert.deepEqual(okunanlariUygula(ilk, kalan.map((o, i) => ({ ...o, hedef: h2[i] })))[2], { ad: "Pano C", egri: "C", zx: "0,52" });
  /* hedefteki hücre bu arada elle doldurulduysa ezilmez */
  assert.deepEqual(okunanlariUygula([{ ad: "Pano A", zx: "0,99" }], [{ degerler: { zx: "0,31" }, hedef: 0 }]), [{ ad: "Pano A", zx: "0,99" }]);
});
