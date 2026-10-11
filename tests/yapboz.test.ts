/* NEREDEN GELDİ: 494 — hata listesi 29 + 46 maketi (https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ) onaylandı, reisim 2026-10-11: "mevcuttaki sistemi
   koruyalım gelişmiş seçenekler tuşu olsun ve tıklayınca buraya gitsin"; 46: "tam bir yapboz gibi olmalı ve kolay kullanışlı olmalı". Saf işlevler
   (src/modules/rapor-format/yapboz.ts): parça kutusu; parça bölümler arasına (bölüm, içinde bir başlangıç öğesiyle; tek alan → içinde o alanla bilgi
   bölümü) ya da bilgi bölümüne (alan) bırakılır; bölüm taşınır, kopyalanır — kimlikler tanımda tekil, sonuç şemadan geçer. Olumsuz kanıt:
   tests/bozan/yapboz.bozan.ts. Tarayıcıda: e2e/rapor-format.spec.ts (Gelişmiş seçenekler). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi, type Bolum } from "../src/format/tanim.ts";
import { kimlikler } from "../src/modules/rapor-format/kurucu.ts";
import { alanaParcaEkle, bolumKopyala, bolumuTasi, parcaBul, parcaGruplari, parcaYerlestir } from "../src/modules/rapor-format/yapboz.ts";

const T = FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const gecerli = (t: FormatTanimi) => { const r = FormatTanimi.safeParse(t); assert.ok(r.success, JSON.stringify(r.error?.issues)); };
/** tanımda tekil kimlikler (bölüm, alan, grup, madde, değer) tekil mi — sütunlar tablo içinde tekildir (şema), burada sayılmaz */
const tekil = (t: FormatTanimi) => {
  const l = t.bolumler.flatMap((b: Bolum) => [b.id, ...(b.blok === "bilgi" ? b.alanlar.map((a) => a.id) : b.blok === "liste" ? b.gruplar.flatMap((g) => [g.id, ...g.maddeler.map((m) => m.id)])
    : b.blok === "test" ? b.degerler.map((d) => d.id) : [])]);
  assert.equal(new Set(l).size, l.length, "kimlik iki kez");
};

test("parça kutusu: bölümler (cihaz bölümü varsa yok), altı tek alan, on kayıttan gelen alan", () => {
  const g = parcaGruplari(T);
  assert.deepEqual(g.map((x) => x.ad), ["Bölümler", "Tek alan · bir bilgi bölümüne", "Kayıttan gelen · bilgi bölümüne"]);
  assert.ok(T.bolumler.some((b) => b.blok === "cihaz"));
  assert.ok(!g[0].parcalar.some((p) => p.k === "b:cihaz"), "ölçüm cihazları bölümü tektir");
  assert.equal(g[0].parcalar.length, 9);
  const cihazsiz = { ...T, bolumler: T.bolumler.filter((b) => b.blok !== "cihaz") };
  assert.ok(parcaGruplari(cihazsiz)[0].parcalar.some((p) => p.k === "b:cihaz"));
  assert.equal(g[1].parcalar.length, 6);
  assert.equal(g[2].parcalar.length, 10);
  assert.equal(parcaBul(T, "a:sayi")?.ad, "Sayı");
  assert.equal(parcaBul(T, "x:yok"), null);
});

test("bölüm parçası bırakılan yere, içinde bir başlangıç öğesiyle; aynı parça iki kez bırakılsa da kimlikler tekil, şemadan geçer", () => {
  const x = parcaYerlestir(T, "b:liste", 2)!;
  assert.equal(x.t.bolumler[2].id, x.id);
  const b = x.t.bolumler[2];
  assert.ok(b.blok === "liste" && b.gruplar[0].maddeler.length === 1);
  const y = parcaYerlestir(x.t, "b:liste", 3)!;
  const o = parcaYerlestir(y.t, "b:olcum", 0)!;
  const ob = o.t.bolumler[0];
  assert.ok(ob.blok === "olcum" && ob.sutunlar.map((s) => s.giris).join() === "metin,sayi");
  for (const t of [x.t, y.t, o.t]) { gecerli(t); tekil(t); }
  assert.equal(parcaYerlestir(T, "b:cihaz", 0), null, "ikinci ölçüm cihazları bölümü yok");
});

