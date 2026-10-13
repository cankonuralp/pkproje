/* NEREDEN GELDİ: 527 — reisim 2026-10-13: "say chatte fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek olsun"; 531 — aynı
   gün: "araçlar ve zimmetlerde de galeriden fotoğraf ekleme seçeneği ekle". Önceki tuşların hepsi capture'lı tek girdiydi: telefonda yalnız kamera
   açılıyordu. Kilit:
   · telefonda yalnız kamera açan girdi kalmaz — capture yalnız ortak fotoğraf tuşunda (components/foto/FotoTusu.tsx: kamera VE galeri / bilgisayar,
     capture'sız, çoklu) ve S.A.Y ataç menüsünde; kullananlar: S.A.Y Chat (yeni kayıt, "+ ek", etiket, okunacak başlık), araç teslim tutanağı (açı
     başına), zimmet teslimi;
   · hangi fotoğraf girer (saf, components/foto/secim.ts): küçültmeden sonra yalnız JPEG / PNG (türü bildirilmeyeni sunucu denetler), boş olmayan,
     çağıranın sınırı kadar bayt (S.A.Y Chat 2 MB, teslim 8 MB); yer kadar (yer dolunca kalanlar küçültülmez bile); eklenmeyen söylenir.
   Tarayıcıda: e2e/say-chat.spec.ts, e2e/araclar.spec.ts, e2e/zimmetler.spec.ts. Olumsuz kanıt: tests/bozan/foto-tusu.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fotolariSec, fotoSecimiUyarisi, fotoUygun, type SecilenFoto } from "../src/components/foto/secim.ts";
import { CHAT_FOTO_BAYT } from "../src/modules/say-chat/sema.ts";
import { dosyalar, FOTO_TUSU_KULLANANLAR, fotoTuslari, oku } from "./yardimci/denetimler.ts";

const TESLIM = 8 << 20;
const f = (name: string, type = "image/jpeg", size = 1000): SecilenFoto => ({ name, type, size });
const ayni = async (x: SecilenFoto) => x;

test("telefonda yalnız kamera açan girdi yok: capture yalnız FotoTusu (kamera + galeri, çoklu) ve S.A.Y ataç menüsünde; kullananlar FotoTusu ile", () => {
  const kaynaklar = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.ok(kaynaklar.length > 50, "kaynak bulunamadı");
  assert.deepEqual(fotoTuslari(kaynaklar, oku("src/components/foto/FotoTusu.tsx"), FOTO_TUSU_KULLANANLAR), []);
});

test("yalnız JPEG / PNG, boş olmayan, çağıranın sınırı kadar; türü bildirilmeyen sunucuya bırakılır", () => {
  assert.equal(fotoUygun(f("a.jpg"), CHAT_FOTO_BAYT), true);
  assert.equal(fotoUygun(f("a.png", "image/png"), CHAT_FOTO_BAYT), true);
  assert.equal(fotoUygun(f("a", ""), CHAT_FOTO_BAYT), true, "tür bildirilmemiş: sunucu baytlardan denetler");
  assert.equal(fotoUygun(f("a.heic", "image/heic"), CHAT_FOTO_BAYT), false);
  assert.equal(fotoUygun(f("a.txt", "text/plain"), CHAT_FOTO_BAYT), false);
  assert.equal(fotoUygun(f("a.jpg", "image/jpeg", 0), CHAT_FOTO_BAYT), false, "boş dosya");
  assert.equal(fotoUygun(f("a.jpg", "image/jpeg", CHAT_FOTO_BAYT), CHAT_FOTO_BAYT), true);
  assert.equal(fotoUygun(f("a.jpg", "image/jpeg", CHAT_FOTO_BAYT + 1), CHAT_FOTO_BAYT), false, "S.A.Y Chat: 2 MB üstü");
  assert.equal(fotoUygun(f("a.jpg", "image/jpeg", CHAT_FOTO_BAYT + 1), TESLIM), true, "teslim fotoğrafı: 8 MB'a kadar");
  assert.equal(fotoUygun(f("a.jpg", "image/jpeg", TESLIM + 1), TESLIM), false);
});

test("çoklu seçim: küçültülmüş hâli denetlenir; uymayan ayrılır, yer kadar alınır, yer dolunca kalanlar küçültülmez", async () => {
  /* küçültme PNG'yi JPEG'e çevirir, büyük fotoğrafı küçültür — denetim küçültülmüş hâle */
  const kucult = async (x: SecilenFoto) => ({ ...x, type: x.type === "image/png" ? "image/jpeg" : x.type, size: Math.min(x.size, 900_000) });
  const s = await fotolariSec([f("1.png", "image/png", 9_000_000), f("2.heic", "image/heic"), f("3.jpg")], 12, kucult, CHAT_FOTO_BAYT);
  assert.deepEqual(s.alinan.map((x: SecilenFoto) => [x.name, x.type, x.size]), [["1.png", "image/jpeg", 900_000], ["3.jpg", "image/jpeg", 1000]]);
  assert.deepEqual(s.uygunsuz, ["2.heic"]);
  assert.equal(s.fazla, 0);

  let cagri = 0;
  const say = async (x: SecilenFoto) => { cagri++; return x; };
  const y = await fotolariSec([f("a.jpg"), f("b.txt", "text/plain"), f("c.jpg"), f("d.jpg"), f("e.jpg")], 2, say, CHAT_FOTO_BAYT);
  assert.deepEqual(y.alinan.map((x: SecilenFoto) => x.name), ["a.jpg", "c.jpg"], "uymayan yeri doldurmaz");
  assert.deepEqual(y.uygunsuz, ["b.txt"]);
  assert.equal(y.fazla, 2);
  assert.equal(cagri, 3, "yer dolunca kalanlar küçültülmez");

  const z = await fotolariSec([f("a.jpg"), f("b.jpg")], 0, ayni, CHAT_FOTO_BAYT);
  assert.deepEqual([z.alinan.length, z.fazla], [0, 2], "yer yok: hiçbiri alınmaz");
  assert.deepEqual([(await fotolariSec([f("a.jpg")], -3, ayni, CHAT_FOTO_BAYT)).fazla], [1], "eksi yer sıfır sayılır");
});

