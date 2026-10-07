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
     pasif demirbaş Zimmetler'de "pasif" işaretli, teslim edilmez, hareketleri adıyla görünür; etkinleştir geri getirir;
   · 363 araç: kullanılmamış araç silinir (plaka serbest); zimmet hareketi / haftalık kilometresi olan silinmez; zimmetteyken pasife alınmaz; pasif
     araç listede işaretli, sayfası açılır, kilometre girilmez, Zimmetler'de de pasif; etkinleştir geri getirir;
   · 364 müşteri / tesis: yalnız firma yöneticisi; kullanılmamış müşteri tesisleri, hiç girilmemiş girişi ve kaldırılmış İSG kaydıyla silinir (giriş
     parolası ize yazılmaz); planlı müşteri ve girilmiş girişi olan müşteri silinmez; giriş kapsamındaki tesis silinmez;
   · 365 (352–361 incelemesi): pasif cihazın zimmet hareketleri kodla görünür; plan içi ekipman silme Ekipman'da "yaz" ister (elektrik yöneticisi
     varsayılan matriste silemez), ekipman yoksa "Plan bulunamadı" demez; teklifin ekipman listesindeki tür silinmez, silinen formatın tanımı izde;
     "IR" / "ir" gibi veritabanının aynı saydığı tür adı uyarıyla döner (23505 ile düşmez);
   · 366 personel: yalnız firma yöneticisi; kullanılmamış kişi hiç girilmemiş hesabı ve kaldırılmış İSG kaydıyla silinir (parola ize yazılmaz);
     giriş yapılmış hesabı ya da zimmeti olan silinmez; kişi kendini silmez; Ayrıldı → hesap kapanır, geri al çalışıyor yapar;
   · 367 müşteri girişi: hiç girilmemiş ek giriş yalnız yöneticiye silinir (kullanıcı adı serbest, parola ize yazılmaz); ana giriş ve panele girilmiş
     giriş silinmez;
   · 368 teklif: taslak kalemleri ve tesisleriyle silinir (yalnız yönetici; hazırlayan planlama silemez); kopyası olan ve gönderilmiş teklif silinmez;
   · 369 sözleşme: imza bekleyen sözleşme kapsam tesisleriyle silinir; imzalı tarama bir kez yüklenmişse (kaldırılmış olsa da) silinmez;
   · 370 rapor formatı: taslak yalnız yöneticiye silinir (tanımı izde); yayınlanmış sürüm silinmez;
   · 371 eğitim: kaydı olan tür silinmez; sertifikası yüklü kayıt silinmez; güncel kayıt silinince öncekisi güncel olur; boşalan tür silinir.
   Olumsuz kanıt: tests/bozan/kesin-silme.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { cihazKaydet, cihazKarti, cihazKonum, cihazListesi, cihazOzetleri, cihazPasif, cihazSil, cihazSilmeDurumu, cihazTuruKaydet, cihazTuruListesi, cihazTuruSil, kalibrasyonEkle, raporCihazlari, type Kisi } from "../src/modules/olcum-cihazlari/server/cihazlar.ts";
