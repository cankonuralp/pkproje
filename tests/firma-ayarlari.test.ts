/* NEREDEN GELDİ: maket firma-ayarlari.html (R1 ayrı modül; Z1 bölüm başına Kaydet, geçersiz değer kaydedilmez; firma künyesi + logo raporlara —
   reisim 2026-10-03 "Şirket logosuda firma ayarlarından girilsin, raporlara otomatik çekilsin"; rapor numarası firma kodu "açılmış raporların
   numarası değişmez") · KOD-GECIS §7 · reisim 2026-10-04: "rol değiştirme, sızma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (334;
   göç 0045). Olumsuz kanıt tests/bozan/firma-ayarlari.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo, type Depo } from "../src/server/dosya/depo.ts";
import { raporNoAl } from "../src/server/numara/numara.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { ayarOku, firmaBelgeKunyesi, firmaKunyesi } from "../src/server/ayar/ayar.ts";
import { ayarDosyasiYaz, ayarKaydet, belgeTuruEkle, belgeTuruKaldir, firmaAyarlari, firmaKoduKaydet, yzAnahtarYaz, type Kisi } from "../src/modules/firma-ayarlari/server/ayarlar.ts";
import { ozlukEkle, ozlukKaldir, personelDosyasi } from "../src/modules/personel/server/dosyalar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
let YON: Kisi, DEN: Kisi, PLAN: Kisi, YON_B: Kisi;
let kisiA: string, kisiB: string;
const klasor = mkdtempSync(join(tmpdir(), "firma-ayar-depo-"));
const depo = klasorDepo(klasor);
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>, firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const sql = async (firma: string, metin: string, p: unknown[] = []) => (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(metin, p))).rows[0]?.id;
async function hesap(firma: string, eposta: string, roller: string[], personel: string | null = null): Promise<Kisi> {
  const id = (await sql(firma, "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [eposta, roller, personel]))!;
  return { id, ad: "Deneme", roller: roller as Kisi["roller"] };
}
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const bayt = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const parca = (ad: string, govde: string) => bayt([0, 0, govde.length >> 8, govde.length & 0xff], ad, govde, [0, 0, 0, 0]);
const PNG = bayt([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [...parca("IHDR", "\0\0\0\x01\0\0\0\x01\x08\x02\0\0\0")], [...parca("IDAT", "veri")], [...parca("IEND", "")]);
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n");

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  kisiA = (await sql(A, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Teslim Eden', '2024-01-01', 'mak-muh') RETURNING id::text"))!;
  kisiB = (await sql(B, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme B Kişi', '2024-01-01', 'mak-muh') RETURNING id::text"))!;
  YON = await hesap(A, "yon@deneme-a.example", ["firma_yoneticisi"]);
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"], kisiA);
  PLAN = await hesap(A, "plan@deneme-a.example", ["planlama"]);
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"]);
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("yetki (modül 22): firma yöneticisi görür ve değiştirir; denetçi ve planlama göremez; firma 'gör' verirse salt okunur (istemciden rol gelmez)", async () => {
  const v = (await a(YON, (db) => firmaAyarlari(db, YON)))!;
  assert.deepEqual([v.yaz, v.kod, v.firma.kayitAd, v.firma.deger.nusha, v.esik.deger.kalibrasyon, v.kisiler.map((k) => k.ad)], [true, "DA", "Deneme A", 2, 30, ["Deneme Teslim Eden"]]);
  for (const k of [DEN, PLAN]) {
    assert.equal(await a(k, (db) => firmaAyarlari(db, k)), null);
    assert.equal((await a(k, (db) => ayarKaydet(db, k, "imza", -1, { yontem: "e_imza" }))).durum, "yetkisiz");
    assert.equal((await a(k, (db) => firmaKoduKaydet(db, k, { kod: "ZZ" }))).durum, "yetkisiz");
  }
  const GOR = { ...PLAN, matris: { 22: ["gor", "yok", "yok", "yok", "yaz", "yok"] } } as Kisi;
  assert.equal((await a(GOR, (db) => firmaAyarlari(db, GOR)))!.yaz, false);
  assert.equal((await a(GOR, (db) => ayarKaydet(db, GOR, "imza", -1, { yontem: "e_imza" }))).durum, "yetkisiz");
  /* 2026-10-06 (334 incelemesi): "kendi" / "branşı" — firma ayarında kişiye ya da branşa ait kayıt yok; bütün ayarları (sabit giderler, personel
     listesi) görmez (Muhasebe ve Müşteriler gibi yalnız gör / yaz) */
  for (const [k, d] of [[DEN, "kendi"], [PLAN, "brans"]] as const) {
    const K = { ...k, matris: { 22: [d, d, d, d, "yaz", "yok"] } } as Kisi;
    assert.equal(await a(K, (db) => firmaAyarlari(db, K)), null, d);
  }
});

