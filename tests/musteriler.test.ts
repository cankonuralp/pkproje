/* NEREDEN GELDİ: maket musteriler.html (M2, onaylı 2026-09-26) · karar 45 / 46 (vergi no ve SGK DETSİS NO zorunlu değil, tekrarı UYARI — "Yine de
   kaydet"), 47 (tesis tek müşteriye ait), 48 (silme yok, pasif), 50 (il ve ilçe listeden) · KOD-GECIS §4 (Müşteriler: planlama ve firma yöneticisi
   değiştirir, öteki roller görür) · reisim 2026-10-04: "rol değiştirme sızma veri çalma gibi şeylere dikkat et". GERÇEK PostgreSQL, iki firma. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { musteriKaydet, musteriKarti, musteriListesi, musteriPasif, tesisKaydet, tesisKarti, tesisPasif, type Kisi } from "../src/modules/musteriler/server/musteriler.ts";
import { MATRIS_ONERI } from "../src/server/yetki/tanim.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let PLAN: Kisi, DENETCI: Kisi, MUH: Kisi, PLAN_B: Kisi;
const M = { unvan: "Deneme Makina San. A.Ş.", kisa: "", vd: "Merkez", vno: "1234567890", eposta: "", tel: "", ilgili: "" };
const T = { ad: "Merkez Fabrika", adres: "Deneme Caddesi No: 1", il: "Kocaeli", ilce: "Gebze", sgk: "" };
const SGK = "1".repeat(26);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

async function hesapli(firma: string, eposta: string, roller: string[]) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, roller]))).rows[0].id;
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  PLAN = kisi(await hesapli(A, "planlama@deneme.example", ["planlama"]), "planlama");
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"]), "denetci");
  MUH = kisi(await hesapli(A, "muhasebe@deneme.example", ["muhasebe"]), "muhasebe");
  PLAN_B = kisi(await hesapli(B, "planlama@deneme-b.example", ["planlama"]), "planlama");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

const a = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, A, is);
const b = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is);

test("ekle: zorunlu yalnız ünvan; vergi no 10–11 hane, SGK 26 hane, il / ilçe listeden; maketle aynı iletiler; kısa ad boşsa ünvandan", async () => {
  const r = await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "AB", vno: "123456789", eposta: "x@" }, false));
  assert.deepEqual(r.durum === "gecersiz" && r.hatalar, {
    unvan: "Ünvan yazılmalı.", vno: "Vergi no 10 hane (şahıs şirketinde 11 hane); boş bırakılabilir.", eposta: "E-posta biçimi geçersiz.",
  });
  const m = tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, vno: "", vd: "" }, false)));
  const k = await a((db) => musteriKarti(db, PLAN, m.id));
  assert.equal(k?.kisa, "Deneme Makina", "kısa ad ünvanın ilk iki sözcüğü");
  assert.equal(k?.vno, null, "vergi no boş kalabilir (karar 45)");
  const t = await a((db) => tesisKaydet(db, PLAN, m.id, null, 0, { ...T, ad: "X", il: "Atlantis", ilce: "Gebze", sgk: "123" }, false));
  assert.deepEqual(t.durum === "gecersiz" && t.hatalar, { ad: "Tesis adı yazılmalı.", il: "İl listeden seçilmeli.", sgk: "SGK DETSİS NO 26 hane rakam.", ilce: "İlçe listeden seçilmeli." });
  const yanlisIlce = await a((db) => tesisKaydet(db, PLAN, m.id, null, 0, { ...T, ilce: "Kadıköy" }, false));
  assert.deepEqual(yanlisIlce.durum === "gecersiz" && yanlisIlce.hatalar, { ilce: "İlçe listeden seçilmeli." }, "ilçe seçili ilin listesinden");
  tamam(await a((db) => tesisKaydet(db, PLAN, m.id, null, 0, { ...T, adres: "", il: "", ilce: "", sgk: "" }, false)));
});

test("UYARI: aynı vergi no / SGK no başka kayıtta → kayıt durur ve söyler; 'Yine de kaydet' (onay) ile kaydedilir, ize gerekçesi düşer", async () => {
  tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "Birinci Deneme Ltd.", vno: "1111111111" }, false)));
  const u = await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "İkinci Deneme Ltd.", vno: "1111111111" }, false));
  assert.deepEqual(u, { durum: "uyari", uyarilar: { vno: "Bu vergi no Birinci Deneme müşterisinde de kayıtlı. Aynı müşteri olabilir." } });
  const m2 = tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "İkinci Deneme Ltd.", vno: "1111111111" }, true)));
  const iz = await a((db) => db.sorgu<{ gerekce: string }>("SELECT gerekce FROM denetim_izi WHERE nesne_id = $1", [m2.id]));
  assert.equal(iz.rows[0]?.gerekce, "uyarı görüldü, yine de kaydedildi");
  /* kendi kaydını güncellerken kendi vergi nosu uyarı vermez (yalnız BAŞKA kayıtla karşılaştırılır) */
  const tek = tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "Tek Deneme Ltd.", vno: "2222222222" }, false)));
  tamam(await a((db) => musteriKaydet(db, PLAN, tek.id, tek.surum, { ...M, unvan: "Tek Deneme Ltd.", vno: "2222222222", tel: "0262 000 00 00" }, false)));
  /* SGK: başka müşterinin tesisinde de olsa uyarır */
  const birinci = (await a((db) => musteriListesi(db, PLAN)))!.find((x) => x.unvan === "Birinci Deneme Ltd.")!;
  tamam(await a((db) => tesisKaydet(db, PLAN, birinci.id, null, 0, { ...T, sgk: SGK }, false)));
  const s = await a((db) => tesisKaydet(db, PLAN, m2.id, null, 0, { ...T, ad: "Depo", sgk: SGK }, false));
  assert.deepEqual(s, { durum: "uyari", uyarilar: { sgk: "Bu SGK DETSİS NO Birinci Deneme / Merkez Fabrika tesisinde de kayıtlı. Aynı tesis olabilir." } });
  tamam(await a((db) => tesisKaydet(db, PLAN, m2.id, null, 0, { ...T, ad: "Depo", sgk: SGK }, true)));
});

