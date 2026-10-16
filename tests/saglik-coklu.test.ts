/* NEREDEN GELDİ: FIRMA-VT.md §5.5 "Sağlık", §6 FV7 (sunum 579, reisim onayı 2026-10-15) — "/api/saglik firma adresinde merkezi ve o firmanın
   veritabanını denetler; yeni alan firma_vt (vt_firma_dogrula). Firma listesi ya da sayısı açık uçta görünmez. Yeni /api/saglik/projeler: zamanliYetkili
   ile korunur; 4 eşzamanlı, proje başına 5 sn; yalnız {toplam, tamam, sorunlu} döner. Proje başına sonuç firma_vt.son_saglik'e yazılır."
   GERÇEK PostgreSQL, iki küme, üç veritabanı (tests/yardimci/coklu-vt.ts): merkez + ortak firma O, kendi-A AYRI kümede, kendi-B merkezle aynı kümede
   ikinci veritabanında; ayrıca merkezde kurulumu süren "kurulum-c" (bağlantısı yok). Uçların çekirdeği (src/server/saglik.ts saglikDenetle /
   projeleriYokla) gerçek yönlendiriciyle (adres → firma_coz → kiracının havuzu) çağrılır. Kilitlenenler:
   · /api/saglik her adreste aynı yedi anahtar (ortak firma, iki kendi projeli firma, kök, bilinmeyen firma) — firma listesi / sayısı okunmaz
     (2026-10-15 FV7 incelemesi: "varlığı okunmaz" iddiası daraltıldı — firma veritabanı sorunluyken firma_vt=false o adresi ele verir);
     firma adresinde firmanın veritabanı gerçekten denetlenir (kendi havuzu); firmanın veritabanında son göç yok / göç sayısı eksik → YALNIZ o firmanın
     adresi "sorun" (firma_vt yanlış, merkezin altısı doğru); kayıt merkezin veritabanını gösteriyor → firma_vt yanlış (vt_firma_dogrula — yanlış
     veritabanının göçü sayılmaz); ulaşılamayan / cevap vermeyen firma süre sınırında yanlış; merkeze ulaşılamıyor → hepsi yanlış, uç düşmez;
   · /api/saglik/projeler: sayılar doğru; kurulumdaki firma yoklanmaz ve sayılmaz; bakımdaki (göç dışı) yoklanmaz; dondurulmuş yoklanır; proje başına
     sonuç merkezde son_saglik (durum, denetimler, sınıflanmış neden, bulunan göç, sürüm) + son_saglik_zaman; ortak firmanın kaydı yok; göç eksik,
     ulaşılamadı (ECONNREFUSED), parola (28P01), yanlış veritabanı (42501 — kimlik yanlış), ana anahtar yok / yanlış, yerel adres (merkez yayında);
     cevap vermeyen proje proje süresinde kesilir; bütün süre dolunca başlamamış proje sorunlu sayılır, yazılmaz; merkez yerine firma veritabanı
     verilirse RED (vt_merkez_dogrula);
   · SIR YOK: son_saglik'te ve yanıtlarda parola, ana anahtar, şifreli metin, kısa ad, sunucu adresi yok.
   Saf parçalar: tests/saglik-coklu-saf.test.ts. Olumsuz kanıt: tests/bozan/saglik-coklu.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer, type Socket } from "node:net";
import { after, before, test } from "node:test";
import type pg from "pg";
import { yonlendiriciKur, type Yonlendirici } from "../src/server/db/firma-havuzu.ts";
import { gocDosyalari } from "../src/server/db/goc.ts";
import { havuzKur } from "../src/server/db/kiraci.ts";
import { firmaCoz } from "../src/server/db/merkez.ts";
import { GOC_SAYISI, SON_GOC } from "../src/server/db/son-goc.ts";
import { hosttanKiraci } from "../src/server/kiraci/coz.ts";
import { projeleriYokla, saglikDenetle, type ProjeAyari, type SaglikAyari, type SaglikYaniti } from "../src/server/saglik.ts";
import { cokluVtKur, type CokluVt, type TestFirmasi } from "./yardimci/coklu-vt.ts";

let v: CokluVt;
let y: Yonlendirici;
let kurulumC: string;
const GOCLER = gocDosyalari();
const SON = GOCLER.at(-1)!, ONCEKI = GOCLER.at(-2)!, ILK = GOCLER[0]!;
const YANLIS = `yanlis-${randomBytes(12).toString("base64url")}`;
/** bütün yanıtlar ve yazılan son_saglik metinleri — son testte sır taraması */
const ciktilar: string[] = [];
const ADRESLER = ["ortak-o.localhost", "kendi-a.localhost", "kendi-b.localhost", "localhost", "yok-boyle-firma.localhost"];
/* 2026-10-15 (FV7 incelemesi): "ulaşılamayan" senaryolarda hiç dinlenmeyen SABİT kapı — 127.0.0.1:1 hemen ECONNREFUSED döner (firma_vt.kapi CHECK'i
   1–65535). Önce bosKapi() kullanılıyordu: kapı açılıp hemen bırakılıyor, aynı anda koşan başka test dosyasının kümesi o kapıyı alırsa hata
   28P01 / 3D000 olur ve "bağlantı reddedildi (ECONNREFUSED)" beklentisi ara sıra düşerdi. */
