/* NEREDEN GELDİ: maket planlarim.html (4.–5. tur: akış Planlandı → Kabul → Denetim → Tamamlama, tarafsızlık beyanı, Reddet gerekçe, kontrol listesi
   iki adım, Tamamlamayı geri al, Ekipman ekle iki yol + kod mesajları, pasife al, Proje notları) · pkproje §3.4 (karar 9–12, 26–28, "Plan künyesi":
   denetçiye kendiliğinden geçmez, Güncelle) · KOD-GECIS §4 (plan_kabul_red yalnız atanan; Ekipman "yaz") · reisim 2026-10-04: "rol değiştirme, sızma,
   veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (310). */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { VARSAYILAN_BEYAN } from "../src/server/ayar/ayar.ts";
import {
  denetimeBasla, ekipmanPasif, kayitliEkle, kodDurumu, kontrolListesi, kunyeDuzenle, kunyeGuncelle, notEkle, planIci, planKabul, planListesi, planReddet,
  planTamamla, tamamlamaGeriAl, yeniEkipman, type PlanYazma,
} from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { MATRIS_ONERI } from "../src/server/yetki/tanim.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "plan-ici-depo-"));
const depo = klasorDepo(klasor);
const SGK = "2".repeat(26);
const bugun = bugunTr();
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
const tamam = (r: PlanYazma) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<PlanYazma, { durum: "tamam" }>; };

interface Firma { plan: Kisi; yon: Kisi; mek: Kisi; muh: Kisi; den1: Kisi; den2: Kisi; den1P: string; den2P: string; tesis: string; tesis2: string; tur: string; ek: string }
let FA: Firma, FB: Firma;

async function firmaKur(firma: string, ek: string): Promise<Firma> {
  return kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Sanayi A.Ş.', 'Deneme') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Merkez', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, SGK]);
    const tesis2 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Depo') RETURNING id::text", [m]);
    const per = (ad: string) => q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ($1, '2024-01-01', 'mak-muh', '123') RETURNING id::text", [ad]);
    const hes = (eposta: string, roller: string[], personel: string | null) =>
      q("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@${ek}.example`, roller, personel]);
    const den1P = await per("Deneme Bir"), den2P = await per("Deneme İki");
    const den1 = kisi(await hes("den1", ["denetci"], den1P), "denetci");
    const den2 = kisi(await hes("den2", ["denetci"], den2P), "denetci");
    const plan = kisi(await hes("plan", ["planlama"], null), "planlama");
    const yon = kisi(await hes("yon", ["firma_yoneticisi"], null), "firma_yoneticisi");
    const mek = kisi(await hes("mek", ["mekanik_yonetici"], null), "mekanik_yonetici");
    const muh = kisi(await hes("muh", ["muhasebe"], null), "muhasebe");
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
    for (const [t, kod] of [[tesis, "HT-A1"], [tesis, "HT-A2"], [tesis2, "HT-B1"]]) await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t, tur, kod]);
    return { plan, yon, mek, muh, den1, den2, den1P, den2P, tesis, tesis2, tur, ek };
  });
}
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const b = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = []) => kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p));
const ekipmanId = async (firma: string, kod: string) => (await sql<{ id: string }>(firma, "SELECT id::text FROM ekipman WHERE kod = $1", [kod])).rows[0].id;

