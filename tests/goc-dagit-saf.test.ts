/* NEREDEN GELDİ: FIRMA-VT.md §5.5, §7.3, FV4 (sunum 579, reisim onayı 2026-10-15) — "göç dağıtımı Vercel derleme adımında; varsayılan denetle … son_goc
   = SON_GOC ve goc_sayisi = GOC_SAYISI değilse çıkış kodu 1. Bugünkü elle akışa da yayın kapısı olur." Veritabanısız (saf) parçalar:
   · kip: boş / denetle → denetle; uygula → AÇIK HATA (FV8'e kadar); başka değer hata; kip veritabanı ayarından ÖNCE (ayarsız derlemede "uygula" 0 olmaz);
   · ortamda veritabanı yok: "--zorunlu" ya da VERCEL varsa 1, ikisi de yoksa "atlandı" + 0 (CI / yerel derleme kırılmaz); bilinmeyen bağımsız
     değişken 1; yarım ya da geçersiz ayar her yerde 1, bağlanmadan;
   · ana anahtar YALNIZ verilen ortamdan (sir.ts anaAnahtar'ın process.env varsayılanına düşmez — FV4 incelemesi, 2026-10-15);
   · merkeze ulaşılamıyor (kapalı kapı) → 1; çıktıda parola ve ana anahtar yok;
   · geçici hata (57P01, 57P03, 53300, ECONNRESET, ETIMEDOUT, zaman aşımı, kopma) BİR KEZ yeniden denenir, kalıcı olan denenmez (FV4 incelemesi);
   · bütün denetimin süre sınırı: cevap vermeyen merkezde süre dolunca 1, arkada süren işin satırı yazılmaz (FV4 incelemesi);
   · karşılaştırma: son göç VE sayı (arada atlanmış göç, ileride olan veritabanı uyumsuz);
   · neden metni SIRSIZ: hata iletisi yazılmaz, yalnız sınıf + kod; ulaşılamadı / reddetti ayrımı (SQLSTATE sınıfı); kayıt hataları baglanti.ts'in
     gerçek iletilerinden sınıflanır;
   · betik alt süreçte (node scripts/goc-dagit.ts): ayarsız 0 + "atlandı", Vercel'de ve --zorunlu ile 1, bilinmeyen bağımsız değişken 1;
   · vercel.json: derleme önce kapıdan "--zorunlu" ve "&&" ile; yalnız main; gece işi yerinde; kip dosyada yok; günlük herkese açık değil; betik
     çıkış kodunu sürece verir;
   · modül salt okunur ve doğru kapılardan (merkezOku, kiraciIcinde, READ ONLY), merkezHavuzu() kullanmaz, sorgu süre sınırlı, ortam tek kaynak.
   Gerçek PostgreSQL (merkez + kendi projeli firmalar, iki küme): tests/goc-dagit.test.ts. Olumsuz kanıt: tests/bozan/goc-dagit-saf.bozan.ts. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer, type Socket } from "node:net";
import { join } from "node:path";
import { test } from "node:test";
import { baglantiSifrele, kayittanBaglanti, type FirmaVtKaydi } from "../src/server/db/baglanti.ts";
import {
  anahtarOku, argumanOku, birKezDaha, geciciMi, gocDagit, hataSonucu, karsilastir, kayitNedeni, kipOku, nedenMetni, reddedildiMi, sonucSatiri, vtAyariYok,
  type Ortam,
} from "../src/server/db/goc-dagit.ts";
import { GOC_SAYISI, SON_GOC } from "../src/server/db/son-goc.ts";
import { gocDagitEksikleri, KOK, oku, yayinKapisiEksikleri } from "./yardimci/denetimler.ts";

const kos = async (ortam: Ortam, arguman: readonly string[] = []) => {
  const satirlar: string[] = [];
  const kod = await gocDagit({ ortam, arguman, yaz: (s) => satirlar.push(s) });
  return { kod, cikti: satirlar.join("\n") };
};
/** dinleyeni olmayan yerel kapı (bağlantı reddedilir) */
function kapaliKapi(): Promise<number> {
  return new Promise((coz, reddet) => {
    const s = createServer();
    s.once("error", reddet);
    s.listen(0, "127.0.0.1", () => {
      const a = s.address();
      const kapi = typeof a === "object" && a ? a.port : 0;
      s.close(() => coz(kapi));
    });
  });
}
/** bağlantıyı kabul edip HİÇ cevap vermeyen yerel sunucu (asılı veritabanı); kapat: açık bağlantıları da keser */
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
const PAROLA = `gizli-${randomBytes(12).toString("base64url")}`;
const ANAHTAR = randomBytes(32).toString("base64");
const yerelOrtam = (kapi: number): Ortam => ({
  PROBATA_VT_SUNUCU: "127.0.0.1", PROBATA_VT_KAPI: String(kapi), PROBATA_VT_AD: "probata", PROBATA_VT_KULLANICI: "probata_uygulama",
  PROBATA_VT_PAROLA: PAROLA, PROBATA_SIR_ANAHTARI: ANAHTAR,
});
const hata = (kod: string | undefined, ileti = "ileti") => Object.assign(new Error(ileti), kod === undefined ? {} : { code: kod });

