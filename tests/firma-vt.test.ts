/* NEREDEN GELDİ: FIRMA-VT.md §5.1–5.2, FV3 (sunum 579; reisim 2026-10-15: "supabase ve resend bağlantılarını firma açarken biz buradan panelden
   yapalım daha sonra müşteri uğraşmasın") — yeni firmaların verisi KENDİ veritabanında; isteğin hangi veritabanına gideceğini kod seçer: adres (Host)
   → merkezdeki kayıt (önbellekli firma_coz) → kiracının havuzu. Bir firmanın isteği başka firmanın veritabanına ASLA gitmemeli; kod yanlış havuzu
   verse de son kapı veritabanında (vt_firma_dogrula, FV1). GERÇEK PostgreSQL, iki küme, üç veritabanı (tests/yardimci/coklu-vt.ts): merkez + ortak
   firma O, kendi-A AYRI kümede, kendi-B merkezle AYNI kümede ikinci veritabanında. Kilitlenenler:
   · yönlendirme: her firmanın yazdığı YALNIZ kendi veritabanında (veritabanı × firma matrisi);
   · çapraz havuz: başka firmanın havuzunda iş 42501; başka firmanın kaydıyla havuz kurulmaz; vt'siz kiracı merkeze gider ve reddedilir (kapalı yön);
   · kayıt önbelleği: olumlu 15 sn bayat kalır sonra yenilenir, olumsuz 5 sn, tek uçuş, unut;
   · havuz sayısı (LRU): meşgul havuz atılmaz, boşalınca düşer, kapanışı beklenir; elinde eski nesne kalan istek güncel havuza (yine KENDİ
     veritabanına, iş bir kez); yeni sürümde düşen havuzun açık işlemi tamamlanır, SIRADA bekleyen istek beklemeden güncel havuza geçer
     (2026-10-15, FV3 incelemesi — önce LRU meşgul havuzu atıyor, sıradaki istek 5 sn bekliyordu);
   · parola yenilendi (28P01): kayıt + havuz düşer, merkezden BİR kez yeniden okunur, iş BİR kez koşar; merkez de yanlışsa iş hiç koşmaz;
   · dondurmanın ikinci kilidi: kayıt önbelleği bayatken (15 sn) dondurulmuş firmaya personel ve müşteri girişi / oturumu YOK — ortak ve kendi projeli;
   · kiracı YALNIZ adresten: src/server/kiraci/istek.ts başlıktan yalnız "host"u okur (tests/yardimci/denetimler.ts kiraciBasligiEksikleri — saf kilidi
     tests/kiraci-coz.test.ts); adres → kayıt gerçek merkezde.
   Olumsuz kanıt: tests/bozan/firma-vt.bozan.ts (çözücü hep merkez / hep ilk havuzu verir; dondurma koşulu personelde ve müşteride kalkar; yeniden
   deneme kalkar) · saf olanlar tests/bozan/firma-havuzu.bozan.ts, tests/bozan/kiraci-coz.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import type pg from "pg";
import { yonlendiriciKur, type Yonlendirici, type YonlendiriciAyari } from "../src/server/db/firma-havuzu.ts";
import { kiraciIcinde } from "../src/server/db/kiraci.ts";
import { firmaCoz, firmaCozId, type FirmaCozumu } from "../src/server/db/merkez.ts";
import { musteriGirisYap, musteriOturumOku } from "../src/server/kimlik/musteri.ts";
import { girisYap, oturumOku } from "../src/server/kimlik/oturum.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { cozumdenKiraci, hosttanKiraci, type IstekKiracisi } from "../src/server/kiraci/coz.ts";
import { kayitOnbellegiKur } from "../src/server/kiraci/kayit-onbellek.ts";
import { cokluVtKur, type CokluVt, type TestFirmasi } from "./yardimci/coklu-vt.ts";
import { kiraciBasligiEksikleri, oku } from "./yardimci/denetimler.ts";

const PAROLA = "deneme-parola-2026";
const MUSTERI = "m@kendi-a-musteri.example";
let v: CokluVt;
const yonlendiriciler: Yonlendirici[] = [];
const yetkisiz = (e: unknown) => (e as { code?: string }).code === "42501";
/** açık havuzların firmaları, en eski kullanılan önde */
const firmalar = (y: Yonlendirici) => y.acikHavuzlar.map((k) => k.split(":")[0]);

