/* NEREDEN GELDİ: maket performans.html M15 (pano, kişi, 148 denetçi kendi sayıları kazançsız) · KOD-GECIS §3 "Performans (19): tablo yok — rapor ve
   durum geçişlerinden özet; rapor Yeni'den itibaren sayılır", §4 Performans satırı (planlama görür · denetçi kendi · branş yöneticileri branşı ·
   firma yöneticisi görür · muhasebe —) · reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki
   firma (329). Raporlar süper kullanıcıyla, tetiksiz ve zamanları elle verilerek kurulur (açılış, gönderim, geri gönderme, onay, imza) — ölçülen
   şey okuma ve hesap. Saf hesap tests/performans-hesap.test.ts; olumsuz kanıt tests/bozan/performans.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { gunEkle } from "../src/modules/muhasebe/sema.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { bugunTr, performansKisi, performansPanosu, type Kisi, type KisiPerformansi, type PerformansPanosu } from "../src/modules/performans/server/performans.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
let YON: Kisi, PLAN: Kisi, MEK: Kisi, ELK: Kisi, MUH: Kisi, DEN: Kisi, DEN_E: Kisi, YON_B: Kisi;
let denM: string, denE: string, denX: string;
const R: Record<string, string> = {};
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>, firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const sql = async (firma: string, metin: string, p: unknown[] = []) => (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(metin, p))).rows[0]?.id;
async function sahip(metin: string, p: unknown[] = []): Promise<string> {
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("SET session_replication_role = replica"); return (await s.query<{ id: string }>(metin, p)).rows[0]?.id; } finally { await s.end(); }
}
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = (await sql(firma, "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]))!;
  return { id, ad, roller: roller as Kisi["roller"] };
}
const BUGUN = () => bugunTr();
const g = (n: number) => gunEkle(BUGUN(), -n);
const z = (gun: string, saat: string) => `${gun}T${saat}:00+03:00`;
const ARALIK = () => ({ donem: "aralik", bas: g(9), bit: BUGUN() });
const pano = async (k: Kisi, s: object = ARALIK(), firma = A) => (await a(k, (db) => performansPanosu(db, k, s), firma)) as PerformansPanosu;
const kisi = async (k: Kisi, id: string, s: object = ARALIK(), firma = A) => a(k, (db) => performansKisi(db, k, id, s), firma);

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  denM = (await sql(A, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Mekanikçi', '2024-01-01', 'mak-muh') RETURNING id::text"))!;
  denE = (await sql(A, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Elektrikçi', '2024-01-01', 'elk-muh') RETURNING id::text"))!;
  denX = (await sql(A, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Hesapsız', '2024-01-01', 'mak-muh') RETURNING id::text"))!;
  YON = await hesap(A, "yon@deneme-a.example", ["firma_yoneticisi"], "Deneme Yönetici");
  PLAN = await hesap(A, "plan@deneme-a.example", ["planlama"], "Deneme Planlama");
  MEK = await hesap(A, "mek@deneme-a.example", ["mekanik_yonetici"], "Deneme Mekanik Yön");
  ELK = await hesap(A, "elk@deneme-a.example", ["elektrik_yonetici"], "Deneme Elektrik Yön");
  MUH = await hesap(A, "muh@deneme-a.example", ["muhasebe"], "Deneme Muhasebe");
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"], "Deneme Mekanikçi", denM);
  DEN_E = await hesap(A, "dene@deneme-a.example", ["denetci"], "Deneme Elektrikçi", denE);
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"], "Deneme Yönetici B");
  const m = (await sql(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir A.Ş.', 'Deneme Bir') RETURNING id::text"))!;
  const t = (await sql(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m]))!;
  const ht = (await sql(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text"))!;
  const el = (await sql(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('IT', 'İç tesisat', 'elektrik', 'e', 12) RETURNING id::text"))!;
  await sql(A, "INSERT INTO fiyat_listesi (tur_id, fiyat) VALUES ($1, 100000), ($2, 50000) RETURNING id::text", [ht, el]);
  const format = await a(YON, async (db) => {
    const x = await taslakBaslat(db, YON, ht, "sablon:KOMPRESOR", null);
    assert.equal(x.durum, "tamam");
    const y = await yayinla(db, YON, (x as { id: string }).id, (x as { surum: number }).surum, "");
    assert.equal(y.durum, "tamam");
    return (x as { id: string }).id;
  });
  const plan = (no: string, gun: string) => sahip(`INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, durum, firma_adi, acan, kabul, kabul_eden, beyan)
    VALUES ($1, $2, $3, $4, $4, 'kabul', 'Deneme Bir A.Ş.', 'Deneme', now(), 'Deneme', 'Deneme tarafsızlık beyanı metni.') RETURNING id::text`, [A, no, t, gun]);
  const P1 = await plan("P-1026-001", g(2)), P0 = await plan("P-0826-001", g(40));
  let sira = 0;
  /* rapor: zamanlar elle; imza varsa imzalı sürüm; hareketler (gonder / geri) sırayla */
  const rapor = async (o: { plan: string; tur: string; personel: string; hesap: Kisi; durum: string; olustu: string; ilk?: string; gonderildi?: string; onay?: string;
    imza?: string; hareket?: [string, string][]; silindi?: boolean }) => {
    sira++;
    const e = await sahip("INSERT INTO ekipman (firma_id, tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, $4, 'x') RETURNING id::text", [A, t, o.tur, `EK-${sira}`]);
    const no = `DA-1026-${String(sira).padStart(3, "0")}-0000${sira % 10}`;
    const id = await sahip(`INSERT INTO rapor (firma_id, no, plan_id, ekipman_id, tur_id, format_id, personel_id, hesap_id, durum, kunye, olustu, ilk_gonderim, gonderildi, onay, silindi)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '{}', $10, $11, $12, $13, $14) RETURNING id::text`,
      [A, no, o.plan, e, o.tur, format, o.personel, o.hesap.id, o.durum, o.olustu, o.ilk ?? null, o.gonderildi ?? null, o.onay ?? null, o.silindi ? o.olustu : null]);
    if (o.imza) await sahip(`INSERT INTO rapor_surumu (firma_id, rapor_id, revizyon, no, plan_id, ekipman_id, tur_id, format_id, tesis_id, musteri_id, imzasiz_dosya, imzali_dosya,
      imzali_sha256, imza_yontem, sonuc, kontrol_tarihi, kunye, personel, icerik, imzalandi) VALUES ($1, $2, 0, $3, $4, $5, $6, $7, $8, $9, gen_random_uuid(), gen_random_uuid(),
      repeat('0', 64), 'dosya', 'uygun', current_date, '{}', '{}', '{}', $10) RETURNING id::text`, [A, id, no, o.plan, e, o.tur, format, t, m, o.imza]);
    for (const [ne, zaman] of o.hareket ?? []) await sahip("INSERT INTO rapor_hareket (firma_id, rapor_id, ne, zaman) VALUES ($1, $2, $3, $4) RETURNING id::text", [A, id, ne, zaman]);
    return id;
  };
  R.r1 = await rapor({ plan: P1, tur: ht, personel: denM, hesap: DEN, durum: "imzali", olustu: z(g(2), "08:00"), ilk: z(g(2), "10:00"), gonderildi: z(g(2), "10:00"),
    onay: z(g(2), "12:00"), imza: z(g(2), "20:00"), hareket: [["gonder", z(g(2), "10:00")]] });   // 12 saat
  R.r2 = await rapor({ plan: P1, tur: ht, personel: denM, hesap: DEN, durum: "imzali", olustu: z(g(2), "09:00"), ilk: z(g(2), "12:00"), gonderildi: z(g(1), "09:00"),
    onay: z(g(1), "10:00"), imza: z(g(0), "08:00"), hareket: [["gonder", z(g(2), "12:00")], ["geri", z(g(2), "14:00")], ["gonder", z(g(1), "09:00")]] });   // 47 saat
  R.r3 = await rapor({ plan: P1, tur: ht, personel: denM, hesap: DEN, durum: "taslak", olustu: z(g(1), "08:00") });
  R.r4 = await rapor({ plan: P1, tur: el, personel: denE, hesap: DEN_E, durum: "imzali", olustu: z(g(2), "08:00"), ilk: z(g(2), "09:00"), gonderildi: z(g(2), "09:00"),
    onay: z(g(2), "10:00"), imza: z(g(0), "10:00") });   // 50 saat
  R.r5 = await rapor({ plan: P1, tur: el, personel: denE, hesap: DEN_E, durum: "taslak", olustu: z(g(1), "08:00"), silindi: true });
  R.r6 = await rapor({ plan: P0, tur: ht, personel: denM, hesap: DEN, durum: "taslak", olustu: z(g(40), "08:00"), ilk: z(g(40), "10:00"), gonderildi: z(g(40), "10:00"),
    hareket: [["gonder", z(g(40), "10:00")], ["geri", z(g(1), "10:00")]] });   // dönem dışında açılmış, dönemde geri gönderilmiş
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("yetki (modül 19): firma yöneticisi ve planlama hepsini; muhasebe göremez; firma matrisi açarsa görür (istemciden rol gelmez)", async () => {
  for (const k of [YON, PLAN]) assert.ok((await pano(k)).kisiler.length >= 2, k.roller[0]);
  assert.equal(await a(MUH, (db) => performansPanosu(db, MUH, ARALIK())), null);
  assert.equal(await kisi(MUH, denM), null);
  const acik = { ...MUH, matris: { 19: ["gor", "kendi", "brans", "brans", "gor", "gor"] } as never };
  assert.ok((await pano(acik)).kisiler.some((x) => x.id === denM), "firma matrisinde muhasebeye 'gör'");
});