test("kip: boş / denetle → denetle, uygula → uygula (gocDagit'te açık hata), başka değer hata (değer iletide yok)", () => {
  assert.equal(kipOku({}), "denetle");
  assert.equal(kipOku({ PROBATA_GOC_DAGIT: "" }), "denetle");
  assert.equal(kipOku({ PROBATA_GOC_DAGIT: "denetle" }), "denetle");
  assert.equal(kipOku({ PROBATA_GOC_DAGIT: "uygula" }), "uygula");
  for (const k of ["UYGULA", "evet-9f8e", "denetle "]) {
    assert.throws(() => kipOku({ PROBATA_GOC_DAGIT: k }), (h: Error) => /^PROBATA_GOC_DAGIT yalnız/.test(h.message) && !h.message.includes("9f8e") && !h.message.includes("UYGULA"));
  }
});

test("ortamda veritabanı yok: Vercel dışında 'atlandı' + 0 (CI / yerel derleme kırılmaz), Vercel'de 1", async () => {
  assert.equal(vtAyariYok({}), true);
  assert.equal(vtAyariYok({ PROBATA_VT_SUNUCU: "" }), true);
  assert.equal(vtAyariYok({ PROBATA_VT_PAROLA: "x" }), false, "yarım ayar 'yok' sayılmaz");
  const disarida = await kos({});
  assert.equal(disarida.kod, 0);
  assert.match(disarida.cikti, /atlandı: ortamda veritabanı ayarı yok/);
  const vercel = await kos({ VERCEL: "1" });
  assert.equal(vercel.kod, 1, "Vercel'de kapı sessizce açılmaz");
  assert.match(vercel.cikti, /HATA: Vercel derlemesinde veritabanı ayarı yok/);
});

test("--zorunlu (Vercel derleme komutu): ayarsız ortam VERCEL olmasa da 1; bilinmeyen bağımsız değişken 1, değeri iletide yok", async () => {
  assert.deepEqual(argumanOku([]), { zorunlu: false });
  assert.deepEqual(argumanOku(["--zorunlu"]), { zorunlu: true });
  for (const a of [["--zorunlu", "--zorunlu"], ["-z"], ["--ZORUNLU"], ["gizli-9f8e"]]) {
    assert.throws(() => argumanOku(a), (h: Error) => /^Göç dağıtıcı yalnız '--zorunlu'/.test(h.message) && !h.message.includes("9f8e"));
  }
  const z = await kos({}, ["--zorunlu"]);
  assert.equal(z.kod, 1, "zorunlu kapı ayarsız ortamda atlanmaz");
  assert.match(z.cikti, /HATA: Vercel derlemesinde veritabanı ayarı yok/);
  assert.doesNotMatch(z.cikti, /atlandı/);
  const b = await kos({}, ["--bilinmeyen-9f8e"]);
  assert.equal(b.kod, 1);
  assert.match(b.cikti, /HATA: Göç dağıtıcı yalnız '--zorunlu'/);
  assert.doesNotMatch(b.cikti, /9f8e|atlandı/);
});

