/* NEREDEN GELDİ: FIRMA-VT.md §5.12, FV10 (sunum 579 onaylı, 2026-10-15; K1 — reisim: "supabase ve resend bağlantılarını firma açarken biz buradan panelden
   yapalım daha sonra müşteri uğraşmasın"): kendi projeli firmanın Supabase projesi panelden açılır ve kurulur. Kalem satırı: "her adımda kesip sürdürme;
   POST /v1/projects tek kez; 429; kalıcı hata; günlükte sır yok". GERÇEK PostgreSQL: merkez kümesi + Yönetim API taklidi (tests/yardimci/
   sahte-supabase-yonetim.ts) — taklit her "proje aç"ta AYRI gömülü küme ve içinde BOŞ veritabanı kurar (kurulum göçlerin hepsini API'yle uygular;
   rol adımının parola değişikliği yalnız o kümeyi etkiler) + sahte Storage (açılan gizli anahtarı kabul eder). Kilitlenenler:
   · baştan sona: merkezde firma etkin, bağlantı kaydı tam (sunucu, kapı, veritabanı, uygulama rolü, depo), kurulum "tamam", geçici girdi silindi, iz;
     firma_coz kendi projeyi çözer; firmanın veritabanında kimlik, firma, ilk yönetici (durum "ilk"), göçler güncel, kurulumda girilen yapay zekâ
     anahtarı şifreli; "Yöneticiye geçici parola" (FV9) ile o parolayla GERÇEKTEN giriş; proje açma isteği BİR kez;
   · uygulama parolası (düz) hiçbir API isteğinde yok (rol adımı SCRAM özeti gönderir); kurulumun hata kaydı ve izleri sırsız;
   · kesilip sürdürme: 503 → "hata" (yeniden denenir), sonraki ilerletmede geçer; 403 → "durdu" (kalıcı), ilerletme ilerletmez, "Sürdür" ile devam;
     yanıtı kaybolan proje açılışı (proje açıldı, yanıt 500) — sonraki ilerletme adından bulur, İKİNCİ proje açılmaz; 429 beklenip sürdürülür;
   · aynı anda iki ilerletme: kira — yalnız biri ilerletir, proje bir kez açılır;
   · yayının iki yanına düşen kurulum (göç adımı eski kodla — son göç yok; deneme yeni kodla): deneme adımı çalışan kodun eksik göçünü tamamlar,
     firma eski şemayla açılmaz (FIRMA-VT §6.1).
   Saf parçalar: tests/kurulum-adim.test.ts. Olumsuz kanıt: tests/bozan/firma-kurulum.bozan.ts. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import type pg from "pg";
import { geciciParolaYonet } from "../src/modules/yonetim/server/firma-tarafi.ts";
import { kurulumBaslat, kurulumIlerlet, kurulumSurdur, type KurulumOrtami } from "../src/modules/yonetim/server/kurulum.ts";
import { coz } from "../src/server/ayar/sir.ts";
import { baglantiCoz } from "../src/server/db/baglanti.ts";
import { yonlendiriciKur, type Yonlendirici } from "../src/server/db/firma-havuzu.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { isBasla, isBitir } from "../src/server/db/is.ts";
import { havuzKur, yonetimFirmadaIcinde, yonetimIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { gocDosyalari } from "../src/server/db/goc.ts";
import { firmaCoz } from "../src/server/db/merkez.ts";
import { GOC_SAYISI, SON_GOC } from "../src/server/db/son-goc.ts";
import { supabaseYonetimi } from "../src/server/dis/supabase-yonetim.ts";
import { girisYap } from "../src/server/kimlik/oturum.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { testKumesi } from "./yardimci/kume.ts";
import { sahteDepoKur, type SahteDepo } from "./yardimci/sahte-depo.ts";
import { pgProjesi, sahteYonetimKur, type SahteYonetim } from "./yardimci/sahte-supabase-yonetim.ts";

const ANA = randomBytes(32);
const YE = "yonetici@probata.example";
const YZ = "sk-ant-uydurmaAnahtarDegil0123456789wxyz";
let kume: GomuluKume, havuz: Havuz, sahip: pg.Client, s: SahteYonetim, fd: SahteDepo, y: Yonlendirici, o: KurulumOrtami;

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci(); await sahip.connect();
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  const yid = (await sahip.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti, durum, totp_sir) VALUES ($1, 'Deneme Yönetici', $2, 'etkin', 'v1.uydurma-dogrulama-anahtari') RETURNING id::text",
    [YE, await parolaOzeti("yonetim-parola-2026")])).rows[0]!.id;
  s = await sahteYonetimKur();
  fd = await sahteDepoKur();
  s.anahtarEklendi = (k) => fd.ekGizliler.add(k);
  /* taklitte "proje": ayrı küme + boş veritabanı (göçleri kurulum uygular); taklit arkada kurar, hazır olana dek sağlık COMING_UP */
  s.projeKur = async () => {
    const pk = await testKumesi();
    const c = pk.sahipIstemci("postgres"); await c.connect();
    try { await c.query("CREATE DATABASE proje_vt ENCODING 'UTF8' LOCALE 'C' TEMPLATE template0"); } finally { await c.end(); }
    return { yurutucu: pgProjesi(() => pk.sahipIstemci("proje_vt")),
      havuzcu: [{ db_host: "127.0.0.1", db_port: pk.uygulama.port, db_name: "proje_vt", pool_mode: "transaction" }], kapat: () => pk.durdur() };
  };
  y = yonlendiriciKur({ merkez: () => havuz, anahtar: () => ANA, merkezYerel: true });
  o = {
    merkez: (is) => yonetimIcinde(havuz, is, { yoneticiId: yid }),
    firmada: (kayit, id, is) => yonetimFirmadaIcinde(y.firmaHavuzu(kayit), id, is, { yoneticiEposta: YE }),
    api: supabaseYonetimi({ uc: s.url, anahtar: s.anahtar, yerel: true }, { bekle: async () => {} }), yerel: true, orgut: "probata-deneme",
    anaAnahtar: ANA, merkezYerel: true, depoUc: fd.url, firmaHavuzu: (k) => y.firmaHavuzu(k),
    gocKilidi: { al: () => isBasla(havuz, "goc_dagitim"), birak: async (id, t) => { await isBitir(havuz, id, t ? "tamam" : "hata", { kurulum: 1 }); } },
    butceMs: 120_000,
  };
});
after(async () => { await y?.kapat(); await havuz?.end(); await sahip?.end(); await s?.kapat(); await fd?.kapat(); await kume?.durdur(); });

