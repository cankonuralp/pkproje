/* NEREDEN GELDİ: 357 — reisim 2026-10-07: "ekipman, cihaz, ekipman türü vb eklenebilen şeylerin silinemediğini tespit ettim; denemek için bir kaç cihaz
   ekledim ama silemedim, bunu da düzeltmeliyiz" + pkproje §9 "silme işlemi sadece yöneticiler tarafından yapılabilmeli". GERÇEK PostgreSQL, iki firma.
   Ortak kesin silme sözleşmesi (src/server/db/silici.ts, göç 0054) ölçüm cihazıyla:
   · hiç kullanılmamış cihaz silinir: kalibrasyon kayıtları gider, sertifikası çöpe (indirilemez), denetim izinde eski değer ve silen hesap, kod serbest;
   · kullanılmış cihaz silinmez, sayım doğru döner: zimmet hareketi, raporun cihaz listesi (rapor silinmiş taslak olsa da);
   · yalnız yöneticiler (planlama / denetçi / muhasebe yetkisiz); başka firmanın cihazı "yok"; oturumsuz çağrı reddedilir; uygulama rolünün DELETE'i yok;
   · 358 pasif: zimmetteki / kalibrasyondaki cihaz pasife alınmaz; pasif cihaz seçimden ve Zimmetler'den kalkar, açık rapor kodunu gösterir; etkinleştir;
   · 359 cihaz türü: ad eşsiz; cihazı olan / raporda geçen tür silinmez; cihazsız tür silinir, ekipman türlerinin cihaz listesinden çıkar;
   · 360 ekipman: yalnız yönetici; kullanılmamış ekipman plan satırı ve kod geçmişiyle silinir (kod serbest); raporlu / tamamlanmış plandaki silinmez;
   · 361 ekipman türü: kullanılmış tür silinmez; kullanılmamış tür fiyat, format sürümleri ve PDF'leriyle silinir (PDF çöpe), kod serbest;
   · 362 demirbaş: kullanılmamış demirbaş silinir (kod serbest); zimmet hareketi / imzalı zimmet formu olan silinmez; zimmetteyken pasife alınmaz;
     pasif demirbaş Zimmetler'de "pasif" işaretli, teslim edilmez, hareketleri adıyla görünür; etkinleştir geri getirir.
   Olumsuz kanıt: tests/bozan/kesin-silme.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { cihazKaydet, cihazKarti, cihazKonum, cihazListesi, cihazOzetleri, cihazPasif, cihazSil, cihazSilmeDurumu, cihazTuruKaydet, cihazTuruListesi, cihazTuruSil, kalibrasyonEkle, raporCihazlari, type Kisi } from "../src/modules/olcum-cihazlari/server/cihazlar.ts";
import { formatYukle, turSil, turSilmeDurumu } from "../src/modules/ekipman-turleri/server/turler.ts";
import { ekipmanSil, planIci } from "../src/modules/planlar/server/plan-ici.ts";
import { demirbasDurumu, demirbasEkle, demirbasPasif, demirbasSil, teslimEt, zimmetListeleri } from "../src/modules/zimmetler/server/zimmet.ts";
import { taslakBaslat } from "../src/modules/rapor-format/server/formatlar.ts";
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

/* 359 — cihaz türü (maket T7 "Cihaz türleri"): ad firmada eşsiz; cihazı olan / raporda tür olarak geçen tür silinmez; cihazsız tür silinir ve ekipman
   türlerinin cihaz listesinden çıkar (sürüm artar, iz yazılır). */
