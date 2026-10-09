/* NEREDEN GELDİ: RAPOR-FORMAT.md §3 ("Bakanlık formatlı türde zorunlu alanlar kilitli — silinemez … eksikse yayınlanmaz"), §5 ("taslak → yayınla
   (v1, v2 …); açık raporlar başladıkları sürümle kalır; eski sürümler saklanır — imzalı raporun PDF'i o sürümle yeniden üretilir"), §7
   (rapor_format kiracı süzgeçli) · KOD-GECIS §3, §4 (Ekipman türleri: branş yöneticileri + firma yöneticisi değiştirir; planlama, denetçi görür;
   muhasebe görmez), §5 ("Rapor formatı: taslak → yayında") · reisim 2026-10-04: "kaynak koddan rol değiştirme, sızma, veri çalma; yetki her
   zaman sunucuda; istemciden gelen kimlik ve sürüm yetki vermez". GERÇEK PostgreSQL, iki firma (308). */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { grupFormati, SABLONLAR } from "../src/format/sablonlar.ts";
import { yayinDenetimi } from "../src/format/motor.ts";
import type { BolumOf } from "../src/format/tanim.ts";
import { GRUPLAR } from "../src/modules/ekipman-turleri/sema.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { baglantiKaydet, formatYukle, turKaydet, type Kisi as TurKisi } from "../src/modules/ekipman-turleri/server/turler.ts";
import {
  formatAyrintisi, formatSurumleri, formatSurumuOku, sablondanTurEkle, sablonKullanimi, taslakBaslat, taslakKaydet, VARSAYILAN_NOT, yayinDenetle, yayindakiFormat,
  yayinla, yeniTureFormat, type Kisi,
} from "../src/modules/rapor-format/server/formatlar.ts";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bakanlikKurulumu, bakanlikTamamla, HAZIR_SABLONLAR, KURULUM_KIM } from "../src/modules/rapor-format/server/kurulum.ts";
import { ayarOku } from "../src/server/ayar/ayar.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { MATRIS_ONERI } from "../src/server/yetki/tanim.ts";
import { CIHAZ_EGIM, CIHAZ_KUMPAS, CIHAZ_LUKSMETRE, CIHAZ_MANOMETRE, CIHAZ_SERIT, CIHAZ_TESISAT, CIHAZ_TOPRAKLAMA, formatStandartlari } from "../src/tanim/standartlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let MEK: Kisi, ELK: Kisi, PLAN: Kisi, DENETCI: Kisi, MUH: Kisi, MEK_B: Kisi;
const T = { ad: "Deneme Tesisat", kod: "DT", grup: "elektrik", brans: "", periyot: "12", sure: "" };
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

