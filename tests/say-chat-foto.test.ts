/* NEREDEN GELDİ: 527 — reisim 2026-10-13: "say chatte fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek olsun". Önceki
   tuşların hepsi capture'lı tek girdiydi: telefonda yalnız kamera açılıyordu. Kilit:
   · her S.A.Y Chat fotoğraf tuşu (yeni kayıt, "+ ek", etiket, okunacak başlık) FotoTusu — kamera VE galeri / bilgisayar (capture'sız, çoklu);
   · galeriden çoklu seçimde hangisi kayda girer (saf, src/modules/say-chat/foto-secim.ts): küçültmeden sonra yalnız JPEG / PNG (türü bildirilmeyeni
     sunucu denetler), boş olmayan, en çok 2 MB; kayıttaki yer kadar (yer dolunca kalanlar küçültülmez bile); eklenmeyen söylenir.
   Tarayıcıda: e2e/say-chat.spec.ts (menü, Esc, galeriden iki fotoğraf, metin dosyası eklenmez). Olumsuz kanıt: tests/bozan/say-chat-foto.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fotolariSec, fotoSecimiUyarisi, fotoUygun, type SecilenFoto } from "../src/modules/say-chat/foto-secim.ts";
import { CHAT_FOTO_BAYT } from "../src/modules/say-chat/sema.ts";
import { oku, sayChatFotoTuslari } from "./yardimci/denetimler.ts";

const f = (name: string, type = "image/jpeg", size = 1000): SecilenFoto => ({ name, type, size });
const ayni = async (x: SecilenFoto) => x;

test("her fotoğraf tuşu FotoTusu: kamera ve galeri / bilgisayar (çoklu); SayChat.tsx'te doğrudan dosya girdisi yok", () => {
  assert.deepEqual(sayChatFotoTuslari(oku("src/modules/say-chat/ui/SayChat.tsx"), oku("src/modules/say-chat/ui/FotoTusu.tsx")), []);
});

test("yalnız JPEG / PNG, boş olmayan, en çok 2 MB; türü bildirilmeyen sunucuya bırakılır", () => {
  assert.equal(fotoUygun(f("a.jpg")), true);
  assert.equal(fotoUygun(f("a.png", "image/png")), true);
  assert.equal(fotoUygun(f("a", "")), true, "tür bildirilmemiş: sunucu baytlardan denetler");
  assert.equal(fotoUygun(f("a.heic", "image/heic")), false);
  assert.equal(fotoUygun(f("a.txt", "text/plain")), false);
  assert.equal(fotoUygun(f("a.jpg", "image/jpeg", 0)), false, "boş dosya");
  assert.equal(fotoUygun(f("a.jpg", "image/jpeg", CHAT_FOTO_BAYT)), true);
  assert.equal(fotoUygun(f("a.jpg", "image/jpeg", CHAT_FOTO_BAYT + 1)), false, "2 MB üstü");
});

test("çoklu seçim: küçültülmüş hâli denetlenir; uymayan ayrılır, kayıttaki yer kadar alınır, yer dolunca kalanlar küçültülmez", async () => {
  /* küçültme PNG'yi JPEG'e çevirir, büyük fotoğrafı küçültür — denetim küçültülmüş hâle */
  const kucult = async (x: SecilenFoto) => ({ ...x, type: x.type === "image/png" ? "image/jpeg" : x.type, size: Math.min(x.size, 900_000) });
  const s = await fotolariSec([f("1.png", "image/png", 9_000_000), f("2.heic", "image/heic"), f("3.jpg")], 12, kucult);
  assert.deepEqual(s.alinan.map((x) => [x.name, x.type, x.size]), [["1.png", "image/jpeg", 900_000], ["3.jpg", "image/jpeg", 1000]]);
  assert.deepEqual(s.uygunsuz, ["2.heic"]);
  assert.equal(s.fazla, 0);

  let cagri = 0;
  const say = async (x: SecilenFoto) => { cagri++; return x; };
  const y = await fotolariSec([f("a.jpg"), f("b.txt", "text/plain"), f("c.jpg"), f("d.jpg"), f("e.jpg")], 2, say);
  assert.deepEqual(y.alinan.map((x) => x.name), ["a.jpg", "c.jpg"], "uymayan yeri doldurmaz");
  assert.deepEqual(y.uygunsuz, ["b.txt"]);
  assert.equal(y.fazla, 2);
  assert.equal(cagri, 3, "yer dolunca kalanlar küçültülmez");

  const z = await fotolariSec([f("a.jpg"), f("b.jpg")], 0, ayni);
  assert.deepEqual([z.alinan.length, z.fazla], [0, 2], "yer yok: hiçbiri alınmaz");
  assert.deepEqual([(await fotolariSec([f("a.jpg")], -3, ayni)).fazla], [1], "eksi yer sıfır sayılır");
});

test("eklenmeyen söylenir (sessiz atlama yok); hepsi alındıysa uyarı yok", async () => {
  const sinir = "Kayda en çok 12 ekipman fotoğrafı";
  assert.equal(fotoSecimiUyarisi(await fotolariSec([f("a.jpg")], 12, ayni), sinir), null);
  assert.equal(fotoSecimiUyarisi(await fotolariSec([f("notlar.txt", "text/plain")], 12, ayni), sinir),
    "notlar.txt eklenmedi: yalnız JPEG ya da PNG, en çok 2 MB.");
  assert.equal(fotoSecimiUyarisi(await fotolariSec([f("a.txt", "text/plain"), f("b.txt", "text/plain"), f("c.jpg"), f("d.jpg")], 1, ayni), sinir),
    "2 fotoğraf eklenmedi: yalnız JPEG ya da PNG, en çok 2 MB. Kayda en çok 12 ekipman fotoğrafı; 1 fotoğraf eklenmedi.");
});
