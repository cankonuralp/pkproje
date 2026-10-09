/* NEREDEN GELDİ: 459 — reisim 2026-10-09: "sabit olan tek şey firma bilgileri, cihazlar ve standartlar ekipman türü sayfasından seçilirse otomatik
   olarak gelsin güncellensin şablon". Format kurucuda ölçüm cihazları bölümü sabit (src/format/duzen.ts cihazBolumuEkle; kurucu.ts bolumSil
   silmez); türün kontrol metodu standartları ve ölçüm cihazı türleri kâğıda ve belge önizlemesine kendiliğinden gelir (kurucuOrnegi → belge). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { cihazBolumuEkle, kurucuyaHazirla, raporDuzeni } from "../src/format/duzen.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi } from "../src/format/tanim.ts";
import { bolumSil } from "../src/modules/rapor-format/kurucu.ts";
import { kurucuOrnegi } from "../src/modules/rapor-format/ui/kurucuOrnegi.ts";

const metin = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

test("ölçüm cihazları bölümü sabit: yoksa 2. bölümden hemen sonra (3) eklenir, varsa dokunulmaz; kurucuda silinmez", () => {
  const komp = SABLONLAR.KOMPRESOR.tanim;
  const cihazsiz = FormatTanimi.parse({ ...komp, bolumler: komp.bolumler.filter((b) => b.blok !== "cihaz") });
  const y = cihazBolumuEkle(cihazsiz);
  assert.equal(FormatTanimi.safeParse(y).success, true);
  assert.deepEqual(raporDuzeni(y, false).bolumler.slice(0, 2).map((x) => [x.no, x.b.ad]), [["3", "Ölçüm cihazları"], ["4", "Muayene kriterleri"]]);
  assert.equal(cihazBolumuEkle(y), y, "ikinci kez eklenmez");
  for (const s of Object.values(SABLONLAR)) assert.equal(cihazBolumuEkle(s.tanim), s.tanim, `${s.ad}: cihaz bölümü zaten var`);
  /* kimlik çakışmaz */
  const cakisan = FormatTanimi.parse({ ...cihazsiz, bolumler: cihazsiz.bolumler.map((b) => (b.id === "kriter" ? { ...b, id: "cihaz" } : b)) });
  assert.equal(FormatTanimi.safeParse(cihazBolumuEkle(cakisan)).success, true);
  /* silinmez (kilitli olmasa da) */
  const i = komp.bolumler.findIndex((b) => b.blok === "cihaz");
  assert.equal(komp.bolumler[i].kilit, false);
  assert.equal(bolumSil(komp, i), komp);
  assert.equal(kurucuyaHazirla(kurucuyaHazirla(cihazsiz)).bolumler.filter((b) => b.blok === "cihaz").length, 1);
});

test("belge önizlemesi: türün kontrol metodu standartları metot satırında, ölçüm cihazı türleri cihaz tablosunda — türden kendiliğinden", () => {
  const t = kurucuyaHazirla(SABLONLAR.KOMPRESOR.tanim);
  const m = metin(renderToStaticMarkup(raporBelgesi(kurucuOrnegi(t, { ad: "Hava tankı", kod: "HT", std: ["TS EN 13445-5"], cihaz: ["Manometre", "Ultrasonik kalınlık ölçer"] })) as never));
  assert.match(m, /Periyodik kontrol metodu ve kapsamı TS EN 13445-5/);
  assert.match(m, /Manometre sahada seçilir/);
  assert.match(m, /Ultrasonik kalınlık ölçer sahada seçilir/);
  /* tür değişince önizleme de değişir (aynı tanım) */
  const bos = metin(renderToStaticMarkup(raporBelgesi(kurucuOrnegi(t, { ad: "Hava tankı", kod: "HT", std: [], cihaz: [] })) as never));
  assert.doesNotMatch(bos, /TS EN 13445-5|sahada seçilir/);
});