async function hesapli(firma: string, eposta: string, roller: string[]) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, roller]))).rows[0].id;
}
/* her işlem oturumdaki hesabın bağlamıyla (yayınlayan veritabanında bundan damgalanır) */
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const b = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
let sayac = 0;
async function yeniTur(firma: "A" | "B" = "A") {
  const kod = `R${"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[sayac++ % 26]}`;
  const k = firma === "A" ? MEK : MEK_B;
  const yap = firma === "A" ? a : b;
  return tamam(await yap(k, (db) => turKaydet(db, k as TurKisi, null, 0, { ...T, ad: `${T.ad} ${kod}`, kod }))).id;
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  const h = (f: string, e: string, r: string) => hesapli(f, e, [r]);
  MEK = kisi(await h(A, "mekanik@deneme.example", "mekanik_yonetici"), "mekanik_yonetici");
  ELK = kisi(await h(A, "elektrik@deneme.example", "elektrik_yonetici"), "elektrik_yonetici");
  PLAN = kisi(await h(A, "planlama@deneme.example", "planlama"), "planlama");
  DENETCI = kisi(await h(A, "denetci@deneme.example", "denetci"), "denetci");
  MUH = kisi(await h(A, "muhasebe@deneme.example", "muhasebe"), "muhasebe");
  MEK_B = kisi(await h(B, "mekanik@deneme-b.example", "mekanik_yonetici"), "mekanik_yonetici");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("şablondan başlat: taslak doğar; bilinmeyen / prototip adlı şablon reddedilir; taslağın yerine geçmek gördüğü sürümle", async () => {
  const tur = await yeniTur();
  for (const kotu of ["sablon:YOK", "sablon:__proto__", "sablon:toString", "sablon:constructor", "baska:ZPKR01", "", "surum:abc"]) {
    assert.deepEqual(await a(MEK, (db) => taslakBaslat(db, MEK, tur, kotu, null)), { durum: "gecersiz", hatalar: { baslangic: "Başlangıç seçilmeli." } }, kotu);
  }
  assert.deepEqual(await a(MEK, (db) => taslakBaslat(db, MEK, tur, { sablon: "ZPKR02" }, null)), { durum: "gecersiz", hatalar: { baslangic: "Başlangıç seçilmeli." } }, "nesne girdi");
  const t = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:ZPKR02", null)));
  const l = (await a(MEK, (db) => formatSurumleri(db, MEK, tur)))!;
  assert.deepEqual(l.map((x) => [x.durum, x.sira, x.kaynak, x.bolum, x.olusturan]), [["taslak", null, "ZPKR02", 14, "Deneme"]]);
  /* ikinci taslak açılmaz: istemci taslağı görmeden (null) başlatırsa çakışma; eski sürümle de çakışma; doğru sürümle yerine geçer */
  assert.deepEqual(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:KOMPRESOR", null)), { durum: "cakisma" });
  assert.deepEqual(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:KOMPRESOR", t.surum + 5)), { durum: "cakisma" });
  const t2 = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:KOMPRESOR", t.surum)));
  assert.equal(t2.id, t.id, "aynı taslak satırı");
  const d = (await a(MEK, (db) => formatAyrintisi(db, MEK, t.id)))!;
  assert.equal(d.kaynak, "KOMPRESOR");
  assert.equal(d.tanim?.gorunum.baslik, "Kompresör Periyodik Kontrol Raporu");
  /* veritabanı da tür başına ikinci taslağa izin vermez */
  await assert.rejects(a(MEK, (db) => db.sorgu("INSERT INTO rapor_format (tur_id, sema, tanim, olusturan) VALUES ($1, 1, '{}', 'x')", [tur])), /rapor_format_tek_taslak|duplicate|yinelenen/i);
});

test("taslak kaydet: tanım şemadan geçmeden yazılmaz (kimlik tekrarı, bilinmeyen blok, şema sürümü, boyut); geçerli tanım yazılır", async () => {
  const tur = await yeniTur();
  const t = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:KOMPRESOR", null)));
  const temel = structuredClone(SABLONLAR.KOMPRESOR.tanim);
  const bozuklar: unknown[] = [
    { ...temel, bolumler: [...temel.bolumler, { id: "firma", ad: "İkinci", blok: "not" }] },
    { ...temel, bolumler: [{ id: "x", ad: "X", blok: "betik" }] },
    { ...temel, sema: 2 },
    { ...temel, bolumler: [{ id: "x", ad: "X".repeat(201), blok: "not" }] },
    { ...temel, bolumler: [{ id: "x", ad: "X", blok: "bilgi", alanlar: Array.from({ length: 61 }, (_, i) => ({ id: `a${i}`, ad: "A", tur: "metin" })) }] },
    "<script>", null, [temel],
  ];
  for (const x of bozuklar) assert.equal((await a(MEK, (db) => taslakKaydet(db, MEK, t.id, t.surum, x))).durum, "gecersiz", JSON.stringify(x).slice(0, 80));
  const buyuk = { ...temel, gorunum: { ...temel.gorunum, dayanak: Array.from({ length: 20 }, () => "ş".repeat(300)) }, bolumler: Array.from({ length: 40 }, (_, i) => ({
    id: `b${i}`, ad: "B", blok: "liste", cevaplar: ["Uygun", "Uygun değil"], gruplar: Array.from({ length: 40 }, (_, j) => ({ id: `g${i}_${j}`, ad: "ğ".repeat(200), maddeler: [] })),
  })) };
  assert.deepEqual(await a(MEK, (db) => taslakKaydet(db, MEK, t.id, t.surum, buyuk)), { durum: "gecersiz", hatalar: { tanim: "Tanım okunamadı ya da çok büyük." } });
  assert.equal((await a(MEK, (db) => formatAyrintisi(db, MEK, t.id)))!.tanim?.bolumler.length, temel.bolumler.length, "bozuk tanım yazılmadı");
  const yeni = structuredClone(temel); yeni.bolumler[0].ad = "Firma ve tesis";
  const k = tamam(await a(MEK, (db) => taslakKaydet(db, MEK, t.id, t.surum, yeni)));
  assert.equal((await a(MEK, (db) => formatAyrintisi(db, MEK, t.id)))!.tanim?.bolumler[0].ad, "Firma ve tesis");
  assert.deepEqual(await a(MEK, (db) => taslakKaydet(db, MEK, t.id, t.surum, yeni)), { durum: "cakisma" }, "eski sürümle yazma reddedilir");
  /* denetim izine tanımın değeri yazılmaz (büyük; yayınlanan sürüm zaten saklanır) */
  const iz = (await a(MEK, (db) => db.sorgu<{ yeni: Record<string, unknown> }>("SELECT yeni FROM denetim_izi WHERE nesne = 'rapor_format' AND nesne_id = $1 AND ne = 'rapor_format.taslak_kaydet'", [t.id]))).rows;
  assert.deepEqual(iz.map((x) => x.yeni.tanim), ["gizli"]);
  assert.ok(k.surum > t.surum);
});

test("YAYIN: kilitli (Bakanlık) öğe silinmiş / değiştirilmiş / kilidi kaldırılmışsa yayınlanmaz (sunucu kaynağı kendisi seçer); öteki maddeler yalnız uyarı", async () => {
  const tur = await yeniTur();
  const t = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:ZPKR02", null)));
  /* istemci kilit bayraklarını kaldırıp öğeleri silse de kaynak (ZPKR02) koddan gelir */
  const bozuk = structuredClone(SABLONLAR.ZPKR02.tanim);
  bozuk.bolumler = bozuk.bolumler.filter((x) => x.id !== "fonk").map((x) => ({ ...x, kilit: false }));
  const gozle = bozuk.bolumler.find((x) => x.id === "gozle");
  if (gozle?.blok === "liste") { gozle.gruplar[0].maddeler.splice(0, 1); gozle.gruplar[1].maddeler[0] = { ...gozle.gruplar[1].maddeler[0], metin: "Değiştirildi", kilit: false }; }
  const k = tamam(await a(MEK, (db) => taslakKaydet(db, MEK, t.id, t.surum, bozuk)));
  const d = (await a(MEK, (db) => yayinDenetle(db, MEK, t.id)))!;
  for (const p of ["silinmiş: fonk", "silinmiş: g1_1", "değiştirilmiş: g2_1", "kilidi kaldırılmış: firma"]) assert.ok(d.engeller.some((x) => x.includes(p)), `${p} — ${d.engeller.join(" | ")}`);
  const r = await a(MEK, (db) => yayinla(db, MEK, t.id, k.surum, ""));
  assert.equal(r.durum, "engel");
  assert.deepEqual(r.durum === "engel" && r.engeller, d.engeller, "yayın engeli denetimle aynı");
  assert.equal(await a(MEK, (db) => yayindakiFormat(db, tur)), null, "yayınlanmadı");
  /* sıralama serbest; kilitsiz yeni bölüm eklenebilir; boş bölüm yalnız uyarı */
  const iyi = structuredClone(SABLONLAR.ZPKR02.tanim);
  iyi.bolumler.reverse();
  iyi.bolumler.push({ id: "ek", ad: "Firma notu", blok: "bilgi", kilit: false, alanlar: [] });
  /* 337–339 incelemesi: istemci firmanın kendi bölümünü "kilit" işaretleyip yollar — kaynakta kilitli olmadığı için kaydedilen tanımda açık */
  iyi.bolumler.push({ id: "sahte", ad: "Sahte kilit", blok: "not", kilit: true, zorunlu: false });
  const k2 = tamam(await a(MEK, (db) => taslakKaydet(db, MEK, t.id, k.surum, iyi)));
  const kayitli = (await a(MEK, (db) => formatAyrintisi(db, MEK, t.id)))!.tanim!;
  assert.equal(kayitli.bolumler.find((x) => x.id === "sahte")?.kilit, false, "istemcinin kilit işareti yazılmadı");
  assert.ok(kayitli.bolumler.find((x) => x.id === "gozle")?.kilit, "kaynağın kilitli bölümü kilitli");
  const y = tamam(await a(MEK, (db) => yayinla(db, MEK, t.id, k2.surum, "  ilk   sürüm ")));
  assert.equal(y.sira, 1);
  assert.deepEqual(y.uyarilar, ["“Firma notu” bölümü boş."]);
  const v = (await a(MEK, (db) => formatAyrintisi(db, MEK, t.id)))!;
  assert.deepEqual([v.durum, v.sira, v.notu, v.yayinlayan], ["yayinda", 1, "ilk sürüm", "Deneme"]);
  /* yayınlayan hesap ve zaman veritabanından (işlem bağlamı) — kod uyduramaz */
  const dam = (await a(MEK, (db) => db.sorgu<{ yayinlayan_id: string; fark: number }>(
    "SELECT yayinlayan_id::text, abs(extract(epoch FROM now() - yayin)) AS fark FROM rapor_format WHERE id = $1", [t.id]))).rows[0];
  assert.equal(dam.yayinlayan_id, MEK.id);
  assert.ok(dam.fark < 60);
});

test("SÜRÜM: yayındaki eskiye düşer, sıra artar; yayındaki sürümden yeni taslak; eski sürüm okunur (imzalı raporun PDF'i için)", async () => {
  const tur = await yeniTur();
  const t1 = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:ZPKR01", null)));
  tamam(await a(MEK, (db) => yayinla(db, MEK, t1.id, t1.surum, "")));
  const y1 = (await a(MEK, (db) => yayindakiFormat(db, tur)))!;
  assert.deepEqual([y1.id, y1.sira, y1.tanim.gorunum.formKodu], [t1.id, 1, "ZPKR01"]);
  /* yayındaki sürümden taslak: kaynak (şablon) devralınır → kilit denetimi sürer */
  const t2 = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, `surum:${t1.id}`, null)));
  assert.notEqual(t2.id, t1.id);
  assert.equal((await a(MEK, (db) => formatAyrintisi(db, MEK, t2.id)))!.kaynak, "ZPKR01");
  const kayip = structuredClone(y1.tanim); kayip.bolumler = kayip.bolumler.filter((x) => x.id !== "nokta");
  const k = tamam(await a(MEK, (db) => taslakKaydet(db, MEK, t2.id, t2.surum, kayip)));
  assert.equal((await a(MEK, (db) => yayinla(db, MEK, t2.id, k.surum, ""))).durum, "engel");
  const k2 = tamam(await a(MEK, (db) => taslakKaydet(db, MEK, t2.id, k.surum, y1.tanim)));
  assert.equal(tamam(await a(ELK, (db) => yayinla(db, ELK, t2.id, k2.surum, "ikinci"))).sira, 2, "elektrik yöneticisi de yayınlar");
  const l = (await a(MEK, (db) => formatSurumleri(db, MEK, tur)))!;
  assert.deepEqual(l.map((x) => [x.sira, x.durum]), [[2, "yayinda"], [1, "eski"]]);
  assert.equal((await a(MEK, (db) => formatSurumuOku(db, t1.id)))?.durum, "eski", "eski sürüm okunur");
  assert.equal((await a(MEK, (db) => yayindakiFormat(db, tur)))!.sira, 2);
  /* başka türün sürümünden başlatılamaz (istemciden gelen kimlik yetki vermez) */
  const tur2 = await yeniTur();
  assert.deepEqual(await a(MEK, (db) => taslakBaslat(db, MEK, tur2, `surum:${t1.id}`, null)), { durum: "gecersiz", hatalar: { baslangic: "Sürüm bulunamadı." } });
  /* yayınlanmış sürüm taslak gibi kaydedilmez, yeniden yayınlanmaz */
  assert.deepEqual(await a(MEK, (db) => taslakKaydet(db, MEK, t1.id, 0, y1.tanim)), { durum: "kilitli" });
  assert.deepEqual(await a(MEK, (db) => yayinla(db, MEK, t2.id, k2.surum + 1, "")), { durum: "cakisma" });
});

