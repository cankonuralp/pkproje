/* NEREDEN GELDİ: FIRMA-VT.md FV2 (sunum 579; reisim 2026-10-15: "supabase ve resend bağlantılarını firma açarken biz buradan panelden yapalım daha
   sonra müşteri uğraşmasın") — her yeni firmanın verisi kendi Supabase projesinde; bağlantısı merkezde ŞİFRELİ durur, uygulama havuz kurarken çözer.
   Bu dosya veritabanısız (saf) kapıları kilitler:
   · şifreleme ortak çekirdekte (src/server/ayar/aes.ts) — firma sırlarının (sir.ts) metni BİREBİR aynı: 6f419e3'teki sir.ts'in ürettiği metin çözülür,
     yeni metin eski gerçeklemeyle (aşağıda başvuru olarak yazıldı) çözülür;
   · bağlantı sırrının ek verisi firma + ref + ad: başka firma, başka proje, başka ad ile çözülmez; kurulum sırrının (proje açılmadan yazılır) eki
     ref'siz — proje açılıp ref kayda girdikten sonra da çözülür (2026-10-15, FV2 incelemesi);
   · Storage adresi kaydın projesine bağlı: adres başka projeyi (ya da yayında yerel adresi) gösterirse gizli anahtar ÇÖZÜLMEZ (2026-10-15, FV2 incelemesi);
   · bağlantı denetimi (src/server/db/baglanti.ts): uzak sunucu yalnız Supabase AB havuzcusu, TLS + kilitli kök zorunlu, yerel adres yalnız merkez de
     yerelse, kullanıcı yalnız uygulama rolü; izin dışı sunucuda parola çözülmez;
   · SCRAM-SHA-256 özeti (src/server/db/scram.ts): RFC 7677'nin örnek oturumu (kullanıcı "user", parola "pencil") — özetten sunucu tarafı RFC'deki
     istemci kanıtını kabul eder ve RFC'deki sunucu imzasını üretir (RFC metniyle karşılaştırıldı, 2026-10-15);
   · merkezden gelen çözüm (firma_coz jsonb) şemadan denetlenir: bozuk kayıt sessizce kullanılmaz.
   Gerçek PostgreSQL: tests/merkez-kaydi.test.ts. Olumsuz kanıt: tests/bozan/firma-baglanti.bozan.ts. */
import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { test } from "node:test";
import { aesCoz, aesSifrele } from "../src/server/ayar/aes.ts";
import { coz, sifrele } from "../src/server/ayar/sir.ts";
import {
  baglantiCoz, baglantiDenetle, baglantiEki, baglantiSifrele, depoBaglantisi, kayittanBaglanti, kurulumCoz, kurulumEki, kurulumSifrele, merkezYerelMi, SUPABASE_HAVUZCU,
  type FirmaVtKaydi,
} from "../src/server/db/baglanti.ts";
import { SUPABASE_KOK_2021 } from "../src/server/db/kok-sertifika.ts";
import { cozumOku } from "../src/server/db/merkez.ts";
import { scramAyristir, scramOzeti, scramOzetiMi } from "../src/server/db/scram.ts";

/* uydurma anahtar ve kimlikler (CLAUDE.md §7) */
const ANAHTAR = createHash("sha256").update("probata deneme anahtari (uydurma)", "utf8").digest();
const F1 = "00000000-0000-4000-8000-00000000000a";
const F2 = "00000000-0000-4000-8000-00000000000b";
const REF1 = "abcdefghijklmnopqrst";
const REF2 = "tsrqponmlkjihgfedcba";
const HAVUZCU = "aws-0-eu-central-1.pooler.supabase.com";

