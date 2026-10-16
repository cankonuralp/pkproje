/* NEREDEN GELDİ: FIRMA-VT.md §5.6, FV6 (sunum 579 onaylı, 2026-10-15) — kendi projeli firmanın gece işleri (çöp temizliği, saklama süresi, e-posta
   yeniden deneme, depo taşıması) KENDİ veritabanında koşmalı; FV3'ten FV6'ya kadar merkezde dolaşılıyor, vt_firma_dogrula'ya takılıyordu (veri
   karışmıyordu ama o firmanın gece işi hiç koşmuyordu — saklama süresi dolan PDF silinmez, bekleyen e-posta gitmezdi). GERÇEK PostgreSQL, iki küme, üç
   veritabanı (tests/yardimci/coklu-vt.ts: merkez + ortak firma O, ayrı kümede kendi-A, merkez kümesinde ikinci veritabanında kendi-B). Kilitlenenler:
   · firma listesi ve iş kaydı MERKEZDE; her firmanın adımı o firmanın KENDİ veritabanında (current_database, gecerli_firma) — yazdığı satır yalnız
     orada, merkezde yok; kendi veritabanında iş kaydı yok;
   · havuzBul verilmezse (eski çağrı) kendi projeliler merkezde dolaşılmaz: adımdan önce reddedilir, "ulasilamayan" sayılır, veri karışmaz;
   · bağlantısı düşen firma (kapalı kapı) ve bakımdaki (göç dışı — çözülmez) firma "ulasilamayan", adımı koşmaz, öteki firmalar sürer, iş "hata";
     adımın kendisi düşerse "hatali_firma";
   · gerçek gece işleri (çöp, saklama, e-posta) üç firmada "tamam".
   Olumsuz kanıt: tests/bozan/gece-firma-vt.bozan.ts. Uçtan uca: e2e/api.spec.ts (kendi veritabanlı firmayla gece ucu 200 / "tamam"). */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { saklamaIsi } from "../src/modules/raporlar/server/saklama.ts";
import { yonlendiriciKur, type Yonlendirici } from "../src/server/db/firma-havuzu.ts";
import type { Sorgulayici } from "../src/server/db/kiraci.ts";
import { firmaCoz, firmaCozId } from "../src/server/db/merkez.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { firmalardaKos, type HavuzBul } from "../src/server/is/firmalar.ts";
import { epostaIsi, geceIsleri } from "../src/server/is/gece.ts";
import { cokluVtKur, type CokluVt, type TestFirmasi } from "./yardimci/coklu-vt.ts";
import { KAPALI_KAPI } from "./yardimci/sahte-pg.ts";

let v: CokluVt;
const yonlendiriciler: Yonlendirici[] = [];
const klasor = mkdtempSync(join(tmpdir(), "gece-firma-vt-"));
before(async () => { v = await cokluVtKur(); });
after(async () => {
  for (const y of yonlendiriciler) await y.kapat();
  await v?.kapat();
  rmSync(klasor, { recursive: true, force: true });
});

/** taze yönlendirici (önbelleksiz başlar — merkezdeki kayıt değişikliği hemen görülür) ve onun havuz bulucusu */
function havuzBulucu(): HavuzBul {
  const y = yonlendiriciKur({
    merkez: () => v.merkez, anahtar: () => v.anahtar, merkezYerel: true,
    coz: { ad: (k) => firmaCoz(v.merkez, k), id: (i) => firmaCozId(v.merkez, i) },
  });
  yonlendiriciler.push(y);
  return (id) => y.havuzKimlikle(id);
}
/** adım: hangi veritabanında hangi firma için koştuğunu yazar ve firmanın veritabanına bir satır ekler */
function adimKur(etiket: string) {
  const gorulen = new Map<string, string>();
  const adim = async (db: Sorgulayici) => {
    const r = (await db.sorgu<{ vt: string; f: string }>("SELECT current_database() AS vt, gecerli_firma()::text AS f")).rows[0];
    gorulen.set(r.f, r.vt);
    await db.sorgu("INSERT INTO musteri (unvan, kisa) VALUES ($1, 'Gece')", [`Gece ${etiket} ${r.f.slice(0, 8)} (uydurma)`]);
    return { sayilar: { n: 1 }, kalan: false };
  };
  return { gorulen, adim };
}
const satirSayisi = async (f: TestFirmasi, firma: string, etiket: string) => Number((await f.sahip.query<{ n: string }>(
  "SELECT count(*) AS n FROM musteri WHERE firma_id = $1 AND unvan LIKE $2", [firma, `Gece ${etiket} %`])).rows[0].n);
const merkezdeSatir = async (firma: string, etiket: string) => Number((await v.merkezSahip.query<{ n: string }>(
  "SELECT count(*) AS n FROM musteri WHERE firma_id = $1 AND unvan LIKE $2", [firma, `Gece ${etiket} %`])).rows[0].n);
const sonKayit = async (ad: string) => (await v.merkezSahip.query<{ durum: string; ozet: Record<string, number> }>(
  "SELECT durum, ozet FROM is_calisma WHERE ad = $1 ORDER BY basladi DESC LIMIT 1", [ad])).rows[0];