test("e-posta müşteri girişinin kullanıcı adı: firmada iki müşteride olamaz (hata, uyarı değil); başka firmada olabilir", async () => {
  tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "Posta Deneme A.Ş.", vno: "", eposta: "Bilgi@Posta-Deneme.example" }, false)));
  const r = await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "Posta İki A.Ş.", vno: "", eposta: "bilgi@posta-deneme.example" }, true));
  assert.deepEqual(r, { durum: "gecersiz", hatalar: { eposta: "Bu e-posta başka bir müşteride kayıtlı." } });
  tamam(await b((db) => musteriKaydet(db, PLAN_B, null, 0, { ...M, unvan: "Posta Deneme A.Ş.", vno: "", eposta: "bilgi@posta-deneme.example" }, false)));
});

test("YETKİ: planlama ekler / değiştirir; denetçi ve muhasebe görür ama değiştiremez; tanımsız rol görmez; firmanın 'kendi' düzeyi kayıt göstermez", async () => {
  const m = tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "Yetki Deneme Ltd.", vno: "" }, false)));
  for (const k of [DENETCI, MUH]) {
    assert.ok((await a((db) => musteriListesi(db, k)))!.some((x) => x.id === m.id));
    assert.equal((await a((db) => musteriKarti(db, k, m.id)))?.unvan, "Yetki Deneme Ltd.");
    assert.deepEqual(await a((db) => musteriKaydet(db, k, null, 0, M, false)), { durum: "yetkisiz" });
    assert.deepEqual(await a((db) => musteriKaydet(db, k, m.id, 0, { ...M, unvan: "Değiştirdim Ltd." }, false)), { durum: "yetkisiz" });
    assert.deepEqual(await a((db) => tesisKaydet(db, k, m.id, null, 0, T, false)), { durum: "yetkisiz" });
    assert.deepEqual(await a((db) => musteriPasif(db, k, m.id, 0, true)), { durum: "yetkisiz" });
  }
  assert.equal(await a((db) => musteriListesi(db, kisi(PLAN.id, "tanri"))), null);
  assert.equal(await a((db) => musteriKarti(db, kisi(PLAN.id, "tanri"), m.id)), null);
  /* firma Rol yetkilerinde denetçiye "kendi" verirse: plan modülü gelene kadar kayıt gösterilmez (varsayılan kapalı) */
  const kendi = { ...DENETCI, matris: { ...MATRIS_ONERI, 3: ["yaz", "kendi", "gor", "gor", "yaz", "gor"] as const } };
  assert.deepEqual(await a((db) => musteriListesi(db, kendi)), []);
  assert.equal(await a((db) => musteriKarti(db, kendi, m.id)), null);
  /* firma planlamanın yetkisini "görür"e indirirse planlama artık değiştiremez */
  const indirildi = { ...PLAN, matris: { ...MATRIS_ONERI, 3: ["gor", "gor", "gor", "gor", "yaz", "gor"] as const } };
  assert.deepEqual(await a((db) => musteriKaydet(db, indirildi, null, 0, M, false)), { durum: "yetkisiz" });
});