/** 6f419e3'teki sir.ts'in şifrelemesi (FV2'den ÖNCEKİ gerçekleme, başvuru): aynı biçim, aynı ek veri */
const eskiEk = (firmaId: string, ad: string) => Buffer.from(`probata:sir:v1:${firmaId}:${ad}`, "utf8");
function eskiSifrele(duz: string, firmaId: string, ad: string, anahtar: Buffer): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", anahtar, iv);
  c.setAAD(eskiEk(firmaId, ad));
  const govde = Buffer.concat([c.update(duz, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${govde.toString("base64url")}`;
}
function eskiCoz(sifreli: string, firmaId: string, ad: string, anahtar: Buffer): string {
  const [, iv, etiket, govde] = sifreli.split(".");
  const d = createDecipheriv("aes-256-gcm", anahtar, Buffer.from(iv!, "base64url"));
  d.setAAD(eskiEk(firmaId, ad));
  d.setAuthTag(Buffer.from(etiket!, "base64url"));
  return Buffer.concat([d.update(Buffer.from(govde!, "base64url")), d.final()]).toString("utf8");
}

test("sir.ts çıktısı değişmedi: 6f419e3'te üretilmiş metinler çözülür; yeni metin aynı biçimde ve eski gerçeklemeyle çözülür (iki yönde)", () => {
  /* 2026-10-15'te, FV2'den önceki sir.ts ile (commit 6f419e3) yukarıdaki uydurma anahtarla üretildi */
  assert.equal(coz("v1.U44mTR0_jIWOLztS.gboUrsKTzDJaKe-37Y1PQA.oTzNcUPmIu4pEu3NYiU4TOYLxESaISRNnO2M", F1, "yapay_zeka_anahtari", ANAHTAR),
    "deneme-uydurma-anahtar-1234");
  /* yönetici doğrulama anahtarı da aynı yoldan (src/server/yonetim/giris.ts: sifrele(…, "yonetim", "totp:<id>")) */
  assert.equal(coz("v1.dl2CilmSMNxa2fVB.5VHiOzLbp1CqyBahn80U4Q.SZBs8dAolrziD-U", "yonetim", "totp:00000000-0000-4000-8000-0000000000aa", ANAHTAR), "totp-deneme");
  const yeni = sifrele("deger-ğüşıöç", F1, "eposta_anahtari", ANAHTAR);
  assert.match(yeni, /^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$/, "biçim: v1.<iv 12 bayt>.<etiket 16 bayt>.<gövde>");
  assert.equal(eskiCoz(yeni, F1, "eposta_anahtari", ANAHTAR), "deger-ğüşıöç", "yeni metin eski gerçeklemeyle çözülür");
  assert.equal(coz(eskiSifrele("eski-kayit", F1, "bulut_erisimi", ANAHTAR), F1, "bulut_erisimi", ANAHTAR), "eski-kayit", "eski metin yeniyle çözülür");
  /* ortak çekirdek sir.ts'in ek verisiyle aynı metni verir */
  assert.equal(coz(aesSifrele("cekirdek", `probata:sir:v1:${F1}:imza_saglayici`, ANAHTAR), F1, "imza_saglayici", ANAHTAR), "cekirdek");
  assert.throws(() => coz(yeni, F2, "eposta_anahtari", ANAHTAR), "başka firma çözemez");
  assert.throws(() => coz(yeni, F1, "bulut_erisimi", ANAHTAR), "başka ad çözemez");
});

test("AES çekirdeği: anahtar 32 bayt; yanlış anahtar, kurcalanmış gövde, kısaltılmış etiket, fazla parça, başka sürüm reddedilir", () => {
  const s = aesSifrele("gizli", "ek", ANAHTAR);
  assert.equal(aesCoz(s, "ek", ANAHTAR), "gizli");
  assert.notEqual(aesSifrele("gizli", "ek", ANAHTAR), s, "her şifreleme farklı (iv rasgele)");
  assert.throws(() => aesSifrele("x", "ek", randomBytes(16)), /32 bayt/);
  assert.throws(() => aesCoz(s, "ek", randomBytes(32)));
  assert.throws(() => aesCoz(s, "baska-ek", ANAHTAR));
  const [v, iv, etiket, govde] = s.split(".");
  assert.throws(() => aesCoz([v, iv, etiket, Buffer.from(Buffer.from(govde!, "base64url").map((x) => x ^ 1)).toString("base64url")].join("."), "ek", ANAHTAR));
  assert.throws(() => aesCoz([v, iv, Buffer.from(etiket!, "base64url").subarray(0, 8).toString("base64url"), govde].join("."), "ek", ANAHTAR), "kısa etiket");
  assert.throws(() => aesCoz(`${s}.fazla`, "ek", ANAHTAR), /Bozuk/);
  assert.throws(() => aesCoz(s.replace(/^v1/, "v2"), "ek", ANAHTAR), /Bozuk/);
});

test("bağlantı sırrının ek verisi firma + ref + ad: başka firma, başka ref, başka ad (ve sir.ts'in eki) ile çözülmez; ek biçimi denetlenir", () => {
  const s = baglantiSifrele("uygulama-parolasi-1", F1, REF1, "uygulama_parolasi", ANAHTAR);
  assert.equal(baglantiCoz(s, F1, REF1, "uygulama_parolasi", ANAHTAR), "uygulama-parolasi-1");
  assert.equal(baglantiEki(F1, REF1, "uygulama_parolasi"), `probata:baglanti:v1:${F1}:${REF1}:uygulama_parolasi`);
  assert.throws(() => baglantiCoz(s, F2, REF1, "uygulama_parolasi", ANAHTAR), "satır başka firmaya kopyalandı");
  assert.throws(() => baglantiCoz(s, F1, REF2, "uygulama_parolasi", ANAHTAR), "ref değişti (başka proje)");
  assert.throws(() => baglantiCoz(s, F1, null, "uygulama_parolasi", ANAHTAR), "ref düştü");
  assert.throws(() => baglantiCoz(s, F1, REF1, "depo_gizli", ANAHTAR), "başka ad");
  assert.throws(() => coz(s, F1, "uygulama_parolasi", ANAHTAR), "firma sırrı olarak çözülmez");
  /* yerel (ref yok) da firmaya bağlı */
  const y = baglantiSifrele("yerel-parola", F1, null, "uygulama_parolasi", ANAHTAR);
  assert.equal(baglantiCoz(y, F1, null, "uygulama_parolasi", ANAHTAR), "yerel-parola");
  assert.throws(() => baglantiCoz(y, F2, null, "uygulama_parolasi", ANAHTAR));
  /* ":" taşıyan ref / bozuk kimlik / bilinmeyen ad ek veriyi çakıştıramaz */
  assert.throws(() => baglantiEki(F1, `${REF1}:x`, "uygulama_parolasi"), /ref/);
  assert.throws(() => baglantiEki("x", REF1, "uygulama_parolasi"), /firma kimliği/);
  assert.throws(() => baglantiEki(F1, REF1, "baska" as never), /Bilinmeyen/);
});

test("kurulum sırrının eki ref'siz (proje açılmadan yazılır): ref kayda girdikten sonra da çözülür; başka firma / ad çözemez; bağlantı sırrıyla karışmaz", () => {
  /* 2026-10-15 (FV2 incelemesi): sahip parolası proje açma isteğinden ÖNCE yazılır (FIRMA-VT §5.4), ref o an yok — ek veri ref taşısaydı, ref kayda
     girdikten sonra hangi ekle çözüleceği belirsizdi */
  assert.equal(kurulumEki(F1, "kurulum_sahip"), `probata:baglanti:v1:${F1}::kurulum_sahip`);
  const s = kurulumSifrele("sahip-parolasi-uydurma", F1, "kurulum_sahip", ANAHTAR);
  assert.equal(kurulumCoz(s, F1, "kurulum_sahip", ANAHTAR), "sahip-parolasi-uydurma");
  assert.throws(() => kurulumCoz(s, F2, "kurulum_sahip", ANAHTAR), "başka firma");
  assert.throws(() => kurulumCoz(s, F1, "kurulum_yz", ANAHTAR), "başka ad");
  /* kurulum sırrı ref'li bağlantı eki alamaz; bağlantı sırrı kurulum eki alamaz */
  assert.throws(() => baglantiEki(F1, REF1, "kurulum_sahip" as never), /Bilinmeyen bağlantı sırrı/);
  assert.throws(() => baglantiSifrele("x", F1, null, "kurulum_yz" as never, ANAHTAR), /Bilinmeyen bağlantı sırrı/);
  assert.throws(() => kurulumEki(F1, "uygulama_parolasi" as never), /Bilinmeyen kurulum sırrı/);
  assert.throws(() => kurulumEki("x", "kurulum_yz"), /firma kimliği/);
  /* uygulama parolası (ref'li) kurulum sırrı olarak çözülmez */
  assert.throws(() => kurulumCoz(baglantiSifrele("p", F1, REF1, "uygulama_parolasi", ANAHTAR), F1, "kurulum_sahip", ANAHTAR));
});

test("Storage adresi kaydın KENDİ projesinin: başka projeyi ya da yayında yerel adresi gösteren kayıtta gizli anahtar çözülmez", () => {
  /* 2026-10-15 (FV2 incelemesi): adres ek veriye bağlı değildi — kaydın yalnız adresi değiştirilirse gerçek anahtar yabancı projeye giderdi */
  const kayit: FirmaVtKaydi = {
    firmaId: F1, ref: REF1, sunucu: HAVUZCU, kapi: 6543, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`, parolaSifreli: "v1.a.b.c",
    depo: { url: `https://${REF1}.supabase.co`, gizliSifreli: baglantiSifrele("depo-gizli-uydurma", F1, REF1, "depo_gizli", ANAHTAR), kova: "probata" }, surum: 1,
  };
  assert.deepEqual(depoBaglantisi(kayit, ANAHTAR, { merkezYerel: false }), { url: `https://${REF1}.supabase.co`, gizli: "depo-gizli-uydurma", kova: "probata" });
  assert.equal(depoBaglantisi({ ...kayit, depo: null }, ANAHTAR, { merkezYerel: false }), null, "depo kurulmadı");
  const depo = kayit.depo!;
  for (const url of [`https://${REF2}.supabase.co`, "https://saldirgan.example", `https://${REF1}.supabase.co.saldirgan.example`, `http://${REF1}.supabase.co`,
    `https://${REF1}.supabase.co/`, "http://127.0.0.1:54321"]) {
    assert.throws(() => depoBaglantisi({ ...kayit, depo: { ...depo, url } }, ANAHTAR, { merkezYerel: false }), /kendi projesinin değil/, url);
    assert.throws(() => depoBaglantisi({ ...kayit, depo: { ...depo, url } }, ANAHTAR, { merkezYerel: true }), /kendi projesinin değil/, url);
  }
  /* adres denetimi çözmeden ÖNCE: bozuk şifreli metin hiç denenmez (hata adresin) */
  assert.throws(() => depoBaglantisi({ ...kayit, depo: { ...depo, url: `https://${REF2}.supabase.co`, gizliSifreli: "v1.a.b.c" } }, ANAHTAR, { merkezYerel: false }),
    /kendi projesinin değil/);
  assert.throws(() => depoBaglantisi({ ...kayit, depo: { ...depo, kova: "A" } }, ANAHTAR, { merkezYerel: false }), /kovası/);
  /* gizli anahtar firma + ref'e bağlı: başka projenin kaydında çözülmez */
  assert.throws(() => depoBaglantisi({ ...kayit, ref: REF2, kullanici: `probata_uygulama.${REF2}`, depo: { ...depo, url: `https://${REF2}.supabase.co` } }, ANAHTAR,
    { merkezYerel: false }));
  /* yerel (ref yok): yalnız yerel adres, yalnız merkez de yerelse */
  const yerel: FirmaVtKaydi = { ...kayit, ref: null, sunucu: "127.0.0.1", kullanici: "probata_uygulama",
    depo: { url: "http://127.0.0.1:54321", gizliSifreli: baglantiSifrele("yerel-gizli", F1, null, "depo_gizli", ANAHTAR), kova: "probata-dosya" } };
  assert.deepEqual(depoBaglantisi(yerel, ANAHTAR, { merkezYerel: true }), { url: "http://127.0.0.1:54321", gizli: "yerel-gizli", kova: "probata-dosya" });
  assert.throws(() => depoBaglantisi(yerel, ANAHTAR, { merkezYerel: false }), /yerel adreste olamaz/);
  assert.throws(() => depoBaglantisi({ ...yerel, depo: { ...yerel.depo!, url: `https://${REF1}.supabase.co` } }, ANAHTAR, { merkezYerel: true }), /yalnız yerel adreste/);
});