test("bölüm kaydet: geçersiz değer kaydedilmez (alan alan Türkçe); sürüm kilidi; dosya alanı korunur; sabit gider tutarı kuruş", async () => {
  assert.deepEqual(await a(YON, (db) => ayarKaydet(db, YON, "firma", -1, { ad: "Deneme Muayene", adres: "Deneme Cad. 1", eposta: "yanlis", akr: "AB-123", nusha: "3" })),
    { durum: "gecersiz", hatalar: { eposta: "Geçerli bir e-posta yazın." } });
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "firma", -1, { ad: "Deneme Muayene", adres: "Deneme Cad. 1", eposta: "rapor@deneme-a.example", akr: "AB-123", nusha: "3" })));
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "firma", -1, { ad: "x", adres: "", eposta: "", akr: "", nusha: "2" }))).durum, "cakisma", "kaydedilmemiş sanan ikinci yazma");
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "mesai", -1, { acik: true, normal_dk: "480", mesai_dk: "180", yillik_fazla_saat: "300" }))).durum, "gecersiz");
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "mesai", -1, { acik: true, normal_dk: "450", mesai_dk: "120", yillik_fazla_saat: "200" })));
  assert.deepEqual((await a(YON, (db) => ayarOku(db, "mesai"))).deger, { acik: true, normal_dk: 450, mesai_dk: 120, yillik_fazla_saat: 200, gunluk_ust_dk: 660 });
  /* 334 incelemesi: formun kabul ettiği aralık kaydedilir (onaylı maket 1–1440; 660'ı aşan toplam uyarı); kapatırken gizli alanlar doğrulanmaz,
     kayıtlı değerleri kalır */
  const ms = (await a(YON, (db) => ayarOku(db, "mesai"))).surum;
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "mesai", ms, { acik: true, normal_dk: "700", mesai_dk: "700", yillik_fazla_saat: "200" })));
  assert.deepEqual((await a(YON, (db) => ayarKaydet(db, YON, "mesai", ms + 1, { acik: true, normal_dk: "0", mesai_dk: "120", yillik_fazla_saat: "200" }))),
    { durum: "gecersiz", hatalar: { normal_dk: "1–1440 arası dakika yazın." } });
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "mesai", ms + 1, { acik: false, normal_dk: "abc", mesai_dk: "", yillik_fazla_saat: "999" })));
  assert.deepEqual((await a(YON, (db) => ayarOku(db, "mesai"))).deger, { acik: false, normal_dk: 700, mesai_dk: 700, yillik_fazla_saat: 200, gunluk_ust_dk: 660 });
  /* sunucunun düzelttiği aynı değer: "değişmedi" (ekran taslağı kayıtlıya döner) */
  const fs = (await a(YON, (db) => ayarOku(db, "firma_bilgileri"))).surum;
  assert.deepEqual(await a(YON, (db) => ayarKaydet(db, YON, "firma", fs, { ad: "Deneme Muayene ", adres: "Deneme Cad. 1", eposta: "rapor@deneme-a.example", akr: "AB-123", nusha: "3" })),
    { durum: "tamam", bildirim: "Firma bilgileri kaydedildi; yeni raporların ve belgelerin başlığına gelir.", degismedi: true });
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "esik", -1, { kalibrasyon: "45", kontrolu_yaklasan_tesis: "30", plan_kontrolu_geliyor: "30", egitim: "15" }))).durum, "gecersiz");
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "esik", -1, { kalibrasyon: "45", kontrolu_yaklasan_tesis: "60", plan_kontrolu_geliyor: "15", egitim: "120" })));
  assert.deepEqual(await a(YON, (db) => ayarKaydet(db, YON, "sabit", -1, { kalemler: [{ ad: "", aylik: "100", not: "" }] })),
    { durum: "gecersiz", hatalar: { "kalemler.0.ad": "Gider adı en az 2 harf." } });
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "sabit", -1, { kalemler: [{ ad: "Ofis kirası", aylik: "1.250,50", not: "Deneme" }] })));
  assert.deepEqual((await a(YON, (db) => ayarOku(db, "sabit_gider"))).deger.kalemler, [{ ad: "Ofis kirası", aylik: 125_050, not: "Deneme" }]);
  /* zimmet teslim eden: yalnız bu firmanın çalışanı */
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "zimmet", -1, { teslim_eden: kisiB }))).durum, "gecersiz", "başka firmanın kişisi");
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "zimmet", -1, { teslim_eden: kisiA })));
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "bilinmeyen", -1, {}))).durum, "gecersiz");
});

