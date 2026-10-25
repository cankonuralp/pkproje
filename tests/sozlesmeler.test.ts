/* NEREDEN GELDİ: maket sozlesmeler.html (M5 + M13 2. tur, reisim 2026-09-26: "pk firma ile fabrika arasındaki sözleşme … isg katip sözleşmesi pdf
   olarak isteğe bağlı … sözleşme id denetçiye göre değişir"; F herkes girer · G kullanılmamış ID silinir, kullanılmış yalnız düzeltilir) ·
   KOD-GECIS §3 (kullanılmış ID silinmez) · §4 (Sözleşmeler: planlama ve yönetici değiştirir, denetçi kendi, muhasebe görür) · reisim 2026-10-04:
   "rol değiştirme sızma veri çalma". GERÇEK PostgreSQL, iki firma.
   2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri için sözleşme
   açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"): sözleşme belgesi ("gör" / "yaz"; şablon → temel → firmanın formatı),
   elle doldurulan yerler (yalnız "yaz", formatın yerlerine göre, sürüm kilidi), müşteriye gönder (PDF tek dosya yolundan, alıcı başına ekli e-posta,
   gönderen tuşa basan). Saf parçalar: tests/sozlesme-belge-saf.test.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { kaynakEpostalari } from "../src/server/eposta/eposta.ts";
import type { SozlesmeBelgesiVerisi } from "../src/belge/sozlesme.ts";
import type { Hucre } from "../src/format/tanim.ts";
import { belgeFormatiOku, belgeTaslakAc, belgeTaslakKaydet, belgeYayinla } from "../src/modules/rapor-format/server/belgeler.ts";
import { musteriKaydet, tesisKaydet, tesisPasif } from "../src/modules/musteriler/server/musteriler.ts";
import { personelEkle } from "../src/modules/personel/server/personel.ts";
import { bitisHesapla } from "../src/modules/sozlesmeler/sema.ts";
import { imzaliYukle, isgIdBul, isgKaldir, isgKaydet, sablonKaldir, sablonlar, sablonYukle, sozlesmeHazirla, sozlesmeKarti, sozlesmeListesi, sozlesmeSecenekleri,
  type Kisi }
  from "../src/modules/sozlesmeler/server/sozlesmeler.ts";
import { DosyaHatasi, sozlesmeBelgeBolumu, sozlesmeBelgesiVerisi, sozlesmeDoldur, sozlesmeGonder, sozlesmeSayfasi } from "../src/modules/sozlesmeler/server/sozlesmeler.ts";
import { sozlesmeListeSecenekleri, sozlesmeTanim } from "../src/modules/sozlesmeler/liste.ts";
import { listele, yeniDurum, type SuzgecDurumu } from "../src/components/liste/suzgec.ts";
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

test("DAYANAK TEKLİF (326): seçeneklerde müşterilerin kabul edilmiş teklifleri; yalnız aynı müşterinin kabul edilmiş teklifi dayanak olur; sayfada numarası; veritabanı da denetler, sonradan değişmez", async () => {
  const q = async (metin: string, p: unknown[] = []) => (await a((db) => db.sorgu<{ id: string }>(metin, p))).rows[0]?.id;
  const tur = (await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('DT', 'Deneme türü', 'basincli', 'm', 12) RETURNING id::text"))!;
  const baska = (await q("SELECT musteri_id::text AS id FROM tesis WHERE id = $1", [tBaska]))!;
  const teklif = async (no: string, m: string, t: string, kabul: boolean) => {
    const id = (await q("INSERT INTO teklif (no, musteri_id, gecerlilik) VALUES ($1, $2, 30) RETURNING id::text", [no, m]))!;
    await q("INSERT INTO teklif_kalem (teklif_id, tur_id, adet, fiyat) VALUES ($1, $2, 1, 100) RETURNING id::text", [id, tur]);
    await q("INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, $2) RETURNING id::text", [id, t]);
    await q("UPDATE teklif SET durum = 'gonderildi' WHERE id = $1 RETURNING id::text", [id]);
    if (kabul) await q("UPDATE teklif SET durum = 'kabul' WHERE id = $1 RETURNING id::text", [id]);
    return id;
  };
  const kabul = await teklif("T-1026-901", musteri, t1, true), gonderilen = await teklif("T-1026-902", musteri, t1, false), baskasi = await teklif("T-1026-903", baska, tBaska, true);
  const sec = (await a((db) => sozlesmeSecenekleri(db, PLAN)))!;
  assert.deepEqual(sec.teklifler.map((t) => [t.no, t.musteri, t.tesisler]).sort(), [["T-1026-901", musteri, [t1]], ["T-1026-903", baska, [tBaska]]], "yalnız kabul edilmişler");
  for (const [t, ileti] of [[baskasi, "Teklif bu müşterinin kabul edilmiş teklifi olmalı."], [gonderilen, "Teklif bu müşterinin kabul edilmiş teklifi olmalı."], ["x", "Teklif seçilmeli."]]) {
    assert.deepEqual(await a((db) => sozlesmeHazirla(db, PLAN, S({ teklif: t }))), { durum: "gecersiz", hatalar: { teklif: ileti } }, t);
  }
  const r = tamam(await a((db) => sozlesmeHazirla(db, PLAN, S({ teklif: kabul }))));
  assert.deepEqual((await a((db) => sozlesmeKarti(db, PLAN, r.id)))!.teklif, { id: kabul, no: "T-1026-901" });
  assert.equal((await a((db) => sozlesmeKarti(db, PLAN, soz)))!.teklif, null, "sistem öncesi");
  assert.ok((await a((db) => sozlesmeListesi(db, MUH)))!.some((x) => x.teklif?.no === "T-1026-901"), "listede (muhasebe görür)");
  await assert.rejects(a((db) => db.sorgu("UPDATE is_sozlesmesi SET teklif_id = NULL, surum = surum + 1 WHERE id = $1", [r.id])), /dayanak teklif değişmez/);
  await assert.rejects(a((db) => db.sorgu(`INSERT INTO is_sozlesmesi (no, musteri_id, baslangic, bitis, vade, yenileme, teklif_id)
    VALUES ('IS-1026-950', $1, '2026-10-01', '2027-09-30', 30, 'yok', $2)`, [musteri, baskasi])), /bu müşterinin kabul edilmiş teklifi olmalı/);
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

/* 570 (reisim 2026-10-15: "sitede donma …" → "elindeki bütün işleri yap"; 09-B3): Sözleşmeler listesi bütün sözleşmeleri tarayıcıya indiriyordu —
   süzgeç ekranla aynı tanımla (liste.ts) sunucuda, ekrana yalnız sayfa; denetçi yine yalnız kendi İSG-KATİP ID'li sözleşmeleri */
