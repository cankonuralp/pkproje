/* NEREDEN GELDİ: maket firma-ayarlari "Toplu içe aktarma (ilk kurulum)" (pkproje §11 245: tür seç → şablon → Excel → satır denetimi → İçe aktar (N);
   son içe aktarma, kayıtları kullanılmadıysa Geri al) · reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK
   PostgreSQL, iki firma (337; göç 0047). Olumsuz kanıt tests/bozan/ice-aktarma.bozan.ts. Saf denetim tests/ice-aktar-sema.test.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { IA_TUR } from "../src/modules/firma-ayarlari/ice-aktar.ts";
import { firmaAyarlari, type Kisi } from "../src/modules/firma-ayarlari/server/ayarlar.ts";
import { iceAktar, iceAktarDenetle, iceAktarimGeriAl } from "../src/modules/firma-ayarlari/server/ice-aktar.ts";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cihazKalibrasyonlari, cihazOzetleri, kalibrasyonEkle } from "../src/modules/olcum-cihazlari/server/cihazlar.ts";
import { cihazUyarilari } from "../src/modules/olcum-cihazlari/server/uyari-baglanti.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
let YON: Kisi, DEN: Kisi, YON_B: Kisi;
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>, firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const sql = async <T = { id: string },>(firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  (await kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p), hesapId ? { hesapId } : undefined)).rows;
async function hesap(firma: string, eposta: string, roller: string[]): Promise<Kisi> {
  const id = (await sql(firma, "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, roller]))[0].id;
  return { id, ad: "Deneme", roller: roller as Kisi["roller"] };
}
const sayi = async (firma: string, tablo: string) => Number((await sql<{ n: string }>(firma, `SELECT count(*) n FROM ${tablo}`))[0].n);
const dosya = (tur: keyof typeof IA_TUR, ...satir: string[][]) => ({ tur, dosya: `${tur}.xlsx`, satirlar: [[...IA_TUR[tur].sutun], ...satir] });
const son = async (firma = A) => (await sql<{ id: string; adet: number; atlanan: number; kayitlar: { t: string; id: string }[] }>(firma,
  "SELECT id::text, adet, atlanan, kayitlar FROM ice_aktarim ORDER BY zaman DESC, olustu DESC LIMIT 1"))[0];

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  YON = await hesap(A, "yon@deneme-a.example", ["firma_yoneticisi"]);
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"]);
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"]);
  await sql(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  await sql(A, "INSERT INTO cihaz_turu (ad) VALUES ('Topraklama ölçer') RETURNING id::text");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("yetki (Firma ayarları 'değiştirir'): denetçi, 'gör' ve 'kendi' düzeyi içe aktaramaz, geri alamaz (istemciden rol gelmez)", async () => {
  const GOR = { ...DEN, matris: { 22: ["gor", "gor", "gor", "gor", "yaz", "yok"] } } as Kisi;
  for (const k of [DEN, GOR]) {
    assert.deepEqual(await a(k, (db) => iceAktarDenetle(db, k, dosya("personel", ["Deniz Yılmaz", "Elektrik mühendisi", "01.03.2021"]))), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => iceAktar(db, k, dosya("personel", ["Deniz Yılmaz", "Elektrik mühendisi", "01.03.2021"]))), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => iceAktarimGeriAl(db, k, "00000000-0000-0000-0000-000000000000", true)), { durum: "yetkisiz" });
  }
  assert.equal(await sayi(A, "personel"), 0);
  /* uygulama rolü hedef tablolardan silemez (geri alma yalnız veritabanı işleviyle) */
  for (const t of ["musteri", "tesis", "ekipman", "olcum_cihazi", "personel", "arac", "ice_aktarim"])
    await assert.rejects(sql(A, `DELETE FROM ${t}`), /permission denied/, t);
});

