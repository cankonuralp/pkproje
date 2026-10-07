/* NEREDEN GELDİ: 357 — reisim 2026-10-07: "ekipman, cihaz, ekipman türü vb eklenebilen şeylerin silinemediğini tespit ettim; denemek için bir kaç cihaz
   ekledim ama silemedim, bunu da düzeltmeliyiz" + pkproje §9 "silme işlemi sadece yöneticiler tarafından yapılabilmeli". GERÇEK PostgreSQL, iki firma.
   Ortak kesin silme sözleşmesi (src/server/db/silici.ts, göç 0054) ölçüm cihazıyla:
   · hiç kullanılmamış cihaz silinir: kalibrasyon kayıtları gider, sertifikası çöpe (indirilemez), denetim izinde eski değer ve silen hesap, kod serbest;
   · kullanılmış cihaz silinmez, sayım doğru döner: zimmet hareketi, raporun cihaz listesi (rapor silinmiş taslak olsa da);
   · yalnız yöneticiler (planlama / denetçi / muhasebe yetkisiz); başka firmanın cihazı "yok"; oturumsuz çağrı reddedilir; uygulama rolünün DELETE'i yok;
   · 358 pasif: zimmetteki / kalibrasyondaki cihaz pasife alınmaz; pasif cihaz seçimden ve Zimmetler'den kalkar, açık rapor kodunu gösterir; etkinleştir.
   Olumsuz kanıt: tests/bozan/kesin-silme.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { cihazKaydet, cihazKarti, cihazKonum, cihazListesi, cihazOzetleri, cihazPasif, cihazSil, cihazSilmeDurumu, kalibrasyonEkle, raporCihazlari, type Kisi } from "../src/modules/olcum-cihazlari/server/cihazlar.ts";
import { raporSil, sahaRaporu } from "../src/modules/raporlar/server/raporlar.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { kesinSil, kullanimlar } from "../src/server/db/silici.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { testKumesi } from "./yardimci/kume.ts";
import { sahaFirmasi, type SahaFirmasi } from "./yardimci/saha-firma.ts";

let kume: GomuluKume, havuz: Havuz, A: string, B: string, FA: SahaFirmasi, FB: SahaFirmasi;
const klasor = mkdtempSync(join(tmpdir(), "kesin-silme-depo-"));
const depo = klasorDepo(klasor);
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const C = { tur: "yeni", yeniTur: "Topraklama ölçer", marka: "Deneme", model: "M1", seri: "S1", aralik: "0–2 kΩ" };
const a = <T,>(k: Kisi, is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const cihaz = async (k: Kisi, kod: string) => tamam(await a(k, (db) => cihazKaydet(db, k, null, 0, { ...C, kod }))).id;

before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await sahaFirmasi(havuz, depo, A, "deneme-a");
  FB = await sahaFirmasi(havuz, depo, B, "deneme-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("kullanılmamış cihaz: yönetici siler — kalibrasyon kayıtları gider, sertifika çöpe, izde eski değer ve silen hesap, kod yeniden kullanılır", async () => {
  const id = await cihaz(FA.elk, "SIL-1");
  tamam(await a(FA.elk, (db) => kalibrasyonEkle(db, depo, FA.elk, A, id, { tarih: "2026-01-10", bitis: "2027-01-10", lab: "Deneme Lab", sertifika: "KL-1", sonuc: "uygun" }, { ad: "kl-1.pdf", bayt: PDF })));
  const dosyaId = (await a(FA.elk, (db) => cihazKarti(db, FA.elk, id)))!.kalibrasyonlar[0].dosyaId!;
  assert.ok(await a(FA.elk, (db) => dosyaIndirilebilir(db, FA.elk, dosyaId, DOSYA_ERISIMI)));
  assert.deepEqual(await a(FA.elk, (db) => cihazSilmeDurumu(db, FA.elk, id)), { sil: true, kullanim: null });
  assert.deepEqual(await a(FA.elk, (db) => cihazSil(db, FA.elk, id)), { durum: "tamam", ad: "SIL-1" });
  assert.equal(await a(FA.elk, (db) => cihazKarti(db, FA.elk, id)), null);
  assert.equal((await a(FA.elk, (db) => db.sorgu("SELECT 1 FROM kalibrasyon WHERE cihaz_id = $1", [id]))).rowCount, 0, "kalibrasyon kayıtları gitti");
  assert.equal(await a(FA.elk, (db) => dosyaIndirilebilir(db, FA.elk, dosyaId, DOSYA_ERISIMI)), null, "sertifika çöpte");
  const iz = (await a(FA.elk, (db) => db.sorgu<{ ne: string; kim: string; hesap_id: string; eski: { kod: string }; ayrinti: { kalibrasyonlar: unknown[]; cope_dosyalar: string[] } }>(
    "SELECT ne, kim, hesap_id::text, eski, ayrinti FROM denetim_izi WHERE nesne = 'olcum_cihazi' AND nesne_id = $1 AND ne = 'cihaz.sil'", [id]))).rows;
  assert.equal(iz.length, 1);
  assert.deepEqual([iz[0].eski.kod, iz[0].hesap_id, iz[0].ayrinti.kalibrasyonlar.length, iz[0].ayrinti.cope_dosyalar], ["SIL-1", FA.elk.id, 1, [dosyaId]]);
  assert.equal(typeof await cihaz(FA.elk, "SIL-1"), "string", "kod serbest kaldı");
  assert.deepEqual(await a(FA.elk, (db) => cihazSil(db, FA.elk, id)), { durum: "yok" }, "ikinci kez");
});

test("kullanılmış cihaz silinmez, sayım döner: zimmet hareketi · raporun cihaz listesi (rapor silinmiş taslak olsa da)", async () => {
  const z = await cihaz(FA.yon, "SIL-Z");
  await a(FA.yon, (db) => db.sorgu("INSERT INTO zimmet_hareket (cihaz_id, alan_personel, zaman) VALUES ($1, $2, now())", [z, FA.den1Personel]));
  assert.deepEqual(await a(FA.yon, (db) => cihazSilmeDurumu(db, FA.yon, z)), { sil: false, kullanim: { zimmet: 1 } });
  assert.deepEqual(await a(FA.yon, (db) => cihazSil(db, FA.yon, z)), { durum: "red", neden: "Cihaz silinemez: 1 zimmet hareketinde kullanıldı." });
  /* raporun cihaz listesi (yabancı anahtarsız JSON) */
  const r = await cihaz(FA.yon, "SIL-R");
  await a(FA.den1, (db) => db.sorgu("UPDATE rapor SET cihazlar = $1::jsonb WHERE id = $2", [JSON.stringify([{ tur: "x", cihaz: r }]), FA.rapor]));
  assert.deepEqual(await a(FA.yon, (db) => cihazSil(db, FA.yon, r)), { durum: "red", neden: "Cihaz silinemez: 1 raporda kullanıldı." });
  const surum = (await a(FA.den1, (db) => db.sorgu<{ surum: number }>("SELECT surum FROM rapor WHERE id = $1", [FA.rapor]))).rows[0].surum;
  tamam(await a(FA.den1, (db) => raporSil(db, FA.den1, FA.rapor, surum)));
  assert.deepEqual(await a(FA.yon, (db) => kesinSil(db, "olcum_cihazi", r, "Deneme")), { durum: "kullanildi", kullanim: { rapor: 1 } }, "silinmiş taslak raporda da kullanılmış");
  assert.ok((await a(FA.yon, (db) => cihazKarti(db, FA.yon, r))) !== null, "cihaz duruyor");
  const bos = await cihaz(FA.yon, "SIL-BOS");
  const harita = await a(FA.yon, (db) => kullanimlar(db, "olcum_cihazi", [z, r, bos]));
  assert.deepEqual([...harita.keys()].sort(), [r, z].sort(), "kullanılmamış kayıt haritada yok");
});

