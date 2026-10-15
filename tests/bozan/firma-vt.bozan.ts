/* OLUMSUZ KANIT — tests/firma-vt.test.ts (FIRMA-VT FV3) neyi koruyor. GERÇEK PostgreSQL: iki küme, üç veritabanı (tests/yardimci/coklu-vt.ts).
   Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): firma-havuzu.ts, oturum.ts ve musteri.ts bellekte bozulup geçici klasörden içe aktarılır (göreli içe
   aktarmalar mutlak adrese, "pg" çözülmüş adrese çevrilir). Her test önce sağlam kodda neyin geçtiğini gösterir.
   1. Çözücü hep MERKEZ havuzunu verince kendi-A'nın işi merkeze gider — veri A'nın veritabanına yazılmaz, son kapı (vt_firma_dogrula) 42501 ile
      durdurur; testin "her firmanın yazdığı yalnız kendi veritabanında" beklentisi yakalar.
   2. Çözücü hep İLK kurulan havuzu verince kendi-B'nin işi kendi-A'nın veritabanına gider — yine 42501; aynı beklenti yakalar. 2026-10-15 (FV3
      incelemesi): bozma sürüm karşılaştırmasını da kaldırır — önce yalnız A'nın sürümü B'ninkinden küçük değilken (bugünkü tohumda ikisi de 1)
      yanlış havuza gidiyordu; tohum ya da test sırası değişse kilit sağlamken kanıt yanlış alarm verirdi.
   3. Dondurma koşulu (oturum.ts ETKIN_FIRMA) kalkınca kayıt önbelleği bayatken dondurulmuş firmaya giriş olur ve açık oturum geçer — testin
      "dondurmanın ikinci kilidi" beklentisi yakalar.
   4. Bağlantı reddinde yeniden deneme kalkınca parola yenilendikten sonraki ilk istek 28P01 ile düşer — "parola yenilendi" beklentisi yakalar.
   5. (2026-10-15, FV3 incelemesi) Dondurma koşulu MÜŞTERİ girişinden / oturumundan (musteri.ts SEC) kalkınca kayıt önbelleği bayatken dondurulmuş
      firmaya müşteri girer, açık müşteri oturumu geçer — aynı beklenti (mGir, musteriOturumOku) yakalar. Önce yalnız oturum.ts bozuluyordu; musteri.ts
      koşulu sağlam oturum.ts'ten aldığı için müşteri yolu hiç denenmiyordu. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import * as saglamHavuz from "../../src/server/db/firma-havuzu.ts";
import { kiraciIcinde } from "../../src/server/db/kiraci.ts";
import { firmaCoz, firmaCozId, type FirmaCozumu } from "../../src/server/db/merkez.ts";
import * as saglamMusteri from "../../src/server/kimlik/musteri.ts";
import * as saglamOturum from "../../src/server/kimlik/oturum.ts";
import { parolaOzeti } from "../../src/server/kimlik/parola.ts";
import { cozumdenKiraci, type IstekKiracisi } from "../../src/server/kiraci/coz.ts";
import { kayitOnbellegiKur } from "../../src/server/kiraci/kayit-onbellek.ts";
import { cokluVtKur, type CokluVt, type TestFirmasi } from "../yardimci/coklu-vt.ts";

type HavuzModulu = typeof import("../../src/server/db/firma-havuzu.ts");
type OturumModulu = typeof import("../../src/server/kimlik/oturum.ts");
type MusteriModulu = typeof import("../../src/server/kimlik/musteri.ts");
const gecici = mkdtempSync(join(tmpdir(), "firma-vt-bozan-"));
let sira = 0;
/** kaynağı bellekte bozar (her [eski, yeni] çifti; ilk geçtiği yer), geçici klasörden içe aktarır (göreli içe aktarmalar kaynağın klasörüne göre mutlak) */
async function bozuk<T>(dosya: string, ...degisimler: readonly (readonly [string, string])[]): Promise<T> {
  const klasor = resolve(dosya, "..");
  let kaynak = readFileSync(resolve(dosya), "utf8")
    .replace('from "pg"', `from "${import.meta.resolve("pg")}"`)
    .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(klasor, y)).href}"`);
  for (const [eski, yeni] of degisimler) {
    assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
    kaynak = kaynak.replace(eski, () => yeni);
  }
  const yol = join(gecici, `b${++sira}.ts`);
  writeFileSync(yol, kaynak);
  return import(pathToFileURL(yol).href) as Promise<T>;
}