test("müşteri + tesis: satır denetimi, tek işlemde içe aktarma, aynı müşteri bir kez açılır; kayıt oluşturulan kimliklerle; ekipman tesise bağlanır", async () => {
  const d = await a(YON, (db) => iceAktarDenetle(db, YON, dosya("musteri", ...IA_TUR.musteri.ornek.map((x) => [...x]), ["", "", "", "", "Şube", "Liman Yolu No: 3", "Kocaeli", "", ""])));
  assert.ok(d.durum === "tamam");
  assert.deepEqual(d.satirlar.map((x) => [x.no, x.ok, x.neden]), [[2, true, ""], [3, true, ""], [4, true, ""], [5, false, "Müşteri ünvanı boş"]]);
  assert.ok(!("deger" in d.satirlar[0]), "kimlikler istemciye gitmez");
  assert.deepEqual(await a(YON, (db) => iceAktar(db, YON, dosya("musteri", ...IA_TUR.musteri.ornek.map((x) => [...x]), ["", "", "", "", "Şube", "Liman Yolu No: 3", "Kocaeli", "", ""]))),
    { durum: "aktarildi", bildirim: "Müşteriler ve tesisler: 3 kayıt içe aktarıldı; 1 satır atlandı." });
  assert.deepEqual([await sayi(A, "musteri"), await sayi(A, "tesis")], [2, 3]);
  const k = await son();
  assert.deepEqual([k.adet, k.atlanan, k.kayitlar.map((x) => x.t)], [3, 1, ["musteri", "tesis", "tesis", "musteri", "tesis"]]);
  const m = (await sql<{ unvan: string; kisa: string; vno: string | null; eposta: string | null }>(A, "SELECT unvan, kisa, vno, eposta FROM musteri ORDER BY unvan"));
  assert.deepEqual(m.map((x) => [x.unvan, x.kisa, x.vno, x.eposta]), [["Deneme Metal Ltd.", "Deneme Metal", null, null], ["Örnek Gıda San. A.Ş.", "Örnek Gıda", "1234567890", "isg@ornek-gida.example"]]);
  /* aynı dosya ikinci kez: hepsi "Bu tesis zaten kayıtlı" */
  const d2 = await a(YON, (db) => iceAktarDenetle(db, YON, dosya("musteri", ...IA_TUR.musteri.ornek.map((x) => [...x]))));
  assert.ok(d2.durum === "tamam" && d2.satirlar.every((x) => !x.ok && x.neden === "Bu tesis zaten kayıtlı"));
  assert.deepEqual(await a(YON, (db) => iceAktar(db, YON, dosya("musteri", ...IA_TUR.musteri.ornek.map((x) => [...x])))), { durum: "red", neden: "İçe aktarılacak geçerli satır yok." });
  /* ekipman: müşteri ünvanı + tesis adıyla */
  assert.deepEqual(await a(YON, (db) => iceAktar(db, YON, dosya("ekipman", ...IA_TUR.ekipman.ornek.map((x) => [...x])))),
    { durum: "aktarildi", bildirim: "Ekipmanlar: 1 kayıt içe aktarıldı; 1 satır atlandı." }, "forklift türü yok");
  assert.deepEqual((await sql<{ kod: string; tesis: string; imal: number }>(A, "SELECT e.kod, t.ad AS tesis, e.imal FROM ekipman e JOIN tesis t ON t.id = e.tesis_id")),
    [{ kod: "HT-2001", tesis: "Depo", imal: 2018 }]);
});

test("geri al: yalnız son içe aktarma, bir kez; önce dener; ekipman kodu da serbest kalır (yeniden yüklenebilir); kullanılmış kayıt geri alınmaz", async () => {
  const ek = await son();
  assert.deepEqual(await a(YON, (db) => iceAktarimGeriAl(db, YON, ek.id, true)), { durum: "aktarildi", bildirim: "" }, "dene");
  assert.equal(await sayi(A, "ekipman"), 1, "deneme silmez");
  const mus = (await sql(A, "SELECT id::text FROM ice_aktarim WHERE tur = 'musteri'"))[0].id;
  assert.deepEqual(await a(YON, (db) => iceAktarimGeriAl(db, YON, mus, false)), { durum: "red", neden: "Yalnız son içe aktarma geri alınır." });
  assert.deepEqual(await a(YON, (db) => iceAktarimGeriAl(db, YON, ek.id, false)), { durum: "aktarildi", bildirim: "Ekipmanlar: içe aktarma geri alındı (1 satır)." });
  assert.deepEqual([await sayi(A, "ekipman"), await sayi(A, "ekipman_kodu")], [0, 0]);
  assert.deepEqual(await a(YON, (db) => iceAktarimGeriAl(db, YON, ek.id, false)), { durum: "red", neden: "Bu içe aktarma zaten geri alındı." });
  assert.equal((await a(YON, (db) => iceAktar(db, YON, dosya("ekipman", ...IA_TUR.ekipman.ornek.map((x) => [...x]))))).durum, "aktarildi", "kod yeniden yüklenir");
  /* personel: hesap açılınca kullanılmış sayılır */
  assert.deepEqual(await a(YON, (db) => iceAktar(db, YON, dosya("personel", ...IA_TUR.personel.ornek.map((x) => [...x])))),
    { durum: "aktarildi", bildirim: "Personel: 2 kayıt içe aktarıldı." });
  const p = await son(), kisi = p.kayitlar[0].id;
  await sql(A, "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ('deniz@deneme-a.example', 'Deniz Yılmaz', '{denetci}', 'etkin', $1) RETURNING id::text", [kisi]);
  const kullanildi = { durum: "red", neden: "Geri alınamaz: içe aktarılan kayıtlar kullanılmaya başlandı (plan, rapor, teklif, zimmet, hesap ya da dosya). Kayıtları tek tek düzeltin ya da pasife alın." };
  assert.deepEqual(await a(YON, (db) => iceAktarimGeriAl(db, YON, p.id, true)), kullanildi);
  assert.deepEqual(await a(YON, (db) => iceAktarimGeriAl(db, YON, p.id, false)), kullanildi);
  assert.equal(await sayi(A, "personel"), 2, "hiçbiri silinmedi");
});

