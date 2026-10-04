/* NEREDEN GELDİ: KOD-GECIS §7 (firma ayarları, başlangıç değerleri) · ARKA-UC §8 ("API anahtarları, bulut erişimi, imza sağlayıcı bilgileri veritabanında
   şifreli (anahtar ortam değişkeninde), ekranda gösterilmez, loga yazılmaz") · 09-D1 (sürüm kilidi) · reisim 2026-10-04: "sızma veri çalma gibi
   şeylere dikkat et". GERÇEK PostgreSQL, iki firma. Olumsuz kanıt: tests/bozan/ayar.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { ayarOku, ayarYaz, baslangic } from "../src/server/ayar/ayar.ts";
import { anaAnahtar, coz, sifrele, sirDurumu, sirKullan, sirYaz } from "../src/server/ayar/sir.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const ANAHTAR = randomBytes(32);
const IZ = { kim: "Deneme Yönetici", ne: "ayar.mesai" };
const SIR = "deneme-uydurma-anahtar-1234";

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("başlangıç değerleri = KOD-GECIS §7 (mesai 480 / 180 / 270 / 660, eşikler 30 / 30 / 30 / 60, nüsha 2, saklama 5)", async () => {
  assert.deepEqual(baslangic("mesai"), { acik: false, normal_dk: 480, mesai_dk: 180, yillik_fazla_saat: 270, gunluk_ust_dk: 660 });
  assert.deepEqual(baslangic("uyari_esikleri"), { kalibrasyon: 30, kontrolu_yaklasan_tesis: 30, plan_kontrolu_geliyor: 30, egitim: 60 });
  assert.equal(baslangic("firma_bilgileri").nusha, 2);
  assert.equal(baslangic("saklama").yil, 5);
  assert.deepEqual(baslangic("numara"), { proje: "P", teklif: "T", sozlesme: "IS", gider: "G", izin: "I" });
  const o = await kiraciIcinde(havuz, A, (db) => ayarOku(db, "mesai"));
  assert.equal(o.surum, -1);
  assert.deepEqual(o.deger, baslangic("mesai"));
});

test("yaz: şema denetimi (saklama 5 yıldan az olamaz, yıllık fazla çalışma 270'i aşamaz); sürüm kilidi; firma ayrı", async () => {
  const yaz = (firma: string, surum: number, deger: unknown) => kiraciIcinde(havuz, firma, (db) => ayarYaz(db, "mesai", surum, deger, IZ));
  const gecersiz = await yaz(A, -1, { ...baslangic("mesai"), yillik_fazla_saat: 300 });
  assert.equal(gecersiz.durum, "gecersiz");
  assert.equal((await kiraciIcinde(havuz, A, (db) => ayarYaz(db, "saklama", -1, { yil: 2 }, IZ))).durum, "gecersiz", "5 yıldan az olamaz (ENGEL 11)");
  const ilk = await yaz(A, -1, { ...baslangic("mesai"), acik: true });
  assert.equal(ilk.durum, "tamam");
  assert.deepEqual(await yaz(A, -1, { ...baslangic("mesai"), acik: false }), { durum: "cakisma", guncelSurum: 0 }, "ikinci 'ilk kayıt' ezmez");
  const ikinci = await yaz(A, 0, { ...baslangic("mesai"), acik: true, normal_dk: 450 });
  assert.equal(ikinci.durum, "tamam");
  assert.equal((await yaz(A, 0, { ...baslangic("mesai"), normal_dk: 400 })).durum, "cakisma", "eski sürümle yazma reddedilir");
  assert.equal((await kiraciIcinde(havuz, A, (db) => ayarOku(db, "mesai"))).deger.normal_dk, 450);
  assert.deepEqual((await kiraciIcinde(havuz, B, (db) => ayarOku(db, "mesai"))).deger, baslangic("mesai"), "B'nin ayarı etkilenmedi");
  await assert.rejects(kiraciIcinde(havuz, A, (db) => ayarYaz(db, "__proto__" as never, -1, {}, IZ)), /Bilinmeyen ayar bölümü/);
});

test("bozuk kayıt uygulamayı düşürmez: geçersiz alan başlangıca döner, geçerli alan kalır", async () => {
  await kiraciIcinde(havuz, B, (db) => db.sorgu(`INSERT INTO firma_ayar (bolum, deger) VALUES ('uyari_esikleri', '{"kalibrasyon": 45, "egitim": "çok"}')`));
  const o = await kiraciIcinde(havuz, B, (db) => ayarOku(db, "uyari_esikleri"));
  assert.equal(o.deger.kalibrasyon, 45);
  assert.equal(o.deger.egitim, 60);
});

test("SIR: veritabanında düz metin yok; firma + ada bağlı (kopyalanan satır çözülmez); yanlış anahtar çözemez; iz değeri taşımaz", async () => {
  await kiraciIcinde(havuz, A, (db) => sirYaz(db, "yapay_zeka_anahtari", SIR, { kim: "Deneme Yönetici" }, ANAHTAR));
  const satir = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ sifreli: string }>("SELECT sifreli FROM firma_sir WHERE ad = 'yapay_zeka_anahtari'"))).rows[0]!;
  assert.ok(!satir.sifreli.includes(SIR) && !Buffer.from(satir.sifreli.split(".")[3]!, "base64url").toString("utf8").includes("uydurma"));
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => sirDurumu(db, "yapay_zeka_anahtari")), { tanimli: true, son4: "1234" });
  assert.equal(await kiraciIcinde(havuz, A, (db) => sirKullan(db, "yapay_zeka_anahtari", ANAHTAR)), SIR);
  /* B'ye kopyalanan şifreli satır B'de çözülmez; başka ada kopyalanan da */
  await kiraciIcinde(havuz, B, (db) => db.sorgu("INSERT INTO firma_sir (ad, sifreli, son4) VALUES ('yapay_zeka_anahtari', $1, '1234'), ('bulut_erisimi', $1, '1234')", [satir.sifreli]));
  await assert.rejects(kiraciIcinde(havuz, B, (db) => sirKullan(db, "yapay_zeka_anahtari", ANAHTAR)));
  await assert.rejects(kiraciIcinde(havuz, A, async (db) => { await db.sorgu("UPDATE firma_sir SET ad = 'bulut_erisimi' WHERE ad = 'yapay_zeka_anahtari'"); return sirKullan(db, "bulut_erisimi", ANAHTAR); }));
  await assert.rejects(kiraciIcinde(havuz, A, (db) => sirKullan(db, "yapay_zeka_anahtari", randomBytes(32))), "başka ana anahtar çözemez");
  assert.equal(await kiraciIcinde(havuz, B, (db) => sirKullan(db, "imza_saglayici", ANAHTAR)), null);
  const iz = await kiraciIcinde(havuz, A, (db) => db.sorgu("SELECT ayrinti, eski, yeni FROM denetim_izi WHERE nesne = 'firma_sir'"));
  assert.ok(iz.rows.length >= 1 && !JSON.stringify(iz.rows).includes("uydurma"), "iz sırrın değerini taşımaz");
  await kiraciIcinde(havuz, A, (db) => sirYaz(db, "yapay_zeka_anahtari", null, { kim: "Deneme Yönetici" }, ANAHTAR));
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => sirDurumu(db, "yapay_zeka_anahtari")), { tanimli: false, son4: null });
  await assert.rejects(kiraciIcinde(havuz, A, (db) => sirYaz(db, "baska_sir" as never, "x", { kim: "x" }, ANAHTAR)), /Bilinmeyen sır/);
});

test("ana anahtar yoksa / kısaysa sır yazılmaz (düz metne düşmez); şifreleme her seferinde farklı (aynı değer tanınmaz)", () => {
  assert.throws(() => anaAnahtar(undefined), /Sır anahtarı tanımlı değil/);
  assert.throws(() => anaAnahtar(Buffer.alloc(16).toString("base64")), /Sır anahtarı tanımlı değil/);
  const f = "00000000-0000-4000-8000-000000000000";
  const a = sifrele("deger", f, "bulut_erisimi", ANAHTAR), b = sifrele("deger", f, "bulut_erisimi", ANAHTAR);
  assert.notEqual(a, b);
  assert.equal(coz(a, f, "bulut_erisimi", ANAHTAR), "deger");
  const [s, iv, etiket, govde] = a.split(".");
  const bozuk = [s, iv, etiket, Buffer.from(Buffer.from(govde!, "base64url").map((x) => x ^ 1)).toString("base64url")].join(".");
  assert.throws(() => coz(bozuk, f, "bulut_erisimi", ANAHTAR), "kurcalanan şifreli metin reddedilir");
});
