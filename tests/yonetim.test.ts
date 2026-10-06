/* NEREDEN GELDİ: 348 — probata YÖNETİM sayfası (KOD-GECIS Y1, reisim 2026-10-03: "Yönetim sayfa önerini kabul ediyorum"; maket yonetim.html;
   reisim: "kaynak koddan rol değiştirme, sızma, veri çalma"). GERÇEK PostgreSQL, iki firma, iki yönetici:
   · iki adımlı giriş: parola → kısa ömürlü bekleyen oturum (yönetim oturumu sayılmaz) → doğrulama kodu → yönetim oturumu; aynı kod ikinci kez
     geçmez (yeniden oynatma); 5 hatalı deneme (parola ya da kod) → 15 dk kilit, kilitliyken doğru parola da geçmez; IP kilidi;
   · ilk kurulum: geçici parolalı yönetici kod adımına geçemez; anahtar bekleyen oturumda bir kez üretilir; kod + yeni parola (geçiciyle aynı
     olamaz) → durum etkin, eski oturumlar düşer;
   · firma aç: firma + ilk firma yöneticisinin personel kaydı ve hesabı (geçici parola, "ilk") — yeni firmaya o parolayla girilir; kayıtlı adres /
     kod, ayrılmış ad reddedilir; firmanın denetim izine ve yönetim izine (yönetici veritabanından) yazılır;
   · dondur: alt alan adı firma bulmaz, firmanın kullanıcı ve müşteri oturumları silinir; etkinleştir geri açar; geçici parola dondurulmuşta yok,
     etkinde eski parola geçmez;
   · SIZMA: uygulama rolü (firma işlemi) yönetim işlevlerini ve tablolarını göremez; yönetim rolü firmaların tablolarına dokunamaz, yönetici
     ekleyemez; yöneticisiz (ya da kapalı yöneticili) yönetim işlemi işlevleri çağıramaz; yönetim izi değişmez.
   Olumsuz kanıt: tests/bozan/yonetim.bozan.ts. */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import { firmaAc, firmaDurumu, firmalar, yoneticiyeGeciciParola } from "../src/modules/yonetim/server/yonetim.ts";
import { sifrele } from "../src/server/ayar/sir.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { firmaKimligi, havuzKur, kiraciIcinde, yonetimIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { girisYap } from "../src/server/kimlik/oturum.ts";
import { kodDogrula, kurulumBilgisi, kurulumTamamla, yoneticiGiris, yonetimOturumOku } from "../src/server/yonetim/giris.ts";
import { totpKodu, yeniAnahtar, zamanAdimi } from "../src/server/yonetim/totp.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A: string, B: string, Y1: string, Y2: string, Y3: string, KAPALI: string;
const ANAHTAR = yeniAnahtar();
const PAROLA = "yonetim-parola-2026";
const GECICI = "Abc2d-Ef3gh-4Jk5m";
const T0 = new Date("2026-10-06T10:00:00Z");
const sn = (n: number) => new Date(T0.getTime() + n * 1000);
const kod = (t: Date, a = ANAHTAR) => totpKodu(a, zamanAdimi(t));
/** o anda (±1 adım) geçerli olmayan bir kod */
const yanlisKod = (t: Date, a = ANAHTAR) => {
  const gecerli = [-1, 0, 1].map((d) => totpKodu(a, zamanAdimi(t) + d));
  return ["123456", "654321", "111111", "222222"].find((x) => !gecerli.includes(x))!;
};

