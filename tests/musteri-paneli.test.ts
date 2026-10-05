/* NEREDEN GELDİ: maket musteri.html M11 (müşteri yalnız kendi imzalı raporlarını görür ve indirir; son sürüm — 193) · musteriler.html "Müşteri
   girişi" (karar 33 ana giriş müşterinin e-postasıyla, 44 ek girişler bütün ya da seçili tesisler, L5 parola personel isteyince) · giris.html (35
   müşteri de aynı ekrandan) · 09-E5 ("müşteri kullanıcısı için RLS'de firma + müşteri + müşteriye açık — kilit: iki müşterili gerçek PostgreSQL
   testi") · reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma, iki müşteri (319;
   göç 0030). Olumsuz kanıt: tests/bozan/musteri-paneli.bozan.ts.
   320 UYGUNSUZLUKLAR (maket musteri.html #/uygunsuz; pkproje §1.1 "uygunsuzları indir … exceldeki ilgili yere tıklayınca rapora gidebilecek"): aynı
   kurulum — müşteri rolü yalnız kendi uygunsuzluklarını görür; Excel tarayıcıda bu veriden (yazıcı: tests/disa.test.ts).
   321 PLANLANAN KONTROLLER (maket #/plan; karar 81; göç 0032): müşteri rolü planın yalnız tesis / tarih / durum sütunlarını, kendi tesis
   kapsamındaki AÇIK planlarda okur.
   322 SÖZLEŞMELER (maket #/sozlesme; karar 134 "görünür, panelden imza atılmaz"; göç 0034): sözleşmenin yalnız numara / dönem / imza / PDF
   sütunları; kendi müşterisi ve görebildiği tesis kapsamı; imzalı PDF'in yalnız şu anki sürümü. */
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
import { panelPlanlari, panelRaporlari, panelRaporu, panelSozlesmeleri, panelSozlesmesi, panelUygunsuzluklari } from "../src/modules/musteri-paneli/server/panel.ts";
import { imzaliYukle as sozlesmeImzaliYukle, sozlesmeHazirla } from "../src/modules/sozlesmeler/server/sozlesmeler.ts";
import { onayla, revizeyeGonder } from "../src/modules/onaylar/server/onaylar.ts";
import { planIci, planKabul, planReddet } from "../src/modules/planlar/server/plan-ici.ts";
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
const uret = async () => new TextEncoder().encode(`%PDF-1.4\n% deneme ${++sayac}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`);
const imzala = (b: Uint8Array) => Buffer.concat([Buffer.from(b), Buffer.from("\n9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n", "latin1")]);
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
  /* 319 incelemesi (0033): oturumlar pasif olunca HEMEN düşer — okunmasını beklemeden (yeniden etkinleşince eski belirteç geçerli olmasın) */
  assert.equal((await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM musteri_oturum o JOIN musteri_hesap h ON h.id = o.musteri_hesap_id WHERE h.musteri_id = $1",
    [FA.m1])).rows[0].n, 0, "pasif müşterinin oturumu okunmadan düştü");
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
  /* eylemdeki gibi: bütün alanlar metin (boş = yok) */
  const kaydet = (e: string, s: number) => a(yon, (db) => musteriKaydet(db, yon, FA.m2, s,
    { unvan: "Deneme İki Sanayi A.Ş.", kisa: "Deneme İki", vd: "", vno: "", eposta: e, tel: "", ilgili: "" }, true));
  assert.equal((await kaydet("den@deneme-a.example", k)).durum, "gecersiz");
  /* veritabanı da: müşteri girişi personel e-postasıyla, personel hesabı müşteri girişinin e-postasıyla açılmaz */
  await assert.rejects(sql(A, "INSERT INTO musteri_hesap (musteri_id, eposta, ad) VALUES ($1, 'den@deneme-a.example', 'x')", [FA.m2]), /başka bir girişte/);
  await assert.rejects(sql(A, "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('bir@deneme-a-musteri.example', 'x', '{planlama}', 'etkin')"), /başka bir girişte/);
  assert.equal((await kiraciIcinde(havuz, B, (db) => db.sorgu("INSERT INTO musteri_hesap (musteri_id, eposta, ad) VALUES ($1, 'den@deneme-a.example', 'x') RETURNING id", [FB.m2]))).rowCount, 1,
    "başka firmada aynı adres serbest");
  /* ek giriş: aynı adres reddedilir */
  assert.deepEqual((await a(yon, (db) => ekGirisEkle(db, yon, FA.m2, { ad: "Deneme Kişi", eposta: "bir@deneme-a-musteri.example", tesisler: "hepsi" }))).durum, "gecersiz");
  /* 319 incelemesi (0033): müşterinin KAYITLI e-postası da kullanıcı adıdır — başka bir giriş (kendi ek girişi dahil) ve personel hesabı alamaz;
     müşterinin e-postası başka bir girişin adresi olamaz (sunucu ve veritabanı) */
  const m2Eposta = (await sql<{ e: string }>(A, "SELECT eposta AS e FROM musteri WHERE id = $1", [FA.m2])).rows[0].e;
  for (const mid of [FA.m1, FA.m2]) {
    assert.equal((await a(yon, (db) => ekGirisEkle(db, yon, mid, { ad: "Deneme Kişi", eposta: m2Eposta, tesisler: "hepsi" }))).durum, "gecersiz", "müşterinin e-postasıyla ek giriş");
  }
  await assert.rejects(sql(A, "INSERT INTO musteri_hesap (musteri_id, eposta, ad) VALUES ($1, $2, 'x')", [FA.m1, m2Eposta]), /başka bir girişte/);
  await assert.rejects(sql(A, "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'x', '{planlama}', 'etkin')", [m2Eposta]), /başka bir girişte/);
  await assert.rejects(sql(A, "UPDATE musteri SET eposta = 'den@deneme-a.example' WHERE id = $1", [FA.m1]), /başka bir girişte/, "müşterinin e-postası personelinki olamaz");
  /* e-posta değişmeyen kartın öteki alanı her zaman kaydedilir (e-posta denetimleri yalnız e-posta değişince) */
  const kk = (await sql<{ surum: number }>(A, "SELECT surum FROM musteri WHERE id = $1", [FA.m2])).rows[0].surum;
  tamam(await a(yon, (db) => musteriKaydet(db, yon, FA.m2, kk, { unvan: "Deneme İki Sanayi A.Ş.", kisa: "Deneme İki", vd: "", vno: "", eposta: m2Eposta, tel: "02120000000", ilgili: "" }, false)));
  /* e-posta değişince ana giriş: kullanılıyorsa önce UYARI (sıfırlanır), onayla kaydedilir ve bildirim söyler */
  tamam(await a(yon, (db) => anaGeciciParola(db, yon, FA.m2)));
  const k2 = (await sql<{ surum: number }>(A, "SELECT surum FROM musteri WHERE id = $1", [FA.m2])).rows[0].surum;
  const uy = await a(yon, (db) => musteriKaydet(db, yon, FA.m2, k2, { unvan: "Deneme İki Sanayi A.Ş.", kisa: "Deneme İki", vd: "", vno: "", eposta: "yeni-iki@deneme-a-musteri.example", tel: "", ilgili: "" }, false));
  assert.equal(uy.durum, "uyari");
  assert.match((uy as { uyarilar: Record<string, string> }).uyarilar.eposta, /müşteri girişi sıfırlanır/);
  const kay = tamam(await kaydet("yeni-iki@deneme-a-musteri.example", k2));
  assert.match(kay.bildirim ?? "", /Müşteri girişi sıfırlandı; yeni geçici parola verin/);
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
  /* 319 incelemesi (0033): yeni geçici parola kilidi ve hata sayacını sıfırlar (personel hesabındaki gibi) */
  const sur = async () => (await sql<{ s: number }>(A, "SELECT surum AS s FROM musteri_hesap WHERE id = $1", [e.id])).rows[0].s;
  tamam(await a(yon, async (db) => ekGeciciParola(db, yon, e.id, await sur())));
  for (let i = 0; i < 5; i++) assert.equal((await musteriGirisYap(havuz, A, { eposta: e.eposta, parola: "yanlis-parola-k", ip: `10.1.2.${i}` })).tamam, false);
  assert.ok((await sql<{ k: Date | null }>(A, "SELECT kilit_bitis AS k FROM musteri_hesap WHERE id = $1", [e.id])).rows[0].k, "kilitlendi");
  const p2 = tamam(await a(yon, async (db) => ekGeciciParola(db, yon, e.id, await sur())));
  const kl = (await sql<{ k: Date | null; n: number }>(A, "SELECT kilit_bitis AS k, hatali_deneme AS n FROM musteri_hesap WHERE id = $1", [e.id])).rows[0];
  assert.deepEqual([kl.k, kl.n], [null, 0], "kilit ve sayaç sıfırlandı");
  assert.ok((await musteriGirisYap(havuz, A, { eposta: e.eposta, parola: p2.parola!, ip: "10.1.2.9" })).tamam, "yeni parolayla girer");
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
  for (const t of ["rapor", "hesap", "musteri_hesap", "musteri_oturum", "personel", "imza_istegi", "denetim_izi", "plan_ekip"]) {
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

/** tarihli rapor: taslakken rapor tarihi (kusurluysa "Uygun değil" madde + sonuç) yazılır, gönderilir, onaylanır, imzalanır */
async function tarihli(tesis: string, kod: string, tarih: string, kusurlu: boolean): Promise<string> {
  const bas = bugunTr();
  const p = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis, baslangic: bas, bitis: bas, ekip: [{ personel: FA.denP, isgNo: `ISG-T${planSira++}`, kaydet: false }] }))).id;
  tamam(await a(FA.den, async (db) => planKabul(db, FA.den, p, (await planIci(db, FA.den, p))!.surum, true)));
  const h = tamam(await a(FA.den, (db) => raporOlustur(db, FA.den, p, FA.ekp[kod]))).id;
  await sql(A, kusurlu
    ? `UPDATE rapor SET rapor_tarihi = $2, cevaplar = jsonb_set(cevaplar, '{madde,k1}', '{"c": "Uygun değil", "not": "Korozyon"}'::jsonb), sonuc = 'uygun_degil',
       surum = surum + 1 WHERE id = $1`
    : "UPDATE rapor SET rapor_tarihi = $2, sonuc = 'uygun', surum = surum + 1 WHERE id = $1", [h, tarih], FA.den.id);
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [h], FA.den.id);
  await imzalaRapor(h);
  return h;
}

