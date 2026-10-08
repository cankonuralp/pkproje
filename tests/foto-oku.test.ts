/* NEREDEN GELDİ: 351 — saha raporunda fotoğraftan okuma (maket rapor.html Z3; ARKA-UC §5.1–5.2, K1; §8.10 değer öneri; 09-G3 istisnası "firma
   ayarıyla açılır, başlangıçta kapalı; çağrı yalnız sunucudan, firmanın anahtarıyla"; firma ayarı "kişi başı aylık sınır"). GERÇEK PostgreSQL, iki
   firma: kapalıyken / anahtarsızken okunmaz; yalnız yazan, Yeni raporunda, ölçüm tablosunda; fotoğrafın konum bilgisi gönderilmez; maliyet kişinin
   aylık kullanımına yazılır, sınır dolunca okunmaz; kullanım yalnız artar, başkasının hanesine yazılamaz, okuma kaydı değişmez; başka firma görmez.
   354 (350–351 incelemesi): sınır AYIRMAYLA — eşzamanlı ikinci okuma birincinin ayırmasını görür (satır kilidi); sınır 0 = sınırsız (maket Y1);
   çağrı cevapsız biterse ücretsizse ayırma bırakılır, sonucu bilinmiyorsa harcamaya yazılır; ödenen okuma rapor okuma sürerken silinse de kullanıma
   yazılır; pano okumasında fotoğraf rapora eklenir (§11 92); firma ayarlarında kişi başı kullanım. 385: etiket plakasından okuma aynı kapı ve
   kullanımla (yalnız yazan, Yeni raporunda; istekte kişi / firma yok; öneri döner, rapora yazılmaz; okuma kaydı "etiket"; kapalıyken okunmaz).
   Olumsuz kanıt: tests/bozan/foto-oku.bozan.ts, tests/bozan/etiket-okuma.bozan.ts. */
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
import { fotoOkuBirak, fotoOkuHazirla, fotoOkuKaydet, fotoOkuKullanimYaz, type FotoOkuHazir } from "../src/modules/raporlar/server/foto-oku.ts";
import { etiketOkuHazirla, etiketOkuKullanimYaz, etiketOkuSonuc } from "../src/modules/raporlar/server/etiket-oku.ts";
import { raporOlustur, raporSil, sahaRaporu } from "../src/modules/raporlar/server/raporlar.ts";
import { ayarOku, ayarYaz } from "../src/server/ayar/ayar.ts";
import { sirYaz } from "../src/server/ayar/sir.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { yzAyi, yzAyir, yzAyKullanimi } from "../src/server/yz/kullanim.ts";
import { enCokMaliyet } from "../src/server/yz/okuma.ts";
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
/* yapılandırılmış çıktı cevabı (354): metin bloğunda şemaya uyan JSON */
const cevap = (satirlar: unknown[], giris = 100_000, cikis = 10_000) => ({ content: [{ type: "text", text: JSON.stringify({ satirlar, not: null }) }], stop_reason: "end_turn", usage: { input_tokens: giris, output_tokens: cikis } });

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
  /* bu deneme çağrı yapmaz: ayırma ücretsiz bırakılır (354) */
  await a(FA.den1, (db) => fotoOkuBirak(db, h, "yok"));
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

const UST = enCokMaliyet("opus");
const kullanim = async (k: Kisi) => (await a(k, (db) => db.sorgu<{ okuma: number; maliyet: string; ayrilan: string }>(
  "SELECT okuma, maliyet::text, ayrilan::text FROM yz_kullanim WHERE hesap_id = $1 AND ay = $2", [k.id, yzAyi()]))).rows[0];
const hazir = (h: Awaited<ReturnType<typeof hazirla>>): FotoOkuHazir => { assert.equal(h.durum, "hazir", JSON.stringify(h)); return h as FotoOkuHazir; };
/** tam okuma: hazırla (ayırma) → yapay zekâ cevabı → kullanım (kendi işleminde) → öneri (ayrı işlemde) */
async function oku(k: Kisi, govde: unknown, rapor = FA.rapor) {
  const h = hazir(await hazirla(k, rapor));
  const ku = await a(k, (db) => fotoOkuKullanimYaz(db, rapor, h, govde));
  return a(k, (db) => fotoOkuKaydet(db, depo, k, A, rapor, h, ku));
}

