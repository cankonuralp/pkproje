/* NEREDEN GELDİ: FIRMA-VT.md §5.7, FV5 (sunum 579 onaylı, 2026-10-15; reisim: "supabase ve resend bağlantılarını firma açarken biz buradan panelden
   yapalım") — her firma kendi Supabase projesinde: kendi projeli firmanın dosyası KENDİ Storage'ına gider, ortak firmalarınki bugünkü depoda kalır.
   SAF: veritabanı yok — bellekteki sahte depolar + iki yerel Storage taklidi (tests/yardimci/sahte-depo.ts). Kilitlenenler:
   · yönlendirme anahtardaki firmadan: ortak firma → ortak depo, kendi projeli → kendi deposu; bir firmanın dosyası öteki firmanın deposuna YAZILMAZ,
     oradan OKUNMAZ (iki ayrı Storage, istek düzeyinde);
   · KAPALI DÜŞER: firma çözülmezse, çözüm başka firmanınsa, kendi projelinin deposu kurulmamışsa hata — ortak depoya düşülmez, hiçbir depoya yazılmaz;
     geçersiz anahtar firmaya sorulmadan düşer;
   · öksüz sayımı ve gece taşıması çağıranın işlemindeki firmadan (gecerli_firma()); kendi projelide taşınacak yok (ortak depo çağrılmaz); taşıma
     yalnız ortak depo taşıyorsa var; firma işlemi dışında hata;
   · imzalı adres: depo veriyorsa onunki, vermiyorsa null (dosya ucu içeriği kendisi akıtır);
   · kendi projeli firmanın deposu örnekte tutulur — aynı sürümde yeniden kurulmaz, yeni sürümde kurulur, bayat (eski sürüm) kayıt yeni depoyu
     bozmaz; sınır aşılınca en eski kullanılan düşer;
   · gizli anahtar kayıttan çözülür (firma + ref + "depo_gizli" ek verisi): başka firmanın şifreli anahtarı çözülmez, istek gitmez; yayında yerel
     adresli firma deposu reddedilir.
   Gerçek PostgreSQL + uçtan uca: e2e/firma-vt.spec.ts (kendi veritabanlı firmaya logo yükle / indir). Olumsuz kanıt: tests/bozan/depo-yonlendirme.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type pg from "pg";
import { baglantiSifrele, depoBaglantisi, type FirmaVtKaydi } from "../src/server/db/baglanti.ts";
import type { Sorgulayici } from "../src/server/db/kiraci.ts";
import type { FirmaCozumu } from "../src/server/db/merkez.ts";
import { dosyaAnahtari } from "../src/server/dosya/anahtar.ts";
import { yonlendiriciDepo, type Depo, type DepoYonlendirmeAyari, type TasimaSonucu } from "../src/server/dosya/depo.ts";
import { supabaseDepo } from "../src/server/dosya/supabase.ts";
import { sahteDepoKur, type SahteDepo } from "./yardimci/sahte-depo.ts";

const ORTAK = "00000000-0000-4000-8000-0000000000aa", KENDI = "00000000-0000-4000-8000-0000000000bb";
const DEPOSUZ = "00000000-0000-4000-8000-0000000000cc", YOK = "00000000-0000-4000-8000-0000000000dd";
const ANA = randomBytes(32);
const bayt = (x: string) => new TextEncoder().encode(x);
const metin = (b: Uint8Array) => new TextDecoder().decode(b);
const anahtar = (firmaId: string) => dosyaAnahtari({ firmaId, modul: "deneme", kayitId: randomUUID(), dosyaId: randomUUID() });

/** bellekteki sahte depo: nesneler + çağrı günlüğü */
function bellekDepo(ad: string, ek: { imza?: boolean; tasi?: boolean } = {}) {
  const nesneler = new Map<string, Uint8Array>(), cagrilar: string[] = [];
  const d: Depo = {
    async yaz(k, b) { cagrilar.push(`yaz ${k}`); nesneler.set(k, b); },
    async oku(k) { cagrilar.push(`oku ${k}`); const b = nesneler.get(k); if (!b) throw new Error("Depoda böyle bir nesne yok"); return b; },
    async copSil(k) { cagrilar.push(`sil ${k}`); nesneler.delete(k); },
    async oksuzSay() { cagrilar.push("oksuz"); return ad === "ortak" ? 7 : null; },
    ...(ek.imza ? { async imzaliAdres(k: string) { return `https://${ad}.invalid/imzali/${k}`; } } : {}),
    ...(ek.tasi ? { async tasi(): Promise<TasimaSonucu> { cagrilar.push("tasi"); return { tasinan: 3, bayt: 30, hatali: 0, kalan: false }; } } : {}),
  };
  return { d, nesneler, cagrilar };
}
const kendiKaydi = (firmaId: string, surum = 1, depo: FirmaVtKaydi["depo"] = { url: "http://127.0.0.1:1", gizliSifreli: "v1.a.b.c", kova: "probata" }): FirmaVtKaydi => ({
  firmaId, ref: null, sunucu: "127.0.0.1", kapi: 6543, vtAd: "probata_firma", kullanici: "probata_uygulama", parolaSifreli: "v1.a.b.c", depo, surum,
});
const islemi = (firma: string | null): Sorgulayici => ({
  sorgu: async <S extends pg.QueryResultRow>(sql: string) => {
    assert.match(sql, /gecerli_firma\(\)/);
    return { rows: [{ f: firma }] as unknown as S[], rowCount: 1, command: "SELECT", oid: 0, fields: [] } as pg.QueryResult<S>;
  },
});

