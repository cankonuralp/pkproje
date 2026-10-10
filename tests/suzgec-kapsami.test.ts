/* NEREDEN GELDİ: 481 (reisim 2026-10-10: "tüm siteyi komple tara … anayasadan uzak durumlar var"; kalıp 14 "süzgeç sabit — içerik yokken de
   görünür", kalıp 15 "süzgeç satırı tek üretici"). Site taramasında yedi sayfanın ana listesi süzgeçsizdi (Onaylar › Talepler ve Diğer belgeler,
   Personel › İzin talepleri, Araçlar › Tutanaklar, Dökümanlar › Diğer dökümanlar / Muayene kriterleri / Eğitim türleri) ve müşteri panelinin üç
   listesi. Kural: sayfa başlığı (SayfaBasi) çizen bir bileşen listesini SuzgecliListe ile çizer; süzgeçsiz <Liste> yalnız aşağıdaki BÖLÜMLERDE
   (sayfanın ana listesi değil: özet, rapor tablosu, kartın bölümü, pencere) — sayısı artamaz (cırcır), yenisi gerekçeyle buraya yazılır. */
import assert from "node:assert/strict";
import test from "node:test";
import { dosyalar, oku, SUZGECSIZ_BOLUMLER, suzgecsizListeler } from "./yardimci/denetimler.ts";

test("sayfa başlığı çizen bileşenin ana listesi süzgeçli; süzgeçsiz liste yalnız gerekçeli bölümlerde (cırcır)", () => {
  const tsx = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(suzgecsizListeler(tsx, SUZGECSIZ_BOLUMLER), []);
});