test("kip veritabanı ayarından ÖNCE: 'uygula' ve geçersiz kip ayarsız da, ayarlıyken de bağlanmadan 1", async () => {
  const kapi = await kapaliKapi();
  for (const ortam of [{ PROBATA_GOC_DAGIT: "uygula" }, { PROBATA_GOC_DAGIT: "uygula", ...yerelOrtam(kapi) }, { PROBATA_GOC_DAGIT: "baska" }]) {
    const r = await kos(ortam);
    assert.equal(r.kod, 1, JSON.stringify(ortam.PROBATA_GOC_DAGIT));
    assert.match(r.cikti, /HATA: /);
    assert.doesNotMatch(r.cikti, /merkez:|atlandı/, "bağlanılmadı, atlanmadı");
  }
  assert.match((await kos({ PROBATA_GOC_DAGIT: "uygula" })).cikti, /'uygula' kipi henüz yok \(FIRMA-VT FV8/);
});

test("yarım ya da geçersiz veritabanı ayarı her yerde 1, bağlanmadan (ileti sabit metin, değer yok)", async () => {
  const r1 = await kos({ PROBATA_VT_SUNUCU: "127.0.0.1" });
  assert.equal(r1.kod, 1);
  assert.match(r1.cikti, /Veritabanı bağlantı ayarı yok/);
  /* uzak sunucu, TLS yok: şifresiz ağ bağlantısı kurulmaz — parola ağa hiç çıkmaz */
  const r2 = await kos({ ...yerelOrtam(5432), PROBATA_VT_SUNUCU: "db.example.invalid" });
  assert.equal(r2.kod, 1);
  assert.match(r2.cikti, /şifresiz bağlanılmaz/);
  for (const r of [r1, r2]) assert.ok(!r.cikti.includes(PAROLA));
});

test("ana anahtar YALNIZ verilen ortamdan: süreçte geçerli anahtar olsa da ortamda yoksa HATA (anaAnahtar'ın process.env varsayılanı devreye girmez)", () => {
  const onceki = process.env.PROBATA_SIR_ANAHTARI;
  process.env.PROBATA_SIR_ANAHTARI = randomBytes(32).toString("base64");
  try {
    for (const e of [{}, { PROBATA_SIR_ANAHTARI: undefined }, { PROBATA_SIR_ANAHTARI: "" }] as Ortam[]) {
      assert.throws(() => anahtarOku(e), /^Error: Sır anahtarı tanımlı değil/);
    }
    assert.equal(anahtarOku({ PROBATA_SIR_ANAHTARI: ANAHTAR }).toString("base64"), ANAHTAR);
  } finally {
    if (onceki === undefined) delete process.env.PROBATA_SIR_ANAHTARI; else process.env.PROBATA_SIR_ANAHTARI = onceki;
  }
});

test("merkeze ulaşılamıyor (kapalı kapı) → 1, sınıflanmış neden; çıktıda parola ve ana anahtar YOK", async () => {
  const r = await kos(yerelOrtam(await kapaliKapi()));
  assert.equal(r.kod, 1);
  assert.match(r.cikti, /kip: denetle \(salt okunur\) · beklenen /);
  assert.match(r.cikti, /merkez: ULAŞILAMADI — bağlantı reddedildi \(ECONNREFUSED\)/);
  assert.match(r.cikti, /DURDU: merkeze ulaşılamadı/);
  assert.ok(!r.cikti.includes(PAROLA), "parola çıktıda");
  assert.ok(!r.cikti.includes(ANAHTAR), "ana anahtar çıktıda");
  for (const satir of r.cikti.split("\n")) assert.match(satir, /^\[göç dağıtıcı\] /);
});

test("geçici hata BİR KEZ yeniden denenir; kalıcı hata (parola, yetki, bağlantı reddi, sertifika) ve ikinci düşüş denenmez", async () => {
  const gecici = [hata("57P01"), hata("57P03"), hata("53300"), hata("ECONNRESET"), hata("ETIMEDOUT"), hata(undefined, "timeout exceeded when trying to connect"),
    hata(undefined, "Query read timeout"), hata(undefined, "Connection terminated unexpectedly")];
  for (const h of gecici) assert.equal(geciciMi(h), true, h.message);
  for (const h of [hata("28P01"), hata("42501"), hata("42883"), hata("57014"), hata("ECONNREFUSED"), hata("ENOTFOUND"), hata("SELF_SIGNED_CERT_IN_CHAIN"),
    hata(undefined, "bağlantı kaydı"), hata("kod değil timeout", "x"), null, "timeout"]) {
    assert.equal(geciciMi(h), false, String(h instanceof Error ? (h as { code?: string }).code ?? h.message : h));
  }
  let n = 0;
  assert.equal(await birKezDaha(async () => { n++; if (n === 1) throw hata("57P01"); return "tamam"; }, 0), "tamam");
  assert.equal(n, 2, "geçici hatadan sonra bir kez daha");
  n = 0;
  await assert.rejects(birKezDaha(async () => { n++; throw hata("28P01"); }, 0), (h: { code?: string }) => h.code === "28P01");
  assert.equal(n, 1, "kalıcı hata denenmez");
  n = 0;
  await assert.rejects(birKezDaha(async () => { n++; throw hata("53300"); }, 0), (h: { code?: string }) => h.code === "53300");
  assert.equal(n, 2, "yalnız BİR kez daha");
});

test("bütün denetimin süre sınırı: cevap vermeyen merkez → süre dolunca 1 ve 'süre doldu'; arkada süren işin satırı sonra yazılmaz", async () => {
  const sunucu = await sessizSunucu();
  const satirlar: string[] = [];
  let kapandi = false;
  try {
    const basla = Date.now();
    const kod = await gocDagit({ ortam: yerelOrtam(sunucu.kapi), yaz: (s) => satirlar.push(s), sureMs: 1000 });
    const gecen = Date.now() - basla;
    assert.equal(kod, 1);
    assert.ok(gecen < 4000, `süre sınırı işlemedi: ${gecen} ms`);
    assert.match(satirlar.at(-1) ?? "", /^\[göç dağıtıcı\] DURDU: süre doldu \(1 sn\) — denetim bitmedi, yayın yapılmaz\.$/);
    const n = satirlar.length;
    /* bağlantı kesilir → arkadaki iş geçici hata görür, 2,5 sn sonra yeniden dener, kapalı kapıda biter — satırı YAZILMAZ */
    await sunucu.kapat();
    kapandi = true;
    await new Promise((coz) => setTimeout(coz, 4500));
    assert.equal(satirlar.length, n, `süre dolduktan sonra yazıldı: ${satirlar.slice(n).join(" | ")}`);
  } finally {
    if (!kapandi) await sunucu.kapat();
  }
});

test("karşılaştırma: son göç VE sayı — arada atlanmış göç, eksik göç, ileride olan veritabanı uyumsuz; satır sırsız ve merkez ayrı adla", () => {
  assert.deepEqual(karsilastir("a", { son_goc: SON_GOC, goc_sayisi: GOC_SAYISI }), { ad: "a", durum: "guncel" });
  assert.deepEqual(karsilastir("a", { son_goc: SON_GOC, goc_sayisi: String(GOC_SAYISI) }), { ad: "a", durum: "guncel" }, "sayı metin gelse de");
  const uyumsuz = (son: string | null, sayi: number) => karsilastir("a", { son_goc: son, goc_sayisi: sayi }).durum;
  assert.equal(uyumsuz(SON_GOC, GOC_SAYISI - 1), "uyumsuz", "arada atlanmış göç (son göç aynı)");
  assert.equal(uyumsuz("0095_vt_kimlik.sql", GOC_SAYISI - 1), "uyumsuz", "son göç eksik");
  assert.equal(uyumsuz("9999_ileride.sql", GOC_SAYISI + 1), "uyumsuz", "veritabanı koddan ileride");
  assert.equal(uyumsuz(null, 0), "uyumsuz", "hiç göç yok");
  const b = { son: SON_GOC, sayi: GOC_SAYISI };
  assert.equal(sonucSatiri(karsilastir("kendi-a", { son_goc: "0095_vt_kimlik.sql", goc_sayisi: 96 }, b), b),
    `firma kendi-a: GÖÇ UYUMSUZ — beklenen ${SON_GOC} / ${GOC_SAYISI}, bulunan 0095_vt_kimlik.sql / 96`);
  assert.equal(sonucSatiri({ ad: "merkez", durum: "guncel" }, b), "firma merkez: güncel", "'merkez' kısa adlı firma merkezle karışmaz");
  assert.equal(sonucSatiri({ ad: "merkez", durum: "guncel" }, b, true), "merkez: güncel");
  assert.equal(sonucSatiri({ ad: "x", durum: "uyumsuz", bulunan: { son: null, sayi: 0 } }, b), `firma x: GÖÇ UYUMSUZ — beklenen ${SON_GOC} / ${GOC_SAYISI}, bulunan yok / 0`);
  assert.equal(sonucSatiri(hataSonucu("merkez", hata("42501")), b, true), "merkez: REDDEDİLDİ — yetki reddi — yanlış veritabanı ya da eksik hak (42501)");
  assert.equal(sonucSatiri(hataSonucu("x", hata("ECONNREFUSED")), b), "firma x: ULAŞILAMADI — bağlantı reddedildi (ECONNREFUSED)");
});

test("ulaşılamadı / reddetti ayrımı: SQLSTATE var ve sınıfı 08 / 53 / 57 değilse reddetti; ağ, zaman aşımı, sertifika ulaşılamadı", () => {
  for (const k of ["28P01", "28000", "42501", "42883", "42P01", "3D000", "XX000"]) assert.equal(reddedildiMi(hata(k)), true, k);
  for (const k of ["57P01", "57P03", "57014", "53300", "08006", "ECONNREFUSED", "ECONNRESET", "EPIPE", "ENOTFOUND", "SELF_SIGNED_CERT_IN_CHAIN"]) {
    assert.equal(reddedildiMi(hata(k)), false, k);
  }
  for (const h of [hata(undefined, "timeout exceeded when trying to connect"), hata("kod değil 42501", "x"), null, "42501"]) assert.equal(reddedildiMi(h), false);
});

test("neden metni SIRSIZ: bilinen kod → açıklama (kod); sertifika / ağ / veritabanı sınıfı; kodsuz hata iletisi hiç yazılmaz", () => {
  const SIR = "GIZLI-parola-9f8e7d";
  const durumlar: [unknown, string][] = [
    [hata("28P01", `password authentication failed for user "probata_uygulama" ${SIR}`), "parola reddedildi (28P01)"],
    [hata("ECONNREFUSED", `connect ECONNREFUSED 10.0.0.1:6543 ${SIR}`), "bağlantı reddedildi (ECONNREFUSED)"],
    [hata("42501", `Bu veritabanı başka bir firmanın ${SIR}`), "yetki reddi — yanlış veritabanı ya da eksik hak (42501)"],
    [hata("SELF_SIGNED_CERT_IN_CHAIN", SIR), "sertifika doğrulanamadı (SELF_SIGNED_CERT_IN_CHAIN)"],
    [hata("ERR_TLS_CERT_ALTNAME_INVALID", SIR), "sertifika doğrulanamadı (ERR_TLS_CERT_ALTNAME_INVALID)"],
    [hata("EPIPE", SIR), "ağ hatası (EPIPE)"],
    [hata("XX000", SIR), "veritabanı hatası (XX000)"],
    [hata("kod değil " + SIR, "timeout exceeded when trying to connect"), "bağlanma / sorgu zaman aşımı"],
    [hata(undefined, "Query read timeout"), "bağlanma / sorgu zaman aşımı"],
    [hata(undefined, "Connection terminated unexpectedly"), "bağlantı koptu"],
    [hata(undefined, `postgres://probata_uygulama:${SIR}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`), "bağlantı kurulamadı"],
    [SIR, "bağlantı kurulamadı"],
    [null, "bağlantı kurulamadı"],
  ];
  for (const [h, beklenen] of durumlar) {
    const n = nedenMetni(h);
    assert.equal(n, beklenen);
    assert.ok(!n.includes(SIR) && !n.includes("10.0.0.1") && !n.includes("pooler"), `sızıntı: ${n}`);
  }
});

test("kayıt nedeni baglanti.ts'in GERÇEK iletilerinden sınıflanır (izin listesi, yerel adres, rol, ref, şifre çözme); ileti yazılmaz", () => {
  const anahtar = randomBytes(32);
  const id = randomUUID();
  const kayit = (d: Partial<FirmaVtKaydi>): FirmaVtKaydi => ({
    firmaId: id, ref: null, sunucu: "127.0.0.1", kapi: 5432, vtAd: "probata", kullanici: "probata_uygulama",
    parolaSifreli: baglantiSifrele("parola-" + randomUUID(), id, null, "uygulama_parolasi", anahtar), depo: null, surum: 1, ...d,
  });
  const neden = (d: Partial<FirmaVtKaydi>, o: { merkezYerel: boolean; anahtar?: Buffer }) => {
    try { kayittanBaglanti(kayit(d), o.anahtar ?? anahtar, { merkezYerel: o.merkezYerel }); } catch (h) { return kayitNedeni(h); }
    return "geçti";
  };
  assert.equal(neden({}, { merkezYerel: true }), "geçti");
  assert.equal(neden({ sunucu: "db.example.invalid", ref: "abcdefghij0123456789", kullanici: "probata_uygulama.abcdefghij0123456789" }, { merkezYerel: false }),
    "bağlantı kaydı: sunucu izin listesinde değil");
  assert.equal(neden({}, { merkezYerel: false }), "bağlantı kaydı: yerel adres (merkez yayında)");
  assert.equal(neden({ kullanici: "postgres" }, { merkezYerel: true }), "bağlantı kaydı: kullanıcı uygulama rolü değil");
  assert.equal(neden({ sunucu: "aws-0-eu-central-1.pooler.supabase.com" }, { merkezYerel: false }), "bağlantı kaydı: proje kimliği (ref) eksik ya da geçersiz");
  assert.equal(neden({}, { merkezYerel: true, anahtar: randomBytes(32) }), "bağlantı kaydı: uygulama parolası çözülemedi (ana anahtar ya da ek veri tutmuyor)");
  assert.equal(neden({ parolaSifreli: "v1.a.b.c" }, { merkezYerel: true }), "bağlantı kaydı: uygulama parolası çözülemedi (ana anahtar ya da ek veri tutmuyor)");
  assert.equal(kayitNedeni(new Error("parola=GIZLI")), "bağlantı kaydı kullanılamadı");
});

test("betik alt süreçte: ayarsız ortamda 'atlandı' + 0; Vercel'de ve --zorunlu ile 1; bilinmeyen bağımsız değişken 1", () => {
  /* ortamın kopyası, PROBATA_* ve VERCEL* olmadan (Next'in tip genişletmesi NODE_ENV'i zorunlu sayar — kopya ProcessEnv'den başlar) */
  const temiz: NodeJS.ProcessEnv = { ...process.env };
  for (const ad of Object.keys(temiz)) if (/^(PROBATA_|VERCEL)/i.test(ad)) delete temiz[ad];
  const kos2 = (ek: Record<string, string>, arg: string[] = []) => spawnSync(process.execPath, [join(KOK, "scripts", "goc-dagit.ts"), ...arg],
    { cwd: KOK, env: { ...temiz, ...ek }, encoding: "utf8", timeout: 60_000 });
  const a = kos2({});
  assert.equal(a.status, 0, a.stderr);
  assert.match(a.stdout, /\[göç dağıtıcı\] atlandı: ortamda veritabanı ayarı yok/);
  const v = kos2({ VERCEL: "1" });
  assert.equal(v.status, 1, v.stderr);
  assert.match(v.stdout, /\[göç dağıtıcı\] HATA: Vercel derlemesinde veritabanı ayarı yok/);
  const z = kos2({}, ["--zorunlu"]);
  assert.equal(z.status, 1, z.stderr);
  assert.match(z.stdout, /\[göç dağıtıcı\] HATA: Vercel derlemesinde veritabanı ayarı yok/);
  const b = kos2({}, ["--baska"]);
  assert.equal(b.status, 1, b.stderr);
  const u = kos2({ PROBATA_GOC_DAGIT: "uygula" });
  assert.equal(u.status, 1, u.stderr);
});

test("vercel.json: derleme önce göç kapısından '--zorunlu' ve '&&' ile; yalnız main; gece işi yerinde; kip dosyada yok; günlük açık değil; betik çıkış kodunu sürece verir", () => {
  assert.deepEqual(yayinKapisiEksikleri({ vercel: oku("vercel.json"), betik: oku("scripts/goc-dagit.ts") }), []);
});

test("göç dağıtıcı salt okunur ve doğru kapılardan: merkezOku, kiraciIcinde (vt_firma_dogrula), READ ONLY; merkezHavuzu() yok; sorgu süre sınırlı; ortam tek kaynak", () => {
  assert.deepEqual(gocDagitEksikleri(oku("src/server/db/goc-dagit.ts")), []);
});
