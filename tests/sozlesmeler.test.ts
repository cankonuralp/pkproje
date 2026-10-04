/* NEREDEN GELDİ: maket sozlesmeler.html (M5 + M13 2. tur, reisim 2026-09-26: "pk firma ile fabrika arasındaki sözleşme … isg katip sözleşmesi pdf
   olarak isteğe bağlı … sözleşme id denetçiye göre değişir"; F herkes girer · G kullanılmamış ID silinir, kullanılmış yalnız düzeltilir) ·
   KOD-GECIS §3 (kullanılmış ID silinmez) · §4 (Sözleşmeler: planlama ve yönetici değiştirir, denetçi kendi, muhasebe görür) · reisim 2026-10-04:
   "rol değiştirme sızma veri çalma". GERÇEK PostgreSQL, iki firma. */
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
import { musteriKaydet, tesisKaydet, tesisPasif } from "../src/modules/musteriler/server/musteriler.ts";
import { personelEkle } from "../src/modules/personel/server/personel.ts";
import { bitisHesapla } from "../src/modules/sozlesmeler/sema.ts";
import { imzaliYukle, isgIdBul, isgKaldir, isgKaydet, sablonKaldir, sablonlar, sablonYukle, sozlesmeHazirla, sozlesmeKarti, sozlesmeListesi, type Kisi }
  from "../src/modules/sozlesmeler/server/sozlesmeler.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "soz-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, PLAN: Kisi, DENETCI: Kisi, MUH: Kisi, YON_B: Kisi;
let pDenetci: string, pIkinci: string, musteri: string, t1: string, t2: string, tBaska: string, soz: string;
const P = { ad: "Deneme Kişi", eposta: "", imzaTel: "", basla: "2024-02-01", meslek: "elk-muh", meslekMetin: "", diploma: "", oda: "", ekipnet: "" };
const M = { unvan: "Deneme Makina San. A.Ş.", kisa: "", vd: "Merkez", vno: "", eposta: "", tel: "", ilgili: "" };
const T = { ad: "Merkez Fabrika", adres: "", il: "", ilce: "", sgk: "" };
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const S = (ek: object = {}) => ({ musteri, tesisler: [t1, t2], baslangic: "2026-10-01", sure: "12", vade: "30", yenileme: "yok", ...ek });
const I = (tesis: string, personel: string, no: string, ek: object = {}) => ({ tesis, personel, no, onay: "", bitis: "", ...ek });

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
  musteri = tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, M, false))).id;
  t1 = tamam(await a((db) => tesisKaydet(db, PLAN, musteri, null, 0, T, false))).id;
  t2 = tamam(await a((db) => tesisKaydet(db, PLAN, musteri, null, 0, { ...T, ad: "İkinci Tesis" }, false))).id;
  const baska = tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "Başka Müşteri A.Ş." }, false))).id;
  tBaska = tamam(await a((db) => tesisKaydet(db, PLAN, baska, null, 0, { ...T, ad: "Başka Tesis" }, false))).id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("bitiş: başlangıç + süre − 1 gün; ay sonu taşmaz", () => {
  assert.equal(bitisHesapla("2026-10-01", 12), "2027-09-30");
  assert.equal(bitisHesapla("2026-01-31", 1), "2026-02-27");
  assert.equal(bitisHesapla("2024-02-29", 12), "2025-02-27");
});