test("firma kodu: 2 harf A–Z (küçük harf büyür, 'i' → I); gördüğü kod değişmişse yazılmaz; yalnız kendi firması; açılmış raporun numarası değişmez", async () => {
  assert.equal((await a(YON, (db) => firmaKoduKaydet(db, YON, { kod: "K1", gorulen: "DA" }))).durum, "gecersiz");
  assert.equal((await a(YON, (db) => firmaKoduKaydet(db, YON, { kod: "KMA", gorulen: "DA" }))).durum, "gecersiz");
  const once = await a(YON, (db) => raporNoAl(db));
  assert.match(once, /^DA-\d{4}-001-/);
  /* 334 incelemesi: Türkçe yerelde "ik" → "İK" olup reddediliyordu; yerelden bağımsız büyütme */
  tamam(await a(YON, (db) => firmaKoduKaydet(db, YON, { kod: "ik", gorulen: "DA" })));
  assert.equal((await a(YON, (db) => firmaKunyesi(db))).kod, "IK");
  /* iyimser kilit: eski ekran (DA gördü) başkasının değişikliğini ezmez; izdeki eski değer gerçek geçiş */
  assert.equal((await a(YON, (db) => firmaKoduKaydet(db, YON, { kod: "ZZ", gorulen: "DA" }))).durum, "cakisma");
  tamam(await a(YON, (db) => firmaKoduKaydet(db, YON, { kod: "km", gorulen: "IK" })));
  assert.equal((await a(YON, (db) => firmaKunyesi(db))).kod, "KM");
  assert.deepEqual((await a(YON, (db) => db.sorgu("SELECT eski, yeni FROM denetim_izi WHERE ne = 'firma.rapor_kodu' ORDER BY id DESC LIMIT 1"))).rows[0],
    { eski: { rapor_kodu: "IK" }, yeni: { rapor_kodu: "KM" } });
  assert.equal((await a(YON, (db) => firmaKoduKaydet(db, YON, { kod: "KM", gorulen: "KM" }))).durum === "tamam", true);
  /* açılmış numara değişmez, sıra kesintisiz sürer */
  assert.match(await a(YON, (db) => raporNoAl(db)), /^KM-\d{4}-002-/);
  assert.match(once, /^DA-/);
  assert.equal((await a(YON_B, (db) => firmaKunyesi(db), B)).kod, "DB", "B'nin kodu değişmedi");
  /* veritabanı: uygulama rolü firmada yalnız rapor kodunu yazabilir; başka firmayı göremez */
  await assert.rejects(a(YON, (db) => db.sorgu("UPDATE firma SET ad = 'Deneme' WHERE id = $1", [A])), /permission denied/);
  assert.equal((await a(YON, (db) => db.sorgu("UPDATE firma SET rapor_kodu = 'XX' WHERE id = $1", [B]))).rowCount, 0);
});