before(async () => {
  process.env.PROBATA_SIR_ANAHTARI ??= randomBytes(32).toString("base64");
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id::text")).rows.map((r) => r.id);
    const ozet = await parolaOzeti(PAROLA);
    const ekle = async (eposta: string, durum: string, kurulu: boolean, p = ozet) => {
      const id = (await s.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti, durum, totp_sir) VALUES ($1, 'Deneme Yönetici', $2, $3, NULL) RETURNING id::text",
        [eposta, p, durum === "etkin" ? "ilk" : durum])).rows[0].id;
      if (kurulu) await s.query("UPDATE yonetici SET totp_sir = $2, durum = $3 WHERE id = $1", [id, sifrele(ANAHTAR, "yonetim", `totp:${id}`), durum]);
      return id;
    };
    Y1 = await ekle("y1@probata.example", "etkin", true);
    Y2 = await ekle("y2@probata.example", "ilk", false, await parolaOzeti(GECICI));
    Y3 = await ekle("y3@probata.example", "etkin", true);
    KAPALI = await ekle("kapali@probata.example", "kapali", true);
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("iki adımlı giriş: parola → bekleyen oturum (yönetim oturumu değil) → kod → yönetim oturumu; aynı kod ikinci kez geçmez", async () => {
  assert.deepEqual(await yoneticiGiris(havuz, { eposta: "y1@probata.example", parola: "yanlis-parola-1", ip: "10.1.0.1", simdi: T0 }), { tamam: false, neden: "hatali" });
  assert.deepEqual(await yoneticiGiris(havuz, { eposta: "yok@probata.example", parola: PAROLA, ip: "10.1.0.2", simdi: T0 }), { tamam: false, neden: "hatali" }, "hesap yokken aynı yanıt");
  const g = await yoneticiGiris(havuz, { eposta: " Y1@Probata.Example ", parola: PAROLA, ip: "10.1.0.1", simdi: T0 });
  assert.ok(g.tamam && g.sonraki === "kod");
  if (!g.tamam) return;
  assert.equal(await yonetimOturumOku(havuz, g.belirtec, T0), null, "parola adımı yönetim oturumu açmaz");
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g.belirtec, kod: "000000" === kod(T0) ? "111111" : "000000", ip: "10.1.0.1", simdi: T0 }), { tamam: false, neden: "hatali" });
  const k = await kodDogrula(havuz, { belirtec: g.belirtec, kod: kod(T0), ip: "10.1.0.1", simdi: T0 });
  assert.ok(k.tamam);
  if (!k.tamam) return;
  assert.deepEqual(await yonetimOturumOku(havuz, k.belirtec, sn(60)), { id: Y1, ad: "Deneme Yönetici", eposta: "y1@probata.example" });
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g.belirtec, kod: kod(T0), ip: "10.1.0.1", simdi: T0 }), { tamam: false, neden: "oturum" }, "bekleyen oturum harcandı");
  /* yeniden oynatma: yeni parola adımı, AYNI zaman adımının kodu geçmez; sonraki adımın kodu geçer */
  const g2 = await yoneticiGiris(havuz, { eposta: "y1@probata.example", parola: PAROLA, ip: "10.1.0.1", simdi: sn(5) });
  assert.ok(g2.tamam);
  if (!g2.tamam) return;
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g2.belirtec, kod: kod(T0), ip: "10.1.0.1", simdi: sn(5) }), { tamam: false, neden: "hatali" }, "aynı kod ikinci kez");
  assert.ok((await kodDogrula(havuz, { belirtec: g2.belirtec, kod: kod(sn(31)), ip: "10.1.0.1", simdi: sn(31) })).tamam);
  /* süre: bekleyen oturum 10 dk, yönetim oturumu 2 saat hareketsizlikte düşer */
  const g3 = await yoneticiGiris(havuz, { eposta: "y1@probata.example", parola: PAROLA, ip: "10.1.0.1", simdi: sn(100) });
  assert.ok(g3.tamam);
  if (!g3.tamam) return;
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g3.belirtec, kod: kod(sn(100 + 11 * 60)), ip: "10.1.0.1", simdi: sn(100 + 11 * 60) }), { tamam: false, neden: "oturum" });
  assert.equal(await yonetimOturumOku(havuz, k.belirtec, sn(60 + 121 * 60)), null, "hareketsizlik");
  /* kapalı yönetici giremez (aynı yanıt) */
  assert.deepEqual(await yoneticiGiris(havuz, { eposta: "kapali@probata.example", parola: PAROLA, ip: "10.1.0.3", simdi: T0 }), { tamam: false, neden: "hatali" });
});