test("izin listesi: yalnız Supabase AB (Frankfurt) havuzcusu; benzeyen yabancı adlar reddedilir", () => {
  for (const s of ["aws-0-eu-central-1.pooler.supabase.com", "aws-1-eu-central-1.pooler.supabase.com", "aws-12-eu-central-1.pooler.supabase.com"]) {
    assert.ok(SUPABASE_HAVUZCU.test(s), s);
    assert.equal(baglantiDenetle({ sunucu: s, kapi: 6543, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`, parola: "p" }, { merkezYerel: false }).host, s);
  }
  for (const s of ["aws-0-us-east-1.pooler.supabase.com", "aws-0-eu-central-2.pooler.supabase.com", "db.abcdefghijklmnopqrst.supabase.co",
    "aws-0-eu-central-1.pooler.supabase.com.saldirgan.example", "xaws-0-eu-central-1.pooler.supabase.com", "aws-123-eu-central-1.pooler.supabase.com",
    "AWS-0-EU-CENTRAL-1.POOLER.SUPABASE.COM", "10.0.0.5", "db.saldirgan.example", ""]) {
    assert.throws(() => baglantiDenetle({ sunucu: s, kapi: 6543, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`, parola: "p" }, { merkezYerel: false }),
      /izin listesinde değil/, s);
  }
});