test("yalnız yöneticiler; başka firmanın cihazı yok; oturumsuz çağrı reddedilir; uygulama rolünün DELETE hakkı yok", async () => {
  const id = await cihaz(FA.elk, "SIL-Y");
  for (const k of [FA.plan, FA.den1]) {
    assert.deepEqual(await a(k, (db) => cihazSil(db, k as Kisi, id)), { durum: "yetkisiz" });
    assert.deepEqual(await a(k, (db) => cihazSilmeDurumu(db, k as Kisi, id)), { sil: false, kullanim: null });
  }
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => cihazSil(db, FB.yon, id), { hesapId: FB.yon.id }), { durum: "yok" }, "B, A'nın cihazını silemez");
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => kesinSil(db, "olcum_cihazi", id, "Deneme"), { hesapId: FB.yon.id }), { durum: "yok" }, "işlev de firma süzgeçli");
  await assert.rejects(kiraciIcinde(havuz, A, (db) => kesinSil(db, "olcum_cihazi", id, "Deneme")), /oturumdaki kişi/);
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM olcum_cihazi WHERE id = $1", [id])), /permission denied|izin/i);
  assert.ok((await a(FA.yon, (db) => cihazKarti(db, FA.yon, id))) !== null);
  assert.equal((await a(FA.yon, (db) => cihazSil(db, FA.yon, id))).durum, "tamam", "firma yöneticisi siler");
});