test("cihaz türü: ekle / adını değiştir; cihazı olan ve raporda geçen tür silinmez; cihazsız tür silinir, ekipman türlerinden çıkar", async () => {
  const yeni = tamam(await a(FA.elk, (db) => cihazTuruKaydet(db, FA.elk, null, 0, { ad: "İzolasyon ölçer" })));
  assert.deepEqual(await a(FA.elk, (db) => cihazTuruKaydet(db, FA.elk, null, 0, { ad: "izolasyon ÖLÇER" })),
    { durum: "gecersiz", hatalar: { ad: "izolasyon ÖLÇER adında bir tür zaten var." } }, "Türkçe büyük / küçük harf");
  assert.deepEqual(await a(FA.plan, (db) => cihazTuruKaydet(db, FA.plan as Kisi, null, 0, { ad: "Başka" })), { durum: "yetkisiz" });
  tamam(await a(FA.elk, (db) => cihazTuruKaydet(db, FA.elk, yeni.id, yeni.surum, { ad: "İzolasyon test cihazı" })));
  /* iki ekipman türü bu türü kullanacak */
  const tur2 = (await a(FA.yon, (db) => db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('ET2', 'Deneme türü', 'elektrik', 'e', 12) RETURNING id::text"))).rows[0].id;
  await a(FA.yon, (db) => db.sorgu("UPDATE ekipman_turu SET cihaz_turleri = ARRAY[$1::uuid] WHERE id = ANY ($2::uuid[])", [yeni.id, [FA.tur, tur2]]));
  let satir = (await a(FA.elk, (db) => cihazTuruListesi(db, FA.elk))).find((t) => t.id === yeni.id)!;
  assert.deepEqual([satir.ad, satir.ekipmanTuru, satir.cihaz, satir.sil], ["İzolasyon test cihazı", 2, 0, true]);
  assert.equal((await a(FA.plan, (db) => cihazTuruListesi(db, FA.plan as Kisi))).find((t) => t.id === yeni.id)?.sil, false, "planlama silemez");
  /* cihazı olan tür (cihazı pasif olsa da) */
  const c = tamam(await a(FA.elk, (db) => cihazKaydet(db, FA.elk, null, 0, { ...C, kod: "TUR-1", tur: yeni.id })));
  satir = (await a(FA.elk, (db) => cihazTuruListesi(db, FA.elk))).find((t) => t.id === yeni.id)!;
  assert.deepEqual([satir.cihaz, satir.sil], [1, false]);
  assert.deepEqual(await a(FA.elk, (db) => cihazTuruSil(db, FA.elk, yeni.id)), { durum: "red", neden: "Tür silinemez: 1 cihazda kullanıldı." });
  tamam(await a(FA.elk, (db) => cihazSil(db, FA.elk, c.id)));
  /* cihazsız: silinir; iki ekipman türünden çıkar */
  const once = (await a(FA.yon, (db) => db.sorgu<{ id: string; surum: number }>("SELECT id::text, surum FROM ekipman_turu WHERE id = ANY ($1::uuid[]) ORDER BY id", [[FA.tur, tur2]]))).rows;
  assert.deepEqual(await a(FA.elk, (db) => cihazTuruSil(db, FA.elk, yeni.id)), { durum: "tamam", ad: "İzolasyon test cihazı" });
  const sonra = (await a(FA.yon, (db) => db.sorgu<{ id: string; surum: number; c: string[] }>("SELECT id::text, surum, cihaz_turleri::text[] AS c FROM ekipman_turu WHERE id = ANY ($1::uuid[]) ORDER BY id", [[FA.tur, tur2]]))).rows;
  assert.deepEqual(sonra.map((x) => x.c), [[], []], "ekipman türlerinin cihaz listesinden çıktı");
  assert.deepEqual(sonra.map((x) => x.surum), once.map((x) => x.surum + 1), "sürüm arttı");
  assert.equal((await a(FA.yon, (db) => db.sorgu("SELECT 1 FROM denetim_izi WHERE ne = 'ekipman_turu.baglanti' AND nesne_id = ANY ($1::text[])", [[FA.tur, tur2]]))).rowCount, 2);
  assert.equal((await a(FA.elk, (db) => cihazTuruListesi(db, FA.elk))).some((t) => t.id === yeni.id), false);
  /* raporda tür olarak geçen tür (cihazı başka türe alınmış olabilir) — B firmasının raporu */
  const b = <T,>(k: Kisi, is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
  const rt = tamam(await b(FB.yon, (db) => cihazTuruKaydet(db, FB.yon, null, 0, { ad: "Raporlu tür" })));
  await b(FB.den1, (db) => db.sorgu("UPDATE rapor SET cihazlar = cihazlar || $1::jsonb WHERE id = $2", [JSON.stringify([{ tur: rt.id, cihaz: "00000000-0000-4000-8000-000000000000" }]), FB.rapor]));
  assert.deepEqual(await b(FB.yon, (db) => cihazTuruSil(db, FB.yon, rt.id)), { durum: "red", neden: "Tür silinemez: 1 raporda kullanıldı." });
  assert.deepEqual(await a(FA.yon, (db) => cihazTuruSil(db, FA.yon, rt.id)), { durum: "yok" }, "başka firmanın türü");
});

/* 360 — ekipman (pkproje §9 yirmi üçüncü tur "silme yalnız yönetici"; canDo ekipman_sil): plan içinde, yalnız yöneticiye, hiç kullanılmamış ekipmanda Sil;
   plan satırları ve kod geçmişi birlikte gider, kod serbest; raporu olan ve tamamlanmış planda yer alan silinmez. B firmasında. */
test("ekipman: yönetici kullanılmamış ekipmanı siler (plan satırı ve kod geçmişi gider, kod serbest); raporlu / tamamlanmış plandaki silinmez", async () => {
  const b = <T,>(k: Kisi, is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
  const ekipmanAc = async (kod: string) => {
    const id = (await b(FB.yon, (db) => db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'Deneme') RETURNING id::text", [FB.tesis, FB.tur, kod]))).rows[0].id;
    await b(FB.yon, (db) => db.sorgu("INSERT INTO plan_ekipman (plan_id, ekipman_id, ekleyen) VALUES ($1, $2, 'Deneme')", [FB.planId, id]));
    return id;
  };
  const yeni = await ekipmanAc("EP-SIL");
  const v = (await b(FB.yon, (db) => planIci(db, FB.yon, FB.planId)))!;
  assert.equal(v.izin.ekipmanSil, true);
  assert.deepEqual(v.ekipman.map((x) => [x.kod, x.sil]).sort(), [["EP-A1", false], ["EP-SIL", true]], "raporlu ekipmanda Sil yok");
  assert.equal((await b(FB.den1, (db) => planIci(db, FB.den1, FB.planId)))!.izin.ekipmanSil, false, "denetçi silmez (pasife alır)");
  assert.deepEqual(await b(FB.den1, (db) => ekipmanSil(db, FB.den1, FB.planId, yeni)), { durum: "yetkisiz" });
  assert.deepEqual(await b(FB.plan, (db) => ekipmanSil(db, FB.plan, FB.planId, yeni)), { durum: "yetkisiz" });
  assert.deepEqual(await b(FB.yon, (db) => ekipmanSil(db, FB.yon, FB.planId, FB.ekipman)),
    { durum: "red", neden: "Ekipman silinemez: 1 raporda kullanıldı. Yanlış girildiyse pasife alın." });
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => ekipmanSil(db, FA.yon, FB.planId, yeni), { hesapId: FA.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await b(FB.yon, (db) => ekipmanSil(db, FB.yon, FB.planId, yeni)), { durum: "tamam", bildirim: "EP-SIL silindi." });
  const kalan = (await b(FB.yon, (db) => db.sorgu<{ p: number; k: number }>(
    "SELECT (SELECT count(*)::int FROM plan_ekipman WHERE ekipman_id = $1) AS p, (SELECT count(*)::int FROM ekipman_kodu WHERE ekipman_id = $1) AS k", [yeni]))).rows[0];
  assert.deepEqual(kalan, { p: 0, k: 0 }, "plan satırı ve kod geçmişi gitti");
  assert.equal(typeof await ekipmanAc("EP-SIL"), "string", "kod serbest kaldı");
  /* tamamlanmış plan (durum geçişi testin kapsamı dışında — süper kullanıcı tetikleri atlayarak kapatır) */
  const z = await ekipmanAc("EP-TAM");
  const s = kume.sahipIstemci(); await s.connect();
  try {
    await s.query("SET session_replication_role = replica");
    await s.query("UPDATE plan SET durum = 'tamamlandi', kontrol_tamam = now(), bitti = now() WHERE id = $1", [FB.planId]);
  } finally { await s.end(); }
  assert.deepEqual(await b(FB.yon, (db) => ekipmanSil(db, FB.yon, FB.planId, z)),
    { durum: "red", neden: "Ekipman silinemez: 1 tamamlanmış planda kullanıldı. Yanlış girildiyse pasife alın." });
  await assert.rejects(b(FB.yon, (db) => db.sorgu("DELETE FROM ekipman WHERE id = $1", [z])), /permission denied|izin/i, "uygulama rolünün DELETE'i yok");
});

/* 361 — ekipman türü: yalnız yönetici; ekipmanı / raporu olan tür silinmez; kullanılmamış tür fiyatı, format sürümleri ve PDF'leriyle silinir, kod serbest */
test("ekipman türü: kullanılmış tür silinmez; kullanılmamış tür fiyat, format taslağı ve PDF'iyle silinir, kod serbest; yalnız yönetici", async () => {
  assert.deepEqual(await a(FA.yon, (db) => turSilmeDurumu(db, FA.yon, FA.tur)), { sil: false, kullanim: { rapor: 1, ekipman: 1 } });
  assert.deepEqual(await a(FA.yon, (db) => turSil(db, FA.yon, FA.tur)), { durum: "red", neden: "Ekipman türü silinemez: 1 raporda, 1 ekipmanda kullanıldı." });
  const turAc = async (kod: string) => (await a(FA.yon, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ($1, 'Silinecek tür', 'elektrik', 'e', 12) RETURNING id::text", [kod]))).rows[0].id;
  const id = await turAc("SLT");
  await a(FA.yon, (db) => db.sorgu("INSERT INTO fiyat_listesi (tur_id, fiyat) VALUES ($1, 90000)", [id]));
  tamam(await a(FA.yon, (db) => taslakBaslat(db, FA.yon, id, "sablon:ZPKR02", null)));
  assert.equal((await a(FA.yon, (db) => formatYukle(db, depo, FA.yon, A, id, { ad: "slt-format.pdf", bayt: PDF }, ""))).durum, "tamam");
  const dosyaId = (await a(FA.yon, (db) => db.sorgu<{ d: string }>("SELECT dosya_id::text AS d FROM tur_format WHERE tur_id = $1", [id]))).rows[0].d;
  assert.deepEqual(await a(FA.yon, (db) => turSilmeDurumu(db, FA.yon, id)), { sil: true, kullanim: null });
  for (const k of [FA.plan, FA.den1]) assert.deepEqual(await a(k, (db) => turSil(db, k, id)), { durum: "yetkisiz" });
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => turSil(db, FB.yon, id), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await a(FA.yon, (db) => turSil(db, FA.yon, id)), { durum: "tamam", ad: "SLT · Silinecek tür" });
  const kalan = (await a(FA.yon, (db) => db.sorgu<{ f: number; r: number; t: number; c: boolean }>(
    `SELECT (SELECT count(*)::int FROM fiyat_listesi WHERE tur_id = $1) AS f, (SELECT count(*)::int FROM rapor_format WHERE tur_id = $1) AS r,
            (SELECT count(*)::int FROM tur_format WHERE tur_id = $1) AS t, (SELECT cop IS NOT NULL FROM dosya WHERE id = $2) AS c`, [id, dosyaId]))).rows[0];
  assert.deepEqual(kalan, { f: 0, r: 0, t: 0, c: true }, "fiyat, format sürümü, PDF kaydı gitti; PDF çöpte");
  assert.equal(typeof await turAc("SLT"), "string", "kod serbest kaldı");
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM ekipman_turu WHERE id = $1", [FA.tur])), /permission denied|izin/i);
});

/* 362 — demirbaş (Zimmetler): yalnız yönetici siler, yalnız hiç kullanılmamışı; kullanılmışı depodayken pasife alınır */
test("demirbaş: kullanılmamış silinir, kod serbest; zimmet hareketi / zimmet formu olan silinmez; zimmetteyken pasif olmaz; pasif teslim edilmez", async () => {
  const ekle = async (kod: string) => tamam(await a(FA.yon, (db) => demirbasEkle(db, FA.yon, { kod, ad: "Deneme merdiveni" }))).id;
  const id = await ekle("DM-SIL");
  assert.deepEqual(await a(FA.yon, (db) => demirbasDurumu(db, FA.yon, id)), { surum: 0, pasif: false, sil: true, kullanim: null });
  for (const k of [FA.plan, FA.den1]) assert.deepEqual(await a(k, (db) => demirbasSil(db, k, id)), { durum: "yetkisiz" });
  assert.equal(await a(FA.plan, (db) => demirbasDurumu(db, FA.plan, id)), null, "değiştiremeyene durum yok");
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => demirbasSil(db, FB.yon, id), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await a(FA.yon, (db) => demirbasSil(db, FA.yon, id)), { durum: "tamam", ad: "DM-SIL" });
  const iz = (await a(FA.yon, (db) => db.sorgu<{ eski: { kod: string }; hesap_id: string }>(
    "SELECT eski, hesap_id::text FROM denetim_izi WHERE ne = 'demirbas.sil' AND nesne_id = $1", [id]))).rows;
  assert.deepEqual(iz.map((x) => [x.eski.kod, x.hesap_id]), [["DM-SIL", FA.yon.id]]);
  assert.equal(typeof await ekle("DM-SIL"), "string", "kod serbest kaldı");

  /* zimmet hareketi: silinmez; zimmetteyken pasife alınmaz */
  const z = await ekle("DM-ZIM");
  const teslim = (alan: string, saat: string) => a(FA.yon, (db) => teslimEt(db, depo, FA.yon, A, { varlik: `d:${z}`, alan, zaman: `2026-10-01T${saat}`, notu: "" }));
  tamam(await teslim(FA.den1Personel, "10:00"));
  const d1 = (await a(FA.yon, (db) => demirbasDurumu(db, FA.yon, z)))!;
  assert.deepEqual([d1.sil, d1.kullanim], [false, { zimmet: 1 }]);
  assert.deepEqual(await a(FA.yon, (db) => demirbasSil(db, FA.yon, z)), { durum: "red", neden: "Demirbaş silinemez: 1 zimmet hareketinde kullanıldı." });
  assert.deepEqual(await a(FA.yon, (db) => demirbasPasif(db, FA.yon, z, d1.surum, true)), { durum: "red", neden: "DM-ZIM bir kişinin zimmetinde; önce depoya teslim alın." });
  tamam(await teslim("depo", "11:00"));
  assert.deepEqual(await a(FA.plan, (db) => demirbasPasif(db, FA.plan, z, d1.surum, true)), { durum: "yetkisiz" });
  assert.deepEqual(await a(FA.yon, (db) => demirbasPasif(db, FA.yon, z, d1.surum + 5, true)), { durum: "cakisma" });
  tamam(await a(FA.yon, (db) => demirbasPasif(db, FA.yon, z, d1.surum, true)));
  const l = (await a(FA.yon, (db) => zimmetListeleri(db, FA.yon)))!;
  assert.equal(l.varliklar.find((v) => v.anahtar === `d:${z}`)?.pasif, true, "listede pasif işaretli (Görünüm: Pasif)");
  assert.deepEqual(l.hareketler.filter((h) => h.varlik === `d:${z}`).map((h) => h.varlikKod), ["DM-ZIM", "DM-ZIM"], "hareketler adıyla");
  assert.deepEqual(await teslim(FA.den1Personel, "12:00"), { durum: "gecersiz", hatalar: { varlik: "DM-ZIM pasif; önce etkinleştirin." } });
  const d2 = (await a(FA.yon, (db) => demirbasDurumu(db, FA.yon, z)))!;
  assert.equal(d2.pasif, true);
  tamam(await a(FA.yon, (db) => demirbasPasif(db, FA.yon, z, d2.surum, false)));
  assert.equal((await a(FA.yon, (db) => demirbasDurumu(db, FA.yon, z)))!.pasif, false, "etkinleştirildi");

  /* imzalı zimmet formunun kapsamı (yabancı anahtarsız) */
  const f = await ekle("DM-FRM");
  await a(FA.yon, (db) => db.sorgu("INSERT INTO zimmet_formu (personel_id, kapsam) VALUES ($1, $2)", [FA.den1Personel, [`d:${f}`]]));
  assert.deepEqual(await a(FA.yon, (db) => demirbasSil(db, FA.yon, f)), { durum: "red", neden: "Demirbaş silinemez: 1 zimmet formunda kullanıldı." });
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM demirbas WHERE id = $1", [f])), /permission denied|izin/i);
});
