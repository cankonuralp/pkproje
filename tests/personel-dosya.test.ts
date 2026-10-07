/* NEREDEN GELDİ: maket personel.html (reisim 40: "personel özlük dosyaları ve zimmetleri personelde olacak"; 2026-09-25: imzalı zimmet formu,
   zimmet değişince eskir; 2026-09-27: "personel ekranında maaşlar ve bordrolarda olacak"; 2026-09-30 L4: "ekipman ataması yapılsın ve atama belgesi
   yüklensin") · KOD-GECIS §4 (Personel: özlük ve maaş yalnız yönetici; denetçi kendi kartını görür) · reisim 2026-10-04: "rol değiştirme sızma
   veri çalma". GERÇEK PostgreSQL, iki firma. 373: yanlış yüklenen imzalı zimmet formu taraması kaldırılır (satır saklanır); Onaylar'da imzalanan
   form kaldırılmaz (veritabanı da). */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { turKaydet } from "../src/modules/ekipman-turleri/server/turler.ts";
import {
  atamaBelgeDegistir, atamaEkle, atamaKaldir, atananTurler, bordroKaldir, bordroYukle, DosyaHatasi, gunlukMaliyet, ozlukEkle, ozlukKaldir, personelDosyasi,
  zimmetFormuGonder, zimmetFormuKaldir, zimmetFormuVerisi, zimmetFormuYukle, type Kisi, type ZimmetPdfUretici,
} from "../src/modules/personel/server/dosyalar.ts";
import type { ZimmetFormuVerisi } from "../src/belge/zimmet.ts";
import { belgeImzaliYukle, digerBelgeler } from "../src/modules/onaylar/server/belgeler.ts";
import { personelEkle } from "../src/modules/personel/server/personel.ts";
import { demirbasEkle, teslimEt } from "../src/modules/zimmetler/server/zimmet.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "pd-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, DENETCI: Kisi, MUH: Kisi, PLAN: Kisi, YON_B: Kisi;
let pDenetci: string, pIkinci: string, tur: string, d1: string, d2: string;
const P = { ad: "Deneme Kişi", eposta: "", imzaTel: "", basla: "2024-02-01", meslek: "elk-muh", meslekMetin: "", diploma: "", oda: "", ekipnet: "" };
const PDF = { ad: "belge.pdf", bayt: new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n") };
const METIN = { ad: "x.pdf", bayt: new TextEncoder().encode("düz metin") };
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

async function hesapli(firma: string, eposta: string, roller: string[], personelId: string | null = null) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [eposta, roller, personelId]))).rows[0].id;
}
const a = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, A, is);
const b = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is);

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  YON = kisi(await hesapli(A, "yonetici@deneme.example", ["firma_yoneticisi"]), "firma_yoneticisi");
  PLAN = kisi(await hesapli(A, "planlama@deneme.example", ["planlama"]), "planlama");
  MUH = kisi(await hesapli(A, "muhasebe@deneme.example", ["muhasebe"]), "muhasebe");
  YON_B = kisi(await hesapli(B, "yonetici@deneme-b.example", ["firma_yoneticisi"]), "firma_yoneticisi");
  pDenetci = tamam(await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme Denetçi" }))).id;
  pIkinci = tamam(await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme İkinci" }))).id;
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"], pDenetci), "denetci");
  tur = tamam(await a((db) => turKaydet(db, YON, null, 0, { ad: "Deneme Vinç", kod: "DV", grup: "kaldirma", brans: "", periyot: "12", sure: "" }))).id;
  d1 = tamam(await a((db) => demirbasEkle(db, YON, { kod: "dm-1", ad: "Deneme merdiven" }))).id;
  d2 = tamam(await a((db) => demirbasEkle(db, YON, { kod: "dm-2", ad: "Deneme baret" }))).id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("özlük: tür listeden, PDF zorunlu; PDF olmayan belgede kayıt hiç yazılmaz; kaldırılan listeden çıkar, satır kalır; silme hakkı yok", async () => {
  const g = await a((db) => ozlukEkle(db, depo, YON, A, pDenetci, { tur: "roman", aciklama: "" }, null));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["dosya", "tur"]);
  await assert.rejects(a((db) => ozlukEkle(db, depo, YON, A, pDenetci, { tur: "diploma", aciklama: "" }, METIN)), DosyaHatasi);
  assert.deepEqual((await a((db) => personelDosyasi(db, YON, pDenetci)))!.ozluk, []);
  const id = tamam(await a((db) => ozlukEkle(db, depo, YON, A, pDenetci, { tur: "diploma", aciklama: "Lisans" }, PDF))).id;
  const o = (await a((db) => personelDosyasi(db, YON, pDenetci)))!.ozluk!;
  assert.deepEqual([o.length, o[0].tur, o[0].aciklama, !!o[0].dosyaId], [1, "diploma", "Lisans", true]);
  tamam(await a((db) => ozlukKaldir(db, YON, id, o[0].surum)));
  assert.deepEqual((await a((db) => personelDosyasi(db, YON, pDenetci)))!.ozluk, []);
  assert.equal((await a((db) => db.sorgu("SELECT 1 FROM ozluk_belgesi WHERE id = $1 AND kaldirildi IS NOT NULL", [id]))).rowCount, 1);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM ozluk_belgesi")), /permission denied|izin/i);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM bordro")), /permission denied|izin/i);
});