import { formatYukle, turSil, turSilmeDurumu } from "../src/modules/ekipman-turleri/server/turler.ts";
import { ekipmanSil, planIci } from "../src/modules/planlar/server/plan-ici.ts";
import { aracKaydet, aracKarti, aracListesi, aracPasif, aracSil, aracSilmeDurumu, kmKaydet } from "../src/modules/araclar/server/araclar.ts";
import { anaGeciciParola, ekGirisEkle, girisBilgisi, girisSil } from "../src/modules/musteriler/server/girisler.ts";
import { musteriKaydet, musteriSil, silmeDurumu, tesisKaydet, tesisSil } from "../src/modules/musteriler/server/musteriler.ts";
import { personelAyrildi, personelEkle, personelGeriAl, personelKarti, personelSil, personelSilmeDurumu } from "../src/modules/personel/server/personel.ts";
import { hesapAc } from "../src/server/kimlik/hesapYonetimi.ts";
import { teklifKarti, teklifSil } from "../src/modules/teklifler/server/teklifler.ts";
import { imzaliYukle, sozlesmeSil, sozlesmeSilinir } from "../src/modules/sozlesmeler/server/sozlesmeler.ts";
import { demirbasDurumu, demirbasEkle, demirbasPasif, demirbasSil, teslimEt, zimmetListeleri } from "../src/modules/zimmetler/server/zimmet.ts";
import { taslakBaslat, taslakSil } from "../src/modules/rapor-format/server/formatlar.ts";
import { egitimKaydiSil, egitimListesi, egitimTuruSil } from "../src/modules/egitimler/server/egitimler.ts";
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
  assert.deepEqual((await b(FB.yon, (db) => zimmetListeleri(db, FB.yon)))!.hareketler.filter((h) => h.varlik === `c:${id}`).map((h) => h.varlikKod),
    ["PAS-1", "PAS-1"], "365: pasif cihazın zimmet hareketleri kodla (Kaldırılan varlık değil)");
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
  tamam(await a(FA.elk, (db) => cihazTuruKaydet(db, FA.elk, null, 0, { ad: "IR termometre" })));
  assert.deepEqual(await a(FA.elk, (db) => cihazTuruKaydet(db, FA.elk, null, 0, { ad: "ir termometre" })),
    { durum: "gecersiz", hatalar: { ad: "ir termometre adında bir tür zaten var." } }, "365: veritabanı dizininin (lower) aynı saydığı ad 23505 ile düşmez");
  assert.deepEqual(await a(FA.plan, (db) => cihazTuruKaydet(db, FA.plan as Kisi, null, 0, { ad: "Başka" })), { durum: "yetkisiz" });
  tamam(await a(FA.elk, (db) => cihazTuruKaydet(db, FA.elk, yeni.id, yeni.surum, { ad: "İzolasyon test cihazı" })));
  /* iki ekipman türü bu türü kullanacak */
  const tur2 = (await a(FA.yon, (db) => db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('ETK', 'Deneme türü', 'elektrik', 'e', 12) RETURNING id::text"))).rows[0].id;
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

/* 360 — ekipman (pkproje §9 yirmi üçüncü tur "silme yalnız yönetici"; 365: canDo kayit_sil, Ekipman'da "yaz"): plan içinde, yalnız yöneticiye, hiç kullanılmamış ekipmanda Sil;
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
  /* 365: kayit_sil — elektrik yöneticisi varsayılan matriste Ekipman'da "gör": tuş yok, sunucu reddeder */
  assert.equal((await b(FB.elk, (db) => planIci(db, FB.elk, FB.planId)))?.izin.ekipmanSil ?? false, false, "Ekipman'da yaz değil: silmez");
  assert.deepEqual(await b(FB.elk, (db) => ekipmanSil(db, FB.elk, FB.planId, yeni)), { durum: "yetkisiz" });
  assert.deepEqual(await b(FB.den1, (db) => ekipmanSil(db, FB.den1, FB.planId, yeni)), { durum: "yetkisiz" });
  assert.deepEqual(await b(FB.plan, (db) => ekipmanSil(db, FB.plan, FB.planId, yeni)), { durum: "yetkisiz" });
  assert.deepEqual(await b(FB.yon, (db) => ekipmanSil(db, FB.yon, FB.planId, FB.ekipman)),
    { durum: "red", neden: "Ekipman silinemez: 1 raporda kullanıldı. Yanlış girildiyse pasife alın." });
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => ekipmanSil(db, FA.yon, FB.planId, yeni), { hesapId: FA.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await b(FB.yon, (db) => ekipmanSil(db, FB.yon, FB.planId, yeni)), { durum: "tamam", bildirim: "EP-SIL silindi." });
  const kalan = (await b(FB.yon, (db) => db.sorgu<{ p: number; k: number }>(
    "SELECT (SELECT count(*)::int FROM plan_ekipman WHERE ekipman_id = $1) AS p, (SELECT count(*)::int FROM ekipman_kodu WHERE ekipman_id = $1) AS k", [yeni]))).rows[0];
  assert.deepEqual(kalan, { p: 0, k: 0 }, "plan satırı ve kod geçmişi gitti");
  assert.deepEqual(await b(FB.yon, (db) => ekipmanSil(db, FB.yon, FB.planId, yeni)), { durum: "red", neden: "Ekipman bu planda yok ya da silinmiş." }, "365: ikinci kez");
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
  const iz = (await a(FA.yon, (db) => db.sorgu<{ f: Record<string, unknown>[] }>("SELECT ayrinti->'formatlar' AS f FROM denetim_izi WHERE ne = 'ekipman_turu.sil' AND nesne_id = $1", [id]))).rows[0];
  assert.ok(iz.f.length === 1 && "tanim" in iz.f[0], "365: silinen format sürümü izde tanımıyla");
  assert.equal(typeof await turAc("SLT"), "string", "kod serbest kaldı");
  /* 365: yalnız teklifin Excel'den yüklenen ekipman listesinde geçen tür (kalemi kaldırılmış) silinmez */
  const tk = await turAc("TKL");
  await a(FA.yon, (db) => db.sorgu(`INSERT INTO teklif (no, aday, gecerlilik, ekipmanlar) VALUES ('TK-2026-901', '{"unvan": "Aday Deneme"}', 30, $1::jsonb)`,
    [JSON.stringify([{ kod: "X-1", tur: tk, konum: "", seri: "" }])]));
  assert.deepEqual(await a(FA.yon, (db) => turSilmeDurumu(db, FA.yon, tk)), { sil: false, kullanim: { teklif_belgesi: 1 } });
  assert.deepEqual(await a(FA.yon, (db) => turSil(db, FA.yon, tk)), { durum: "red", neden: "Ekipman türü silinemez: 1 teklifte kullanıldı." });
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

/* 363 — araç (Araçlar): yalnız yönetici siler, yalnız hiç kullanılmamışı; kullanılmışı depodayken pasife alınır */
test("araç: kullanılmamış silinir, plaka serbest; zimmet hareketi / kilometresi olan silinmez; zimmetteyken pasif olmaz; pasif kilometre almaz", async () => {
  const ARAC = { tur: "Hafif ticari araç", marka: "Deneme", model: "Model", yil: "2022", yakit: "dizel", ilkKm: "1.000", bakimKm: "", muayene: "", sigorta: "", kasko: "" };
  const ekle = async (plaka: string) => tamam(await a(FA.yon, (db) => aracKaydet(db, FA.yon, null, 0, { ...ARAC, plaka }))).id;
  const id = await ekle("00 SIL 001");
  assert.deepEqual(await a(FA.yon, (db) => aracSilmeDurumu(db, FA.yon, id)), { sil: true, kullanim: null });
  for (const k of [FA.plan, FA.den1, FA.elk]) assert.deepEqual(await a(k, (db) => aracSil(db, k, id)), { durum: "yetkisiz" }, k.roller.join());
  assert.deepEqual(await a(FA.elk, (db) => aracSilmeDurumu(db, FA.elk, id)), { sil: false, kullanim: null }, "araçları yalnız gören yönetici silemez");
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => aracSil(db, FB.yon, id), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await a(FA.yon, (db) => aracSil(db, FA.yon, id)), { durum: "tamam", ad: "00 SIL 001" });
  assert.equal((await a(FA.yon, (db) => db.sorgu("SELECT 1 FROM denetim_izi WHERE ne = 'arac.sil' AND nesne_id = $1", [id]))).rowCount, 1);
  assert.equal(typeof await ekle("00 SIL 001"), "string", "plaka serbest kaldı");

  /* zimmet hareketi + haftalık kilometre: silinmez; zimmetteyken pasife alınmaz */
  const z = await ekle("00 SIL 002");
  await a(FA.yon, (db) => db.sorgu("INSERT INTO zimmet_hareket (arac_id, alan_personel, zaman, km) VALUES ($1, $2, now() - interval '2 hour', 1100)", [z, FA.den1Personel]));
  await a(FA.yon, (db) => db.sorgu("INSERT INTO arac_km (arac_id, hafta, km, personel_id) VALUES ($1, date_trunc('week', now())::date, 1150, $2)", [z, FA.den1Personel]));
  const k = (await a(FA.yon, (db) => aracKarti(db, FA.yon, z)))!;
  assert.deepEqual(await a(FA.yon, (db) => aracSilmeDurumu(db, FA.yon, z)), { sil: false, kullanim: { km: 1, zimmet: 1 } });
  assert.deepEqual(await a(FA.yon, (db) => aracSil(db, FA.yon, z)), { durum: "red", neden: "Araç silinemez: 1 kilometre kaydında, 1 zimmet hareketinde kullanıldı." });
  assert.deepEqual(await a(FA.yon, (db) => aracPasif(db, FA.yon, z, k.surum, true)), { durum: "red", neden: "00 SIL 002 bir kişinin zimmetinde; önce teslim tutanağıyla depoya alın." });
  await a(FA.yon, (db) => db.sorgu("INSERT INTO zimmet_hareket (arac_id, eden_personel, zaman, km) VALUES ($1, $2, now() - interval '1 hour', 1200)", [z, FA.den1Personel]));
  assert.deepEqual(await a(FA.elk, (db) => aracPasif(db, FA.elk, z, k.surum, true)), { durum: "yetkisiz" });
  tamam(await a(FA.yon, (db) => aracPasif(db, FA.yon, z, k.surum, true)));
  assert.ok((await a(FA.yon, (db) => aracListesi(db, FA.yon)))!.araclar.find((x) => x.id === z)?.pasif, "liste Görünüm: Pasif");
  const p = (await a(FA.yon, (db) => aracKarti(db, FA.yon, z)))!;
  assert.deepEqual([!!p.pasif, p.tutanaklar.length, p.kmGecmisi.some((x) => x.km === 1150)], [true, 2, true], "sayfa açılır; tutanaklar ve kilometre geçmişi durur");
  assert.deepEqual(await a(FA.yon, (db) => kmKaydet(db, FA.yon, z, { km: "1.300" })), { durum: "yok" }, "pasif araca kilometre girilmez");
  assert.equal((await a(FA.yon, (db) => zimmetListeleri(db, FA.yon)))!.varliklar.find((v) => v.anahtar === `a:${z}`)?.pasif, true, "Zimmetler'de pasif");
  tamam(await a(FA.yon, (db) => aracPasif(db, FA.yon, z, p.surum, false)));
  assert.equal((await a(FA.yon, (db) => aracKarti(db, FA.yon, z)))!.pasif, null, "etkinleştirildi");
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM arac WHERE id = $1", [z])), /permission denied|izin/i);
});

/* 364 — müşteri ve tesis (karar 48 kullanılmış müşteri için geçerli; deneme müşterisi silinir) */
test("müşteri / tesis: kullanılmamış silinir (tesisleri, hiç girilmemiş girişi, kaldırılmış İSG ID'siyle); planlı ya da girişi kullanılmış silinmez", async () => {
  const M = { kisa: "", vd: "", vno: "", eposta: "", tel: "", ilgili: "" };
  const T = { adres: "Deneme Cad. 2", il: "Ankara", ilce: "Çankaya", sgk: "" };
  const musteri = async (unvan: string) => tamam(await a(FA.yon, (db) => musteriKaydet(db, FA.yon, null, 0, { ...M, unvan }, true))).id;
  const tesis = async (m: string, ad: string) => tamam(await a(FA.yon, (db) => tesisKaydet(db, FA.yon, m, null, 0, { ...T, ad }, true))).id;
  const m = await musteri("Silinecek Deneme A.Ş.");
  const t1 = await tesis(m, "Depo"), t2 = await tesis(m, "Şube");
  tamam(await a(FA.yon, (db) => ekGirisEkle(db, FA.yon, m, { ad: "Deneme", eposta: "giris@silinecek.example", tesisler: [t1] })));
  await a(FA.yon, (db) => db.sorgu("INSERT INTO isg_katip (tesis_id, personel_id, no, kaldirildi) VALUES ($1, $2, 'ISG-SIL', now())", [t2, FA.den1Personel]));

  /* tesis: giriş kapsamındaki silinmez; kaldırılmış İSG ID'si kullanım değil, birlikte gider */
  assert.deepEqual(await a(FA.yon, (db) => silmeDurumu(db, FA.yon, "tesis", t1)), { sil: false, kullanim: { giris: 1 } });
  assert.deepEqual(await a(FA.yon, (db) => tesisSil(db, FA.yon, t1)), { durum: "red", neden: "Tesis silinemez: 1 müşteri girişinde kullanıldı. Pasife alın." });
  assert.deepEqual(await a(FA.yon, (db) => silmeDurumu(db, FA.yon, "tesis", t2)), { sil: true, kullanim: null });
  for (const k of [FA.plan, FA.elk, FA.den1]) assert.deepEqual(await a(k, (db) => tesisSil(db, k, t2)), { durum: "yetkisiz" }, k.roller.join());
  assert.deepEqual(await a(FA.plan, (db) => silmeDurumu(db, FA.plan, "tesis", t2)), { sil: false, kullanim: null }, "planlama değiştirir ama silemez");
  assert.deepEqual(await a(FA.yon, (db) => tesisSil(db, FA.yon, t2)), { durum: "tamam", ad: "Şube" });
  assert.equal((await a(FA.yon, (db) => db.sorgu("SELECT 1 FROM isg_katip WHERE tesis_id = $1", [t2]))).rowCount, 0, "kaldırılmış İSG kaydı gitti");

  /* müşteri: hiç girilmemiş giriş ve kalan tesisiyle silinir; iz parolayı taşımaz */
  assert.deepEqual(await a(FA.yon, (db) => silmeDurumu(db, FA.yon, "musteri", m)), { sil: true, kullanim: null });
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => musteriSil(db, FB.yon, m), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.equal((await a(FA.yon, (db) => musteriSil(db, FA.yon, m))).durum, "tamam");
  const kalan = (await a(FA.yon, (db) => db.sorgu<{ t: number; g: number; m: number }>(
    `SELECT (SELECT count(*)::int FROM tesis WHERE musteri_id = $1) AS t, (SELECT count(*)::int FROM musteri_hesap WHERE musteri_id = $1) AS g,
            (SELECT count(*)::int FROM musteri WHERE id = $1) AS m`, [m]))).rows[0];
  assert.deepEqual(kalan, { t: 0, g: 0, m: 0 });
  const iz = (await a(FA.yon, (db) => db.sorgu<{ ayrinti: { tesisler: unknown[]; girisler: Record<string, unknown>[] } }>(
    "SELECT ayrinti FROM denetim_izi WHERE ne = 'musteri.sil' AND nesne_id = $1", [m]))).rows[0];
  assert.deepEqual([iz.ayrinti.tesisler.length, iz.ayrinti.girisler.length, "parola_ozeti" in iz.ayrinti.girisler[0]], [1, 1, false]);
  assert.equal(typeof await musteri("Silinecek Deneme A.Ş."), "string", "aynı ünvanla yeniden açılır");

  /* kullanılmış: planlı müşteri; girilmiş giriş */
  const sahaMusteri = (await a(FA.yon, (db) => db.sorgu<{ m: string }>("SELECT musteri_id::text AS m FROM tesis WHERE id = $1", [FA.tesis]))).rows[0].m;
  const d = await a(FA.yon, (db) => silmeDurumu(db, FA.yon, "musteri", sahaMusteri));
  assert.ok(!d.sil && d.kullanim?.plan && d.kullanim?.ekipman, JSON.stringify(d));
  assert.match((await a(FA.yon, (db) => musteriSil(db, FA.yon, sahaMusteri)) as { neden: string }).neden, /^Müşteri silinemez: .*planda.* Pasife alın\.$/);
  const g = await musteri("Girişli Deneme A.Ş.");
  tamam(await a(FA.yon, (db) => ekGirisEkle(db, FA.yon, g, { ad: "Deneme", eposta: "giris@girisli.example", tesisler: "hepsi" })));
  await a(FA.yon, (db) => db.sorgu("UPDATE musteri_hesap SET son_giris = now() WHERE musteri_id = $1", [g]));
  assert.deepEqual(await a(FA.yon, (db) => musteriSil(db, FA.yon, g)), { durum: "red", neden: "Müşteri silinemez: 1 müşteri girişinde kullanıldı. Pasife alın." });
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM musteri WHERE id = $1", [g])), /permission denied|izin/i);
});

/* 366 — personel (karar 43: kullanılmış personel silinmez, "Ayrıldı" olur; deneme / yanlış girilmiş kişi silinir) */
test("personel: kullanılmamış silinir (hiç girilmemiş hesabı, kaldırılmış İSG ID'siyle); girişli / zimmetli silinmez; kendini silmez; ayrıldı / geri al", async () => {
  const P = { eposta: "", imzaTel: "", basla: "2024-02-01", meslek: "elk-muh", meslekMetin: "", diploma: "", oda: "", ekipnet: "" };
  const ekle = async (ad: string) => tamam(await a(FA.yon, (db) => personelEkle(db, FA.yon, { ...P, ad }))).id;
  const id = await ekle("Silinecek Kişi");
  tamam(await a(FA.yon, (db) => hesapAc(db, FA.yon, id, { eposta: "silinecek@deneme-a.example", roller: ["denetci"] })));
  await a(FA.yon, (db) => db.sorgu("INSERT INTO isg_katip (tesis_id, personel_id, no, kaldirildi) VALUES ($1, $2, 'ISG-PS', now())", [FA.tesis, id]));
  assert.deepEqual(await a(FA.yon, (db) => personelSilmeDurumu(db, FA.yon, id)), { sil: true, kullanim: null }, "girilmemiş hesap ve kaldırılmış İSG ID kullanım değil");
  for (const k of [FA.plan, FA.elk, FA.den1]) assert.deepEqual(await a(k, (db) => personelSil(db, k, id)), { durum: "yetkisiz" }, k.roller.join());
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => personelSil(db, FB.yon, id), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");

  /* Ayrıldı → hesap kapanır; geri al → çalışıyor (hesap kapalı kalır); hâlâ kullanılmamış */
  const s0 = (await a(FA.yon, (db) => personelKarti(db, FA.yon, id)))!.surum;
  tamam(await a(FA.yon, (db) => personelAyrildi(db, FA.yon, id, s0, "2026-10-01")));
  const k1 = (await a(FA.yon, (db) => personelKarti(db, FA.yon, id)))!;
  assert.deepEqual([k1.durum, k1.hesapAyrinti?.durum], ["ayrildi", "pasif"]);
  assert.deepEqual(await a(FA.plan, (db) => personelGeriAl(db, FA.plan, id, k1.surum)), { durum: "yetkisiz" });
  tamam(await a(FA.yon, (db) => personelGeriAl(db, FA.yon, id, k1.surum)));
  assert.equal((await a(FA.yon, (db) => personelKarti(db, FA.yon, id)))!.durum, "etkin");

  assert.deepEqual(await a(FA.yon, (db) => personelSil(db, FA.yon, id)), { durum: "tamam", ad: "Silinecek Kişi" });
  const kalan = (await a(FA.yon, (db) => db.sorgu<{ h: number; i: number; p: number }>(
    `SELECT (SELECT count(*)::int FROM hesap WHERE personel_id = $1) AS h, (SELECT count(*)::int FROM isg_katip WHERE personel_id = $1) AS i,
            (SELECT count(*)::int FROM personel WHERE id = $1) AS p`, [id]))).rows[0];
  assert.deepEqual(kalan, { h: 0, i: 0, p: 0 });
  const iz = (await a(FA.yon, (db) => db.sorgu<{ ayrinti: { hesaplar: Record<string, unknown>[] } }>(
    "SELECT ayrinti FROM denetim_izi WHERE ne = 'personel.sil' AND nesne_id = $1", [id]))).rows[0];
  assert.deepEqual([iz.ayrinti.hesaplar.length, "parola_ozeti" in iz.ayrinti.hesaplar[0]], [1, false], "hesap ize parolasız");
  const yeniden = await ekle("Yeniden Kişi");
  tamam(await a(FA.yon, (db) => hesapAc(db, FA.yon, yeniden, { eposta: "silinecek@deneme-a.example", roller: ["denetci"] })));

  /* kullanılmış: giriş yapılmış hesap (öteki testlerde girişi yapılmış uydurma denetçi) · zimmet · kendisi */
  const girisli = await ekle("Girişli Kişi");
  tamam(await a(FA.yon, (db) => hesapAc(db, FA.yon, girisli, { eposta: "girisli@deneme-a.example", roller: ["denetci"] })));
  const hesapId = (await a(FA.yon, (db) => db.sorgu<{ id: string }>("SELECT id::text FROM hesap WHERE personel_id = $1", [girisli]))).rows[0].id;
  await a(FA.yon, (db) => db.sorgu("INSERT INTO denetim_izi (kim, ne, nesne, nesne_id) VALUES ('girisli@deneme-a.example', 'giris.yapildi', 'hesap', $1)", [hesapId]));
  assert.deepEqual(await a(FA.yon, (db) => personelSil(db, FA.yon, girisli)),
    { durum: "red", neden: 'Personel silinemez: 1 giriş yapılmış hesapta kullanıldı. Ayrıldıysa "Ayrıldı" deyin.' });
  const z = (await a(FA.yon, (db) => personelSilmeDurumu(db, FA.yon, FA.den1Personel)));
  assert.ok(!z.sil && z.kullanim?.zimmet && z.kullanim?.plan, JSON.stringify(z));
  const yonPersonel = await ekle("Yönetici Kişi");
  await a(FA.yon, (db) => db.sorgu("UPDATE hesap SET personel_id = $1 WHERE id = $2", [yonPersonel, FA.yon.id]));
  assert.equal((await a(FA.yon, (db) => personelSilmeDurumu(db, FA.yon, yonPersonel))).sil, false, "kişi kendini silmez (tuş yok)");
  assert.equal((await a(FA.yon, (db) => kesinSil(db, "personel", yonPersonel, "Deneme"))).durum, "kullanildi", "veritabanı da reddeder");
  await a(FA.yon, (db) => db.sorgu("UPDATE hesap SET personel_id = NULL WHERE id = $1", [FA.yon.id]));
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM personel WHERE id = $1", [girisli])), /permission denied|izin/i);
});

/* 367 — müşteri girişi: hiç girilmemiş ek giriş silinir; ana ve girilmiş giriş silinmez */
test("müşteri girişi: hiç girilmemiş ek giriş silinir (kullanıcı adı serbest); ana giriş ve panele girilmiş giriş silinmez; yalnız yönetici", async () => {
  const M = { unvan: "Girişli Müşteri A.Ş.", kisa: "", vd: "", vno: "", tel: "", ilgili: "" };
  const m = tamam(await a(FA.yon, (db) => musteriKaydet(db, FA.yon, null, 0, { ...M, eposta: "ana@girisli-musteri.example" }, true))).id;
  const ek = tamam(await a(FA.yon, (db) => ekGirisEkle(db, FA.yon, m, { ad: "Ek Kişi", eposta: "ek@girisli-musteri.example", tesisler: "hepsi" }))).id;
  const ana = tamam(await a(FA.yon, (db) => anaGeciciParola(db, FA.yon, m))).id;
  assert.equal((await a(FA.yon, (db) => girisBilgisi(db, FA.yon, m)))!.sil, true);
  assert.equal((await a(FA.plan, (db) => girisBilgisi(db, FA.plan, m)))!.sil, false, "planlama girişi yönetir ama silemez");
  for (const k of [FA.plan, FA.elk]) assert.deepEqual(await a(k, (db) => girisSil(db, k, ek)), { durum: "yetkisiz" }, k.roller.join());
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => girisSil(db, FB.yon, ek), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await a(FA.yon, (db) => girisSil(db, FA.yon, ana)), { durum: "red", neden: "Ana giriş silinmez; müşterinin e-postasına bağlı. Pasife alın." });
  assert.deepEqual(await a(FA.yon, (db) => girisSil(db, FA.yon, ek)), { durum: "tamam", id: ek });
  assert.equal((await a(FA.yon, (db) => db.sorgu("SELECT 1 FROM musteri_hesap WHERE id = $1", [ek]))).rowCount, 0);
  const iz = (await a(FA.yon, (db) => db.sorgu<{ eski: Record<string, unknown> }>("SELECT eski FROM denetim_izi WHERE ne = 'musteri_giris.sil' AND nesne_id = $1", [ek]))).rows[0];
  assert.deepEqual([iz.eski.eposta, "parola_ozeti" in iz.eski], ["ek@girisli-musteri.example", false]);
  const ek2 = tamam(await a(FA.yon, (db) => ekGirisEkle(db, FA.yon, m, { ad: "Ek Kişi", eposta: "ek@girisli-musteri.example", tesisler: "hepsi" }))).id;
  await a(FA.yon, (db) => db.sorgu("UPDATE musteri_hesap SET son_giris = now() WHERE id = $1", [ek2]));
  assert.deepEqual(await a(FA.yon, (db) => girisSil(db, FA.yon, ek2)), { durum: "red", neden: "Müşteri bu girişle panele girdi; silinmez. Pasife alın." });
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM musteri_hesap WHERE id = $1", [ek2])), /permission denied|izin/i);
});