test("ölçüm cihazı (sistem öncesi kalibrasyon bitişi geçerli bitiş olur) ve araç", async () => {
  assert.deepEqual(await a(YON, (db) => iceAktar(db, YON, dosya("cihaz", ...IA_TUR.cihaz.ornek.map((x) => [...x])))),
    { durum: "aktarildi", bildirim: "Ölçüm cihazları: 1 kayıt içe aktarıldı; 1 satır atlandı." }, "multimetre türü yok");
  assert.deepEqual((await a(YON, (db) => cihazOzetleri(db))).map((c) => [c.kod, c.bitis]), [["OC-201", "2027-03-15"]]);
  assert.equal(await sayi(A, "kalibrasyon"), 0, "laboratuvar / sertifika uydurulmaz");
  assert.deepEqual(await a(YON, (db) => iceAktar(db, YON, dosya("arac", ...IA_TUR.arac.ornek.map((x) => [...x])))), { durum: "aktarildi", bildirim: "Araçlar: 1 kayıt içe aktarıldı." });
  assert.deepEqual(await sql(A, "SELECT plaka, yakit, ilk_km, muayene::text FROM arac"), [{ plaka: "34 ABC 101", yakit: "dizel", ilk_km: 68000, muayene: "2027-05-10" }]);
  /* Firma ayarları ekranında son içe aktarımlar: en yeni önde, yalnız o geri alınabilir */
  const v = (await a(YON, (db) => firmaAyarlari(db, YON)))!;
  assert.deepEqual(v.ice.map((g) => [g.tur, g.son, g.geri]), [["arac", true, false], ["cihaz", false, false], ["personel", false, false], ["ekipman", false, false], ["ekipman", false, true]]);
});

test("kayıt sahtesi ve firma sızıntısı: içe aktarma kaydına bu işlemde oluşturulmamış kayıt yazılamaz; B, A'nın içe aktarmasını görmez ve geri alamaz", async () => {
  const eski = (await sql(A, "SELECT id::text FROM musteri LIMIT 1"))[0].id;
  await assert.rejects(a(YON, (db) => db.sorgu("INSERT INTO ice_aktarim (tur, dosya, adet, kayitlar, kim) VALUES ('musteri', 'x.xlsx', 1, $1, 'Deneme')",
    [JSON.stringify([{ t: "musteri", id: eski }])])), /bu işlemde oluşturulmuş bir kayıt değil/);
  await assert.rejects(a(YON, (db) => db.sorgu("UPDATE ice_aktarim SET geri = now(), geri_kim = 'x'")), /permission denied/);
  const sonA = await son();
  assert.deepEqual(await a(YON_B, (db) => iceAktarimGeriAl(db, YON_B, sonA.id, false), B), { durum: "red", neden: "İçe aktarma bulunamadı." });
  assert.deepEqual((await a(YON_B, (db) => firmaAyarlari(db, YON_B), B))!.ice, []);
  assert.equal(await sayi(B, "ice_aktarim"), 0);
  assert.equal(await sayi(A, "arac"), 1, "A'nın kaydı yerinde");
  /* B'nin denetimi A'nın kayıtlarını görmez: aynı plaka B'de eklenebilir */
  const d = await a(YON_B, (db) => iceAktarDenetle(db, YON_B, dosya("arac", ...IA_TUR.arac.ornek.map((x) => [...x]))), B);
  assert.ok(d.durum === "tamam" && d.satirlar.every((x) => x.ok));
});