const KAPALI_KAPI = 1;
const tamamYanit = (surum = "deneme"): SaglikYaniti => ({
  durum: "tamam", surum,
  denetimler: { veritabani: true, goc_guncel: true, rls: true, api_kapali: true, uygulama_kisitli: true, isler: true, firma_vt: true },
});

/** adresin sağlığı — yayındaki yolla: Host → firma_coz (yönlendiricinin önbelleği) → kiracının havuzu */
async function adresle(host: string, ek: Partial<SaglikAyari> = {}): Promise<SaglikYaniti> {
  const r = await saglikDenetle({ merkez: () => v.merkez, kiraciBul: () => hosttanKiraci(host, "localhost", y.kayit), havuz: y.havuz, surum: "deneme", ...ek });
  ciktilar.push(JSON.stringify(r));
  return r;
}
async function yokla(ek: Partial<ProjeAyari> = {}) {
  const r = await projeleriYokla({ merkez: v.merkez, anahtar: () => v.anahtar, merkezYerel: true, surum: "deneme", ...ek });
  ciktilar.push(JSON.stringify(r));
  return r;
}
interface SonSaglik { durum: string; denetimler: Record<string, boolean>; neden?: string; goc?: { son: string | null; sayi: number }; surum: string }
/** merkezdeki son_saglik (firma başına) — okunan metin sır taramasına girer */
async function son(f: { id: string }): Promise<{ s: SonSaglik | null; zaman: Date | null }> {
  const r = (await v.merkezSahip.query<{ s: SonSaglik | null; zaman: Date | null }>(
    "SELECT son_saglik AS s, son_saglik_zaman AS zaman FROM firma_vt WHERE firma_id = $1", [f.id])).rows[0];
  if (!r) return { s: null, zaman: null };
  if (r.s) ciktilar.push(JSON.stringify(r.s));
  return r;
}
const sonuSil = () => v.merkezSahip.query("UPDATE firma_vt SET son_saglik = NULL, son_saglik_zaman = NULL");

/** göç KAYDINI (yalnız goc satırı; şema aynı) geçici siler, iş bitince aynen geri yazar */
async function gocKaydiOlmadan<T>(sahip: pg.Client, ad: string, is: () => Promise<T>): Promise<T> {
  const r = await sahip.query<{ ad: string; ozet: string; uygulandi: Date }>("DELETE FROM goc WHERE ad = $1 RETURNING ad, ozet, uygulandi", [ad]);
  assert.equal(r.rowCount, 1, `göç kaydı yok: ${ad}`);
  try { return await is(); } finally {
    await sahip.query("INSERT INTO goc (ad, ozet, uygulandi) VALUES ($1, $2, $3)", [r.rows[0]!.ad, r.rows[0]!.ozet, r.rows[0]!.uygulandi]);
  }
}
/** merkezdeki bağlantı kaydında bir sütunu geçici değiştirir — sürüm İLERİ gider (havuz yalnız ileri sürümde yenilenir) ve kayıt önbelleği boşalır */
async function kayitla<T>(f: TestFirmasi, sutun: "kapi" | "vt_ad", deger: unknown, is: () => Promise<T>): Promise<T> {
  const once = (await v.merkezSahip.query(`SELECT ${sutun} AS d FROM firma_vt WHERE firma_id = $1`, [f.id])).rows[0]!.d;
  await v.merkezSahip.query(`UPDATE firma_vt SET ${sutun} = $2, surum = surum + 1 WHERE firma_id = $1`, [f.id, deger]);
  y.unut();
  try { return await is(); } finally {
    await v.merkezSahip.query(`UPDATE firma_vt SET ${sutun} = $2, surum = surum + 1 WHERE firma_id = $1`, [f.id, once]);
    y.unut();
  }
}
/** bağlantıyı kabul edip HİÇ cevap vermeyen sunucu (asılı ağ / havuzcu) */
function sessizSunucu(): Promise<{ kapi: number; kapat: () => Promise<void> }> {
  return new Promise((coz, reddet) => {
    const soketler = new Set<Socket>();
    const s = createServer((k) => { soketler.add(k); k.on("error", () => {}); k.on("close", () => soketler.delete(k)); });
    s.once("error", reddet);
    s.listen(0, "127.0.0.1", () => {
      const a = s.address();
      coz({
        kapi: typeof a === "object" && a ? a.port : 0,
        kapat: () => new Promise<void>((bitti) => { for (const k of soketler) k.destroy(); s.close(() => bitti()); }),
      });
    });
  });
}