const girdi = (alt: string, kod: string) => ({ unvan: `Kurulum ${kod} Muayene A.Ş.`, alt, kod, yon: "Kurulum Yönetici", eposta: `yonetici@${alt}.example` });
async function baslat(alt: string, kod: string, yz: string | null = null): Promise<string> {
  const r = await kurulumBaslat(o, girdi(alt, kod), [], "localhost", yz);
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  return r.durum === "tamam" ? r.id : "";
}
const bekle = (ms: number) => new Promise((coz) => setTimeout(coz, ms));
/** koşul tutana dek ilerlet — sayfadaki gibi aralıklı (taklit projenin kümesini arkada kurar: hazırlık birkaç saniye); en çok 180 sn */
async function ilerletKadar(ort: KurulumOrtami, id: string, kosul: (g: Awaited<ReturnType<typeof kurulumIlerlet>>) => boolean) {
  const son = Date.now() + 180_000;
  let g = await kurulumIlerlet(ort, id);
  while (!kosul(g) && Date.now() < son) { await bekle(250); g = await kurulumIlerlet(ort, id); }
  return g;
}
/** "tamam" ya da "durdu" olana dek ilerlet */
const bitir = (id: string) => ilerletKadar(o, id, (g) => g?.durum === "tamam" || g?.durum === "durdu");
const projeAcmalari = (ad: string) => s.istekler.filter((i) => i.yontem === "POST" && i.yol === "/v1/projects" && JSON.parse(i.govde).name === ad).length;