function kur(ek: Partial<DepoYonlendirmeAyari> = {}, ortakEk: { imza?: boolean; tasi?: boolean } = { tasi: true }) {
  const ortak = bellekDepo("ortak", ortakEk);
  const kendiDepolari = new Map<string, ReturnType<typeof bellekDepo>>();
  const cozumler = new Map<string, FirmaCozumu | null>([
    [ORTAK, { id: ORTAK, kisaAd: "ortak-a", vt: "ortak" }],
    [KENDI, { id: KENDI, kisaAd: "kendi-b", vt: "kendi", kayit: kendiKaydi(KENDI) }],
    [DEPOSUZ, { id: DEPOSUZ, kisaAd: "kendi-c", vt: "kendi", kayit: kendiKaydi(DEPOSUZ, 1, null) }],
    [YOK, null],
  ]);
  const sayac = { kayit: 0, kurulan: 0 };
  const y = yonlendiriciDepo({
    ortak: ortak.d,
    kayit: async (id) => { sayac.kayit++; return cozumler.get(id) ?? null; },
    firmaDeposu: (k) => {
      if (!k.depo) return null;
      sayac.kurulan++;
      const b = bellekDepo(`kendi-${k.firmaId.slice(-2)}-s${k.surum}`, { imza: true });
      kendiDepolari.set(`${k.firmaId}:${k.surum}`, b);
      return b.d;
    },
    ...ek,
  });
  return { y, ortak, kendiDepolari, cozumler, sayac };
}

test("anahtardaki firma: ortak firma ortak depoya, kendi projeli KENDİ deposuna; biri ötekinin deposuna yazmaz, ondan okumaz; çöp silme aynı yolda", async () => {
  const { y, ortak, kendiDepolari } = kur();
  const kO = anahtar(ORTAK), kK = anahtar(KENDI);
  await y.yaz(kO, bayt("ortak-icerik"));
  await y.yaz(kK, bayt("kendi-icerik"));
  const kendi = kendiDepolari.get(`${KENDI}:1`)!;
  assert.deepEqual([...ortak.nesneler.keys()], [kO], "ortak depoda yalnız ortak firmanın dosyası");
  assert.deepEqual([...kendi.nesneler.keys()], [kK], "kendi deposunda yalnız kendi dosyası");
  assert.equal(metin(await y.oku(kO)), "ortak-icerik");
  assert.equal(metin(await y.oku(kK)), "kendi-icerik");
  assert.ok(!ortak.cagrilar.some((c) => c.includes(KENDI)), "kendi projeli firmanın hiçbir çağrısı ortak depoya gitmedi");
  assert.ok(!kendi.cagrilar.some((c) => c.includes(ORTAK)), "ortak firmanın hiçbir çağrısı kendi deposuna gitmedi");
  await y.copSil(kK);
  assert.equal(kendi.nesneler.size, 0);
  assert.equal(ortak.nesneler.size, 1);
});