before(async () => {
  v = await cokluVtKur();
  y = yonlendiriciKur({ merkez: () => v.merkez, anahtar: () => v.anahtar, merkezYerel: true });
  /* kurulumu süren kendi projeli firma (FIRMA-VT §5.12 adım 'goc'): proje açıldı (ref), uygulama parolası / havuzcu henüz yok — örnek veri UYDURMA */
  kurulumC = randomUUID();
  await v.merkezSahip.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt, durum) VALUES ($1, 'kurulum-c', 'Kurulum C Muayene', 'KC', 'kendi', 'kurulum')", [kurulumC]);
  await v.merkezSahip.query("INSERT INTO firma_vt (firma_id, ref) VALUES ($1, 'abcdefghij0123456789')", [kurulumC]);
  await v.merkezSahip.query("INSERT INTO firma_kurulum (firma_id, adim, durum) VALUES ($1, 'goc', 'calisiyor')", [kurulumC]);
});
after(async () => { await y?.kapat(); await v?.kapat(); });

/* ── /api/saglik ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
test("her adreste aynı yedi anahtar, hepsi doğru; firma adresinde firmanın KENDİ havuzu denetlenir, firma olmayan adreste firma havuzu hiç açılmaz", async () => {
  assert.equal(SON.ad, SON_GOC);
  assert.equal(GOCLER.length, GOC_SAYISI);
  const istenen: string[] = [];
  for (const host of ADRESLER) {
    const r = await adresle(host, { havuz: (k) => { istenen.push(k.firmaId); return y.havuz(k); } });
    assert.deepEqual(r, tamamYanit(), host);
  }
  assert.deepEqual(istenen, [v.O.id, v.A.id, v.B.id], "yalnız üç firma adresinde firma denetimi; kök ve bilinmeyen adreste yok");
  /* kendi projeli firmaların havuzu açıldı (adres → kayıt → kendi veritabanı) */
  assert.deepEqual(y.acikHavuzlar.map((k) => k.split(":")[0]).sort(), [v.A.id, v.B.id].sort());
});

test("firmanın veritabanında son göç yok → YALNIZ o firmanın adresi 'sorun' (firma_vt yanlış, merkezin altı denetimi doğru); öteki adresler tamam", async () => {
  await gocKaydiOlmadan(v.A.sahip, SON.ad, async () => {
    const a = await adresle("kendi-a.localhost");
    assert.equal(a.durum, "sorun");
    assert.deepEqual(a.denetimler, { ...tamamYanit().denetimler, firma_vt: false });
    for (const host of ADRESLER.filter((h) => h !== "kendi-a.localhost")) assert.deepEqual(await adresle(host), tamamYanit(), host);
  });
  assert.deepEqual(await adresle("kendi-a.localhost"), tamamYanit(), "geri yazılınca tamam");
});

test("göç SAYISI eksik (son göç aynı) → o firmanın adresi sorun — aynı kümedeki ikinci veritabanında", async () => {
  await gocKaydiOlmadan(v.B.sahip, ILK.ad, async () => {
    const b = await adresle("kendi-b.localhost");
    assert.deepEqual([b.durum, b.denetimler.firma_vt, b.denetimler.goc_guncel], ["sorun", false, true]);
    assert.deepEqual(await adresle("kendi-a.localhost"), tamamYanit());
  });
});