test("dosyalar: logo yalnız PNG / JPEG (en çok 2 MB), belgelerin başlığına veri adresi olarak gelir; firmanın her kullanıcısı açar, B açamaz; kaldırılan çöpe", async () => {
  const s0 = (await a(YON, (db) => firmaAyarlari(db, YON)))!.dosyalar.surum.firma;
  assert.equal((await a(YON, (db) => ayarDosyasiYaz(db, depo, YON, A, "logo", s0, { ad: "logo.pdf", bayt: PDF }))).durum, "gecersiz", "PDF logo olmaz");
  assert.equal((await a(DEN, (db) => ayarDosyasiYaz(db, depo, DEN, A, "logo", s0, { ad: "logo.png", bayt: PNG }))).durum, "yetkisiz");
  tamam(await a(YON, (db) => ayarDosyasiYaz(db, depo, YON, A, "logo", s0, { ad: "logo.png", bayt: PNG })));
  const v = (await a(YON, (db) => firmaAyarlari(db, YON)))!;
  assert.equal(v.dosyalar.logo?.ad, "logo.png");
  assert.equal(v.firma.deger.adres, "Deneme Cad. 1", "logo yazılırken öteki alanlar korunur");
  /* 334 incelemesi: logo yüklendikten sonra Firma bilgileri kaydı logoyu korur; 2 MB üstü logo; eski sürümle yükleme öksüz dosya bırakmaz */
  /* (değer değişmeli: aynı değer yazılmaz, sürüm artmaz — 249c666) */
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "firma", v.firma.surum, { ad: "Deneme Muayene", adres: "Deneme Cad. 1", eposta: "rapor2@deneme-a.example", akr: "AB-123", nusha: "3" })));
  const v2 = (await a(YON, (db) => firmaAyarlari(db, YON)))!;
  assert.equal(v2.dosyalar.logo?.ad, "logo.png", "firma kaydı logoyu silmez");
  const buyuk = new Uint8Array((2 << 20) + 1); buyuk.set(PNG);
  assert.deepEqual(await a(YON, (db) => ayarDosyasiYaz(db, depo, YON, A, "logo", v2.dosyalar.surum.firma, { ad: "b.png", bayt: buyuk })), { durum: "gecersiz", hatalar: { dosya: "En çok 2 MB." } });
  const etkin = async () => Number((await a(YON, (db) => db.sorgu<{ n: string }>("SELECT count(*) n FROM dosya WHERE modul = 'firma_ayar' AND cop IS NULL"))).rows[0].n);
  const n0 = await etkin();
  assert.equal((await a(YON, (db) => ayarDosyasiYaz(db, depo, YON, A, "logo", v.dosyalar.surum.firma, { ad: "eski.png", bayt: PNG }))).durum, "cakisma");
  assert.equal(await etkin(), n0, "çakışmada yeni dosya etkin kalmaz");
  /* depoda okunamayan logo belgeyi düşürmez */
  const okumaz: Depo = { ...depo, oku: async () => { throw new Error("ENOENT"); } };
  assert.equal((await a(YON, (db) => firmaBelgeKunyesi(db, okumaz))).logo, null);
  const k = await a(YON, (db) => firmaBelgeKunyesi(db, depo));
  assert.deepEqual([k.ad, k.kod, k.adres, k.akr, k.nusha, k.logo?.startsWith("data:image/png;base64,")], ["Deneme Muayene", "KM", "Deneme Cad. 1", "AB-123", 3, true]);
  const logo = v.dosyalar.logo!.id;
  assert.ok(await a(DEN, (db) => dosyaIndirilebilir(db, DEN, logo, DOSYA_ERISIMI)), "firmanın her kullanıcısı");
  assert.equal(await a(YON_B, (db) => dosyaIndirilebilir(db, YON_B, logo, DOSYA_ERISIMI), B), null, "B göremez");
  /* şablonlar: bordro formatı PDF ya da Excel; kaldırma */
  const s1 = v.dosyalar.surum.sablon;
  tamam(await a(YON, (db) => ayarDosyasiYaz(db, depo, YON, A, "bordro_format", s1, { ad: "bordro.pdf", bayt: PDF })));
  tamam(await a(YON, (db) => ayarDosyasiYaz(db, depo, YON, A, "logo", v2.dosyalar.surum.firma, null)));
  assert.equal((await a(YON, (db) => firmaAyarlari(db, YON)))!.dosyalar.logo, null);
  assert.equal((await a(YON, (db) => db.sorgu("SELECT 1 FROM dosya WHERE id = $1 AND cop IS NOT NULL", [logo]))).rowCount, 1, "eski logo çöpte");
  assert.equal((await a(YON, (db) => firmaBelgeKunyesi(db, depo))).logo, null);
});