test("kilit: 5 hatalı deneme (parola ya da kod, ortak sayaç) → 15 dk; parola adımı sayacı sıfırlamaz (kod kaba kuvvetle denenemez); IP kilidi", async () => {
  for (let i = 0; i < 4; i++) assert.equal((await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: `yanlis-${i}-parola`, ip: `10.2.0.${i}`, simdi: T0 })).tamam, false);
  /* doğru parola sayacı sıfırlamaz (347–348 incelemesi): 4 parola hatası + 1 kod hatası = kilit */
  const g = await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: PAROLA, ip: "10.2.1.1", simdi: T0 });
  assert.ok(g.tamam);
  if (!g.tamam) return;
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g.belirtec, kod: yanlisKod(T0), ip: "10.2.1.1", simdi: T0 }), { tamam: false, neden: "kilitli" });
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g.belirtec, kod: kod(T0), ip: "10.2.1.1", simdi: T0 }), { tamam: false, neden: "oturum" }, "kilitlenince bekleyen oturum düşer");
  assert.deepEqual(await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: PAROLA, ip: "10.2.2.2", simdi: sn(60) }), { tamam: false, neden: "kilitli" });
  const acik = await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: PAROLA, ip: "10.2.2.2", simdi: sn(16 * 60) });
  assert.ok(acik.tamam, "15 dk sonra açılır");
  if (!acik.tamam) return;
  const k = await kodDogrula(havuz, { belirtec: acik.belirtec, kod: kod(sn(16 * 60)), ip: "10.2.2.2", simdi: sn(16 * 60) });
  assert.ok(k.tamam);
  if (k.tamam) assert.equal((await yonetimOturumOku(havuz, k.belirtec, sn(16 * 60)))?.id, Y3);
  /* döngü: tam girişten sonra sayaç 0 — doğru parola → 4 yanlış kod → yine doğru parola → 1 yanlış kod = kilit (parola adımı sıfırlasaydı sınırsızdı) */
  const t = sn(20 * 60);
  const p1 = await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: PAROLA, ip: "10.2.3.3", simdi: t });
  assert.ok(p1.tamam);
  if (!p1.tamam) return;
  for (let i = 0; i < 4; i++) assert.deepEqual(await kodDogrula(havuz, { belirtec: p1.belirtec, kod: yanlisKod(t), ip: "10.2.3.3", simdi: t }), { tamam: false, neden: "hatali" });
  const p2 = await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: PAROLA, ip: "10.2.3.4", simdi: t });
  assert.ok(p2.tamam);
  if (!p2.tamam) return;
  assert.deepEqual(await kodDogrula(havuz, { belirtec: p2.belirtec, kod: yanlisKod(t), ip: "10.2.3.4", simdi: t }), { tamam: false, neden: "kilitli" }, "döngü kilide takılır");
  /* aynı IP'den bilinmeyen hesaplarla 5 hata → IP kilitlenir (doğru hesap da o IP'den giremez) */
  for (let i = 0; i < 5; i++) await yoneticiGiris(havuz, { eposta: `yok${i}@probata.example`, parola: "x-parola-12", ip: "10.9.9.9", simdi: T0 });
  assert.deepEqual(await yoneticiGiris(havuz, { eposta: "y1@probata.example", parola: PAROLA, ip: "10.9.9.9", simdi: sn(10) }), { tamam: false, neden: "kilitli" });
});