test("kayıt merkezin veritabanını gösteriyor → firma_vt yanlış (vt_firma_dogrula: yanlış veritabanının göçü 'güncel' sayılmaz)", async () => {
  await kayitla(v.B, "vt_ad", v.merkezKume.uygulama.database, async () => {
    const b = await adresle("kendi-b.localhost");
    assert.deepEqual([b.durum, b.denetimler.firma_vt, b.denetimler.veritabani], ["sorun", false, true]);
  });
  assert.deepEqual(await adresle("kendi-b.localhost"), tamamYanit(), "kayıt geri gelince tamam");
});

test("firmanın veritabanına ulaşılamıyor → firma_vt yanlış; cevap vermeyen firma süre sınırında kesilir (uç asılmaz)", async () => {
  await kayitla(v.A, "kapi", KAPALI_KAPI, async () => {
    const a = await adresle("kendi-a.localhost");
    assert.deepEqual([a.durum, a.denetimler.firma_vt, a.denetimler.veritabani], ["sorun", false, true]);
  });
  const s = await sessizSunucu();
  try {
    await kayitla(v.A, "kapi", s.kapi, async () => {
      const bas = Date.now();
      const a = await adresle("kendi-a.localhost", { firmaMs: 1_000 });
      const sure = Date.now() - bas;
      assert.deepEqual([a.durum, a.denetimler.firma_vt], ["sorun", false]);
      assert.ok(sure < 4_000, `süre sınırı: ${sure} ms`);
    });
  } finally { await s.kapat(); }
  assert.deepEqual(await adresle("kendi-a.localhost"), tamamYanit());
});

test("merkeze ulaşılamıyor → altı denetim yanlış, firma adresinde firma çözülemez (firma_vt yanlış); kökte firma_vt doğru kalır; uç düşmez", async () => {
  const kapali = havuzKur({ ...v.merkezKume.uygulama, port: KAPALI_KAPI });
  try {
    const coz = (k: string) => firmaCoz(kapali, k);
    const firma = await saglikDenetle({ merkez: () => kapali, kiraciBul: () => hosttanKiraci("kendi-a.localhost", "localhost", coz), havuz: y.havuz, surum: "deneme" });
    assert.equal(firma.durum, "sorun");
    assert.ok(Object.values(firma.denetimler).every((x) => x === false), JSON.stringify(firma));
    const kok = await saglikDenetle({ merkez: () => kapali, kiraciBul: () => hosttanKiraci("localhost", "localhost", coz), havuz: y.havuz, surum: "deneme" });
    assert.deepEqual(Object.keys(kok.denetimler), Object.keys(tamamYanit().denetimler), "kökte de yedi anahtar");
    assert.deepEqual([kok.durum, kok.denetimler.veritabani, kok.denetimler.firma_vt], ["sorun", false, true]);
    const atan = await saglikDenetle({ merkez: () => { throw new Error("ayar yok"); }, kiraciBul: async () => null, havuz: y.havuz, surum: "deneme" });
    assert.deepEqual([atan.durum, atan.denetimler.veritabani], ["sorun", false], "merkez havuzu kurulamasa da uç düşmez");
  } finally { await kapali.end(); }
});