test("sözleşme hazırla: numara IS-AAYY-SIRA, kapsam müşterinin tesisleri, imza bekler; yalnız 'değiştirir' hazırlar", async () => {
  const r = tamam(await a((db) => sozlesmeHazirla(db, PLAN, S())));
  assert.equal(r.no, "IS-1026-001");
  soz = r.id;
  const k = (await a((db) => sozlesmeKarti(db, PLAN, soz)))!;
  assert.deepEqual([k.durum, k.bitis, k.kapsam.map((t) => t.ad), k.firma, k.imzaliDosya], ["imza", "2027-09-30", ["İkinci Tesis", "Merkez Fabrika"], "Deneme A", null]);
  assert.deepEqual(await a((db) => sozlesmeHazirla(db, PLAN, S({ tesisler: [t1, tBaska] }))), { durum: "gecersiz", hatalar: { tesisler: "Tesisler bu müşterinin olmalı." } });
  const g = await a((db) => sozlesmeHazirla(db, PLAN, { musteri: "", tesisler: [], baslangic: "2026-02-30", sure: "40", vade: "999", yenileme: "x" }));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["baslangic", "musteri", "sure", "tesisler", "vade", "yenileme"]);
  assert.deepEqual(await a((db) => sozlesmeHazirla(db, DENETCI, S())), { durum: "yetkisiz" });
  assert.deepEqual(await a((db) => sozlesmeHazirla(db, MUH, S())), { durum: "yetkisiz" });
  /* pasif tesis kapsama alınmaz */
  tamam(await a((db) => tesisPasif(db, PLAN, tBaska, 0, true)));
});

test("imzalı sözleşme: yalnız PDF; yükleyince yürürlükte, kaldırınca imza bekler; sürüm kilidi", async () => {
  const k = (await a((db) => sozlesmeKarti(db, PLAN, soz)))!;
  assert.deepEqual(await a((db) => imzaliYukle(db, depo, PLAN, A, soz, k.surum, { ad: "x.pdf", bayt: new TextEncoder().encode("düz metin") })),
    { durum: "gecersiz", hatalar: { dosya: "Dosya PDF değil ya da bozuk." } });
  tamam(await a((db) => imzaliYukle(db, depo, PLAN, A, soz, k.surum, { ad: "imzali.pdf", bayt: PDF })));
  const y = (await a((db) => sozlesmeKarti(db, PLAN, soz)))!;
  assert.deepEqual([y.durum, !!y.imzaliDosya, !!y.musteriImza], ["yururlukte", true, true]);
  assert.deepEqual(await a((db) => imzaliYukle(db, depo, PLAN, A, soz, k.surum, null)), { durum: "cakisma" });
  assert.ok(await a((db) => dosyaIndirilebilir(db, MUH, y.imzaliDosya!, DOSYA_ERISIMI)), "muhasebe (görür) açar");
  assert.equal(await a((db) => dosyaIndirilebilir(db, DENETCI, y.imzaliDosya!, DOSYA_ERISIMI)), null, "denetçi imzalı sözleşmeyi açamaz");
  assert.equal(await b((db) => dosyaIndirilebilir(db, YON_B, y.imzaliDosya!, DOSYA_ERISIMI)), null, "başka firma açamaz");
  /* veritabanı: imza tarihi ile dosya birlikte (biri olmadan öteki olmaz) */
  await assert.rejects(a((db) => db.sorgu("UPDATE is_sozlesmesi SET imzali_dosya = NULL WHERE id = $1", [soz])), /check/i);
});

