/* NEREDEN GELDİ: FIRMA-VT.md §5.1–5.2, FV3 (sunum 579; reisim 2026-10-15: "supabase ve resend bağlantılarını firma açarken biz buradan panelden
   yapalım") — kendi projeli firmanın isteği KENDİ veritabanının havuzuna gitmeli; havuz sayısı sınırlı (sunucusuz örnek başına bağlantı), parola
   yalnız havuz kurulurken çözülür, parola yenilenince istek kesintisiz geçer. SAF: veritabanı yok — bağlantı aşaması sahte sunucularla
   (tests/yardimci/sahte-pg.ts: cevap vermeyen, 28P01 veren; reddeden kapı 1). Gerçek PostgreSQL'deki karşılığı: tests/firma-vt.test.ts.
   Kilitlenenler: ortam sınırları (geçersiz HATA) · ortak firmaya merkez, kendi projeliye kendi havuzu (ayar kayıttan: sunucu, kapı, ad, rol, parola
   çözülmüş, en çok bağlantı) · başka firmanın kaydıyla havuz kurulmaz · kiracı nesnesinde bağlantı kaydı NUMARALANAMAZ (serileştirmeye girmez) ·
   sürüm yalnız ileri · LRU (boştaki düşer) ve düşenin kapanışı · düşürülmüş havuza bağlanan güncel havuza yönlenir · bağlantı reddinde kayıt merkezden
   BİR kez yeniden okunur, iş hiç koşmaz · önbellek (kayıt, olumsuz, unut) · parola ayarda numaralanamaz.
   2026-10-15 (FV3 incelemesi) eklenenler: meşgul havuz LRU'da atılmaz (sınır geçici aşılır, boşalınca düşer; sert sınır iki katı) · düşürülen havuzda
   SIRADA bekleyen istek bağlanma süresini (5 sn) beklemeden güncel havuza geçer, tek atlama · parola reddinde (28P01) merkezdeki sürüm aynıysa İKİNCİ
   DENEME YOK, merkez firma başına tek uçuşla ve en çok 5 sn'de bir sorulur · kiracının bağlantı kaydı numaralanamaz · "olumsuz 5 sn" denetimi unut'tan
   önceye alındı (önce unut olumsuz kaydı zaten sildiği için boşa çalışıyordu) · reddeden kapı yarışsız (1).
   Olumsuz kanıt: tests/bozan/firma-havuzu.bozan.ts (saf) · tests/bozan/firma-vt.bozan.ts (gerçek veritabanında). */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, test } from "node:test";
import { baglantiSifrele, type FirmaVtKaydi } from "../src/server/db/baglanti.ts";
import { firmaHavuzAyari, havuzKimligi, parolaReddi, yenidenDenenir, yonlendiriciKur, type Yonlendirici, type YonlendiriciAyari } from "../src/server/db/firma-havuzu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import type { FirmaCozumu } from "../src/server/db/merkez.ts";
import { cozumdenKiraci } from "../src/server/kiraci/coz.ts";
import { kayitOnbellegiKur } from "../src/server/kiraci/kayit-onbellek.ts";
import { bekle, KAPALI_KAPI, sahteSunucu, sonucu } from "./yardimci/sahte-pg.ts";

const ANAHTAR = randomBytes(32);
const A = "00000000-0000-4000-8000-00000000000a", B = "00000000-0000-4000-8000-00000000000b", C = "00000000-0000-4000-8000-00000000000c";
const O = "00000000-0000-4000-8000-0000000000aa";
const kayit = (firmaId: string, kapi: number, surum = 1, parola = `parola-${firmaId.slice(-2)}-uydurma`): FirmaVtKaydi => ({
  firmaId, ref: null, sunucu: "127.0.0.1", kapi, vtAd: `probata_firma_${firmaId.slice(-1)}`, kullanici: "probata_uygulama",
  parolaSifreli: baglantiSifrele(parola, firmaId, null, "uygulama_parolasi", ANAHTAR), depo: null, surum,
});
const kendi = (k: FirmaVtKaydi, kisaAd = `kendi-${k.firmaId.slice(-1)}`): FirmaCozumu => ({ id: k.firmaId, kisaAd, vt: "kendi", kayit: k });
const merkez: Havuz = havuzKur({ host: "127.0.0.1", port: KAPALI_KAPI, database: "probata", user: "probata_uygulama", password: "merkez-uydurma" });
after(async () => { await merkez.end(); });
/** açık havuzların firmaları, en eski kullanılan önde */
const firmalar = (y: Yonlendirici) => y.acikHavuzlar.map((k) => k.split(":")[0]);