/* ── /api/saglik/projeler ────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
test("projeler: hepsi sağlam → {2, 2, 0}; her projenin sonucu merkezde son_saglik + zaman; kurulumdaki ve ortak firma yazılmaz / sayılmaz", async () => {
  await sonuSil();
  const r = await yokla();
  assert.deepEqual(r, { toplam: 2, tamam: 2, sorunlu: 0 });
  assert.deepEqual(Object.keys(r).sort(), ["sorunlu", "tamam", "toplam"]);
  for (const f of [v.A, v.B]) {
    const { s, zaman } = await son(f);
    assert.ok(zaman instanceof Date && Date.now() - zaman.getTime() < 60_000, f.kisaAd);
    assert.deepEqual(s, {
      durum: "tamam", surum: "deneme", goc: { son: SON_GOC, sayi: GOC_SAYISI },
      denetimler: { veritabani: true, goc_guncel: true, rls: true, api_kapali: true, uygulama_kisitli: true, isler: true, kimlik: true },
    }, f.kisaAd);
  }
  assert.deepEqual(await son({ id: kurulumC }), { s: null, zaman: null }, "kurulumdaki firma yoklanmaz");
  assert.equal((await v.merkezSahip.query("SELECT 1 FROM firma_vt WHERE firma_id = $1", [v.O.id])).rowCount, 0, "ortak firmanın bağlantı kaydı yok");
});

test("projeler: bir firmanın veritabanında son göç yok → {2, 1, 1}; o firmanın son_saglik'i sorun + düşen denetim + bulunan göç; öteki tamam", async () => {
  await gocKaydiOlmadan(v.A.sahip, SON.ad, async () => {
    assert.deepEqual(await yokla(), { toplam: 2, tamam: 1, sorunlu: 1 });
    const a = (await son(v.A)).s!;
    assert.deepEqual([a.durum, a.denetimler.goc_guncel, a.denetimler.kimlik, a.neden], ["sorun", false, true, "düşen: goc_guncel"]);
    assert.deepEqual(a.goc, { son: ONCEKI.ad, sayi: GOC_SAYISI - 1 });
    assert.equal((await son(v.B)).s!.durum, "tamam");
  });
  assert.deepEqual(await yokla(), { toplam: 2, tamam: 2, sorunlu: 0 });
  assert.equal((await son(v.A)).s!.durum, "tamam", "sonraki yoklama düzeltir");
});

test("projeler: ulaşılamadı (ECONNREFUSED), parola reddi (28P01), yanlış veritabanı (42501 — kimlik yanlış, bağlantı var) sınıflanmış nedenle", async () => {
  await kayitla(v.A, "kapi", KAPALI_KAPI, async () => {
    assert.deepEqual(await yokla(), { toplam: 2, tamam: 1, sorunlu: 1 });
    const a = (await son(v.A)).s!;
    assert.deepEqual([a.durum, a.denetimler.veritabani, a.neden], ["sorun", false, "bağlantı reddedildi (ECONNREFUSED)"]);
  });
  await v.parolaKaydiYaz(v.B, YANLIS);
  try {
    assert.deepEqual(await yokla(), { toplam: 2, tamam: 1, sorunlu: 1 });
    assert.equal((await son(v.B)).s!.neden, "parola reddedildi (28P01)");
  } finally { await v.parolaKaydiYaz(v.B, v.B.baglanti.password); }
  await kayitla(v.B, "vt_ad", v.merkezKume.uygulama.database, async () => {
    assert.deepEqual(await yokla(), { toplam: 2, tamam: 1, sorunlu: 1 });
    const b = (await son(v.B)).s!;
    assert.deepEqual([b.denetimler.veritabani, b.denetimler.kimlik, b.neden], [true, false, "yetki reddi — yanlış veritabanı ya da eksik hak (42501)"]);
    assert.equal(b.goc, undefined, "yanlış veritabanının göçü yazılmaz");
  });
  assert.deepEqual(await yokla(), { toplam: 2, tamam: 2, sorunlu: 0 });
});

test("projeler: dondurulmuş firma yoklanır; bakımdaki (göç dışı) yoklanmaz, sayılmaz, yazılmaz", async () => {
  await v.merkezSahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [v.B.id]);
  try {
    await gocKaydiOlmadan(v.B.sahip, SON.ad, async () => {
      assert.deepEqual(await yokla(), { toplam: 2, tamam: 1, sorunlu: 1 }, "dondurulmuş da yoklandı");
    });
  } finally { await v.merkezSahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.B.id]); }
  await sonuSil();
  await v.merkezSahip.query("UPDATE firma_vt SET goc_disi = true, goc_disi_gerekce = 'Deneme: bakımda, göç dışı' WHERE firma_id = $1", [v.B.id]);
  try {
    assert.deepEqual(await yokla(), { toplam: 1, tamam: 1, sorunlu: 0 });
    assert.equal((await son(v.B)).s, null, "bakımdaki firma yazılmaz");
    assert.equal((await son(v.A)).s!.durum, "tamam");
  } finally { await v.merkezSahip.query("UPDATE firma_vt SET goc_disi = false, goc_disi_gerekce = NULL WHERE firma_id = $1", [v.B.id]); }
});

test("projeler: cevap vermeyen proje proje süresinde kesilir (zaman aşımı); bütün süre dolunca başlamamış proje sorunlu sayılır, yazılmaz", async () => {
  const s = await sessizSunucu();
  try {
    await kayitla(v.A, "kapi", s.kapi, async () => {
      const bas = Date.now();
      assert.deepEqual(await yokla({ projeMs: 1_000 }), { toplam: 2, tamam: 1, sorunlu: 1 });
      const sure = Date.now() - bas;
      assert.ok(sure < 5_000, `proje süresi: ${sure} ms`);
      assert.match((await son(v.A)).s!.neden ?? "", /zaman aşımı/);
    });
  } finally { await s.kapat(); }
  await sonuSil();
  /* 2026-10-15 (FV7 incelemesi): tek bitiş zamanı — proje süresi (varsayılan 5 sn) 0 ms'lik bitişe sığmaz, hiçbiri başlamaz (beklenti aynı) */
  assert.deepEqual(await yokla({ toplamMs: 0 }), { toplam: 2, tamam: 0, sorunlu: 2 });
  for (const f of [v.A, v.B]) assert.equal((await son(f)).s, null, `${f.kisaAd}: yoklanmayan yazılmaz`);
});