test("ilk kurulum: kod adımına geçilmez; anahtar bekleyen oturumda bir kez üretilir; kod + yeni parola → etkin, eski oturumlar düşer", async () => {
  /* kurulumdan önce açık kalmış bir yönetim oturumu — kurulum bütün oturumları düşürmeli */
  const eski = randomBytes(32).toString("base64url");
  const sa = kume.sahipIstemci(); await sa.connect();
  try {
    await sa.query("INSERT INTO yonetim_oturum (ozet, yonetici_id, adim, olustu, son_kullanim, bitis) VALUES ($1, $2, 'tamam', $3, $3, $4)",
      [createHash("sha256").update(eski, "utf8").digest("hex"), Y2, T0, sn(12 * 3600)]);
  } finally { await sa.end(); }
  const g = await yoneticiGiris(havuz, { eposta: "y2@probata.example", parola: GECICI, ip: "10.3.0.1", simdi: T0 });
  assert.ok(g.tamam && g.sonraki === "kurulum");
  if (!g.tamam) return;
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g.belirtec, kod: "123456", ip: "10.3.0.1", simdi: T0 }), { tamam: false, neden: "oturum" });
  const b1 = await kurulumBilgisi(havuz, g.belirtec, T0), b2 = await kurulumBilgisi(havuz, g.belirtec, sn(10));
  assert.ok(b1 && b2 && b1.anahtar === b2.anahtar && b1.adres.startsWith("otpauth://totp/") && b1.eposta === "y2@probata.example");
  if (!b1) return;
  assert.equal(await kurulumBilgisi(havuz, "x".repeat(43), T0), null);
  const yanlis = kod(sn(20), b1.anahtar) === "222222" ? "333333" : "222222";
  assert.deepEqual(await kurulumTamamla(havuz, { belirtec: g.belirtec, kod: yanlis, yeni: "yeni-parola-2026", ip: "10.3.0.1", simdi: sn(20) }), { tamam: false, neden: "hatali" });
  assert.deepEqual(await kurulumTamamla(havuz, { belirtec: g.belirtec, kod: kod(sn(20), b1.anahtar), yeni: GECICI, ip: "10.3.0.1", simdi: sn(20) }), { tamam: false, neden: "ayni" });
  const t = await kurulumTamamla(havuz, { belirtec: g.belirtec, kod: kod(sn(20), b1.anahtar), yeni: "yeni-parola-2026", ip: "10.3.0.1", simdi: sn(20) });
  assert.ok(t.tamam);
  if (!t.tamam) return;
  assert.equal((await yonetimOturumOku(havuz, t.belirtec, sn(30)))?.id, Y2);
  assert.equal(await yonetimOturumOku(havuz, eski, sn(30)), null, "kurulumdan önceki oturum düştü");
  assert.equal((await yoneticiGiris(havuz, { eposta: "y2@probata.example", parola: GECICI, ip: "10.3.0.2", simdi: sn(40) })).tamam, false, "geçici parola artık geçmez");
  const g2 = await yoneticiGiris(havuz, { eposta: "y2@probata.example", parola: "yeni-parola-2026", ip: "10.3.0.2", simdi: sn(40) });
  assert.ok(g2.tamam && g2.sonraki === "kod");
  if (!g2.tamam) return;
  assert.ok((await kodDogrula(havuz, { belirtec: g2.belirtec, kod: kod(sn(70), b1.anahtar), ip: "10.3.0.2", simdi: sn(70) })).tamam, "kurulan anahtar yöneticiye taşındı");
});

