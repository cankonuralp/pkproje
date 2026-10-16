/* OLUMSUZ KANIT — tests/havuz-kapsami.test.ts (FIRMA-VT FV3) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): gerçek dosyalar bellekte
   okunur, bir satır eklenir / çıkarılır, kilidin denetim işlevine verilir; her bozma yakalanmalı.
   1. Bir modül / sayfa / çekirdek dosyası merkez havuzunu içe aktarınca — göreli yol, "@/" takma adı, dinamik içe aktarma, yeniden dışa açma, yan
      etkili içe aktarma, require, db klasörünün içinden — liste izin listesinden ayrılır.
   2. İzin listesindeki bir dosya içe aktarmayı bırakınca liste yine ayrılır (liste tam kalır, ölü izin birikmez).
   3. Kiracının işi merkez havuzuyla açılınca (kiraciIcinde(merkezHavuzu() …)) yakalanır.
   4. Yorumdaki söz içe aktarma sayılmaz (sağlam davranış — yanlış alarm yok).
   2026-10-15 (FV3 incelemesi) eklenenler:
   5. Yönetim eylemi önbelleği boşaltmayınca (eylem unut'tan geçmez, yenileyerek unut'a uğramaz, unut firmaKayitlariniUnut'u çağırmaz, yeni firma
      eylemi unut'suz) yakalanır.
   6. Ana sayfa duyuru bölümünü kiracının işleminde okuyunca (kendi veritabanlı firmada "tazele" hep doğru) ya da merkezden okumayı bırakınca test 2
      yakalar (2026-10-16 FV6: önce "!o.kiraci.vt" koşulunun kalkmasını yakalıyordu — koşul FV6'da kasıtlı kalktı). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, merkezdeKiraciIsi, merkezHavuzuIceAktaranlar, MERKEZ_HAVUZU_IZNI, oku, yonetimOnbellekEksikleri } from "../yardimci/denetimler.ts";

const temel = [...dosyalar("src", [".ts", ".tsx", ".mts", ".js", ".mjs"]), ...dosyalar("scripts", [".ts", ".mts", ".js", ".mjs"])].map((ad) => ({ ad, metin: oku(ad) }));
const izin = Object.keys(MERKEZ_HAVUZU_IZNI).sort();
const ekle = (ad: string, satir: string) => {
  assert.ok(temel.some((d) => d.ad === ad), `dosya yok: ${ad}`);
  return temel.map((d) => (d.ad === ad ? { ...d, metin: `${satir}\n${d.metin}` } : d));
};

test("1. merkez havuzunu içe aktaran yeni dosya yakalanır — her içe aktarma biçimi (kilidin koruduğu açık)", () => {
  assert.deepEqual(merkezHavuzuIceAktaranlar(temel), izin, "sağlam: liste izin listesi");
  for (const [ad, satir] of [
    ["src/server/kimlik/oturum.ts", 'import { merkezHavuzu } from "../db/havuz.ts";'],
    ["src/app/(uygulama)/planlar/page.tsx", 'import { merkezHavuzu } from "@/server/db/havuz";'],
    ["src/modules/raporlar/server/raporlar.ts", 'const { merkezHavuzu } = await import("../../../server/db/havuz.ts");'],
    ["src/server/db/kiraci.ts", 'export { merkezHavuzu } from "./havuz.ts";'],
    ["src/server/kiraci/istek.ts", 'import "../db/havuz";'],
    ["src/server/eposta/sonra.ts", 'const h = require("../db/havuz.js");'],
    ["src/server/kimlik/eylemler.ts", "import { merkezHavuzu as h } from '../db/../db/havuz.ts';"],
  ] as const) {
    const l = merkezHavuzuIceAktaranlar(ekle(ad, satir));
    assert.ok(l.includes(ad), `bozuk: ${ad} yakalanmadı (${satir})`);
    assert.notDeepEqual(l, izin);
  }
});

test("2. izin listesindeki dosya içe aktarmayı bırakınca yakalanır (liste tam kalır)", () => {
  const ad = "src/server/hata/kaydet.ts";
  const bozuk = temel.map((d) => (d.ad === ad ? { ...d, metin: d.metin.replace('import { merkezHavuzu } from "../db/havuz.ts";', "") } : d));
  assert.ok(temel.find((d) => d.ad === ad)!.metin.includes('import { merkezHavuzu } from "../db/havuz.ts";'), "bozulacak satır kaynakta");
  const l = merkezHavuzuIceAktaranlar(bozuk);
  assert.ok(!l.includes(ad));
  assert.notDeepEqual(l, izin, "bozuk: listeden düşen dosya yakalandı");
});

test("3. kiracının işi merkez havuzuyla açılınca yakalanır (kilidin koruduğu açık)", () => {
  assert.deepEqual(merkezdeKiraciIsi(temel), []);
  const bozuk = ekle("src/server/kimlik/istek.ts", "export const sizinti = (o: { kiraci: { firmaId: string } }) => kiraciIcinde(merkezHavuzu(), o.kiraci.firmaId, async () => 1);");
  assert.deepEqual(merkezdeKiraciIsi(bozuk), ["src/server/kimlik/istek.ts"]);
});

test("4. yorumdaki söz içe aktarma sayılmaz; paket adı ve başka 'havuz' dosyaları sayılmaz (sağlam davranış)", () => {
  const l = merkezHavuzuIceAktaranlar(ekle("src/server/kimlik/oturum.ts", [
    '/* eskiden: import { havuz } from "../db/havuz.ts"; */',
    '// import { merkezHavuzu } from "../db/havuz.ts";',
    'import { firmaHavuzu } from "../db/firma-havuzu.ts";',
    'import x from "havuz";',
  ].join("\n")));
  assert.deepEqual(l, izin);
  assert.deepEqual(merkezdeKiraciIsi(ekle("src/server/kimlik/oturum.ts", "/* kiraciIcinde(merkezHavuzu(), …) yazılmaz */")), []);
});