const PAROLA = "deneme-parola-2026";
const MUSTERI = "m@kendi-a-musteri.example";
let v: CokluVt;
const kapanacak: { kapat(): Promise<void> }[] = [];
const yetkisiz = (e: unknown) => (e as { code?: string }).code === "42501";
function yonlendirici(m: HavuzModulu, s = { t: Date.now() }) {
  const y = m.yonlendiriciKur({
    merkez: () => v.merkez, anahtar: () => v.anahtar, merkezYerel: true, onbellek: kayitOnbellegiKur<FirmaCozumu>({ simdi: () => s.t }),
    coz: { ad: (k) => firmaCoz(v.merkez, k), id: (i) => firmaCozId(v.merkez, i) },
  });
  kapanacak.push(y);
  return y;
}
async function kiraci(y: saglamHavuz.Yonlendirici, f: TestFirmasi): Promise<IstekKiracisi> {
  const k = cozumdenKiraci(await y.kayit(f.kisaAd));
  assert.ok(k && k.firmaId === f.id);
  return k;
}
const izSay = async (f: TestFirmasi, ne: string) =>
  (await f.sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM denetim_izi WHERE ne = $1 AND firma_id = $2", [ne, f.id])).rows[0]!.n;
const izYaz = (ne: string) => (db: { sorgu: (m: string, d?: readonly unknown[]) => Promise<unknown> }) =>
  db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme Kişi', $1)", [ne]);

before(async () => {
  v = await cokluVtKur();
  const ozet = await parolaOzeti(PAROLA);
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  await v.A.sahip.query("INSERT INTO hesap (firma_id, eposta, ad, parola_ozeti, roller, durum) VALUES ($1, 'kisi@kendi-a.example', 'Deneme Kişi', $2, '{firma_yoneticisi}', 'etkin')",
    [v.A.id, ozet]);
  const m = (await v.A.sahip.query<{ id: string }>("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Müşteri A.Ş.', 'Deneme') RETURNING id::text",
    [v.A.id])).rows[0]!.id;
  await v.A.sahip.query("INSERT INTO musteri_hesap (firma_id, musteri_id, ana, eposta, ad, parola_ozeti, durum) VALUES ($1, $2, true, $3, 'Deneme', $4, 'etkin')",
    [v.A.id, m, MUSTERI, ozet]);
});
/* 2026-10-15 (deneme makinesi 30c8c18: olumsuz kanıt koşusu 17 dk takıldı): bozuk yönlendiricinin kapanışı düşebilir (bozan 2 aynı havuzu iki firmaya
   kaydeder) — o düşüş temizliği yarıda bırakıp iki gömülü kümeyi açık bırakıyor, süreç hiç bitmiyordu. Her kapanış ayrı denenir, kümeler HER DURUMDA durur. */
after(async () => {
  try {
    for (const y of kapanacak) await y.kapat().catch(() => {});
  } finally {
    await v?.kapat();
    rmSync(gecici, { recursive: true, force: true });
  }
}, { timeout: 120_000 });

test("1. çözücü hep merkez havuzunu verince kendi-A'nın işi merkeze gider ve vt_firma_dogrula'ya takılır (kilidin koruduğu açık)", async () => {
  const y = yonlendirici(saglamHavuz);
  const kA = await kiraci(y, v.A);
  await kiraciIcinde(y.havuz(kA), v.A.id, izYaz("bozan 1 sağlam"));
  assert.equal(await izSay(v.A, "bozan 1 sağlam"), 1, "sağlam: A'nın veritabanında");
  const b = await bozuk<HavuzModulu>("src/server/db/firma-havuzu.ts", ["      if (!k.vt) return a.merkez();\n", "      return a.merkez();\n"]);
  const yb = yonlendirici(b);
  await assert.rejects(kiraciIcinde(yb.havuz(await kiraci(yb, v.A)), v.A.id, izYaz("bozan 1 bozuk")), yetkisiz, "bozuk: merkeze gitti, veritabanı reddetti");
  assert.equal(await izSay(v.A, "bozan 1 bozuk"), 0, "bozuk: A'nın verisi yazılmadı (testin beklentisi düşer)");
});

test("2. çözücü hep ilk kurulan havuzu verince kendi-B'nin işi kendi-A'nın veritabanına gider ve reddedilir (kilidin koruduğu açık)", async () => {
  const dene = async (m: HavuzModulu, ne: string) => {
    const y = yonlendirici(m);
    const [kA, kB] = [await kiraci(y, v.A), await kiraci(y, v.B)];
    y.havuz(kA);   // ilk kurulan
    await kiraciIcinde(y.havuz(kB), v.B.id, izYaz(ne));
  };
  await dene(saglamHavuz, "bozan 2 sağlam");
  assert.equal(await izSay(v.B, "bozan 2 sağlam"), 1);
  /* ilk kurulan havuz, sürümü ne olursa olsun (sürüm karşılaştırması da kalkar — 2026-10-15, FV3 incelemesi) */
  const b = await bozuk<HavuzModulu>("src/server/db/firma-havuzu.ts",
    ["    const varolan = havuzlar.get(kayit.firmaId);\n", "    const varolan = havuzlar.values().next().value;\n"],
    ["if (varolan && !varolan.ending && varolan.kayit.surum >= kayit.surum) {", "if (varolan && !varolan.ending) {"]);
  await assert.rejects(dene(b, "bozan 2 bozuk"), yetkisiz, "bozuk: B'nin işi A'nın veritabanında reddedildi");
  assert.equal(await izSay(v.B, "bozan 2 bozuk"), 0);
});

test("3. dondurma koşulu kalkınca kayıt önbelleği bayatken dondurulmuş firmaya giriş olur, açık oturum geçer (kilidin koruduğu açık)", async () => {
  const s = { t: Date.now() };
  const y = yonlendirici(saglamHavuz, s);
  const kA = await kiraci(y, v.A);
  const b = await bozuk<OturumModulu>("src/server/kimlik/oturum.ts", ["export const ETKIN_FIRMA = \"JOIN firma f ON f.id = gecerli_firma() AND f.durum = 'etkin'\";",
    "export const ETKIN_FIRMA = \"\";"]);
  const g = await saglamOturum.girisYap(y.havuz(kA), v.A.id, { eposta: "kisi@kendi-a.example", parola: PAROLA, ip: "10.8.0.1" });
  assert.ok(g.tamam);
  if (!g.tamam) return;
  await v.merkezSahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [v.A.id]);
  await v.A.sahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [v.A.id]);
  try {
    s.t += 10_000;
    assert.ok(await y.kayit("kendi-a"), "önbellek bayat");
    const gir = (m: OturumModulu) => m.girisYap(y.havuz(kA), v.A.id, { eposta: "kisi@kendi-a.example", parola: PAROLA, ip: "10.8.0.2" });
    assert.equal((await gir(saglamOturum)).tamam, false, "sağlam: giriş yok");
    assert.equal(await saglamOturum.oturumOku(y.havuz(kA), v.A.id, g.belirtec), null, "sağlam: oturum yok");
    assert.equal((await gir(b)).tamam, true, "bozuk: dondurulmuş firmaya giriş oldu");
    assert.ok(await b.oturumOku(y.havuz(kA), v.A.id, g.belirtec), "bozuk: dondurulmuş firmada oturum geçti");
  } finally {
    await v.merkezSahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.A.id]);
    await v.A.sahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.A.id]);
  }
});