/* 368 — teklif taslağı: yalnız yönetici, yalnız hiç gönderilmemiş ve kopyası / sözleşmesi olmayan taslak */
test("teklif: taslak kalemleriyle silinir; kopyası olan ve gönderilmiş teklif silinmez; hazırlayan planlama silemez", async () => {
  const taslak = async (no: string, kopya: string | null = null) => a(FA.yon, async (db) => {
    const id = (await db.sorgu<{ id: string }>(`INSERT INTO teklif (no, aday, gecerlilik, kopya_kaynak) VALUES ($1, '{"unvan": "Aday Deneme"}', 30, $2) RETURNING id::text`, [no, kopya])).rows[0].id;
    await db.sorgu("INSERT INTO teklif_kalem (teklif_id, tur_id, adet, fiyat) VALUES ($1, $2, 1, 100000)", [id, FA.tur]);
    return id;
  });
  const t1 = await taslak("TK-2026-801");
  assert.equal((await a(FA.yon, (db) => teklifKarti(db, FA.yon, t1)))!.izin.sil, true);
  assert.equal((await a(FA.plan, (db) => teklifKarti(db, FA.plan, t1)))!.izin.sil, false, "hazırlayan planlama düzenler ama silemez");
  for (const k of [FA.plan, FA.elk]) assert.deepEqual(await a(k, (db) => teklifSil(db, k, t1)), { durum: "yetkisiz" }, k.roller.join());
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => teklifSil(db, FB.yon, t1), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await a(FA.yon, (db) => teklifSil(db, FA.yon, t1)), { durum: "tamam", id: t1, bildirim: "TK-2026-801 silindi." });
  assert.equal((await a(FA.yon, (db) => db.sorgu("SELECT 1 FROM teklif_kalem WHERE teklif_id = $1", [t1]))).rowCount, 0, "kalem gitti");
  const iz = (await a(FA.yon, (db) => db.sorgu<{ k: unknown[] }>("SELECT ayrinti->'kalemler' AS k FROM denetim_izi WHERE ne = 'teklif.sil' AND nesne_id = $1", [t1]))).rows[0];
  assert.equal(iz.k.length, 1, "kalemler izde");

  const t2 = await taslak("TK-2026-802");
  const t3 = await taslak("TK-2026-803", t2);
  assert.deepEqual(await a(FA.yon, (db) => teklifSil(db, FA.yon, t2)), { durum: "red", neden: "Teklif silinemez: 1 teklif kopyasında kullanıldı." });
  await a(FA.yon, (db) => db.sorgu("UPDATE teklif SET durum = 'gonderildi' WHERE id = $1", [t3]));
  assert.equal((await a(FA.yon, (db) => teklifKarti(db, FA.yon, t3)))!.izin.sil, false);
  assert.deepEqual(await a(FA.yon, (db) => teklifSil(db, FA.yon, t3)),
    { durum: "red", neden: "Gönderilmiş teklif silinmez; müşteriye verilmiş belgedir. Yenisi kopyalanır." });
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM teklif WHERE id = $1", [t2])), /permission denied|izin/i);
});