test("İSG-KATİP: tesis × denetçi ID; yeni ID eskisini 'önceki' yapar; kapsam dışı tesis reddedilir; kullanılmış ID kaldırılmaz", async () => {
  const r1 = tamam(await a((db) => isgKaydet(db, depo, PLAN, A, soz, null, 0, I(t1, pDenetci, "ISG-001", { bitis: "2026-01-01" }), { ad: "isg.pdf", bayt: PDF })));
  assert.deepEqual(await a((db) => isgIdBul(db, t1, pDenetci)), { id: r1.id, no: "ISG-001", onay: null, bitis: "2026-01-01" });
  const r2 = tamam(await a((db) => isgKaydet(db, depo, PLAN, A, soz, null, 0, I(t1, pDenetci, "ISG-002"))));
  assert.equal((await a((db) => isgIdBul(db, t1, pDenetci)))?.id, r2.id, "eskisi önceki oldu");
  let k = (await a((db) => sozlesmeKarti(db, PLAN, soz)))!;
  assert.deepEqual(k.kapsam.find((t) => t.id === t1)!.isg.map((r) => r.no), ["ISG-002"]);
  assert.deepEqual(await a((db) => isgKaydet(db, depo, PLAN, A, soz, null, 0, I(tBaska, pDenetci, "X"))), { durum: "gecersiz", hatalar: { tesis: "Tesis bu sözleşmenin kapsamında değil." } });
  const g = await a((db) => isgKaydet(db, depo, PLAN, A, soz, null, 0, I(t1, "", "", { onay: "31.12.2026" })));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["no", "onay", "personel"]);
  /* düzelt: tesis ve denetçi değişmez */
  const isg = k.kapsam.find((t) => t.id === t1)!.isg[0];
  assert.deepEqual(await a((db) => isgKaydet(db, depo, PLAN, A, soz, isg.id, isg.surum, I(t1, pIkinci, "ISG-003"))),
    { durum: "gecersiz", hatalar: { personel: "Düzeltmede tesis ve denetçi değişmez; yeni ID ekleyin." } });
  tamam(await a((db) => isgKaydet(db, depo, PLAN, A, soz, isg.id, isg.surum, I(t1, pDenetci, "ISG-003", { onay: "2026-10-02" }))));
  /* planda kullanılan ID (Planlar yazar; burada sahip yazar) kaldırılmaz */
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("UPDATE isg_katip SET kullanildi = current_date WHERE id = $1", [isg.id]); } finally { await s.end(); }
  k = (await a((db) => sozlesmeKarti(db, PLAN, soz)))!;
  const kullanilan = k.kapsam.find((t) => t.id === t1)!.isg[0];
  assert.deepEqual(await a((db) => isgKaldir(db, PLAN, kullanilan.id, kullanilan.surum)), { durum: "red", neden: "ISG-003 bir planda kullanıldı; silinmez, yalnız düzeltilir." });
  const r3 = tamam(await a((db) => isgKaydet(db, depo, PLAN, A, soz, null, 0, I(t2, pIkinci, "ISG-010"))));
  tamam(await a((db) => isgKaldir(db, PLAN, r3.id, 0)));
  assert.equal(await a((db) => isgIdBul(db, t2, pIkinci)), null);
  /* silme hakkı yok */
  await assert.rejects(a((db) => db.sorgu("DELETE FROM isg_katip")), /permission denied|izin/i);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM is_sozlesmesi")), /permission denied|izin/i);
  await assert.rejects(a((db) => db.sorgu("UPDATE is_sozlesmesi_tesis SET tesis_id = tesis_id")), /permission denied|izin/i);
});

test("YETKİ: denetçi yalnız kendi ID'li sözleşmeyi ve kendi ID'sini görür, değiştiremez; muhasebe görür değiştiremez; PDF erişimi", async () => {
  tamam(await a((db) => isgKaydet(db, depo, PLAN, A, soz, null, 0, I(t2, pIkinci, "ISG-020"), { ad: "ikinci.pdf", bayt: PDF })));
  const l = (await a((db) => sozlesmeListesi(db, DENETCI)))!;
  assert.deepEqual(l.map((x) => x.no), ["IS-1026-001"]);
  const k = (await a((db) => sozlesmeKarti(db, DENETCI, soz)))!;
  assert.deepEqual(k.kapsam.flatMap((t) => t.isg.map((r) => r.personel)), ["Deneme Denetçi"], "başkasının ID'si görünmez");
  assert.equal(k.imzaliDosya, null, "imzalı sözleşme denetçiye verilmez");
  const ikinciPdf = (await a((db) => sozlesmeKarti(db, PLAN, soz)))!.kapsam.find((t) => t.id === t2)!.isg[0].dosyaId!;
  const kendiPdf = (await a((db) => sozlesmeKarti(db, PLAN, soz)))!.kapsam.find((t) => t.id === t1)!.isg[0].dosyaId;
  assert.equal(await a((db) => dosyaIndirilebilir(db, DENETCI, ikinciPdf, DOSYA_ERISIMI)), null, "başkasının İSG PDF'i açılmaz");
  if (kendiPdf) assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, kendiPdf, DOSYA_ERISIMI)));
  assert.deepEqual(await a((db) => isgKaydet(db, depo, DENETCI, A, soz, null, 0, I(t1, pDenetci, "X"))), { durum: "yetkisiz" });
  assert.deepEqual(await a((db) => isgKaldir(db, MUH, k.kapsam[0].isg[0]?.id ?? soz, 0)), { durum: "yetkisiz" });
  assert.equal((await a((db) => sozlesmeListesi(db, MUH)))!.length, 1);
  assert.deepEqual(await a((db) => imzaliYukle(db, depo, MUH, A, soz, 0, null)), { durum: "yetkisiz" });
  /* başka denetçinin ID'si olmayan sözleşmeyi göremez */
  const ikinciSoz = tamam(await a((db) => sozlesmeHazirla(db, PLAN, S({ tesisler: [t2] })))).id;
  assert.equal(await a((db) => sozlesmeKarti(db, DENETCI, ikinciSoz)), null);
});

