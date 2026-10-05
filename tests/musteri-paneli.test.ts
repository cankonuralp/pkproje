/* NEREDEN GELDİ: maket musteri.html M11 (müşteri yalnız kendi imzalı raporlarını görür ve indirir; son sürüm — 193) · musteriler.html "Müşteri
   girişi" (karar 33 ana giriş müşterinin e-postasıyla, 44 ek girişler bütün ya da seçili tesisler, L5 parola personel isteyince) · giris.html (35
   müşteri de aynı ekrandan) · 09-E5 ("müşteri kullanıcısı için RLS'de firma + müşteri + müşteriye açık — kilit: iki müşterili gerçek PostgreSQL
   testi") · reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma, iki müşteri (319;
   göç 0030). Olumsuz kanıt: tests/bozan/musteri-paneli.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { musteriDosyasi } from "../src/server/dosya/dosya.ts";
import { musteriCikis, musteriGirisiMi, musteriGirisYap, musteriOturumOku, musteriParolaDegistir } from "../src/server/kimlik/musteri.ts";
import { girisYap } from "../src/server/kimlik/oturum.ts";
import { anaGeciciParola, ekGeciciParola, ekGirisEkle, girisBilgisi, girisPasif } from "../src/modules/musteriler/server/girisler.ts";
import { musteriKaydet, musteriPasif } from "../src/modules/musteriler/server/musteriler.ts";
import { panelRaporlari, panelRaporu } from "../src/modules/musteri-paneli/server/panel.ts";
import { onayla, revizeyeGonder } from "../src/modules/onaylar/server/onaylar.ts";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { imzaHazirla, imzaliYukle, raporListesi, raporOlustur } from "../src/modules/raporlar/server/raporlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "musteri-paneli-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

interface Firma { den: Kisi; mek: Kisi; yon: Kisi; plan: Kisi; denP: string; m1: string; m2: string; t1: string; t2: string; t3: string; ekp: Record<string, string> }
let FA: Firma, FB: Firma;

async function firmaKur(firma: string, ek: string): Promise<Firma> {
  const f = await kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m1 = await q("INSERT INTO musteri (unvan, kisa, eposta) VALUES ('Deneme Bir Sanayi A.Ş.', 'Deneme Bir', $1) RETURNING id::text", [`bir@${ek}-musteri.example`]);
    const m2 = await q("INSERT INTO musteri (unvan, kisa, eposta) VALUES ('Deneme İki Sanayi A.Ş.', 'Deneme İki', $1) RETURNING id::text", [`iki@${ek}-musteri.example`]);
    const t1 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m1]);
    const t2 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Depo') RETURNING id::text", [m1]);
    const t3 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Fabrika') RETURNING id::text", [m2]);
    const denP = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi', '2024-01-01', 'mak-muh', '123') RETURNING id::text");
    const k = async (e: string, roller: string[], personel: string | null = null) => ({ ...kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text",
      [`${e}@${ek}.example`, `Deneme ${e}`, roller, personel]), ...roller), ad: `Deneme ${e}` });
    const den = await k("den", ["denetci"], denP), mek = await k("mek", ["mekanik_yonetici"]), yon = await k("yon", ["firma_yoneticisi"]), plan = await k("plan", ["planlama"]);
    const ht = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
    for (const [t, kod] of [[t1, "HT-1"], [t2, "HT-2"], [t3, "HT-3"]]) {
      await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t, ht, kod]);
    }
    const ekp = Object.fromEntries((await db.sorgu<{ kod: string; id: string }>("SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
    return { den, mek, yon, plan, denP, m1, m2, t1, t2, t3, ekp, ht };
  });
  await kiraciIcinde(havuz, firma, async (db) => {
    const t = tamam(await taslakBaslat(db, f.yon, f.ht, "sablon:KOMPRESOR", null));
    tamam(await yayinla(db, f.yon, t.id, t.surum, ""));
  }, { hesapId: f.yon.id });
  return f;
}

const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p), hesapId ? { hesapId } : {});
/** müşteri işlemi (uygulamadaki musteriIslemi gibi): veritabanında müşteri rolü */
const m = <T,>(musteriId: string, tesisler: string[] | null, is: (db: Sorgulayici) => Promise<T>, firma = A) =>
  kiraciIcinde(havuz, firma, is, { musteri: { id: musteriId, tesisler } });