test("4. bağlantı reddinde yeniden deneme kalkınca parola yenilendikten sonraki ilk istek 28P01 ile düşer (kilidin koruduğu açık)", async () => {
  const eski = v.A.baglanti.password;
  const b = await bozuk<HavuzModulu>("src/server/db/firma-havuzu.ts", ["      if (yenilendi || !yenidenDenenir(h)) throw h;\n", "      throw h;\n"]);
  /** önbellekte eski parola varken parola yenilenir; ilk istek */
  const dene = async (m: HavuzModulu, yeni: string) => {
    const y = yonlendirici(m);
    const kA = await kiraci(y, v.A);
    await v.A.sahip.query(`ALTER ROLE probata_uygulama PASSWORD '${yeni}'`);
    await v.parolaKaydiYaz(v.A, yeni);
    await kiraciIcinde(y.havuz(kA), v.A.id, async () => {});
  };
  try {
    await dene(saglamHavuz, randomBytes(18).toString("base64url"));
    await assert.rejects(dene(b, randomBytes(18).toString("base64url")), (e: { code?: string }) => e.code === "28P01", "bozuk: parola yenilemesi isteği düşürdü");
  } finally {
    await v.A.sahip.query(`ALTER ROLE probata_uygulama PASSWORD '${eski}'`);
    await v.parolaKaydiYaz(v.A, eski);
  }
});

test("5. dondurma koşulu müşteri girişinden / oturumundan kalkınca kayıt önbelleği bayatken dondurulmuş firmaya müşteri girer, açık müşteri oturumu geçer (kilidin koruduğu açık)", async () => {
  const s = { t: Date.now() };
  const y = yonlendirici(saglamHavuz, s);
  const kA = await kiraci(y, v.A);
  const b = await bozuk<MusteriModulu>("src/server/kimlik/musteri.ts", ["JOIN musteri m ON m.id = h.musteri_id ${ETKIN_FIRMA}`;", "JOIN musteri m ON m.id = h.musteri_id`;"]);
  const m = await saglamMusteri.musteriGirisYap(y.havuz(kA), v.A.id, { eposta: MUSTERI, parola: PAROLA, ip: "10.8.1.1" });
  assert.ok(m.tamam);
  if (!m.tamam) return;
  await v.merkezSahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [v.A.id]);
  await v.A.sahip.query("UPDATE firma SET durum = 'dondu' WHERE id = $1", [v.A.id]);
  try {
    s.t += 10_000;
    assert.ok(await y.kayit("kendi-a"), "önbellek bayat");
    const gir = (mod: MusteriModulu) => mod.musteriGirisYap(y.havuz(kA), v.A.id, { eposta: MUSTERI, parola: PAROLA, ip: "10.8.1.2" });
    assert.equal((await gir(saglamMusteri)).tamam, false, "sağlam: müşteri girişi yok");
    assert.equal(await saglamMusteri.musteriOturumOku(y.havuz(kA), v.A.id, m.belirtec), null, "sağlam: müşteri oturumu yok");
    assert.equal((await gir(b)).tamam, true, "bozuk: dondurulmuş firmaya müşteri girdi");
    assert.ok(await b.musteriOturumOku(y.havuz(kA), v.A.id, m.belirtec), "bozuk: dondurulmuş firmada müşteri oturumu geçti");
  } finally {
    await v.merkezSahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.A.id]);
    await v.A.sahip.query("UPDATE firma SET durum = 'etkin' WHERE id = $1", [v.A.id]);
  }
});