/* 335: fiyat listesi (Teklifler'in tablosu, bağlantı işlevinden) · müşteriye açık personel belgeleri · firmanın eklediği belge türü */
test("fiyat listesi: KDV hariç TL → kuruş; kayıtlı fiyat boşaltılamaz, sıfır ve başka firmanın türü kaydedilmez", async () => {
  const ht = (await sql(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text"))!;
  const turB = (await sql(B, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text"))!;
  assert.deepEqual((await a(YON, (db) => firmaAyarlari(db, YON)))!.fiyat.turler.map((t) => [t.ad, t.fiyat]), [["Hava tankı", null]]);
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "fiyat", 0, { fiyatlar: { [ht]: "1.250,50" }, gorulen: { [ht]: "" } })));
  assert.deepEqual((await a(YON, (db) => firmaAyarlari(db, YON)))!.fiyat.turler.map((t) => t.fiyat), [125_050]);
  assert.deepEqual(await a(YON, (db) => ayarKaydet(db, YON, "fiyat", 0, { fiyatlar: { [ht]: "" }, gorulen: { [ht]: "1.250,50" } })), { durum: "gecersiz", hatalar: { [ht]: "Fiyat boş bırakılamaz (kayıtlı fiyat silinmez)." } });
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "fiyat", 0, { fiyatlar: { [ht]: "0" }, gorulen: { [ht]: "1.250,50" } }))).durum, "gecersiz");
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "fiyat", 0, { fiyatlar: { [turB]: "100" }, gorulen: {} }))).durum, "gecersiz", "başka firmanın türü");
  assert.equal((await a(DEN, (db) => ayarKaydet(db, DEN, "fiyat", 0, { fiyatlar: { [ht]: "999" }, gorulen: { [ht]: "1.250,50" } }))).durum, "yetkisiz");
  /* 335 incelemesi: iyimser kilit — eski ekran (gördüğü 1.000) başkasının kaydettiği fiyatı ezmez; değişmeyen tür yazılmaz */
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "fiyat", 0, { fiyatlar: { [ht]: "1.300" }, gorulen: { [ht]: "1.000" } }))).durum, "cakisma");
  assert.deepEqual(await a(YON, (db) => ayarKaydet(db, YON, "fiyat", 0, { fiyatlar: { [ht]: "1.250,50" }, gorulen: { [ht]: "999" } })),
    { durum: "tamam", bildirim: "Fiyat listesinde değişiklik yok.", degismedi: true }, "değişmeyen tür eski görülene bakılmadan atlanır");
  assert.deepEqual((await a(YON, (db) => firmaAyarlari(db, YON)))!.fiyat.turler.map((t) => t.fiyat), [125_050]);
});