test("firma aç: firma + ilk yönetici (geçici parola ile girilir); kayıtlı adres / kod ve ayrılmış ad reddedilir; iki ize yazılır", async () => {
  const y = <T,>(is: Parameters<typeof yonetimIcinde<T>>[1]) => yonetimIcinde(havuz, is, { yoneticiId: Y1 });
  const G = { unvan: "Örnek Muayene Ltd. Şti.", alt: "Ornek", kod: "om", yon: "Deneme Firma Yöneticisi", eposta: "Yonetici@Ornek.Example" };
  const r = await y((db) => firmaAc(db, G, [], "probata.example"));
  assert.equal(r.durum, "tamam");
  if (r.durum !== "tamam") return;
  assert.equal(r.alt, "ornek");
  const id = await firmaKimligi(havuz, "ornek");
  assert.equal(id, r.id);
  const gir = await girisYap(havuz, r.id, { eposta: "yonetici@ornek.example", parola: r.parola, ip: "10.4.0.1" });
  assert.ok(gir.tamam && gir.hesap.durum === "ilk" && gir.hesap.roller.join() === "firma_yoneticisi");
  const liste = await y((db) => firmalar(db));
  const f = liste.find((x) => x.id === r.id);
  assert.deepEqual({ kod: f?.kod, durum: f?.durum, kullanici: f?.kullanici, yon: f?.yonetici?.eposta }, { kod: "OM", durum: "etkin", kullanici: 1, yon: "yonetici@ornek.example" });
  assert.equal(liste.length, 3);
  const ayni = await y((db) => firmaAc(db, { ...G, kod: "OX" }, [], "probata.example"));
  assert.deepEqual(ayni, { durum: "gecersiz", hatalar: { alt: "ornek.probata.example kullanılıyor." } }, "maketteki gibi tam adres");
  assert.deepEqual(await y((db) => firmaAc(db, { ...G, alt: "ornek2", kod: "DA" }, [], "probata.example")), { durum: "gecersiz", hatalar: { kod: "DA başka bir firmada." } });
  assert.equal((await y((db) => firmaAc(db, { ...G, alt: "www", kod: "WW" }, [], "probata.example"))).durum, "gecersiz");
  assert.equal((await y((db) => firmaAc(db, { ...G, alt: "panel", kod: "PN" }, ["panel"], "probata.example"))).durum, "gecersiz", "ortamdan ayrılmış ad");
  /* veritabanı da tutar: şemayı atlayan çağrı */
  const ham = await y(async (db) => (await db.sorgu<{ s: { hata?: string } }>(
    "SELECT yonetim_firma_ac('Deneme', 'api', 'AP', 'Deneme Kişi', 'a@deneme.example', $1) AS s", [await parolaOzeti("deneme-parola-1")])).rows[0].s);
  assert.deepEqual(ham, { hata: "ayrilmis" });
  const s = kume.sahipIstemci(); await s.connect();
  try {
    const iz = (await s.query<{ yonetici_id: string; kim: string }>("SELECT yonetici_id::text, kim FROM yonetim_izi WHERE ne = 'firma.acildi' AND hedef_firma = $1", [r.id])).rows;
    assert.deepEqual(iz, [{ yonetici_id: Y1, kim: "y1@probata.example" }]);
    assert.equal((await s.query("SELECT 1 FROM denetim_izi WHERE firma_id = $1 AND ne = 'firma.acildi'", [r.id])).rowCount, 1);
    assert.equal((await s.query("SELECT 1 FROM personel WHERE firma_id = $1 AND eposta = 'yonetici@ornek.example'", [r.id])).rowCount, 1);
  } finally { await s.end(); }
});