test("570 Sözleşmeler sunucuda sayfalı: ekranın süzgeciyle birebir; denetçi yalnız kendininkiler; başka firma boş", async () => {
  for (const k of [YON, MUH, DENETCI]) {
    const l = (await a((db) => sozlesmeListesi(db, k)))!;
    const t = sozlesmeTanim(sozlesmeListeSecenekleri(l));
    const durumlar: Partial<SuzgecDurumu>[] = [{}, { secili: ["imza"] }, { secili: ["yururlukte", "isgyok"], kip: "ve" }, { ara: "is-" }, { sayfa: 9 }];
    for (const d0 of durumlar) {
      const s = (await a((db) => sozlesmeSayfasi(db, k, d0)))!;
      const o = listele(t, { ...yeniDurum(t), ...d0 }, l);
      assert.deepEqual(s.gorunen, o.gorunen, `${k.roller[0]} ${JSON.stringify(d0)}`);
      assert.deepEqual([s.adet, s.toplam, s.kayitSayisi, s.sayfa], [o.adet, o.toplam, l.length, o.sayfa]);
      for (const c of t.cipler) assert.equal(s.cipSayilari[c.k], o.tb.filter(c.test).length);
    }
    const s0 = (await a((db) => sozlesmeSayfasi(db, k, {})))!;
    assert.deepEqual([s0.secenekler.musteri, s0.secenekler.kisi], [sozlesmeListeSecenekleri(l).musteri, sozlesmeListeSecenekleri(l).kisi]);
  }
  assert.deepEqual((await a((db) => sozlesmeSayfasi(db, DENETCI, {})))!.gorunen.map((x) => x.no), (await a((db) => sozlesmeListesi(db, DENETCI)))!.map((x) => x.no).slice(0, 20));
  assert.equal((await b((db) => sozlesmeSayfasi(db, YON_B, {})))!.kayitSayisi, 0, "başka firma");
});