test("müşteriye açık belgeler ve belge türü ekle: seçim ayara yazılır; yeni tür Personel'de seçilir, adı var olanla aynı olamaz; belgesi varken kaldırılamaz", async () => {
  const eg = (await sql(A, "INSERT INTO egitim_turu (ad, tekrar_ay) VALUES ('Deneme Eğitim', 12) RETURNING id::text"))!;
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "mbelge", -1, { secili: ["ekipnet", "yok-boyle"] }))).durum, "gecersiz");
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "mbelge", -1, { secili: ["ekipnet", "atama", `eg:${eg}`] })));
  assert.deepEqual((await a(YON, (db) => ayarOku(db, "musteri_belge"))).deger, { ozluk: ["ekipnet"], egitim: [eg], atama: true });
  for (const ad of ["Diploma", "deneme eğitim", "Deneme Eğitim sertifikası"])
    assert.deepEqual(await a(YON, (db) => belgeTuruEkle(db, YON, { ad, kisisel: false })), { durum: "gecersiz", hatalar: { ad: "Bu adla bir belge türü zaten var." } }, ad);
  assert.equal((await a(DEN, (db) => belgeTuruEkle(db, DEN, { ad: "Deneme Kart", kisisel: true }))).durum, "yetkisiz");
  tamam(await a(YON, (db) => belgeTuruEkle(db, YON, { ad: "Deneme Kart", kisisel: true })));
  const v = (await a(YON, (db) => firmaAyarlari(db, YON)))!;
  assert.deepEqual(v.mbelge.turler.find((t) => t.k === "ek1"), { k: "ek1", ad: "Deneme Kart", kisisel: true, ek: true, kullanim: 0 });
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "mbelge", v.mbelge.surum, { secili: ["ekipnet", "ek1"] })));
  /* Personel: yeni tür seçilir ve adıyla görünür; ayarda olmayan tür kaydedilmez */
  const kart = (await a(YON, (db) => personelDosyasi(db, YON, kisiA)))!;
  assert.ok(kart.ozlukTurleri.some(([k, ad]) => k === "ek1" && ad === "Deneme Kart"));
  assert.deepEqual(kart.ozlukTurleri.at(-1), ["diger", "Diğer"], "Diğer hep sonda");
  assert.equal((await a(YON, (db) => ozlukEkle(db, depo, YON, A, kisiA, { tur: "ek9", aciklama: "" }, { ad: "k.pdf", bayt: PDF }))).durum, "gecersiz");
  const o = tamam(await a(YON, (db) => ozlukEkle(db, depo, YON, A, kisiA, { tur: "ek1", aciklama: "" }, { ad: "k.pdf", bayt: PDF })));
  assert.deepEqual(await a(YON, (db) => belgeTuruKaldir(db, YON, "ek1")), { durum: "red", neden: "Deneme Kart kaldırılamaz: 1 personelde bu türde yüklü belge var." });
  assert.equal((await a(YON, (db) => firmaAyarlari(db, YON)))!.mbelge.turler.find((t) => t.k === "ek1")!.kullanim, 1, "kullanım ekranda (sorulmadan söylenir)");
  const s = (await a(YON, (db) => personelDosyasi(db, YON, kisiA)))!.ozluk!.find((x) => x.id === o.id)!;
  tamam(await a(YON, (db) => ozlukKaldir(db, YON, o.id, s.surum)));
  tamam(await a(YON, (db) => belgeTuruKaldir(db, YON, "ek1")));
  assert.deepEqual((await a(YON, (db) => ayarOku(db, "musteri_belge"))).deger.ozluk, ["ekipnet"], "kaldırılan tür müşteriye açık listeden de düştü");
  assert.ok(!(await a(YON, (db) => firmaAyarlari(db, YON)))!.mbelge.turler.some((t) => t.k === "ek1"));
  /* 335 incelemesi: kaldırılan türün anahtarı yeniden verilmez (eski seçim / eski belge yeni türün adıyla müşteriye açılmasın) */
  tamam(await a(YON, (db) => belgeTuruEkle(db, YON, { ad: "Deneme Sicil", kisisel: true })));
  const yeniTur = (await a(YON, (db) => ayarOku(db, "belge_tur_ek"))).deger;
  assert.deepEqual([yeniTur.turler.map((t) => t.k), yeniTur.son], [["ek2"], 2]);
  assert.ok(!(await a(YON, (db) => ayarOku(db, "musteri_belge"))).deger.ozluk.includes("ek2"), "yeni tür müşteriye kapalı doğar");
});