/** planlamacı tesise plan açar, ekipte yalnız den1 */
async function yeniPlan(f: Firma, firma: string, tesis = f.tesis) {
  const k = (h: Kisi, is: (db: Sorgulayici) => Promise<unknown>) => kiraciIcinde(havuz, firma, is, { hesapId: h.id });
  const r = (await k(f.plan, (db) => planAc(db, depo, f.plan, firma, { tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: f.den1P, isgNo: "ISG-1", kaydet: false }] }))) as { durum: string; id: string };
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  return r.id;
}
const ici = (k: Kisi, id: string) => a(k, (db) => planIci(db, k, id));

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "deneme-a");
  FB = await firmaKur(B, "deneme-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("akış: kabul yalnız ekipteki denetçi ve beyanla → denetim → kontrol listesi → tamamla ⇄ geri al; geçiş ve damgalar veritabanında", async () => {
  const id = await yeniPlan(FA, A);
  let v = (await ici(FA.den1, id))!;
  assert.deepEqual(v.ekipman.map((e) => [e.kod, e.sonradan]).sort(), [["HT-A1", false], ["HT-A2", false]], "plan açılırken tesisin etkin ekipmanı plana girer");
  assert.deepEqual(v.teklif.map((t) => [t.ad, t.planlanan, t.planda]), [["Hava tankı", 2, 2]]);
  assert.equal(v.beyan, VARSAYILAN_BEYAN);
  assert.equal(v.izin.kabulRed, true);
  assert.equal((await ici(FA.plan, id))!.izin.kabulRed, false, "planlamacı kabul edemez");
  assert.equal((await a(FA.plan, (db) => planKabul(db, FA.plan, id, v.surum, true))).durum, "yetkisiz");
  assert.equal((await a(FA.den2, (db) => planKabul(db, FA.den2, id, v.surum, true))).durum, "yok", "ekipte olmayan denetçi planı görmez");
  assert.deepEqual(await a(FA.den1, (db) => planKabul(db, FA.den1, id, v.surum, false)),
    { durum: "gecersiz", hatalar: { beyan: "Tarafsızlık beyanı okunup onaylanmadan plan kabul edilemez." } });
  assert.deepEqual(await a(FA.den1, (db) => planKabul(db, FA.den1, id, v.surum, true, "0000000000000000")),
    { durum: "red", neden: "Tarafsızlık beyanının metni değişti; sayfayı yenileyip yeni metni okuyun." }, "okunan metin kabulde yazılacak metinle aynı olmalı");
  tamam(await a(FA.den1, (db) => planKabul(db, FA.den1, id, v.surum, true, v.beyanOzet)));
  const p = (await sql<{ durum: string; beyan: string; kabul_eden: string; kabul_hesap: string; kabul: Date }>(A,
    "SELECT durum, beyan, kabul_eden, kabul_hesap::text, kabul FROM plan WHERE id = $1", [id])).rows[0];
  assert.deepEqual([p.durum, p.beyan, p.kabul_eden, p.kabul_hesap], ["kabul", VARSAYILAN_BEYAN, "Deneme", FA.den1.id], "beyan metni ve kabul eden hesap kayıtta");
  assert.equal((await a(FA.den1, (db) => planKabul(db, FA.den1, id, v.surum, true))).durum, "red", "ikinci kabul yok");
  /* firma beyanı sonradan değişse de kabul edilen metin değişmez */
  await sql(A, "INSERT INTO firma_ayar (bolum, deger) VALUES ('beyan', $1::jsonb)", [JSON.stringify({ metin: "Yeni kalite el kitabı beyanı: tarafsız ve bağımsız çalışırım." })]);
  assert.equal((await ici(FA.den1, id))!.kabul?.beyan, VARSAYILAN_BEYAN);
  assert.equal((await ici(FA.den1, await yeniPlan(FA, A, FA.tesis2)))!.beyan, "Yeni kalite el kitabı beyanı: tarafsız ve bağımsız çalışırım.", "yeni plan güncel beyanı okutur");
  /* veritabanı: geçiş atlanamaz, damga uydurulamaz, beyan değişmez */
  await assert.rejects(sql(A, "UPDATE plan SET durum = 'tamamlandi' WHERE id = $1", [id]), /geçemez/);
  await assert.rejects(sql(A, "UPDATE plan SET beyan = repeat('x', 30) WHERE id = $1", [id]), /değişmez/);
  await sql(A, "UPDATE plan SET kabul = '2000-01-01', kabul_hesap = NULL WHERE id = $1", [id]);
  const p2 = (await sql<{ kabul: Date; kabul_hesap: string }>(A, "SELECT kabul, kabul_hesap::text FROM plan WHERE id = $1", [id])).rows[0];
  assert.deepEqual([p2.kabul.getTime(), p2.kabul_hesap], [p.kabul.getTime(), FA.den1.id], "kabul damgası elle değişmez");
  /* denetim: ilk rapor (Raporlar kalemi) planı Denetimde yapar */
  assert.equal(await a(FA.den1, (db) => denetimeBasla(db, "Deneme", id)), true);
  v = (await ici(FA.den1, id))!;
  assert.equal(v.durum, "denetimde"); assert.ok(v.basladi);
  await assert.rejects(sql(A, "UPDATE plan SET durum = 'tamamlandi', kontrol_tamam = now() WHERE id = $1", [id]), /önce kontrol listesi/, "kontrol listesi atlanamaz");
  assert.deepEqual(await a(FA.den1, (db) => planTamamla(db, FA.den1, id, v.surum)), { durum: "red", neden: "Önce kontrol listesi tamamlanmalı." });
  assert.equal((await a(FA.mek, (db) => kontrolListesi(db, FA.mek, id, v.surum, true))).durum, "yetkisiz", "yönetici (görür) tamamlayamaz");
  tamam(await a(FA.den1, (db) => kontrolListesi(db, FA.den1, id, v.surum, true)));
  v = (await ici(FA.den1, id))!;
  assert.ok(v.kontrolTamam);
  tamam(await a(FA.plan, (db) => planTamamla(db, FA.plan, id, v.surum)));
  v = (await ici(FA.den1, id))!;
  assert.equal(v.durum, "tamamlandi"); assert.ok(v.bitti);
  assert.equal(v.izin.ekipmanEkle, false, "tamamlanmış planda ekipman ekleme kapalı (12)");
  assert.deepEqual(await a(FA.den1, (db) => yeniEkipman(db, FA.den1, id, { kod: "HT-T1", tur: FA.tur })), { durum: "red", neden: "Bu durumdaki plana ekipman eklenmez." });
  await assert.rejects(sql(A, "INSERT INTO plan_ekipman (plan_id, ekipman_id, ekleyen) VALUES ($1, $2, 'x')", [id, await ekipmanId(A, "HT-B1")]), /tesisinde|tamamlanmış/);
  tamam(await a(FA.den1, (db) => tamamlamaGeriAl(db, FA.den1, id, v.surum)));
  v = (await ici(FA.den1, id))!;
  assert.deepEqual([v.durum, v.kontrolTamam, v.bitti], ["denetimde", null, null], "geri alınca plan yeniden denetime, kontrol listesi açık");
  assert.equal((await a(FA.den1, (db) => tamamlamaGeriAl(db, FA.den1, id, v.surum - 1))).durum, "red");
});