test("KAPALI DÜŞER: çözülmeyen firma, başka firmanın çözümü, deposu kurulmamış kendi projeli firma — hata, ortak depoya düşülmez; geçersiz anahtar firmaya sorulmaz", async () => {
  const { y, ortak, cozumler, sayac } = kur();
  await assert.rejects(y.yaz(anahtar(YOK), bayt("x")), /firması çözülemedi/);
  await assert.rejects(y.oku(anahtar(YOK)), /firması çözülemedi/);
  await assert.rejects(y.yaz(anahtar(DEPOSUZ), bayt("x")), /deposu kurulmadı/);
  await assert.rejects(y.oku(anahtar(DEPOSUZ)), /deposu kurulmadı/);
  /* merkezin cevabı başka firmanınsa (bozuk önbellek, yanlış çağrı) */
  const baska = "00000000-0000-4000-8000-0000000000ee";
  cozumler.set(baska, { id: KENDI, kisaAd: "kendi-b", vt: "kendi", kayit: kendiKaydi(KENDI) });
  await assert.rejects(y.yaz(anahtar(baska), bayt("x")), /firması çözülemedi/);
  cozumler.set(baska, { id: baska, kisaAd: "kendi-e", vt: "kendi", kayit: kendiKaydi(KENDI) });
  await assert.rejects(y.yaz(anahtar(baska), bayt("x")), /başka bir firmanın/);
  assert.equal(ortak.cagrilar.length, 0, "hiçbir çağrı ortak depoya düşmedi");
  const once = sayac.kayit;
  for (const k of ["firma/../x", `firma/${ORTAK}/deneme/..`, "", `firma/${ORTAK}`]) await assert.rejects(y.yaz(k, bayt("x")), /Geçersiz depo anahtarı/);
  assert.equal(sayac.kayit, once, "geçersiz anahtar için firma sorulmadı");
});

test("öksüz sayımı ve gece taşıması çağıranın işlemindeki firmadan; kendi projelide taşınacak yok; taşıma yalnız ortak depo taşıyorsa; işlem dışında hata", async () => {
  const { y, ortak } = kur();
  assert.equal(await y.oksuzSay(islemi(ORTAK)), 7);
  assert.equal(await y.oksuzSay(islemi(KENDI)), null);
  assert.ok(y.tasi, "ortak depo taşıyor: yönlendiricide taşıma var");
  assert.deepEqual(await y.tasi(islemi(ORTAK), { adet: 10, bayt: 100 }), { tasinan: 3, bayt: 30, hatali: 0, kalan: false });
  const n = ortak.cagrilar.filter((c) => c === "tasi").length;
  assert.deepEqual(await y.tasi(islemi(KENDI), { adet: 10, bayt: 100 }), { tasinan: 0, bayt: 0, hatali: 0, kalan: false });
  assert.equal(ortak.cagrilar.filter((c) => c === "tasi").length, n, "kendi projelinin taşıması ortak depoya gitmedi");
  await assert.rejects(y.oksuzSay(islemi(null)), /firma işleminde/);
  await assert.rejects(y.tasi(islemi(null), { adet: 1, bayt: 1 }), /firma işleminde/);
  await assert.rejects(y.oksuzSay(islemi(YOK)), /firması çözülemedi/);
  const { y: tasimayan } = kur({}, {});
  assert.equal(tasimayan.tasi, undefined, "ortak depo taşımıyorsa yönlendiricide taşıma yok (gece işi koşmaz)");
});