test("her firmanın adımı KENDİ veritabanında; yazdığı satır yalnız orada; liste ve iş kaydı merkezde", async () => {
  const { gorulen, adim } = adimKur("bir");
  const o = await firmalardaKos(v.merkez, "gece_firma_vt", 30_000, { n: 0 }, adim, havuzBulucu());
  assert.deepEqual([o.durum, o.firma, o.n, o.hatali_firma, o.ulasilamayan, o.kalan], ["tamam", 3, 3, 0, 0, 0]);
  assert.equal(gorulen.get(v.O.id), v.O.baglanti.database, "ortak firma merkezde");
  assert.equal(gorulen.get(v.A.id), v.A.baglanti.database, "kendi-A kendi veritabanında (ayrı küme)");
  assert.equal(gorulen.get(v.B.id), "probata_kendi_b", "kendi-B kendi veritabanında (aynı küme, başka veritabanı)");
  assert.equal(await satirSayisi(v.A, v.A.id, "bir"), 1);
  assert.equal(await satirSayisi(v.B, v.B.id, "bir"), 1);
  assert.equal(await merkezdeSatir(v.O.id, "bir"), 1);
  assert.equal(await merkezdeSatir(v.A.id, "bir") + await merkezdeSatir(v.B.id, "bir"), 0, "kendi projelinin satırı merkezde yok");
  const k = await sonKayit("gece_firma_vt");
  assert.equal(k.durum, "tamam");
  assert.equal(k.ozet.ulasilamayan, 0);
  assert.equal(Number((await v.B.sahip.query<{ n: string }>("SELECT count(*) AS n FROM is_calisma WHERE ad = 'gece_firma_vt'")).rows[0].n), 0,
    "iş kaydı firmanın veritabanında değil");
});

test("havuz bulucusuz (eski çağrı) kendi projeliler merkezde dolaşılmaz: adımdan önce reddedilir, ulaşılamayan sayılır, veri karışmaz", async () => {
  const { gorulen, adim } = adimKur("iki");
  const o = await firmalardaKos(v.merkez, "gece_firma_vt", 30_000, { n: 0 }, adim);
  assert.deepEqual([o.durum, o.firma, o.hatali_firma, o.ulasilamayan], ["hata", 1, 0, 2]);
  assert.deepEqual([...gorulen.keys()], [v.O.id], "adım yalnız ortak firmada koştu");
  assert.equal(await merkezdeSatir(v.A.id, "iki") + await merkezdeSatir(v.B.id, "iki"), 0);
});

test("bağlantısı düşen ve bakımdaki firma ulaşılamayan: adımı koşmaz, öteki firmalar sürer, iş 'hata'; adımda düşen hatalı", async () => {
  /* A'nın kaydı kapalı kapıya (bağlantı reddedilir) */
  await v.merkezSahip.query("UPDATE firma_vt SET kapi = $2, surum = surum + 1 WHERE firma_id = $1", [v.A.id, KAPALI_KAPI]);
  try {
    const { gorulen, adim } = adimKur("uc");
    const o = await firmalardaKos(v.merkez, "gece_firma_vt", 30_000, { n: 0 }, adim, havuzBulucu());
    assert.deepEqual([o.durum, o.firma, o.hatali_firma, o.ulasilamayan], ["hata", 2, 0, 1]);
    assert.ok(!gorulen.has(v.A.id) && gorulen.has(v.O.id) && gorulen.has(v.B.id));
    assert.equal((await sonKayit("gece_firma_vt")).durum, "hata");
  } finally {
    await v.merkezSahip.query("UPDATE firma_vt SET kapi = $2, surum = surum + 1 WHERE firma_id = $1", [v.A.id, v.A.baglanti.port]);
  }
  /* B bakımda (göç dışı): merkez çözmez */
  await v.merkezSahip.query("UPDATE firma_vt SET goc_disi = true, goc_disi_gerekce = 'Gece testi bakımı (uydurma)' WHERE firma_id = $1", [v.B.id]);
  try {
    const { gorulen, adim } = adimKur("dort");
    const o = await firmalardaKos(v.merkez, "gece_firma_vt", 30_000, { n: 0 }, adim, havuzBulucu());
    assert.deepEqual([o.durum, o.firma, o.ulasilamayan], ["hata", 2, 1]);
    assert.ok(!gorulen.has(v.B.id));
    assert.equal(await satirSayisi(v.B, v.B.id, "dort"), 0);
  } finally {
    await v.merkezSahip.query("UPDATE firma_vt SET goc_disi = false, goc_disi_gerekce = NULL WHERE firma_id = $1", [v.B.id]);
  }
  /* adımın kendisi düşerse hatalı (ulaşılamayan değil); o firmanın işlemi geri alınır */
  const { adim } = adimKur("bes");
  const o = await firmalardaKos(v.merkez, "gece_firma_vt", 30_000, { n: 0 }, async (db) => {
    const r = await adim(db);
    if ((await db.sorgu<{ f: string }>("SELECT gecerli_firma()::text AS f")).rows[0].f === v.A.id) throw new Error("adım düştü (deneme)");
    return r;
  }, havuzBulucu());
  assert.deepEqual([o.durum, o.firma, o.hatali_firma, o.ulasilamayan], ["hata", 2, 1, 0]);
  assert.equal(await satirSayisi(v.A, v.A.id, "bes"), 0, "düşen firmanın işlemi geri alındı");
});

test("gerçek gece işleri (çöp temizliği, saklama süresi, e-posta) kendi havuzlarıyla üç firmada 'tamam'", async () => {
  const depo = klasorDepo(klasor), bul = havuzBulucu();
  const cop = await geceIsleri(v.merkez, depo, 30_000, bul);
  assert.deepEqual([cop.durum, cop.firma, cop.hatali_firma, cop.ulasilamayan], ["tamam", 3, 0, 0]);
  const s = await saklamaIsi(v.merkez, depo, 30_000, bul);
  assert.deepEqual([s.durum, s.firma, s.hatali_firma, s.ulasilamayan], ["tamam", 3, 0, 0]);
  const e = await epostaIsi(v.merkez, 30_000, bul);
  assert.deepEqual([e.durum, e.firma, e.hatali_firma, e.ulasilamayan], ["tamam", 3, 0, 0]);
});