test("reddet: gerekçe zorunlu ve değişmez; reddedilen plan kabul edilemez, denetime geçmez", async () => {
  const id = await yeniPlan(FA, A);
  const v = (await ici(FA.den1, id))!;
  await assert.rejects(sql(A, "UPDATE plan SET kabul_eden = 'Başka Biri', beyan = repeat('b', 30) WHERE id = $1", [id]), /yalnız kabulde/, "kabulsüz beyan yazılamaz");
  await assert.rejects(sql(A, "UPDATE plan SET red_eden = 'Başka Biri', red_gerekce = 'uydurma' WHERE id = $1", [id]), /yalnız redde/);
  assert.deepEqual(await a(FA.den1, (db) => planReddet(db, FA.den1, id, v.surum, { gerekce: "  " })), { durum: "gecersiz", hatalar: { gerekce: "Gerekçe yazılmadan plan reddedilemez." } });
  assert.equal((await a(FA.plan, (db) => planReddet(db, FA.plan, id, v.surum, { gerekce: "uygun değil" }))).durum, "yetkisiz");
  tamam(await a(FA.den1, (db) => planReddet(db, FA.den1, id, v.surum, { gerekce: "Aynı gün başka denetim" })));
  const r = (await ici(FA.plan, id))!;
  assert.equal(r.durum, "reddedildi"); assert.equal(r.red?.gerekce, "Aynı gün başka denetim");
  await assert.rejects(sql(A, "UPDATE plan SET red_gerekce = 'başka' WHERE id = $1", [id]), /değişmez/);
  await assert.rejects(sql(A, "UPDATE plan SET durum = 'kabul' WHERE id = $1", [id]), /geçemez/);
  assert.equal(await a(FA.den1, (db) => denetimeBasla(db, "Deneme", id)), false);
});