test("imzalı adres: depo veriyorsa onunki, vermiyorsa null", async () => {
  const { y } = kur({}, {});
  assert.ok(y.imzaliAdres);
  assert.equal(await y.imzaliAdres(anahtar(ORTAK), 300, null), null, "ortak depo imzalı adres vermiyor");
  const k = anahtar(KENDI);
  assert.equal(await y.imzaliAdres(k, 300, null), `https://kendi-bb-s1.invalid/imzali/${k}`);
  const { y: imzali } = kur({}, { imza: true });
  const kO = anahtar(ORTAK);
  assert.equal(await imzali.imzaliAdres!(kO, 300, null), `https://ortak.invalid/imzali/${kO}`, "ortak depo veriyorsa onunki");
});

test("kendi projeli firmanın deposu örnekte tutulur: aynı sürümde yeniden kurulmaz, yeni sürümde kurulur, bayat kayıt yeni depoyu bozmaz; sınırda en eski düşer", async () => {
  const { y, cozumler, sayac, kendiDepolari } = kur({ enCok: 2 });
  await y.yaz(anahtar(KENDI), bayt("1"));
  await y.yaz(anahtar(KENDI), bayt("2"));
  assert.equal(sayac.kurulan, 1, "aynı sürümde depo bir kez kuruldu");
  cozumler.set(KENDI, { id: KENDI, kisaAd: "kendi-b", vt: "kendi", kayit: kendiKaydi(KENDI, 2) });
  const k3 = anahtar(KENDI);
  await y.yaz(k3, bayt("3"));
  assert.equal(sayac.kurulan, 2, "yeni sürümde yeni depo");
  assert.ok(kendiDepolari.get(`${KENDI}:2`)!.nesneler.has(k3));
  cozumler.set(KENDI, { id: KENDI, kisaAd: "kendi-b", vt: "kendi", kayit: kendiKaydi(KENDI, 1) });
  const k4 = anahtar(KENDI);
  await y.yaz(k4, bayt("4"));
  assert.equal(sayac.kurulan, 2, "bayat kayıt eski depoyu geri kurmadı");
  assert.ok(kendiDepolari.get(`${KENDI}:2`)!.nesneler.has(k4), "bayat kayıtla gelen yazma güncel depoya");
  /* sınır 2: üçüncü kendi projeli firma en eski kullanılanı düşürür */
  const F2 = "00000000-0000-4000-8000-0000000000f2", F3 = "00000000-0000-4000-8000-0000000000f3";
  cozumler.set(KENDI, { id: KENDI, kisaAd: "kendi-b", vt: "kendi", kayit: kendiKaydi(KENDI, 2) });
  for (const f of [F2, F3]) cozumler.set(f, { id: f, kisaAd: `kendi-${f.slice(-2)}`, vt: "kendi", kayit: kendiKaydi(f) });
  await y.yaz(anahtar(F2), bayt("f2"));
  await y.yaz(anahtar(F3), bayt("f3"));
  assert.equal(sayac.kurulan, 4);
  await y.yaz(anahtar(KENDI), bayt("5"));
  assert.equal(sayac.kurulan, 5, "sınırda düşen (en eski kullanılan) yeniden kuruldu");
  assert.throws(() => yonlendiriciDepo({ ortak: bellekDepo("o").d, kayit: async () => null, firmaDeposu: () => null, enCok: 0 }), /en az 1/);
});

/* ── gerçek Storage bağdaştırıcısıyla: iki kendi projeli firma, iki ayrı Storage taklidi ───────────────────────────────────────────────────── */
let s1: SahteDepo, s2: SahteDepo;
before(async () => { s1 = await sahteDepoKur("birinci-gizli-anahtar-0123456789"); s2 = await sahteDepoKur("ikinci-gizli-anahtar-0123456789"); });
after(async () => { await s1?.kapat(); await s2?.kapat(); });