function kur(ek: Partial<YonlendiriciAyari> & { cozumler?: Map<string, FirmaCozumu | null> } = {}) {
  const sayac = { ad: 0, id: 0 }, birakilan: Promise<unknown>[] = [];
  const cozumler = ek.cozumler ?? new Map<string, FirmaCozumu | null>();
  const y = yonlendiriciKur({
    merkez: () => merkez, anahtar: () => ANAHTAR, merkezYerel: true, birak: (p) => { birakilan.push(p.catch(() => {})); },
    coz: {
      ad: async (k) => { sayac.ad++; return [...cozumler.values()].find((c) => c?.kisaAd === k) ?? null; },
      id: async (i) => { sayac.id++; return cozumler.get(i) ?? null; },
    },
    ...ek,
  });
  return { y, sayac, birakilan, cozumler };
}

test("ortam: PROBATA_FIRMA_HAVUZ 1–5 (varsayılan 3), PROBATA_FIRMA_HAVUZ_SAYI 1–200 (varsayılan 32); geçersiz değer HATA", () => {
  assert.deepEqual(firmaHavuzAyari({}), { firmaHavuz: 3, havuzSayisi: 32 });
  assert.deepEqual(firmaHavuzAyari({ PROBATA_FIRMA_HAVUZ: "5", PROBATA_FIRMA_HAVUZ_SAYI: "1" }), { firmaHavuz: 5, havuzSayisi: 1 });
  for (const [ad, v] of [["PROBATA_FIRMA_HAVUZ", "0"], ["PROBATA_FIRMA_HAVUZ", "6"], ["PROBATA_FIRMA_HAVUZ", "2.5"], ["PROBATA_FIRMA_HAVUZ_SAYI", "0"],
    ["PROBATA_FIRMA_HAVUZ_SAYI", "201"], ["PROBATA_FIRMA_HAVUZ_SAYI", "otuz"]] as const) {
    assert.throws(() => firmaHavuzAyari({ [ad]: v }), new RegExp(ad), `${ad}=${v}`);
  }
  assert.throws(() => yonlendiriciKur({ merkez: () => merkez, anahtar: () => ANAHTAR, merkezYerel: true, firmaHavuz: 6 }), /1–5/);
  assert.throws(() => yonlendiriciKur({ merkez: () => merkez, anahtar: () => ANAHTAR, merkezYerel: true, havuzSayisi: 0 }), /en az 1/);
});