test("künye: planlamacı düzenler; denetçinin ekranı Güncelle'ye kadar eski kalır; denetçi düzenleyemez; eski sürüm çakışır", async () => {
  const id = await yeniPlan(FA, A);
  const v = (await ici(FA.plan, id))!;
  assert.ok(v.kunyeGuncel);
  assert.equal((await ici(FA.den1, id))!.kunyeGuncel, null);
  const yeni = { firmaAdi: "Yeni Ünvan A.Ş.", adres: "Yeni Cad. 2", sgk: "", isg: { [FA.den1P]: "ISG-YENI" } };
  assert.equal((await a(FA.den1, (db) => kunyeDuzenle(db, FA.den1, id, v.surum, yeni))).durum, "yetkisiz");
  assert.deepEqual(await a(FA.plan, (db) => kunyeDuzenle(db, FA.plan, id, v.surum, { ...yeni, sgk: "123" })), { durum: "gecersiz", hatalar: { sgk: "SGK DETSİS NO 26 haneli olmalı." } });
  tamam(await a(FA.plan, (db) => kunyeDuzenle(db, FA.plan, id, v.surum, yeni)));
  assert.equal((await a(FA.plan, (db) => kunyeDuzenle(db, FA.plan, id, v.surum, yeni))).durum, "cakisma", "eski sürümle yazılamaz");
  const d = (await ici(FA.den1, id))!;
  assert.deepEqual([d.kunye.firmaAdi, d.kunye.sgk, d.kunye.isg[0].no], ["Deneme Sanayi A.Ş.", SGK, "ISG-1"], "denetçinin gördüğü künye kendiliğinden değişmez");
  assert.deepEqual(d.kunyeFark, ["Firma adı", "Adres", "SGK DETSİS NO", "İSG-KATİP SÖZLEŞME ID"]);
  assert.equal(d.izin.kunyeGuncelle, true);
  assert.equal((await ici(FA.plan, id))!.kunye.firmaAdi, "Yeni Ünvan A.Ş.");
  assert.equal((await a(FA.plan, (db) => kunyeGuncelle(db, FA.plan, id))).durum, "yetkisiz", "ekipte olmayan Güncelle'ye basamaz");
  tamam(await a(FA.den1, (db) => kunyeGuncelle(db, FA.den1, id)));
  const g = (await ici(FA.den1, id))!;
  assert.deepEqual([g.kunye.firmaAdi, g.kunye.sgk, g.kunye.isg[0].no, g.kunyeFark, g.izin.kunyeGuncelle], ["Yeni Ünvan A.Ş.", null, "ISG-YENI", [], false]);
  assert.ok((await sql(A, "SELECT 1 FROM denetim_izi WHERE ne = 'plan.kunye' AND nesne_id = $1", [id])).rowCount, "hareket kaydı");
});

