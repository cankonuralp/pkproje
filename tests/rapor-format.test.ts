/* NEREDEN GELDİ: RAPOR-FORMAT.md §3 ("Bakanlık formatlı türde zorunlu alanlar kilitli — silinemez … eksikse yayınlanmaz"), §5 ("taslak → yayınla
   (v1, v2 …); açık raporlar başladıkları sürümle kalır; eski sürümler saklanır — imzalı raporun PDF'i o sürümle yeniden üretilir"), §7
   (rapor_format kiracı süzgeçli) · KOD-GECIS §3, §4 (Ekipman türleri: branş yöneticileri + firma yöneticisi değiştirir; planlama, denetçi görür;
   muhasebe görmez), §5 ("Rapor formatı: taslak → yayında") · reisim 2026-10-04: "kaynak koddan rol değiştirme, sızma, veri çalma; yetki her
   zaman sunucuda; istemciden gelen kimlik ve sürüm yetki vermez". GERÇEK PostgreSQL, iki firma (308). */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { turKaydet, type Kisi as TurKisi } from "../src/modules/ekipman-turleri/server/turler.ts";
import {
  formatAyrintisi, formatSurumleri, formatSurumuOku, sablondanTurEkle, sablonKullanimi, taslakBaslat, taslakKaydet, yayinDenetle, yayindakiFormat, yayinla, type Kisi,
} from "../src/modules/rapor-format/server/formatlar.ts";
import { MATRIS_ONERI } from "../src/server/yetki/tanim.ts";
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