test("ortak firmaya merkez havuzu; kendi projeliye kayıttan KENDİ havuzu (parola çözülmüş, en çok 3 bağlantı); başka firmanın kaydıyla havuz kurulmaz; kiracıda kayıt numaralanamaz", async () => {
  const { y } = kur();
  assert.equal(y.havuz({ firmaId: O }), merkez);
  const kA = kayit(A, 6543), kB = kayit(B, 6544);
  const hA = y.havuz({ firmaId: A, vt: kA }), hB = y.havuz({ firmaId: B, vt: kB });
  assert.notEqual(hA, merkez);
  assert.notEqual(hA, hB);
  assert.deepEqual([hA.options.host, hA.options.port, hA.options.database, hA.options.user, hA.options.max, hA.options.ssl],
    ["127.0.0.1", 6543, "probata_firma_a", "probata_uygulama", 3, false]);
  assert.equal(hA.options.password, "parola-0a-uydurma", "parola havuz kurulurken çözüldü");
  /* sır günlüğe düşmez: ayarda numaralanamaz (pg) */
  assert.ok(!Object.keys(hA.options).includes("password"));
  assert.ok(!JSON.stringify(hA.options).includes("parola-0a-uydurma"));
  /* kiracı nesnesi: kayıt havuz seçimi için erişilir ama NUMARALANAMAZ — 2026-10-15 (FV3 incelemesi, kasıtlı): önce serileştirmede şifreli kaydı
     taşıyordu; nesne yanlışlıkla bir istemci bileşenine / eylem yanıtına girse altyapı bilgisi (sunucu, kapı, veritabanı adı) ve şifreli parola
     tarayıcıya giderdi */
  const kiraci = cozumdenKiraci(kendi(kA))!;
  assert.equal(kiraci.vt, kA);
  assert.deepEqual(Object.keys(kiraci), ["firmaId", "kisaAd"]);
  const j = JSON.stringify(kiraci);
  assert.ok(!j.includes(kA.parolaSifreli) && !j.includes("probata_firma_a") && !j.includes("6543") && !j.includes("parola-0a-uydurma"), j);
  assert.equal({ ...kiraci }.vt, undefined, "yayılan kopya kaydı taşımaz");
  assert.equal(y.havuz({ ...kiraci }), merkez, "yayılan kopya merkeze düşer (veritabanı reddeder — kapalı yön, tests/firma-vt.test.ts)");
  assert.equal(y.havuz(kiraci), hA);
  /* kayıt başka firmanın: havuz yok (yanlış yönlendirme kodda da durur; son kapı veritabanında — tests/firma-vt.test.ts) */
  assert.throws(() => y.havuz({ firmaId: A, vt: kB }), /başka bir firmanın/);
  /* başka ana anahtar / izin dışı sunucu: parola çözülmez, havuz kurulmaz */
  assert.throws(() => kur({ anahtar: () => randomBytes(32) }).y.havuz({ firmaId: A, vt: kA }));
  assert.throws(() => kur({ merkezYerel: false }).y.havuz({ firmaId: A, vt: kA }), /yerel adreste olamaz/);
  assert.equal(kur({ firmaHavuz: 1 }).y.havuz({ firmaId: A, vt: kA }).options.max, 1);
  await y.kapat();
  assert.throws(() => y.havuz({ firmaId: A, vt: kA }), /kapatıldı/, "kapattıktan sonra havuz kurulmaz");
});

test("sürüm yalnız ileri; en eski kullanılan BOŞTAKİ havuz düşer (LRU), kapanışı bırakılır; düşürülmüş havuza bağlanan güncel havuza yönlenir", async () => {
  const { y, birakilan, cozumler } = kur({ havuzSayisi: 2 });
  const kA1 = kayit(A, KAPALI_KAPI, 1), kA2 = kayit(A, KAPALI_KAPI, 2);
  const h1 = y.havuz({ firmaId: A, vt: kA1 });
  assert.equal(y.havuz({ firmaId: A, vt: kA1 }), h1, "aynı kayıt → aynı havuz");
  const h2 = y.havuz({ firmaId: A, vt: kA2 });
  assert.notEqual(h2, h1, "yeni sürüm → yeni havuz");
  assert.equal(birakilan.length, 1);
  await Promise.all(birakilan);
  assert.ok(h1.ending && h1.ended, "eski sürümün havuzu kapandı");
  assert.equal(y.havuz({ firmaId: A, vt: kA1 }), h2, "eski kayıtla gelen istek yeni havuzu bozmaz");
  assert.deepEqual(y.acikHavuzlar, [havuzKimligi(kA2)]);
  /* LRU: A, B; A kullanılır; C gelince en eski kullanılan B düşer */
  const kB = kayit(B, KAPALI_KAPI), kC = kayit(C, KAPALI_KAPI);
  const hB = y.havuz({ firmaId: B, vt: kB });
  y.havuz({ firmaId: A, vt: kA2 });
  y.havuz({ firmaId: C, vt: kC });
  assert.deepEqual(y.acikHavuzlar, [havuzKimligi(kA2), havuzKimligi(kC)]);
  assert.equal(birakilan.length, 2);
  await Promise.all(birakilan);
  assert.ok(hB.ended, "düşen havuz kapandı");
  /* düşürülmüş havuz (elinde eski nesne kalan istek): "havuz kapandı" hatası değil, firmanın güncel havuzuna yönlenir — burada güncel havuz da
     bağlanamaz (reddeden kapı), yani yönlendirildiği bağlantı reddinden görülür; kayıt bir kez yeniden okunur */
  cozumler.set(B, kendi(kB));
  let kosu = 0;
  await assert.rejects(kiraciIcinde(hB, B, async () => { kosu++; }), (h: Error & { code?: string }) => h.code === "ECONNREFUSED" && !/after calling end/.test(h.message));
  assert.equal(kosu, 0, "iş koşmadı");
  assert.ok(y.acikHavuzlar.some((k) => k.startsWith(`${B}:`)), "B'nin güncel havuzu kuruldu");
  await Promise.all(birakilan);
  await y.kapat();
});