/* 358 — kullanılmış cihaz silinmez, PASİFE alınır (§9 elli üçüncü tur). B firmasının raporuyla (A'nınki yukarıda silindi). */
test("pasif: zimmetteki ya da kalibrasyondaki cihaz pasife alınmaz; depodaki alınır — seçimden kalkar, açık rapor kodunu gösterir; etkinleştir geri getirir", async () => {
  const b = <T,>(k: Kisi, is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
  const id = tamam(await b(FB.yon, (db) => cihazKaydet(db, FB.yon, null, 0, { ...C, kod: "PAS-1" }))).id;
  const surum = async () => (await b(FB.yon, (db) => cihazKarti(db, FB.yon, id)))!.surum;
  await b(FB.yon, (db) => db.sorgu("INSERT INTO zimmet_hareket (cihaz_id, alan_personel, zaman) VALUES ($1, $2, now() - interval '1 hour')", [id, FB.den1Personel]));
  assert.deepEqual(await b(FB.yon, async (db) => cihazPasif(db, FB.yon, id, await surum(), true)),
    { durum: "red", neden: "PAS-1 bir kişinin zimmetinde; önce Zimmetler'den depoya teslim alın." });
  await b(FB.yon, (db) => db.sorgu("INSERT INTO zimmet_hareket (cihaz_id, eden_personel, zaman) VALUES ($1, $2, now())", [id, FB.den1Personel]));
  tamam(await b(FB.yon, async (db) => cihazKonum(db, FB.yon, id, await surum(), "lab")));
  assert.deepEqual(await b(FB.yon, async (db) => cihazPasif(db, FB.yon, id, await surum(), true)), { durum: "red", neden: "PAS-1 kalibrasyonda; önce depoya alın." });
  tamam(await b(FB.yon, async (db) => cihazKonum(db, FB.yon, id, await surum(), "depo")));
  const turId = (await b(FB.yon, (db) => cihazKarti(db, FB.yon, id)))!.turId;
  await b(FB.den1, (db) => db.sorgu("UPDATE rapor SET cihazlar = $1::jsonb WHERE id = $2", [JSON.stringify([{ tur: turId, cihaz: id }]), FB.rapor]));
  assert.equal((await b(FB.yon, (db) => cihazSilmeDurumu(db, FB.yon, id))).sil, false, "kullanılmış: Sil yok");
  assert.deepEqual(await b(FB.plan, (db) => cihazPasif(db, FB.plan as Kisi, id, 0, true)), { durum: "yetkisiz" });
  tamam(await b(FB.yon, async (db) => cihazPasif(db, FB.yon, id, await surum(), true)));
  assert.ok((await b(FB.yon, (db) => cihazKarti(db, FB.yon, id)))!.pasif, "kart açılır, pasif günü");
  assert.ok((await b(FB.yon, (db) => cihazListesi(db, FB.yon)))!.cihazlar.find((x) => x.id === id)?.pasif, "liste Görünüm: Pasif");
  assert.equal((await b(FB.yon, (db) => raporCihazlari(db))).some((x) => x.id === id), false, "rapor seçiminde yok");
  assert.equal((await b(FB.yon, (db) => raporCihazlari(db, { pasifDahil: true }))).find((x) => x.id === id)?.pasif, true, "çözümde var");
  assert.equal((await b(FB.yon, (db) => cihazOzetleri(db))).some((x) => x.id === id), false, "Zimmetler'de yok");
  const satir = (await b(FB.den1, (db) => sahaRaporu(db, FB.den1, FB.rapor)))!.cihazlar.find((x) => x.turId === turId);
  assert.deepEqual([satir?.cihaz?.kod, satir?.cihaz?.eksik], ["PAS-1", false], "açık rapor pasif cihazın kodunu gösterir (eksik değil)");
  tamam(await b(FB.yon, async (db) => cihazPasif(db, FB.yon, id, await surum(), false)));
  assert.equal((await b(FB.yon, (db) => cihazKarti(db, FB.yon, id)))!.pasif, null);
  assert.ok((await b(FB.yon, (db) => raporCihazlari(db))).some((x) => x.id === id), "etkinleştirince seçime döner");
});
