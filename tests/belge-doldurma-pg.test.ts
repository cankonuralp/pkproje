/* NEREDEN GELDİ: 2026-10-25 — reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri için
   sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim". Elle doldurulan yerlerin değerleri göç 0105 belge_doldurma'da
   (kayıt başına tek satır, sürüm kilidi, silinmez, belgesi / kaydı değişmez) — src/modules/rapor-format/server/doldurma.ts. Kilitler: yayında
   format yokken "formatsiz"; ilk yazma (sürümsüz) → okuma; görmeden ikinci ilk yazma ve eski sürümle yazma çakışma; değerler yayındaki formatın
   elle yerlerine göre denetlenir (formatta olmayan anahtar, biçim) ve saklanan biçimde yazılır; format_id yayındaki sürüm; denetim izine değer
   yazılmaz; kiracı izolasyonu (iki firma); veritabanı silmeye ve belgeyi / kaydı değiştirmeye izin vermez. GERÇEK PostgreSQL. Saf parçalar:
   tests/belge-doldurma.test.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { FormatTanimi } from "../src/format/tanim.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { belgeTaslakAc, belgeTaslakKaydet, belgeYayinla } from "../src/modules/rapor-format/server/belgeler.ts";
import { belgeDoldurmaKaydet, belgeDoldurmasi } from "../src/modules/rapor-format/server/doldurma.ts";
import type { Kisi } from "../src/modules/rapor-format/server/formatlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let MEK: Kisi, MEK_B: Kisi;
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

async function hesapli(firma: string, eposta: string, rol: string) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, [rol]]))).rows[0].id;
}
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const b = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: k.id });

/* sözleşme formatı: iki elle yer (yazı, tarih) */
const SOZLESME_FORMU = FormatTanimi.parse({
  sema: 1, gorunum: { serbest: true }, bolumler: [{
    id: "b1", ad: "Form", blok: "tablo", sutun: [40, 60], satirlar: [{}, {}],
    hucreler: [
      { r: 0, c: 0, tur: "yazi", m: "Müşteri yetkilisi" }, { r: 0, c: 1, tur: "alan", id: "c_yetkili", alan: "metin" },
      { r: 1, c: 0, tur: "yazi", m: "İmza günü" }, { r: 1, c: 1, tur: "alan", id: "c_gun", alan: "tarih" },
    ],
  }],
});
/** firmanın sözleşme formatını yayınlar (boş taslak → elle yerli tanım → yayın); yayındaki sürümün kimliği */
async function yayinla(firma: string, k: Kisi, tanim: FormatTanimi): Promise<string> {
  return kiraciIcinde(havuz, firma, async (db) => {
    const t = tamam(await belgeTaslakAc(db, k, "sozlesme", "bos", null));
    const g = tamam(await belgeTaslakKaydet(db, k, t.id, t.surum, tanim));
    tamam(await belgeYayinla(db, k, t.id, g.surum, ""));
    return t.id;
  }, { hesapId: k.id });
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('doldur-a', 'Deneme A', 'DA'), ('doldur-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  MEK = kisi(await hesapli(A, "mekanik@doldur-a.example", "mekanik_yonetici"), "mekanik_yonetici");
  MEK_B = kisi(await hesapli(B, "mekanik@doldur-b.example", "mekanik_yonetici"), "mekanik_yonetici");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("formatsız → ilk yazma → okuma → sürüm kilidi (görmeden ilk yazma, eski sürüm çakışır) → güncelleme; format_id yayındaki; değer ize yazılmaz", async () => {
  const kayit = randomUUID();
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, { c_yetkili: "Deneme" }, null)), { durum: "formatsiz" });
  assert.equal(await a(MEK, (db) => belgeDoldurmasi(db, "sozlesme", kayit)), null);

  const formatId = await yayinla(A, MEK, SOZLESME_FORMU);
  const ilk = tamam(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, { c_yetkili: "  Deneme Yetkili ", c_gun: "05.10.2026" }, null)));
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmasi(db, "sozlesme", kayit)), { degerler: { c_yetkili: "Deneme Yetkili", c_gun: "2026-10-05" }, surum: ilk.surum },
    "saklanan biçim");
  const satir = (await a(MEK, (db) => db.sorgu<{ format_id: string; dolduran: string; belge: string }>(
    "SELECT format_id::text, dolduran, belge FROM belge_doldurma WHERE kayit_id = $1", [kayit]))).rows;
  assert.deepEqual(satir, [{ format_id: formatId, dolduran: "Deneme", belge: "sozlesme" }]);

  /* görmeden ikinci ilk yazma ve eski sürüm çakışır; gördüğü sürümle güncellenir */
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, { c_yetkili: "Başka" }, null)), { durum: "cakisma" });
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, { c_yetkili: "Başka" }, ilk.surum + 3)), { durum: "cakisma" });
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", randomUUID(), { c_yetkili: "Başka" }, 0)), { durum: "cakisma" }, "olmayan doldurmanın sürümü");
  const ikinci = tamam(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, { c_yetkili: "Deneme İkinci" }, ilk.surum)));
  assert.ok(ikinci.surum > ilk.surum);
  assert.deepEqual((await a(MEK, (db) => belgeDoldurmasi(db, "sozlesme", kayit)))?.degerler, { c_yetkili: "Deneme İkinci" }, "boş bırakılan yer silinir");
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, { c_yetkili: "x" }, ilk.surum)), { durum: "cakisma" }, "eski sürüm");

  const iz = (await a(MEK, (db) => db.sorgu<{ yeni: Record<string, unknown> | null; eski: Record<string, unknown> | null }>(
    "SELECT yeni, eski FROM denetim_izi WHERE nesne = 'belge_doldurma' AND ne = 'belge_doldurma.kaydet' ORDER BY id"))).rows;
  assert.equal(iz.length, 2);
  assert.ok(iz.every((x) => x.yeni?.degerler === "gizli"), JSON.stringify(iz));
  assert.ok(!JSON.stringify(iz).includes("Deneme Yetkili") && !JSON.stringify(iz).includes("Deneme İkinci"), "değer ize yazılmaz");
});