test("eklenmeyen söylenir (sessiz atlama yok); hepsi alındıysa uyarı yok; sınır çağıranın", async () => {
  const sinir = "Kayda en çok 12 ekipman fotoğrafı";
  assert.equal(fotoSecimiUyarisi(await fotolariSec([f("a.jpg")], 12, ayni, CHAT_FOTO_BAYT), sinir, CHAT_FOTO_BAYT), null);
  assert.equal(fotoSecimiUyarisi(await fotolariSec([f("notlar.txt", "text/plain")], 12, ayni, CHAT_FOTO_BAYT), sinir, CHAT_FOTO_BAYT),
    "notlar.txt eklenmedi: yalnız JPEG ya da PNG, en çok 2 MB.");
  assert.equal(fotoSecimiUyarisi(await fotolariSec([f("a.txt", "text/plain"), f("b.txt", "text/plain"), f("c.jpg"), f("d.jpg")], 1, ayni, CHAT_FOTO_BAYT), sinir, CHAT_FOTO_BAYT),
    "2 fotoğraf eklenmedi: yalnız JPEG ya da PNG, en çok 2 MB. Kayda en çok 12 ekipman fotoğrafı; 1 fotoğraf eklenmedi.");
  assert.equal(fotoSecimiUyarisi(await fotolariSec([f("pano.heic", "image/heic")], 10, ayni, TESLIM), "En çok 10 fotoğraf", TESLIM),
    "pano.heic eklenmedi: yalnız JPEG ya da PNG, en çok 8 MB.");
});