test("LRU MEŞGUL havuzu atmaz: sınır geçici aşılır, boştaki düşer, meşgul olan boşalınca sonraki çağrıda düşer; sert sınırda (2 ×) meşgul de düşer", async () => {
  const asili = await sahteSunucu("asili"), asili2 = await sahteSunucu("asili");
  try {
    const { y, birakilan } = kur({ havuzSayisi: 1 });
    const hA = y.havuz({ firmaId: A, vt: kayit(A, asili.kapi) });
    const pA = sonucu(kiraciIcinde(hA, A, async () => {}));   // bağlanıyor (sunucu cevap vermez) → A meşgul
    await bekle(() => asili.baglanti === 1, "A bağlanıyor");
    const kC = kayit(C, 6545);
    y.havuz({ firmaId: B, vt: kayit(B, 6544) });
    assert.deepEqual([firmalar(y), birakilan.length], [[A, B], 0], "meşgul A atılmadı: sınır geçici aşıldı");
    y.havuz({ firmaId: C, vt: kC });
    assert.deepEqual([firmalar(y), birakilan.length], [[A, C], 1], "boştaki B düştü, meşgul A kaldı");
    asili.kopar();
    assert.notEqual(await pA, "geçti");
    assert.equal(hA.totalCount, 0, "A boşaldı");
    y.havuz({ firmaId: C, vt: kC });
    assert.deepEqual([firmalar(y), hA.ending], [[C], true], "boşalan A sonraki çağrıda düştü");
    await y.kapat();
    await Promise.all(birakilan);

    /* sert sınır: A ve B meşgulken C gelir → en eski kullanılan A meşgul de olsa düşer (bağlantı sayısı sınırsız büyümez) */
    const { y: y2 } = kur({ havuzSayisi: 1 });
    const h1 = y2.havuz({ firmaId: A, vt: kayit(A, asili2.kapi) });
    const p1 = sonucu(kiraciIcinde(h1, A, async () => {}));
    await bekle(() => asili2.baglanti === 1, "A bağlanıyor");
    const h2 = y2.havuz({ firmaId: B, vt: kayit(B, asili2.kapi) });
    const p2 = sonucu(kiraciIcinde(h2, B, async () => {}));
    await bekle(() => asili2.baglanti === 2, "B bağlanıyor");
    assert.deepEqual(firmalar(y2), [A, B]);
    y2.havuz({ firmaId: C, vt: kC });
    assert.deepEqual([firmalar(y2), h1.ending, h2.ending], [[B, C], true, false], "sert sınırda en eski kullanılan (meşgul) A düştü");
    const kapanis = y2.kapat();
    asili2.kopar();
    await kapanis;
    assert.ok((await p1) !== "geçti" && (await p2) !== "geçti");
  } finally {
    await asili.kapat();
    await asili2.kapat();
  }
});

