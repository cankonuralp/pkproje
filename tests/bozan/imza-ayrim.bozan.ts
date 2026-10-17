/* OLUMSUZ KANIT — tests/imza-ayrim.test.ts neyi koruyor (2026-10-17, imza üretimi probata-sign'da). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): gerçek
   dosyalar bellekte okunur, bir satır eklenir / bir dosya eklenir, kilidin denetim işlevine verilir; her bozma yakalanmalı.
   1. Ürün kodu test verisi üreticisini içe aktarınca (göreli statik, dinamik, "@/", require, yeniden dışa açma) yakalanır; yorumdaki söz sayılmaz.
   2. src/server/imza/ içine imza üreten işlev geri gelince (var olan dosyaya ya da taşınan dosya geri konunca) yakalanır; aynı ad imza klasörü
      dışında (raporlar'ın kendi imzaHazirla'sı) sayılmaz.
   3. Test verisi üreticisinin başındaki kural silinince yakalanır. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, imzaAyrimiEksikleri, oku } from "../yardimci/denetimler.ts";

const UZANTI = [".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"];
const temel = [...dosyalar("src", UZANTI), ...dosyalar("tests/yardimci/imza-uret", UZANTI)].map((ad) => ({ ad, metin: oku(ad) }));
const ekle = (ad: string, satir: string) => {
  assert.ok(temel.some((d) => d.ad === ad), `dosya yok: ${ad}`);
  return temel.map((d) => (d.ad === ad ? { ...d, metin: `${satir}\n${d.metin}` } : d));
};

test("1. ürün kodu test verisi üreticisini içe aktarınca yakalanır (kilidin koruduğu açık)", () => {
  assert.deepEqual(imzaAyrimiEksikleri(temel), [], "sağlam");
  for (const [ad, satir] of [
    ["src/server/imza/yukleme.ts", 'import { imzaHazirla as h } from "../../../tests/yardimci/imza-uret/imzala.ts";'],
    ["src/modules/raporlar/server/raporlar.ts", 'const m = await import("../../../../tests/yardimci/imza-uret/ltv.ts");'],
    ["src/modules/onaylar/server/belgeler.ts", 'import { ekle } from "@/../tests/yardimci/imza-uret/pdf-ek-yaz.ts";'],
    ["src/server/imza/pdf-imzalar.ts", 'const c = require("../../../tests/yardimci/gercek-imza.ts");'],
    ["src/server/imza/cms.ts", 'export { imzaliVeriKur as kur } from "../../../tests/yardimci/imza-uret/cms-yaz.ts";'],
  ] as const) {
    assert.ok(imzaAyrimiEksikleri(ekle(ad, satir)).some((b) => b.startsWith(`${ad}: test klasörünü içe aktarıyor`)), `bozuk: ${ad}`);
  }
  assert.deepEqual(imzaAyrimiEksikleri(ekle("src/modules/raporlar/imza-pdf.ts", '/* import x from "../../../tests/yardimci/pdf-yaz.ts" */')), [], "yorum sayılmaz");
});

test("2. src/server/imza/ içine imza üreten işlev geri gelince yakalanır (kilidin koruduğu açık)", () => {
  for (const [ad, satir, isim] of [
    ["src/server/imza/pdf-imzalar.ts", "export function imzaTamamla(): void {}", "imzaTamamla"],
    ["src/server/imza/iptal.ts", "export async function iptalKaniti(): Promise<void> {}", "iptalKaniti"],
    ["src/server/imza/pdf-ek.ts", "export const dssEkle = () => null;", "dssEkle"],
  ] as const) {
    assert.ok(imzaAyrimiEksikleri(ekle(ad, satir)).includes(`${ad}: imza üreten işlev (${isim}) — imza üretimi probata-sign'da`), `bozuk: ${ad}`);
  }
  /* taşınan dosyanın kendisi geri konunca (başlığı ne olursa olsun) */
  const geri = [...temel, { ad: "src/server/imza/ltv.ts", metin: oku("tests/yardimci/imza-uret/ltv.ts") }];
  const b = imzaAyrimiEksikleri(geri);
  for (const isim of ["ltvEkle", "dssEkle", "belgeDamgasiEkle", "yerTutucuEkle"]) assert.ok(b.includes(`src/server/imza/ltv.ts: imza üreten işlev (${isim}) — imza üretimi probata-sign'da`), `bozuk: ${isim}`);
  /* raporlar'ın kendi imzaHazirla'sı (PDF'i imzaya hazırlar, imza üretmez) imza klasörü dışında: sayılmaz */
  assert.ok(oku("src/modules/raporlar/server/raporlar.ts").includes("export async function imzaHazirla("), "raporlar'ın kendi işlevi yerinde");
});

test("3. test verisi üreticisinin başındaki kural silinince yakalanır (kilidin koruduğu açık)", () => {
  const ad = dosyalar("tests/yardimci/imza-uret", [".ts"])[0];
  const bozuk = temel.map((d) => (d.ad === ad ? { ...d, metin: d.metin.replace(/^\/\* YALNIZ TEST VERİSİ ÜRETİR;/, "/* TEST VERİSİ;") } : d));
  assert.notDeepEqual(bozuk.find((d) => d.ad === ad)!.metin, temel.find((d) => d.ad === ad)!.metin, "bozulacak satır kaynakta");
  assert.ok(imzaAyrimiEksikleri(bozuk).includes(`${ad}: başında "yalnız test verisi" kuralı yok`), "bozuk: kural silindi");
});
