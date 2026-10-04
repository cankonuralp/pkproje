/* NEREDEN GELDİ: maket olcum-cihazlari.html (M4 2. tur; T7 cihaz türü ekle; 59: kalibrasyonu geçen cihazla rapor onaya gönderilemez — rapor
   kaleminde; 65: uyarı eşiği firma ayarı) · KOD-GECIS §4 (Ölçüm cihazları: branş yöneticileri ve firma yöneticisi değiştirir, planlama görür,
   denetçi kendi zimmeti, muhasebe görmez) · reisim 2026-10-04: "rol değiştirme sızma veri çalma". GERÇEK PostgreSQL, iki firma. */
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
import { kalDurum } from "../src/modules/olcum-cihazlari/sema.ts";
import { bugunTr, cihazKaydet, cihazKarti, cihazKonum, cihazListesi, cihazTurleri, kalibrasyonEkle, kalibrasyonKaldir, type Kisi } from "../src/modules/olcum-cihazlari/server/cihazlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "cihaz-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let ELK: Kisi, PLAN: Kisi, DENETCI: Kisi, MUH: Kisi, ELK_B: Kisi;
const C = { kod: "oc-001", tur: "yeni", yeniTur: "Topraklama ölçer", marka: "Deneme", model: "M1", seri: "S1", aralik: "0–2 kΩ" };
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const gun = (n: number) => { const d = new Date(`${bugunTr()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

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
  ELK = kisi(await hesapli(A, "elektrik@deneme.example", ["elektrik_yonetici"]), "elektrik_yonetici");
  PLAN = kisi(await hesapli(A, "planlama@deneme.example", ["planlama"]), "planlama");
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"]), "denetci");
  MUH = kisi(await hesapli(A, "muhasebe@deneme.example", ["muhasebe"]), "muhasebe");
  ELK_B = kisi(await hesapli(B, "elektrik@deneme-b.example", ["elektrik_yonetici"]), "elektrik_yonetici");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("kalibrasyon durumu: kalibrasyonda · kayıt yok / geçti · eşik içinde · geçerli (maket MV.kalDurum)", () => {
  assert.equal(kalDurum("2026-12-01", "lab", "2026-10-04", 30), "lab");
  assert.equal(kalDurum(null, "depo", "2026-10-04", 30), "gecti");
  assert.equal(kalDurum("2026-10-03", "depo", "2026-10-04", 30), "gecti");
  assert.equal(kalDurum("2026-10-04", "depo", "2026-10-04", 30), "yakin");
  assert.equal(kalDurum("2026-11-03", "depo", "2026-10-04", 30), "yakin");
  assert.equal(kalDurum("2026-11-04", "depo", "2026-10-04", 30), "gecerli");
});

test("cihaz ekle: kod (büyük harf, firmada eşsiz), yeni tür adıyla tür eklenir ve yeniden kullanılır; maketle aynı iletiler", async () => {
  const r = await a((db) => cihazKaydet(db, ELK, null, 0, { ...C, kod: "x", tur: "", yeniTur: "" }));
  assert.deepEqual(r.durum === "gecersiz" && r.hatalar, { kod: "Cihaz kodu 3–12 hane (A–Z, 0–9, tire).", tur: "Cihaz türü seçilmeli." });
  const y = await a((db) => cihazKaydet(db, ELK, null, 0, { ...C, yeniTur: "" }));
  assert.deepEqual(y.durum === "gecersiz" && y.hatalar, { yeniTur: "Tür adı yazılmalı." });
  const c1 = tamam(await a((db) => cihazKaydet(db, ELK, null, 0, C)));
  tamam(await a((db) => cihazKaydet(db, ELK, null, 0, { ...C, kod: "OC-002", yeniTur: "topraklama ÖLÇER" })));
  const turler = await a((db) => cihazTurleri(db, ELK));
  assert.equal(turler.length, 1, "aynı ad (büyük / küçük harf farkı) yeni tür açmaz");
  assert.equal((await a((db) => cihazKarti(db, ELK, c1.id)))?.kod, "OC-001");
  assert.deepEqual(await a((db) => cihazKaydet(db, ELK, null, 0, { ...C, tur: turler[0].id })), { durum: "gecersiz", hatalar: { kod: "OC-001 kodu başka bir cihazda kullanılıyor." } });
  tamam(await b((db) => cihazKaydet(db, ELK_B, null, 0, C)));   // başka firmada aynı kod serbest
  assert.deepEqual(await a((db) => cihazKaydet(db, ELK, null, 0, { ...C, kod: "OC-099", tur: "00000000-0000-4000-8000-000000000000" })), { durum: "gecersiz", hatalar: { tur: "Cihaz türü seçilmeli." } });
});

test("KALİBRASYON: kayıt yokken geçti; uygun kayıtla geçerli, eşik içinde yakın; uygun değil kayıt bitişi uzatmaz; kaldırınca yeniden hesaplanır; laboratuvardan kayıtla depoya döner", async () => {
  const c = tamam(await a((db) => cihazKaydet(db, ELK, null, 0, { ...C, kod: "KAL-1" })));
  assert.equal((await a((db) => cihazKarti(db, ELK, c.id)))?.durum, "gecti");
  const h = await a((db) => kalibrasyonEkle(db, depo, ELK, A, c.id, { tarih: gun(0), bitis: gun(-1), lab: "X", sertifika: "", sonuc: "" }));
  assert.deepEqual(h.durum === "gecersiz" && h.hatalar, { lab: "Laboratuvar yazılmalı.", sertifika: "Sertifika no yazılmalı.", sonuc: "Sonuç seçilmeli." });
  const ters = await a((db) => kalibrasyonEkle(db, depo, ELK, A, c.id, { tarih: gun(0), bitis: gun(-1), lab: "Deneme Lab", sertifika: "KL-1", sonuc: "uygun" }));
  assert.deepEqual(ters.durum === "gecersiz" && ters.hatalar, { bitis: "Geçerlilik bitişi kalibrasyon tarihinden önce olamaz." });
  const k1 = tamam(await a((db) => kalibrasyonEkle(db, depo, ELK, A, c.id, { tarih: gun(-300), bitis: gun(10), lab: "Deneme Lab", sertifika: "KL-1", sonuc: "uygun" })));
  assert.equal((await a((db) => cihazKarti(db, ELK, c.id)))?.durum, "yakin");
  tamam(await a((db) => kalibrasyonEkle(db, depo, ELK, A, c.id, { tarih: gun(-1), bitis: gun(400), lab: "Deneme Lab", sertifika: "KL-2", sonuc: "uygun_degil" })));
  assert.equal((await a((db) => cihazKarti(db, ELK, c.id)))?.bitis, gun(10), "uygun değil kayıt bitişi uzatmaz");
  let kart = (await a((db) => cihazKarti(db, ELK, c.id)))!;
  tamam(await a((db) => cihazKonum(db, ELK, c.id, kart.surum, "lab")));
  assert.equal((await a((db) => cihazKarti(db, ELK, c.id)))?.durum, "lab");
  tamam(await a((db) => kalibrasyonEkle(db, depo, ELK, A, c.id, { tarih: gun(0), bitis: gun(365), lab: "Deneme Lab", sertifika: "KL-3", sonuc: "uygun" }, { ad: "kl-3.pdf", bayt: PDF })));
  kart = (await a((db) => cihazKarti(db, ELK, c.id)))!;
  assert.deepEqual([kart.konum, kart.durum, kart.bitis], ["depo", "gecerli", gun(365)], "kayıtla depoya döner, geçerli");
  const son = kart.kalibrasyonlar[0];
  tamam(await a((db) => kalibrasyonKaldir(db, ELK, son.id, son.surum)));
  assert.equal((await a((db) => cihazKarti(db, ELK, c.id)))?.bitis, gun(10), "kaldırınca bir önceki uygun kayıt");
  assert.equal(k1.durum, "tamam");
  /* sertifika: yalnız PDF */
  const sahte = await a((db) => kalibrasyonEkle(db, depo, ELK, A, c.id, { tarih: gun(0), bitis: gun(1), lab: "Deneme Lab", sertifika: "KL-4", sonuc: "uygun" }, { ad: "kl.pdf", bayt: new TextEncoder().encode("<html>") }));
  assert.deepEqual(sahte, { durum: "gecersiz", hatalar: { dosya: "Dosya PDF değil ya da bozuk." } });
});

test("YETKİ: yönetici değiştirir; planlama görür ama değiştiremez; denetçi (kendi) zimmeti gelene kadar kayıt görmez; muhasebe görmez, sertifikayı açamaz", async () => {
  const c = tamam(await a((db) => cihazKaydet(db, ELK, null, 0, { ...C, kod: "YT-1" })));
  tamam(await a((db) => kalibrasyonEkle(db, depo, ELK, A, c.id, { tarih: gun(0), bitis: gun(365), lab: "Deneme Lab", sertifika: "KL-9", sonuc: "uygun" }, { ad: "kl-9.pdf", bayt: PDF })));
  const dosyaId = (await a((db) => cihazKarti(db, ELK, c.id)))!.kalibrasyonlar[0].dosyaId!;
  assert.ok((await a((db) => cihazListesi(db, PLAN)))!.cihazlar.some((x) => x.id === c.id));
  assert.deepEqual(await a((db) => cihazKaydet(db, PLAN, c.id, 0, { ...C, kod: "YT-1" })), { durum: "yetkisiz" });
  assert.deepEqual(await a((db) => cihazKonum(db, PLAN, c.id, 0, "lab")), { durum: "yetkisiz" });
  assert.deepEqual(await a((db) => kalibrasyonEkle(db, depo, PLAN, A, c.id, {})), { durum: "yetkisiz" });
  assert.ok(await a((db) => dosyaIndirilebilir(db, PLAN, dosyaId, DOSYA_ERISIMI)), "cihazı gören sertifikayı açar");
  assert.deepEqual((await a((db) => cihazListesi(db, DENETCI)))!.cihazlar, []);
  assert.equal(await a((db) => cihazKarti(db, DENETCI, c.id)), null);
  assert.equal(await a((db) => cihazListesi(db, MUH)), null);
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, dosyaId, DOSYA_ERISIMI)), null);
  assert.equal(await b((db) => dosyaIndirilebilir(db, ELK_B, dosyaId, DOSYA_ERISIMI)), null, "başka firma açamaz");
});

test("KİRACI: B, A'nın cihazını göremez, değiştiremez, kalibrasyon ekleyemez; veritabanı başka firmanın türüne / cihazına bağlamaz; silme yok", async () => {
  const c = tamam(await a((db) => cihazKaydet(db, ELK, null, 0, { ...C, kod: "GZ-1" })));
  const turA = (await a((db) => cihazKarti(db, ELK, c.id)))!.turId;
  assert.equal(await b((db) => cihazKarti(db, ELK_B, c.id)), null);
  assert.deepEqual(await b((db) => cihazKaydet(db, ELK_B, c.id, 0, { ...C, kod: "GZ-1" })), { durum: "yok" });
  assert.deepEqual(await b((db) => cihazKonum(db, ELK_B, c.id, 0, "lab")), { durum: "yok" });
  assert.deepEqual(await b((db) => kalibrasyonEkle(db, depo, ELK_B, B, c.id, { tarih: gun(0), bitis: gun(1), lab: "Deneme Lab", sertifika: "X", sonuc: "uygun" })), { durum: "yok" });
  await assert.rejects(b((db) => db.sorgu("INSERT INTO olcum_cihazi (kod, tur_id) VALUES ('SIZ-1', $1)", [turA])), /foreign key|yabancı anahtar/i);
  await assert.rejects(b((db) => db.sorgu("INSERT INTO kalibrasyon (cihaz_id, tarih, bitis, lab, sertifika, sonuc) VALUES ($1, now(), now(), 'Lab', 'X', 'uygun')", [c.id])), /foreign key|yabancı anahtar/i);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM olcum_cihazi WHERE id = $1", [c.id])), /permission denied|izin/i);
});
