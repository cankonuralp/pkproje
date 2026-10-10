/* NEREDEN GELDİ: 480 (reisim 2026-10-10: "dökümanlarda 1 uyarı gözüküyor ama bir sürü eksik var, tüm siteyi komple tara bir sürü böyle eksikler
   var"; anayasa 0.8 hata = sınıf, 2.8 sayaç dürüst). Yan menüdeki her sayının sebebi modülün sayfa başlığının altında yazar — tek üretici
   (components/kabuk/TakipSeridi.tsx), sayfa başlığı üreticisinin (SayfaBasi) içinde, kabuğun bağlamından. Saf parçalar ve bağlantı kilitlenir;
   sayıların sebeplerle aynı olduğu tests/anasayfa.test.ts'te (gerçek PostgreSQL). */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sayfaNedenleri, yolunModulu, type TakipNedeni } from "../src/components/kabuk/takip.ts";

const oku = (y: string) => readFileSync(new URL(`../${y}`, import.meta.url), "utf8");

test("adresin modülü: kök ve alt sayfalar (Onaylar › Talepler, Dökümanlar › Eğitimler); başka modülün ön ekine takılmaz", () => {
  assert.equal(yolunModulu("/onaylar")?.no, 15);
  assert.equal(yolunModulu("/onaylar/talepler")?.no, 15);
  assert.equal(yolunModulu("/dokumanlar/egitimler/turler")?.no, 4);
  assert.equal(yolunModulu("/araclar/tutanaklar")?.no, 23);
  assert.equal(yolunModulu("/"), undefined, "Ana sayfa modül değil");
  assert.equal(yolunModulu("/raporlarx"), undefined, "ön ek eşleşmesi yalnız / ile");
});

test("sebebin kendi sayfası onu gösteriyorsa orada yazılmaz; öteki sayfalarda bağlantıyla yazılır", () => {
  const l: TakipNedeni[] = [
    { tur: "sari", sayi: 2, metin: "talep (izin / masraf formu) kararınızı bekliyor", yer: "/onaylar/talepler", sayfada: true },
    { tur: "kirmizi", sayi: 1, metin: "aracın geçen haftaki kilometresi girilmedi", yer: "/araclar", sayfada: false },
  ];
  assert.deepEqual(sayfaNedenleri(l, "/onaylar").map((x) => x.yer), ["/onaylar/talepler", "/araclar"]);
  assert.deepEqual(sayfaNedenleri(l, "/onaylar/talepler").map((x) => x.yer), ["/araclar"], "Talepler sekmesi talepleri zaten listeler");
  assert.deepEqual(sayfaNedenleri(l, "/araclar").map((x) => x.yer), ["/onaylar/talepler", "/araclar"], "Araçlar listesi sebebi yazmıyor: şerit kalır");
  assert.deepEqual(sayfaNedenleri(undefined, "/araclar"), []);
});

test("bağlantı: sayfa başlığı üreticisi şeridi çizer, kabuk sayıları bağlamla verir, sayılar takip.ts'ten sebepleriyle gelir", () => {
  assert.match(oku("src/components/sayfa/Sayfa.tsx"), /export function SayfaBasi[\s\S]{0,400}<TakipSeridi \/>/);
  assert.match(oku("src/components/kabuk/Kabuk.tsx"), /<TakipBaglami\.Provider value=\{balon\}>\{children\}<\/TakipBaglami\.Provider>/);
  const t = oku("src/modules/anasayfa/server/takip.ts");
  /* her balon koy(no, ad, ...sebepler) ile kurulur: sayıyı elle veren eski biçim (koy(no, kırmızı, sarı, ad)) kalmadı */
  const sebepli = [...t.matchAll(/\bkoy\(\d+, \{/g)].length;
  assert.equal(sebepli, [...t.matchAll(/\bkoy\(/g)].length, "her koy çağrısı sebeplerle");
  assert.ok(sebepli >= 9, `balonlu modüller (Uyarılar, Ölçüm, Dökümanlar, Araçlar, Planlar, Sözleşmeler, Raporlar, Onaylar, Muhasebe): ${sebepli}`);
});
