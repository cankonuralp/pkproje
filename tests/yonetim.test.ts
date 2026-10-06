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
import { randomBytes } from "node:crypto";
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

test("kilit: 5 hatalı deneme (parola ya da kod) → 15 dk; kilitliyken doğru parola da geçmez; IP kilidi", async () => {
  for (let i = 0; i < 4; i++) assert.equal((await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: `yanlis-${i}-parola`, ip: `10.2.0.${i}`, simdi: T0 })).tamam, false);
  /* beşinci hata kod adımında: kilit ortak sayaçta */
  const g = await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: PAROLA, ip: "10.2.1.1", simdi: T0 });
  assert.ok(g.tamam);
  if (!g.tamam) return;
  const yanlis = kod(T0) === "123456" ? "654321" : "123456";
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g.belirtec, kod: yanlis, ip: "10.2.1.1", simdi: T0 }), { tamam: false, neden: "hatali" }, "sayaç başarılı parola adımında sıfırlandı");
  for (let i = 0; i < 3; i++) await kodDogrula(havuz, { belirtec: g.belirtec, kod: yanlis, ip: "10.2.1.1", simdi: T0 });
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g.belirtec, kod: yanlis, ip: "10.2.1.1", simdi: T0 }), { tamam: false, neden: "kilitli" });
  assert.deepEqual(await kodDogrula(havuz, { belirtec: g.belirtec, kod: kod(T0), ip: "10.2.1.1", simdi: T0 }), { tamam: false, neden: "oturum" }, "kilitlenince bekleyen oturum düşer");
  assert.deepEqual(await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: PAROLA, ip: "10.2.2.2", simdi: sn(60) }), { tamam: false, neden: "kilitli" });
  const acik = await yoneticiGiris(havuz, { eposta: "y3@probata.example", parola: PAROLA, ip: "10.2.2.2", simdi: sn(16 * 60) });
  assert.ok(acik.tamam, "15 dk sonra açılır");
  if (!acik.tamam) return;
  const k = await kodDogrula(havuz, { belirtec: acik.belirtec, kod: kod(sn(16 * 60)), ip: "10.2.2.2", simdi: sn(16 * 60) });
  assert.ok(k.tamam);
  if (k.tamam) assert.equal((await yonetimOturumOku(havuz, k.belirtec, sn(16 * 60)))?.id, Y3);
  /* aynı IP'den bilinmeyen hesaplarla 5 hata → IP kilitlenir (doğru hesap da o IP'den giremez) */
  for (let i = 0; i < 5; i++) await yoneticiGiris(havuz, { eposta: `yok${i}@probata.example`, parola: "x-parola-12", ip: "10.9.9.9", simdi: T0 });
  assert.deepEqual(await yoneticiGiris(havuz, { eposta: "y1@probata.example", parola: PAROLA, ip: "10.9.9.9", simdi: sn(10) }), { tamam: false, neden: "kilitli" });
});

test("ilk kurulum: kod adımına geçilmez; anahtar bekleyen oturumda bir kez üretilir; kod + yeni parola → etkin, eski oturumlar düşer", async () => {
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
  assert.equal((await yoneticiGiris(havuz, { eposta: "y2@probata.example", parola: GECICI, ip: "10.3.0.2", simdi: sn(40) })).tamam, false, "geçici parola artık geçmez");
  const g2 = await yoneticiGiris(havuz, { eposta: "y2@probata.example", parola: "yeni-parola-2026", ip: "10.3.0.2", simdi: sn(40) });
  assert.ok(g2.tamam && g2.sonraki === "kod");
  if (!g2.tamam) return;
  assert.ok((await kodDogrula(havuz, { belirtec: g2.belirtec, kod: kod(sn(70), b1.anahtar), ip: "10.3.0.2", simdi: sn(70) })).tamam, "kurulan anahtar yöneticiye taşındı");
});

test("firma aç: firma + ilk yönetici (geçici parola ile girilir); kayıtlı adres / kod ve ayrılmış ad reddedilir; iki ize yazılır", async () => {
  const y = <T,>(is: Parameters<typeof yonetimIcinde<T>>[1]) => yonetimIcinde(havuz, is, { yoneticiId: Y1 });
  const G = { unvan: "Örnek Muayene Ltd. Şti.", alt: "Ornek", kod: "om", yon: "Deneme Firma Yöneticisi", eposta: "Yonetici@Ornek.Example" };
  const r = await y((db) => firmaAc(db, G));
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
  const ayni = await y((db) => firmaAc(db, { ...G, kod: "OX" }));
  assert.deepEqual(ayni, { durum: "gecersiz", hatalar: { alt: "ornek kullanılıyor." } });
  assert.deepEqual(await y((db) => firmaAc(db, { ...G, alt: "ornek2", kod: "DA" })), { durum: "gecersiz", hatalar: { kod: "DA başka bir firmada." } });
  assert.equal((await y((db) => firmaAc(db, { ...G, alt: "www", kod: "WW" }))).durum, "gecersiz");
  assert.equal((await y((db) => firmaAc(db, { ...G, alt: "panel", kod: "PN" }, ["panel"]))).durum, "gecersiz", "ortamdan ayrılmış ad");
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
  const r = await y((db) => firmaAc(db, { unvan: "Dondur Deneme A.Ş.", alt: "dondur", kod: "DD", yon: "Deneme Kişi", eposta: "kisi@dondur.example" }));
  assert.equal(r.durum, "tamam");
  if (r.durum !== "tamam") return;
  const gir = await girisYap(havuz, r.id, { eposta: "kisi@dondur.example", parola: r.parola, ip: "10.5.0.1" });
  assert.ok(gir.tamam);
  assert.equal((await y((db) => firmaDurumu(db, r.id, "dondu"))).durum, "tamam");
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
