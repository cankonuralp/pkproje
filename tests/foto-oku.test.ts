/* NEREDEN GELDİ: 351 — saha raporunda fotoğraftan okuma (maket rapor.html Z3; ARKA-UC §5.1–5.2, K1; §8.10 değer öneri; 09-G3 istisnası "firma
   ayarıyla açılır, başlangıçta kapalı; çağrı yalnız sunucudan, firmanın anahtarıyla"; firma ayarı "kişi başı aylık sınır"). GERÇEK PostgreSQL, iki
   firma: kapalıyken / anahtarsızken okunmaz; yalnız yazan, Yeni raporunda, ölçüm tablosunda; fotoğrafın konum bilgisi gönderilmez; maliyet kişinin
   aylık kullanımına yazılır, sınır dolunca okunmaz; kullanım yalnız artar, başkasının hanesine yazılamaz, okuma kaydı değişmez; başka firma görmez.
   Olumsuz kanıt: tests/bozan/foto-oku.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { planKabul, planIci } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { fotoOkuHazirla, fotoOkuKaydet } from "../src/modules/raporlar/server/foto-oku.ts";
import { raporOlustur, sahaRaporu } from "../src/modules/raporlar/server/raporlar.ts";
import { ayarOku, ayarYaz } from "../src/server/ayar/ayar.ts";
import { sirYaz } from "../src/server/ayar/sir.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { yzAyi } from "../src/server/yz/kullanim.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "foto-oku-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
/* uydurma JPEG: konum bilgisi taşıyan APP1 (EXIF) parçasıyla — gönderilen fotoğrafta olmamalı */
const bayt = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const seg = (isaret: number, govde: string) => bayt([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 0xff], govde);
const JPEG = bayt([0xff, 0xd8], [...seg(0xe1, "Exif\0\0GPS-KONUM-41.0082N")], [...seg(0xdb, "\0" + "\x01".repeat(64))], [0xff, 0xda, 0, 2], "goruntu-verisi", [0xff, 0xd9]);
const PDF = bayt("%PDF-1.4\n%%EOF\n");
const TIP = SABLONLAR.ZPKR02.tanim.bolumler.flatMap((b) => (b.blok === "olcum" && b.id === "linye" ? b.sutunlar : [])).find((s) => s.id === "tip")!.secenekler![0];
const cevap = (satirlar: unknown[], giris = 100_000, cikis = 10_000) => ({ content: [{ type: "tool_use", name: "tablo", input: { satirlar } }], usage: { input_tokens: giris, output_tokens: cikis } });

interface Firma { yon: Kisi; plan: Kisi; den1: Kisi; den2: Kisi; rapor: string }
let FA: Firma, FB: Firma;