test("düşürülen havuzda SIRADA bekleyen istek bağlanma süresini (5 sn) beklemeden güncel havuza geçer; TEK atlama — geçtiği havuz da düşerse hata; iş hiç koşmaz", async () => {
  const asili = await sahteSunucu("asili");
  try {
    const { y, birakilan } = kur({ firmaHavuz: 1 });
    let kosu = 0;
    const h1 = y.havuz({ firmaId: A, vt: kayit(A, asili.kapi, 1) });
    const r1 = sonucu(kiraciIcinde(h1, A, async () => { kosu++; }));   // tek bağlantı: bağlanıyor
    await bekle(() => asili.baglanti === 1, "ilk istek bağlanıyor");
    const r2 = sonucu(kiraciIcinde(h1, A, async () => { kosu++; }));   // sırada
    await bekle(() => h1.waitingCount === 1, "ikinci istek sırada");
    /* yeni sürüm: h1 düşer; iki istek de BEKLEMEDEN v2'ye geçer (bağlanma yeniden başlar) — pg-pool kapanan havuzun sırasındakine hizmet etmez */
    y.havuz({ firmaId: A, vt: kayit(A, asili.kapi, 2) });
    await bekle(() => asili.baglanti === 2, "sıradaki istek güncel havuza geçti", 2_000);
    /* v2 de düşer (v3): v2'ye geçmiş istekler İKİNCİ kez sekmez — hata (art arda sekme yok) */
    y.havuz({ firmaId: A, vt: kayit(A, asili.kapi, 3) });
    assert.match(await r1, /art arda düşürüldü/);
    assert.match(await r2, /art arda düşürüldü/);
    assert.equal(kosu, 0, "iş koşmadı");
    asili.kopar();
    await Promise.all(birakilan);
    await y.kapat();
  } finally { await asili.kapat(); }
});

test("bağlantı reddi: kayıt merkezden BİR kez yeniden okunur, yeni sürümle bir kez daha bağlanılır; iş iki kez koşmaz; firma çözülmüyorsa havuzu düşer", async () => {
  const { y, sayac, cozumler, birakilan } = kur();
  const k1 = kayit(A, KAPALI_KAPI, 1);
  /* merkezde artık sürüm 2 (parola / sunucu yenilendi) — burada da reddeden kapı: ikinci deneme de düşer, hata yukarı */
  cozumler.set(A, kendi(kayit(A, KAPALI_KAPI, 2)));
  const h = y.havuz({ firmaId: A, vt: k1 });
  let kosu = 0;
  await assert.rejects(kiraciIcinde(h, A, async () => { kosu++; }), (e: { code?: string }) => e.code === "ECONNREFUSED");
  assert.deepEqual([kosu, sayac.id], [0, 1], "iş koşmadı; kayıt bir kez yeniden okundu (sonsuz deneme yok)");
  assert.deepEqual(y.acikHavuzlar, [havuzKimligi(kayit(A, KAPALI_KAPI, 2))], "eski havuz düştü, yeni sürümün havuzu");
  await Promise.all(birakilan);
  assert.ok(h.ended);
  /* yenilenen kayıt önbellekte: sonraki istek merkezi sormadan yeni sürümü alır */
  assert.equal(await y.kayitKimlikle(A), cozumler.get(A));
  assert.equal(sayac.id, 1);
  /* firma artık çözülmüyorsa (dondu / bakımda) yeniden bağlanılmaz: ilk hata yukarı, havuzu düşer */
  const { y: y2, cozumler: c2 } = kur();
  c2.set(A, null);
  const h2 = y2.havuz({ firmaId: A, vt: k1 });
  await assert.rejects(kiraciIcinde(h2, A, async () => { kosu++; }), (e: { code?: string }) => e.code === "ECONNREFUSED");
  assert.deepEqual([kosu, y2.acikHavuzlar, h2.ending], [0, [], true]);
  /* yeniden denenen hatalar yalnız bağlantı kurmadakiler; parola / rol reddi ayrı (aynı sürümde ikinci deneme yok) */
  assert.deepEqual(["28P01", "28000", "ECONNREFUSED", "42501", "57P01", "ETIMEDOUT", undefined].map((code) => yenidenDenenir({ code })),
    [true, true, true, false, false, false, false]);
  assert.deepEqual(["28P01", "28000", "ECONNREFUSED"].map((code) => parolaReddi({ code })), [true, true, false]);
  assert.equal(yenidenDenenir(null), false);
  await y.kapat();
  await y2.kapat();
});

