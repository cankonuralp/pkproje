/* NEREDEN GELDİ: 396 — çevrimdışı paket (ARKA-UC §4.2 "kullanıcı çevrimiçiyken kabul ettiği / denetimdeki planların önümüzdeki 7 günü cihaza iner";
   src/modules/planlar/server/cevrimdisi.ts). GERÇEK PostgreSQL, iki firma: paket YALNIZ kişinin ekibinde olduğu, kabul edilmiş ya da denetimdeki,
   başlangıcı önümüzdeki 7 gün içinde (ya da başlamış) planları ve bu planlarda KENDİ yazdığı Yeni raporları verir — kabul bekleyen, 7 günden
   sonraki, ekibinde olmadığı plan; başkasının ya da gönderilmiş raporu; başka firmanın planı GİRMEZ; personeli olmayan hesaba boş. Yalnız adres
   bilgisi (kimlik + numara) döner. Uçtan uca (bağlantı kesilip hiç açılmamış plan sayfası açılarak): e2e/cevrimdisi.spec.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { cevrimdisiPaketi } from "../src/modules/planlar/server/cevrimdisi.ts";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { raporOlustur, type Kisi } from "../src/modules/raporlar/server/raporlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A = "", B = "";
const klasor = mkdtempSync(join(tmpdir(), "paket-depo-"));
const depo = klasorDepo(klasor);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
let PLAN: Kisi, YON: Kisi, DEN: Kisi, DEN2: Kisi, PERSONELSIZ: Kisi, DEN_B: Kisi;
let denP = "", den2P = "", t1 = "", ekp: Record<string, string> = {};
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p), hesapId ? { hesapId } : {});
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]))).rows[0].id;
  return { id, ad, roller: roller as Kisi["roller"] };
}
const gun = (n: number) => { const d = new Date(`${bugunTr()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
async function plan(baslangic: string, ekip: string[], kabul: Kisi | null): Promise<string> {
  const id = tamam(await a(PLAN, (db) => planAc(db, depo, PLAN, A, { tesis: t1, baslangic, bitis: baslangic,
    ekip: ekip.map((p, i) => ({ personel: p, isgNo: `ISG-${baslangic}-${i}`, kaydet: false })) }))).id;
  if (kabul) tamam(await a(kabul, async (db) => planKabul(db, kabul, id, (await planIci(db, kabul, id))!.surum, true)));
  return id;
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('paket-a', 'Paket A', 'PA'), ('paket-b', 'Paket B', 'PB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  const q = async (firma: string, metin: string, p: unknown[] = []) => (await sql<{ id: string }>(firma, metin, p)).rows[0].id;
  denP = await q(A, "INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi', '2024-01-01', 'mak-muh', '123') RETURNING id::text");
  den2P = await q(A, "INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi İki', '2024-01-01', 'mak-muh', '124') RETURNING id::text");
  const denBP = await q(B, "INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi B', '2024-01-01', 'mak-muh', '125') RETURNING id::text");
  YON = await hesap(A, "yon@paket-a.example", ["firma_yoneticisi"], "Deneme Yönetici");
  PLAN = await hesap(A, "plan@paket-a.example", ["planlama"], "Deneme Planlama");
  DEN = await hesap(A, "den@paket-a.example", ["denetci"], "Deneme Denetçi", denP);
  DEN2 = await hesap(A, "den2@paket-a.example", ["denetci"], "Deneme Denetçi İki", den2P);
  PERSONELSIZ = await hesap(A, "p@paket-a.example", ["planlama"], "Deneme Personelsiz");
  DEN_B = await hesap(B, "den@paket-b.example", ["denetci"], "Deneme Denetçi B", denBP);
  const m1 = await q(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir Sanayi A.Ş.', 'Deneme Bir') RETURNING id::text");
  t1 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m1]);
  const ht = await q(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  for (const kod of ["HT-1", "HT-2", "HT-3"]) await q(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t1, ht, kod]);
  ekp = Object.fromEntries((await sql<{ kod: string; id: string }>(A, "SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
  await a(YON, async (db) => {
    const t = tamam(await taslakBaslat(db, YON, ht, "sablon:KOMPRESOR", null));
    tamam(await yayinla(db, YON, t.id, t.surum, ""));
  });
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("paket: yalnız kişinin ekibindeki kabul edilmiş / 7 gün içindeki planlar ve kendi Yeni raporları; başka firma ve personelsiz hesap boş", async () => {
  const icinde = await plan(bugunTr(), [denP, den2P], DEN);           // ekibinde, kabul, bugün
  const sonra = await plan(gun(5), [denP], DEN);                       // ekibinde, kabul, 5 gün sonra
  const uzak = await plan(gun(10), [denP], DEN);                       // 10 gün sonra: girmez
  const bekleyen = await plan(bugunTr(), [denP], null);                // kabul bekliyor: girmez
  const baskasinin = await plan(bugunTr(), [den2P], DEN2);             // ekibinde değil: girmez
  const benim = tamam(await a(DEN, (db) => raporOlustur(db, DEN, icinde, ekp["HT-1"]))).id;
  const gonderilmis = tamam(await a(DEN, (db) => raporOlustur(db, DEN, icinde, ekp["HT-2"]))).id;
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [gonderilmis], DEN.id);
  const ikincininki = tamam(await a(DEN2, (db) => raporOlustur(db, DEN2, icinde, ekp["HT-3"]))).id;
  const p = await a(DEN, (db) => cevrimdisiPaketi(db, DEN, bugunTr()));
  assert.deepEqual(p.planlar.map((x) => x.id).sort(), [icinde, sonra].sort());
  for (const x of [uzak, bekleyen, baskasinin]) assert.ok(!p.planlar.some((y) => y.id === x));
  assert.deepEqual(p.raporlar.map((x) => x.id), [benim], "yalnız kendi Yeni raporu");
  assert.ok(p.planlar.every((x) => /^P-/.test(x.no)) && p.raporlar.every((x) => x.no.startsWith("PA-")));
  assert.deepEqual(Object.keys(p.planlar[0]).sort(), ["id", "no"], "yalnız adres bilgisi");
  /* öteki denetçi: kendi planı ve raporu */
  const p2 = await a(DEN2, (db) => cevrimdisiPaketi(db, DEN2, bugunTr()));
  assert.deepEqual(p2.planlar.map((x) => x.id).sort(), [icinde, baskasinin].sort());
  assert.deepEqual(p2.raporlar.map((x) => x.id), [ikincininki]);
  /* personeli olmayan hesap ve başka firma: boş */
  assert.deepEqual(await a(PERSONELSIZ, (db) => cevrimdisiPaketi(db, PERSONELSIZ, bugunTr())), { planlar: [], raporlar: [] });
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => cevrimdisiPaketi(db, DEN_B, bugunTr()), { hesapId: DEN_B.id }), { planlar: [], raporlar: [] });
});
