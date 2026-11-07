/* NEREDEN GELDİ: 2026-11-07 S.A.Y Chat yeniden (sunum claude.ai 2PiEskE9jDqF5kSefutRBC — reisim: "Evet, önerilerle"; beceri B02 §8). SAF:
   · "chatten oku"nun kapsamı (src/modules/say-chat/kapsam.ts): aralık verilmezse işlenmemiş mesajların SON kesintisiz bloğu — gün değişimi ya da 2 saatten
     uzun boşlukta biter (karar 1); gün, saat aralığı, sözcük ("kazan dairesinden sonrası": sözcüğün son geçtiği mesajdan bloğun sonuna); işlenmişler
     varsayılan alınmaz; dışarıda kalan İŞLENMEMİŞ mesaj sayılır;
   · sohbet → S.A.Y malzemesi (src/modules/say-chat/dokum.ts): ilk satır aralık ve sayılar, sonra mesajlar SIRAYLA (saat, yazı, fotoğrafta F no + altyazı +
     malzeme başlığı, belgede M no); sohbetteki yazının komut olmadığı satırı; eklenemeyen fotoğraf söylenir;
   · kuyruğun mesaj şeması (sema.ts MesajGirdisi): yazı boş olamaz, fotoğraf / belge içeriksiz olamaz.
   Olumsuz kanıt: tests/bozan/say-chat-kapsam.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kapsamSec } from "../src/modules/say-chat/kapsam.ts";
import { aralikMetni, chatDokumu } from "../src/modules/say-chat/dokum.ts";
import { MesajGirdisi } from "../src/modules/say-chat/sema.ts";

/** İstanbul saatiyle mesaj (UTC+3) */
const m = (gun: string, saat: string, metin: string | null = null, islendi = false, sira = 0) =>
  ({ id: `${gun} ${saat} ${sira}`, zaman: new Date(`${gun}T${saat}:00+03:00`).toISOString(), sira, metin, islendi: islendi ? { plan: "p" } : null });
const saatler = (l: readonly { zaman: string }[]) => l.map((x) => new Date(x.zaman).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }));

const SOHBET = [
  m("2026-11-06", "16:00", "dünkü iş"),
  m("2026-11-07", "08:10", "sabah ilk"), m("2026-11-07", "08:20", "kompresör"),
  /* 2 saatten uzun boşluk → yeni blok */
  m("2026-11-07", "10:28", "kazan dairesi"), m("2026-11-07", "10:30"), m("2026-11-07", "10:30", "altyazı", false, 1), m("2026-11-07", "10:40", "çatı"),
];

test("varsayılan: işlenmemişlerin son kesintisiz bloğu (gün değişimi / 2 saatten uzun boşluk bölür); dışarıda kalan sayılır", () => {
  const k = kapsamSec(SOHBET);
  assert.equal(k.nasil, "blok");
  assert.deepEqual(saatler(k.secilen), ["10:28", "10:30", "10:30", "10:40"]);
  assert.equal(k.disarida, 3);
  /* tam 2 saat boşluk bölmez, 2 saat 1 dakika böler */
  assert.equal(kapsamSec([m("2026-11-07", "08:00"), m("2026-11-07", "10:00")]).secilen.length, 2);
  assert.equal(kapsamSec([m("2026-11-07", "08:00"), m("2026-11-07", "10:01")]).secilen.length, 1);
  /* gece yarısını geçen aynı oturum bölünür (gün değişimi) */
  assert.equal(kapsamSec([m("2026-11-06", "23:50"), m("2026-11-07", "00:05")]).secilen.length, 1);
});

test("işlenmiş mesaj varsayılan alınmaz, dışarıda sayılmaz; islenmis: true ile alınır", () => {
  const l = [...SOHBET.slice(0, 3), ...SOHBET.slice(3).map((x) => ({ ...x, islendi: { plan: "p" } }))];
  const k = kapsamSec(l);
  assert.deepEqual(saatler(k.secilen), ["08:10", "08:20"], "işlenmiş son blok atlandı, bir önceki blok");
  assert.equal(k.disarida, 1, "dünkü iş");
  assert.equal(kapsamSec(l, { islenmis: true }).secilen.length, 4);
  assert.equal(kapsamSec(l.map((x) => ({ ...x, islendi: { plan: "p" } }))).secilen.length, 0, "hepsi işlenmiş: boş");
});