test("VERİTABANI: yayınlanan sürüm değişmez, geri alınamaz, silinmez; yeni satır yalnız taslak; yayın damgası uydurulamaz", async () => {
  const tur = await yeniTur();
  const t = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:KOMPRESOR", null)));
  tamam(await a(MEK, (db) => yayinla(db, MEK, t.id, t.surum, "")));
  const q = (sql: string, ...p: unknown[]) => a(MEK, (db) => db.sorgu(sql, [t.id, ...p]));
  await assert.rejects(q("UPDATE rapor_format SET tanim = '{\"sema\":1,\"bolumler\":[]}' WHERE id = $1"), /değişmez/);
  await assert.rejects(q("UPDATE rapor_format SET notu = 'sonradan' WHERE id = $1"), /değişmez/);
  await assert.rejects(q("UPDATE rapor_format SET yayin = now() - interval '1 year' WHERE id = $1"), /değişmez/);
  await assert.rejects(q("UPDATE rapor_format SET durum = 'taslak', sira = NULL, yayin = NULL, yayinlayan = NULL WHERE id = $1"), /geri alınamaz/);
  await assert.rejects(q("DELETE FROM rapor_format WHERE id = $1"), /permission denied|izin/i);
  await assert.rejects(a(MEK, (db) => db.sorgu(
    "INSERT INTO rapor_format (tur_id, durum, sira, sema, tanim, olusturan, yayinlayan, yayin) VALUES ($1, 'yayinda', 9, 1, '{}', 'x', 'x', now())", [tur])), /yalnız taslak/);
  /* taslağı doğrudan yayınlayan kod da yayınlayanı / zamanı seçemez: bağlamdaki hesap ve şimdiki zaman yazılır */
  const t2 = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:KOMPRESOR", null)));
  await a(ELK, (db) => db.sorgu("UPDATE rapor_format SET durum = 'eski' WHERE tur_id = $1 AND durum = 'yayinda'", [tur]));
  await a(ELK, (db) => db.sorgu("UPDATE rapor_format SET durum = 'yayinda', sira = 2, yayinlayan = 'x', yayinlayan_id = $2, yayin = '2020-01-01' WHERE id = $1", [t2.id, MEK.id]));
  const r = (await a(MEK, (db) => db.sorgu<{ yayinlayan_id: string; yil: number }>("SELECT yayinlayan_id::text, extract(year FROM yayin) AS yil FROM rapor_format WHERE id = $1", [t2.id]))).rows[0];
  assert.equal(r.yayinlayan_id, ELK.id);
  assert.notEqual(Number(r.yil), 2020);
  /* ikinci yayındaki aynı türde olamaz */
  await assert.rejects(q("UPDATE rapor_format SET durum = 'yayinda' WHERE id = $1"), /geri alınamaz|rapor_format_tek_yayin|duplicate|yinelenen/i);
});

