/* NEREDEN GELDİ: 496 — hata listesi 29 + 46 maketi onaylandı (reisim 2026-10-11: "maketi onaylıyorum … gelişmiş seçenekler tuşu olsun"); maketteki
   "Parça olarak kaydet": firmanın kendi bölümü bütün formatlarında parça kutusunda. reisim 2026-10-04: "kaynak koddan rol değiştirme, sızma, veri
   çalma; yetki her zaman sunucuda; istemciden gelen kimlik ve sürüm yetki vermez". GERÇEK PostgreSQL, iki firma (göç 0080 format_parca):
   · kaydı yalnız modül 5'te "yaz" olan (branş / firma yöneticisi) yapar; denetçi, planlama yetkisiz ve listesi boş;
   · istemciden gelen bölüm şemadan ve parcaHazirla'dan geçer: Bakanlık işareti silinir; ölçüm cihazları / ekipman bilgileri / bozuk bölüm reddedilir;
   · firma yalnız kendi parçalarını görür ve siler (RLS); başka firmaya satır yazılamaz;
   · parça değişmez (uygulama rolünün UPDATE'i yok, sahibinde tetik durdurur), DELETE'i yok; kesin silme yalnız yönetici, denetim izinde;
   · firma başına en çok 200 parça. Saf kurallar: tests/yapboz.test.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi } from "../src/format/tanim.ts";
import { firmaParcalari, PARCA_EN_COK, parcaKaydet, parcaSil, type Kisi } from "../src/modules/rapor-format/server/parcalar.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let MEK: Kisi, DENETCI: Kisi, PLAN: Kisi, MEK_B: Kisi;
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const b = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
const Z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const OLCUM = Z.bolumler.find((x) => x.blok === "olcum" && x.kilit)!;
const LISTE = Z.bolumler.find((x) => x.blok === "liste")!;

async function hesapli(firma: string, eposta: string, rol: string) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, [rol]]))).rows[0].id;
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('parca-a', 'Deneme A', 'PA'), ('parca-b', 'Deneme B', 'PB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  MEK = kisi(await hesapli(A, "mekanik@parca-a.example", "mekanik_yonetici"), "mekanik_yonetici");
  DENETCI = kisi(await hesapli(A, "denetci@parca-a.example", "denetci"), "denetci");
  PLAN = kisi(await hesapli(A, "planlama@parca-a.example", "planlama"), "planlama");
  MEK_B = kisi(await hesapli(B, "mekanik@parca-b.example", "mekanik_yonetici"), "mekanik_yonetici");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

let ilk = "";

test("kaydet: Bakanlık bölümü firmanın parçası olur — işaretsiz, adı verilen; listede yalnız o firmada", async () => {
  const r = await a(MEK, (db) => parcaKaydet(db, MEK, "  Benim linye tablom  ", OLCUM));
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  if (r.durum !== "tamam") return;
  ilk = r.id;
  assert.equal(r.ad, "Benim linye tablom");
  const l = await a(MEK, (db) => firmaParcalari(db, MEK));
  assert.deepEqual(l.map((p) => [p.id, p.ad, p.bolum.ad, p.bolum.kilit, p.bolum.blok]), [[ilk, "Benim linye tablom", "Benim linye tablom", false, "olcum"]]);
  const lb = l[0].bolum;
  assert.ok(lb.blok === "olcum" && OLCUM.blok === "olcum");
  assert.deepEqual(lb.sutunlar.map((s) => s.id), OLCUM.sutunlar.map((s) => s.id), "tablonun sütunları olduğu gibi");
  /* ad boşsa bölümün adı; kontrol listesinin maddeleri Bakanlık işaretsiz */
  const l2 = await a(MEK, (db) => parcaKaydet(db, MEK, "", LISTE));
  assert.equal(l2.durum === "tamam" && l2.ad, LISTE.ad);
  const kayit = (await a(MEK, (db) => firmaParcalari(db, MEK))).find((p) => p.ad === LISTE.ad)!.bolum;
  assert.ok(kayit.blok === "liste" && kayit.gruplar.every((g) => g.maddeler.every((m) => !m.kilit)));
  /* öteki firma görmez */
  assert.deepEqual(await b(MEK_B, (db) => firmaParcalari(db, MEK_B)), []);
  assert.equal((await b(MEK_B, (db) => db.sorgu("SELECT 1 FROM format_parca"))).rowCount, 0, "RLS");
  /* denetim izi: bölümün tanımı yazılmaz, yalnız "değişti" */
  const iz = (await a(MEK, (db) => db.sorgu<{ ne: string; kim: string }>("SELECT ne, kim FROM denetim_izi WHERE nesne = 'format_parca' AND nesne_id = $1", [ilk]))).rows;
  assert.deepEqual(iz, [{ ne: "format_parca.kaydet", kim: "Deneme" }]);
});