test("projeler: ana anahtar yok / yanlış → hepsi sorunlu, 'uygulama parolası çözülemedi'; yerel adresli kayıt merkez yayındayken bağlanılmaz", async () => {
  const yok = await yokla({ anahtar: () => { throw new Error("Sır anahtarı tanımlı değil (PROBATA_SIR_ANAHTARI, 32 bayt base64)"); } });
  assert.deepEqual(yok, { toplam: 2, tamam: 0, sorunlu: 2 });
  for (const f of [v.A, v.B]) assert.match((await son(f)).s!.neden ?? "", /^bağlantı kaydı: uygulama parolası çözülemedi/);
  assert.deepEqual(await yokla({ anahtar: () => randomBytes(32) }), { toplam: 2, tamam: 0, sorunlu: 2 });
  assert.match((await son(v.A)).s!.neden ?? "", /^bağlantı kaydı: uygulama parolası çözülemedi/);
  let okunan = 0;
  assert.deepEqual(await yokla({ merkezYerel: false, oku: async () => { okunan++; throw new Error("okunmamalıydı"); } }), { toplam: 2, tamam: 0, sorunlu: 2 });
  assert.equal(okunan, 0, "izin dışı adrese bağlanılmadı");
  assert.equal((await son(v.B)).s!.neden, "bağlantı kaydı: yerel adres (merkez yayında)");
  assert.deepEqual(await yokla(), { toplam: 2, tamam: 2, sorunlu: 0 });
});

test("projeler: merkez yerine bir firma veritabanı verilirse RED (vt_merkez_dogrula, 42501) — uç 503 olur, sayı uydurulmaz", async () => {
  const firmaHavuzu = havuzKur(v.B.baglanti);
  try {
    await assert.rejects(projeleriYokla({ merkez: firmaHavuzu, anahtar: () => v.anahtar, merkezYerel: true }), (h: { code?: string }) => h.code === "42501");
  } finally { await firmaHavuzu.end(); }
});

test("SIR YOK: yanıtlarda ve son_saglik'te parola, ana anahtar, şifreli metin, kısa ad, sunucu adresi yok", async () => {
  await yokla();
  for (const f of [v.A, v.B]) await son(f);
  const hepsi = ciktilar.join("\n");
  assert.ok(ciktilar.length >= 30, `${ciktilar.length}`);
  const sirlar = [v.merkezKume.uygulama.password, v.ayriKume.uygulama.password, v.A.baglanti.password, v.B.baglanti.password, YANLIS,
    v.anahtar.toString("base64"), ...(await v.merkezSahip.query<{ p: string }>("SELECT parola_sifreli AS p FROM firma_vt WHERE parola_sifreli IS NOT NULL")).rows.map((x) => x.p)];
  assert.ok(sirlar.length >= 8);
  for (const s of sirlar) assert.ok(!hepsi.includes(s), "çıktıda sır");
  assert.doesNotMatch(hepsi, /v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./, "şifreli metin biçimi");
  assert.doesNotMatch(hepsi, /kendi-a|kendi-b|ortak-o|kurulum-c|127\.0\.0\.1|localhost|probata_kendi_b/, "kısa ad / sunucu / veritabanı adı");
});
