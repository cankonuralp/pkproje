/* OLUMSUZ KANIT — tests/saglik-coklu.test.ts (FIRMA-VT FV7) neyi koruyor. GERÇEK PostgreSQL: iki küme, üç veritabanı (tests/yardimci/coklu-vt.ts).
   Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/saglik.ts ve src/server/db/saglik.ts bellekte bozulup geçici klasörden içe aktarılır (göreli
   içe aktarmalar mutlak adrese, "pg" çözülmüş adrese; bozuk çekirdek bozuk veritabanı katmanını içe aktarır). Her test önce sağlam kodda neyin
   geçtiğini gösterir; bozuk kodda testin beklentisi düşer.
   1. Firma veritabanı kiraciIcinde'siz (vt_firma_dogrula'sız) okununca kaydı merkezin veritabanını gösteren firma "tamam" görünür — hem sağlık
      ucunda hem projeler yoklamasında (yanlış veritabanının göçü sayılır).
   2. Kendi projeli firma denetlenmeyince firmanın veritabanı geride iken adresi "tamam" der.
   3. Firma denetimi kiracının havuzu yerine merkezde yapılınca sağlam kendi projeli firma "sorun" görünür (42501).
   4. Yoklama sonucu yazılmayınca merkezde son_saglik boş kalır.
   5. Hedefler merkezOku'suz (vt_merkez_dogrula'sız) okununca merkez yerine firma veritabanı verildiğinde yoklama "0 proje" diye sayı uydurur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type pg from "pg";
import { yonlendiriciKur, type Yonlendirici } from "../../src/server/db/firma-havuzu.ts";
import { gocDosyalari } from "../../src/server/db/goc.ts";
import { havuzKur } from "../../src/server/db/kiraci.ts";
import { hosttanKiraci } from "../../src/server/kiraci/coz.ts";
import * as saglam from "../../src/server/saglik.ts";
import { cokluVtKur, type CokluVt } from "../yardimci/coklu-vt.ts";

type Modul = typeof import("../../src/server/saglik.ts");
const CEKIRDEK = resolve(import.meta.dirname, "../../src/server/saglik.ts");
const VT = resolve(import.meta.dirname, "../../src/server/db/saglik.ts");
const gecici = mkdtempSync(join(tmpdir(), "saglik-coklu-bozan-"));
let sira = 0;
const degistir = (metin: string, eski: string, yeni: string) => {
  assert.equal(metin.split(eski).length, 2, `bozulacak satır kaynakta tek değil: ${eski}`);
  return metin.replace(eski, () => yeni);
};
/** dosyayı (bozarak) geçici klasöre yazar; göreli içe aktarmalar mutlak, "pg" çözülmüş; ozel: mutlak yol → yerine içe aktarılacak adres */
function yaz(dosya: string, metin: string, ozel: Record<string, string> = {}): string {
  const klasor = dirname(dosya);
  const kaynak = metin.replace('from "pg"', `from "${import.meta.resolve("pg")}"`)
    .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => { const m = resolve(klasor, y); return `from "${ozel[m] ?? pathToFileURL(m).href}"`; });
  const yol = join(gecici, `m${++sira}.ts`);
  writeFileSync(yol, kaynak);
  return pathToFileURL(yol).href;
}
async function bozuk(o: { cekirdek?: [string, string]; vt?: [string, string] }): Promise<Modul> {
  const ozel: Record<string, string> = {};
  if (o.vt) ozel[VT] = yaz(VT, degistir(readFileSync(VT, "utf8"), ...o.vt));
  const c = readFileSync(CEKIRDEK, "utf8");
  return import(yaz(CEKIRDEK, o.cekirdek ? degistir(c, ...o.cekirdek) : c, ozel));
}

let v: CokluVt;
let y: Yonlendirici;
const SON = gocDosyalari().at(-1)!;
const adresle = (m: Modul, host: string) =>
  m.saglikDenetle({ merkez: () => v.merkez, kiraciBul: () => hosttanKiraci(host, "localhost", y.kayit), havuz: y.havuz, surum: "deneme" });
const yokla = (m: Modul, merkez = v.merkez) => m.projeleriYokla({ merkez, anahtar: () => v.anahtar, merkezYerel: true, surum: "deneme" });
async function gocKaydiOlmadan<T>(sahip: pg.Client, ad: string, is: () => Promise<T>): Promise<T> {
  const r = await sahip.query<{ ad: string; ozet: string; uygulandi: Date }>("DELETE FROM goc WHERE ad = $1 RETURNING ad, ozet, uygulandi", [ad]);
  assert.equal(r.rowCount, 1);
  try { return await is(); } finally {
    await sahip.query("INSERT INTO goc (ad, ozet, uygulandi) VALUES ($1, $2, $3)", [r.rows[0]!.ad, r.rows[0]!.ozet, r.rows[0]!.uygulandi]);
  }
}

