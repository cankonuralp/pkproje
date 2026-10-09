/* NEREDEN GELDİ: maket anasayfa.html M1 2. tur (reisim 41: "role göre ama herkes için bir anasayfa olmalı"; BOLUM inspector / planlama / mekyon /
   elkyon / yonetici) · KOD-GECIS §3 Ana sayfa (rol başına) · reisim 2026-10-04: "sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL,
   iki firma (332). Planlar ve ekipman süper kullanıcıyla, tetiksiz kurulur (ölçülen şey bölümlerin sayıları, listeleri ve görünürlüğü). */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { gunEkle } from "../src/modules/muhasebe/sema.ts";
import { anaSayfa, bugunTr, type AnaSayfa, type Kisi } from "../src/modules/anasayfa/server/anasayfa.ts";
import { isgEksikTakip, menuTakip, talepTakip } from "../src/modules/anasayfa/server/takip.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
let DEN: Kisi, PLAN: Kisi, YON: Kisi, MEK: Kisi, MUH: Kisi, IKI: Kisi, YON_B: Kisi;
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>, firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
async function sahip(metin: string, p: unknown[] = []): Promise<string> {
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("SET session_replication_role = replica"); return (await s.query<{ id: string }>(metin, p)).rows[0]?.id; } finally { await s.end(); }
}
const BUGUN = () => bugunTr();
const g = (n: number) => gunEkle(BUGUN(), n);
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = await sahip("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, $4, 'etkin', $5) RETURNING id::text", [firma, eposta, ad, roller, personel]);
  return { id, ad, roller: roller as Kisi["roller"] };
}
const sayi = (v: AnaSayfa, rol: string, ad: string) => v.bolumler.find((b) => b.rol === rol)!.yuzler.find((y) => y.ad === ad)!.sayi;

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  [A, B] = [await sahip("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text"),
    await sahip("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-b', 'Deneme B', 'DB') RETURNING id::text")];
  const per = (ad: string) => sahip("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, $2, '2024-01-01', 'mak-muh') RETURNING id::text", [A, ad]);
  const denP = await per("Deneme Denetçi"), digerP = await per("Deneme Öteki"), yonP = await per("Deneme Yönetici");
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"], "Deneme Denetçi", denP);
  await hesap(A, "diger@deneme-a.example", ["denetci"], "Deneme Öteki", digerP);
  PLAN = await hesap(A, "plan@deneme-a.example", ["planlama"], "Deneme Planlama");
  YON = await hesap(A, "yon@deneme-a.example", ["firma_yoneticisi"], "Deneme Yönetici", yonP);
  MEK = await hesap(A, "mek@deneme-a.example", ["mekanik_yonetici"], "Deneme Mekanik");
  MUH = await hesap(A, "muh@deneme-a.example", ["muhasebe"], "Deneme Muhasebe");
  IKI = await hesap(A, "iki@deneme-a.example", ["denetci", "planlama"], "Deneme İki Rol", await per("Deneme İki Rol"));
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"], "Deneme Yönetici B");
  const m = await sahip("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Bir A.Ş.', 'Deneme Bir') RETURNING id::text", [A]);
  const tesis = (ad: string) => sahip("INSERT INTO tesis (firma_id, musteri_id, ad, il) VALUES ($1, $2, $3, 'Kocaeli') RETURNING id::text", [A, m, ad]);
  const t1 = await tesis("Merkez"), t2 = await tesis("Depo"), t3 = await tesis("Uzak");
  const tur = await sahip("INSERT INTO ekipman_turu (firma_id, kod, ad, grup, brans, periyot) VALUES ($1, 'HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text", [A]);
  /* T2: sistem öncesi kontrolü 12 ay − 10 gün önce → sonraki 10 gün sonra; T3: uzak; T1'in açık planı var */
  const ek = (t: string, kod: string, dis: string) => sahip("INSERT INTO ekipman (firma_id, tesis_id, tur_id, kod, ekleyen, dis_kontrol) VALUES ($1, $2, $3, $4, 'x', $5) RETURNING id::text",
    [A, t, tur, kod, dis]);
  await ek(t1, "HT-1", gunEkle(g(5), -365)); await ek(t2, "HT-2", (() => { const d = new Date(`${g(10)}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 12); return d.toISOString().slice(0, 10); })());
  await ek(t3, "HT-3", g(-30));
  const plan = (no: string, t: string, gun: string, durum: string, ekip: [string, string | null][]) => sahip(`INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, durum,
      firma_adi, acan, kabul, kabul_eden, beyan, red, red_eden, red_gerekce)
    VALUES ($1, $2, $3, $4, $4, $5, 'Deneme Bir A.Ş.', 'Deneme', CASE WHEN $5 IN ('kabul', 'denetimde') THEN now() END, CASE WHEN $5 IN ('kabul', 'denetimde') THEN 'Deneme' END,
      CASE WHEN $5 IN ('kabul', 'denetimde') THEN 'Deneme tarafsızlık beyanı metni.' END, CASE WHEN $5 = 'reddedildi' THEN now() END,
      CASE WHEN $5 = 'reddedildi' THEN 'Deneme' END, CASE WHEN $5 = 'reddedildi' THEN 'Uygun değil' END) RETURNING id::text`, [A, no, t, gun, durum])
    .then(async (id) => { for (const [p, isg] of ekip) await sahip("INSERT INTO plan_ekip (firma_id, plan_id, personel_id, isg_no) VALUES ($1, $2, $3, $4) RETURNING id::text", [A, id, p, isg]); return id; });
  await plan("P-1026-001", t1, g(3), "bekliyor", [[denP, null]]);
  await plan("P-1026-002", t1, BUGUN(), "denetimde", [[denP, "ISG-1"]]);
  await plan("P-1026-003", t1, g(1), "reddedildi", [[digerP, null]]);
  await plan("P-1026-004", t1, BUGUN(), "kabul", [[digerP, null]]);
  /* 329–332 incelemesi: reddedilen plan ancak tesisin güncel planıysa sayılır — P-003'ün tesisinde sonra P-004 açıldı; P-005 Uzak'ın güncel planı */
  await plan("P-1026-005", t3, g(2), "reddedildi", [[digerP, null]]);
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("denetçi: kabul bekleyen ve denetimdeki planları, taslak / imza bekleyen raporları, zimmeti; yalnız KENDİ açık planları listede", async () => {
  const v = await a(DEN, (db) => anaSayfa(db, DEN));
  assert.deepEqual(v.bolumler.map((b) => b.rol), ["denetci"]);
  assert.equal(v.planAc, false);
  const b = v.bolumler[0];
  assert.deepEqual(b.yuzler.map((y) => [y.ad, y.sayi, y.not]), [["Kabul bekleyen plan", 1, `en yakını ${g(3).slice(8, 10)}.${g(3).slice(5, 7)}`], ["Denetimdeki plan", 1, "P-1026-002"],
    ["Taslak rapor", 0, "onaya gönderilmedi"], ["Son imzanı bekleyen", 0, "onaylandı, imza bekliyor"], ["Zimmetinde", 0, "uyarı yok"]]);
  assert.ok(b.liste?.tur === "plan");
  assert.deepEqual(b.liste.kayitlar.map((p) => [p.no, p.tesis, p.musteri, p.ekip, p.durum]),
    [["P-1026-002", "Merkez", "Deneme Bir", "Deneme Denetçi", "denetimde"], ["P-1026-001", "Merkez", "Deneme Bir", "Deneme Denetçi", "bekliyor"]]);
});

test("planlama: kabul bekleyen, reddedilen (yalnız tesisin güncel planı), bugün başlayan, İSG-KATİP eksiği (el ile yazılan ID eksik değil); kontrolü yaklaşan ve açık planı olmayan tesisler; Plan aç", async () => {
  const v = await a(PLAN, (db) => anaSayfa(db, PLAN));
  assert.deepEqual([v.bolumler.map((b) => b.rol), v.planAc], [["planlama"], true]);
  assert.deepEqual(["Kabul bekleyen plan", "Reddedilen plan", "Bugün başlayan plan", "İSG-KATİP eksiği"].map((x) => sayi(v, "planlama", x)), [1, 1, 2, 2]);
  const l = v.bolumler[0].liste!;
  assert.ok(l.tur === "tesis" && l.planAc);
  assert.deepEqual(l.kayitlar.map((t) => [t.tesis, t.sonraki, t.kalan, t.ekipman]), [["Depo", g(10), 10, 1]]);
  assert.equal(l.baslik, "Kontrolü 30 gün içinde gelen tesisler");
});

test("firma yöneticisi: açık plan, onayda / imza bekleyen rapor, uyarı, bilgisi eksik personel; bugün başlayan planlar", async () => {
  const v = await a(YON, (db) => anaSayfa(db, YON));
  assert.deepEqual(v.bolumler.map((b) => b.rol), ["firma_yoneticisi"]);
  assert.equal(sayi(v, "firma_yoneticisi", "Açık plan"), 3);
  assert.deepEqual(v.bolumler[0].liste!.kayitlar.map((p) => (p as { no: string }).no).sort(), ["P-1026-002", "P-1026-004"]);
  assert.ok(Number(sayi(v, "firma_yoneticisi", "Bilgisi eksik personel")) >= 1, "EKİPNET'i olmayan personel");
});

test("branş yöneticisi ve muhasebe bölümleri; çok rollü kişi rol bölümlerini sırayla görür (planlama, denetçi)", async () => {
  const m = await a(MEK, (db) => anaSayfa(db, MEK));
  assert.deepEqual([m.bolumler.map((b) => b.rol), sayi(m, "mekanik_yonetici", "Onayını bekleyen"), m.bolumler[0].liste?.tur], [["mekanik_yonetici"], 0, "kuyruk"]);
  const u = await a(MUH, (db) => anaSayfa(db, MUH));
  assert.deepEqual(u.bolumler.map((b) => [b.rol, b.yuzler.map((y) => y.sayi)]), [["muhasebe", [0, 0, 0]]]);
  const i = await a(IKI, (db) => anaSayfa(db, IKI));
  assert.deepEqual(i.bolumler.map((b) => b.rol), ["planlama", "denetci"]);
});

test("329–332 incelemesi: bölüm rolle açılır, veri modül düzeyiyle — Planlar 'kendi' yalnız ekibinde olduğu planlar, Müşteriler kapalıysa tesis listesi yok", async () => {
  const KISITLI = { ...PLAN, matris: { 13: ["kendi", "kendi", "gor", "gor", "yaz", "yok"], 3: ["yok", "gor", "gor", "gor", "yaz", "gor"] } } as Kisi;
  const v = await a(KISITLI, (db) => anaSayfa(db, KISITLI));
  assert.deepEqual(["Kabul bekleyen plan", "Reddedilen plan", "Bugün başlayan plan"].map((x) => sayi(v, "planlama", x)), [0, 0, 0], "planlama hesabının personeli ekipte değil");
  assert.equal(v.bolumler[0].liste, null);
});

test("329–332 incelemesi: mesai takibi açıksa denetçide 'Günlük süre' yüzü (kendi süresi)", async () => {
  await sahip(`INSERT INTO firma_ayar (firma_id, bolum, deger) VALUES ($1, 'mesai', '{"acik": true}') RETURNING id::text`, [A]);
  const y = (await a(DEN, (db) => anaSayfa(db, DEN))).bolumler[0].yuzler.find((x) => x.ad === "Günlük süre")!;
  assert.deepEqual([y.sayi, y.not, y.uyari], ["0 dk", "normal 0 / 480 · mesai 0 / 180", false]);
});

test("firma sızıntısı: B'nin yöneticisi A'nın planlarını ve tesislerini görmez", async () => {
  const v = await a(YON_B, (db) => anaSayfa(db, YON_B), B);
  assert.deepEqual([sayi(v, "firma_yoneticisi", "Açık plan"), v.bolumler[0].liste!.kayitlar.length], [0, 0]);
});

/* 339: yan menü takip balonları (maket MV.TAKIP) — kişiye ve modül düzeyine göre; 0 olan balon yok; başka firmanın verisi sayılmaz */
test("yan menü balonları: planlar (kabul bekleyen sarı, plan günü gelmiş kırmızı) kişiye göre, İSG-KATİP eksiği; kısıtlı düzey ve başka firma görmez", async () => {
  const denP = (await a(DEN, (db) => db.sorgu<{ id: string }>("SELECT personel_id::text AS id FROM hesap WHERE id = $1", [DEN.id]))).rows[0].id;
  const t1 = (await a(PLAN, (db) => db.sorgu<{ id: string }>("SELECT id::text FROM tesis WHERE ad = 'Merkez'"))).rows[0].id;
  const pid = await sahip(`INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, durum, firma_adi, acan) VALUES ($1, 'P-1026-006', $2, $3, $3, 'bekliyor', 'Deneme Bir A.Ş.', 'Deneme') RETURNING id::text`, [A, t1, g(-1)]);
  await sahip("INSERT INTO plan_ekip (firma_id, plan_id, personel_id, isg_no) VALUES ($1, $2, $3, 'ISG-9') RETURNING id::text", [A, pid, denP]);
  const d = await a(DEN, (db) => menuTakip(db, DEN));
  assert.deepEqual([d[13]?.kirmizi, d[13]?.sari], [1, 1], "denetçinin kendi planları: P-006 günü geçti, P-001 bekliyor");
  assert.equal(d[14], undefined, "Yeni raporu yok");
  /* 337–339 incelemesi (U4): planı atanan kabul eder — planlamacı firma genelini görür ama ekibinde olmadığı planın balonu yok */
  assert.equal((await a(PLAN, (db) => menuTakip(db, PLAN)))[13], undefined, "planlamacının kendi kabul edeceği plan yok");
  assert.equal((await a(YON, (db) => menuTakip(db, YON)))[13], undefined, "firma yöneticisi ekipte değil");
  const KISITLI = { ...PLAN, matris: { 13: ["kendi", "kendi", "gor", "gor", "yaz", "yok"] } } as Kisi;
  assert.equal((await a(KISITLI, (db) => menuTakip(db, KISITLI)))[13], undefined, "'kendi' düzeyi, ekipte değil: balon yok");
  assert.deepEqual(await a(YON_B, (db) => menuTakip(db, YON_B), B), {}, "B'de A'nın verisi yok");
  /* 449 (reisim 2026-10-09: "sözleşmeler kısmında 1 yazan bir uyarı var ama sebebini anlayamıyorum"): Sözleşmeler sayfası balonun planlarını
     gösterir — balonla aynı sayı, aynı süzgeç; el ile yazılmış ID'li plan listede yok */
  const y = await a(YON, (db) => menuTakip(db, YON)), yl = await a(YON, (db) => isgEksikTakip(db, YON));
  assert.ok(yl.length > 0 && yl.every((p) => p.no && p.firmaAdi === "Deneme Bir A.Ş." && p.eksik > 0), "planlar no ve firmayla");
  assert.equal(yl.reduce((n, p) => n + p.eksik, 0), y[12]?.kirmizi, "sayfadaki planların toplamı = balon");
  assert.ok(yl.some((p) => p.no === "P-1026-001") && !yl.some((p) => p.no === "P-1026-002" || p.no === "P-1026-006"), "ID'siz plan var, ID'li yok");
  assert.match(y[12]!.ad.kirmizi, /İSG-KATİP SÖZLEŞME ID/);
  assert.deepEqual(await a(YON_B, (db) => isgEksikTakip(db, YON_B), B), [], "B'de A'nın planı yok");
});

/* 337–339 incelemesi (N5): Onaylar balonu yalnız kişinin ONAYLAYABİLDİĞİ raporları sayar — firma yöneticisi kuyruğu görür, onaylamaz: balon yok */
test("Onaylar balonu: onaydaki rapor branş yöneticisinde sayılır, firma yöneticisinde sayılmaz", async () => {
  const [tur, plan, ek, denP] = await a(YON, async (db) => [
    (await db.sorgu<{ id: string }>("SELECT id::text FROM ekipman_turu WHERE kod = 'HT'")).rows[0].id,
    (await db.sorgu<{ id: string }>("SELECT id::text FROM plan WHERE no = 'P-1026-002'")).rows[0].id,
    (await db.sorgu<{ id: string }>("SELECT id::text FROM ekipman WHERE kod = 'HT-1'")).rows[0].id,
    (await db.sorgu<{ id: string }>("SELECT personel_id::text AS id FROM hesap WHERE id = $1", [DEN.id])).rows[0].id]);
  const format = await a(YON, async (db) => {
    const x = await taslakBaslat(db, YON, tur, "sablon:KOMPRESOR", null);
    assert.equal(x.durum, "tamam");
    const y = await yayinla(db, YON, (x as { id: string }).id, (x as { surum: number }).surum, "");
    assert.equal(y.durum, "tamam");
    return (x as { id: string }).id;
  });
  await sahip(`INSERT INTO rapor (firma_id, no, plan_id, ekipman_id, tur_id, format_id, personel_id, hesap_id, durum, kunye, ilk_gonderim, gonderildi)
    VALUES ($1, 'DA-1026-901-00001', $2, $3, $4, $5, $6, $7, 'onayda', '{}', now() - interval '2 hours', now() - interval '2 hours') RETURNING id::text`,
    [A, plan, ek, tur, format, denP, DEN.id]);
  const m = await a(MEK, (db) => menuTakip(db, MEK));
  assert.deepEqual([m[15]?.kirmizi, m[15]?.sari], [0, 1], "mekanik yönetici onaylar");
  assert.equal((await a(YON, (db) => menuTakip(db, YON)))[15], undefined, "firma yöneticisi onaylamaz");
});

/* 337–339 incelemesi (karar 236, maket MV.TAKIP[23]): Araçlar balonu kilometre + belge; yönetici bütün araçları, sürücü yalnız kendi aracını */
test("Araçlar balonu: geçen hafta girilmeyen kilometre ve süresi geçen muayene kırmızı; sürücü kendi aracı, yönetici hepsi, öteki kimse", async () => {
  const denP = (await a(DEN, (db) => db.sorgu<{ id: string }>("SELECT personel_id::text AS id FROM hesap WHERE id = $1", [DEN.id]))).rows[0].id;
  const arac = await sahip("INSERT INTO arac (firma_id, plaka, tur, marka, model, yil, yakit, muayene) VALUES ($1, '00 DNM 001', 'Kamyon', 'D', 'M', 2020, 'dizel', $2) RETURNING id::text",
    [A, g(-3)]);
  await sahip("INSERT INTO zimmet_hareket (firma_id, arac_id, alan_personel, zaman, km) VALUES ($1, $2, $3, now() - interval '30 days', 1000) RETURNING id::text", [A, arac, denP]);
  await sahip("INSERT INTO arac (firma_id, plaka, tur, marka, model, yil, yakit, sigorta) VALUES ($1, '00 DNM 002', 'Kamyon', 'D', 'M', 2020, 'dizel', $2) RETURNING id::text",
    [A, g(10)]);
  const d = await a(DEN, (db) => menuTakip(db, DEN));
  assert.deepEqual([d[23]?.kirmizi, d[23]?.sari], [2, 0], "sürücü: kendi aracı — km eksik + muayene geçti");
  assert.match(d[23]!.ad.kirmizi, /geçen hafta girilmeyen kilometre/);
  const y = await a(YON, (db) => menuTakip(db, YON));
  assert.deepEqual([y[23]?.kirmizi, y[23]?.sari], [2, 1], "yönetici: bütün araçlar — depodaki aracın yaklaşan sigortası sarı");
  assert.equal((await a(PLAN, (db) => menuTakip(db, PLAN)))[23], undefined, "planlama: kendi aracı yok");
  assert.equal((await a(MUH, (db) => menuTakip(db, MUH)))[23], undefined, "muhasebe Araçlar'ı görmez");
  assert.equal((await a(YON_B, (db) => menuTakip(db, YON_B), B))[23], undefined, "B'de A'nın aracı yok");
});

/* 456 (reisim 2026-10-09: "Talpelerde 3 yazıyor baloncuk içinde ama tıklayınca hiç bir şey gözükmüyor"): Talepler sayfası balonun taleplerini
   gösterir — balonla aynı süzgeç (izin talebi: karar veren firma yöneticisi), sayısı balonla aynı; talep eden kendi balonunda görmez */
test("456 Talepler balonu: onay bekleyen talepler sayfada, sayısı balonla aynı; talep eden ve başka firma görmez", async () => {
  const denP = (await a(DEN, (db) => db.sorgu<{ id: string }>("SELECT personel_id::text AS id FROM hesap WHERE id = $1", [DEN.id]))).rows[0].id;
  await a(DEN, (db) => db.sorgu("INSERT INTO izin_talebi (no, personel_id, tur, bas, bit, gun) VALUES ('I-1026-901', $1, 'yillik', $2, $2, 1) RETURNING id::text", [denP, g(20)]));
  const l = await a(YON, (db) => talepTakip(db, YON));
  assert.ok(l.some((x) => x.tip === "izin" && x.no === "I-1026-901" && x.kisi), JSON.stringify(l));
  assert.equal((await a(YON, (db) => menuTakip(db, YON)))[21]?.sari, l.length, "sayfadaki talepler = balon");
  assert.deepEqual(await a(DEN, (db) => talepTakip(db, DEN)), [], "talep eden karar vermez");
  assert.deepEqual(await a(YON_B, (db) => talepTakip(db, YON_B), B), [], "B'de A'nın talebi yok");
});