test("TLS zorunlu: uzak sunucuda kilitli Supabase kökü, kapatılamaz; yerel adres yalnız merkez de yerelse (TLS'siz); kapı / ad / kullanıcı / havuz denetimi", () => {
  const temel = { sunucu: HAVUZCU, kapi: 6543, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`, parola: "p" };
  const uzak = baglantiDenetle(temel, { merkezYerel: false });
  assert.equal(uzak.kokSertifika, SUPABASE_KOK_2021);
  assert.deepEqual({ host: uzak.host, port: uzak.port, database: uzak.database, user: uzak.user, password: uzak.password },
    { host: HAVUZCU, port: 6543, database: "postgres", user: `probata_uygulama.${REF1}`, password: "p" });
  assert.equal(baglantiDenetle(temel, { merkezYerel: true }).kokSertifika, SUPABASE_KOK_2021, "merkez yerelken de uzak firma TLS'li");
  assert.throws(() => baglantiDenetle({ ...temel, tls: false }, { merkezYerel: false }), /şifresiz/);
  /* yerel */
  const yerel = { ...temel, sunucu: "127.0.0.1", kapi: 54320, kullanici: "probata_uygulama" };
  assert.throws(() => baglantiDenetle(yerel, { merkezYerel: false }), /yerel adreste olamaz/);
  assert.throws(() => baglantiDenetle({ ...yerel, sunucu: "localhost" }, { merkezYerel: false }), /yerel adreste olamaz/);
  assert.equal(baglantiDenetle(yerel, { merkezYerel: true }).kokSertifika, undefined);
  assert.equal(merkezYerelMi({ PROBATA_VT_SUNUCU: "127.0.0.1" }), true);
  assert.equal(merkezYerelMi({ PROBATA_VT_SUNUCU: HAVUZCU }), false);
  assert.equal(merkezYerelMi({}), false, "merkez bilinmiyorsa yerel sayılmaz (kapalı yönde)");
  /* öteki alanlar */
  assert.throws(() => baglantiDenetle({ ...temel, kapi: 0 }, { merkezYerel: false }), /kapısı/);
  assert.throws(() => baglantiDenetle({ ...temel, kapi: 70000 }, { merkezYerel: false }), /kapısı/);
  assert.throws(() => baglantiDenetle({ ...temel, vtAd: "postgres; DROP" }, { merkezYerel: false }), /adı/);
  for (const k of ["postgres", `postgres.${REF1}`, "supabase_admin", "probata_yonetim", "probata_uygulama.kisa", `probata_uygulamax.${REF1}`]) {
    assert.throws(() => baglantiDenetle({ ...temel, kullanici: k }, { merkezYerel: false }), /yalnız uygulama rolüyle/, k);
  }
  assert.throws(() => baglantiDenetle({ ...temel, parola: "" }, { merkezYerel: false }), /parolası yok/);
  assert.equal(baglantiDenetle({ ...temel, enCok: 3 }, { merkezYerel: false }).enCok, 3);
  assert.throws(() => baglantiDenetle({ ...temel, enCok: 6 }, { merkezYerel: false }), /1–5/);
});

test("kayıttan bağlantı: parola çözülür, kullanıcı havuzcunun biçimi; yerelde ref yoksa düz rol; kayıt başka role yöneltilemez; izin dışı sunucuda parola çözülmez", () => {
  const kayit: FirmaVtKaydi = {
    firmaId: F1, ref: REF1, sunucu: HAVUZCU, kapi: 6543, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`,
    parolaSifreli: baglantiSifrele("cozulen-parola", F1, REF1, "uygulama_parolasi", ANAHTAR), depo: null, surum: 2,
  };
  const b = kayittanBaglanti(kayit, ANAHTAR, { merkezYerel: false, enCok: 3 });
  assert.deepEqual(b, { host: HAVUZCU, port: 6543, database: "postgres", user: `probata_uygulama.${REF1}`, password: "cozulen-parola", kokSertifika: SUPABASE_KOK_2021, enCok: 3 });
  /* satır başka firmaya ya da projeye kopyalanırsa çözülmez */
  assert.throws(() => kayittanBaglanti({ ...kayit, firmaId: F2 }, ANAHTAR, { merkezYerel: false }));
  assert.throws(() => kayittanBaglanti({ ...kayit, ref: REF2, kullanici: `probata_uygulama.${REF2}` }, ANAHTAR, { merkezYerel: false }));
  assert.throws(() => kayittanBaglanti(kayit, randomBytes(32), { merkezYerel: false }), "başka ana anahtar");
  /* kullanıcı ref'le tutmalı; ayrıcalıklı rol olamaz */
  for (const k of [`postgres.${REF1}`, "probata_uygulama", `probata_uygulama.${REF2}`]) {
    assert.throws(() => kayittanBaglanti({ ...kayit, kullanici: k }, ANAHTAR, { merkezYerel: false }), /yalnız uygulama rolüyle/, k);
  }
  /* uzak kayıtta ref şart */
  assert.throws(() => kayittanBaglanti({ ...kayit, ref: null, kullanici: "probata_uygulama" }, ANAHTAR, { merkezYerel: false }), /ref/);
  /* izin dışı sunucu: parola çözülmeden düşer (bozuk şifreli metin hiç denenmez — hata izin listesinin) */
  assert.throws(() => kayittanBaglanti({ ...kayit, sunucu: "db.saldirgan.example", parolaSifreli: "v1.a.b.c" }, ANAHTAR, { merkezYerel: false }), /izin listesinde değil/);
  /* yerel (test / geliştirme): ref yok → düz rol, TLS yok; yalnız merkez yerelse */
  const yerel: FirmaVtKaydi = { ...kayit, ref: null, sunucu: "127.0.0.1", kapi: 54320, vtAd: "probata_firma", kullanici: "probata_uygulama",
    parolaSifreli: baglantiSifrele("yerel-parola", F1, null, "uygulama_parolasi", ANAHTAR) };
  assert.deepEqual(kayittanBaglanti(yerel, ANAHTAR, { merkezYerel: true }),
    { host: "127.0.0.1", port: 54320, database: "probata_firma", user: "probata_uygulama", password: "yerel-parola" });
  assert.throws(() => kayittanBaglanti(yerel, ANAHTAR, { merkezYerel: false }), /yerel adreste olamaz/);
});