/* 2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri için sözleşme
   açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim") */
test("SÖZLEŞME BELGESİ: yalnız 'gör' / 'yaz'; şablon → temel → firmanın formatı; elle yerler yalnız 'yaz' ve formatın yerleri; müşteriye gönder: tek PDF, alıcı başına ekli e-posta, gönderen tuşa basan", async () => {
  const k = (kisi_: Kisi) => <T,>(is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: kisi_.id });
  const sayim = async () => (await a((db) => db.sorgu<{ e: number; d: number }>(
    "SELECT (SELECT count(*)::int FROM eposta WHERE kaynak = 'sozlesme') AS e, (SELECT count(*)::int FROM dosya WHERE modul = 'sozlesme_gonderim') AS d"))).rows[0];
  /* görme: denetçinin "kendi" düzeyi ve başka firma görmez; muhasebe ("gör") görür */
  assert.equal(await a((db) => sozlesmeBelgesiVerisi(db, DENETCI, soz)), null, "denetçi sözleşme belgesini görmez");
  assert.equal(await b((db) => sozlesmeBelgesiVerisi(db, YON_B, soz)), null, "başka firma");
  const v = (await a((db) => sozlesmeBelgesiVerisi(db, MUH, soz)))!;
  assert.deepEqual([v.no, v.musteri.unvan, v.tesisler.map((t) => t.ad), v.format, v.elle, v.teklifNo, v.sablon?.surumNo],
    ["IS-1026-001", "Deneme Makina San. A.Ş.", ["İkinci Tesis", "Merkez Fabrika"], null, null, null, 1], "format yok: kullanımdaki şablon (v1)");

  /* gönder: yetki ve alıcı denetimi PDF'ten önce */
  let basilan = 0;
  const BASILAN = new TextEncoder().encode("%PDF-1.4\n%basilan\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
  const uret = async () => { basilan++; return BASILAN; };
  for (const kisi_ of [MUH, DENETCI]) assert.deepEqual(await k(kisi_)((db) => sozlesmeGonder(db, depo, kisi_, A, soz, { kime: ["m@deneme.example"] }, uret)), { durum: "yetkisiz" });
  for (const kime of [[], Array.from({ length: 6 }, (_, i) => `k${i}@deneme.example`), ["a@deneme.example", "A@deneme.example"], ["yanlis"]]) {
    assert.equal((await k(PLAN)((db) => sozlesmeGonder(db, depo, PLAN, A, soz, { kime }, uret))).durum, "gecersiz", JSON.stringify(kime));
  }
  assert.deepEqual(await b((db) => sozlesmeGonder(db, depo, YON_B, B, soz, { kime: ["m@deneme.example"] }, uret)), { durum: "yok" }, "başka firma");
  assert.deepEqual([basilan, (await sayim()).e], [0, 0]);

  /* şablon varken ek şablonun kendisi (PDF basılmaz); alıcı başına e-posta, tek dosya; gönderen tuşa basan */
  const r1 = tamam(await k(PLAN)((db) => sozlesmeGonder(db, depo, PLAN, A, soz, { kime: ["Musteri@Deneme.example", "ikinci@deneme.example"] }, uret)));
  assert.deepEqual([r1.adet, basilan], [2, 0]);
  const e = (await a((db) => db.sorgu<{ kime: string; konu: string; govde: string; ek_ad: string; ek_dosya: string; gonderen_eposta: string; durum: string }>(
    "SELECT kime, konu, govde, ek_ad, ek_dosya::text, gonderen_eposta, durum FROM eposta WHERE kaynak = 'sozlesme' AND kaynak_id = $1 ORDER BY kime", [soz]))).rows;
  assert.deepEqual(e.map((x) => [x.kime, x.ek_ad, x.gonderen_eposta, x.durum]),
    [["ikinci@deneme.example", "IS-1026-001.pdf", "planlama@deneme.example", "bekliyor"], ["musteri@deneme.example", "IS-1026-001.pdf", "planlama@deneme.example", "bekliyor"]]);
  assert.equal(e[0].ek_dosya, e[1].ek_dosya, "tek dosya");
  assert.equal(e[0].konu, "Deneme A · IS-1026-001 hizmet sözleşmesi");
  assert.ok(e[0].govde.startsWith("Sayın Deneme Makina San. A.Ş.,") && !e[0].govde.includes("İmzalı nüshayı"), "imzalı sözleşmede imzalı nüsha istenmez");
  const d = (await a((db) => db.sorgu<{ modul: string; kayit_id: string; sha256: string }>("SELECT modul, kayit_id::text, sha256 FROM dosya WHERE id = $1", [e[0].ek_dosya]))).rows[0];
  const sablonDosya = (await a((db) => db.sorgu<{ sha256: string }>(
    "SELECT d.sha256 FROM dosya d JOIN sozlesme_sablon s ON s.dosya_id = d.id WHERE s.kaldirildi IS NULL ORDER BY s.surum_no DESC LIMIT 1"))).rows[0];
  assert.deepEqual([d.modul, d.kayit_id, d.sha256], ["sozlesme_gonderim", soz, sablonDosya.sha256]);
  assert.ok(await a((db) => dosyaIndirilebilir(db, MUH, e[0].ek_dosya, DOSYA_ERISIMI)), "giden PDF'i sözleşmeyi gören açar");
  assert.equal(await a((db) => dosyaIndirilebilir(db, DENETCI, e[0].ek_dosya, DOSYA_ERISIMI)), null, "denetçi açamaz");
  assert.equal(await b((db) => dosyaIndirilebilir(db, YON_B, e[0].ek_dosya, DOSYA_ERISIMI)), null, "başka firma açamaz");
  assert.deepEqual((await a((db) => kaynakEpostalari(db, "sozlesme", soz))).map((x) => x.kime).sort(), ["ikinci@deneme.example", "musteri@deneme.example"]);

  /* şablon kaldırılınca temel format basılır; basım düşerse hiçbir şey yazılmaz */
  for (const x of await a((db) => sablonlar(db, PLAN))) tamam(await a((db) => sablonKaldir(db, PLAN, x.id, x.surum)));
  assert.equal((await a((db) => sozlesmeBelgesiVerisi(db, PLAN, soz)))!.sablon, null);
  const gelen: SozlesmeBelgesiVerisi[] = [];
  tamam(await k(PLAN)((db) => sozlesmeGonder(db, depo, PLAN, A, soz, { kime: ["musteri@deneme.example"] }, async (x) => { gelen.push(x); return PDF; })));
  assert.deepEqual([gelen.length, gelen[0].no, gelen[0].format, gelen[0].musteriImza !== null], [1, "IS-1026-001", null, true]);
  const once = await sayim();
  await assert.rejects(k(PLAN)((db) => sozlesmeGonder(db, depo, PLAN, A, soz, { kime: ["musteri@deneme.example"] }, async () => { throw new Error("basılamadı"); })), DosyaHatasi);
  assert.deepEqual(await sayim(), once);

  /* elle doldurma: yalnız "yaz"; yayında format yokken red */
  assert.deepEqual(await k(MUH)((db) => sozlesmeDoldur(db, MUH, soz, {}, null)), { durum: "yetkisiz" });
  assert.deepEqual(await k(PLAN)((db) => sozlesmeDoldur(db, PLAN, soz, {}, null)), { durum: "red", neden: "Yayında sözleşme formatı yok." });
  /* firmanın sözleşme formatı: serbest tabloda iki elle yer (yazı + zorunlu sayı), yayında (Rapor formatı › Belgeler; yönetici) */
  const t = tamam(await k(YON)((db) => belgeTaslakAc(db, YON, "sozlesme", "bos", null)));
  const f = (await k(YON)((db) => belgeFormatiOku(db, YON, t.id)))!;
  const tanim = structuredClone(f.tanim), tb = tanim.bolumler[0];
  assert.ok(tb.blok === "tablo");
  const yer: Record<string, Hucre> = { "1:0": { r: 1, c: 0, tur: "yazi", m: "Özel koşul" }, "1:1": { r: 1, c: 1, tur: "alan", id: "h_kosul", alan: "metin" },
    "2:0": { r: 2, c: 0, tur: "yazi", m: "Yıllık bedel" }, "2:1": { r: 2, c: 1, tur: "alan", id: "h_bedel", alan: "sayi", zorunlu: true } };
  tb.hucreler = tb.hucreler.map((h) => yer[`${h.r}:${h.c}`] ?? h);
  const kt = tamam(await k(YON)((db) => belgeTaslakKaydet(db, YON, t.id, f.surum, tanim)));
  assert.equal((await k(YON)((db) => belgeYayinla(db, YON, t.id, kt.surum, ""))).durum, "tamam");
  const bolum = (await k(PLAN)(async (db) => sozlesmeBelgeBolumu(db, PLAN, (await sozlesmeKarti(db, PLAN, soz))!, depo)))!;
  assert.deepEqual([bolum.kaynak, bolum.doldurma?.toplam, bolum.doldurma?.bos.length, bolum.doldurma?.surum, bolum.epostalar.length, bolum.baslik],
    ["format", 2, 2, null, 3, "Sözleşme"]);
  assert.equal(await k(DENETCI)(async (db) => sozlesmeBelgeBolumu(db, DENETCI, (await sozlesmeKarti(db, DENETCI, soz))!, depo)), null);
  assert.equal((await k(PLAN)((db) => sozlesmeDoldur(db, PLAN, soz, { h_bedel: "on bin" }, null))).durum, "gecersiz", "sayı yerine yazı");
  assert.equal((await k(PLAN)((db) => sozlesmeDoldur(db, PLAN, soz, { h_yok: "x" }, null))).durum, "gecersiz", "formatta olmayan yer");
  tamam(await k(PLAN)((db) => sozlesmeDoldur(db, PLAN, soz, { h_kosul: "Deneme özel koşul", h_bedel: "1250,5" }, null)));
  assert.deepEqual(await k(PLAN)((db) => sozlesmeDoldur(db, PLAN, soz, { h_kosul: "ezme" }, null)), { durum: "cakisma" }, "görmediği doldurmayı ezmez");
  assert.deepEqual(await b((db) => sozlesmeDoldur(db, YON_B, soz, { h_kosul: "x" }, null)), { durum: "yok" }, "başka firma");
  const v2 = (await a((db) => sozlesmeBelgesiVerisi(db, PLAN, soz)))!;
  assert.deepEqual([v2.elle?.h_kosul, !!v2.format, v2.sablon], ["Deneme özel koşul", true, null]);
  const b2 = (await k(PLAN)(async (db) => sozlesmeBelgeBolumu(db, PLAN, (await sozlesmeKarti(db, PLAN, soz))!, depo)))!;
  assert.deepEqual([b2.doldurma?.bos, typeof b2.doldurma?.surum], [[], "number"]);
  /* gönderilen PDF firmanın formatından, elle değerlerle */
  gelen.length = 0;
  tamam(await k(PLAN)((db) => sozlesmeGonder(db, depo, PLAN, A, soz, { kime: ["musteri@deneme.example"] }, async (x) => { gelen.push(x); return PDF; })));
  assert.deepEqual([!!gelen[0].format, gelen[0].elle?.h_kosul], [true, "Deneme özel koşul"]);
});