test("KİRACI: B, A'nın müşterisini / tesisini göremez, değiştiremez, A'nın müşterisine tesis ekleyemez; veritabanı da başka firmanın müşterisine bağlamaz", async () => {
  const m = tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "Gizli Deneme A.Ş.", vno: "" }, false)));
  const t = tamam(await a((db) => tesisKaydet(db, PLAN, m.id, null, 0, T, false)));
  assert.equal(await b((db) => musteriKarti(db, PLAN_B, m.id)), null);
  assert.equal(await b((db) => tesisKarti(db, PLAN_B, t.id)), null);
  assert.ok(!(await b((db) => musteriListesi(db, PLAN_B)))!.some((x) => x.id === m.id));
  assert.deepEqual(await b((db) => musteriKaydet(db, PLAN_B, m.id, 0, { ...M, unvan: "Ele Geçirdim A.Ş." }, false)), { durum: "yok" });
  assert.deepEqual(await b((db) => tesisKaydet(db, PLAN_B, m.id, null, 0, T, false)), { durum: "yok" });
  assert.deepEqual(await b((db) => musteriPasif(db, PLAN_B, m.id, 0, true)), { durum: "yok" });
  assert.deepEqual(await b((db) => tesisPasif(db, PLAN_B, t.id, 0, true)), { durum: "yok" });
  /* uygulama atlansa bile: B'nin bağlamında A'nın müşterisine tesis satırı yazılamaz (firma + müşteri birlikte bağlı) */
  await assert.rejects(b((db) => db.sorgu("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Sızma')", [m.id])), /foreign key|yabancı anahtar/i);
  /* A'nın tesisini B'nin müşterisine taşıma da yok: tesis güncellemesi müşteriyi değiştirmez */
  const mb = tamam(await b((db) => musteriKaydet(db, PLAN_B, null, 0, { ...M, unvan: "B Deneme A.Ş.", vno: "" }, false)));
  assert.deepEqual(await a((db) => tesisKaydet(db, PLAN, mb.id, t.id, 0, T, false)), { durum: "yok" });
  assert.equal((await a((db) => musteriKarti(db, PLAN, m.id)))?.unvan, "Gizli Deneme A.Ş.");
});

test("PASİF (karar 48): müşteri pasif → etkin tesisleri onunla pasif; geri gelince yalnız onlar döner; pasif müşteriye tesis eklenmez; sürüm kilidi", async () => {
  const m = tamam(await a((db) => musteriKaydet(db, PLAN, null, 0, { ...M, unvan: "Pasif Deneme Ltd.", vno: "" }, false)));
  const t1 = tamam(await a((db) => tesisKaydet(db, PLAN, m.id, null, 0, { ...T, ad: "Bir" }, false)));
  const t2 = tamam(await a((db) => tesisKaydet(db, PLAN, m.id, null, 0, { ...T, ad: "İki" }, false)));
  tamam(await a((db) => tesisPasif(db, PLAN, t2.id, t2.surum, true)));   // kendi başına pasif
  const k = (await a((db) => musteriKarti(db, PLAN, m.id)))!;
  assert.deepEqual(await a((db) => musteriPasif(db, PLAN, m.id, k.surum + 5, true)), { durum: "cakisma" }, "eski sürümle yazılmaz");
  assert.deepEqual(await a((db) => musteriPasif(db, PLAN, m.id, Number.NaN, true)), { durum: "cakisma" }, "bozuk sürüm hata fırlatmaz");
  tamam(await a((db) => musteriPasif(db, PLAN, m.id, k.surum, true)));
  let p = (await a((db) => musteriKarti(db, PLAN, m.id)))!;
  assert.ok(p.pasif && p.tesisler.every((t) => t.pasif), "bütün tesisler pasif");
  assert.deepEqual(await a((db) => tesisKaydet(db, PLAN, m.id, null, 0, { ...T, ad: "Üç" }, false)), { durum: "red", neden: "Müşteri pasif; önce müşteriyi yeniden etkinleştirin." });
  const t1k = (await a((db) => tesisKarti(db, PLAN, t1.id)))!;
  assert.deepEqual(await a((db) => tesisPasif(db, PLAN, t1.id, t1k.surum, false)), { durum: "red", neden: "Müşteri pasif; önce müşteriyi yeniden etkinleştirin." });
  tamam(await a((db) => musteriPasif(db, PLAN, m.id, p.surum, false)));
  p = (await a((db) => musteriKarti(db, PLAN, m.id)))!;
  assert.equal(p.pasif, null);
  assert.deepEqual(p.tesisler.map((t) => [t.ad, !!t.pasif]), [["Bir", false], ["İki", true]], "kendi başına pasif olan tesis pasif kalır");
  /* silme yetkisi yok: uygulama rolü DELETE yapamaz */
  await assert.rejects(a((db) => db.sorgu("DELETE FROM musteri WHERE id = $1", [m.id])), /permission denied|izin/i);
});