/** testin yönlendiricisi: gerçek merkez, elle ilerleyen saat, merkeze giden sorgular sayılır */
function yonlendirici(ek: Partial<YonlendiriciAyari> = {}) {
  const s = { t: Date.now() }, sayac = { ad: 0, id: 0 };
  const y = yonlendiriciKur({
    merkez: () => v.merkez, anahtar: () => v.anahtar, merkezYerel: true, simdi: () => s.t,
    onbellek: kayitOnbellegiKur<FirmaCozumu>({ simdi: () => s.t }),
    coz: {
      ad: (k) => { sayac.ad++; return firmaCoz(v.merkez, k); },
      id: (i) => { sayac.id++; return firmaCozId(v.merkez, i); },
    },
    ...ek,
  });
  yonlendiriciler.push(y);
  return { y, s, sayac };
}
async function kiraci(y: Yonlendirici, f: TestFirmasi): Promise<IstekKiracisi> {
  const k = cozumdenKiraci(await y.kayit(f.kisaAd));
  assert.ok(k && k.firmaId === f.id, f.kisaAd);
  return k;
}
/** veritabanında, bu işaretle yazılmış iz sayısı — firma başına */
const izSay = async (c: pg.Client, ne: string, firmaId: string) =>
  (await c.query<{ n: number }>("SELECT count(*)::int AS n FROM denetim_izi WHERE ne = $1 AND firma_id = $2", [ne, firmaId])).rows[0]!.n;
const izYaz = (ne: string) => (db: { sorgu: (m: string, d?: readonly unknown[]) => Promise<unknown> }) =>
  db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme Kişi', $1)", [ne]);
/** veritabanı (merkez, A, B) × firma (O, A, B) matrisi */
const matris = async (ne: string) => Promise.all([v.merkezSahip, v.A.sahip, v.B.sahip].map((c) => Promise.all([v.O, v.A, v.B].map((f) => izSay(c, ne, f.id)))));

before(async () => {
  v = await cokluVtKur();
  const ozet = await parolaOzeti(PAROLA);
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  for (const f of [v.O, v.A]) {
    await f.sahip.query("INSERT INTO hesap (firma_id, eposta, ad, parola_ozeti, roller, durum) VALUES ($1, $2, 'Deneme Kişi', $3, '{firma_yoneticisi}', 'etkin')",
      [f.id, `kisi@${f.kisaAd}.example`, ozet]);
  }
  const m = (await v.A.sahip.query<{ id: string }>("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Müşteri A.Ş.', 'Deneme') RETURNING id::text",
    [v.A.id])).rows[0]!.id;
  await v.A.sahip.query("INSERT INTO musteri_hesap (firma_id, musteri_id, ana, eposta, ad, parola_ozeti, durum) VALUES ($1, $2, true, $3, 'Deneme', $4, 'etkin')",
    [v.A.id, m, MUSTERI, ozet]);
});

after(async () => {
  for (const y of yonlendiriciler) await y.kapat();
  await v?.kapat();
});