before(async () => {
  v = await cokluVtKur();
  y = yonlendiriciKur({ merkez: () => v.merkez, anahtar: () => v.anahtar, merkezYerel: true });
});
after(async () => {
  await y?.kapat();
  await v?.kapat();
  rmSync(gecici, { recursive: true, force: true });
});

test("1. firma veritabanı vt_firma_dogrula'sız okununca merkezi gösteren kayıt 'tamam' görünür — uçta ve yoklamada (kilidin koruduğu açık)", async () => {
  await v.merkezSahip.query("UPDATE firma_vt SET vt_ad = $2, surum = surum + 1 WHERE firma_id = $1", [v.B.id, v.merkezKume.uygulama.database]);
  y.unut();
  try {
    assert.equal((await adresle(saglam, "kendi-b.localhost")).denetimler.firma_vt, false, "sağlam: yanlış veritabanı reddedildi");
    assert.deepEqual(await yokla(saglam), { toplam: 2, tamam: 1, sorunlu: 1 }, "sağlam: yoklamada da");
    const b = await bozuk({
      vt: ["  return kiraciIcinde(havuz, firmaId, async (db) => {",
        "  return ((h: Havuz, _f: string, is: (db: any) => Promise<SaglikVerisi>) => h.connect().then(async (c) => { try { return await is({ sorgu: "
        + "(s: string, d?: unknown[]) => c.query(s, d) }); } finally { c.release(); } }))(havuz, firmaId, async (db) => {"],
    });
    assert.equal((await adresle(b, "kendi-b.localhost")).denetimler.firma_vt, true, "bozuk: merkezin göçü kendi-b'nin sayıldı — testin beklentisi düşer");
    assert.deepEqual(await yokla(b), { toplam: 2, tamam: 2, sorunlu: 0 }, "bozuk: yoklamada da");
  } finally {
    await v.merkezSahip.query("UPDATE firma_vt SET vt_ad = $2, surum = surum + 1 WHERE firma_id = $1", [v.B.id, v.B.baglanti.database]);
    y.unut();
  }
});

test("2. kendi projeli firma denetlenmeyince geride kalan firma veritabanının adresi 'tamam' der (kilidin koruduğu açık)", async () => {
  await gocKaydiOlmadan(v.A.sahip, SON.ad, async () => {
    assert.equal((await adresle(saglam, "kendi-a.localhost")).durum, "sorun", "sağlam: geride firma sorun");
    const b = await bozuk({ cekirdek: ["  if (!k) return true;", "  if (!k || k.vt) return true;"] });
    assert.equal((await adresle(b, "kendi-a.localhost")).durum, "tamam", "bozuk: geride firma tamam göründü — testin beklentisi düşer");
  });
});

test("3. firma denetimi merkezde yapılınca sağlam kendi projeli firma 'sorun' görünür (kilidin koruduğu açık)", async () => {
  assert.equal((await adresle(saglam, "kendi-a.localhost")).durum, "tamam", "sağlam: tamam");
  const b = await bozuk({ cekirdek: ["    const havuz = a.havuz(k);", "    const havuz = a.merkez();"] });
  const r = await adresle(b, "kendi-a.localhost");
  assert.deepEqual([r.durum, r.denetimler.firma_vt], ["sorun", false], "bozuk: merkezde 42501 — testin beklentisi (tamam) düşer");
});

test("4. yoklama sonucu yazılmayınca merkezde son_saglik boş kalır (kilidin koruduğu açık)", async () => {
  const yazilan = async () => (await v.merkezSahip.query<{ n: number }>("SELECT count(*)::int AS n FROM firma_vt WHERE son_saglik IS NOT NULL")).rows[0]!.n;
  await v.merkezSahip.query("UPDATE firma_vt SET son_saglik = NULL, son_saglik_zaman = NULL");
  const b = await bozuk({ cekirdek: ["  await sureli(sonSaglikYaz(a.merkez, ", "  if (Date.now() < 0) await sureli(sonSaglikYaz(a.merkez, "] });
  assert.deepEqual(await yokla(b), { toplam: 2, tamam: 2, sorunlu: 0 });
  assert.equal(await yazilan(), 0, "bozuk: yazılmadı — testin beklentisi düşer");
  await yokla(saglam);
  assert.equal(await yazilan(), 2, "sağlam: yazıldı");
});

test("5. hedefler vt_merkez_dogrula'sız okununca merkez yerine firma veritabanı verildiğinde '0 proje' uydurulur (kilidin koruduğu açık)", async () => {
  const firmaHavuzu = havuzKur(v.B.baglanti);
  try {
    await assert.rejects(yokla(saglam, firmaHavuzu), (h: { code?: string }) => h.code === "42501", "sağlam: RED");
    const b = await bozuk({ vt: ["  const satirlar = await merkezOku(merkez, ", "  const satirlar = await yonetimIcinde(merkez, "] });
    assert.deepEqual(await yokla(b, firmaHavuzu), { toplam: 0, tamam: 0, sorunlu: 0 }, "bozuk: firma veritabanında sayı uyduruldu — testin beklentisi düşer");
  } finally { await firmaHavuzu.end(); }
});