test("5. yönetim eylemi kiracı kaydı önbelleğini boşaltmayınca yakalanır (kilidin koruduğu açık)", () => {
  const metin = oku("src/modules/yonetim/ui/eylemler.ts");
  assert.deepEqual(yonetimOnbellekEksikleri(metin), [], "sağlam");
  for (const [eski, yeni, beklenen] of [
    ["return unut(await islem((o) => yonetimIslemi(o, (db) => firmaAc(", "return (await islem((o) => yonetimIslemi(o, (db) => firmaAc(", "firmaAcEylemi önbelleği boşaltmıyor"],
    /* FV10 (2026-10-16): Firma aç'ın kendi proje yolu da sarılı olmalı; kurulum bitince önbellek boşalmalı */
    ["    return unut(await islem(async (o) => {\n      const k = kurulumOrtami(o);", "    return (await islem(async (o) => {\n      const k = kurulumOrtami(o);", "firmaAcEylemi önbelleği boşaltmıyor"],
    ["if (g.durum === \"tamam\") { firmaKayitlariniUnut(); refresh(); }", "if (g.durum === \"tamam\") { refresh(); }", "kurulum bitince önbellek boşalmıyor"],
    ["{ if (unut(y).tamam) refresh();", "{ if (y.tamam) refresh();", "yenileyerek unut'tan geçmiyor"],
    ["{ if (y.tamam) firmaKayitlariniUnut(); return y; }", "{ return y; }", "unut önbelleği boşaltmıyor"],
    ["export async function firmaDondurEylemi(id: string): Promise<YonetimYaniti> {\n  return yenileyerek(",
      "export async function firmaDondurEylemi(id: string): Promise<YonetimYaniti> {\n  return cevir2(", "firmaDondurEylemi önbelleği boşaltmıyor"],
  ] as const) {
    assert.ok(metin.includes(eski), `bozulacak metin kaynakta yok: ${eski}`);
    assert.ok(yonetimOnbellekEksikleri(metin.replace(eski, () => yeni)).includes(beklenen), `bozuk: yakalanmadı (${beklenen})`);
  }
  /* yeni bir firma eylemi önbelleği boşaltmadan */
  const ek = `${metin}\nexport async function firmaSilEylemi(id: string): Promise<YonetimYaniti> {\n  return cevir(await yonetimIslemi(o, (db) => firmaDurumu(db, id, "dondu")));\n}\n`;
  assert.ok(yonetimOnbellekEksikleri(ek).includes("firmaSilEylemi önbelleği boşaltmıyor"), "bozuk: yeni eylem yakalanmadı");
});

test("6. Ana sayfa duyuruyu kiracının işleminde okuyunca ya da merkezden okumayı bırakınca test 2 yakalar (kilidin koruduğu açık)", () => {
  /* test 2'nin üç kalıbı, aynen */
  const sayfaKalip = /const duyuru = await duyuruBolumuMerkezden\(\);\n  if \(duyuru\.tazele\) duyuruTazeleSonra\(\);/;
  const kiraciKalip = /\bduyuruBolumu\(/;
  const merkezKalip = /merkezOku\(merkezHavuzu\(\), \(db\) => duyuruBolumu\(db\)\)/;
  const sayfa = oku("src/app/(uygulama)/page.tsx"), ana = oku("src/modules/anasayfa/server/anasayfa.ts"), sonra = oku("src/server/duyuru/sonra.ts");
  assert.match(sayfa, sayfaKalip, "sağlam");
  assert.doesNotMatch(ana, kiraciKalip, "sağlam");
  assert.match(sonra, merkezKalip, "sağlam");
  /* kiracının işleminde okuma geri gelir */
  const anaBozuk = ana.replace("belgeBekleyen: await bekleyenBelgeSayisi(db, kim) };", "belgeBekleyen: await bekleyenBelgeSayisi(db, kim), duyuru: await duyuruBolumu(db) };");
  assert.notEqual(anaBozuk, ana, "bozulacak satır kaynakta");
  assert.match(anaBozuk, kiraciKalip, "bozuk: kiracının işlemindeki okuma yakalandı");
  /* sayfa merkezi bırakıp kiracının verisinden okur */
  const sayfaBozuk = sayfa.replace("const duyuru = await duyuruBolumuMerkezden();\n  if (duyuru.tazele) duyuruTazeleSonra();", "const duyuru = v.duyuru;\n  if (duyuru.tazele) duyuruTazeleSonra();");
  assert.notEqual(sayfaBozuk, sayfa, "bozulacak satır kaynakta");
  assert.doesNotMatch(sayfaBozuk, sayfaKalip, "bozuk: merkezden okumayı bırakan sayfa yakalandı");
  /* merkez okuması kiracının havuzuna döner */
  const sonraBozuk = sonra.replace("merkezOku(merkezHavuzu(), (db) => duyuruBolumu(db))", "oturumIslemi(o, (db) => duyuruBolumu(db))");
  assert.notEqual(sonraBozuk, sonra, "bozulacak satır kaynakta");
  assert.doesNotMatch(sonraBozuk, merkezKalip, "bozuk: merkezden okumayan duyuru yakalandı");
});