/* 369 — iş sözleşmesi: yalnız yönetici, yalnız imza bekleyen (imzalı tarama hiç yüklenmemiş) ve faturası olmayan */
test("sözleşme: imza bekleyen kapsam tesisleriyle silinir; imzalı (kaldırılmış olsa da) silinmez; yalnız yönetici", async () => {
  const musteri = (await a(FA.yon, (db) => db.sorgu<{ m: string }>("SELECT musteri_id::text AS m FROM tesis WHERE id = $1", [FA.tesis]))).rows[0].m;
  const hazirla = (no: string) => a(FA.yon, async (db) => {
    const id = (await db.sorgu<{ id: string }>("INSERT INTO is_sozlesmesi (no, musteri_id, baslangic, bitis, vade, yenileme) VALUES ($1, $2, '2026-10-01', '2027-09-30', 30, 'yok') RETURNING id::text",
      [no, musteri])).rows[0].id;
    await db.sorgu("INSERT INTO is_sozlesmesi_tesis (sozlesme_id, tesis_id) VALUES ($1, $2)", [id, FA.tesis]);
    return id;
  });
  const s1 = await hazirla("IS-2026-801");
  assert.equal(await a(FA.yon, (db) => sozlesmeSilinir(db, FA.yon, s1)), true);
  assert.equal(await a(FA.plan, (db) => sozlesmeSilinir(db, FA.plan, s1)), false, "planlama hazırlar ama silemez");
  for (const k of [FA.plan, FA.elk]) assert.deepEqual(await a(k, (db) => sozlesmeSil(db, k, s1)), { durum: "yetkisiz" }, k.roller.join());
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => sozlesmeSil(db, FB.yon, s1), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await a(FA.yon, (db) => sozlesmeSil(db, FA.yon, s1)), { durum: "tamam", id: s1, no: "IS-2026-801" });
  assert.equal((await a(FA.yon, (db) => db.sorgu("SELECT 1 FROM is_sozlesmesi_tesis WHERE sozlesme_id = $1", [s1]))).rowCount, 0, "kapsam gitti");

  const s2 = await hazirla("IS-2026-802");
  const surum = async () => (await a(FA.yon, (db) => db.sorgu<{ surum: number }>("SELECT surum FROM is_sozlesmesi WHERE id = $1", [s2]))).rows[0].surum;
  tamam(await a(FA.yon, async (db) => imzaliYukle(db, depo, FA.yon, A, s2, await surum(), { ad: "imzali.pdf", bayt: PDF })));
  assert.deepEqual(await a(FA.yon, (db) => sozlesmeSil(db, FA.yon, s2)), { durum: "red", neden: "İmzalanmış sözleşme silinmez." });
  tamam(await a(FA.yon, async (db) => imzaliYukle(db, depo, FA.yon, A, s2, await surum(), null)));
  assert.equal(await a(FA.yon, (db) => sozlesmeSilinir(db, FA.yon, s2)), false, "imzalı tarama kaldırılmış olsa da silinmez");
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM is_sozlesmesi WHERE id = $1", [s2])), /permission denied|izin/i);
});

