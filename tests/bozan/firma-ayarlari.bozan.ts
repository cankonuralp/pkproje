/* OLUMSUZ KANIT — tests/firma-ayarlari.test.ts neyi koruyor (334). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): ayarlar.ts bellekte bozulup geçici
   klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. "Yalnız değiştir düzeyi yazar" kalkınca Firma ayarlarını yalnız GÖREN rol ayarları değiştirir.
   2. Teslim eden denetimi kalkınca başka firmanın kişisi zimmet formunun başlangıç teslim edeni olur.
   3. (335) Fiyat denetimi kalkınca sıfır birim fiyat kaydedilir.
   4. (334 incelemesi) Görme "gör / yaz" yerine "yok değil" olunca "kendi" verilen denetçi bütün ayarları (sabit giderler, personel) görür.
   5. (334 incelemesi) Sürüm ön denetimi ve çakışmada çöpe atma kalkınca eski ekranın yüklediği logo hiçbir ayara bağlı olmadan etkin kalır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/firma-ayarlari/server/ayarlar.ts");
const KOK = resolve("src/modules/firma-ayarlari/server");
const KAYNAK = readFileSync(join(KOK, "ayarlar.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "firma-ayar-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string, ...ek: [string, string][]): Promise<Modul> {
  let k = KAYNAK;
  for (const [e, y] of [[eski, yeni], ...ek]) {
    assert.ok(k.includes(e), `bozulacak satır kaynakta yok: ${e}`);
    k = k.replace(e, () => y);
  }
  const yol = join(klasor, `a-${sira++}.ts`);
  writeFileSync(yol, k);
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume, havuz: Havuz, A: string, B: string, yonId: string, planId: string, kisiB: string;
before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  const h = async (firma: string, sql: string, p: unknown[] = []) => (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(sql, p))).rows[0].id;
  yonId = await h(A, "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('yon@deneme-a.example', 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text");
  planId = await h(A, "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('plan@deneme-a.example', 'Deneme', '{planlama}', 'etkin') RETURNING id::text");
  kisiB = await h(B, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme B Kişi', '2024-01-01', 'mak-muh') RETURNING id::text");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("'yalnız değiştir düzeyi yazar' kalkınca yalnız gören rol ayarı değiştirir (kilidin koruduğu açık)", async () => {
  const m = await bozuk('export const ayarlarYazar = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";', 'export const ayarlarYazar = (kim: YetkiHesabi) => duzey(kim, MODUL) !== "yok";');
  const GOR = { id: planId, ad: "Deneme", roller: ["planlama" as const], matris: { 22: ["gor", "yok", "yok", "yok", "yaz", "yok"] } };
  const r = await kiraciIcinde(havuz, A, (db) => m.ayarKaydet(db, GOR as never, "imza", -1, { yontem: "e_imza" }), { hesapId: planId });
  assert.equal(r.durum, "tamam", "bozuk: yalnız gören rol ayarı değiştirdi");
});

test("teslim eden denetimi kalkınca başka firmanın kişisi başlangıç teslim edeni olur", async () => {
  const m = await bozuk("      if (g.veri.teslim_eden && !(await personelSecenekleri(db)).some((p) => p.id === g.veri.teslim_eden)) return { durum: \"gecersiz\", hatalar: { teslim_eden: \"Çalışan bir kişi seçin.\" } };\n", "");
  const YON = { id: yonId, ad: "Deneme", roller: ["firma_yoneticisi" as const] };
  const r = await kiraciIcinde(havuz, A, (db) => m.ayarKaydet(db, YON, "zimmet", -1, { teslim_eden: kisiB }), { hesapId: yonId });
  assert.equal(r.durum, "tamam", "bozuk: başka firmanın kişisi yazıldı");
});

/* 335 */
test("fiyat denetimi kalkınca sıfır birim fiyat kaydedilir (teklif dışı rapor bedava faturalanır)", async () => {
  const m = await bozuk("if (!t.success || t.data <= 0 || t.data > 100_000_000_000)", "if (!t.success)");
  const ht = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text"))).rows[0].id;
  const YON = { id: yonId, ad: "Deneme", roller: ["firma_yoneticisi" as const] };
  const r = await kiraciIcinde(havuz, A, (db) => m.ayarKaydet(db, YON, "fiyat", 0, { fiyatlar: { [ht]: "0" } }), { hesapId: yonId });
  assert.equal(r.durum, "tamam", "bozuk: sıfır fiyat kaydedildi");
});

/* 334 incelemesi */
test("görme 'gör / yaz' yerine 'yok değil' olunca 'kendi' verilen denetçi bütün ayarları görür", async () => {
  const m = await bozuk('export const ayarlarGorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));',
    'export const ayarlarGorur = (kim: YetkiHesabi) => duzey(kim, MODUL) !== "yok";');
  const K = { id: planId, ad: "Deneme", roller: ["planlama" as const], matris: { 22: ["kendi", "kendi", "kendi", "kendi", "yaz", "yok"] } };
  const v = await kiraciIcinde(havuz, A, (db) => m.firmaAyarlari(db, K as never), { hesapId: planId });
  assert.notEqual(v, null, "bozuk: 'kendi' düzeyi firma ayarlarını gördü");
});

test("sürüm ön denetimi ve çakışmada çöpe atma kalkınca eski ekranın yüklediği logo öksüz ve etkin kalır", async () => {
  const m = await bozuk("  if ((o.id === null ? -1 : o.surum) !== surum) return { durum: \"cakisma\" };\n", "",
    ["    if (yeni) await dosyaCope(db, yeni, { kim: kim.ad, ne: `firma_ayar.${ne}.cakisma` });\n", ""]);
  const YON = { id: yonId, ad: "Deneme", roller: ["firma_yoneticisi" as const] };
  const depo = klasorDepo(join(klasor, "depo"));
  const parca = (ad: string, govde: string) => Buffer.concat([Buffer.from([0, 0, govde.length >> 8, govde.length & 0xff]), Buffer.from(ad + govde, "latin1"), Buffer.from([0, 0, 0, 0])]);
  const PNG = new Uint8Array(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parca("IHDR", "\0\0\0\x01\0\0\0\x01\x08\x02\0\0\0"), parca("IDAT", "veri"), parca("IEND", "")]));
  await kiraciIcinde(havuz, A, (db) => m.ayarKaydet(db, YON, "firma", -1, { ad: "", adres: "Deneme", eposta: "", akr: "", nusha: "2" }), { hesapId: yonId });
  const r = await kiraciIcinde(havuz, A, (db) => m.ayarDosyasiYaz(db, depo, YON, A, "logo", -1, { ad: "eski.png", bayt: PNG }), { hesapId: yonId });
  assert.equal(r.durum, "cakisma");
  const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: string }>("SELECT count(*) n FROM dosya WHERE modul = 'firma_ayar' AND cop IS NULL"))).rows[0].n;
  assert.equal(Number(n), 1, "bozuk: çakışmada yüklenen dosya etkin kaldı");
});