test("ekipman ataması: belge zorunlu, ileri tarih yok, kişi × tür başına tek geçerli atama; belge değişir; kaldırılınca yeniden atanır", async () => {
  const g = await a((db) => atamaEkle(db, depo, YON, A, pDenetci, { tur, tarih: "2099-01-01" }, null));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["dosya", "tarih"]);
  const id = tamam(await a((db) => atamaEkle(db, depo, YON, A, pDenetci, { tur, tarih: "2026-09-01" }, PDF))).id;
  assert.deepEqual(await a((db) => atamaEkle(db, depo, YON, A, pDenetci, { tur, tarih: "2026-09-02" }, PDF)),
    { durum: "gecersiz", hatalar: { tur: "Bu türe ataması var; belgeyi değiştirin." } });
  assert.deepEqual(await a((db) => atananTurler(db, pDenetci)), [tur]);
  let at = (await a((db) => personelDosyasi(db, YON, pDenetci)))!.atamalar[0];
  assert.deepEqual([at.tur, at.brans, at.tarih], ["Deneme Vinç", "m", "2026-09-01"]);
  tamam(await a((db) => atamaBelgeDegistir(db, depo, YON, A, id, at.surum, PDF)));
  const yeni = (await a((db) => personelDosyasi(db, YON, pDenetci)))!.atamalar[0];
  assert.notEqual(yeni.dosyaId, at.dosyaId);
  assert.deepEqual(await a((db) => atamaKaldir(db, YON, id, at.surum)), { durum: "cakisma" }, "eski sürümle kaldırılamaz");
  tamam(await a((db) => atamaKaldir(db, YON, id, yeni.surum)));
  assert.deepEqual(await a((db) => atananTurler(db, pDenetci)), []);
  tamam(await a((db) => atamaEkle(db, depo, YON, A, pDenetci, { tur, tarih: "2026-09-03" }, PDF)));
  at = (await a((db) => personelDosyasi(db, YON, pDenetci)))!.atamalar[0];
  assert.equal(at.tarih, "2026-09-03");
  /* veritabanı da tutar */
  await assert.rejects(a((db) => db.sorgu("INSERT INTO ekipman_atamasi (personel_id, tur_id, tarih) VALUES ($1, $2, '2026-09-04')", [pDenetci, tur])), /unique|duplicate/i);
});

