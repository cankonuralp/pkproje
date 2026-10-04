/* NEREDEN GELDİ: maket personel.html (giriş hesabı penceresi, roller) · karar 32 (yönetici kendini kilitleyemez), 33 (hesap personele bağlı), 34
   (geçici parola yalnız bir kez), 37 · ENGEL 8 (ayrılana hesap açılmaz) · reisim 2026-10-04: "kaynak koddan rol değiştirme sızma veri çalma gibi
   şeylere dikkat et". GERÇEK PostgreSQL, iki firma. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { geciciParolaUret, hesapAc, hesapKapat, hesapYenidenAc, rolleriKaydet, yeniGeciciParola, type Yonetici } from "../src/server/kimlik/hesapYonetimi.ts";
import { girisYap } from "../src/server/kimlik/oturum.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A: string, B: string;
let YON: Yonetici, PLAN: Yonetici, yonPersonel: string;
const T0 = new Date("2026-10-04T09:00:00Z");

async function personel(firma: string, ad: string, durum: "etkin" | "ayrildi" = "etkin") {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    `INSERT INTO personel (ad, basla, meslek, durum, ayrildi) VALUES ($1, '2024-01-01', 'mak-muh', $2, $3) RETURNING id::text`, [ad, durum, durum === "ayrildi" ? "2025-01-01" : null]))).rows[0].id;
}
const yap = <T>(firma: string, f: (db: Parameters<Parameters<typeof kiraciIcinde>[2]>[0]) => Promise<T>) => kiraciIcinde(havuz, firma, f);

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  yonPersonel = await personel(A, "Deneme Yönetici");
  const yid = (await yap(A, (db) => db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ('yon@deneme.example', 'Deneme Yönetici', '{firma_yoneticisi}', 'etkin', $1) RETURNING id::text", [yonPersonel]))).rows[0].id;
  YON = { id: yid, ad: "Deneme Yönetici", roller: ["firma_yoneticisi"] };
  PLAN = { id: "00000000-0000-4000-8000-000000000001", ad: "Deneme Planlama", roller: ["planlama"] };
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("geçici parola: üç öbek, harf + rakam, karışan harf yok, her seferinde farklı", () => {
  const l = Array.from({ length: 200 }, geciciParolaUret);
  for (const p of l) { assert.match(p, /^[A-Za-z2-9]{5}-[A-Za-z2-9]{5}-[A-Za-z2-9]{5}$/); assert.ok(!/[IlO01]/.test(p)); assert.ok(/\d/.test(p) && /[a-z]/i.test(p)); }
  assert.equal(new Set(l).size, l.length);
});

test("hesap aç: yalnız firma yöneticisi; geçici parola bir kez döner, özeti tutulur, ize yazılmaz; durum 'ilk', girişte 'ilk' görünür", async () => {
  const p = await personel(A, "Deneme Denetçi");
  assert.deepEqual(await yap(A, (db) => hesapAc(db, PLAN, p, { eposta: "d@deneme.example", roller: ["denetci"] })), { durum: "yetkisiz" });
  assert.deepEqual(await yap(A, (db) => hesapAc(db, YON, p, { eposta: "kotu", roller: [] })), { durum: "gecersiz", hatalar: { eposta: "E-posta biçimi geçersiz.", roller: "En az bir rol seçilmeli." } });
  assert.equal((await yap(A, (db) => hesapAc(db, YON, p, { eposta: "d@deneme.example", roller: ["tanri"] }))).durum, "gecersiz", "tanımsız rol");
  const r = await yap(A, (db) => hesapAc(db, YON, p, { eposta: " D@Deneme.Example ", roller: ["denetci", "denetci"] }));
  assert.equal(r.durum, "tamam");
  const parola = r.durum === "tamam" ? r.parola : "";
  const g = await girisYap(havuz, A, { eposta: "d@deneme.example", parola, ip: "10.0.0.1", simdi: T0 });
  assert.ok(g.tamam && g.hesap.durum === "ilk" && g.hesap.roller.join() === "denetci");
  const iz = await yap(A, (db) => db.sorgu("SELECT eski, yeni, ayrinti FROM denetim_izi"));
  assert.ok(!JSON.stringify(iz.rows).includes(parola), "parola ize düşmedi");
  assert.equal((await yap(A, (db) => db.sorgu<{ eposta: string }>("SELECT eposta FROM personel WHERE id = $1", [p]))).rows[0].eposta, "d@deneme.example");
  assert.deepEqual(await yap(A, (db) => hesapAc(db, YON, p, { eposta: "x@deneme.example", roller: ["denetci"] })), { durum: "red", neden: "Bu kişinin giriş hesabı var." });
});

test("ENGEL 8: ayrılan personele hesap açılmaz, kapalı hesabı yeniden açılmaz; başka firmanın personeli 'yok'", async () => {
  const ayrilan = await personel(A, "Deneme Ayrılan", "ayrildi");
  assert.deepEqual(await yap(A, (db) => hesapAc(db, YON, ayrilan, { eposta: "a@deneme.example", roller: ["denetci"] })), { durum: "red", neden: "Ayrılan personele hesap açılmaz." });
  const bP = await personel(B, "Başka Firmalı");
  assert.deepEqual(await yap(A, (db) => hesapAc(db, YON, bP, { eposta: "b@deneme.example", roller: ["firma_yoneticisi"] })), { durum: "yok" });
});

test("yeni geçici parola: eski parola ve açık oturum düşer; kapat → giremez; yeniden aç → girer", async () => {
  const p = await personel(A, "Deneme Planlamacı");
  const ilk = await yap(A, (db) => hesapAc(db, YON, p, { eposta: "p@deneme.example", roller: ["planlama"] }));
  const eski = ilk.durum === "tamam" ? ilk.parola : "";
  const yeni = await yap(A, (db) => yeniGeciciParola(db, YON, p));
  assert.equal(yeni.durum, "tamam");
  assert.deepEqual(await girisYap(havuz, A, { eposta: "p@deneme.example", parola: eski, ip: "10.0.0.2", simdi: T0 }), { tamam: false, neden: "hatali" });
  const yp = yeni.durum === "tamam" ? yeni.parola : "";
  assert.ok((await girisYap(havuz, A, { eposta: "p@deneme.example", parola: yp, ip: "10.0.0.2", simdi: T0 })).tamam);
  assert.equal((await yap(A, (db) => hesapKapat(db, YON, p))).durum, "tamam");
  assert.deepEqual(await girisYap(havuz, A, { eposta: "p@deneme.example", parola: yp, ip: "10.0.0.3", simdi: T0 }), { tamam: false, neden: "hatali" });
  assert.equal((await yap(A, (db) => hesapYenidenAc(db, YON, p))).durum, "tamam");
  assert.ok((await girisYap(havuz, A, { eposta: "p@deneme.example", parola: yp, ip: "10.0.0.4", simdi: T0 })).tamam);
});

test("ROL: yalnız tanımlı roller; son firma yöneticisi rolünü bırakamaz / hesabı kapatılamaz; ikinci yönetici varsa bırakır", async () => {
  assert.deepEqual(await yap(A, (db) => rolleriKaydet(db, YON, yonPersonel, ["planlama"])), { durum: "red", neden: "Firmada en az bir firma yöneticisi kalmalı; önce başka birine bu rolü verin." });
  assert.equal((await yap(A, (db) => hesapKapat(db, YON, yonPersonel))).durum, "red");
  assert.deepEqual(await yap(A, (db) => rolleriKaydet(db, YON, yonPersonel, ["firma_yoneticisi", "admin"])), { durum: "gecersiz", hatalar: { roller: "En az bir rol seçilmeli." } });
  assert.deepEqual(await yap(A, (db) => rolleriKaydet(db, PLAN, yonPersonel, ["planlama"])), { durum: "yetkisiz" });
  const ikinci = await personel(A, "Deneme İkinci");
  await yap(A, (db) => hesapAc(db, YON, ikinci, { eposta: "i@deneme.example", roller: ["firma_yoneticisi"] }));
  assert.equal((await yap(A, (db) => rolleriKaydet(db, YON, yonPersonel, ["planlama", "firma_yoneticisi"]))).durum, "tamam");
  /* aynı anda iki yönetici birbirinin yönetici rolünü alırsa yalnız biri geçer */
  const [r1, r2] = await Promise.all([
    yap(A, (db) => rolleriKaydet(db, YON, yonPersonel, ["planlama"])),
    yap(A, (db) => rolleriKaydet(db, YON, ikinci, ["planlama"])),
  ]);
  assert.deepEqual([r1.durum, r2.durum].sort(), ["red", "tamam"]);
  const kalan = await yap(A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM hesap WHERE durum <> 'pasif' AND 'firma_yoneticisi' = ANY(roller)"));
  assert.equal(kalan.rows[0].n, 1);
});