test("proje notları: ekipteki denetçi ve planlama yazar / görür; yönetici (görür) ve muhasebe görmez; not değişmez, silinmez; yazan hesap veritabanından", async () => {
  const id = await yeniPlan(FA, A);
  tamam(await a(FA.den1, (db) => notEkle(db, FA.den1, id, { metin: "  Giriş kartı bekçide " })));
  tamam(await a(FA.plan, (db) => notEkle(db, FA.plan, id, { metin: "Refakatçi: bakım şefi" })));
  assert.deepEqual(await a(FA.den1, (db) => notEkle(db, FA.den1, id, { metin: "   " })), { durum: "gecersiz", hatalar: { metin: "Not boş olamaz." } });
  assert.deepEqual((await ici(FA.den1, id))!.notlar?.map((n) => n.metin).sort(), ["Giriş kartı bekçide", "Refakatçi: bakım şefi"]);
  assert.equal((await ici(FA.mek, id))!.notlar, null, "yönetici planı görür, notu görmez");
  assert.equal((await a(FA.mek, (db) => notEkle(db, FA.mek, id, { metin: "x" }))).durum, "yetkisiz");
  assert.equal((await a(FA.muh, (db) => notEkle(db, FA.muh, id, { metin: "x" }))).durum, "yok");
  const n = (await sql<{ id: string; yazan_hesap: string }>(A, "SELECT id::text, yazan_hesap::text FROM plan_not WHERE plan_id = $1 AND metin LIKE 'Giriş%'", [id])).rows[0];
  assert.equal(n.yazan_hesap, FA.den1.id);
  await assert.rejects(sql(A, "UPDATE plan_not SET metin = 'değişti' WHERE id = $1", [n.id]), /permission denied|izin/i);
  await assert.rejects(sql(A, "DELETE FROM plan_not WHERE id = $1", [n.id]), /permission denied|izin/i);
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO plan_not (plan_id, metin, yazan, yazan_hesap) VALUES ($1, 'sahte', 'x', $2)", [id, FA.yon.id]), { hesapId: FA.den1.id });
  assert.equal((await sql<{ h: string }>(A, "SELECT yazan_hesap::text AS h FROM plan_not WHERE metin = 'sahte'")).rows[0].h, FA.den1.id, "yazan hesap uydurulamaz");
});