test("YETKİ: branş yöneticileri başlatır, kaydeder, yayınlar; planlama ve denetçi görür ama değiştiremez; muhasebe görmez", async () => {
  const tur = await yeniTur();
  const t = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:KOMPRESOR", null)));
  for (const k of [PLAN, DENETCI]) {
    assert.equal((await a(k, (db) => formatSurumleri(db, k, tur)))!.length, 1);
    const d = (await a(k, (db) => formatAyrintisi(db, k, t.id)))!;
    assert.ok(d.tanim, "tanımı görür (rapor bu tanımdan yazılır)");
    assert.equal(d.denetim, null, "yayın denetimi yalnız değiştirene");
    assert.deepEqual(await a(k, (db) => taslakBaslat(db, k, tur, "sablon:ZPKR01", t.surum)), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => taslakKaydet(db, k, t.id, t.surum, SABLONLAR.KOMPRESOR.tanim)), { durum: "yetkisiz" });
    assert.equal(await a(k, (db) => yayinDenetle(db, k, t.id)), null);
    assert.deepEqual(await a(k, (db) => yayinla(db, k, t.id, t.surum, "")), { durum: "yetkisiz" });
  }
  assert.equal(await a(MUH, (db) => formatSurumleri(db, MUH, tur)), null);
  assert.equal(await a(MUH, (db) => formatAyrintisi(db, MUH, t.id)), null);
  assert.deepEqual(await a(MUH, (db) => yayinla(db, MUH, t.id, t.surum, "")), { durum: "yetkisiz" });
  assert.equal((await a(MEK, (db) => formatAyrintisi(db, MEK, t.id)))!.tanim?.gorunum.baslik, "Kompresör Periyodik Kontrol Raporu", "değişmedi");
});

test("ROL DEĞİŞTİRME: yetki istemciden değil firmanın rol düzeninden — yönetici 'görür'e indirilince yazamaz, denetçiye 'yaz' verilince yazar; tanımsız rol hiçbir şey vermez", async () => {
  const tur = await yeniTur();
  const t = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:KOMPRESOR", null)));
  const satir = (d: string[]) => ({ ...MATRIS_ONERI, 5: d });
  const MEK_GOR: Kisi = { ...MEK, matris: satir(["gor", "gor", "gor", "yaz", "yaz", "yok"]) as never };
  assert.deepEqual(await a(MEK_GOR, (db) => yayinla(db, MEK_GOR, t.id, t.surum, "")), { durum: "yetkisiz" });
  assert.ok(await a(MEK_GOR, (db) => formatSurumleri(db, MEK_GOR, tur)), "görmeye devam eder");
  const DEN_YAZ: Kisi = { ...DENETCI, matris: satir(["gor", "yaz", "yaz", "yaz", "yaz", "yok"]) as never };
  assert.equal(tamam(await a(DEN_YAZ, (db) => yayinla(db, DEN_YAZ, t.id, t.surum, ""))).sira, 1);
  const SAHTE: Kisi = { ...DENETCI, roller: ["denetci", "yonetici", "__proto__", "admin"] as never };
  assert.deepEqual(await a(SAHTE, (db) => taslakBaslat(db, SAHTE, tur, "sablon:ZPKR01", null)), { durum: "yetkisiz" });
  const BOS: Kisi = { ...MUH, roller: [] };
  assert.equal(await a(BOS, (db) => formatSurumleri(db, BOS, tur)), null);
});

test("KİRACI: B, A'nın sürümlerini göremez, başlatamaz, kaydedemez, yayınlayamaz; veritabanı başka firmanın türüne sürüm bağlamaz", async () => {
  const tur = await yeniTur();
  const t = tamam(await a(MEK, (db) => taslakBaslat(db, MEK, tur, "sablon:ZPKR02", null)));
  assert.equal(await b(MEK_B, (db) => formatSurumleri(db, MEK_B, tur)), null);
  assert.equal(await b(MEK_B, (db) => formatAyrintisi(db, MEK_B, t.id)), null);
  assert.deepEqual(await b(MEK_B, (db) => taslakBaslat(db, MEK_B, tur, "sablon:ZPKR01", null)), { durum: "yok" });
  assert.deepEqual(await b(MEK_B, (db) => taslakKaydet(db, MEK_B, t.id, t.surum, SABLONLAR.KOMPRESOR.tanim)), { durum: "yok" });
  assert.equal(await b(MEK_B, (db) => yayinDenetle(db, MEK_B, t.id)), null);
  assert.deepEqual(await b(MEK_B, (db) => yayinla(db, MEK_B, t.id, t.surum, "")), { durum: "yok" });
  tamam(await a(MEK, (db) => yayinla(db, MEK, t.id, t.surum, "")));
  assert.equal(await b(MEK_B, (db) => yayindakiFormat(db, tur)), null);
  assert.equal(await b(MEK_B, (db) => formatSurumuOku(db, t.id)), null);
  /* B'nin kendi türünden A'nın sürümüne kopya yapılamaz */
  const turB = await yeniTur("B");
  assert.deepEqual(await b(MEK_B, (db) => taslakBaslat(db, MEK_B, turB, `surum:${t.id}`, null)), { durum: "gecersiz", hatalar: { baslangic: "Sürüm bulunamadı." } });
  await assert.rejects(b(MEK_B, (db) => db.sorgu("INSERT INTO rapor_format (tur_id, sema, tanim, olusturan) VALUES ($1, 1, '{}', 'x')", [tur])), /foreign key|yabancı anahtar/i);
  await assert.rejects(b(MEK_B, (db) => db.sorgu("INSERT INTO rapor_format (firma_id, tur_id, sema, tanim, olusturan) VALUES ($1, $2, 1, '{}', 'x')", [A, tur])), /row-level security|satır düzeyi/i);
  const g = (await b(MEK_B, (db) => db.sorgu("UPDATE rapor_format SET notu = 'ele geçirdim' WHERE id = $1", [t.id]))).rowCount;
  assert.equal(g, 0, "RLS: başka firmanın satırı görünmez, güncellenmez");
});

