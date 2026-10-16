/* NEREDEN GELDİ: 2026-10-16 — reisim: "herhangi bir tabloda 20 den sonrası sayfalı olacak demiştim … bu sanırım yapılmamış bunu da düzelt herhangi bir
   liste tablo, ekranda çok fazla veri olunca ekran kasacağı için 20 den fazlası sayfalı olsun diğer sayfalara doğru aksın". Tarama (2026-10-16):
   süzgeçsiz <Liste> tabloları, altı süzgeçli liste (kriterler, cihazlar, onay kuyruğu, imza bekleyenler, revize istekleri, zimmet), dokuz düz
   <table> (saha raporu ölçüm tabloları, Excel önizlemeleri, plan içi, S.A.Y cevabı) ve on liste sayfasızdı. Kural (kaynak kilidi,
   tests/yardimci/sayfalama.ts): ekran tablosu ortak sayfalamayla (useSayfa + TabloSayfalari; Liste.tsx kendisi sayfalar), süzgeç tanımı sayfa
   boyuyla, taramadaki listeler ortak parçayla — yeni bir ekran tablosu sayfalamasız eklenirse yakalanır. Dokunulmayanlar gerekçeli (belge / PDF
   bütün satırları basar). Saha raporunda eksiğe git ve S.A.Y işareti sayfayı açar. Olumsuz kanıt: tests/bozan/sayfa.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, oku } from "./yardimci/denetimler.ts";
import { SAYFALI_LISTELER, sahaSayfaEksikleri, sayfasizListeler, sayfasizSuzgecTanimlari, sayfasizTablolar } from "./yardimci/sayfalama.ts";

const tsx = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
const ts = dosyalar("src", [".ts", ".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));

test("ekran tablosu ortak sayfalamayla: her <table için bir TabloSayfalari ve sayfa dilimi; Liste tek üreticisi kendisi sayfalar; dokunulmayanlar gerekçeli", () => {
  assert.deepEqual(sayfasizTablolar(tsx), []);
});

test("süzgeçli listenin her tanımı sayfa boyu taşır (sayfasız süzgeçli liste yok)", () => {
  assert.deepEqual(sayfasizSuzgecTanimlari(ts), []);
  /* denetim boş geçmesin: tanımlar gerçekten taranıyor */
  assert.ok(ts.filter((d) => /\bimkansiz\s*:/.test(d.metin) && /^src\/(modules|app)\//.test(d.ad)).length > 25, "süzgeç tanımı bulunamadı");
});

test("taramada bulunan listeler ortak parçayla (SayfaliListe / useSayfa) — sayısı düşemez", () => {
  assert.deepEqual(sayfasizListeler(tsx), []);
  assert.ok(Object.keys(SAYFALI_LISTELER).length >= 10);
});

/* 2026-10-16 (inceleme): kontrol listesi maddeleri de sayfalı; hangi sayfanın açılacağı TEK kuralla rapor ekranında (tablo değişince ilk değişen
   satırın sayfası — S.A.Y aynı işte hem yazıp hem satır eklediğinde ya da Excel boş satırlara yazdığında da yazılan görünür; eksiğe git ve S.A.Y'ın
   işaretlediği madde en üstteki yerin sayfası). Denetim tests/yardimci/sayfalama.ts sahaSayfaEksikleri (olumsuz kanıtı sayfa.bozan.ts 8.) */
test("saha raporu: ölçüm tablosu ve kontrol listesi sayfası rapor ekranında — tablo değişince ilk değişen satırın, eksiğe git ve S.A.Y işareti en üstteki yerin sayfası", () => {
  assert.deepEqual(sahaSayfaEksikleri(oku("src/modules/raporlar/ui/Bloklar.tsx"), oku("src/modules/raporlar/ui/SahaRaporu.tsx")), []);
});