test("pano: rapor Yeni'den sayılır, silinen sayılmaz; kişi × gün, gün başı, kazanç (fiyat listesi), geri gönderilen (dönemde), tamamlanma süresi, günlük grafik", async () => {
  const v = await pano(YON);
  assert.deepEqual([v.donem.kod, v.donem.bas, v.donem.bit, v.donem.grup, v.brans, v.bransSecilir, v.kazanc, v.aralikHata], ["aralik", g(9), BUGUN(), "gun", "tumu", true, true, null]);
  assert.deepEqual([v.ozet.rapor, v.ozet.gun, Math.round(v.ozet.ort * 100) / 100, v.ozet.kazanc, v.ozet.gunKazanc, v.ozet.geri, v.ozet.son], [4, 3, 1.33, 350000, 116667, 2, g(1)]);
  assert.deepEqual(v.ozet.sure, { n: 3, h24: 1, h48: 1, h48p: 1, pay: 33 });
  assert.deepEqual(v.zaman.map((x) => [x.etiket, x.m, x.e, x.kazanc]), [[`${g(2).slice(8, 10)}.${g(2).slice(5, 7)}`, 2, 1, 250000], [`${g(1).slice(8, 10)}.${g(1).slice(5, 7)}`, 1, 0, 100000]]);
  const k = new Map(v.kisiler.map((x) => [x.id, x]));
  assert.deepEqual([...k.keys()].sort(), [denE, denM].sort(), "denetçiler (hesapsız personel rapor yazmadıysa yok)");
  const m = k.get(denM)!.o, e = k.get(denE)!.o;
  assert.deepEqual([m.rapor, m.gun, m.kazanc, m.geri, m.sure.n, m.sure.h24, m.sure.h48], [3, 2, 300000, 2, 2, 1, 1]);
  assert.deepEqual([e.rapor, e.gun, e.kazanc, e.geri, e.sure.h48p, k.get(denE)!.meslek, k.get(denE)!.brans], [1, 1, 50000, 0, 1, "Elektrik mühendisi", "e"]);
  const ey = await pano(YON, { ...ARALIK(), brans: "e" });
  assert.deepEqual([ey.brans, ey.ozet.rapor, ey.kisiler.map((x) => x.id)], ["e", 1, [denE]], "branş anahtarı");
  const hata = await pano(YON, { donem: "aralik", bas: g(-1), bit: g(-1) });
  assert.deepEqual([hata.aralikHata, hata.donem.kod], ["Bitiş bugünden sonra olamaz.", "ay"], "geçersiz aralık: hata + bu ay");
  assert.equal((await pano(YON, { donem: "yil" })).donem.grup, "ay");
});

