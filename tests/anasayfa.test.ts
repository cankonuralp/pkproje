/* NEREDEN GELDİ: maket anasayfa.html M1 2. tur (reisim 41: "role göre ama herkes için bir anasayfa olmalı"; BOLUM inspector / planlama / mekyon /
   elkyon / yonetici) · KOD-GECIS §3 Ana sayfa (rol başına) · reisim 2026-10-04: "sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL,
   iki firma (332). Planlar ve ekipman süper kullanıcıyla, tetiksiz kurulur (ölçülen şey bölümlerin sayıları, listeleri ve görünürlüğü). */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { gunEkle } from "../src/modules/muhasebe/sema.ts";
import { anaSayfa, bugunTr, type AnaSayfa, type Kisi } from "../src/modules/anasayfa/server/anasayfa.ts";
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

test("planlama: kabul bekleyen, reddedilen, bugün başlayan, İSG-KATİP eksiği (el ile yazılan ID eksik değil); kontrolü yaklaşan ve açık planı olmayan tesisler; Plan aç", async () => {
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

test("firma sızıntısı: B'nin yöneticisi A'nın planlarını ve tesislerini görmez", async () => {
  const v = await a(YON_B, (db) => anaSayfa(db, YON_B), B);
  assert.deepEqual([sayi(v, "firma_yoneticisi", "Açık plan"), v.bolumler[0].liste!.kayitlar.length], [0, 0]);
});