test("ekipman: kod denetimi (biçim · bu planda · tesiste kayıtlı · başka tesis · eski kod · kullanılabilir); yeni ekipman ve kayıtlı ekipman plana; pasif / etkin", async () => {
  const id = await yeniPlan(FA, A);
  await sql(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'HT-A3', 'x')", [FA.tesis, FA.tur]);
  let v = (await ici(FA.den1, id))!;
  assert.equal(v.izin.ekipmanEkle, false, "kabulden önce ekipman eklenmez");
  tamam(await a(FA.den1, (db) => planKabul(db, FA.den1, id, v.surum, true)));
  v = (await ici(FA.den1, id))!;
  assert.deepEqual(v.kayitli.map((x) => x.kod), ["HT-A3"]);
  const kd = (kod: string) => a(FA.den1, (db) => kodDurumu(db, FA.den1, id, kod));
  assert.equal((await kd("AB"))?.metin, "Kod 3 ile 20 hane arasında olmalı.");
  assert.equal((await kd("ht-a1"))?.metin, "HT-A1 bu planda zaten var: Hava tankı. Aynı kod iki ekipmana verilemez.");
  const a3 = await ekipmanId(A, "HT-A3");
  assert.deepEqual(await kd("HT-A3"), { tur: "tesiste", metin: "HT-A3 bu tesiste kayıtlı: Hava tankı. Yeni kayıt açılmaz; kayıtlı ekipmanı plana ekleyin.", ekipmanId: a3 });
  assert.equal((await kd("HT-B1"))?.metin, "HT-B1 başka bir tesiste kayıtlı: Hava tankı · Deneme / Depo. Aynı kod iki ekipmana verilemez.");
  await sql(A, "UPDATE ekipman SET kod = 'HT-B9' WHERE kod = 'HT-B1'");
  assert.equal((await kd("HT-B1"))?.metin, "HT-B1 daha önce başka bir ekipmanın koduydu (şimdiki kodu HT-B9). Eski kod başka ekipmana verilmez.");
  assert.equal((await kd("HT-YENI1"))?.tur, "tamam");
  /* yeni ekipman: biçim, tür, eşsizlik sunucuda */
  assert.deepEqual(await a(FA.den1, (db) => yeniEkipman(db, FA.den1, id, { kod: "HT-A1", tur: FA.tur })),
    { durum: "gecersiz", hatalar: { kod: "HT-A1 bu planda zaten var: Hava tankı. Aynı kod iki ekipmana verilemez." } });
  assert.deepEqual(await a(FA.den1, (db) => yeniEkipman(db, FA.den1, id, { kod: "HT-YENI1", tur: FB.tur })), { durum: "gecersiz", hatalar: { tur: "Ekipman türü seçilmeli." } }, "başka firmanın türü");
  tamam(await a(FA.den1, (db) => yeniEkipman(db, FA.den1, id, { kod: " ht-yeni 1 ", tur: FA.tur, konum: "Kazan dairesi" })));
  tamam(await a(FA.den1, (db) => kayitliEkle(db, FA.den1, id, [a3])));
  assert.deepEqual(await a(FA.den1, (db) => kayitliEkle(db, FA.den1, id, [a3])), { durum: "gecersiz", hatalar: { secim: "Seçilen ekipman bu tesiste kayıtlı ve plana alınmamış olmalı." } });
  const b9 = await ekipmanId(A, "HT-B9");
  assert.deepEqual(await a(FA.den1, (db) => kayitliEkle(db, FA.den1, id, [b9])), { durum: "gecersiz", hatalar: { secim: "Seçilen ekipman bu tesiste kayıtlı ve plana alınmamış olmalı." } });
  v = (await ici(FA.den1, id))!;
  assert.deepEqual(v.ekipman.filter((e) => e.sonradan).map((e) => [e.kod, e.konum]).sort(), [["HT-A3", null], ["HT-YENI1", "Kazan dairesi"]]);
  assert.deepEqual(v.teklif.map((t) => [t.planlanan, t.planda]), [[2, 4]], "teklif içeriği plan açılırkenki sayı; denetimde eklenenler ayrı");
  /* pasif / etkin (silme yok) */
  const a2 = v.ekipman.find((e) => e.kod === "HT-A2")!;
  tamam(await a(FA.den1, (db) => ekipmanPasif(db, FA.den1, id, a2.id, a2.surum, true)));
  assert.equal((await ici(FA.den1, id))!.ekipman.find((e) => e.kod === "HT-A2")!.pasif, true);
  assert.equal((await a(FA.den1, (db) => ekipmanPasif(db, FA.den1, id, a2.id, a2.surum, true))).durum, "tamam", "zaten pasif");
  tamam(await a(FA.den1, (db) => ekipmanPasif(db, FA.den1, id, a2.id, a2.surum + 1, false)));
  assert.equal((await a(FA.den1, (db) => ekipmanPasif(db, FA.den1, id, b9, 0, true))).durum, "yok", "plandaki ekipman olmalı");
  /* yetki: ekipte olmayan denetçi görmez; yönetici (Ekipman "görür") ekleyemez */
  assert.equal(await a(FA.den2, (db) => kodDurumu(db, FA.den2, id, "HT-X1")), null);
  assert.equal((await a(FA.den2, (db) => yeniEkipman(db, FA.den2, id, { kod: "HT-X1", tur: FA.tur }))).durum, "yok");
  assert.equal((await a(FA.mek, (db) => yeniEkipman(db, FA.mek, id, { kod: "HT-X1", tur: FA.tur }))).durum, "yetkisiz");
  assert.equal((await a(FA.mek, (db) => ekipmanPasif(db, FA.mek, id, a2.id, a2.surum + 2, true))).durum, "yetkisiz");
  /* veritabanı: başka tesisin ekipmanı plana bağlanmaz */
  await assert.rejects(sql(A, "INSERT INTO plan_ekipman (plan_id, ekipman_id, ekleyen) VALUES ($1, $2, 'x')", [id, b9]), /tesisinde/);
});