test("dondur: firma bulunmaz, oturumları silinir; etkinleştir geri açar; geçici parola dondurulmuşta yok, etkinde eski parola geçmez", async () => {
  const y = <T,>(is: Parameters<typeof yonetimIcinde<T>>[1]) => yonetimIcinde(havuz, is, { yoneticiId: Y1 });
  const r = await y((db) => firmaAc(db, { unvan: "Dondur Deneme A.Ş.", alt: "dondur", kod: "DD", yon: "Deneme Kişi", eposta: "kisi@dondur.example" }, [], "probata.example"));
  assert.equal(r.durum, "tamam");
  if (r.durum !== "tamam") return;
  const gir = await girisYap(havuz, r.id, { eposta: "kisi@dondur.example", parola: r.parola, ip: "10.5.0.1" });
  assert.ok(gir.tamam);
  /* firmanın müşteri girişi ve açık müşteri oturumu */
  const sm = kume.sahipIstemci(); await sm.connect();
  try {
    const m = (await sm.query<{ id: string }>("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Müşteri A.Ş.', 'Deneme') RETURNING id::text", [r.id])).rows[0].id;
    const mh = (await sm.query<{ id: string }>(
      "INSERT INTO musteri_hesap (firma_id, musteri_id, ana, eposta, ad, parola_ozeti, durum) VALUES ($1, $2, true, 'm@dondur-musteri.example', 'Deneme', $3, 'etkin') RETURNING id::text",
      [r.id, m, await parolaOzeti("musteri-parola-1")])).rows[0].id;
    await sm.query("INSERT INTO musteri_oturum (ozet, firma_id, musteri_hesap_id, bitis) VALUES ($1, $2, $3, now() + interval '1 day')", ["a".repeat(64), r.id, mh]);
  } finally { await sm.end(); }
  assert.equal((await y((db) => firmaDurumu(db, r.id, "dondu"))).durum, "tamam");
  assert.equal((await kiraciIcinde(havuz, r.id, (db) => db.sorgu("SELECT 1 FROM musteri_oturum"))).rowCount, 0, "müşteri oturumları silindi");
  assert.equal(await firmaKimligi(havuz, "dondur"), null, "dondurulmuş firma alt alan adından bulunmaz");
  assert.equal((await kiraciIcinde(havuz, r.id, (db) => db.sorgu("SELECT 1 FROM oturum"))).rowCount, 0, "oturumlar silindi");
  assert.deepEqual(await y((db) => firmaDurumu(db, r.id, "dondu")), { durum: "red", neden: "Firma zaten dondurulmuş." });
  assert.equal((await y((db) => yoneticiyeGeciciParola(db, r.id))).durum, "red");
  assert.equal(await firmaKimligi(havuz, "deneme-a"), A, "öteki firma etkilenmez");
  assert.equal((await y((db) => firmaDurumu(db, r.id, "etkin"))).durum, "tamam");
  assert.equal(await firmaKimligi(havuz, "dondur"), r.id);
  const p = await y((db) => yoneticiyeGeciciParola(db, r.id));
  assert.equal(p.durum, "tamam");
  if (p.durum !== "tamam") return;
  assert.equal(p.eposta, "kisi@dondur.example");
  assert.equal((await girisYap(havuz, r.id, { eposta: "kisi@dondur.example", parola: r.parola, ip: "10.5.0.2" })).tamam, false, "eski parola geçmez");
  assert.ok((await girisYap(havuz, r.id, { eposta: "kisi@dondur.example", parola: p.parola, ip: "10.5.0.2" })).tamam);
  assert.equal((await y((db) => firmaDurumu(db, "00000000-0000-4000-8000-000000000000", "dondu"))).durum, "yok");
});

test("firma yöneticisi: ilk yöneticinin rolü alınır / ayrılırsa geçici parola ve liste firmanın açık öteki yöneticisine gider", async () => {
  const y = <T,>(is: Parameters<typeof yonetimIcinde<T>>[1]) => yonetimIcinde(havuz, is, { yoneticiId: Y1 });
  const r = await y((db) => firmaAc(db, { unvan: "Yönetici Değişir A.Ş.", alt: "degisir", kod: "DG", yon: "Deneme İlk Yönetici", eposta: "ilk@degisir.example" }, [], "probata.example"));
  assert.equal(r.durum, "tamam");
  if (r.durum !== "tamam") return;
  const s = kume.sahipIstemci(); await s.connect();
  try {
    const p = (await s.query<{ id: string }>("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Yeni Yönetici', '2024-01-01', 'mak-muh') RETURNING id::text", [r.id])).rows[0].id;
    await s.query("INSERT INTO hesap (firma_id, eposta, ad, parola_ozeti, roller, durum, personel_id) VALUES ($1, 'yeni@degisir.example', 'Deneme Yeni Yönetici', $2, '{firma_yoneticisi}', 'etkin', $3)",
      [r.id, await parolaOzeti("yeni-yonetici-1"), p]);
    /* ilk yöneticinin rolü alındı (hâlâ etkin denetçi) → parola rolü taşıyan yöneticiye */
    await s.query("UPDATE hesap SET roller = '{denetci}' WHERE firma_id = $1 AND eposta = 'ilk@degisir.example'", [r.id]);
  } finally { await s.end(); }
  const p1 = await y((db) => yoneticiyeGeciciParola(db, r.id));
  assert.equal(p1.durum === "tamam" && p1.eposta, "yeni@degisir.example", "rolü alınmış ilk yöneticiye gitmez");
  assert.equal((await y((db) => firmalar(db))).find((f) => f.id === r.id)?.yonetici?.eposta, "yeni@degisir.example");
  /* ilk yönetici rolünü geri alır ama ayrılır (pasif) → yine açık yöneticiye */
  const s2 = kume.sahipIstemci(); await s2.connect();
  try {
    await s2.query("UPDATE hesap SET roller = '{firma_yoneticisi}', durum = 'pasif' WHERE firma_id = $1 AND eposta = 'ilk@degisir.example'", [r.id]);
  } finally { await s2.end(); }
  const p2 = await y((db) => yoneticiyeGeciciParola(db, r.id));
  assert.equal(p2.durum === "tamam" && p2.eposta, "yeni@degisir.example", "pasif ilk yöneticiye gitmez");
  /* açık yönetici kalmadıysa anlaşılır ret */
  const s3 = kume.sahipIstemci(); await s3.connect();
  try { await s3.query("UPDATE hesap SET durum = 'pasif' WHERE firma_id = $1", [r.id]); } finally { await s3.end(); }
  assert.deepEqual(await y((db) => yoneticiyeGeciciParola(db, r.id)), { durum: "red", neden: "Firmanın açık bir yönetici hesabı yok." });
});

