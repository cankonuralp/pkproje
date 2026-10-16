/* OLUMSUZ KANIT — tests/goc-dagit.test.ts (FIRMA-VT FV4) neyi koruyor. GERÇEK PostgreSQL: iki küme, üç veritabanı (tests/yardimci/coklu-vt.ts).
   Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): src/server/db/goc-dagit.ts bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar
   mutlak adrese, "pg" çözülmüş adrese çevrilir). Her test önce sağlam kodda neyin geçtiğini gösterir; bozuk kodda testin beklentisi düşer.
   Testteki gibi merkezde kurulumu süren "kurulum-c" de vardır (bağlantısı yok).
   1. Firma vt_firma_dogrula'dan geçmeden okununca kaydı merkezin veritabanını gösteren firma "güncel" görünür (yanlış veritabanının göçü) → 0.
   2. Ulaşılamayan firma "atlandı" sayılınca kapısı kapalı firma yayını durdurmaz → 0.
   3. Dondurulmuş firma atlanınca geride kalan dondurulmuş firma yayını durdurmaz → 0 (etkinleşince eski şemayla açılırdı).
   4. Merkezin sonucu karara katılmayınca merkez geride iken yayın sürer → 0 (bugünkü elle akışın kapısı kalkar).
   5. Denetlemede merkeze yazılınca (firma_vt.son_goc / goc_sayisi — yönetim rolünün hakkı VAR, kilit kod tarafında) testin "salt okunur"
      beklentisi yakalar.
   6. Kurulumdaki firma atlanmayınca (bağlantısı henüz yok) kurulumu süren her firma bütün yayınları durdurur → 1 (FV4 incelemesi).
   7. Ana anahtar yokken firmalar sessizce atlanınca kendi projeli firmalar hiç denetlenmeden yayın sürer → 0 (FV4 incelemesi).
   8. Bakımdaki firmaların sayısı yazılmayınca bakımda bekleyen (denetlenmeyen) firma derleme günlüğünde görünmez (FV4 incelemesi).
   9. Merkez merkezOku'dan (vt_merkez_dogrula) geçmeden okununca ortam bir FİRMA veritabanını gösterirken onun göçü merkezinki sayılır → 0
      (FV4 incelemesi). */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type pg from "pg";