test("branş yöneticisi yalnız branşının raporlarını ve kişilerini görür; branş anahtarını değiştiremez; başka branşın kişisi bulunamaz", async () => {
  const m = await pano(MEK, { ...ARALIK(), brans: "e" });
  assert.deepEqual([m.brans, m.bransSecilir, m.ozet.rapor, m.ozet.kazanc, m.ozet.geri, m.kisiler.map((x) => x.id)], ["m", false, 3, 300000, 2, [denM]]);
  const e = await pano(ELK);
  assert.deepEqual([e.brans, e.ozet.rapor, e.ozet.sure.h48p, e.kisiler.map((x) => x.id)], ["e", 1, 1, [denE]]);
  assert.equal(await kisi(MEK, denE), null, "başka branşın kişisi");
  assert.equal((await kisi(MEK, denM))!.ozet.rapor, 3);
});

test("denetçi ('kendi'): pano yerine kendi sayfası; yalnız kendi raporları, kazanç yok (kazanç verisi de gelmez); başkasının sayfası bulunamaz", async () => {
  const p = await a(DEN, (db) => performansPanosu(db, DEN, ARALIK()));
  assert.deepEqual(p, { kendi: denM });
  const v = (await kisi(DEN, denM))!;
  assert.deepEqual([v.kendi, v.kazanc, v.ozet.rapor, v.ozet.kazanc, v.ozet.gunKazanc, v.gunluk.every((x) => x.kazanc === 0), v.zaman.every((x) => x.kazanc === 0)],
    [true, false, 3, 0, 0, true, true]);
  assert.equal(await kisi(DEN, denE), null);
  assert.equal(await kisi(DEN_E, denM), null);
});