/* 2026-10-09 (436; reisim: "EKİPMAN TÜRLERİNDE BAKANLIK FORMATLARINI DA GÖREMEDİM"): hazır şablondan tür — tür + şablondan taslak TEK işlemde
   (kod çakışırsa hiçbiri yazılmaz), iki yetki de gerekir; şablon kullanımı türün yayındaki (yoksa taslak) sürümünün kaynağından, başka firma görmez. */
test("436 şablondan tür: tür + taslak tek işlemde; kod çakışırsa hiçbiri; yetkisiz eklemez; kullanım haritası firmaya özel", async () => {
  const girdi = { ad: "Yıldırımdan korunma tesisatı", kod: "YKT", grup: "elektrik", brans: "", periyot: "12", sure: "" };
  assert.deepEqual(await a(PLAN, (db) => sablondanTurEkle(db, PLAN, "ZPKR03", girdi)), { durum: "yetkisiz" }, "planlama türe yazamaz");
  assert.deepEqual(await a(ELK, (db) => sablondanTurEkle(db, ELK, "YOK", girdi)), { durum: "gecersiz", hatalar: { sablon: "Şablon bulunamadı." } });
  const r = tamam(await a(ELK, (db) => sablondanTurEkle(db, ELK, "ZPKR03", girdi)));
  const l = (await a(ELK, (db) => formatSurumleri(db, ELK, r.turId)))!;
  assert.deepEqual(l.map((x) => [x.id, x.durum, x.kaynak]), [[r.formatId, "taslak", "ZPKR03"]]);
  /* aynı kodla ikinci kez: tür yazılmaz, taslak da yok */
  const once = (await a(ELK, (db) => db.sorgu("SELECT count(*)::int AS n FROM rapor_format"))).rows[0];
  const iki = await a(ELK, (db) => sablondanTurEkle(db, ELK, "ZPKR04", { ...girdi, ad: "Başka tür" }));
  assert.equal(iki.durum, "gecersiz");
  assert.match(iki.durum === "gecersiz" ? iki.hatalar.kod ?? "" : "", /YKT kodu/);
  assert.deepEqual((await a(ELK, (db) => db.sorgu("SELECT count(*)::int AS n FROM rapor_format"))).rows[0], once, "taslak yazılmadı");
  /* kullanım: taslak → yayında; başka firma boş */
  assert.deepEqual((await a(ELK, (db) => sablonKullanimi(db, ELK)))!.ZPKR03, [{ turId: r.turId, durum: "taslak" }]);
  tamam(await a(ELK, (db) => yayinla(db, ELK, r.formatId, 0, "")));
  assert.deepEqual((await a(ELK, (db) => sablonKullanimi(db, ELK)))!.ZPKR03, [{ turId: r.turId, durum: "yayinda" }]);
  assert.equal((await b(MEK_B, (db) => sablonKullanimi(db, MEK_B)))!.ZPKR03, undefined, "başka firma görmez");
  assert.equal(await a(MUH, (db) => sablonKullanimi(db, MUH)), null, "muhasebe görmez");
  /* kitaplıkta her şablonun önerdiği tür şemadan geçer (2–3 harf kod, Ek-III grubu, periyot) */
  for (const [k, s] of Object.entries(SABLONLAR)) assert.match(s.tur.kod, /^[A-Z]{2,3}$/, k);
});

/* 2026-10-09 (437; reisim: "HALA BAKANLIK FORMATLARI YOK DEFAULT OLARAK GELMESİ GEREKİYOR … RAPOR FORMATI PDFLERİ DE STANDART OLARAK BAKANLIKTAN
   GELECEK"): hazır kurulum — her Bakanlık formatı için tür (kontrol metodu standartlarıyla) + Bakanlığın resmî PDF'i (sürüm 1, baytı baytına) +
   YAYINDA şablon (sürüm 1, sistem yayınlar, hesap damgası boş); ikinci kez hiçbir şey yazmaz; firma o şablonu / kodu kullanıyorsa atlanır; aynı
   anda iki istek tek kurulum; başka firmaya dokunmaz. Sıfırdan: boş iskelet taslak, kaynaksız, yayınlanır (kilit yok — engel yok). */