test("geçersiz: formatta olmayan anahtar, biçim, uzunluk, yazı olmayan değer, bilinmeyen belge / kayıt — hiçbir şey yazılmaz", async () => {
  const kayit = randomUUID();
  const kaydet = (girdi: unknown) => a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, girdi, null));
  assert.deepEqual(await kaydet({ c_yok: "x" }), { durum: "gecersiz", hatalar: { c_yok: "Formda böyle bir yer yok." } });
  assert.deepEqual(await kaydet({ c_gun: "31.02.2026" }), { durum: "gecersiz", hatalar: { c_gun: "Geçerli bir tarih yazın (GG.AA.YYYY)." } });
  assert.deepEqual(await kaydet({ c_yetkili: "a".repeat(2001) }), { durum: "gecersiz", hatalar: { c_yetkili: "En çok 2000 karakter." } });
  assert.deepEqual(await kaydet({ c_yetkili: ["dizi"] }), { durum: "gecersiz", hatalar: { c_yetkili: "Değer yazı olmalı." } });
  assert.deepEqual(await kaydet("c_yetkili=x"), { durum: "gecersiz", hatalar: { degerler: "Değerler okunamadı." } });
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "rapor" as never, kayit, {}, null)), { durum: "gecersiz", hatalar: { belge: "Belge bulunamadı." } });
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", "' OR 1=1 --", {}, null)), { durum: "gecersiz", hatalar: { kayit: "Kayıt bulunamadı." } });
  assert.equal(await a(MEK, (db) => belgeDoldurmasi(db, "sozlesme", "' OR 1=1 --")), null);
  assert.equal((await a(MEK, (db) => db.sorgu("SELECT 1 FROM belge_doldurma WHERE kayit_id = $1", [kayit]))).rowCount, 0, "geçersiz girdi yazılmadı");
  /* başka belgenin formatı yok: o belge için doldurma formatsız */
  assert.deepEqual(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "teklif", kayit, { c_yetkili: "x" }, null)), { durum: "formatsiz" });
});