test("tek alan bölümler arasına: içinde o alanla yeni bilgi bölümü; bilgi bölümüne: alan o bölüme; başka bölüme olmaz", () => {
  const x = parcaYerlestir(T, "a:tarih", 1)!;
  const b = x.t.bolumler[1];
  assert.ok(b.blok === "bilgi" && b.alanlar.length === 1 && b.alanlar[0].tur === "tarih" && b.alanlar[0].id === x.id);
  const bi = T.bolumler.findIndex((y) => y.blok === "bilgi" && y.id === "ekipman");
  const s = alanaParcaEkle(T, bi, "a:secim")!;
  const sb = s.t.bolumler[bi];
  assert.ok(sb.blok === "bilgi");
  const yeni = sb.alanlar[sb.alanlar.length - 1];
  assert.deepEqual([yeni.id, yeni.tur, yeni.secenekler], [s.id, "secim", ["Seçenek 1", "Seçenek 2"]]);
  const k = alanaParcaEkle(T, bi, "k:seri_no")!;
  const kb = k.t.bolumler[bi];
  assert.ok(kb.blok === "bilgi" && kb.alanlar[kb.alanlar.length - 1].kaynak === "seri_no");
  const li = T.bolumler.findIndex((y) => y.blok === "liste");
  assert.equal(alanaParcaEkle(T, li, "a:metin"), null);
  for (const t of [x.t, s.t, k.t]) { gecerli(t); tekil(t); }
});

test("bölüm taşı: yerin önüne; kendi yeri ya da bir sonrası değiştirmez", () => {
  const ad = (t: FormatTanimi) => t.bolumler.map((b) => b.id);
  const once = ad(T), id = once[1];
  assert.equal(bolumuTasi(T, id, 1), T);
  assert.equal(bolumuTasi(T, id, 2), T);
  assert.deepEqual(ad(bolumuTasi(T, id, 0)), [id, once[0], ...once.slice(2)]);
  assert.deepEqual(ad(bolumuTasi(T, id, once.length)), [once[0], ...once.slice(2), id]);
  assert.deepEqual(ad(bolumuTasi(T, id, 4)), [once[0], once[2], once[3], id, ...once.slice(4)]);
  assert.equal(bolumuTasi(T, "yok", 0), T);
});

test("bölüm kopyası: hemen altına, iç kimlikler yeni (tablo sütunları tablo içinde — aynı), Bakanlık işareti yok, ad (kopya); cihaz ve ekipman bölümü kopyalanmaz", () => {
  const z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
  const li = z.bolumler.findIndex((b) => b.blok === "olcum" && b.kilit);
  assert.ok(li >= 0, "ZPKR02'de Bakanlık ölçüm tablosu");
  const x = bolumKopyala(z, li)!;
  const k = x.t.bolumler[li + 1];
  assert.equal(k.id, x.id);
  assert.equal(k.ad, `${z.bolumler[li].ad} (kopya)`);
  assert.equal(k.kilit, false);
  const once = kimlikler(z);
  assert.ok(!once.has(k.id), "bölüm kimliği yeni");
  /* sütun kimlikleri TABLO İÇİNDE tekil (ZPKR02'nin iki tablosunda "faz", "yer") — kopya aynı sütunları, hesabıyla taşır */
  const asil = z.bolumler[li];
  assert.ok(k.blok === "olcum" && asil.blok === "olcum");
  assert.deepEqual([k.sutunlar.map((s) => s.id), k.hesap], [asil.sutunlar.map((s) => s.id), asil.hesap]);
  gecerli(x.t);
  /* kontrol listesi kopyası: grup ve madde kimlikleri yeni (cevaplar.madde bütün raporda kimlikle) */
  const ki = z.bolumler.findIndex((b) => b.blok === "liste");
  const y = bolumKopyala(z, ki)!;
  const yb = y.t.bolumler[ki + 1];
  assert.ok(yb.blok === "liste" && yb.gruplar.every((g) => !once.has(g.id) && g.maddeler.every((m) => !once.has(m.id) && !m.kilit)));
  gecerli(y.t); tekil(y.t);
  assert.equal(bolumKopyala(T, T.bolumler.findIndex((b) => b.blok === "cihaz")), null);
});