test("437 hazır kurulum: tür + resmî PDF + yayında şablon; ikinci kez yazmaz; kullanılan şablon atlanır; aynı anda tek kurulum; sıfırdan taslak", async () => {
  const depo = klasorDepo(mkdtempSync(join(tmpdir(), "kurulum-depo-")));
  /* 467: + mekanik — AED (ZPKR07), KKR (ZPKR06), LPG (ZPMR01), LPY (ZYDR01) */
  const KODLAR = ["AED", "AGT", "EIT", "KKR", "LPG", "LPY", "TRF", "YAS", "YKT"];
  const r1 = await kiraciIcinde(havuz, B, (db) => bakanlikKurulumu(db, depo));
  assert.deepEqual([r1.kurulan, r1.atlanan], [9, 0], JSON.stringify(r1));
  const t = (await b(MEK_B, (db) => db.sorgu<{ id: string; kod: string; ad: string; periyot: number; brans: string; kontrol_std: string[] }>(
    "SELECT id::text, kod, ad, periyot, brans, kontrol_std FROM ekipman_turu WHERE kod = ANY($1) ORDER BY kod", [KODLAR]))).rows;
  assert.deepEqual(t.map((x) => [x.kod, x.periyot, x.brans]), KODLAR.map((k) => [k, k === "LPY" ? 120 : 12, ["AED", "KKR", "LPG", "LPY"].includes(k) ? "m" : "e"]));
  assert.equal(t.find((x) => x.kod === "YKT")!.ad, "Yıldırımdan korunma tesisatı");
  assert.deepEqual(t.find((x) => x.kod === "YKT")!.kontrol_std, formatStandartlari("ZPKR03"));
  /* 440: ölçüm cihazı türleri adıyla açıldı (aynı ad bir kez — AGT ile EIT aynı türü kullanır) ve türlere bağlandı */
  const ct = new Map((await b(MEK_B, (db) => db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM cihaz_turu"))).rows.map((x) => [x.ad, x.id]));
  assert.deepEqual([...ct.keys()].sort(), [CIHAZ_LUKSMETRE, CIHAZ_TESISAT, CIHAZ_TOPRAKLAMA, CIHAZ_SERIT, CIHAZ_KUMPAS, CIHAZ_EGIM, CIHAZ_MANOMETRE].sort());
  const bag = new Map((await b(MEK_B, (db) => db.sorgu<{ kod: string; c: string[] }>(
    "SELECT kod, cihaz_turleri::text[] AS c FROM ekipman_turu WHERE kod = ANY($1)", [KODLAR]))).rows.map((x) => [x.kod, x.c]));
  assert.deepEqual(Object.fromEntries(bag), { AGT: [ct.get(CIHAZ_TESISAT)], EIT: [ct.get(CIHAZ_TESISAT)], YKT: [ct.get(CIHAZ_TOPRAKLAMA)],
    YAS: [ct.get(CIHAZ_LUKSMETRE)], TRF: [ct.get(CIHAZ_TOPRAKLAMA)], KKR: [ct.get(CIHAZ_SERIT), ct.get(CIHAZ_KUMPAS), ct.get(CIHAZ_LUKSMETRE)],
    AED: [ct.get(CIHAZ_SERIT), ct.get(CIHAZ_KUMPAS), ct.get(CIHAZ_EGIM)], LPG: [ct.get(CIHAZ_SERIT)], LPY: [ct.get(CIHAZ_MANOMETRE)] });
  const f = (await b(MEK_B, (db) => db.sorgu<{ kod: string; durum: string; sira: number; kaynak: string; yayinlayan: string; yayinlayan_id: string | null; notu: string }>(
    `SELECT t.kod, f.durum, f.sira, f.kaynak, f.yayinlayan, f.yayinlayan_id::text, f.notu FROM rapor_format f JOIN ekipman_turu t ON t.id = f.tur_id
      WHERE t.kod = ANY($1) ORDER BY t.kod`, [KODLAR]))).rows;
  const KAYNAK = [["AED", "ZPKR07"], ["AGT", "ZPKR01"], ["EIT", "ZPKR02"], ["KKR", "ZPKR06"], ["LPG", "ZPMR01"], ["LPY", "ZYDR01"], ["TRF", "ZPKR05"], ["YAS", "ZPKR04"], ["YKT", "ZPKR03"]];
  assert.deepEqual(f, KAYNAK.map(([kod, kaynak]) =>
    ({ kod, durum: "yayinda", sira: 1, kaynak, yayinlayan: KURULUM_KIM, yayinlayan_id: null, notu: "Bakanlık formatı" })));
  for (const x of t) assert.ok(await b(MEK_B, (db) => yayindakiFormat(db, x.id)), `${x.kod}: rapor yazılabilir`);
  const p = (await b(MEK_B, (db) => db.sorgu<{ kod: string; sira: number; ad: string; sha256: string }>(
    `SELECT t.kod, tf.sira, d.ad, d.sha256 FROM tur_format tf JOIN ekipman_turu t ON t.id = tf.tur_id JOIN dosya d ON d.id = tf.dosya_id
      WHERE t.kod = ANY($1) ORDER BY t.kod`, [KODLAR]))).rows;
  assert.deepEqual(p.map((x) => [x.kod, x.sira, x.ad]), KAYNAK.map(([kod, kaynak]) => [kod, 1, `${kaynak}.pdf`]));
  assert.equal(p[1].sha256, createHash("sha256").update(readFileSync(join(import.meta.dirname, "..", "src", "tanim", "bakanlik", "ZPKR01.pdf"))).digest("hex"), "resmî PDF baytı baytına");
  assert.deepEqual((await b(MEK_B, (db) => ayarOku(db, "kurulum"))).deger, { bakanlik: [...HAZIR_SABLONLAR], pdf: true, baglanti: true, varsayilan: true });
  /* ikinci kez: hiçbir şey yazılmaz */
  const say = async (f: string) => (await kiraciIcinde(havuz, f, (db) => db.sorgu<{ n: number }>("SELECT (SELECT count(*) FROM ekipman_turu) + (SELECT count(*) FROM rapor_format) + (SELECT count(*) FROM dosya) AS n"))).rows[0].n;
  const once = await say(B);
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => bakanlikKurulumu(db, depo)), { kurulan: 0, atlanan: 0, pdf: 0, baglanti: 0, varsayilan: 0 });
  assert.equal(await say(B), once);
  /* A: 436 testinde ZPKR03'ten tür açılmıştı (YKT) — o şablon atlanır, YKT ikinci kez açılmaz; B değişmez */
  const r2 = await kiraciIcinde(havuz, A, (db) => bakanlikKurulumu(db, depo));
  assert.equal(r2.kurulan + r2.atlanan, 9);
  assert.ok(r2.atlanan >= 1, JSON.stringify(r2));
  assert.equal((await a(ELK, (db) => db.sorgu("SELECT 1 FROM ekipman_turu WHERE kod = 'YKT'"))).rowCount, 1);
  /* 438: firmanın kendi açtığı Bakanlık şablonlu PDF'siz türüne (436'daki YKT) resmî PDF eklendi · 440: boş standart ve cihazı tamamlandı */
  assert.ok(r2.pdf >= 1 && r2.baglanti >= 1, JSON.stringify(r2));
  const ykt = (await a(ELK, (db) => db.sorgu<{ s: string[]; c: string[] }>(
    "SELECT t.kontrol_std AS s, ARRAY(SELECT c.ad FROM cihaz_turu c WHERE c.id = ANY (t.cihaz_turleri)) AS c FROM ekipman_turu t WHERE t.kod = 'YKT'"))).rows[0];
  assert.deepEqual(ykt, { s: formatStandartlari("ZPKR03"), c: [CIHAZ_TOPRAKLAMA] });
  assert.deepEqual((await a(ELK, (db) => db.sorgu<{ sira: number; ad: string; notu: string }>(
    `SELECT tf.sira, d.ad, tf.notu FROM tur_format tf JOIN ekipman_turu t ON t.id = tf.tur_id JOIN dosya d ON d.id = tf.dosya_id WHERE t.kod = 'YKT'`))).rows,
    [{ sira: 1, ad: "ZPKR03.pdf", notu: "Bakanlık formatı" }]);
  assert.equal(await say(B), once, "başka firmaya dokunmaz");
  /* aynı anda iki istek (yeni firma): danışma kilidi — tek kurulum */
  const s = kume.sahipIstemci(); await s.connect();
  let C: string;
  try { C = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-c', 'Deneme C', 'DC') RETURNING id")).rows[0].id; } finally { await s.end(); }
  const ikisi = await Promise.all([0, 1].map(() => kiraciIcinde(havuz, C, (db) => bakanlikKurulumu(db, depo))));
  assert.equal(ikisi[0].kurulan + ikisi[1].kurulan, 9, JSON.stringify(ikisi));
  assert.equal((await kiraciIcinde(havuz, C, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM ekipman_turu"))).rows[0].n, 9);
  /* sıfırdan: boş iskelet, kaynak yok, başlık türün adından; kilit yok → yayınlanır (boş madde listesi yalnız uyarı) */
  const tur = await yeniTur("B");
  const bos = tamam(await b(MEK_B, (db) => taslakBaslat(db, MEK_B, tur, "bos", null)));
  const d = (await b(MEK_B, (db) => formatAyrintisi(db, MEK_B, bos.id)))!;
  assert.equal(d.kaynak, null);
  assert.match(d.tanim!.gorunum.baslik, /^Deneme Tesisat R[A-Z] Periyodik Kontrol Raporu$/);
  assert.deepEqual(d.denetim?.engeller, []);
  const y = tamam(await b(MEK_B, (db) => yayinla(db, MEK_B, bos.id, bos.surum, "")));
  assert.equal(y.sira, 1);
  assert.deepEqual(await b(kisi(MEK_B.id, "denetci"), (db) => taslakBaslat(db, kisi(MEK_B.id, "denetci"), tur, "bos", null)), { durum: "yetkisiz" }, "denetçi sıfırdan açamaz");
});

/* 2026-10-09 (438; canlıda firma ZPKR02'yi kendi türünde kullanıyordu, PDF'i yoktu): "Şablondan başlat" / "Tür olarak ekle" sonrası türe Bakanlığın
   resmî PDF'i — yalnız tür ve format değiştirebilene, yalnız Bakanlık şablonunda, yalnız türün hiç PDF'i yokken (bir kez). */
test("438 / 440 Bakanlık varsayılanları: PDF'siz türe resmî PDF, boş bağlantıya standart + cihaz, bir kez; yetkisize, genel şablona hayır; firmanın seçimine dokunulmaz", async () => {
  const depo = klasorDepo(mkdtempSync(join(tmpdir(), "resmi-pdf-")));
  const YOK = { pdf: false, baglanti: false };
  const pdfler = async (tur: string) => (await a(ELK, (db) => db.sorgu<{ ad: string }>(
    "SELECT d.ad FROM tur_format tf JOIN dosya d ON d.id = tf.dosya_id WHERE tf.tur_id = $1 ORDER BY tf.sira", [tur]))).rows.map((x) => x.ad);
  const baglanti = async (tur: string) => (await a(ELK, (db) => db.sorgu<{ s: string[]; c: string[] }>(
    "SELECT t.kontrol_std AS s, ARRAY(SELECT c.ad FROM cihaz_turu c WHERE c.id = ANY (t.cihaz_turleri) ORDER BY c.ad) AS c FROM ekipman_turu t WHERE t.id = $1", [tur]))).rows[0];
  const tur = await yeniTur();
  tamam(await a(ELK, (db) => taslakBaslat(db, ELK, tur, "sablon:ZPKR04", null)));
  for (const k of [PLAN, DENETCI, MUH]) assert.deepEqual(await a(k, (db) => bakanlikTamamla(db, depo, k, A, tur)), YOK, k.roller.join());
  assert.deepEqual(await pdfler(tur), [], "yetkisiz eklemedi");
  assert.deepEqual(await baglanti(tur), { s: [], c: [] }, "yetkisiz bağlamadı");
  assert.deepEqual(await a(ELK, (db) => bakanlikTamamla(db, depo, ELK, A, tur)), { pdf: true, baglanti: true });
  assert.deepEqual(await pdfler(tur), ["ZPKR04.pdf"]);
  assert.deepEqual(await baglanti(tur), { s: formatStandartlari("ZPKR04"), c: [CIHAZ_LUKSMETRE] });
  assert.deepEqual(await a(ELK, (db) => bakanlikTamamla(db, depo, ELK, A, tur)), YOK, "ikinci kez hiçbir şey");
  /* genel şablon (kompresör) ve şablonsuz tür: hiçbir şey */
  const genel = await yeniTur();
  tamam(await a(ELK, (db) => taslakBaslat(db, ELK, genel, "sablon:KOMPRESOR", null)));
  assert.deepEqual(await a(ELK, (db) => bakanlikTamamla(db, depo, ELK, A, genel)), YOK);
  const sablonsuz = await yeniTur();
  assert.deepEqual(await a(ELK, (db) => bakanlikTamamla(db, depo, ELK, A, sablonsuz)), YOK);
  /* firmanın kendi PDF'i ve seçtiği cihazı olan türe dokunulmaz (boş standart yine tamamlanır) */
  const kendi = await yeniTur();
  tamam(await a(ELK, (db) => formatYukle(db, depo, ELK as TurKisi, A, kendi, { ad: "kendi.pdf", bayt: readFileSync(join(import.meta.dirname, "..", "src", "tanim", "bakanlik", "ZPKK01.pdf")) }, "")));
  const lk = (await a(ELK, (db) => db.sorgu<{ id: string; surum: number }>("SELECT c.id::text, t.surum FROM cihaz_turu c, ekipman_turu t WHERE c.ad = $1 AND t.id = $2", [CIHAZ_LUKSMETRE, kendi]))).rows[0];
  tamam(await a(ELK, (db) => baglantiKaydet(db, ELK as TurKisi, kendi, lk.surum, { standartlar: [], cihazTurleri: [lk.id] })));
  tamam(await a(ELK, (db) => taslakBaslat(db, ELK, kendi, "sablon:ZPKR01", null)));
  assert.deepEqual(await a(ELK, (db) => bakanlikTamamla(db, depo, ELK, A, kendi)), { pdf: false, baglanti: true });
  assert.deepEqual(await pdfler(kendi), ["kendi.pdf"]);
  assert.deepEqual(await baglanti(kendi), { s: formatStandartlari("ZPKR01"), c: [CIHAZ_LUKSMETRE] }, "firmanın cihaz seçimi kaldı");
  /* başka firmanın türü: görünmez, değişmez */
  assert.deepEqual(await b(MEK_B, (db) => bakanlikTamamla(db, depo, MEK_B, B, tur)), YOK);
});

/* 2026-10-09 (450; reisim: "standart olarak pdf formatı yükleyin diyor hala yeni tür ekleyince, default olarak makette yaptıklarımız gibi olacak"):
   yeni türe Ek-III grubuna göre hazır format, YAYINDA sürüm 1 (kaynaksız, kilitsiz; yayın denetiminde uyarı bile yok) — rapor hemen açılır;
   bir kez; yetkisize, sürümü olan türe ve başka firmaya hayır; hazır kurulum formatı hiç olmayan ESKİ türleri bir kez tamamlar. */
test("450 yeni türün hazır formatı: grubuna göre, yayında; bir kez; yetkisize / sürümü olana / başka firmaya hayır; kurulum eski türleri tamamlar", async () => {
  for (const g of GRUPLAR) {
    const t = grupFormati({ ad: `Deneme ${g.ad}`, grup: g.k });
    assert.deepEqual(yayinDenetimi(t), [], g.k);
    assert.ok(!t.bolumler.some((b) => b.kilit), `${g.k}: kilit yok`);
  }
  assert.equal((grupFormati({ ad: "Vinç", grup: "kaldirma" }).bolumler.find((b) => b.id === "kriter") as BolumOf<"liste">).gruplar[0].maddeler.length, 7);
  const tur = await yeniTur();
  for (const k of [PLAN, DENETCI, MUH]) assert.equal(await a(k, (db) => yeniTureFormat(db, k, tur)), null, k.roller.join());
  assert.equal(await a(MEK, (db) => yayindakiFormat(db, tur)), null);
  const id = await a(MEK, (db) => yeniTureFormat(db, MEK, tur));
  assert.ok(id);
  const y = (await a(MEK, (db) => yayindakiFormat(db, tur)))!;
  assert.equal(y.sira, 1);
  assert.deepEqual(y.tanim.bolumler.map((b) => b.id), ["firma", "ekipman", "cihaz", "kriter", "test", "foto", "kusur", "yorum", "sonuc", "imza"]);
  assert.equal((y.tanim.bolumler[3] as BolumOf<"liste">).gruplar[0].maddeler[0].metin, "Koruma iletkeni sürekliliği", "elektrik grubunun maddeleri");
  assert.match(y.tanim.gorunum.baslik, /^Deneme Tesisat R[A-Z] Periyodik Kontrol Raporu$/);
  const d = (await a(MEK, (db) => formatAyrintisi(db, MEK, id!)))!;
  assert.deepEqual([d.kaynak, d.notu, d.durum], [null, VARSAYILAN_NOT, "yayinda"]);
  assert.equal(await a(MEK, (db) => yeniTureFormat(db, MEK, tur)), null, "ikinci kez yok");
  const taslakli = await yeniTur();
  tamam(await a(MEK, (db) => taslakBaslat(db, MEK, taslakli, "bos", null)));
  assert.equal(await a(MEK, (db) => yeniTureFormat(db, MEK, taslakli)), null, "taslağı olan türe dokunulmaz");
  const bTur = await yeniTur("B");
  assert.equal(await a(MEK, (db) => yeniTureFormat(db, MEK, bTur)), null, "başka firmanın türü görünmez");
  assert.equal(await b(MEK_B, (db) => yayindakiFormat(db, bTur)), null);
  /* hazır kurulum: yeni firmanın formatı olmayan eski türü bir kez tamamlanır */
  const s = kume.sahipIstemci(); await s.connect();
  let D: string;
  try { D = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-d', 'Deneme D', 'DD') RETURNING id")).rows[0].id; } finally { await s.end(); }
  const MEK_D = kisi(await hesapli(D, "mekanik@deneme-d.example", ["mekanik_yonetici"]), "mekanik_yonetici");
  const eski = tamam(await kiraciIcinde(havuz, D, (db) => turKaydet(db, MEK_D as TurKisi, null, 0, { ...T, ad: "Deneme Vinç", kod: "DV", grup: "kaldirma" }), { hesapId: MEK_D.id })).id;
  const depo = klasorDepo(mkdtempSync(join(tmpdir(), "varsayilan-")));
  const k1 = await kiraciIcinde(havuz, D, (db) => bakanlikKurulumu(db, depo));
  assert.equal(k1.varsayilan, 1, JSON.stringify(k1));
  const ey = (await kiraciIcinde(havuz, D, (db) => yayindakiFormat(db, eski)))!;
  assert.equal((ey.tanim.bolumler.find((b) => b.id === "kriter") as BolumOf<"liste">).gruplar[0].maddeler[0].metin, "Taşıyıcı konstrüksiyon: çatlak, deformasyon, korozyon");
  assert.ok(ey.tanim.bolumler.some((b) => b.blok === "bilgi" && b.alanlar.some((x) => x.id === "kapasite")), "kaldırma: kapasite alanı");
  assert.equal((await kiraciIcinde(havuz, D, (db) => bakanlikKurulumu(db, depo))).varsayilan, 0, "ikinci kez yok");
});