test("UYGUNSUZLUKLAR (320): müşteri rolü yalnız kendi müşterisinin ve tesis kapsamının uygunsuzluklarını görür, en yeni tespit üstte; giderilen gideren kontrolün tarihiyle, revizyonla kapanan hiç görünmez; açık sayısı; başka firma görmez", async () => {
  const k1 = await tarihli(FA.t1, "HT-1", "2026-03-01", true), k2 = await tarihli(FA.t2, "HT-2", "2026-04-01", true), k3 = await tarihli(FA.t3, "HT-3", "2026-04-01", true);
  const l = (mid: string, t: string[] | null) => m(mid, t, (db) => panelUygunsuzluklari(db));
  const raporlar = (v: Awaited<ReturnType<typeof l>>) => [...new Set(v.uygunsuzluklar.map((u) => u.raporId))];
  const v = await l(FA.m1, null);
  assert.deepEqual(raporlar(v), [k2, k1], "kendi iki raporu, en yeni tespit üstte");
  assert.ok(v.uygunsuzluklar.every((u) => u.acik && u.giderildi === null && /^DA-/.test(u.raporNo) && /Korozyon/.test(u.metin)), JSON.stringify(v.uygunsuzluklar));
  assert.equal(v.acikUygunsuz, v.uygunsuzluklar.length, "sekmedeki açık sayısı");
  const u1 = v.uygunsuzluklar.find((u) => u.raporId === k1)!;
  assert.deepEqual([u1.ekipmanKod, u1.turAd, u1.tesis, u1.tarih], ["HT-1", "Hava tankı", "Merkez", "2026-03-01"]);
  assert.deepEqual(raporlar(await l(FA.m1, [FA.t1])), [k1], "ek giriş: seçili tesis");
  assert.deepEqual(raporlar(await l(FA.m2, null)), [k3], "öteki müşteri yalnız kendisininkini");
  assert.deepEqual((await l(FB.m1, null)).uygunsuzluklar, [], "B'nin müşterisi A'nın adresinde");
  assert.equal((await l(FB.m1, null)).acikUygunsuz, 0);
  /* giderildi: aynı ekipmanın daha yeni muayenesi — gideren kontrolün tarihiyle; açık sayısı düşer */
  await tarihli(FA.t2, "HT-2", "2026-05-01", false);
  const v2 = await l(FA.m1, null);
  const u2 = v2.uygunsuzluklar.filter((u) => u.raporId === k2);
  assert.ok(u2.length >= 1 && u2.every((u) => !u.acik && u.giderildi === "2026-05-01"), JSON.stringify(u2));
  assert.equal(v2.acikUygunsuz, v2.uygunsuzluklar.filter((u) => u.raporId === k1).length);
  /* revizyon: R1 imzalanınca R0'ın uygunsuzluğu (revizyonla kapandı) hiç görünmez; R1'inki açık, numarası -R1 */
  const once = v2.uygunsuzluklar.filter((u) => u.raporId === k1).map((u) => u.id);
  tamam(await a(FA.mek, async (db) => revizeyeGonder(db, FA.mek, k1, await surum(k1), { gerekce: "Kusur açıklaması eksik yazılmış" })));
  assert.deepEqual((await l(FA.m1, null)).uygunsuzluklar.filter((u) => u.raporId === k1).map((u) => u.id), once, "revize sürerken önceki sürümün uygunsuzlukları");
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [k1], FA.den.id);
  await imzalaRapor(k1);
  const sonra = (await l(FA.m1, null)).uygunsuzluklar.filter((u) => u.raporId === k1);
  assert.ok(sonra.length >= 1 && sonra.every((u) => u.acik && u.raporNo.endsWith("-R1") && !once.includes(u.id)), JSON.stringify(sonra));
  assert.ok(((await sql(A, "SELECT 1 FROM uygunsuzluk WHERE kapanis = 'revizyon' AND rapor_id = $1", [k1])).rowCount ?? 0) >= 1, "personel tarafında kayıt duruyor");
  /* müşteri rolü uygunsuzluğa yazamaz */
  await assert.rejects(m(FA.m1, null, (db) => db.sorgu("UPDATE uygunsuzluk SET metin = 'x'")), /permission denied/);
});

