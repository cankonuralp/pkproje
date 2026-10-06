/* NEREDEN GELDİ: RAPOR-FORMAT.md §6 Format kurucu (maket maket-kurucu.js kb-ekle / kb-yukari / kb-asagi / kb-sil / kb-alan-ekle / kb-madde-ekle /
   kb-sutun-ekle / kb-oge-sil) + §7 "cevaplar bölüm / alan kimlikleriyle saklanır, sıra değişse de bozulmaz" + §3 "Bakanlık formatlı türde zorunlu
   alanlar kilitli — silinemez". Saf düzenleme işlemleri (K4; veritabanısız): her adımdan sonra tanım şemadan geçer, yeni kimlik tekil, kilitli
   bölüm / öğe silinmez. Sunucunun taslak kaydı ve yayın engeli tests/rapor-format.test.ts. Olumsuz kanıt tests/bozan/format-kurucu.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { BLOKLAR, FormatTanimi } from "../src/format/tanim.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { bolumAdi, bolumOgeleri, bolumSil, kimlikler, ogeEkle, ogeSil, tasi, yeniBolum, yeniKimlik } from "../src/modules/rapor-format/kurucu.ts";

const zpkr02 = () => structuredClone(SABLONLAR.ZPKR02.tanim);
const gecerli = (t: unknown) => { const r = FormatTanimi.safeParse(t); assert.ok(r.success, JSON.stringify(!r.success && r.error.issues.slice(0, 3))); };

test("her blok eklenir; yeni kimlikler tanımda tekil ve tanım şemadan geçer", () => {
  let t = zpkr02();
  const once = kimlikler(t).size;
  for (const b of BLOKLAR) t = { ...t, bolumler: [...t.bolumler, yeniBolum(t, b, `Deneme ${b}`)] };
  gecerli(t);
  assert.equal(t.bolumler.length, SABLONLAR.ZPKR02.tanim.bolumler.length + BLOKLAR.length);
  assert.ok(kimlikler(t).size > once);
  const liste = t.bolumler.at(-BLOKLAR.length + BLOKLAR.indexOf("liste"))!;
  assert.ok(liste.blok === "liste" && liste.cevaplar.length === 3 && liste.gruplar.length === 1);
  assert.notEqual(yeniKimlik(t, "b"), t.bolumler.at(-1)!.id);
});

test("öğe ekle / sil: alan, madde (son gruba), sütun, değer; kilitli öğe ve kilitli ölçüm tablosunun sütunu silinmez", () => {
  let t = zpkr02();
  t = { ...t, bolumler: [...t.bolumler, yeniBolum(t, "bilgi", "Ek bilgiler")] };
  t = { ...t, bolumler: [...t.bolumler, yeniBolum(t, "olcum", "Ek ölçüm")] };   // ekran bölümleri birer birer ekler
  const bi = t.bolumler.length - 2, oi = t.bolumler.length - 1;
  t = ogeEkle(t, bi, "  Deneme   alanı "); t = ogeEkle(t, bi, "İkinci"); t = ogeEkle(t, oi, "Direnç");
  t = ogeEkle(t, bi, "   ");
  gecerli(t);
  assert.deepEqual(bolumOgeleri(t.bolumler[bi]).map((x) => x.ad), ["Deneme alanı", "İkinci"], "ad kırpılır, boş eklenmez");
  const ilk = bolumOgeleri(t.bolumler[bi])[0].id;
  t = ogeSil(t, bi, ilk);
  assert.deepEqual(bolumOgeleri(t.bolumler[bi]).map((x) => x.ad), ["İkinci"]);
  /* kilitli: Gözle kontrol maddeleri, ölçüm noktaları sütunları */
  const gozle = t.bolumler.findIndex((b) => b.id === "gozle"), nokta = t.bolumler.findIndex((b) => b.blok === "olcum" && b.kilit);
  const madde = bolumOgeleri(t.bolumler[gozle])[0];
  assert.ok(madde.kilit);
  assert.equal(bolumOgeleri(ogeSil(t, gozle, madde.id).bolumler[gozle]).length, bolumOgeleri(t.bolumler[gozle]).length, "kilitli madde silinmez");
  const sutun = bolumOgeleri(t.bolumler[nokta])[0];
  assert.equal(bolumOgeleri(ogeSil(t, nokta, sutun.id).bolumler[nokta]).length, bolumOgeleri(t.bolumler[nokta]).length, "kilitli tablonun sütunu silinmez");
  /* kilitli bölüme yeni madde eklenebilir (RAPOR-FORMAT §3: yalnız sırası / görünümü değişir; yeni kilitsiz öğe serbest) */
  const t2 = ogeEkle(t, gozle, "Firmanın ek maddesi");
  gecerli(t2);
  assert.equal(bolumOgeleri(t2.bolumler[gozle]).at(-1)!.kilit, false);
});

test("bölüm sırala, sil, adlandır: kilitli bölüm silinmez, adı değişmez; sıra değişince kimlikler aynı", () => {
  const t = zpkr02();
  const k = t.bolumler.findIndex((b) => b.kilit), s = tasi(t.bolumler, 0, 2);
  assert.deepEqual(s.map((b) => b.id).sort(), t.bolumler.map((b) => b.id).sort());
  assert.equal(s[2].id, t.bolumler[0].id);
  assert.deepEqual(tasi(t.bolumler, 0, 99).map((b) => b.id), t.bolumler.map((b) => b.id), "sınır dışı taşıma değiştirmez");
  assert.equal(bolumSil(t, k), t, "kilitli bölüm silinmez");
  assert.equal(bolumAdi(t, k, "Başka ad"), t, "kilitli bölümün adı değişmez");
  const y = { ...t, bolumler: [...t.bolumler, yeniBolum(t, "not", "Yorum")] }, n = y.bolumler.length - 1;
  assert.equal(bolumAdi(y, n, "Uzman yorumu").bolumler[n].ad, "Uzman yorumu");
  assert.equal(bolumSil(y, n).bolumler.length, t.bolumler.length);
  /* boş ad şemadan geçmez (sunucu yazmaz, ekran nedenini söyler) */
  assert.equal(FormatTanimi.safeParse(bolumAdi(y, n, "  ")).success, false);
});