test("kaydet reddi: yetkisiz rol, parça olamayan / bozuk bölüm, uzun ad", async () => {
  for (const k of [DENETCI, PLAN]) {
    assert.deepEqual(await a(k, (db) => parcaKaydet(db, k, "x", LISTE)), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => firmaParcalari(db, k)), []);
  }
  const cihaz = { id: "cihaz", ad: "Ölçüm cihazları", blok: "cihaz", kilit: false };
  const ekipman = Z.bolumler.find((x) => x.blok === "bilgi" && x.id === "ekipman") ?? { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: false, tam: true, alanlar: [] };
  for (const kotu of [cihaz, ekipman, { blok: "olcum" }, "metin", null, { ...LISTE, blok: "yok" }]) {
    const r = await a(MEK, (db) => parcaKaydet(db, MEK, "Kötü", kotu));
    assert.equal(r.durum, "gecersiz", JSON.stringify(kotu).slice(0, 80));
  }
  assert.equal((await a(MEK, (db) => parcaKaydet(db, MEK, "x".repeat(201), LISTE))).durum, "gecersiz");
});

test("değişmez ve sızdırmaz: güncelleme tetikte düşer, uygulama rolü silemez, başka firmaya satır yazılamaz, başka firmanın parçası silinmez", async () => {
  /* uygulama rolünün UPDATE hakkı yok; sahibinde de tetik durdurur (başka bir yol açılsa da parça değişmez) */
  await assert.rejects(a(MEK, (db) => db.sorgu("UPDATE format_parca SET ad = 'değişti' WHERE id = $1", [ilk])), /permission denied|izin/i);
  const sahip = kume.sahipIstemci(); await sahip.connect();
  try { await assert.rejects(sahip.query("UPDATE format_parca SET ad = 'değişti' WHERE id = $1", [ilk]), /değişmez/); } finally { await sahip.end(); }
  await assert.rejects(a(MEK, (db) => db.sorgu("DELETE FROM format_parca WHERE id = $1", [ilk])), /permission denied|izin/i);
  await assert.rejects(b(MEK_B, (db) => db.sorgu("INSERT INTO format_parca (firma_id, ad, bolum, olusturan) VALUES ($1, 'x', '{}'::jsonb, 'x')", [A])),
    /row-level security|satır düzeyi/i);
  assert.deepEqual(await b(MEK_B, (db) => parcaSil(db, MEK_B, ilk)), { durum: "yok" });
  assert.equal((await a(MEK, (db) => firmaParcalari(db, MEK))).length, 2, "A'nın parçası duruyor");
});

test("sil: yalnız yönetici; parça gider, denetim izinde; olmayan / bozuk kimlik yok", async () => {
  assert.deepEqual(await a(DENETCI, (db) => parcaSil(db, DENETCI, ilk)), { durum: "yetkisiz" });
  assert.deepEqual(await a(MEK, (db) => parcaSil(db, MEK, ilk)), { durum: "tamam", id: ilk, ad: "Benim linye tablom" });
  assert.ok(!(await a(MEK, (db) => firmaParcalari(db, MEK))).some((p) => p.id === ilk));
  const iz = (await a(MEK, (db) => db.sorgu<{ eski: Record<string, unknown> }>("SELECT eski FROM denetim_izi WHERE ne = 'format_parca.sil' AND nesne_id = $1", [ilk]))).rows;
  assert.equal(iz.length, 1);
  assert.equal(iz[0].eski.ad, "Benim linye tablom");
  assert.equal(iz[0].eski.bolum, undefined, "tanım izde yok");
  assert.deepEqual(await a(MEK, (db) => parcaSil(db, MEK, ilk)), { durum: "yok" });
  assert.deepEqual(await a(MEK, (db) => parcaSil(db, MEK, "kimlik-degil")), { durum: "yok" });
});

test(`firma başına en çok ${PARCA_EN_COK} parça`, async () => {
  const var_ = (await a(MEK, (db) => firmaParcalari(db, MEK))).length;
  await a(MEK, (db) => db.sorgu("INSERT INTO format_parca (ad, bolum, olusturan) SELECT 'p' || g, $1::jsonb, 'Deneme' FROM generate_series(1, $2::int) g",
    [JSON.stringify(LISTE), PARCA_EN_COK - var_]));
  const r = await a(MEK, (db) => parcaKaydet(db, MEK, "Fazla", LISTE));
  assert.equal(r.durum, "gecersiz");
  assert.match(r.durum === "gecersiz" ? r.neden : "", /en çok 200/);
  assert.equal((await a(MEK, (db) => firmaParcalari(db, MEK))).length, PARCA_EN_COK);
  assert.deepEqual(await b(MEK_B, (db) => firmaParcalari(db, MEK_B)), [], "öteki firmayı etkilemez");
});