test("kayıt: öneri şemaya göre süzülür, maliyet kişinin aylık kullanımına (ayırma gerçek maliyetle kapanır); sınır dolunca okunmaz; rapora yazılmaz", async () => {
  tamam(await yzAyari({ acik: true, sinir: 1, model: "opus" }));
  const once = (await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!.cevaplar.tablo;
  const h = hazir(await hazirla(FA.den1));
  assert.deepEqual(await kullanim(FA.den1), { okuma: 0, maliyet: "0", ayrilan: String(UST) }, "çağrıdan önce en kötü maliyet ayrıldı");
  const ku = await a(FA.den1, (db) => fotoOkuKullanimYaz(db, FA.rapor, h, cevap([{ no: "F1", devre: "Aydınlatma", tip: TIP, akim: 16, guven: "yuksek" }, { no: "F2", tip: "yok", guven: "dusuk" }])));
  assert.deepEqual(await kullanim(FA.den1), { okuma: 1, maliyet: "600000", ayrilan: "0" }, "ayırma gerçek maliyetle kapandı");
  const r = tamam(await a(FA.den1, (db) => fotoOkuKaydet(db, depo, FA.den1, A, FA.rapor, h, ku)));
  assert.deepEqual(r.satirlar, [{ degerler: { no: "F1", devre: "Aydınlatma", tip: TIP, akim: "16" }, guven: "yuksek" }, { degerler: { no: "F2" }, guven: "dusuk" }]);
  const sonra = (await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!;
  assert.deepEqual(sonra.cevaplar.tablo, once, "öneri rapora yazılmaz");
  /* pano okuması (format hesabı linye): fotoğraf rapora — termal değil, Fotoğraflar bölümüne (§11 92) */
  assert.ok(r.fotoEklendi && /Pano fotoğrafı rapora eklendi/.test(r.bildirim), r.bildirim);
  assert.deepEqual(sonra.fotolar.map((f) => [f.bolum, f.madde, f.ad]), [["foto", null, "Pano sigortaları (linye) fotoğrafı.jpg"]]);
  assert.equal((await oku(FA.den1, cevap([]))).durum, "tamam", "0,6 $ < 1 $");
  assert.deepEqual(await kullanim(FA.den1), { okuma: 2, maliyet: "1200000", ayrilan: "0" });
  assert.equal((await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!.fotolar.length, 1, "satır okunamadıysa fotoğraf eklenmez");
  assert.match(JSON.stringify(await hazirla(FA.den1)), /sınırınız \(1 \$\) doldu/);
  assert.equal((await kullanim(FA.den1)).ayrilan, "0", "dolu sınırda ayırma yapılmaz");
  tamam(await yzAyari({ sinir: null }));
  const s0 = hazir(await hazirla(FA.den1));
  await a(FA.den1, (db) => fotoOkuBirak(db, s0, "yok"));
  tamam(await yzAyari({ sinir: 0 }));
  const s1 = hazir(await hazirla(FA.den1));
  await a(FA.den1, (db) => fotoOkuBirak(db, s1, "yok"));
  assert.deepEqual(await kullanim(FA.den1), { okuma: 2, maliyet: "1200000", ayrilan: "0" }, "sınırsız (boş ya da 0, maket Y1); ücretsiz biten çağrıda ayırma bırakıldı");
  const o = (await a(FA.den1, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM yz_okuma WHERE rapor_id = $1 AND hesap_id = $2 AND model = 'opus'", [FA.rapor, FA.den1.id]))).rows[0].n;
  assert.equal(o, 2);
  assert.deepEqual((await a(FA.yon, (db) => yzAyKullanimi(db, yzAyi()))).map((x) => [x.id, x.okuma, x.maliyet]), [[FA.den1.id, 2, 1_200_000]], "firma ayarlarında kişi başı");
});

test("sınır yarışı: eşzamanlı ikinci okuma birincinin ayırmasını görür (satır kilidi); zaman aşımında ayrılan harcamaya yazılır", async () => {
  /* sınır: şu anki kullanımın üstüne bir ayırma sığar, ikincisi sığmaz */
  const k0 = await kullanim(FA.den1);
  const sinir = Math.ceil((Number(k0.maliyet) + Number(k0.ayrilan)) / 1e4) / 100 + 0.3;
  tamam(await yzAyari({ sinir }));
  const ay = yzAyi();
  let ayrildi!: () => void, birak!: () => void;
  const ayrildiSoz = new Promise<void>((c) => { ayrildi = c; }), kapi = new Promise<void>((c) => { birak = c; });
  const t1 = a(FA.den1, async (db) => { const r = await yzAyir(db, ay, sinir, UST); ayrildi(); await kapi; return r; });
  await ayrildiSoz;
  const t2 = a(FA.den1, (db) => yzAyir(db, ay, sinir, UST));
  /* ikinci işlem birincinin satır kilidinde beklesin, sonra birinci bitsin */
  const s = kume.sahipIstemci(); await s.connect();
  try {
    for (let i = 0; i < 200; i++) {
      if ((await s.query<{ n: number }>("SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type = 'Lock'")).rows[0].n > 0) break;
      await new Promise((c) => setTimeout(c, 25));
    }
  } finally { await s.end(); }
  birak();
  assert.deepEqual(await Promise.all([t1, t2]), [true, false], "ikinci okuma sınırı aşamaz");
  const k1 = await kullanim(FA.den1);
  assert.equal(Number(k1.ayrilan), Number(k0.ayrilan) + UST);
  /* zaman aşımı (sonucu bilinmiyor): ayrılan harcamaya, bir okuma sayılır */
  await a(FA.den1, (db) => fotoOkuBirak(db, { ay, ust: UST }, "bilinmiyor"));
  assert.deepEqual(await kullanim(FA.den1), { okuma: k0.okuma + 1, maliyet: String(Number(k0.maliyet) + UST), ayrilan: k0.ayrilan });
});

test("kullanım yalnız artar ve kişinin kendi hanesine; okuma kaydı değişmez, silinmez; başka firma görmez", async () => {
  /* başkasının adına yazma girişimi: hesap bağlamdan damgalanır */
  await a(FA.den1, (db) => db.sorgu("INSERT INTO yz_kullanim (hesap_id, ay, okuma, maliyet) VALUES ($1, '2026-01', 1, 5)", [FA.den2.id]));
  assert.equal((await a(FA.den1, (db) => db.sorgu<{ h: string }>("SELECT hesap_id::text AS h FROM yz_kullanim WHERE ay = '2026-01'"))).rows[0].h, FA.den1.id);
  await assert.rejects(a(FA.den1, (db) => db.sorgu("UPDATE yz_kullanim SET maliyet = 0")), /yalnız artar/);
  await assert.rejects(a(FA.den2, (db) => db.sorgu("UPDATE yz_kullanim SET ayrilan = 0 WHERE hesap_id = $1", [FA.den1.id])), /kendi okuması/, "ayırmayı başkası bırakamaz");
  await assert.rejects(a(FA.den2, (db) => db.sorgu("UPDATE yz_kullanim SET okuma = okuma + 1 WHERE hesap_id = $1", [FA.den1.id])), /kendi okuması/);
  await assert.rejects(a(FA.den1, (db) => db.sorgu("DELETE FROM yz_kullanim")), /permission denied/);
  await assert.rejects(a(FA.den1, (db) => db.sorgu("UPDATE yz_okuma SET maliyet = 0")), /permission denied/);
  await assert.rejects(a(FA.den1, (db) => db.sorgu("DELETE FROM yz_okuma")), /permission denied/);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO yz_kullanim (ay) VALUES ('2026-02')")), /oturumdaki kişi/, "hesapsız işlem yazamaz");
  const b = await kiraciIcinde(havuz, B, (db) => db.sorgu("SELECT (SELECT count(*) FROM yz_kullanim)::int AS k, (SELECT count(*) FROM yz_okuma)::int AS o"), { hesapId: FB.den1.id });
  assert.deepEqual(b.rows[0], { k: 0, o: 0 });
});

/* 385: etiket plakasından okuma (rapor silinmeden önce) */
test("385 etiket plakası: yalnız yazan, Yeni raporunda; istekte kişi / firma yok; öneri döner, rapora yazılmaz; kullanım ve okuma kaydı", async () => {
  tamam(await yzAyari({ sinir: null }));
  const et = (k: Kisi, rapor = FA.rapor, foto = JPEG) => a(k, (db) => etiketOkuHazirla(db, k, rapor, { bayt: foto }));
  assert.equal((await et(FA.den2)).durum, "yok", "başka denetçi");
  assert.equal((await et(FA.plan)).durum, "yetkisiz", "raporu gören planlamacı okutamaz");
  assert.equal((await kiraciIcinde(havuz, B, (db) => etiketOkuHazirla(db, FB.den1, FA.rapor, { bayt: JPEG }), { hesapId: FB.den1.id })).durum, "yok");
  assert.deepEqual(await et(FA.den1, FA.rapor, PDF), { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } });
  const k0 = await kullanim(FA.den1);
  const h = await et(FA.den1);
  assert.equal(h.durum, "hazir", JSON.stringify(h));
  if (h.durum !== "hazir") return;
  assert.doesNotMatch(JSON.stringify(h.istek.govde), /sk-ant|Deneme Sanayi|Deneme Cad|iletisim@|DA-[0-9]{4}/, "anahtar, müşteri, adres, e-posta, rapor no gönderilmez");
  const resim = Buffer.from((h.istek.govde as { messages: { content: { source?: { data: string } }[] }[] }).messages[0].content[0].source!.data, "base64").toString("latin1");
  assert.ok(resim.includes("goruntu-verisi") && !resim.includes("GPS-KONUM"), "konum bilgisi silindi");
  const once = (await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!.ekipmanBilgi;
  const govde = { content: [{ type: "text", text: JSON.stringify({ alanlar: [{ alan: "marka", deger: "Deneme Marka", guven: "yuksek" }, { alan: "imal", deger: "2019", guven: "dusuk" }], not: null }) }],
    stop_reason: "end_turn", usage: { input_tokens: 100_000, output_tokens: 10_000 } };
  const ku = await a(FA.den1, (db) => etiketOkuKullanimYaz(db, FA.rapor, h, govde));
  const k1 = await kullanim(FA.den1);
  assert.deepEqual([k1.okuma, Number(k1.maliyet), k1.ayrilan], [k0.okuma + 1, Number(k0.maliyet) + 600_000, k0.ayrilan], "ayırma gerçek maliyetle kapandı");
  assert.deepEqual(await a(FA.den1, (db) => etiketOkuSonuc(db, FA.den1, FA.rapor, ku)), { durum: "tamam",
    okunan: [{ alan: "marka", deger: "Deneme Marka", guven: "yuksek" }, { alan: "imal", deger: "2019", guven: "dusuk" }], bildirim: "Etiketten 2 bilgi okundu; uygulamadan rapora yazılmaz." });
  assert.deepEqual((await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!.ekipmanBilgi, once, "öneri rapora yazılmaz");
  const kayit = (await a(FA.den1, (db) => db.sorgu<{ bolum: string; oneri: unknown }>("SELECT bolum, oneri FROM yz_okuma WHERE rapor_id = $1 ORDER BY zaman DESC LIMIT 1", [FA.rapor]))).rows[0];
  assert.deepEqual(kayit, { bolum: "etiket", oneri: [{ degerler: { marka: "Deneme Marka" }, guven: "yuksek" }, { degerler: { imal: "2019" }, guven: "dusuk" }] });
  tamam(await yzAyari({ acik: false }));
  assert.match(JSON.stringify(await et(FA.den1)), /firmada kapalı/);
  tamam(await yzAyari({ acik: true }));
});

test("ödenen okuma rapor okuma sürerken silinse de kişinin kullanımına yazılır; öneri dönmez (en sonda — rapor silinir)", async () => {
  tamam(await yzAyari({ sinir: null }));
  const h = hazir(await hazirla(FA.den1));
  const k0 = await kullanim(FA.den1);
  const v = (await a(FA.den1, (db) => sahaRaporu(db, FA.den1, FA.rapor)))!;
  tamam(await a(FA.den1, (db) => raporSil(db, FA.den1, FA.rapor, v.surum)));
  const ku = await a(FA.den1, (db) => fotoOkuKullanimYaz(db, FA.rapor, h, cevap([{ no: "F9", guven: "yuksek" }])));
  const k1 = await kullanim(FA.den1);
  assert.deepEqual([k1.okuma, Number(k1.maliyet), Number(k1.ayrilan)], [k0.okuma + 1, Number(k0.maliyet) + 600_000, Number(k0.ayrilan) - UST]);
  assert.equal((await a(FA.den1, (db) => fotoOkuKaydet(db, depo, FA.den1, A, FA.rapor, h, ku))).durum, "yok", "silinen rapora öneri dönmez");
});