test("SIZMA: firma işlemi yönetime, yönetim işlemi firmalara dokunamaz; yöneticisiz / kapalı yöneticili işlem reddedilir; yönetim izi değişmez", async () => {
  /* uygulama rolü (firma işlemi): yönetim işlevleri ve tabloları yok */
  for (const sql of ["SELECT * FROM yonetim_firmalar()", "SELECT * FROM yonetici", "SELECT * FROM yonetim_oturum", "SELECT * FROM yonetim_izi",
    "SELECT yonetim_firma_durum('" + B + "', 'dondu')", "SELECT yonetim_gecici_parola('" + B + "', 'scrypt$x')"]) {
    await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu(sql)), /permission denied|izin/i, sql);
  }
  /* yönetim rolü: firmaların tablolarına doğrudan hakkı yok; yönetici ekleyemez; izi değiştiremez */
  for (const sql of ["SELECT * FROM hesap", "SELECT * FROM personel", "SELECT * FROM oturum", "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('sizma', 'Sızma', 'SZ')",
    "UPDATE firma SET durum = 'dondu'", "INSERT INTO yonetici (eposta, ad, parola_ozeti) VALUES ('x@probata.example', 'X', 'scrypt$x')", "DELETE FROM yonetici",
    "UPDATE yonetim_izi SET kim = 'x'", "DELETE FROM yonetim_izi", "UPDATE yonetici SET eposta = 'x@probata.example'"]) {
    await assert.rejects(yonetimIcinde(havuz, (db) => db.sorgu(sql), { yoneticiId: Y1 }), /permission denied|izin/i, sql);
  }
  /* yöneticisiz ya da kapalı yöneticiyle işlevler çalışmaz */
  await assert.rejects(yonetimIcinde(havuz, (db) => db.sorgu("SELECT * FROM yonetim_firmalar()")), /yönetim işlemi değil/);
  await assert.rejects(yonetimIcinde(havuz, (db) => db.sorgu("SELECT yonetim_firma_durum($1, 'dondu')", [B]), { yoneticiId: KAPALI }), /yönetim işlemi değil/);
  assert.equal(await firmaKimligi(havuz, "deneme-b"), B);
  /* yönetim izi tablo sahibi için de değişmez */
  const s = kume.sahipIstemci(); await s.connect();
  try {
    await assert.rejects(s.query("UPDATE yonetim_izi SET kim = 'x'"), /değiştirilemez/);
    await assert.rejects(s.query("DELETE FROM yonetim_izi"), /değiştirilemez/);
  } finally { await s.end(); }
  /* geçersiz kimlik istemciden gelmez: biçim denetimi */
  await assert.rejects(yonetimIcinde(havuz, async () => 1, { yoneticiId: "x' OR 1=1" }), /Geçersiz yönetici kimliği/);
});