/* 336: yapay zekâ (anahtar şifreli sırda — değer ekrana ve yanıta dönmez, yalnız son 4), bulut kaydı, yedek */
test("yapay zekâ, bulut, yedek: anahtar biçimi denetlenir, şifreli saklanır, yalnız son 4 görünür; sınır $, bulut klasör adı, yedek seçenekleri", async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  const ANAHTAR = "sk-ant-deneme-0123456789abcdefWXYZ";
  assert.deepEqual(await a(YON, (db) => yzAnahtarYaz(db, YON, { anahtar: "sk-deneme" })), { durum: "gecersiz", hatalar: { anahtar: "Geçerli bir Anthropic API anahtarı değil (sk-ant- ile başlar)." } });
  assert.equal((await a(DEN, (db) => yzAnahtarYaz(db, DEN, { anahtar: ANAHTAR }))).durum, "yetkisiz");
  tamam(await a(YON, (db) => yzAnahtarYaz(db, YON, { anahtar: ANAHTAR })));
  const v = (await a(YON, (db) => firmaAyarlari(db, YON)))!;
  assert.deepEqual(v.yz.anahtar, { tanimli: true, son4: "WXYZ" });
  assert.ok(!JSON.stringify(v).includes(ANAHTAR), "anahtar ekran verisinde yok");
  const satir = (await a(YON, (db) => db.sorgu<{ sifreli: string }>("SELECT sifreli FROM firma_sir WHERE ad = 'yapay_zeka_anahtari'"))).rows[0];
  assert.ok(!satir.sifreli.includes(ANAHTAR), "veritabanında düz metin yok");
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "yz", v.yz.surum, { acik: true, model: "sonnet", sinir: "abc" }))).durum, "gecersiz");
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "yz", v.yz.surum, { acik: true, model: "sonnet", sinir: "12,5" })));
  const y = (await a(YON, (db) => ayarOku(db, "yapay_zeka"))).deger;
  assert.deepEqual([y.acik, y.model, y.sinir], [true, "sonnet", 12.5]);
  tamam(await a(YON, (db) => yzAnahtarYaz(db, YON, null)));
  assert.deepEqual((await a(YON, (db) => firmaAyarlari(db, YON)))!.yz.anahtar, { tanimli: false, son4: null });
  /* 335 incelemesi: ekranda "Açık" seçiliyken anahtar girilince yapay zekâ da açılır (eski sürümle değil); ana şifreleme anahtarı olmadan
     anahtar kaldırılabilir */
  const ys = (await a(YON, (db) => ayarOku(db, "yapay_zeka"))).surum;
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "yz", ys, { acik: false, model: "sonnet", sinir: "12,5" })));
  assert.equal((await a(YON, (db) => yzAnahtarYaz(db, YON, { anahtar: ANAHTAR }, ys))).durum, "cakisma", "eski sürüm");
  assert.deepEqual(await a(YON, (db) => yzAnahtarYaz(db, YON, { anahtar: ANAHTAR }, ys + 1)), { durum: "tamam", bildirim: "API anahtarı kaydedildi; yapay zekâ açık." });
  assert.equal((await a(YON, (db) => ayarOku(db, "yapay_zeka"))).deger.acik, true);
  const ana = process.env.PROBATA_SIR_ANAHTARI;
  delete process.env.PROBATA_SIR_ANAHTARI;
  try {
    assert.equal((await a(YON, (db) => yzAnahtarYaz(db, YON, { anahtar: ANAHTAR }))).durum, "red", "ana anahtarsız yazılmaz");
    tamam(await a(YON, (db) => yzAnahtarYaz(db, YON, null)));
  } finally { process.env.PROBATA_SIR_ANAHTARI = ana; }
  assert.deepEqual((await a(YON, (db) => firmaAyarlari(db, YON)))!.yz.anahtar, { tanimli: false, son4: null }, "ana anahtarsız kaldırıldı");
  /* bulut ve yedek */
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "bulut", -1, { saglayici: "gdrive", kok: "Rapor/2026", duzen: "mt" }))).durum, "gecersiz", "klasör adında /");
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "bulut", -1, { saglayici: "baska", kok: "Raporlar", duzen: "mt" }))).durum, "gecersiz");
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "bulut", -1, { saglayici: "sftp", kok: "Deneme Raporlar", duzen: "mty" })));
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "yedek", -1, { sik: "gunluk", saat: "25", gun: "30" }))).durum, "gecersiz");
  assert.equal((await a(YON, (db) => ayarKaydet(db, YON, "yedek", -1, { sik: "gunluk", saat: "02", gun: "45" }))).durum, "gecersiz");
  tamam(await a(YON, (db) => ayarKaydet(db, YON, "yedek", -1, { sik: "haftalik", saat: "02", gun: "90" })));
  assert.deepEqual((await a(YON, (db) => ayarOku(db, "yedek"))).deger, { sik: "haftalik", saat: "02", gun: 90 });
});

test("firma sızıntısı: B kendi ayarlarını görür (başlangıç değerleri), A'nınkini değil", async () => {
  const v = (await a(YON_B, (db) => firmaAyarlari(db, YON_B), B))!;
  assert.deepEqual([v.kod, v.firma.deger.ad, v.firma.deger.nusha, v.esik.deger.kalibrasyon, v.sabit.deger.kalemler, v.kisiler.map((k) => k.ad)],
    ["DB", "", 2, 30, [], ["Deneme B Kişi"]]);
  assert.deepEqual([v.mbelge.deger.secili, v.mbelge.turler.filter((t) => t.ek || t.k.startsWith("eg:")).length, v.fiyat.turler.map((t) => t.fiyat)], [["ekipnet"], 0, [null]]);
  assert.deepEqual([v.yz.anahtar, v.yz.deger.acik, v.bulut.deger.saglayici, v.yedek.deger.sik], [{ tanimli: false, son4: null }, false, "", "gunluk"]);
});