test("bordro: net ≤ brüt ≤ maliyet, gelecek ay yok; aynı dönemin yenisi eskisini kaldırır; günlük maliyet son bordrodan", async () => {
  const g = await a((db) => bordroYukle(db, depo, YON, A, pIkinci, { ay: "2026-09", brut: "50.000,00", net: "60.000", maliyet: "40000" }, PDF));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["maliyet", "net"]);
  const ileri = await a((db) => bordroYukle(db, depo, YON, A, pIkinci, { ay: "2099-01", brut: "1", net: "1", maliyet: "1" }, PDF));
  assert.deepEqual(ileri.durum === "gecersiz" && Object.keys(ileri.hatalar), ["ay"]);
  tamam(await a((db) => bordroYukle(db, depo, YON, A, pIkinci, { ay: "2026-08", brut: "50.000,00", net: "38.000,50", maliyet: "60.000" }, PDF)));
  const ilk = tamam(await a((db) => bordroYukle(db, depo, YON, A, pIkinci, { ay: "2026-09", brut: "50.000,00", net: "38.000,50", maliyet: "60.000" }, PDF))).id;
  const son = tamam(await a((db) => bordroYukle(db, depo, YON, A, pIkinci, { ay: "2026-09", brut: "52.000", net: "39.000", maliyet: "66.000" }, PDF))).id;
  const l = (await a((db) => personelDosyasi(db, YON, pIkinci)))!.bordrolar!;
  assert.deepEqual(l.map((x) => [x.ay, x.brut, x.net, x.maliyet]), [["2026-09", 5_200_000, 3_900_000, 6_600_000], ["2026-08", 5_000_000, 3_800_050, 6_000_000]]);
  assert.equal(l[0].id, son);
  assert.equal(gunlukMaliyet(l[0]), 300_000);
  assert.equal((await a((db) => db.sorgu("SELECT 1 FROM bordro WHERE id = $1 AND kaldirildi IS NOT NULL", [ilk]))).rowCount, 1, "eski bordro saklanır");
  tamam(await a((db) => bordroKaldir(db, YON, son, l[0].surum)));
  assert.equal((await a((db) => personelDosyasi(db, YON, pIkinci)))!.bordrolar!.length, 1);
  await assert.rejects(a((db) => db.sorgu("INSERT INTO bordro (personel_id, ay, brut, net, maliyet) VALUES ($1, '2026-07', 100, 200, 300)", [pIkinci])), /check/i);
});

test("imzalı zimmet formu: kapsam sunucuda o anki zimmetten; zimmet değişince eskir; zimmeti olmayana yüklenmez", async () => {
  assert.deepEqual(await a((db) => zimmetFormuYukle(db, depo, YON, A, pDenetci, PDF)), { durum: "gecersiz", hatalar: { dosya: "Zimmetinde varlık yok; form yüklenmez." } });
  tamam(await a((db) => teslimEt(db, depo, YON, A, { varlik: `d:${d1}`, alan: pDenetci, zaman: "2026-09-01T09:00", notu: "" })));
  let z = (await a((db) => personelDosyasi(db, YON, pDenetci)))!;
  assert.deepEqual([z.zimmet.map((v) => v.kod), z.zimmetFormu], [["DM-1"], null]);
  tamam(await a((db) => zimmetFormuYukle(db, depo, YON, A, pDenetci, PDF)));
  z = (await a((db) => personelDosyasi(db, YON, pDenetci)))!;
  assert.deepEqual([z.zimmetFormu?.kapsam, z.zimmetFormu?.guncel], [1, true]);
  tamam(await a((db) => teslimEt(db, depo, YON, A, { varlik: `d:${d2}`, alan: pDenetci, zaman: "2026-09-02T09:00", notu: "" })));
  assert.equal((await a((db) => personelDosyasi(db, YON, pDenetci)))!.zimmetFormu?.guncel, false, "zimmet değişti: form eskidi");
  tamam(await a((db) => zimmetFormuYukle(db, depo, YON, A, pDenetci, PDF)));
  z = (await a((db) => personelDosyasi(db, YON, pDenetci)))!;
  assert.deepEqual([z.zimmetFormu?.kapsam, z.zimmetFormu?.guncel], [2, true]);
});