/* imza: uydurma kesin PDF + artımlı imza eki (tests/onaylar.test.ts ile aynı yapı) */
let sayac = 0;
const uret = async () => new TextEncoder().encode(`%PDF-1.4\n% deneme ${++sayac}\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n`);
const imzala = (b: Uint8Array) => Buffer.concat([Buffer.from(b), Buffer.from("\n9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00ff> >> endobj\n%%EOF\n", "latin1")]);
const surum = async (id: string) => (await sql<{ surum: number }>(A, "SELECT surum FROM rapor WHERE id = $1", [id])).rows[0].surum;
let planSira = 0;
/** tesisin ekipmanına rapor: plan, kabul, oluştur, gönder (tetiğin geçişi), mekanik yönetici onaylar, denetçi imzalar → Tamamlandı */
async function imzali(tesis: string, kod: string): Promise<string> {
  const bas = bugunTr();
  const p = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis, baslangic: bas, bitis: bas, ekip: [{ personel: FA.denP, isgNo: `ISG-${planSira++}`, kaydet: false }] }))).id;
  tamam(await a(FA.den, async (db) => planKabul(db, FA.den, p, (await planIci(db, FA.den, p))!.surum, true)));
  const h = tamam(await a(FA.den, (db) => raporOlustur(db, FA.den, p, FA.ekp[kod]))).id;
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [h], FA.den.id);
  await imzalaRapor(h);
  return h;
}
async function imzalaRapor(h: string) {
  const s = await surum(h);
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h, s)));
  tamam(await a(FA.den, (db) => imzaHazirla(db, depo, FA.den, A, h, uret)));
  const ham = (await sql<{ anahtar: string }>(A, "SELECT d.anahtar FROM imza_istegi i JOIN dosya d ON d.id = i.pdf_dosya WHERE i.rapor_id = $1 AND i.durum = 'bekliyor'", [h])).rows[0];
  const s2 = await surum(h);
  tamam(await a(FA.den, async (db) => imzaliYukle(db, depo, FA.den, A, h, s2, { ad: "imzali.pdf", bayt: imzala(await depo.oku(ham.anahtar)) })));
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "deneme-a");
  FB = await firmaKur(B, "deneme-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

const GIRIS = { ip: "127.0.0.1" };

test("ana giriş: müşterinin e-postasıyla, geçici parola bir kez; giriş aynı ekrandan, yanlış parolada tek ileti, 5 hatada kilit; ilk girişte parola değişir, oturumlar düşer; pasif müşteri giremez", async () => {
  const yon = FA.yon, eposta = "bir@deneme-a-musteri.example";
  assert.equal((await a(FA.den, (db) => anaGeciciParola(db, FA.den, FA.m1))).durum, "yetkisiz", "denetçi müşteriyi değiştiremez");
  assert.equal((await kiraciIcinde(havuz, B, (db) => anaGeciciParola(db, FB.yon, FA.m1), { hesapId: FB.yon.id })).durum, "yok", "başka firma");
  const r = tamam(await a(yon, (db) => anaGeciciParola(db, yon, FA.m1)));
  assert.match(r.parola!, /^[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}$/);
  const h = (await sql<{ ana: boolean; eposta: string; durum: string; oz: string }>(A, "SELECT ana, eposta, durum, parola_ozeti AS oz FROM musteri_hesap WHERE musteri_id = $1", [FA.m1])).rows;
  assert.deepEqual([h.length, h[0].ana, h[0].eposta, h[0].durum, h[0].oz.startsWith("scrypt$")], [1, true, eposta, "ilk", true], "parola düz tutulmaz");
  assert.equal((await sql(A, "SELECT 1 FROM denetim_izi WHERE yeni::text LIKE $1", [`%${r.parola}%`])).rowCount, 0, "parola ize yazılmaz");
  assert.equal(await musteriGirisiMi(havuz, A, eposta.toUpperCase()), true);
  assert.equal(await musteriGirisiMi(havuz, A, "den@deneme-a.example"), false, "personel girişi müşteri sayılmaz");
  assert.equal(await musteriGirisiMi(havuz, B, eposta), false, "başka firmanın adresinde yok");
  /* giriş */
  assert.deepEqual(await musteriGirisYap(havuz, A, { eposta, parola: "yanlis-parola-1", ...GIRIS }), { tamam: false, neden: "hatali" });
  assert.deepEqual(await musteriGirisYap(havuz, B, { eposta, parola: r.parola!, ...GIRIS }), { tamam: false, neden: "hatali" }, "başka firmanın adresinden giremez");
  const g = await musteriGirisYap(havuz, A, { eposta, parola: r.parola!, ip: "127.0.0.2" });
  assert.ok(g.tamam);
  assert.deepEqual([g.hesap.musteriId, g.hesap.tesisler, g.hesap.durum, g.hesap.musteriAd], [FA.m1, null, "ilk", "Deneme Bir"]);
  const o = await musteriOturumOku(havuz, A, g.belirtec);
  assert.equal(o?.id, g.hesap.id);
  assert.equal(await musteriOturumOku(havuz, B, g.belirtec), null, "başka firmanın adresinde oturum geçersiz");
  assert.equal((await girisYap(havuz, A, { eposta, parola: r.parola!, ip: "127.0.0.3" })).tamam, false, "müşteri girişi personel girişi değildir");
  /* ilk girişte parola: eski oturum düşer, yenisi açılır */
  const p = await musteriParolaDegistir(havuz, A, g.hesap.id, { yeni: "YeniParola123", ip: "127.0.0.2" });
  assert.ok(p.tamam);
  assert.equal(await musteriOturumOku(havuz, A, g.belirtec), null, "eski oturum düştü");
  assert.equal((await musteriOturumOku(havuz, A, p.belirtec))?.durum, "etkin");
  /* kilit: 5 hata → kilitli (doğru parola da kilitliyken girmez) */
  for (let i = 0; i < 4; i++) assert.equal((await musteriGirisYap(havuz, A, { eposta, parola: "yanlis-parola-x", ip: `10.0.0.${i}` })).tamam, false);
  assert.deepEqual((await musteriGirisYap(havuz, A, { eposta, parola: "yanlis-parola-x", ip: "10.0.0.9" })).tamam ? null : "kilit", "kilit");
  const k = await musteriGirisYap(havuz, A, { eposta, parola: "YeniParola123", ip: "10.0.1.1" });
  assert.equal(k.tamam ? "acik" : k.neden, "kilitli");
  await sql(A, "UPDATE musteri_hesap SET kilit_bitis = NULL, hatali_deneme = 0 WHERE id = $1", [g.hesap.id]);
  /* pasif müşteri: giriş ve oturum kapanır */
  const ms = (await sql<{ surum: number }>(A, "SELECT surum FROM musteri WHERE id = $1", [FA.m1])).rows[0].surum;
  tamam(await a(yon, (db) => musteriPasif(db, yon, FA.m1, ms, true)));
  assert.equal(await musteriOturumOku(havuz, A, p.belirtec), null, "pasif müşterinin oturumu");
  assert.equal((await musteriGirisYap(havuz, A, { eposta, parola: "YeniParola123", ip: "10.0.2.1" })).tamam, false);
  assert.deepEqual(await a(yon, (db) => anaGeciciParola(db, yon, FA.m1)), { durum: "red", neden: "Müşteri pasif; giriş açılmaz." });
  tamam(await a(yon, (db) => musteriPasif(db, yon, FA.m1, ms + 1, false)));
  const g2 = await musteriGirisYap(havuz, A, { eposta, parola: "YeniParola123", ip: "10.0.2.2" });
  assert.ok(g2.tamam);
  await musteriCikis(havuz, A, g2.belirtec);
  assert.equal(await musteriOturumOku(havuz, A, g2.belirtec), null, "çıkış");
});

test("kullanıcı adı firmada tek: personel hesabıyla ve öteki girişlerle çakışmaz (sunucu ve veritabanı); müşterinin e-postası değişince ana giriş onunla gider, parolası düşer", async () => {
  const yon = FA.yon;
  /* müşteri e-postasını personelinkiyle değiştirmek: sunucu reddeder */
  const k = (await sql<{ surum: number }>(A, "SELECT surum FROM musteri WHERE id = $1", [FA.m2])).rows[0].surum;
  const kaydet = (e: string, s: number) => a(yon, (db) => musteriKaydet(db, yon, FA.m2, s, { unvan: "Deneme İki Sanayi A.Ş.", kisa: "Deneme İki", eposta: e }, true));
  assert.equal((await kaydet("den@deneme-a.example", k)).durum, "gecersiz");
  /* veritabanı da: müşteri girişi personel e-postasıyla, personel hesabı müşteri girişinin e-postasıyla açılmaz */
  await assert.rejects(sql(A, "INSERT INTO musteri_hesap (musteri_id, eposta, ad) VALUES ($1, 'den@deneme-a.example', 'x')", [FA.m2]), /başka bir girişte/);
  await assert.rejects(sql(A, "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('bir@deneme-a-musteri.example', 'x', '{planlama}', 'etkin')"), /başka bir girişte/);
  assert.equal((await kiraciIcinde(havuz, B, (db) => db.sorgu("INSERT INTO musteri_hesap (musteri_id, eposta, ad) VALUES ($1, 'den@deneme-a.example', 'x') RETURNING id", [FB.m2]))).rowCount, 1,
    "başka firmada aynı adres serbest");
  /* ek giriş: aynı adres reddedilir */
  assert.deepEqual((await a(yon, (db) => ekGirisEkle(db, yon, FA.m2, { ad: "Deneme Kişi", eposta: "bir@deneme-a-musteri.example", tesisler: "hepsi" }))).durum, "gecersiz");
  /* e-posta değişince ana giriş */
  tamam(await a(yon, (db) => anaGeciciParola(db, yon, FA.m2)));
  tamam(await kaydet("yeni-iki@deneme-a-musteri.example", k));
  const h = (await sql<{ eposta: string; durum: string; oz: string | null }>(A, "SELECT eposta, durum, parola_ozeti AS oz FROM musteri_hesap WHERE musteri_id = $1 AND ana", [FA.m2])).rows[0];
  assert.deepEqual([h.eposta, h.durum, h.oz], ["yeni-iki@deneme-a-musteri.example", "hazir", null], "yeni adrese yeni geçici parola");
});

test("ek giriş: yalnız müşterinin kendi etkin tesisleri, oturum kapsamı taze okunur; pasif / etkinleştir; tesis kapsamı değişince oturum düşer", async () => {
  const yon = FA.yon;
  assert.equal((await a(yon, (db) => ekGirisEkle(db, yon, FA.m1, { ad: "Deneme Kişi", eposta: "kisi@deneme-a-musteri.example", tesisler: [FA.t3] }))).durum, "gecersiz", "başka müşterinin tesisi");
  assert.equal((await a(yon, (db) => ekGirisEkle(db, yon, FA.m1, { ad: "", eposta: "x", tesisler: [] }))).durum, "gecersiz");
  tamam(await a(yon, (db) => ekGirisEkle(db, yon, FA.m1, { ad: "Deneme Kişi", eposta: "kisi@deneme-a-musteri.example", tesisler: [FA.t1] })));
  const b = (await a(yon, (db) => girisBilgisi(db, yon, FA.m1)))!;
  const e = b.ekler.find((x) => x.eposta === "kisi@deneme-a-musteri.example")!;
  assert.deepEqual([e.durum, e.tesisler, b.yaz], ["hazir", [FA.t1], true]);
  await assert.rejects(sql(A, "UPDATE musteri_hesap SET tesisler = ARRAY[$2::uuid] WHERE id = $1", [e.id, FA.t3]), /kendi tesislerini/, "veritabanı da");
  assert.equal((await a(FA.den, (db) => ekGeciciParola(db, FA.den, e.id, e.surum))).durum, "yetkisiz");
  const p = tamam(await a(yon, (db) => ekGeciciParola(db, yon, e.id, e.surum)));
  const g = await musteriGirisYap(havuz, A, { eposta: e.eposta, parola: p.parola!, ip: "10.1.0.1" });
  assert.ok(g.tamam);
  assert.deepEqual(g.hesap.tesisler, [FA.t1]);
  const s = (await sql<{ surum: number }>(A, "SELECT surum FROM musteri_hesap WHERE id = $1", [e.id])).rows[0].surum;
  tamam(await a(yon, (db) => girisPasif(db, yon, e.id, s, true)));
  assert.equal(await musteriOturumOku(havuz, A, g.belirtec), null, "pasif girişin oturumu düştü");
  assert.equal((await musteriGirisYap(havuz, A, { eposta: e.eposta, parola: p.parola!, ip: "10.1.0.2" })).tamam, false);
  tamam(await a(yon, (db) => girisPasif(db, yon, e.id, s + 1, false)));
  assert.equal((await sql<{ durum: string }>(A, "SELECT durum FROM musteri_hesap WHERE id = $1", [e.id])).rows[0].durum, "hazir", "etkinleşince yeni geçici parola");
});

test("İKİNCİ KATMAN (09-E5): müşteri rolü yalnız kendi müşterisinin, kendi tesis kapsamının, son imzalı sürümlerini görür; imzalı PDF'i yalnız onun iner; yazamaz, panel dışı tabloya giremez; başka firma görmez", async () => {
  const h1 = await imzali(FA.t1, "HT-1"), h2 = await imzali(FA.t2, "HT-2"), h3 = await imzali(FA.t3, "HT-3");
  const [r1, r2, r3] = [h1, h2, h3];
  const ids = async (mid: string, t: string[] | null) => (await m(mid, t, (db) => panelRaporlari(db))).raporlar.map((x) => x.id).sort();
  assert.deepEqual(await ids(FA.m1, null), [r1, r2].sort(), "M1 bütün tesisleri");
  assert.deepEqual(await ids(FA.m1, [FA.t1]), [r1], "M1 seçili tesis");
  assert.deepEqual(await ids(FA.m2, null), [r3], "M2 yalnız kendisi");
  assert.deepEqual(await ids(FA.m1, [FA.t3]), [], "başka müşterinin tesisi kapsama yazılsa da");
  assert.deepEqual(await ids(FB.m1, null), [], "B'nin müşterisi A'da");
  const b1 = await m(FA.m1, null, (db) => panelRaporlari(db));
  assert.deepEqual([b1.firma, b1.musteri?.kisa, b1.tesisler.map((t) => t.ad).sort()], ["Deneme A", "Deneme Bir", ["Depo", "Merkez"]]);
  assert.equal(await m(FA.m2, null, (db) => panelRaporu(db, r1)), null, "başka müşterinin raporu yok sayılır");
  const v = (await m(FA.m1, null, (db) => panelRaporu(db, r1)))!;
  assert.match(v.r.no, /^DA-/);
  assert.ok(await m(FA.m1, null, (db) => musteriDosyasi(db, v.r.dosya)), "kendi imzalı PDF'i");
  assert.equal(await m(FA.m2, null, (db) => musteriDosyasi(db, v.r.dosya)), null, "başkasının imzalı PDF'i");
  assert.equal(await m(FA.m1, [FA.t2], (db) => musteriDosyasi(db, v.r.dosya)), null, "kapsam dışı tesisin PDF'i");
  /* ham SQL müşteri rolünde: panel dışı tablo yok, yazma yok, satırlar süzülü */
  for (const t of ["rapor", "hesap", "musteri_hesap", "musteri_oturum", "personel", "imza_istegi", "denetim_izi", "plan"]) {
    await assert.rejects(m(FA.m1, null, (db) => db.sorgu(`SELECT 1 FROM ${t} LIMIT 1`)), /permission denied/, t);
  }
  await assert.rejects(m(FA.m1, null, (db) => db.sorgu("UPDATE musteri SET kisa = 'x'")), /permission denied/);
  await assert.rejects(m(FA.m1, null, (db) => db.sorgu("INSERT INTO uygunsuzluk (surum_id, kaynak, ref, metin) SELECT id, 'madde', 'x', 'x' FROM rapor_surumu LIMIT 1")), /permission denied/);
  assert.deepEqual((await m(FA.m1, null, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM musteri"))).rows[0].n, 1);
  assert.deepEqual((await m(FA.m1, [FA.t1], (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM tesis"))).rows[0].n, 1);
  assert.deepEqual((await m(FA.m1, [FA.t1], (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM ekipman"))).rows[0].n, 1);
  assert.deepEqual((await m(FA.m1, null, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM dosya"))).rows[0].n, 2, "yalnız kendi iki imzalı PDF'i");
  /* personel işlemi müşteri kısıtından etkilenmez (uygulama rolü müşteri rolünü DEVRALMAZ) */
  const l = (await a(FA.yon, (db) => raporListesi(db, FA.yon)))!.map((x) => x.id);
  for (const id of [r1, r2, r3]) assert.ok(l.includes(id), "firma yöneticisi hepsini görür");
  /* revizyon: R1 imzalanana dek müşteri R0'ı, sonra yalnız R1'i görür (193) */
  tamam(await a(FA.mek, async (db) => revizeyeGonder(db, FA.mek, r1, await surum(r1), { gerekce: "Seri numarası yanlış yazılmış" })));
  assert.equal((await m(FA.m1, null, (db) => panelRaporu(db, r1)))!.r.revizyon, 0, "revize sürerken önceki imzalı sürüm");
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [r1], FA.den.id);
  await imzalaRapor(r1);
  const yeni = (await m(FA.m1, null, (db) => panelRaporu(db, r1)))!.r;
  assert.deepEqual([yeni.revizyon, yeni.no.endsWith("-R1"), yeni.yerine], [1, true, v.r.no], "yalnız son sürüm, yerine geçtiği numarayla");
  assert.equal((await m(FA.m1, null, (db) => panelRaporlari(db))).raporlar.filter((x) => x.id === r1).length, 1, "listede tek satır");
  assert.equal(await m(FA.m1, null, (db) => musteriDosyasi(db, v.r.dosya)), null, "eski sürümün PDF'i artık inmez");
  /* geçersiz bağlam: işlem açılmaz */
  await assert.rejects(m("kotu", null, async () => 1), /Geçersiz müşteri/);
  await assert.rejects(m(FA.m1, [], async () => 1), /Geçersiz müşteri/);
});