/* 370 — rapor formatı taslağı: yalnız yönetici; yayınlanmış sürüm silinmez */
test("rapor formatı: taslak silinir (tanımı izde); yayınlanmış sürüm silinmez; yalnız yönetici", async () => {
  const t = tamam(await a(FA.yon, (db) => taslakBaslat(db, FA.yon, FA.tur, "sablon:ZPKR02", null))).id;
  for (const k of [FA.plan, FA.den1]) assert.deepEqual(await a(k, (db) => taslakSil(db, k, t)), { durum: "yetkisiz" }, k.roller.join());
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => taslakSil(db, FB.yon, t), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await a(FA.elk, (db) => taslakSil(db, FA.elk, t)), { durum: "tamam", id: t, surum: 0 }, "elektrik yöneticisi (Ekipman türleri'nde yaz)");
  assert.equal((await a(FA.yon, (db) => db.sorgu("SELECT 1 FROM rapor_format WHERE id = $1", [t]))).rowCount, 0);
  const iz = (await a(FA.yon, (db) => db.sorgu<{ eski: Record<string, unknown> }>("SELECT eski FROM denetim_izi WHERE ne = 'rapor_format.sil' AND nesne_id = $1", [t]))).rows[0];
  assert.ok("tanim" in iz.eski, "taslağın tanımı izde");
  const yayinda = (await a(FA.yon, (db) => db.sorgu<{ id: string }>("SELECT id::text FROM rapor_format WHERE tur_id = $1 AND durum = 'yayinda'", [FA.tur]))).rows[0].id;
  assert.deepEqual(await a(FA.yon, (db) => taslakSil(db, FA.yon, yayinda)), { durum: "kilitli" });
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM rapor_format WHERE id = $1", [yayinda])), /permission denied|izin/i);
});

