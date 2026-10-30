/* NEREDEN GELDİ: 2026-10-31, kalem 3 — E3 + E4 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; karar 2: sharp). 2026-10-28 canlı denemede S.A.Y
   CO2'yi KKT sandı, "012"yi "D12" okudu (yakınlaşamıyordu); 26 Ekim'de dört raporun hiçbirine fotoğraf eklenemedi. Bu kilit tutar: (1) pafta en çok 12
   karo, karo ≤ 480, görüntü ≤ 1600, numara köşede (yazı tipsiz çizim); (2) yakınlaştırma bölgeyi keser, uzun kenarı 1568'e getirir, gri + karşıtlık tek
   kanal, döndürme boyutu çevirir; (3) araçlar kişinin eklerinin depodaki kopyasından okur, kopyası olmayanı söyler; (4) görüntü araçları ekran aracından
   sonra sırayı bekler, işlem araçlarının ardında sabit sırada; rapora fotoğraf ekranın fotoEkle işleviyle. Olumsuz kanıt: tests/bozan/say-gorsel.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import sharp from "sharp";
import { fotoGosterAraci, fotoPaftaAraci, gosterGoruntusu, paftaGoruntusu } from "../src/modules/say/server/gorsel.ts";

export const foto = (w: number, h: number, renk = "#c03030") => sharp({ create: { width: w, height: h, channels: 3, background: renk } }).jpeg().toBuffer();
const boyut = async (b: Uint8Array) => { const m = await sharp(b).metadata(); return [m.width, m.height, m.channels]; };

test("pafta: karo sayısı ve boyu sınırlı, numara sol üst köşede (koyu zemin)", async () => {
  const l = await Promise.all([1, 2, 3].map(async (i) => ({ etiket: `F0${i}`, bayt: await foto(1200, 900) })));
  const p = await paftaGoruntusu(l, 4);
  assert.deepEqual(await boyut(p), [1440, 480, 3]);
  const piksel = (await sharp(p).extract({ left: 10, top: 10, width: 1, height: 1 }).raw().toBuffer())[0]!;
  assert.ok(piksel < 60, `numara zemini koyu olmalı: ${piksel}`);
  const cok = await paftaGoruntusu(await Promise.all(Array.from({ length: 15 }, async (_, i) => ({ etiket: `F${i + 1}`, bayt: await foto(400, 300) }))), 4);
  const [w, h] = await boyut(cok);
  assert.ok(w! <= 1600 && h! <= 1600, `${w}×${h}`);
  assert.deepEqual([w, h], [4 * 400, 3 * 400], "en çok 12 karo (4 × 3), karo 1600 / 4");
});

test("yakınlaştırma: bölge kesilir ve 1568'e büyütülür; gri + karşıtlık tek kanal; döndürme", async () => {
  const b = await foto(2000, 1000);
  assert.deepEqual((await boyut(await gosterGoruntusu(b))).slice(0, 2), [1568, 784]);
  const [bw, bh] = await boyut(await gosterGoruntusu(b, { bolge: [0.5, 0.5, 0.6, 0.55] }));
  assert.ok(bw === 1568 && bh! > 380 && bh! < 410, `200×50 bölge 1568 genişliğe: ${bw}×${bh}`);
  assert.equal((await boyut(await gosterGoruntusu(b, { gelistir: "gri_kontrast" })))[2], 1);
  assert.deepEqual((await boyut(await gosterGoruntusu(b, { dondur: 90 }))).slice(0, 2), [784, 1568]);
  assert.ok(await gosterGoruntusu(b, { bolge: [0.99, 0.99, 2, 2] }), "kenardaki ve taşan bölge düşmez");
});

const sahte = (satirlar: { ek_id: string; fno: string; ad: string; anahtar: string | null }[], depoda: Record<string, Uint8Array>) => ({
  db: { sorgu: async () => ({ rows: satirlar, rowCount: satirlar.length }) } as never,
  depo: { oku: async (a: string) => { if (!depoda[a]) throw new Error("yok"); return depoda[a]!; } } as never,
});

test("araçlar kişinin eklerinin kopyasından; kopyası olmayan söylenir; görüntü + yazı döner", async () => {
  const b = await foto(800, 600);
  const s = sahte([{ ek_id: "e1", fno: "1", ad: "kapi1.jpeg", anahtar: "k1" }, { ek_id: "e2", fno: "2", ad: "T4 etiket.jpeg", anahtar: null }], { k1: b });
  const p = await fotoPaftaAraci(s.db, s.depo, {});
  assert.ok(Array.isArray(p));
  assert.equal((p[0] as { type: string }).type, "image");
  assert.match((p[1] as { text: string }).text, /^Pafta 1\/1: F01 · kopyası yok: F02/);
  const g = await fotoGosterAraci(s.db, s.depo, { foto: "F01", bolge: [0, 0, 0.5, 0.5], gelistir: "gri_kontrast" });
  assert.ok(Array.isArray(g) && /F01 · kapi1\.jpeg · bölge 0\.00, 0\.00, 0\.50, 0\.50 · gri \+ karşıtlık/.test((g[1] as { text: string }).text));
  assert.match(String(await fotoGosterAraci(s.db, s.depo, { foto: "F02" })), /kopyası yok/);
  assert.match(String(await fotoGosterAraci(s.db, s.depo, { foto: "F09" })), /bu konuşmada yok/);
  assert.equal(await fotoPaftaAraci(sahte([], {}).db, s.depo, {}), "Bu konuşmada fotoğraf yok.");
});

test("kaynak kilidi: görüntü aracı ekran aracından sonra sırayı bekler; rapora fotoğraf ekranın işleviyle; sabit araç sırası", () => {
  const d = readFileSync("src/modules/say/server/dongu.ts", "utf8"), r = readFileSync("src/modules/raporlar/say-islemleri.ts", "utf8");
  const ekranda = d.indexOf("if (ekranda) { sonuclar[c.id]"), gorsel = d.indexOf("if (GORSEL_ARAC_ADLARI.has(c.name))");
  assert.ok(ekranda > 0 && gorsel > ekranda, "ekran aracından sonra gelen görüntü aracı bekler");
  assert.ok(d.includes("oturumIslemi(o, (db) => (ad === \"foto_pafta\" ? fotoPaftaAraci(db, depo(), girdi) : fotoGosterAraci(db, depo(), girdi)))"), "kişinin kendi işleminde");
  assert.ok(r.includes("fotoEkle(b.db, b.depo(), b.kim, b.firmaId, v.rapor, v.surum, { bolum, madde: null }, f)"), "ekranın fotoEkle'si");
  assert.ok(r.includes("fotoSil(b.db, b.kim, v.rapor, v.surum, v.dosya)"), "ekranın fotoSil'i");
  assert.ok(readFileSync("src/server/yz/say.ts", "utf8").includes("[...ISLEM_ARACLARI, ...GORSEL_ARACLARI, FORM_ARACI, EKRAN_ARACI,"), "sabit sıra");
});