test("veritabanı: silinmez, belgesi / kaydı değişmez, bilinmeyen belge yazılmaz, boyut sınırı", async () => {
  const kayit = randomUUID();
  tamam(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, { c_yetkili: "Deneme" }, null)));
  const sorgu = (q: string, p: unknown[] = []) => a(MEK, (db) => db.sorgu(q, p));
  await assert.rejects(sorgu("DELETE FROM belge_doldurma WHERE kayit_id = $1", [kayit]), /permission denied|izin/i);
  await assert.rejects(sorgu("UPDATE belge_doldurma SET belge = 'teklif' WHERE kayit_id = $1", [kayit]), /belgesi değişmez/);
  await assert.rejects(sorgu("UPDATE belge_doldurma SET kayit_id = $2 WHERE kayit_id = $1", [kayit, randomUUID()]), /belgesi değişmez/);
  await assert.rejects(sorgu("INSERT INTO belge_doldurma (belge, kayit_id, degerler, dolduran) VALUES ('rapor', $1, '{}', 'x')", [randomUUID()]), /belge_doldurma_belge_check|check/i);
  await assert.rejects(sorgu("INSERT INTO belge_doldurma (belge, kayit_id, degerler, dolduran) VALUES ('sozlesme', $1, '{}', 'x')", [kayit]), /duplicate|yinelenen|unique/i,
    "kayıt başına tek satır");
  await assert.rejects(sorgu("INSERT INTO belge_doldurma (belge, kayit_id, degerler, dolduran) VALUES ('sozlesme', $1, '[]', 'x')", [randomUUID()]), /check/i, "değerler nesne");
});

test("kiracı izolasyonu: başka firmanın doldurması görünmez, değiştirilemez; aynı kayıt kimliği her firmada ayrı; başka firmaya satır yazılamaz", async () => {
  const kayit = randomUUID();
  tamam(await a(MEK, (db) => belgeDoldurmaKaydet(db, MEK, "sozlesme", kayit, { c_yetkili: "Deneme A" }, null)));
  assert.equal(await b(MEK_B, (db) => belgeDoldurmasi(db, "sozlesme", kayit)), null, "B görmez");
  assert.equal((await b(MEK_B, (db) => db.sorgu("SELECT 1 FROM belge_doldurma"))).rowCount, 0, "RLS");
  assert.deepEqual(await b(MEK_B, (db) => belgeDoldurmaKaydet(db, MEK_B, "sozlesme", kayit, { c_yetkili: "Deneme B" }, null)), { durum: "formatsiz" },
    "A'nın formatı B'de yok");
  /* B kendi formatını yayınlar: aynı kayıt kimliğiyle kendi satırı, A'nınki değişmez */
  await yayinla(B, MEK_B, SOZLESME_FORMU);
  tamam(await b(MEK_B, (db) => belgeDoldurmaKaydet(db, MEK_B, "sozlesme", kayit, { c_yetkili: "Deneme B" }, null)));
  assert.deepEqual((await a(MEK, (db) => belgeDoldurmasi(db, "sozlesme", kayit)))?.degerler, { c_yetkili: "Deneme A" });
  assert.deepEqual((await b(MEK_B, (db) => belgeDoldurmasi(db, "sozlesme", kayit)))?.degerler, { c_yetkili: "Deneme B" });
  await assert.rejects(b(MEK_B, (db) => db.sorgu("INSERT INTO belge_doldurma (firma_id, belge, kayit_id, degerler, dolduran) VALUES ($1, 'sozlesme', $2, '{}', 'x')",
    [A, randomUUID()])), /row-level security|satır düzeyi/i);
  assert.equal((await b(MEK_B, (db) => db.sorgu("UPDATE belge_doldurma SET dolduran = 'x' WHERE firma_id = $1", [A]))).rowCount, 0, "A'nın satırı B'ye görünmez");
});