test("SCRAM-SHA-256: RFC 7677 örneği — özetten sunucu RFC'deki istemci kanıtını kabul eder, RFC'deki sunucu imzasını üretir; yanlış parola kabul edilmez", () => {
  /* RFC 7677 §3 (https://www.rfc-editor.org/rfc/rfc7677.txt, 2026-10-15 karşılaştırıldı): kullanıcı "user", parola "pencil" */
  const istemciIlk = "n=user,r=rOprNGfwEbeRWgbNEkqO";
  const sunucuIlk = "r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096";
  const istemciSonKanitsiz = "c=biws,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0";
  const KANIT = "dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=";
  const IMZA = "6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=";
  const yetki = `${istemciIlk},${sunucuIlk},${istemciSonKanitsiz}`;
  const hmac = (k: Buffer, m: string) => createHmac("sha256", k).update(m, "utf8").digest();
  /** PostgreSQL'in yaptığı gibi: yalnız saklanan özetle istemci kanıtını doğrula, sunucu imzasını üret */
  const sunucuDogrular = (ozet: string, kanit: string) => {
    const p = scramAyristir(ozet);
    const imza = hmac(p.storedKey, yetki);
    const istemciAnahtari = Buffer.from(Buffer.from(kanit, "base64").map((x, i) => x ^ imza[i]!));
    return { kabul: createHash("sha256").update(istemciAnahtari).digest().equals(p.storedKey), sunucuImzasi: hmac(p.serverKey, yetki).toString("base64") };
  };
  const ozet = scramOzeti("pencil", Buffer.from("W22ZaJ0SNY7soEsUEjb6gQ==", "base64"), 4096);
  assert.match(ozet, /^SCRAM-SHA-256\$4096:W22ZaJ0SNY7soEsUEjb6gQ==\$[A-Za-z0-9+/]{43}=:[A-Za-z0-9+/]{43}=$/);
  assert.deepEqual(sunucuDogrular(ozet, KANIT), { kabul: true, sunucuImzasi: IMZA });
  const yanlis = scramOzeti("pencil2", Buffer.from("W22ZaJ0SNY7soEsUEjb6gQ==", "base64"), 4096);
  assert.equal(sunucuDogrular(yanlis, KANIT).kabul, false, "başka parolanın özeti RFC kanıtını kabul etmez");
  assert.notEqual(sunucuDogrular(yanlis, KANIT).sunucuImzasi, IMZA);
});