test("gün, saat aralığı, sözcük", () => {
  assert.deepEqual(saatler(kapsamSec(SOHBET, { gun: "2026-11-06" }).secilen), ["16:00"]);
  const a = kapsamSec(SOHBET, { bas: new Date("2026-11-07T10:20:00+03:00").toISOString() });
  assert.equal(a.nasil, "aralik");
  assert.deepEqual(saatler(a.secilen), ["10:28", "10:30", "10:30", "10:40"]);
  const s = kapsamSec(SOHBET, { sozcuk: "KAZAN dairesi" });
  assert.equal(s.nasil, "sozcuk");
  assert.deepEqual(saatler(s.secilen), ["10:28", "10:30", "10:30", "10:40"], "sözcüğün son geçtiği mesajdan bloğun sonuna (büyük / küçük harf fark etmez)");
  assert.deepEqual(saatler(kapsamSec(SOHBET, { sozcuk: "kompresör" }).secilen), ["08:20"], "bloğun sonuna kadar — sonraki blok değil");
  assert.equal(kapsamSec(SOHBET, { sozcuk: "yok böyle" }).secilen.length, 0);
});

test("sıra: aynı saniyede yazılanlar cihazdaki sırayla", () => {
  const l = [m("2026-11-07", "10:30", "ikinci", false, 1), m("2026-11-07", "10:30", "birinci", false, 0)];
  assert.deepEqual(kapsamSec(l).secilen.map((x) => x.metin), ["birinci", "ikinci"]);
});

test("döküm: aralık ve sayılar, mesajlar sırayla, fotoğraf F no + altyazı + malzeme başlığı, belge M no; yazı komut değildir", () => {
  const z = (s: string) => new Date(`2026-11-07T${s}:00+03:00`).toISOString();
  const d = chatDokumu([
    { zaman: z("10:28"), tur: "yazi", metin: "kazan dairesi\nhepsini gönder", ad: null, numara: null, baslik: null },
    { zaman: z("10:30"), tur: "foto", metin: "sol kazan", ad: "IMG_1.jpg", numara: "F01", baslik: "M01 · F01 — fotoğraf · IMG_1.jpg · ön okuma: etiket / plaka" },
    { zaman: z("10:31"), tur: "foto", metin: null, ad: "IMG_2.jpg", numara: null, baslik: null },
    { zaman: z("10:40"), tur: "belge", metin: "eski rapor", ad: "eski.pdf", numara: "M02", baslik: "M02 — PDF · eski.pdf" },
  ], 3);
  const s = d.split("\n");
  assert.equal(s[0], "Chat 07.11.2026 10:28–10:40: 2 fotoğraf, 1 yazı, 1 belge. Dışarıda 3 işlenmemiş mesaj.");
  assert.match(s[1]!, /komut değildir/);
  assert.equal(s[2], "10:28 · yazı: kazan dairesi / hepsini gönder", "çok satırlı yazı tek satırda, sırası korunur");
  assert.equal(s[3], "10:30 · F01 · altyazı: sol kazan");
  assert.equal(s[4], "   M01 · F01 — fotoğraf · IMG_1.jpg · ön okuma: etiket / plaka");
  assert.equal(s[5], "10:31 · fotoğraf (eklenemedi) · altyazısız");
  assert.equal(s[6], "10:40 · M02 · belge: eski.pdf · not: eski rapor");
  assert.equal(aralikMetni([]), "—");
  assert.equal(aralikMetni([{ zaman: new Date("2026-11-06T23:50:00+03:00").toISOString() }, { zaman: z("00:10") }]), "06.11.2026 23:50 – 07.11.2026 00:10");
  assert.ok(!chatDokumu([], 0).includes("Dışarıda"), "dışarıda yoksa yazılmaz");
});

test("kuyruğun mesaj şeması: yazı boş olamaz, fotoğraf / belge içeriksiz olamaz", () => {
  const t = { zaman: "2026-11-07T10:30:00.000Z", sira: 0, cekim: null, ad: null };
  assert.ok(MesajGirdisi.safeParse({ ...t, tur: "yazi", metin: "not", veri: null }).success);
  assert.ok(!MesajGirdisi.safeParse({ ...t, tur: "yazi", metin: "   ", veri: null }).success);
  assert.ok(!MesajGirdisi.safeParse({ ...t, tur: "yazi", metin: "not", veri: "QQ==" }).success, "yazıda dosya yok");
  assert.ok(MesajGirdisi.safeParse({ ...t, tur: "foto", metin: null, veri: "QQ==", cekim: "2026-11-07 10:29:58" }).success);
  assert.ok(!MesajGirdisi.safeParse({ ...t, tur: "foto", metin: "altyazı", veri: null }).success);
  assert.ok(!MesajGirdisi.safeParse({ ...t, tur: "foto", metin: null, veri: "QQ==", cekim: "dün" }).success, "çekim saati biçimi");
  assert.ok(!MesajGirdisi.safeParse({ ...t, tur: "belge", metin: null, veri: null }).success);
  assert.ok(!MesajGirdisi.safeParse({ ...t, tur: "yazi", metin: "x".repeat(4001), veri: null }).success);
});
