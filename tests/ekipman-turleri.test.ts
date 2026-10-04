/* NEREDEN GELDİ: maket ekipman-turleri.html (M3, onaylı 2026-09-26; AA5 branş sekmeleri, 2026-09-28 format sürümü kaldırılır) · KOD-GECIS §4
   (Ekipman türleri: branş yöneticileri ve firma yöneticisi değiştirir; planlama, denetçi görür; muhasebe görmez) · 09-A1/A2 (dosya kapalı depoda,
   türü görebilen açar) · reisim 2026-10-04: "rol değiştirme sızma veri çalma gibi şeylere dikkat et". GERÇEK PostgreSQL, iki firma. */
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
import { formatKaldir, formatYukle, turKaydet, turKarti, turListesi, type Kisi } from "../src/modules/ekipman-turleri/server/turler.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "tur-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let MEK: Kisi, PLAN: Kisi, DENETCI: Kisi, MUH: Kisi, MEK_B: Kisi;
const T = { ad: "Deneme Vinç", kod: "DV", grup: "kaldirma", brans: "", periyot: "12", sure: "" };
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

async function hesapli(firma: string, eposta: string, roller: string[]) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ($1, 'Deneme', $2, 'etkin') RETURNING id::text", [eposta, roller]))).rows[0].id;
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
  MEK = kisi(await hesapli(A, "mekanik@deneme.example", ["mekanik_yonetici"]), "mekanik_yonetici");
  PLAN = kisi(await hesapli(A, "planlama@deneme.example", ["planlama"]), "planlama");
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"]), "denetci");
  MUH = kisi(await hesapli(A, "muhasebe@deneme.example", ["muhasebe"]), "muhasebe");
  MEK_B = kisi(await hesapli(B, "mekanik@deneme-b.example", ["mekanik_yonetici"]), "mekanik_yonetici");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("ekle: ad, kod (2–3 harf, firmada eşsiz), grup, periyot 1–120; Ek-III dışında branş seçilir, öteki grupta gruptan gelir; maketle aynı iletiler", async () => {
  const r = await a((db) => turKaydet(db, MEK, null, 0, { ad: "AB", kod: "d1", grup: "", brans: "", periyot: "0", sure: "x" }));
  assert.deepEqual(r.durum === "gecersiz" && r.hatalar, {
    ad: "Tür adı yazılmalı.", kod: "Kod 2–3 büyük harf (A–Z); ekipman kodlarının öneki olur.", grup: "Ek-III grubu seçilmeli (branş buradan gelir).",
    periyot: "Periyot 1–120 ay.", sure: "Dakika olarak; boş bırakılabilir.",
  });
  const e = await a((db) => turKaydet(db, MEK, null, 0, { ...T, kod: "XD", grup: "ekdisi" }));
  assert.deepEqual(e.durum === "gecersiz" && e.hatalar, { brans: "Ek-III dışı türde branş seçilmeli." });
  const v = tamam(await a((db) => turKaydet(db, MEK, null, 0, { ...T, kod: "dv", brans: "e" })));
  const k = await a((db) => turKarti(db, MEK, v.id));
  assert.equal(k?.kod, "DV", "kod büyük harfe çevrilir");
  assert.equal(k?.brans, "m", "Kaldırma grubunun branşı mekanik (istemcinin yolladığı branş yok sayılır)");
  const iki = await a((db) => turKaydet(db, MEK, null, 0, { ...T, ad: "Başka Tür" }));
  assert.deepEqual(iki, { durum: "gecersiz", hatalar: { kod: "DV kodu Deneme Vinç türünde kullanılıyor." } });
  tamam(await a((db) => turKaydet(db, MEK, null, 0, { ...T, ad: "Elektrik Deneme", kod: "ED", grup: "ekdisi", brans: "e" })));
  assert.equal((await a((db) => turListesi(db, MEK)))!.find((x) => x.kod === "ED")?.brans, "e");
  /* B firmasında aynı kod serbest */
  tamam(await b((db) => turKaydet(db, MEK_B, null, 0, T)));
});

test("kod değişmez: düzenlemede yollanan kod yok sayılır; veritabanı da değiştirmez", async () => {
  const v = tamam(await a((db) => turKaydet(db, MEK, null, 0, { ...T, ad: "Kod Deneme", kod: "KD" })));
  tamam(await a((db) => turKaydet(db, MEK, v.id, v.surum, { ...T, ad: "Kod Deneme Yeni", kod: "ZZ" })));
  assert.equal((await a((db) => turKarti(db, MEK, v.id)))?.kod, "KD");
  await assert.rejects(a((db) => db.sorgu("UPDATE ekipman_turu SET kod = 'ZZ' WHERE id = $1", [v.id])), /kodu değişmez/);
  assert.deepEqual(await a((db) => turKaydet(db, MEK, v.id, 0, { ...T, ad: "Eski Sürüm" })), { durum: "cakisma" });
});