test("YETKİ: denetçi kendi kartında atama + zimmet görür, özlük / bordro görmez, yazamaz; başka kişinin kartı yok; muhasebe görmez; başka firma hiçbirine ulaşamaz", async () => {
  const kendi = (await a((db) => personelDosyasi(db, DENETCI, pDenetci)))!;
  assert.deepEqual([kendi.yaz, kendi.ozluk, kendi.bordrolar, kendi.atamalar.length, kendi.zimmet.length, kendi.turler], [false, null, null, 1, 2, []]);
  assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, kendi.atamalar[0].dosyaId!, DOSYA_ERISIMI)), "denetçi kendi atama belgesini açar");
  assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, kendi.zimmetFormu!.dosyaId!, DOSYA_ERISIMI)), "denetçi kendi zimmet formunu açar");
  assert.equal(await a((db) => personelDosyasi(db, DENETCI, pIkinci)), null);
  const bordro = (await a((db) => personelDosyasi(db, YON, pIkinci)))!.bordrolar![0];
  assert.equal(await a((db) => dosyaIndirilebilir(db, DENETCI, bordro.dosyaId!, DOSYA_ERISIMI)), null, "denetçi başkasının bordrosunu açamaz");
  assert.ok(await a((db) => dosyaIndirilebilir(db, YON, bordro.dosyaId!, DOSYA_ERISIMI)));
  for (const k of [DENETCI, PLAN]) {
    assert.deepEqual(await a((db) => ozlukEkle(db, depo, k, A, pDenetci, { tur: "diploma", aciklama: "" }, PDF)), { durum: "yetkisiz" });
    assert.deepEqual(await a((db) => bordroYukle(db, depo, k, A, pDenetci, { ay: "2026-09", brut: "1", net: "1", maliyet: "1" }, PDF)), { durum: "yetkisiz" });
    assert.deepEqual(await a((db) => atamaKaldir(db, k, kendi.atamalar[0].id, kendi.atamalar[0].surum)), { durum: "yetkisiz" });
    assert.deepEqual(await a((db) => zimmetFormuYukle(db, depo, k, A, pDenetci, PDF)), { durum: "yetkisiz" });
  }
  const plan = await a((db) => personelDosyasi(db, PLAN, pDenetci));
  if (plan) assert.deepEqual([plan.ozluk, plan.bordrolar], [null, null], "planlama özlük ve bordro görmez");
  assert.equal(await a((db) => dosyaIndirilebilir(db, PLAN, bordro.dosyaId!, DOSYA_ERISIMI)), null);
  assert.equal(await a((db) => personelDosyasi(db, MUH, pIkinci)), null);
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, bordro.dosyaId!, DOSYA_ERISIMI)), null);
  /* başka firma: kart yok, dosya yok, yazma yok */
  assert.equal(await b((db) => personelDosyasi(db, YON_B, pDenetci)), null);
  assert.equal(await b((db) => dosyaIndirilebilir(db, YON_B, bordro.dosyaId!, DOSYA_ERISIMI)), null);
  assert.equal(await b((db) => dosyaIndirilebilir(db, YON_B, kendi.atamalar[0].dosyaId!, DOSYA_ERISIMI)), null);
  assert.deepEqual(await b((db) => ozlukEkle(db, depo, YON_B, B, pDenetci, { tur: "diploma", aciklama: "" }, PDF)), { durum: "yok" });
  assert.deepEqual(await b((db) => bordroKaldir(db, YON_B, bordro.id, bordro.surum)), { durum: "yok" });
  assert.deepEqual(await b((db) => atamaEkle(db, depo, YON_B, B, pDenetci, { tur, tarih: "2026-09-01" }, PDF)), { durum: "yok" });
  await assert.rejects(b((db) => db.sorgu("INSERT INTO bordro (personel_id, ay, brut, net, maliyet) VALUES ($1, '2026-07', 100, 90, 120)", [pIkinci])), /foreign key|yabancı anahtar/i);
});

/* 344: zimmet teslim formu (maket personel.html zimmet formu "PDF indir" / "İmzala"; AA3) — imzaya gönderilen form kişinin Onaylar › Diğer'ine
   düşer, imzalanınca imzalı zimmet formu olur. Sahte üretici imzalanabilir biçimde en küçük PDF'i döner (gerçek Chromium çıktısı pdf.test). */
const OZGUN = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> >> endobj\n4 0 obj << /Length 18 >> stream\nBT (Zimmet) Tj ET\nendstream\nendobj\n"
  + "trailer << /Root 1 0 R >>\n%%EOF\n";
const IMZA = "9 0 obj << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n";
const bayt = (s: string) => new TextEncoder().encode(s);
let sonVeri: ZimmetFormuVerisi | null = null;
const SAHTE: ZimmetPdfUretici = async (v) => { sonVeri = v; return bayt(OZGUN); };
const ha = <T,>(k: Kisi, is: Parameters<typeof kiraciIcinde<T>>[2], firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });

test("344 zimmet formu: indirilen form numarasız, kapsam o anki zimmet; yalnız 'yaz'; zimmeti olmayana yok", async () => {
  const v = (await a((db) => zimmetFormuVerisi(db, YON, pDenetci)))!;
  assert.deepEqual([v.no, v.alan.ad, v.eden, v.varliklar.map((x) => [x.kod, x.tur])], [null, "Deneme Denetçi", null, [["DM-1", "Demirbaş"], ["DM-2", "Demirbaş"]]]);
  assert.equal(v.firma.kod, "DA");
  for (const k of [DENETCI, PLAN, MUH]) assert.equal(await a((db) => zimmetFormuVerisi(db, k, pDenetci)), null, k.roller[0]);
  assert.equal(await a((db) => zimmetFormuVerisi(db, YON, pIkinci)), null, "zimmeti yok");
  assert.equal(await b((db) => zimmetFormuVerisi(db, YON_B, pDenetci)), null, "başka firma");
});

test("344 zimmet formu imzaya: numara ZF, kişinin Onaylar › Diğer'ine; yenisi bekleyeni iptal eder; imzalanınca imzalı form olur; PDF düşerse hiçbiri yazılmaz", async () => {
  const belge = async (kaynak: string) => (await a((db) => db.sorgu<{ id: string; tur: string; durum: string; ad: string; surum: number }>(
    "SELECT id::text, tur, durum, ad, surum FROM belge_onay WHERE kaynak_id = $1", [kaynak]))).rows;
  const r1 = tamam(await ha(YON, (db) => zimmetFormuGonder(db, depo, YON, A, pDenetci, SAHTE)));
  const no1 = sonVeri!.no!;
  assert.match(no1, /^ZF-\d{4}-001$/);
  assert.deepEqual(sonVeri!.varliklar.map((x) => x.kod), ["DM-1", "DM-2"]);
  assert.deepEqual((await belge(r1.id)).map((x) => [x.tur, x.durum, x.ad]), [["zimmet", "bekliyor", `Zimmet teslim formu · ${no1}`]]);
  let z = (await a((db) => personelDosyasi(db, YON, pDenetci)))!;
  assert.deepEqual([z.zimmetGonderimi?.ad, z.zimmetGonderimi?.durum, z.zimmetFormu?.kapsam], [`Zimmet teslim formu · ${no1}`, "bekliyor", 2], "taranmış form yerinde, gönderim bekliyor");
  /* yenisi: önceki bekleyen iptal (kişi eski kapsamı imzalamaz) */
  const r2 = tamam(await ha(YON, (db) => zimmetFormuGonder(db, depo, YON, A, pDenetci, SAHTE)));
  const no2 = sonVeri!.no!;
  assert.match(no2, /^ZF-\d{4}-002$/);
  assert.equal((await belge(r1.id))[0].durum, "iptal");
  /* kişi Onaylar › Diğer'de görür ve imzalar */
  const d = await ha(DENETCI, (db) => digerBelgeler(db, DENETCI));
  const x = d.belgeler.find((y) => y.tur === "zimmet" && y.durum === "bekliyor")!;
  assert.equal(x.ad, `Zimmet teslim formu · ${no2}`);
  tamam(await ha(DENETCI, (db) => belgeImzaliYukle(db, depo, DENETCI, A, x.id, x.surum, { ad: "imzali.pdf", bayt: bayt(OZGUN + IMZA) })));
  z = (await a((db) => personelDosyasi(db, YON, pDenetci)))!;
  assert.deepEqual([z.zimmetFormu?.id, z.zimmetFormu?.guncel, z.zimmetGonderimi], [r2.id, true, null], "imzalanan form imzalı zimmet formu");
  assert.ok(await a((db) => dosyaIndirilebilir(db, YON, z.zimmetFormu!.dosyaId!, DOSYA_ERISIMI)), "yönetici imzalı formu açar");
  assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, z.zimmetFormu!.dosyaId!, DOSYA_ERISIMI)), "kişi kendi imzalı formunu açar");
  /* 340–345 incelemesi: kartı gören (planlama "gör") Onaylar'da imzalanan formu da açar; kartı görmeyen (muhasebe) açamaz */
  assert.ok(await a((db) => dosyaIndirilebilir(db, PLAN, z.zimmetFormu!.dosyaId!, DOSYA_ERISIMI)), "planlama açar");
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, z.zimmetFormu!.dosyaId!, DOSYA_ERISIMI)), null, "muhasebe açamaz");
  /* PDF düşerse numara, form ve belge yazılmaz */
  const sayi = async () => (await a((db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM zimmet_formu WHERE personel_id = $1", [pDenetci]))).rows[0].n;
  const once = await sayi();
  await assert.rejects(ha(YON, (db) => zimmetFormuGonder(db, depo, YON, A, pDenetci, async () => { throw new Error("motor"); })), DosyaHatasi);
  assert.equal(await sayi(), once);
  /* yetki ve kiracı */
  for (const k of [DENETCI, PLAN, MUH]) assert.deepEqual(await ha(k, (db) => zimmetFormuGonder(db, depo, k, A, pDenetci, SAHTE)), { durum: "yetkisiz" });
  assert.deepEqual(await ha(YON_B, (db) => zimmetFormuGonder(db, depo, YON_B, B, pDenetci, SAHTE), B), { durum: "yok" });
  /* 340–345 incelemesi: giriş hesabı olmayan kişi imzalayamaz — form gönderilmez (indirip ıslak imza yolu açık) */
  assert.deepEqual(await ha(YON, (db) => zimmetFormuGonder(db, depo, YON, A, pIkinci, SAHTE)),
    { durum: "gecersiz", hatalar: { dosya: "Kişinin giriş hesabı yok; form imzaya gönderilemez. Formu indirip ıslak imzalı taramasını yükleyin." } });
});

/* 373 (reisim 2026-10-07 "eklenebilen şeyler silinemiyor"; ekran dili "Kaldır" — kayıt saklanır) */
test("imzalı zimmet formu Kaldır: yüklenen tarama kaldırılır (satır kalır, önceki imzalı form geçerli olur); Onaylar'da imzalanan kaldırılmaz", async () => {
  const onay = (await a((db) => personelDosyasi(db, YON, pDenetci)))!.zimmetFormu!;
  assert.equal(onay.yuklenen, false, "Onaylar'da imzalanan form");
  assert.deepEqual(await a((db) => zimmetFormuKaldir(db, YON, onay.id, onay.surum)), { durum: "gecersiz", hatalar: { dosya: "Kişinin Onaylar'dan imzaladığı form kaldırılmaz." } });
  const y = tamam(await a((db) => zimmetFormuYukle(db, depo, YON, A, pDenetci, PDF)));
  const f = (await a((db) => personelDosyasi(db, YON, pDenetci)))!.zimmetFormu!;
  assert.deepEqual([f.id, f.yuklenen], [y.id, true]);
  for (const k of [DENETCI, PLAN, MUH]) assert.deepEqual(await a((db) => zimmetFormuKaldir(db, k, f.id, f.surum)), { durum: "yetkisiz" }, k.roller[0]);
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => zimmetFormuKaldir(db, YON_B, f.id, f.surum)), { durum: "yok" }, "başka firma");
  tamam(await a((db) => zimmetFormuKaldir(db, YON, f.id, f.surum)));
  assert.equal((await a((db) => personelDosyasi(db, YON, pDenetci)))!.zimmetFormu?.id, onay.id, "önceki imzalı form yeniden geçerli");
  assert.equal((await a((db) => db.sorgu("SELECT 1 FROM zimmet_formu WHERE id = $1 AND kaldirildi IS NOT NULL AND dosya_id IS NOT NULL", [f.id]))).rowCount, 1, "satır ve tarama saklanır");
  assert.deepEqual(await a((db) => zimmetFormuKaldir(db, YON, f.id, f.surum + 1)), { durum: "yok" }, "ikinci kez");
  await assert.rejects(a((db) => db.sorgu("UPDATE zimmet_formu SET kaldirildi = now() WHERE id = $1", [onay.id])), /zimmet_formu_kaldir_yuklenen/);
});