test("şablon: yalnız PDF, sürümlü, kaldırılır; yalnız 'değiştirir' görür ve açar", async () => {
  tamam(await a((db) => sablonYukle(db, depo, PLAN, A, { ad: "sablon.pdf", bayt: PDF })));
  tamam(await a((db) => sablonYukle(db, depo, PLAN, A, { ad: "sablon-2.pdf", bayt: PDF })));
  const l = await a((db) => sablonlar(db, PLAN));
  assert.deepEqual(l.map((x) => x.surumNo), [2, 1]);
  assert.ok(await a((db) => dosyaIndirilebilir(db, PLAN, l[0].dosyaId, DOSYA_ERISIMI)));
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, l[0].dosyaId, DOSYA_ERISIMI)), null);
  assert.deepEqual(await a((db) => sablonlar(db, MUH)), []);
  tamam(await a((db) => sablonKaldir(db, PLAN, l[0].id, l[0].surum)));
  assert.deepEqual((await a((db) => sablonlar(db, PLAN))).map((x) => x.surumNo), [1]);
  assert.deepEqual(await a((db) => sablonYukle(db, depo, MUH, A, { ad: "x.pdf", bayt: PDF })), { durum: "yetkisiz" });
});

test("KİRACI: B, A'nın sözleşmesini göremez, ID ekleyemez; veritabanı başka firmanın müşterisine / tesisine / personeline bağlamaz", async () => {
  assert.equal(await b((db) => sozlesmeKarti(db, YON_B, soz)), null);
  assert.deepEqual(await b((db) => sozlesmeListesi(db, YON_B)), []);
  assert.deepEqual(await b((db) => sozlesmeHazirla(db, YON_B, S())), { durum: "gecersiz", hatalar: { musteri: "Müşteri seçilmeli." } });
  assert.deepEqual(await b((db) => isgKaydet(db, depo, YON_B, B, soz, null, 0, I(t1, pDenetci, "X"))), { durum: "gecersiz", hatalar: { tesis: "Tesis bu sözleşmenin kapsamında değil." } });
  await assert.rejects(b((db) => db.sorgu("INSERT INTO is_sozlesmesi (no, musteri_id, baslangic, bitis, vade, yenileme) VALUES ('IS-1026-009', $1, '2026-01-01', '2026-12-31', 30, 'yok')", [musteri])), /foreign key|yabancı anahtar/i);
  const pB = tamam(await b((db) => personelEkle(db, YON_B, { ...P, ad: "Deneme B" }))).id;
  await assert.rejects(b((db) => db.sorgu("INSERT INTO isg_katip (tesis_id, personel_id, no) VALUES ($1, $2, 'X')", [t1, pB])), /foreign key|yabancı anahtar/i);
});