test("baştan sona: proje açılır, göçler, rol, havuzcu, depo, deneme, firma + ilk yönetici, yapay zekâ; geçici parolayla GERÇEK giriş; proje bir kez; sır yok", async () => {
  const id = await baslat("kurulum-a", "KA", YZ);
  const g = await bitir(id);
  assert.equal(g?.durum, "tamam", JSON.stringify(g));
  const ad = `probata-kurulum-a-${id.slice(0, 8)}`;
  assert.equal(projeAcmalari(ad), 1, "proje açma isteği bir kez");
  /* merkez */
  const m = (await sahip.query("SELECT f.durum, v.sunucu, v.kapi, v.vt_ad, v.kullanici, v.parola_sifreli, v.parola_bekleyen_sifreli, v.depo_url, v.kova, k.durum AS k_durum, k.girdi, k.hata FROM firma f JOIN firma_vt v ON v.firma_id = f.id JOIN firma_kurulum k ON k.firma_id = f.id WHERE f.id = $1", [id])).rows[0];
  assert.deepEqual([m.durum, m.sunucu, m.vt_ad, m.kullanici, m.depo_url, m.kova, m.k_durum, m.girdi, m.hata, m.parola_bekleyen_sifreli],
    ["etkin", "127.0.0.1", "proje_vt", "probata_uygulama", fd.url, "probata", "tamam", null, null, null]);
  assert.ok(await sahip.query("SELECT 1 FROM yonetim_izi WHERE hedef_firma = $1 AND ne = 'firma.kuruldu'", [id]).then((r) => r.rowCount === 1));
  const cz = await firmaCoz(havuz, "kurulum-a");
  assert.equal(cz?.vt, "kendi");
  if (cz?.vt !== "kendi") return;
  /* firmanın veritabanı: kimlik, firma, ilk yönetici, göçler, yapay zekâ anahtarı */
  const fh = y.firmaHavuzu(cz.kayit);
  const vt = (await yonetimFirmadaIcinde(fh, id, (db) => db.sorgu<{ s: { yz: { tanimli: boolean; son4: string }; yonetici: { eposta: string; durum: string } } }>(
    "SELECT firma_yonetim_ozet($1) AS s", [id]), { yoneticiEposta: YE })).rows[0]!.s;
  assert.deepEqual([vt.yz.tanimli, vt.yz.son4, vt.yonetici.eposta, vt.yonetici.durum], [true, "wxyz", "yonetici@kurulum-a.example", "ilk"]);
  const goc = (await fh.query<{ son: string; n: number }>("SELECT max(ad) AS son, count(*)::int AS n FROM goc")).rows[0]!;
  assert.deepEqual([goc.son, goc.n], [SON_GOC, GOC_SAYISI], "göçler API'yle uygulandı");
  /* "Yöneticiye geçici parola" → o parolayla firmanın kendi veritabanında giriş */
  const p = await geciciParolaYonet(o, id);
  assert.equal(p.durum, "tamam", JSON.stringify(p));
  if (p.durum !== "tamam") return;
  const giris = await girisYap(fh, id, { eposta: "yonetici@kurulum-a.example", parola: p.parola, ip: "10.8.0.1" });
  assert.equal(giris.tamam, true, "geçici parolayla giriş");
  /* sır: uygulama parolası (düz) hiçbir API isteğinde yok; yapay zekâ anahtarı yalnız şifreli */
  const parola = baglantiCoz(m.parola_sifreli, id, null, "uygulama_parolasi", ANA);
  assert.ok(!s.istekler.some((i) => i.govde.includes(parola)), "uygulama parolası API'ye gitmedi (SCRAM özeti gitti)");
  assert.ok(s.istekler.some((i) => /ALTER ROLE probata_uygulama LOGIN PASSWORD 'SCRAM-SHA-256\$4096:/.test(i.sql)));
  assert.ok(!s.istekler.some((i) => i.govde.includes(YZ)), "yapay zekâ anahtarı API'ye gitmedi");
  const sr = (await fh.query<{ sifreli: string }>("SELECT sifreli FROM firma_sir WHERE ad = 'yapay_zeka_anahtari'")).rows[0]!;
  assert.equal(coz(sr.sifreli, id, "yapay_zeka_anahtari", ANA), YZ);
});

test("kesilip sürdürme: yanıtı kaybolan proje açılışında ikinci proje açılmaz; 429 beklenir; 503 yeniden denenir; 403 durdurur, 'Sürdür' ile biter; kayıt sırsız", async () => {
  const id = await baslat("kurulum-b", "KB");
  const ad = `probata-kurulum-b-${id.slice(0, 8)}`;
  s.hatalar.push({ yontem: "POST", yol: /^\/v1\/projects$/, durum: "kaybol", kez: 1 });
  let g = await kurulumIlerlet(o, id);
  assert.deepEqual([g?.adim, g?.durum, g?.kod], ["proje", "hata", "sunucu"], "yanıt 500: yeniden denenecek");
  s.sinir429 = 1;
  s.hatalar.push({ yontem: "PUT", yol: /\/ssl-enforcement$/, durum: 503, kez: 1 });
  s.hatalar.push({ yontem: "GET", yol: /\/api-keys$/, durum: 403, kez: 1 });
  g = await bitir(id);
  assert.equal(projeAcmalari(ad), 1, "yanıtı kaybolan açılıştan sonra proje adından bulundu — ikinci açılış yok");
  assert.deepEqual([g?.adim, g?.durum, g?.kod], ["depo", "durdu", "yetki"], "403 kalıcı: durdu");
  assert.ok(g?.hata && !/sbp_|sb_secret|taklit hata/.test(g.hata), "kayıttaki metin sırsız, sunucunun iletisi yok");
  assert.equal((await kurulumIlerlet(o, id))?.durum, "durdu", "durmuş kurulum ilerletmeyle ilerlemez");
  g = await kurulumSurdur(o, id);
  if (g?.durum !== "tamam") g = await bitir(id);
  assert.equal(g?.durum, "tamam", JSON.stringify(g));
  const iz = JSON.stringify((await sahip.query("SELECT ne, ayrinti FROM yonetim_izi WHERE hedef_firma = $1", [id])).rows);
  assert.match(iz, /firma\.kurulum_durdu/);
  assert.ok(!/sbp_|sb_secret|SCRAM|v1\./.test(iz), "izde sır ya da şifreli metin yok");
});

test("aynı anda iki ilerletme: kira — proje bir kez açılır, ikisi de tutarlı görünüm döner", async () => {
  const id = await baslat("kurulum-c", "KC");
  const [a, b] = await Promise.all([kurulumIlerlet(o, id), kurulumIlerlet(o, id)]);
  assert.ok(a && b);
  assert.equal(projeAcmalari(`probata-kurulum-c-${id.slice(0, 8)}`), 1);
  const g = await bitir(id);
  assert.equal(g?.durum, "tamam", JSON.stringify(g));
});

test("yayının iki yanına düşen kurulum: göçler eski kodla (son göç yok), deneme yeni kodla — eksik göç denemede tamamlanır, firma güncel şemayla açılır", async () => {
  const id = await baslat("kurulum-d", "KD");
  const eski: KurulumOrtami = { ...o, gocler: gocDosyalari().slice(0, -1),
    firmaHavuzu: () => { throw Object.assign(new Error("ulaşılamadı"), { code: "ECONNREFUSED" }); } };
  let g = await ilerletKadar(eski, id, (x) => x?.adim === "dene" || x?.durum === "durdu");
  assert.deepEqual([g?.adim, g?.durum], ["dene", "hata"], "eski kod denemeye kadar geldi (son göç uygulanmadı)");
  g = await bitir(id);
  assert.equal(g?.durum, "tamam", JSON.stringify(g));
  const cz = await firmaCoz(havuz, "kurulum-d");
  assert.equal(cz?.vt, "kendi");
  if (cz?.vt !== "kendi") return;
  const goc = (await y.firmaHavuzu(cz.kayit).query<{ son: string; n: number }>("SELECT max(ad) AS son, count(*)::int AS n FROM goc")).rows[0]!;
  assert.deepEqual([goc.son, goc.n], [SON_GOC, GOC_SAYISI], "son göç denemede uygulandı");
});