test("YETKİ: branş yöneticisi ekler / format yükler; planlama ve denetçi görür ama değiştiremez; muhasebe görmez, dosyayı da açamaz", async () => {
  const v = tamam(await a((db) => turKaydet(db, MEK, null, 0, { ...T, ad: "Yetki Deneme", kod: "YD" })));
  for (const k of [PLAN, DENETCI]) {
    assert.ok((await a((db) => turListesi(db, k)))!.some((x) => x.id === v.id));
    assert.deepEqual(await a((db) => turKaydet(db, k, null, 0, { ...T, kod: "QQ" })), { durum: "yetkisiz" });
    assert.deepEqual(await a((db) => turKaydet(db, k, v.id, v.surum, { ...T, ad: "Değiştirdim" })), { durum: "yetkisiz" });
    assert.deepEqual(await a((db) => formatYukle(db, depo, k, A, v.id, { ad: "x.pdf", bayt: PDF }, "")), { durum: "yetkisiz" });
  }
  assert.equal(await a((db) => turListesi(db, MUH)), null);
  assert.equal(await a((db) => turKarti(db, MUH, v.id)), null);
  const f = tamam(await a((db) => formatYukle(db, depo, MEK, A, v.id, { ad: "format.pdf", bayt: PDF }, "ilk")));
  const dosyaId = (await a((db) => turKarti(db, MEK, v.id)))!.formatlar[0].dosyaId;
  assert.equal(f.sira, 1);
  assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, dosyaId, DOSYA_ERISIMI)), "türü gören PDF'i açar");
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, dosyaId, DOSYA_ERISIMI)), null, "türü görmeyen açamaz");
  assert.equal(await b((db) => dosyaIndirilebilir(db, MEK_B, dosyaId, DOSYA_ERISIMI)), null, "başka firma açamaz");
});

test("FORMAT: yalnız PDF (baytlardan); sürüm sırası artar, kaldırılınca bir önceki kullanıma girer, numara yeniden verilmez", async () => {
  const v = tamam(await a((db) => turKaydet(db, MEK, null, 0, { ...T, ad: "Format Deneme", kod: "FD" })));
  const sahte = await a((db) => formatYukle(db, depo, MEK, A, v.id, { ad: "format.pdf", bayt: new TextEncoder().encode("<svg onload=alert(1)>") }, ""));
  assert.deepEqual(sahte, { durum: "gecersiz", hatalar: { dosya: "Dosya PDF değil ya da bozuk." } }, "adı .pdf olsa da içerik PDF değil");
  tamam(await a((db) => formatYukle(db, depo, MEK, A, v.id, { ad: "s1.pdf", bayt: PDF }, "")));
  tamam(await a((db) => formatYukle(db, depo, MEK, A, v.id, { ad: "s2.pdf", bayt: PDF }, "basınç testi eklendi")));
  let k = (await a((db) => turKarti(db, MEK, v.id)))!;
  assert.deepEqual(k.formatlar.map((x) => [x.sira, x.dosyaAd, x.notu]), [[2, "s2.pdf", "basınç testi eklendi"], [1, "s1.pdf", null]]);
  assert.equal(k.format?.sira, 2);
  tamam(await a((db) => formatKaldir(db, MEK, k.formatlar[0].id, k.formatlar[0].surum)));
  k = (await a((db) => turKarti(db, MEK, v.id)))!;
  assert.equal(k.format?.sira, 1, "kaldırılınca bir önceki kullanımda");
  assert.equal(tamam(await a((db) => formatYukle(db, depo, MEK, A, v.id, { ad: "s3.pdf", bayt: PDF }, ""))).sira, 3, "kaldırılan numara yeniden verilmez");
  await assert.rejects(a((db) => db.sorgu("DELETE FROM tur_format WHERE tur_id = $1", [v.id])), /permission denied|izin/i);
});

test("KİRACI: B, A'nın türünü göremez, değiştiremez, format yükleyemez; veritabanı başka firmanın türüne format bağlamaz", async () => {
  const v = tamam(await a((db) => turKaydet(db, MEK, null, 0, { ...T, ad: "Gizli Tür", kod: "GT" })));
  assert.equal(await b((db) => turKarti(db, MEK_B, v.id)), null);
  assert.ok(!(await b((db) => turListesi(db, MEK_B)))!.some((x) => x.id === v.id));
  assert.deepEqual(await b((db) => turKaydet(db, MEK_B, v.id, v.surum, { ...T, ad: "Ele Geçirdim" })), { durum: "yok" });
  assert.deepEqual(await b((db) => formatYukle(db, depo, MEK_B, B, v.id, { ad: "x.pdf", bayt: PDF }, "")), { durum: "yok" });
  const bDosya = (await b((db) => db.sorgu<{ id: string }>(
    "INSERT INTO dosya (id, modul, kayit_id, anahtar, ad, tur, boyut, sha256) SELECT i, 'ekipman_turu', $1::uuid, 'firma/' || $2::text || '/ekipman_turu/' || $1::text || '/' || i::text, 'x.pdf', 'application/pdf', 1, repeat('0', 64) FROM gen_random_uuid() AS i RETURNING id::text",
    [v.id, B]))).rows[0].id;
  await assert.rejects(b((db) => db.sorgu("INSERT INTO tur_format (tur_id, sira, dosya_id) VALUES ($1, 1, $2)", [v.id, bDosya])), /foreign key|yabancı anahtar/i);
});