test("yönlendirme: her firmanın yazdığı YALNIZ kendi veritabanında — ortak → merkez, kendi-A → ayrı küme, kendi-B → aynı kümede ikinci veritabanı", async () => {
  const { y } = yonlendirici();
  const [kO, kA, kB] = [await kiraci(y, v.O), await kiraci(y, v.A), await kiraci(y, v.B)];
  assert.equal(kO.vt, undefined, "ortak firmanın bağlantı kaydı yok");
  assert.deepEqual([kA.vt?.kapi, kA.vt?.vtAd, kB.vt?.kapi, kB.vt?.vtAd], [v.A.baglanti.port, v.A.baglanti.database, v.B.baglanti.port, v.B.baglanti.database]);
  assert.notEqual(kA.vt?.kapi, kB.vt?.kapi, "A ayrı kümede");
  assert.equal(kB.vt?.kapi, v.merkezKume.uygulama.port, "B merkezle aynı kümede");
  assert.equal(y.havuz(kO), v.merkez);
  const [hA, hB] = [y.havuz(kA), y.havuz(kB)];
  assert.ok(hA !== v.merkez && hB !== v.merkez && hA !== hB);
  for (const k of [kO, kA, kB]) await kiraciIcinde(y.havuz(k), k.firmaId, izYaz("yönlendirme"));
  assert.deepEqual(await matris("yönlendirme"), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  /* müşteri işlemi de (rol probata_musteri) firmanın veritabanında */
  const m = (await v.A.sahip.query<{ id: string }>("SELECT musteri_id::text AS id FROM musteri_hesap WHERE eposta = $1", [MUSTERI])).rows[0]!.id;
  const r = await kiraciIcinde(hA, v.A.id, (db) => db.sorgu<{ unvan: string }>("SELECT unvan FROM musteri"), { musteri: { id: m, tesisler: null } });
  assert.deepEqual(r.rows.map((x) => x.unvan), ["Deneme Müşteri A.Ş."]);
});

test("çapraz havuz: başka firmanın havuzunda iş REDDEDİLİR (42501); başka firmanın kaydıyla havuz kurulmaz; vt'siz kiracı merkeze gider ve reddedilir", async () => {
  const { y } = yonlendirici();
  const [kO, kA, kB] = [await kiraci(y, v.O), await kiraci(y, v.A), await kiraci(y, v.B)];
  const [hA, hB] = [y.havuz(kA), y.havuz(kB)];
  for (const [h, f] of [[hA, kB], [hA, kO], [hB, kA], [hB, kO], [v.merkez, kA], [v.merkez, kB]] as const) {
    await assert.rejects(kiraciIcinde(h, f.firmaId, izYaz("çapraz")), yetkisiz, f.kisaAd);
  }
  assert.deepEqual(await matris("çapraz"), [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
  assert.throws(() => y.havuz({ firmaId: kA.firmaId, vt: kB.vt }), /başka bir firmanın/);
  /* elle kurulmuş, bağlantı kaydı olmayan kiracı (kendi projeli firmanın kimliğiyle): merkez havuzu → veritabanı reddeder (kapalı yönde) */
  assert.equal(y.havuz({ firmaId: kA.firmaId }), v.merkez);
  await assert.rejects(kiraciIcinde(y.havuz({ firmaId: kA.firmaId }), kA.firmaId, izYaz("çapraz")), yetkisiz);
  /* merkez işlevi firmanın veritabanında çağrılmaz (yanlış havuz) */
  await assert.rejects(firmaCoz(hA, "kendi-a"), yetkisiz);
  await assert.rejects(firmaCozId(hB, kB.firmaId), yetkisiz);
});

test("kayıt önbelleği: olumlu sonuç 15 sn bayat kalır sonra yenilenir; olumsuz 5 sn; aynı anda gelenler tek sorgu; unut boşaltır", async () => {
  const { y, s, sayac } = yonlendirici();
  const ilk = await y.kayit("kendi-a");
  assert.ok(ilk?.vt === "kendi");
  if (ilk?.vt !== "kendi") return;
  await v.merkezSahip.query("UPDATE firma_vt SET surum = surum + 1 WHERE firma_id = $1", [v.A.id]);
  s.t += 14_999;
  assert.equal(await y.kayit("kendi-a"), ilk, "15 sn dolmadan önbellekten (bayat)");
  assert.equal(sayac.ad, 1);
  s.t += 1;
  const yeni = await y.kayit("kendi-a");
  assert.ok(yeni?.vt === "kendi" && yeni.kayit.surum === ilk.kayit.surum + 1, "15 sn dolunca merkezden yeni sürüm");
  assert.equal(sayac.ad, 2);
  /* olumsuz: olmayan ad 5 sn tutulur */
  assert.equal(await y.kayit("olmayan"), null);
  s.t += 4_999;
  assert.equal(await y.kayit("olmayan"), null);
  assert.equal(sayac.ad, 3);
  s.t += 1;
  await y.kayit("olmayan");
  assert.equal(sayac.ad, 4);
  /* tek uçuş */
  y.unut();
  const l = await Promise.all(Array.from({ length: 8 }, () => y.kayit("kendi-b")));
  assert.ok(l.every((c) => c?.id === v.B.id));
  assert.equal(sayac.ad, 5, "sekiz eşzamanlı istek merkeze tek sorgu");
  /* kimlik: kısa adla çözülen firma kimlikle de bulunur, merkez sorulmaz (2026-10-16 FV5, kasıtlı — önce "ayrı tutulur"du, burada 1 sayılıyordu;
     depo yönlendiricisi anahtardaki kimlikle sorar, açık işlemin yanında ikinci merkez bağlantısı açılmasın); kısa adla çözülmemiş firma merkezden,
     sonra önbellekten */
  assert.equal((await y.kayitKimlikle(v.B.id))?.id, v.B.id);
  assert.equal(sayac.id, 0);
  assert.equal(await y.havuzKimlikle(v.O.id), v.merkez);
  assert.equal((await y.kayitKimlikle(v.O.id))?.id, v.O.id);
  assert.equal(sayac.id, 1);
  assert.equal(await y.havuzKimlikle(v.B.id), y.havuz(cozumdenKiraci(await y.kayit("kendi-b"))!));
});

test("havuz sayısı (LRU): MEŞGUL havuz atılmaz (sınır geçici aşılır), boşalınca düşer ve kapanışı beklenir; elinde eski nesne kalan istek KENDİ veritabanına (güncel havuz)", async () => {
  /* 2026-10-15 (FV3 incelemesi, kasıtlı): önce açık işlemi süren A'nın havuzu B gelince hemen düşüyordu (sırasındaki istek bağlanma süresi kadar —
     5 sn — bekliyordu); artık meşgul havuz LRU'da atılmaz, boşalınca sonraki çağrıda düşer. Düşen havuzun açık işleminin tamamlanması: aşağıdaki
     "yeni sürüm" testi. */
  const birakilan: Promise<unknown>[] = [];
  const { y } = yonlendirici({ havuzSayisi: 1, birak: (p) => { birakilan.push(p); } });
  const [kA, kB] = [await kiraci(y, v.A), await kiraci(y, v.B)];
  const hA = y.havuz(kA);
  let devam = () => {};
  let basladi = () => {};
  const durdu = new Promise<void>((c) => { devam = c; });
  const basla = new Promise<void>((c) => { basladi = c; });
  const acik = kiraciIcinde(hA, v.A.id, async (db) => { await izYaz("lru uçuşta")(db); basladi(); await durdu; return "tamam"; });
  await basla;
  const hB = y.havuz(kB);
  assert.notEqual(hB, hA);
  assert.deepEqual([firmalar(y), birakilan.length], [[v.A.id, v.B.id], 0], "açık işlemi süren A atılmadı: sınır geçici aşıldı");
  devam();
  assert.equal(await acik, "tamam");
  await kiraciIcinde(hB, v.B.id, izYaz("lru B"));
  /* A boşaldı: sonraki çağrıda en eski kullanılan boştaki A düşer, kapanışı beklenir */
  assert.equal(y.havuz(kB), hB);
  assert.deepEqual([firmalar(y), birakilan.length], [[v.B.id], 1], "boşalan A düştü");
  await Promise.all(birakilan);
  assert.ok(hA.ended, "kapanış tamamlandı");
  /* eski nesne (düşmüş havuz): A'nın güncel havuzu kurulur (boştaki B düşer), iş yine A'nın veritabanında */
  await kiraciIcinde(hA, v.A.id, izYaz("lru eski nesne"));
  assert.deepEqual(firmalar(y), [v.A.id]);
  assert.deepEqual([await matris("lru uçuşta"), await matris("lru B"), await matris("lru eski nesne")], [
    [[0, 0, 0], [0, 1, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 1]], [[0, 0, 0], [0, 1, 0], [0, 0, 0]]]);
  await Promise.all(birakilan);
});

test("yeni sürüm: düşen havuzun açık işlemi tamamlanır, kapanışı beklenir; SIRADA bekleyen istek BEKLEMEDEN güncel havuza geçer — iş BİR kez, KENDİ veritabanında", async () => {
  /* 2026-10-15 (FV3 incelemesi, kasıtlı): önce sıradaki istek kapanan havuzda bağlanma süresi (5 sn) dolana dek bekliyordu (pg-pool kapanan havuzun
     sırasındakine hizmet etmez); artık hemen geçer. Havuzu düşüren LRU değil yeni sürüm (meşgul havuz LRU'da atılmaz). */
  const birakilan: Promise<unknown>[] = [];
  const { y } = yonlendirici({ firmaHavuz: 1, birak: (p) => { birakilan.push(p); } });
  const kA = await kiraci(y, v.A);
  const hA = y.havuz(kA);
  assert.equal(hA.options.max, 1);
  let devam = () => {};
  let basladi = () => {};
  const durdu = new Promise<void>((c) => { devam = c; });
  const basla = new Promise<void>((c) => { basladi = c; });
  const ilk = kiraciIcinde(hA, v.A.id, async (db) => { basladi(); await durdu; await izYaz("sıra ilk")(db); return "tamam"; });
  await basla;
  let kosu = 0;
  const ikinci = kiraciIcinde(hA, v.A.id, async (db) => { kosu++; await izYaz("sıra ikinci")(db); return "tamam"; });
  await new Promise((c) => setTimeout(c, 200));
  assert.equal(hA.waitingCount, 1, "tek bağlantı dolu: ikinci istek sırada");
  /* bağlantı kaydı yenilendi (aynı bilgiler, yeni sürüm): A'nın havuzu düşer; ilk istek eski havuzun bağlantısında sürer */
  const t = Date.now();
  const hA2 = y.havuz({ firmaId: v.A.id, vt: { ...kA.vt!, surum: kA.vt!.surum + 1 } });
  assert.notEqual(hA2, hA);
  assert.equal(birakilan.length, 1);
  assert.equal(await ikinci, "tamam", "sıradaki istek yeni havuzda koştu (ilk istek hâlâ açıkken)");
  assert.ok(Date.now() - t < 3_000, `sıradaki istek bekletildi: ${Date.now() - t} ms`);
  devam();
  assert.equal(await ilk, "tamam", "düşen havuzun açık işlemi tamamlandı");
  await Promise.all(birakilan);
  assert.ok(hA.ended, "kapanış açık işlem bitince tamamlandı");
  assert.equal(kosu, 1);
  assert.deepEqual([await matris("sıra ilk"), await matris("sıra ikinci")], [[[0, 0, 0], [0, 1, 0], [0, 0, 0]], [[0, 0, 0], [0, 1, 0], [0, 0, 0]]]);
});

test("parola yenilendi (28P01): kayıt + havuz düşer, merkezden BİR kez yeniden okunur, iş BİR kez koşar; merkezdeki kayıt da yanlışsa iş hiç koşmaz", async () => {
  const eski = v.A.baglanti.password;
  const yeni = randomBytes(18).toString("base64url");
  const { y, sayac } = yonlendirici();
  const kA = await kiraci(y, v.A);   // önbellekte eski parola
  await v.A.sahip.query(`ALTER ROLE probata_uygulama PASSWORD '${yeni}'`);
  await v.parolaKaydiYaz(v.A, yeni);
  try {
    let kosu = 0;
    await kiraciIcinde(y.havuz(kA), v.A.id, async (db) => { kosu++; await izYaz("parola yenilendi")(db); });
    assert.deepEqual([kosu, sayac.id], [1, 1], "iş bir kez koştu; kayıt bir kez yeniden okundu");
    assert.deepEqual(await matris("parola yenilendi"), [[0, 0, 0], [0, 1, 0], [0, 0, 0]]);
    /* eski kayıtla gelen istek yeni havuzu kullanır (yeniden 28P01 yok); kısa ad önbelleği de yeni kayıtta */
    await kiraciIcinde(y.havuz(kA), v.A.id, async () => {});
    const k2 = await kiraci(y, v.A);
    assert.ok(k2.vt && kA.vt && k2.vt.surum > kA.vt.surum);
    assert.deepEqual([sayac.id, sayac.ad], [1, 1], "merkez yeniden sorulmadı");
    /* merkezdeki kayıt da yanlış parola: iş hiç koşmaz, kayıt yalnız BİR kez yeniden okunur, 28P01 yukarı */
    await v.parolaKaydiYaz(v.A, "yanlis-parola-uydurma");
    const b = yonlendirici();
    const k3 = await kiraci(b.y, v.A);
    let kosu3 = 0;
    await assert.rejects(kiraciIcinde(b.y.havuz(k3), v.A.id, async () => { kosu3++; }), (e: { code?: string; message?: string }) =>
      e.code === "28P01" && !String(e.message).includes("yanlis-parola-uydurma"));
    assert.deepEqual([kosu3, b.sayac.id], [0, 1]);
  } finally {
    await v.A.sahip.query(`ALTER ROLE probata_uygulama PASSWORD '${eski}'`);
    await v.parolaKaydiYaz(v.A, eski);
  }
});

test("dondurmanın ikinci kilidi: kayıt önbelleği bayatken (15 sn) dondurulmuş firmaya personel ve müşteri girişi / oturumu YOK — ortak ve kendi projeli", async () => {
  const { y, s } = yonlendirici();
  const [kO, kA] = [await kiraci(y, v.O), await kiraci(y, v.A)];
  const gir = (k: IstekKiracisi, ip: string) => girisYap(y.havuz(k), k.firmaId, { eposta: `kisi@${k.kisaAd}.example`, parola: PAROLA, ip });
  const mGir = (ip: string) => musteriGirisYap(y.havuz(kA), kA.firmaId, { eposta: MUSTERI, parola: PAROLA, ip });
  const [gO, gA, mA] = [await gir(kO, "10.9.0.1"), await gir(kA, "10.9.0.2"), await mGir("10.9.0.3")];
  assert.ok(gO.tamam && gA.tamam && mA.tamam);
  if (!gO.tamam || !gA.tamam || !mA.tamam) return;
  assert.ok(await oturumOku(y.havuz(kO), kO.firmaId, gO.belirtec));
  assert.ok(await oturumOku(y.havuz(kA), kA.firmaId, gA.belirtec));
  assert.ok(await musteriOturumOku(y.havuz(kA), kA.firmaId, mA.belirtec));
  /* dondur: merkezde (O, A) ve A'nın kendi veritabanındaki durum kopyası. Kopyayı burada SAHİP yazar — BİLEREK (2026-10-16, FV9): bu test dondurmanın
     İKİNCİ kilidini (oturum.ts ETKIN_FIRMA) oturumlar SİLİNMEDEN sınar; yönetimin dondurması (FV9, 0097 firma_yonetim_durum) oturumları da sildiği için
     onunla açık oturumun geçmediği sınanamazdı (kilit gevşerdi). Yönetimin dondurması — firma tarafı önce, oturumlar silinir, kapalı yön —
     tests/yonetim-firmada.test.ts'te. */
  await v.merkezSahip.query("UPDATE firma SET durum = 'dondu' WHERE id = ANY ($1::uuid[])", [[v.O.id, v.A.id]]);
  await v.A.sahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [v.A.id]);
  try {
    s.t += 14_000;
    assert.ok(await y.kayit("kendi-a") && await y.kayit("ortak-o"), "önbellek bayat: firma hâlâ 'etkin' görünüyor");
    assert.equal(await firmaCoz(v.merkez, "kendi-a"), null, "merkez artık çözmüyor");
    assert.deepEqual([await gir(kO, "10.9.0.4"), await gir(kA, "10.9.0.4"), await mGir("10.9.0.4")],
      [{ tamam: false, neden: "hatali" }, { tamam: false, neden: "hatali" }, { tamam: false, neden: "hatali" }], "dondurulmuş firmaya giriş yok");
    assert.deepEqual([await oturumOku(y.havuz(kO), kO.firmaId, gO.belirtec), await oturumOku(y.havuz(kA), kA.firmaId, gA.belirtec),
      await musteriOturumOku(y.havuz(kA), kA.firmaId, mA.belirtec)], [null, null, null], "açık oturum geçmez");
    s.t += 1_000;
    assert.deepEqual([await y.kayit("kendi-a"), await y.kayit("ortak-o")], [null, null], "süre dolunca firma bulunmaz");
  } finally {
    await v.merkezSahip.query("UPDATE firma SET durum = 'etkin' WHERE id = ANY ($1::uuid[])", [[v.O.id, v.A.id]]);
    await v.A.sahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.A.id]);
  }
  /* etkinleşince: oturum silinmemişti (silmek yönetimin işi), yeniden geçer */
  assert.ok(await oturumOku(y.havuz(kA), kA.firmaId, gA.belirtec));
  assert.ok(await musteriOturumOku(y.havuz(kA), kA.firmaId, mA.belirtec));
});