import * as saglam from "../../src/server/db/goc-dagit.ts";
import { SON_GOC } from "../../src/server/db/son-goc.ts";
import { cokluVtKur, type CokluVt } from "../yardimci/coklu-vt.ts";
import { bosKapi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/server/db/goc-dagit.ts");
const KLASOR = resolve(import.meta.dirname, "../../src/server/db");
const KAYNAK = readFileSync(join(KLASOR, "goc-dagit.ts"), "utf8")
  .replace('from "pg"', `from "${import.meta.resolve("pg")}"`)
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(KLASOR, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "goc-dagit-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.equal(KAYNAK.split(eski).length, 2, `bozulacak satır kaynakta tek değil: ${eski}`);
  const yol = join(gecici, `g${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

let v: CokluVt;
let ortam: saglam.Ortam;
const kos = async (m: Modul, ek: saglam.Ortam = {}) => {
  const s: string[] = [];
  return { kod: await m.gocDagit({ ortam: { ...ortam, ...ek }, yaz: (x) => s.push(x) }), cikti: s.join("\n") };
};
async function gocKaydiOlmadan<T>(sahip: pg.Client, ad: string, is: () => Promise<T>): Promise<T> {
  const r = await sahip.query<{ ad: string; ozet: string; uygulandi: Date }>("DELETE FROM goc WHERE ad = $1 RETURNING ad, ozet, uygulandi", [ad]);
  assert.equal(r.rowCount, 1);
  try { return await is(); } finally {
    await sahip.query("INSERT INTO goc (ad, ozet, uygulandi) VALUES ($1, $2, $3)", [r.rows[0]!.ad, r.rows[0]!.ozet, r.rows[0]!.uygulandi]);
  }
}

before(async () => {
  v = await cokluVtKur();
  const u = v.merkezKume.uygulama;
  ortam = {
    PROBATA_VT_SUNUCU: u.host, PROBATA_VT_KAPI: String(u.port), PROBATA_VT_AD: u.database, PROBATA_VT_KULLANICI: u.user, PROBATA_VT_PAROLA: u.password,
    PROBATA_SIR_ANAHTARI: v.anahtar.toString("base64"),
  };
  /* kurulumu süren kendi projeli firma (testteki gibi; örnek veri UYDURMA) */
  const id = randomUUID();
  await v.merkezSahip.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt, durum) VALUES ($1, 'kurulum-c', 'Kurulum C Muayene', 'KC', 'kendi', 'kurulum')", [id]);
  await v.merkezSahip.query("INSERT INTO firma_vt (firma_id, ref) VALUES ($1, 'abcdefghij0123456789')", [id]);
  await v.merkezSahip.query("INSERT INTO firma_kurulum (firma_id, adim, durum) VALUES ($1, 'goc', 'calisiyor')", [id]);
});
after(async () => {
  await v?.kapat();
  rmSync(gecici, { recursive: true, force: true });
});

test("1. firma vt_firma_dogrula'dan geçmeden okununca merkezi gösteren kayıt 'güncel' görünür (kilidin koruduğu açık)", async () => {
  await v.merkezSahip.query("UPDATE firma_vt SET vt_ad = $2 WHERE firma_id = $1", [v.B.id, v.merkezKume.uygulama.database]);
  try {
    const s = await kos(saglam);
    assert.equal(s.kod, 1, "sağlam: yanlış veritabanı reddedildi");
    assert.match(s.cikti, /firma kendi-b: REDDEDİLDİ — yetki reddi/);
    const b = await bozuk(
      '    const v = await birKezDaha(() => kiraciIcinde(havuz, h.firma_id, async (db) => {\n      await db.sorgu("SET TRANSACTION READ ONLY");\n'
      + '      return (await db.sorgu<{ s: GocDurumu }>("SELECT saglik_denetimi() AS s")).rows[0]!.s;\n    }));\n',
      '    const c = await havuz.connect();\n    let v: GocDurumu;\n'
      + '    try { v = (await c.query("SELECT saglik_denetimi() AS s")).rows[0].s; } finally { c.release(); }\n');
    const r = await kos(b);
    assert.equal(r.kod, 0, "bozuk: merkezin göçü kendi-b'nin sayıldı");
    assert.doesNotMatch(r.cikti, /kendi-b/);
    assert.match(r.cikti, /TAMAM: 3 veritabanı güncel/);
  } finally { await v.merkezSahip.query("UPDATE firma_vt SET vt_ad = $2 WHERE firma_id = $1", [v.B.id, v.B.baglanti.database]); }
});

test("2. ulaşılamayan firma 'atlandı' sayılınca kapısı kapalı firma yayını durdurmaz (kilidin koruduğu açık)", async () => {
  await v.merkezSahip.query("UPDATE firma_vt SET kapi = $2 WHERE firma_id = $1", [v.A.id, await bosKapi()]);
  try {
    assert.equal((await kos(saglam)).kod, 1, "sağlam: ulaşılamayan firma 1");
    const b = await bozuk("    return hataSonucu(ad, x);\n  } finally {", '    return { ad, durum: "atlandi", neden: nedenMetni(x) };\n  } finally {');
    assert.equal((await kos(b)).kod, 0, "bozuk: kapalı firma geçti");
  } finally { await v.merkezSahip.query("UPDATE firma_vt SET kapi = $2 WHERE firma_id = $1", [v.A.id, v.A.baglanti.port]); }
});

test("3. dondurulmuş firma atlanınca geride kalan dondurulmuş firma yayını durdurmaz (kilidin koruduğu açık)", async () => {
  await v.merkezSahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [v.B.id]);
  try {
    await gocKaydiOlmadan(v.B.sahip, SON_GOC, async () => {
      assert.equal((await kos(saglam)).kod, 1, "sağlam: dondurulmuş da denetlenir");
      const b = await bozuk('  if (h.kurulum_durum !== "tamam") {', '  if (h.kurulum_durum !== "tamam" || h.durum !== "etkin") {');
      assert.equal((await kos(b)).kod, 0, "bozuk: dondurulmuş geride firma geçti");
    });
  } finally { await v.merkezSahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.B.id]); }
});

test("4. merkezin sonucu karara katılmayınca merkez geride iken yayın sürer (kilidin koruduğu açık)", async () => {
  await gocKaydiOlmadan(v.merkezSahip, SON_GOC, async () => {
    assert.equal((await kos(saglam)).kod, 1, "sağlam: merkez geride 1");
    const b = await bozuk("    const sorunlu = hepsi.filter(", "    const sorunlu = sonuclar.filter(");
    assert.equal((await kos(b)).kod, 0, "bozuk: merkez geride geçti");
  });
});

test("5. denetlemede merkeze yazılınca testin 'salt okunur' beklentisi yakalar — yönetim rolünün hakkı var, kilit kodda (kilidin koruduğu açık)", async () => {
  const yazilan = async () => (await v.merkezSahip.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM firma_vt WHERE son_goc IS NOT NULL OR goc_sayisi IS NOT NULL")).rows[0]!.n;
  assert.equal((await kos(saglam)).kod, 0);
  assert.equal(await yazilan(), 0, "sağlam: yazılmadı");
  const b = await bozuk("    const merkezYerel = merkezYerelMi(e);",
    '    await yonetimIcinde(merkez, (db) => db.sorgu("UPDATE firma_vt SET son_goc = $1, goc_sayisi = $2", [beklenen.son, beklenen.sayi]));\n'
    + "    const merkezYerel = merkezYerelMi(e);");
  try {
    assert.equal((await kos(b)).kod, 0);
    assert.ok((await yazilan()) > 0, "bozuk: denetle merkeze yazdı — testin beklentisi (0) düşer");
  } finally { await v.merkezSahip.query("UPDATE firma_vt SET son_goc = NULL, goc_sayisi = NULL"); }
});

test("6. kurulumdaki firma atlanmayınca kurulumu süren her firma bütün yayınları durdurur (kilidin koruduğu açık)", async () => {
  const s = await kos(saglam);
  assert.equal(s.kod, 0, "sağlam: kurulum-c atlandı, yayın sürer");
  assert.match(s.cikti, /1 kurulumda \(atlandı\)/);
  const b = await bozuk('  if (h.kurulum_durum !== "tamam") {', "  if (false) {");
  const r = await kos(b);
  assert.equal(r.kod, 1, "bozuk: kurulumdaki firma yayını durdurdu — testin beklentisi (0) düşer");
  assert.match(r.cikti, /firma kurulum-c: ULAŞILAMADI — bağlantı kaydı eksik/);
});

test("7. ana anahtar yokken firmalar sessizce atlanınca kendi projeli firmalar denetlenmeden yayın sürer (kilidin koruduğu açık)", async () => {
  assert.equal((await kos(saglam, { PROBATA_SIR_ANAHTARI: "" })).kod, 1, "sağlam: ana anahtar yok → 1");
  const b = await bozuk("try { anahtar = anahtarOku(e); } catch (h) { y(`HATA: ${(h as Error).message} — firma veritabanlarına bağlanılamaz.`); return 1; }",
    "try { anahtar = anahtarOku(e); } catch { hedefler = []; }");
  assert.equal((await kos(b, { PROBATA_SIR_ANAHTARI: "" })).kod, 0, "bozuk: firmalar denetlenmeden geçti — testin beklentisi (1) düşer");
});

test("8. bakımdaki firmaların sayısı yazılmayınca bakımda bekleyen firma günlükte görünmez (kilidin koruduğu açık)", async () => {
  await v.merkezSahip.query("UPDATE firma_vt SET goc_disi = true, goc_disi_gerekce = 'Deneme: bakımda, göç dışı' WHERE firma_id = $1", [v.B.id]);
  try {
    assert.match((await kos(saglam)).cikti, /1 firma bakımda \(göç dışı\) — denetlenmedi/, "sağlam: sayı yazıldı");
    const b = await bozuk("    if (bakimda) y(", "    if (false) y(");
    const r = await kos(b);
    assert.equal(r.kod, 0);
    assert.doesNotMatch(r.cikti, /bakımda/, "bozuk: bakımdaki firma görünmedi — testin beklentisi düşer");
  } finally { await v.merkezSahip.query("UPDATE firma_vt SET goc_disi = false, goc_disi_gerekce = NULL WHERE firma_id = $1", [v.B.id]); }
});

test("9. merkez merkezOku'dan geçmeden okununca ortamın gösterdiği FİRMA veritabanı merkez sayılır (kilidin koruduğu açık)", async () => {
  const firmayiGosteren = { PROBATA_VT_AD: v.B.baglanti.database };
  const s = await kos(saglam, firmayiGosteren);
  assert.equal(s.kod, 1, "sağlam: merkez değil → reddedildi");
  assert.match(s.cikti, /\] merkez: REDDEDİLDİ/);
  /* düz okuma: vt_merkez_dogrula yok (tipler çalışma anında silinir) */
  const b = await bozuk("birKezDaha(() => merkezOku(merkez, ",
    "birKezDaha(() => ((h: Havuz, is: (db: unknown) => Promise<GocDurumu>) => h.connect().then(async (c) => { try { return await is({ sorgu: "
    + "(s: string, d?: unknown[]) => c.query(s, d) }); } finally { c.release(); } }))(merkez, ");
  const r = await kos(b, firmayiGosteren);
  assert.equal(r.kod, 0, "bozuk: firma veritabanı merkez sayıldı — testin beklentisi (1) düşer");
  assert.match(r.cikti, /\] merkez: güncel/);
});