test("liste: denetçi yalnız ekibindeki planları, planlama ve yönetici hepsini görür; muhasebe göremez; B, A'nın planını görmez", async () => {
  const id = await yeniPlan(FA, A);
  const l = (k: Kisi) => a(k, (db) => planListesi(db, k));
  const plan = (await l(FA.plan))!, den1 = (await l(FA.den1))!, den2 = (await l(FA.den2))!;
  assert.ok(plan.some((p) => p.id === id));
  const s = plan.find((p) => p.id === id)!;
  assert.deepEqual([s.ad, s.musteri, s.il, s.ilce, s.ekip, s.mekanik, s.elektrik], ["Merkez", "Deneme Sanayi A.Ş.", "Ankara", "Çankaya", ["Deneme Bir"], true, false]);
  assert.ok(den1.length > 0 && den1.every((p) => p.ekip.includes("Deneme Bir")));
  assert.deepEqual(den2, [], "ekibinde olmadığı plan görünmez");
  assert.ok((await l(FA.mek))!.some((p) => p.id === id));
  assert.equal(await l(FA.muh), null);
  assert.ok(!(await b(FB.plan, (db) => planListesi(db, FB.plan)))!.some((p) => p.id === id));
});

test("KİRACI + ROL: B'nin kişisi A'nın planında hiçbir şey yapamaz; rol düzeni değişince ya da rol düşünce plan görünmez; sahte rol bir şey vermez", async () => {
  const id = await yeniPlan(FA, A);
  const v = (await ici(FA.den1, id))!;
  /* B'nin denetçisi A'nın plan kimliğini bilse de */
  assert.equal(await b(FB.den1, (db) => planIci(db, FB.den1, id)), null);
  assert.equal((await b(FB.den1, (db) => planKabul(db, FB.den1, id, v.surum, true))).durum, "yok");
  assert.equal((await b(FB.plan, (db) => kunyeDuzenle(db, FB.plan, id, v.surum, { firmaAdi: "Ele geçirdim" }))).durum, "yok");
  assert.equal((await b(FB.den1, (db) => notEkle(db, FB.den1, id, { metin: "sızma" }))).durum, "yok");
  assert.equal((await sql(B, "UPDATE plan SET durum = 'kabul' WHERE id = $1", [id])).rowCount, 0);
  await assert.rejects(sql(B, "INSERT INTO plan_not (plan_id, metin, yazan) VALUES ($1, 'sızma', 'x')", [id]), /foreign key|yabancı anahtar/i);
  /* rol düzeni: firma denetçiye Planlar'ı kapatınca ekipte olsa da görmez, kabul edemez */
  const KAPALI: Kisi = { ...FA.den1, matris: { ...MATRIS_ONERI, 13: ["yaz", "yok", "gor", "gor", "yaz", "yok"] } as never };
  assert.equal(await a(KAPALI, (db) => planIci(db, KAPALI, id)), null);
  assert.equal((await a(KAPALI, (db) => planKabul(db, KAPALI, id, v.surum, true))).durum, "yok");
  /* aynı hesap rolü muhasebeye çevrilince */
  const MUH: Kisi = { ...FA.den1, roller: ["muhasebe"] };
  assert.equal(await a(MUH, (db) => planIci(db, MUH, id)), null);
  const SAHTE: Kisi = { ...FA.den1, roller: ["admin", "__proto__"] as never };
  assert.equal(await a(SAHTE, (db) => planIci(db, SAHTE, id)), null);
  assert.equal((await a(SAHTE, (db) => planKabul(db, SAHTE, id, v.surum, true))).durum, "yok");
  /* planlamacı plana atanmış gibi davranamaz: kabul özel eylemi atananları veritabanından okur */
  assert.equal((await a(FA.yon, (db) => planKabul(db, FA.yon, id, v.surum, true))).durum, "yetkisiz");
  assert.equal((await ici(FA.den1, id))!.durum, "bekliyor");
});