test("PLANLANAN KONTROLLER (321): müşteri rolü planın yalnız tesis / tarih / durum sütunlarını okur, yalnız kendi tesis kapsamındaki açık planları (reddedilen yok); tesis başına en yakın plan + sayısı; başka müşteri ve firma görmez", async () => {
  /* yeni müşteri, iki tesis (yalnız bu testin planları) */
  const q = async (metin: string, p: unknown[] = []) => (await sql<{ id: string }>(A, metin, p, FA.yon.id)).rows[0].id;
  const m3 = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Üç Sanayi A.Ş.', 'Deneme Üç') RETURNING id::text");
  const t5 = await q("INSERT INTO tesis (musteri_id, ad, il, ilce) VALUES ($1, 'Kuzey', 'Kocaeli', 'Gebze') RETURNING id::text", [m3]);
  const t6 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Güney') RETURNING id::text", [m3]);
  const ac = async (tesis: string, bas: string, bit: string) => tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A,
    { tesis, baslangic: bas, bitis: bit, ekip: [{ personel: FA.denP, isgNo: `ISG-P${planSira++}`, kaydet: false }] }))).id;
  await ac(t5, "2026-12-01", "2026-12-01");
  const yakin = await ac(t5, "2026-11-10", "2026-11-11");
  const red = await ac(t6, "2026-11-20", "2026-11-20");
  tamam(await a(FA.den, async (db) => planReddet(db, FA.den, red, (await planIci(db, FA.den, red))!.surum, { gerekce: "Bu tarihte başka tesisteyim" })));
  const v = await m(m3, null, (db) => panelPlanlari(db));
  const k = v.satirlar.find((x) => x.tesisId === t5)!, g = v.satirlar.find((x) => x.tesisId === t6)!;
  assert.deepEqual([k.tesis, k.yer, k.plan, k.digerPlan], ["Kuzey", "Gebze / Kocaeli", { tesisId: t5, baslangic: "2026-11-10", bitis: "2026-11-11", durum: "bekliyor" }, 1],
    "en yakın açık plan + bir plan daha");
  assert.deepEqual([g.plan, g.digerPlan], [null, 0], "reddedilen plan planlanan kontrol değil");
  assert.deepEqual((await m(m3, [t6], (db) => panelPlanlari(db))).satirlar.map((x) => [x.tesisId, x.plan]), [[t6, null]], "ek giriş: yalnız kapsamdaki tesis");
  /* ham SQL müşteri rolünde: yalnız izinli sütunlar, yalnız kendi açık planları */
  assert.equal((await m(m3, null, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM plan"))).rows[0].n, 2);
  assert.equal((await m(FA.m1, null, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM plan WHERE tesis_id = ANY ($1::uuid[])", [[t5, t6]]))).rows[0].n, 0, "başka müşteri");
  assert.equal((await m(FB.m1, null, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM plan"))).rows[0].n, 0, "başka firmanın müşterisi");
  for (const c of ["no", "aciklama", "firma_adi", "adres", "sgk", "acan", "red_gerekce", "*"]) {
    await assert.rejects(m(m3, null, (db) => db.sorgu(`SELECT ${c} FROM plan`)), /permission denied/, c);
  }
  await assert.rejects(m(m3, null, (db) => db.sorgu("UPDATE plan SET durum = 'tamamlandi' WHERE id = $1", [yakin])), /permission denied/);
  await assert.rejects(m(m3, null, (db) => db.sorgu("SELECT 1 FROM plan_ekip LIMIT 1")), /permission denied/, "ekip görünmez");
  /* firma tarafı etkilenmez */
  assert.equal((await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM plan WHERE tesis_id = ANY ($1::uuid[])", [[t5, t6]])).rows[0].n, 3);
});

test("IP kilidi (319 incelemesi): müşterinin doğru girişi ortak IP sayacını SIFIRLAMAZ — personel hesaplarına yönelik denemeler birikir, beşincide IP kilitlenir", async () => {
  const ip = "10.7.7.7";
  for (let i = 0; i < 4; i++) assert.equal((await girisYap(havuz, A, { eposta: `yok${i}@deneme-a.example`, parola: "yanlis-parola", ip })).tamam, false);
  assert.ok((await musteriGirisYap(havuz, A, { eposta: "bir@deneme-a-musteri.example", parola: "YeniParola123", ip })).tamam, "müşteri girer");
  const besinci = await girisYap(havuz, A, { eposta: "yok4@deneme-a.example", parola: "yanlis-parola", ip });
  assert.equal(besinci.tamam ? "acik" : besinci.neden, "kilitli", "sayaç silinmedi: beşinci hata IP'yi kilitler");
  const m1 = await musteriGirisYap(havuz, A, { eposta: "bir@deneme-a-musteri.example", parola: "YeniParola123", ip });
  assert.equal(m1.tamam ? "acik" : m1.neden, "kilitli");
});

test("UYGUNSUZLUK + REVİZYON (319 incelemesi, 0033): revizyondan önce başka muayeneyle 'giderildi' kapanmış eski sürüm kusuru müşteriye görünmez — yalnız son imzalı sürümün kusurları (imza sırasından bağımsız)", async () => {
  const x = await tarihli(FA.t2, "HT-2", "2026-06-01", true);
  const once = (await sql<{ id: string }>(A, "SELECT id::text FROM uygunsuzluk WHERE rapor_id = $1", [x])).rows.map((u) => u.id);
  await tarihli(FA.t2, "HT-2", "2026-06-15", false);   // daha yeni muayene: X'in R0 kusurunu "giderildi" kapatır
  assert.ok((await sql<{ k: string }>(A, "SELECT kapanis AS k FROM uygunsuzluk WHERE rapor_id = $1", [x])).rows.every((u) => u.k === "giderildi"));
  tamam(await a(FA.mek, async (db) => revizeyeGonder(db, FA.mek, x, await surum(x), { gerekce: "Kusur açıklaması eksik yazılmış" })));
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [x], FA.den.id);
  await imzalaRapor(x);
  const gorunen = (await m(FA.m1, null, (db) => panelUygunsuzluklari(db))).uygunsuzluklar.filter((u) => u.raporId === x);
  assert.ok(gorunen.length >= 1 && gorunen.every((u) => !once.includes(u.id) && u.raporNo.endsWith("-R1")), `yalnız R1'in kusurları: ${JSON.stringify(gorunen)}`);
  assert.equal((await m(FA.m1, null, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM uygunsuzluk WHERE id = ANY ($1::uuid[])", [once]))).rows[0].n, 0,
    "ham SQL de görmez");
  assert.equal((await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM uygunsuzluk WHERE id = ANY ($1::uuid[])", [once])).rows[0].n, once.length, "firma tarafında duruyor");
});

test("SÖZLEŞMELER (322): müşteri rolü sözleşmenin yalnız numara / dönem / imza / PDF sütunlarını, kendi müşterisinin ve görebildiği tesis kapsamındaki sözleşmeleri okur; kapsamda yalnız görebildiği tesisler; imzalı PDF'in yalnız şu ankisi iner; başka müşteri ve firma görmez", async () => {
  const yon = FA.yon;
  const haz = async (musteri: string, tesisler: string[]) =>
    tamam(await a(yon, (db) => sozlesmeHazirla(db, yon, { musteri, tesisler, baslangic: "2026-01-01", sure: 24, vade: 30, yenileme: "yok" }))).id;
  const s1 = await haz(FA.m1, [FA.t1, FA.t2]), s2 = await haz(FA.m1, [FA.t2]), s3 = await haz(FA.m2, [FA.t3]);
  const pdf = (n: number) => ({ ad: "imzali-sozlesme.pdf", bayt: new TextEncoder().encode(`%PDF-1.4\n% sözleşme ${n}\n%%EOF\n`) });
  const yukle = async (id: string, n: number) => {
    const sur = (await sql<{ s: number }>(A, "SELECT surum AS s FROM is_sozlesmesi WHERE id = $1", [id])).rows[0].s;
    tamam(await a(yon, (db) => sozlesmeImzaliYukle(db, depo, yon, A, id, sur, pdf(n))));
    return (await sql<{ d: string }>(A, "SELECT imzali_dosya::text AS d FROM is_sozlesmesi WHERE id = $1", [id])).rows[0].d;
  };
  const d1 = await yukle(s1, 1);
  const l = async (mid: string, t: string[] | null) => (await m(mid, t, (db) => panelSozlesmeleri(db))).sozlesmeler;
  const v = await l(FA.m1, null);
  assert.deepEqual(v.map((x) => x.id).sort(), [s1, s2].sort(), "kendi iki sözleşmesi");
  const x1 = v.find((x) => x.id === s1)!, x2 = v.find((x) => x.id === s2)!;
  assert.deepEqual([[...x1.tesisAdlari].sort(), x1.durum, x1.dosya, x1.musteriImza !== null], [["Depo", "Merkez"], "yururlukte", d1, true]);
  assert.deepEqual([x2.durum, x2.dosya], ["imza", null], "imza bekliyor");
  const kapsamli = await l(FA.m1, [FA.t1]);
  assert.deepEqual(kapsamli.map((x) => [x.id, x.tesisAdlari]), [[s1, ["Merkez"]]], "ek giriş: yalnız kapsamdaki tesisin sözleşmesi, kapsamda yalnız o tesis");
  assert.deepEqual((await l(FA.m2, null)).map((x) => x.id), [s3]);
  assert.deepEqual(await l(FB.m1, null), [], "başka firmanın müşterisi");
  assert.equal(await m(FA.m2, null, (db) => panelSozlesmesi(db, s1)), null, "başka müşterinin sözleşmesi yok sayılır");
  assert.equal((await m(FA.m1, null, (db) => panelSozlesmesi(db, s1)))!.s.no, x1.no);
  /* imzalı PDF: kendi sözleşmesinin şu ankisi; başkası ve kapsam dışı inemez; yeniden yüklenince eskisi inmez */
  assert.ok(await m(FA.m1, null, (db) => musteriDosyasi(db, d1)), "kendi sözleşmesinin imzalı PDF'i");
  assert.equal(await m(FA.m2, null, (db) => musteriDosyasi(db, d1)), null, "başka müşteri");
  const d2 = await yukle(s2, 2);
  assert.equal(await m(FA.m1, [FA.t1], (db) => musteriDosyasi(db, d2)), null, "kapsam dışı tesisin sözleşmesi");
  const d1b = await yukle(s1, 3);
  assert.equal(await m(FA.m1, null, (db) => musteriDosyasi(db, d1)), null, "eski imzalı PDF artık inmez");
  assert.ok(await m(FA.m1, null, (db) => musteriDosyasi(db, d1b)));
  /* ham SQL müşteri rolünde: yalnız izinli sütunlar; İSG-KATİP ve şablon yok; yazma yok */
  for (const c of ["vade", "yenileme", "firma_imza", "*"]) {
    await assert.rejects(m(FA.m1, null, (db) => db.sorgu(`SELECT ${c} FROM is_sozlesmesi`)), /permission denied/, c);
  }
  for (const t of ["isg_katip", "sozlesme_sablon"]) await assert.rejects(m(FA.m1, null, (db) => db.sorgu(`SELECT 1 FROM ${t} LIMIT 1`)), /permission denied/, t);
  await assert.rejects(m(FA.m1, null, (db) => db.sorgu("UPDATE is_sozlesmesi SET bitis = '2030-01-01' WHERE id = $1", [s1])), /permission denied/);
  /* firma tarafı etkilenmez */
  assert.equal((await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM is_sozlesmesi WHERE id = ANY ($1::uuid[])", [[s1, s2, s3]])).rows[0].n, 3);
});