test("gerçek Storage bağdaştırıcısı: gizli anahtar kayıttan çözülür; iki firma iki ayrı Storage'a yazar, ötekinin nesnesi istek düzeyinde yok; başka firmanın şifreli anahtarı çözülmez, istek gitmez; yayında yerel adres reddedilir", async () => {
  const B = KENDI, C = "00000000-0000-4000-8000-0000000000c2";
  const kayitB = kendiKaydi(B, 1, { url: s1.url, gizliSifreli: baglantiSifrele(s1.gizli, B, null, "depo_gizli", ANA), kova: "probata" });
  const kayitC = kendiKaydi(C, 1, { url: s2.url, gizliSifreli: baglantiSifrele(s2.gizli, C, null, "depo_gizli", ANA), kova: "probata" });
  const cozumler = new Map<string, FirmaCozumu | null>([[B, { id: B, kisaAd: "kendi-b", vt: "kendi", kayit: kayitB }], [C, { id: C, kisaAd: "kendi-c", vt: "kendi", kayit: kayitC }]]);
  const yerel = { merkezYerel: true };
  const y = yonlendiriciDepo({
    ortak: bellekDepo("ortak").d, kayit: async (id) => cozumler.get(id) ?? null,
    firmaDeposu: (k) => { const b = depoBaglantisi(k, ANA, yerel); return b ? supabaseDepo(b, null) : null; },
  });
  const kB = anahtar(B), kC = anahtar(C);
  await y.yaz(kB, bayt("b-icerik"), undefined, "application/pdf");
  await y.yaz(kC, bayt("c-icerik"), undefined, "application/pdf");
  assert.deepEqual([...s1.nesneler.keys()], [`probata/${kB}`], "birinci Storage'da yalnız B");
  assert.deepEqual([...s2.nesneler.keys()], [`probata/${kC}`], "ikinci Storage'da yalnız C");
  assert.equal(metin(await y.oku(kB)), "b-icerik");
  /* C'nin anahtarı B'nin deposunda aranmaz; B'nin olmayan nesnesi yedeksiz depoda yok */
  await assert.rejects(y.oku(anahtar(B)), /nesne yok/);
  assert.ok(!s1.istekler.some((i) => i.includes(C)) && !s2.istekler.some((i) => i.includes(B)), "hiçbir istek öteki firmanın Storage'ına gitmedi");
  assert.match(String(await y.imzaliAdres!(kC, 300, "rapor.pdf")), new RegExp(`^${s2.url}/storage/v1/object/sign/probata/`));
  /* imzalı adres gizli anahtarsız açılır (tarayıcı gibi) ve o firmanın içeriğini verir */
  const imzali = await fetch(String(await y.imzaliAdres!(kC, 300, null)));
  assert.equal(imzali.status, 200);
  assert.equal(await imzali.text(), "c-icerik");

  /* B'nin şifreli anahtarı C'nin kaydına kopyalanırsa çözülmez (ek veri firmaya bağlı) — istek gitmez */
  const D = "00000000-0000-4000-8000-0000000000d2";
  cozumler.set(D, { id: D, kisaAd: "kendi-d", vt: "kendi", kayit: kendiKaydi(D, 1, { url: s2.url, gizliSifreli: kayitB.depo!.gizliSifreli, kova: "probata" }) });
  const istekSayisi = s1.istekler.length + s2.istekler.length;
  await assert.rejects(y.yaz(anahtar(D), bayt("x")));
  assert.equal(s1.istekler.length + s2.istekler.length, istekSayisi, "çözülemeyen anahtarla Storage'a istek gitmedi");

  /* merkez yayındaysa yerel adresli firma deposu kurulmaz */
  assert.throws(() => depoBaglantisi(kayitB, ANA, { merkezYerel: false }), /yerel adreste olamaz/);
});