/* 371 — eğitim türü ve kaydı: yalnız yönetici; kayıt sertifikasız ve katılım formsuzsa silinir, güncelse öncekisi geri gelir */
test("eğitim: güncel kayıt silinince öncekisi güncel olur; sertifikalı kayıt ve kaydı olan tür silinmez; boşalan tür silinir", async () => {
  const tur = (await a(FA.yon, (db) => db.sorgu<{ id: string }>("INSERT INTO egitim_turu (ad, tekrar_ay) VALUES ('Silinecek eğitim', 12) RETURNING id::text"))).rows[0].id;
  const kayit = async (tarih: string, tekrar: string, onceki: boolean) => (await a(FA.yon, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO egitim_kaydi (personel_id, tur_id, tarih, tekrar, kurum, onceki) VALUES ($1, $2, $3, $4, 'Firma içi', $5) RETURNING id::text",
    [FA.den1Personel, tur, tarih, tekrar, onceki]))).rows[0].id;
  const k1 = await kayit("2024-03-01", "2025-03-01", true), k2 = await kayit("2025-03-01", "2026-03-01", false);
  const l = (await a(FA.yon, (db) => egitimListesi(db, FA.yon)))!;
  assert.deepEqual([l.kayitlar.find((x) => x.id === k2)?.sil, l.turler.find((t) => t.id === tur)?.sil], [true, false]);
  assert.equal((await a(FA.plan, (db) => egitimListesi(db, FA.plan)))!.kayitlar.find((x) => x.id === k2)?.sil, undefined, "planlama görür, silemez");
  assert.deepEqual(await a(FA.yon, (db) => egitimTuruSil(db, FA.yon, tur)), { durum: "red", neden: "Eğitim türü silinemez: 2 eğitim kaydında kullanıldı." });
  for (const k of [FA.plan, FA.den1]) assert.deepEqual(await a(k, (db) => egitimKaydiSil(db, k, k2)), { durum: "yetkisiz" }, k.roller.join());
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => egitimKaydiSil(db, FB.yon, k2), { hesapId: FB.yon.id }), { durum: "yok" }, "başka firma");
  assert.deepEqual(await a(FA.elk, (db) => egitimKaydiSil(db, FA.elk, k2)), { durum: "tamam", id: k2 });
  assert.equal((await a(FA.yon, (db) => db.sorgu<{ o: boolean }>("SELECT onceki AS o FROM egitim_kaydi WHERE id = $1", [k1]))).rows[0].o, false, "önceki kayıt güncel oldu");
  await a(FA.yon, (db) => db.sorgu("UPDATE egitim_kaydi SET dosya_id = gen_random_uuid() WHERE id = $1", [k1]));
  assert.deepEqual(await a(FA.yon, (db) => egitimKaydiSil(db, FA.yon, k1)), { durum: "red", neden: "Sertifikası yüklü eğitim kaydı silinmez; önce sertifikayı kaldırın." });
  await a(FA.yon, (db) => db.sorgu("UPDATE egitim_kaydi SET dosya_id = NULL WHERE id = $1", [k1]));
  tamam(await a(FA.yon, (db) => egitimKaydiSil(db, FA.yon, k1)));
  assert.deepEqual(await a(FA.yon, (db) => egitimTuruSil(db, FA.yon, tur)), { durum: "tamam", id: tur });
  await assert.rejects(a(FA.yon, (db) => db.sorgu("DELETE FROM egitim_turu WHERE id = $1", [FA.tur])), /permission denied|izin/i);
});
