/* NEREDEN GELDİ: 09-D1 (yalnız değişen alan, `surum` ile iyimser kilit, sessiz ezme yok, yazma reddi görünür) · 09-D3 (her geçiş denetim izine:
   kim, ne zaman, eski, yeni, gerekçe) · KOD-GECIS §2 "Güvenli yazıcı", "Denetim izi" · reisim 2026-10-04: "kaynak koddan rol değiştirme sızma veri
   çalma gibi şeylere dikkat et". GERÇEK PostgreSQL'de (gömülü), İKİ FİRMA, uygulama rolüyle. Deneme tablosu `hesap` (0002).
   Olumsuz kanıt: tests/bozan/yazici.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { ekle, guncelle, izYaz, tablo } from "../src/server/db/yazici.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string, YON: string;

const HESAP = tablo({ ad: "hesap", sutunlar: ["eposta", "ad", "roller", "durum", "parola_ozeti"], gizli: ["parola_ozeti"] });
const IZ = { kim: "Deneme Yönetici", ne: "personel.guncelle" };

async function iz(firma: string, nesneId: string) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ kim: string; ne: string; hesap_id: string | null; eski: Record<string, unknown> | null; yeni: Record<string, unknown> | null; gerekce: string | null; zaman: Date }>(
    "SELECT kim, ne, hesap_id::text, eski, yeni, gerekce, zaman FROM denetim_izi WHERE nesne = 'hesap' AND nesne_id = $1 ORDER BY id", [nesneId]))).rows;
}
const kisiEkle = (firma: string, eposta: string, hesapId?: string) => kiraciIcinde(havuz, firma, (db) =>
  ekle(db, HESAP, { eposta, ad: "Deneme Kişi", roller: ["denetci"], durum: "etkin" }, { kim: "Deneme Yönetici", ne: "personel.ekle" }), { hesapId });

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  try {
    [A, B] = (await sahip.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await sahip.end(); }
  YON = (await kisiEkle(A, "yonetici@deneme.example")).id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("ekle: yalnız tanımlı sütunlar; kimlik ve sürüm veritabanından; ize 'yeni' düşer, kim işlem bağlamından", async () => {
  const { id, surum } = await kisiEkle(A, "ekle@deneme.example", YON);
  assert.equal(surum, 0);
  const [s] = await iz(A, id);
  assert.equal(s.ne, "personel.ekle");
  assert.equal(s.hesap_id, YON);
  assert.deepEqual(s.yeni, { eposta: "ekle@deneme.example", ad: "Deneme Kişi", roller: ["denetci"], durum: "etkin" });
  assert.equal(s.eski, null);
});

test("guncelle: yalnız DEĞİŞEN alan yazılır, sürüm artar, ize eski / yeni + gerekçe; değişiklik yoksa yazma da iz de yok", async () => {
  const { id } = await kisiEkle(A, "guncelle@deneme.example");
  const r = await kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 0, { ad: "Yeni Ad", roller: ["denetci"] }, { ...IZ, gerekce: "ad düzeltildi" }), { hesapId: YON });
  assert.deepEqual(r, { durum: "tamam", surum: 1, degisen: ["ad"] });
  const izler = await iz(A, id);
  assert.equal(izler.length, 2);
  assert.deepEqual(izler[1].eski, { ad: "Deneme Kişi" });
  assert.deepEqual(izler[1].yeni, { ad: "Yeni Ad" });
  assert.equal(izler[1].gerekce, "ad düzeltildi");
  assert.equal(izler[1].hesap_id, YON);
  const ayni = await kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 1, { ad: "Yeni Ad", roller: ["denetci"] }, IZ));
  assert.deepEqual(ayni, { durum: "degisiklik_yok", surum: 1 });
  assert.equal((await iz(A, id)).length, 2, "değişmeyen kayıt ize düşmez");
});

test("İYİMSER KİLİT: eski sürümle yazma reddedilir (sessiz ezme yok); aynı anda iki yazmadan yalnız biri geçer", async () => {
  const { id } = await kisiEkle(A, "kilit@deneme.example");
  assert.equal((await kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 0, { ad: "Birinci" }, IZ))).durum, "tamam");
  const eski = await kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 0, { ad: "Ezen" }, IZ));
  assert.deepEqual(eski, { durum: "cakisma", guncelSurum: 1 });
  const ad = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ ad: string }>("SELECT ad FROM hesap WHERE id = $1", [id]));
  assert.equal(ad.rows[0].ad, "Birinci");
  const sonuclar = await Promise.all(["Paralel-1", "Paralel-2", "Paralel-3"].map((a) =>
    kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 1, { ad: a }, IZ))));
  assert.equal(sonuclar.filter((s) => s.durum === "tamam").length, 1, JSON.stringify(sonuclar));
  assert.equal(sonuclar.filter((s) => s.durum === "cakisma").length, 2);
});

test("SIZMA: tanım dışı sütun, korunan sütun ve SQL parçası SQL'e girmez (hata); rol değeri veritabanı kuralına takılır", async () => {
  const { id } = await kisiEkle(A, "sizma@deneme.example");
  for (const k of ["firma_id", "surum", "id", "hatali_deneme", "ad = 'x', roller", "__proto__", "Ad"]) {
    await assert.rejects(kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 0, { [k]: "x" } as never, IZ)), /Yazılamaz sütun/, k);
  }
  await assert.rejects(kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 0, JSON.parse('{"__proto__": {"x": 1}, "ad": "y"}'), IZ)), /Yazılamaz sütun/);
  assert.throws(() => tablo({ ad: "hesap", sutunlar: ["firma_id"] }), /Korunan sütun/);
  assert.throws(() => tablo({ ad: "hesap; DROP TABLE x", sutunlar: ["ad"] }), /Geçersiz tablo adı/);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => guncelle(db, { ad: "hesap x", sutunlar: ["ad"] }, id, 0, { ad: "y" }, IZ)), /Geçersiz tablo adı/);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 0, { roller: ["tanri"] }, IZ)), /check constraint/);
  assert.equal((await iz(A, id)).length, 1, "reddedilen yazma ize düşmez (işlem geri alındı)");
});

test("KİRACI: başka firmanın kaydı 'yok' (varlığı söylenmez); izi o firmaya düşmez", async () => {
  const { id } = await kisiEkle(B, "baska@deneme.example");
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 0, { ad: "Çalıntı" }, IZ)), { durum: "yok" });
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, "bozuk-kimlik", 0, { ad: "x" }, IZ)), { durum: "yok" });
  const r = await kiraciIcinde(havuz, B, (db) => db.sorgu<{ ad: string; surum: number }>("SELECT ad, surum FROM hesap WHERE id = $1", [id]));
  assert.deepEqual(r.rows[0], { ad: "Deneme Kişi", surum: 0 });
  assert.equal((await iz(A, id)).length, 0);
});

test("GİZLİ: parola özeti değişince ize yalnız 'gizli' yazılır, değer yazılmaz", async () => {
  const { id } = await kisiEkle(A, "gizli@deneme.example");
  await kiraciIcinde(havuz, A, (db) => guncelle(db, HESAP, id, 0, { parola_ozeti: "scrypt$32768$8$1$tuz$ozet" }, { kim: "Deneme", ne: "hesap.parola" }));
  const son = (await iz(A, id)).at(-1)!;
  assert.deepEqual(son.yeni, { parola_ozeti: "gizli" });
  assert.deepEqual(son.eski, { parola_ozeti: "gizli" });
  assert.ok(!JSON.stringify(await iz(A, id)).includes("scrypt"));
});

test("DENETİM İZİ değişmez: uygulama rolü değiştiremez / silemez; tablo sahibi bile tetiğe takılır; kim ve zaman uydurulamaz", async () => {
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE denetim_izi SET kim = 'x'")), /permission denied/);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("DELETE FROM denetim_izi")), /permission denied/);
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  try {
    await assert.rejects(sahip.query("UPDATE denetim_izi SET kim = 'x'"), /değiştirilemez/);
    await assert.rejects(sahip.query("DELETE FROM denetim_izi"), /değiştirilemez/);
    await assert.rejects(sahip.query("TRUNCATE denetim_izi"), /değiştirilemez/);
  } finally { await sahip.end(); }
  /* kod başka hesap ve geçmiş tarih yazmaya kalksa da veritabanı bağlamdakini ve şimdiki zamanı yazar */
  await kiraciIcinde(havuz, A, (db) => db.sorgu(
    "INSERT INTO denetim_izi (kim, ne, nesne, nesne_id, hesap_id, zaman) VALUES ('x', 'deneme.uydurma', 'hesap', 'uydurma-1', $1, '2020-01-01')", ["00000000-0000-4000-8000-000000000000"]), { hesapId: YON });
  const [s] = await iz(A, "uydurma-1");
  assert.equal(s.hesap_id, YON);
  assert.ok(Date.now() - s.zaman.getTime() < 60_000, "zaman veritabanının saati");
  await kiraciIcinde(havuz, A, (db) => izYaz(db, { kim: "x", ne: "deneme.bagilamsiz", nesne: "hesap", nesneId: "uydurma-2" }));
  assert.equal((await iz(A, "uydurma-2"))[0].hesap_id, null, "bağlam yoksa hesap boş (uydurulmaz)");
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("SELECT 1"), { hesapId: "bozuk" }), /Geçersiz hesap kimliği/);
});
