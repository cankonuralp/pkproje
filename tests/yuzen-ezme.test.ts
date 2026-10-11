/* NEREDEN GELDİ: 486 — reisim 2026-10-10: "tip seçin kısmına tıklayınca saçma sapan başa atıp attığım ekran görüntüsündeki gibi saçmalamalar
   oluyor … Bunlar kabul edilemez saçma hatalar". Neden: 452 seçim listesini üst katmana (popover) aldı; rapor tablosunun CSS'inde 452'den önce
   kalan ".olcumTablo [data-secim-kap] [role=listbox] { position: static }" ezmesi listeyi akışa alıyordu — üst katmanda akıştaki öğe sayfanın
   başında çizilir, odak sayfayı oraya kaydırır. Hata = sınıf (anayasa 0.8): (1) yüzen katmanın biçemi yalnız Secim.module.css'te, başka hiçbir
   CSS ona inemez (bu kilit); (2) konum katmanın kendi satır içi biçeminde (yuzen.ts yerlestir); (3) katmana odak sayfayı kaydırmadan (odakla).
   Tarayıcıda: e2e/secim.spec.ts "rapor tablosunda seçim listesi alanın yanında; sayfa kaymaz". */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, oku, yuzenEzmeleri } from "./yardimci/denetimler.ts";

test("yüzen katmana başka CSS inmez; kendi dosyasında konum yalnız fixed", () => {
  const css = dosyalar("src", [".css"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.ok(css.length > 20, "CSS dosyaları bulunamadı");
  assert.deepEqual(yuzenEzmeleri(css), []);
});

test("yuzen.ts konumu satır içi biçemde yazar; seçim / takvim içine odak sayfayı kaydırmaz", () => {
  const yuzen = oku("src/components/secim/yuzen.ts");
  assert.match(yuzen, /b\.position = "fixed"; b\.margin = "0"; b\.right = "auto";/);
  assert.match(yuzen, /e\?\.focus\(\{ preventScroll: true \}\)/);
  for (const ad of ["src/components/secim/SecenekListesi.tsx", "src/components/secim/TarihAlani.tsx"]) {
    const m = oku(ad);
    /* katmanın içindeki öğelere (seçenek, gün, arama) çıplak .focus() yok — yalnız tetikleyiciye dönüş (tus / simge / girdi) */
    const ciplak = [...m.matchAll(/([\w.?]+)\??\.focus\(\)/g)].map((x) => x[1]).filter((x) => !/^(tus|simge|girdi)\.current/.test(x));
    assert.deepEqual(ciplak, [], `${ad}: katman içine odak odakla() ile verilmeli`);
  }
});