test("SCRAM özeti: tuz her seferinde rasgele (16 bayt); ASCII dışı parola, kısa tuz, az tekrar reddedilir; özet biçimi tırnak taşıyamaz", () => {
  const a = scramOzeti("ayni-parola-1234"), b = scramOzeti("ayni-parola-1234");
  assert.notEqual(a, b);
  assert.equal(scramAyristir(a).tuz.length, 16);
  assert.equal(scramAyristir(a).tekrar, 4096);
  assert.ok(scramOzetiMi(a));
  assert.throws(() => scramOzeti("parola-ğüş"), /ASCII/);
  assert.throws(() => scramOzeti(""), /ASCII/);
  assert.throws(() => scramOzeti("parola", randomBytes(8)), /tuzu/);
  assert.throws(() => scramOzeti("parola", randomBytes(16), 1000), /tekrar/);
  for (const k of [`${a}'`, `${a}'; DROP ROLE x; --`, a.replace("SCRAM-SHA-256", "MD5"), "md5" + "0".repeat(32), "SCRAM-SHA-256$4096:AAAA$AAAA:AAAA", ""]) {
    assert.equal(scramOzetiMi(k), false, k);
  }
  assert.throws(() => scramAyristir("SCRAM-SHA-256$4096:x$y:z"), /Bozuk/);
});