test("kiracı YALNIZ adresten: istek.ts başlıktan yalnız 'host'u okur; adres → merkezdeki kayıt; kural dışı adres merkeze sorulmaz", async () => {
  /* kaynak denetimi tek yerde (2026-10-15, FV3 incelemesi: önce bu dosyada düz ifadelerdi, olumsuz kanıtı yoktu) — tests/bozan/kiraci-coz.bozan.ts */
  assert.deepEqual(kiraciBasligiEksikleri(oku("src/server/kiraci/istek.ts")), []);
  const { y, sayac } = yonlendirici();
  const kA = await hosttanKiraci("kendi-a.localhost:3100", "localhost", y.kayit);
  assert.deepEqual([kA?.firmaId, kA?.kisaAd, kA?.vt?.vtAd], [v.A.id, "kendi-a", v.A.baglanti.database]);
  assert.equal((await hosttanKiraci("KENDI-A.localhost", "localhost", y.kayit))?.firmaId, v.A.id);
  assert.deepEqual(await hosttanKiraci("ortak-o.probata.com.tr", "probata.com.tr", y.kayit), { firmaId: v.O.id, kisaAd: "ortak-o" });
  const once = sayac.ad;
  for (const h of ["kendi-a.baska.localhost", "localhost", "kendi-a.localhost.saldirgan.example", "kendi_a.localhost", "", "kendi-a.localhost.", "-kendi.localhost"]) {
    assert.equal(await hosttanKiraci(h, "localhost", y.kayit), null, h);
  }
  assert.equal(sayac.ad, once, "kural dışı adres merkeze sorulmadı");
  /* çözüm başka adın kaydını verirse kullanılmaz */
  assert.equal(await hosttanKiraci("kendi-a.localhost", "localhost", () => y.kayit("kendi-b")), null);
});