async function firmaKur(firma: string, ek: string): Promise<Firma> {
  const f = await kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Deneme Sanayi A.Ş.', 'Deneme', $1, '0312 000 00 00') RETURNING id::text", [`iletisim@${ek}.example`]);
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Merkez', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "2".repeat(26)]);
    const per = (ad: string) => q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ($1, '2024-01-01', 'elk-muh', '123') RETURNING id::text", [ad]);
    const k = async (eposta: string, rol: string, personel: string | null = null) => ({ k: kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@${ek}.example`, [rol], personel]), rol), p: personel });
    const d1 = await k("den1", "denetci", await per("Deneme Bir")), d2 = await k("den2", "denetci", await per("Deneme İki"));
    const plan = (await k("plan", "planlama")).k, yon = (await k("yon", "firma_yoneticisi")).k;
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text");
    const ekp = await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'EP-A1', 'x') RETURNING id::text", [tesis, tur]);
    return { yon, plan, den1: d1.k, den2: d2.k, den1P: d1.p!, tesis, tur, ekp };
  });
  await kiraciIcinde(havuz, firma, async (db) => {
    const t = tamam(await taslakBaslat(db, f.yon, f.tur, "sablon:ZPKR02", null));
    tamam(await yayinla(db, f.yon, t.id, t.surum, ""));
  }, { hesapId: f.yon.id });
  const bugun = bugunTr();
  const plan = tamam(await kiraciIcinde(havuz, firma, (db) => planAc(db, depo, f.plan, firma, { tesis: f.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: f.den1P, isgNo: "ISG-1", kaydet: false }] }), { hesapId: f.plan.id })).id;
  const v = (await kiraciIcinde(havuz, firma, (db) => planIci(db, f.den1, plan), { hesapId: f.den1.id }))!;
  tamam(await kiraciIcinde(havuz, firma, (db) => planKabul(db, f.den1, plan, v.surum, true), { hesapId: f.den1.id }));
  const rapor = tamam(await kiraciIcinde(havuz, firma, (db) => raporOlustur(db, f.den1, plan, f.ekp), { hesapId: f.den1.id })).id;
  return { yon: f.yon, plan: f.plan, den1: f.den1, den2: f.den2, rapor };
}

const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const hazirla = (k: Kisi, rapor = FA.rapor, bolum = "linye", foto = JPEG) => a(k, (db) => fotoOkuHazirla(db, k, rapor, bolum, { bayt: foto }));
const yzAyari = (d: object) => a(FA.yon, async (db) => { const m = await ayarOku(db, "yapay_zeka"); return ayarYaz(db, "yapay_zeka", m.surum, { ...m.deger, ...d }, { kim: "Deneme", ne: "ayar.yapay_zeka" }); });

before(async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "deneme-a");
  FB = await firmaKur(B, "deneme-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("açık değilken ve anahtarsızken okunmaz; açık + anahtar: istek yalnız fotoğraf + tablo, fotoğrafın konum bilgisi silinmiş; ekranda tuş", async () => {
  assert.equal((await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!.yz, false, "kapalıyken tuş yok");
  assert.match(JSON.stringify(await hazirla(FA.den1)), /firmada kapalı/);
  tamam(await yzAyari({ acik: true }));
  assert.match(JSON.stringify(await hazirla(FA.den1)), /anahtarı girilmedi/);
  await a(FA.yon, (db) => sirYaz(db, "yapay_zeka_anahtari", "sk-ant-deneme-anahtar-0123456789", { kim: "Deneme" }));
  assert.equal((await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!.yz, true);
  assert.equal((await a(FA.den2, (db) => sahaRaporu(db, FA.den2, FA.rapor))), null, "başka denetçi raporu görmez");
  const h = await hazirla(FA.den1);
  assert.equal(h.durum, "hazir");
  if (h.durum !== "hazir") return;
  assert.equal(h.anahtar, "sk-ant-deneme-anahtar-0123456789");
  const govde = JSON.stringify(h.istek.govde);
  assert.doesNotMatch(govde, /sk-ant|Deneme Sanayi|Deneme Cad|iletisim@|DA-\d{4}/, "anahtar, müşteri, adres, e-posta, rapor no gönderilmez");
  const resim = Buffer.from((h.istek.govde as { messages: { content: { source?: { data: string } }[] }[] }).messages[0].content[0].source!.data, "base64").toString("latin1");
  assert.ok(resim.includes("goruntu-verisi") && !resim.includes("GPS-KONUM") && !resim.includes("Exif"), "konum bilgisi silindi, görüntü aynı");
  assert.deepEqual(await hazirla(FA.den1, FA.rapor, "linye", PDF), { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } });
  /* imzası JPEG, parçaları bozuk (tarama ve bitiş yok): konum bilgisi silinemeyen dosya gönderilmez, eylem çökmez */
  assert.deepEqual(await hazirla(FA.den1, FA.rapor, "linye", new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 3, 1, 0xff, 0xd9])),
    { durum: "gecersiz", hatalar: { foto: "Fotoğraf bozuk; başka bir fotoğraf deneyin." } });
  const buyuk = new Uint8Array((5 << 20) + 10); buyuk.set(JPEG);
  assert.deepEqual(await hazirla(FA.den1, FA.rapor, "linye", buyuk), { durum: "gecersiz", hatalar: { foto: "Fotoğraf çok büyük (en çok 5 MB)." } });
});

test("yalnız yazan, Yeni raporunda, ölçüm tablosunda; başka firma raporu bulamaz", async () => {
  assert.equal((await hazirla(FA.den2)).durum, "yok", "başka denetçi");
  assert.equal((await hazirla(FA.plan)).durum, "yetkisiz", "raporu gören planlamacı okutamaz");
  assert.equal((await hazirla(FA.den1, FA.rapor, "nokta")).durum, "gecersiz", "formatta olmayan bölüm");
  const bilgi = SABLONLAR.ZPKR02.tanim.bolumler.find((b) => b.blok !== "olcum")!.id;
  assert.equal((await hazirla(FA.den1, FA.rapor, bilgi)).durum, "gecersiz", "ölçüm olmayan bölüm");
  assert.equal((await kiraciIcinde(havuz, B, (db) => fotoOkuHazirla(db, FB.den1, FA.rapor, "linye", { bayt: JPEG }), { hesapId: FB.den1.id })).durum, "yok");
  assert.equal((await hazirla(FA.den1, "kotu-kimlik")).durum, "yok");
});

test("kayıt: öneri şemaya göre süzülür, maliyet kişinin aylık kullanımına; sınır dolunca okunmaz; rapora yazılmaz", async () => {
  tamam(await yzAyari({ acik: true, sinir: 1 }));
  const h = { model: "opus" as const, bolum: SABLONLAR.ZPKR02.tanim.bolumler.find((b) => b.id === "linye") as never, ay: yzAyi() };
  const once = (await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!.cevaplar;
  const r = await a(FA.den1, (db) => fotoOkuKaydet(db, FA.den1, FA.rapor, h, cevap([{ no: "F1", devre: "Aydınlatma", tip: TIP, akim: 16, guven: "yuksek" }, { no: "F2", tip: "yok", guven: "dusuk" }])));
  assert.ok("satirlar" in r);
  if (!("satirlar" in r)) return;
  assert.deepEqual(r.satirlar, [{ degerler: { no: "F1", devre: "Aydınlatma", tip: TIP, akim: "16" }, guven: "yuksek" }, { degerler: { no: "F2" }, guven: "dusuk" }]);
  assert.deepEqual((await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!.cevaplar, once, "öneri rapora yazılmaz");
  assert.equal((await hazirla(FA.den1)).durum, "hazir", "0,6 $ < 1 $");
  await a(FA.den1, (db) => fotoOkuKaydet(db, FA.den1, FA.rapor, h, cevap([])));
  const k = (await a(FA.den1, (db) => db.sorgu<{ okuma: number; maliyet: string; h: string }>("SELECT okuma, maliyet::text, hesap_id::text AS h FROM yz_kullanim"))).rows;
  assert.deepEqual(k, [{ okuma: 2, maliyet: "1200000", h: FA.den1.id }]);
  assert.match(JSON.stringify(await hazirla(FA.den1)), /sınırınız \(1 \$\) doldu/);
  tamam(await yzAyari({ sinir: null }));
  assert.equal((await hazirla(FA.den1)).durum, "hazir", "sınırsız");
  const o = (await a(FA.den1, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM yz_okuma WHERE rapor_id = $1 AND hesap_id = $2 AND model = 'opus'", [FA.rapor, FA.den1.id]))).rows[0].n;
  assert.equal(o, 2);
});

test("kullanım yalnız artar ve kişinin kendi hanesine; okuma kaydı değişmez, silinmez; başka firma görmez", async () => {
  /* başkasının adına yazma girişimi: hesap bağlamdan damgalanır */
  await a(FA.den1, (db) => db.sorgu("INSERT INTO yz_kullanim (hesap_id, ay, okuma, maliyet) VALUES ($1, '2026-01', 1, 5)", [FA.den2.id]));
  assert.equal((await a(FA.den1, (db) => db.sorgu<{ h: string }>("SELECT hesap_id::text AS h FROM yz_kullanim WHERE ay = '2026-01'"))).rows[0].h, FA.den1.id);
  await assert.rejects(a(FA.den1, (db) => db.sorgu("UPDATE yz_kullanim SET maliyet = 0")), /yalnız artar/);
  await assert.rejects(a(FA.den2, (db) => db.sorgu("UPDATE yz_kullanim SET okuma = okuma + 1 WHERE hesap_id = $1", [FA.den1.id])), /kendi okuması/);
  await assert.rejects(a(FA.den1, (db) => db.sorgu("DELETE FROM yz_kullanim")), /permission denied/);
  await assert.rejects(a(FA.den1, (db) => db.sorgu("UPDATE yz_okuma SET maliyet = 0")), /permission denied/);
  await assert.rejects(a(FA.den1, (db) => db.sorgu("DELETE FROM yz_okuma")), /permission denied/);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO yz_kullanim (ay) VALUES ('2026-02')")), /oturumdaki kişi/, "hesapsız işlem yazamaz");
  const b = await kiraciIcinde(havuz, B, (db) => db.sorgu("SELECT (SELECT count(*) FROM yz_kullanim)::int AS k, (SELECT count(*) FROM yz_okuma)::int AS o"), { hesapId: FB.den1.id });
  assert.deepEqual(b.rows[0], { k: 0, o: 0 });
});