test("parola reddi (28P01): merkezde daha yeni sürüm yoksa İKİNCİ DENEME YOK, havuz kalır; merkez firma başına tek uçuşla, en çok 5 sn'de bir; yeni sürümde bir kez daha", async () => {
  const parola = await sahteSunucu("parola");
  try {
    const s = { t: 0 };
    const { y, sayac, cozumler } = kur({ simdi: () => s.t });
    const k1 = kayit(A, parola.kapi, 1);
    cozumler.set(A, kendi(k1));   // merkezde de aynı sürüm: parola dışarıda değişti (ya da yenileme yarıda)
    let kosu = 0;
    const dene = () => kiraciIcinde(y.havuz({ firmaId: A, vt: k1 }), A, async () => { kosu++; });
    const h = y.havuz({ firmaId: A, vt: k1 });
    await assert.rejects(dene(), (e: { code?: string }) => e.code === "28P01");
    assert.deepEqual([parola.baglanti, sayac.id, kosu], [1, 1, 0], "tek parola denemesi; merkez bir kez");
    assert.deepEqual(y.acikHavuzlar, [havuzKimligi(k1)], "havuz kaldı (çalkantı yok)");
    /* art arda istekler (ikisi eşzamanlı): her biri tek deneme; merkez 5 sn içinde yeniden sorulmaz */
    assert.deepEqual(await Promise.all([sonucu(dene()), sonucu(dene())]), ["28P01", "28P01"]);
    assert.equal(await sonucu(dene()), "28P01");
    assert.deepEqual([parola.baglanti, sayac.id], [4, 1]);
    s.t += 5_000;
    assert.equal(await sonucu(dene()), "28P01");
    assert.deepEqual([parola.baglanti, sayac.id], [5, 2], "5 sn sonra merkez yeniden soruldu");
    /* merkezde yeni sürüm (parola yenilendi): ikinci deneme yeni havuzla — burada o da reddedilir; istek başına yine en çok iki deneme */
    s.t += 5_000;
    const k2 = kayit(A, parola.kapi, 2);
    cozumler.set(A, kendi(k2));
    assert.equal(await sonucu(dene()), "28P01");
    assert.deepEqual([parola.baglanti, sayac.id, kosu], [7, 3, 0], "yeni sürümle bir kez daha");
    assert.deepEqual([y.acikHavuzlar, h.ending], [[havuzKimligi(k2)], true], "eski sürümün havuzu düştü");
    await y.kapat();
  } finally { await parola.kapat(); }
});

test("kayıt önbelleği: kısa ad ve kimlik ayrı anahtar — kısa adla çözülen firma kimlikle de bulunur (FV5); olumsuz 5 sn tutulur; unut boşaltır; kimlikten havuz", async () => {
  const s = { t: 0 };
  const kA = kayit(A, 6543);
  const cozumler = new Map<string, FirmaCozumu | null>([[A, kendi(kA)], [O, { id: O, kisaAd: "ortak-o", vt: "ortak" }]]);
  const { y, sayac } = kur({ cozumler, onbellek: kayitOnbellegiKur<FirmaCozumu>({ simdi: () => s.t }) });
  assert.equal(await y.kayit("kendi-a"), cozumler.get(A));
  assert.equal(await y.kayit("kendi-a"), cozumler.get(A));
  assert.equal(await y.kayit("yok"), null);
  s.t += 4_999;
  assert.equal(await y.kayit("yok"), null);
  assert.deepEqual(sayac, { ad: 2, id: 0 }, "olumsuz 5 sn tutulur");
  s.t += 1;
  assert.equal(await y.kayit("yok"), null);
  assert.equal(sayac.ad, 3, "5 sn dolunca merkez yeniden sorulur");
  assert.equal(await y.havuzKimlikle(O), merkez);
  assert.equal(await y.havuzKimlikle(A), y.havuz({ firmaId: A, vt: kA }));
  assert.equal(await y.havuzKimlikle(B), null);
  /* 2026-10-16 (FV5, kasıtlı): önce kısa adla çözülen A kimlikle yeniden merkeze soruluyordu (3); artık kısa ad çözümü kimlik kaydını da yazar —
     depo yönlendiricisi anahtardaki kimlikle sorar, açık işlemin yanında ikinci merkez bağlantısı açılmasın. Kısa adla çözülmemiş O ve B merkezden. */
  assert.equal(sayac.id, 2, "A kimlikle önbellekten; O ve B merkezden");
  assert.equal(await y.kayit("kendi-a"), cozumler.get(A), "olumlu kayıt hâlâ önbellekte");
  assert.equal(sayac.ad, 3);
  y.unut();
  await y.kayit("kendi-a");
  assert.equal(sayac.ad, 4, "unut sonrası merkez yeniden sorulur");
  await y.kapat();
});