test("kişi sayfası: süreç adımları (yazım, düzeltme, onay, son imza — ortalama saat) ve günlük iş (gün × tesis, iş no, imzalı)", async () => {
  const v = (await kisi(YON, denM)) as KisiPerformansi;
  assert.deepEqual([v.kisi.ad, v.kisi.meslek, v.kisi.brans, v.kendi, v.kazanc], ["Deneme Mekanikçi", "Makine mühendisi", "m", false, true]);
  assert.deepEqual(v.surec, [{ ad: "Yazım", ort: 2.5, n: 2 }, { ad: "Düzeltme", ort: 19, n: 1 }, { ad: "Onay", ort: 1.5, n: 2 }, { ad: "Son imza", ort: 15, n: 2 }]);
  assert.deepEqual(v.gunluk.map((x) => [x.gun, x.tesis, x.musteri, x.isler.map((y) => y.no), x.rapor, x.imzali, x.kazanc]),
    [[g(1), "Merkez", "Deneme Bir", ["P-1026-001"], 1, 0, 100000], [g(2), "Merkez", "Deneme Bir", ["P-1026-001"], 2, 2, 200000]]);
  assert.equal(await kisi(YON, "00000000-0000-4000-8000-000000000009"), null);
  assert.equal(await kisi(YON, "x"), null);
});

test("firma sızıntısı: B, A'nın kişilerini ve raporlarını görmez; A'nın kişi sayfası B'de bulunamaz", async () => {
  const v = await pano(YON_B, ARALIK(), B);
  assert.deepEqual([v.kisiler, v.ozet.rapor, v.zaman], [[], 0, []]);
  assert.equal(await kisi(YON_B, denM, ARALIK(), B), null);
  void denX;
});