test("merkezden gelen çözüm şemadan denetlenir: ortak, kendi (depo var / yok), yok; bozuk kayıt sessizce kullanılmaz", () => {
  assert.equal(cozumOku(null), null);
  assert.deepEqual(cozumOku({ id: F1, kisa_ad: "ortak-a", vt: "ortak" }), { id: F1, kisaAd: "ortak-a", vt: "ortak" });
  const kendi = { id: F2, kisa_ad: "kendi-b", vt: "kendi", ref: REF1, sunucu: HAVUZCU, kapi: 6543, vt_ad: "postgres", kullanici: `probata_uygulama.${REF1}`,
    parola: "v1.a.b.c", depo_url: `https://${REF1}.supabase.co`, depo_gizli: "v1.d.e.f", kova: "probata", surum: 4 };
  assert.deepEqual(cozumOku(kendi), {
    id: F2, kisaAd: "kendi-b", vt: "kendi",
    kayit: { firmaId: F2, ref: REF1, sunucu: HAVUZCU, kapi: 6543, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`, parolaSifreli: "v1.a.b.c",
      depo: { url: `https://${REF1}.supabase.co`, gizliSifreli: "v1.d.e.f", kova: "probata" }, surum: 4 },
  });
  assert.equal((cozumOku({ ...kendi, depo_url: null, depo_gizli: null, kova: null }) as { kayit: FirmaVtKaydi }).kayit.depo, null);
  assert.equal((cozumOku({ ...kendi, ref: null }) as { kayit: FirmaVtKaydi }).kayit.ref, null);
  for (const [neden, b] of [
    ["id", { ...kendi, id: "x" }], ["vt", { ...kendi, vt: "baska" }], ["parola düz", { ...kendi, parola: "duz-parola" }], ["parola yok", { ...kendi, parola: null }],
    ["yarım depo", { ...kendi, kova: null }], ["depo gizli düz", { ...kendi, depo_gizli: "duz" }], ["kapı metin", { ...kendi, kapi: "6543" }],
    ["sürüm eksi", { ...kendi, surum: -1 }], ["sunucu yok", { ...kendi, sunucu: "" }], ["dizi", []], ["metin", "ortak"],
  ] as const) {
    assert.throws(() => cozumOku(b), /bozuk/, neden);
  }
});