/* 337–339 incelemesi: sistem öncesi bitiş (ilk_bitis) YALNIZ kalibrasyon kaydı yokken geçerli — kayıt açılınca (sonucu "uygun değil" olsa da)
   devreden çıkar; belge de aynı kaynaktan (rapora eklenen cihazın geçerliliği PDF'te boş kalmaz) */
test("ilk_bitis: belgede geçerlilik; 'uygun değil' kalibrasyon kaydı açılınca cihaz geçmiş sayılır (Uyarılar da)", async () => {
  const id = (await sql(A, "SELECT id::text FROM olcum_cihazi WHERE kod = 'OC-201'"))[0].id;
  assert.deepEqual((await a(YON, (db) => cihazKalibrasyonlari(db, [id]))).get(id), { tarih: null, bitis: "2027-03-15", sertifika: null });
  const klasor = mkdtempSync(join(tmpdir(), "ia-kal-"));
  try {
    const r = await a(YON, (db) => kalibrasyonEkle(db, klasorDepo(klasor), YON, A, id, { tarih: "2026-09-01", bitis: "2026-09-02", lab: "Deneme Lab", sertifika: "S-1", sonuc: "uygun_degil" }));
    assert.equal(r.durum, "tamam", JSON.stringify(r));
  } finally { rmSync(klasor, { recursive: true, force: true }); }
  assert.equal((await a(YON, (db) => cihazOzetleri(db))).find((c) => c.id === id)?.bitis, null, "ilk_bitis devreden çıktı");
  assert.equal((await a(YON, (db) => cihazKalibrasyonlari(db, [id]))).get(id), undefined);
  /* 340–345 incelemesi: muayene günü kayıttan önceyse o gün geçerli olan ilk_bitis belgeye yazılır (sonradan girilen kayıt eski raporu değiştirmez) */
  assert.deepEqual((await a(YON, (db) => cihazKalibrasyonlari(db, [id], "2026-08-15"))).get(id), { tarih: null, bitis: "2027-03-15", sertifika: null });
  assert.equal((await a(YON, (db) => cihazKalibrasyonlari(db, [id], "2026-09-05"))).get(id), undefined, "kayıttan sonraki gün: uygun kayıt yok");
  assert.ok((await a(YON, (db) => cihazUyarilari(db, "2026-10-06"))).l.some((x) => x.id === id && x.durum === "gecti"));
});

/* 337–339 incelemesi: içe aktarma listesi "bu işlemde oluşturulmuş kayıt"ı oluşturulma zamanıyla anlar — eski kayıt yeni gösterilemez (0048) */
test("oluşturulma zamanı değişmez: eski kayıt olustu güncellenip sahte içe aktarma listesine yazılamaz (silinemez); 3 haneli tireli ekipman kodu", async () => {
  const eski = (await sql(A, "SELECT id::text FROM personel LIMIT 1"))[0].id;
  for (const t of ["musteri", "tesis", "personel", "olcum_cihazi", "arac", "ekipman"]) {
    await assert.rejects(a(YON, (db) => db.sorgu(`UPDATE ${t} SET olustu = now()`)), /oluşturulma zamanı değişmez/, t);
  }
  await assert.rejects(a(YON, async (db) => {
    await db.sorgu("UPDATE personel SET olustu = now() WHERE id = $1", [eski]);
    await db.sorgu("INSERT INTO ice_aktarim (tur, dosya, adet, kayitlar, kim) VALUES ('personel', 'x.xlsx', 1, $1, 'Deneme')", [JSON.stringify([{ t: "personel", id: eski }])]);
  }), /oluşturulma zamanı değişmez/);
  assert.equal((await sql(A, "SELECT count(*)::int AS n FROM personel WHERE id = $1", [eski]))[0].n, 1, "kayıt yerinde");
  /* ekipman kodu: uygulamanın kuralı (3–20, tire iki hane arasında) veritabanında da */
  const yer = (await sql(A, "SELECT t.id::text AS tesis, tu.id::text AS tur FROM tesis t, ekipman_turu tu LIMIT 1"))[0] as unknown as { tesis: string; tur: string };
  await a(YON, (db) => db.sorgu("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'A-1', 'Deneme')", [yer.tesis, yer.tur]));
  for (const k of ["A--1", "-AB", "AB-", "A-", "A".repeat(21)]) {
    await assert.rejects(a(YON, (db) => db.sorgu("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'Deneme')", [yer.tesis, yer.tur, k])), /check/i, k);
  }
});
