/* NEREDEN GELDİ: maket onaylar.html #/diger (Görüntüle · Geri gönder · Onayla ve imzala), personel.html bordro "Onaya gönder", muhasebe.html BB5
   "Maaş bordrosu gönder" · pkproje §11 230, 264, 265 · KOD-GECIS §3 Onay ve imza (belge_onay) · reisim 2026-10-04: "rol değiştirme, sızma, veri
   çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (göç 0044; 333). Saf imza denetimi tests/imza-pdf.test.ts; olumsuz kanıt
   tests/bozan/belge-onay.bozan.ts. */
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
import { bordroAylari, bordroGonder, bordroGonderimi } from "../src/modules/muhasebe/server/bordro-gonder.ts";
import { bekleyenBelgeSayisi, belgeGeriGonder, belgeImzaliYukle, digerBelgeler, type Kisi } from "../src/modules/onaylar/server/belgeler.ts";
import { bordroKaldir, bordroOnayaGonder, bordroYukle, personelDosyasi } from "../src/modules/personel/server/dosyalar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
let YON: Kisi, DEN: Kisi, MUH: Kisi, DIGER: Kisi, YON_B: Kisi;
let denP: string, muhP: string, yonP: string, hesapsizP: string, bordroId: string;
const klasor = mkdtempSync(join(tmpdir(), "belge-onay-depo-"));
const depo = klasorDepo(klasor);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>, firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const sql = async (firma: string, metin: string, p: unknown[] = []) => (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(metin, p))).rows[0]?.id;
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null): Promise<Kisi> {
  const id = (await sql(firma, "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]))!;
  return { id, ad, roller: roller as Kisi["roller"] };
}
const b = (s: string) => new TextEncoder().encode(s);
/* uydurma, imzalanabilir PDF (klasik trailer) ve onun artımlı imzalı hâli; nesne akışlı PDF imzaya uygun değil */
const OZGUN = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> >> endobj\n4 0 obj << /Length 18 >> stream\nBT (Bordro) Tj ET\nendstream\nendobj\n"
  + "trailer << /Root 1 0 R >>\n%%EOF\n";
const IMZA = "9 0 obj << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n";
const PDF = { ad: "bordro.pdf", bayt: b(OZGUN) };
const NESNE_AKISLI = { ad: "bordro.pdf", bayt: b(OZGUN.replace("4 0 obj << /Length 18 >>", "4 0 obj << /Type /ObjStm /N 1 /First 4 /Length 18 >>")) };

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  const per = (ad: string) => sql(A, "INSERT INTO personel (ad, basla, meslek) VALUES ($1, '2024-01-01', 'mak-muh') RETURNING id::text", [ad]) as Promise<string>;
  denP = await per("Deneme Denetçi"); muhP = await per("Deneme Muhasebe"); yonP = await per("Deneme Yönetici"); hesapsizP = await per("Deneme Hesapsız");
  const digerP = await per("Deneme Öteki");
  YON = await hesap(A, "yon@deneme-a.example", ["firma_yoneticisi"], "Deneme Yönetici", yonP);
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"], "Deneme Denetçi", denP);
  MUH = await hesap(A, "muh@deneme-a.example", ["muhasebe"], "Deneme Muhasebe", muhP);
  DIGER = await hesap(A, "diger@deneme-a.example", ["denetci"], "Deneme Öteki", digerP);
  const pB = (await sql(B, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme B Kişi', '2024-01-01', 'mak-muh') RETURNING id::text"))!;
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"], "Deneme Yönetici B", pB);
  bordroId = tamam(await a(YON, (db) => bordroYukle(db, depo, YON, A, denP, { ay: "2026-07", brut: "50.000", net: "38.000", maliyet: "60.000" }, PDF))).id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("Personel › bordro Onaya gönder: yalnız 'yaz' (firma yöneticisi); kişinin Diğer belgeler'ine düşer, kartta durum; aynı dönem ikinci kez gönderilmez", async () => {
  for (const k of [DEN, MUH]) assert.equal((await a(k, (db) => bordroOnayaGonder(db, depo, k, A, bordroId))).durum, "yetkisiz", k.roller[0]);
  tamam(await a(YON, (db) => bordroOnayaGonder(db, depo, YON, A, bordroId)));
  const r = await a(YON, (db) => bordroOnayaGonder(db, depo, YON, A, bordroId));
  assert.deepEqual(r, { durum: "red", neden: "Bu dönemin bordrosu zaten imzaya gönderildi." });
  const v = await a(DEN, (db) => digerBelgeler(db, DEN));
  assert.deepEqual([v.personel, v.bekleyen, v.belgeler.map((x) => [x.tur, x.ad, x.gonderen, x.durum])], [true, 1, [["bordro", "Temmuz 2026 maaş bordrosu", "Deneme Yönetici", "bekliyor"]]]);
  assert.equal(await a(DEN, (db) => bekleyenBelgeSayisi(db, DEN)), 1);
  const kart = (await a(YON, (db) => personelDosyasi(db, YON, denP)))!;
  assert.deepEqual(kart.bordrolar!.map((x) => [x.ay, x.onay?.durum]), [["2026-07", "bekliyor"]]);
  /* belge kendi dosyasını taşır (bordronun dosyası değil) */
  const d = v.belgeler[0].dosya;
  assert.equal((await a(DEN, (db) => db.sorgu<{ modul: string }>("SELECT modul FROM dosya WHERE id = $1", [d]))).rows[0].modul, "belge_onay");
});

test("sızıntı: belgeyi yalnız imzalayacak kişi görür ve karar verir; öteki kişi ve B firması göremez; dosyası imzacıya, gönderene, Personel 'yaz'a, bordroda Muhasebe'ye açılır", async () => {
  const x = (await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler[0];
  assert.deepEqual((await a(DIGER, (db) => digerBelgeler(db, DIGER))).belgeler, []);
  assert.deepEqual((await a(YON_B, (db) => digerBelgeler(db, YON_B), B)).belgeler, []);
  assert.equal((await a(YON, (db) => belgeGeriGonder(db, YON, x.id, x.surum))).durum, "yok", "gönderen bile karar veremez");
  assert.equal((await a(DIGER, (db) => belgeGeriGonder(db, DIGER, x.id, x.surum))).durum, "yok");
  assert.equal((await a(YON_B, (db) => belgeGeriGonder(db, YON_B, x.id, x.surum), B)).durum, "yok");
  const ac = (k: Kisi, firma = A) => a(k, (db) => dosyaIndirilebilir(db, k, x.dosya, DOSYA_ERISIMI), firma);
  assert.ok(await ac(DEN)); assert.ok(await ac(YON)); assert.ok(await ac(MUH));
  assert.equal(await ac(DIGER), null);
  assert.equal(await ac(YON_B, B), null);
});

test("Onayla ve imzala: imzalı PDF gönderilen PDF'in imzalanmış hâli olmalı; imzalanan belge değişmez, geri gönderilemez", async () => {
  const x = (await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler[0];
  const yanlis = await a(DEN, (db) => belgeImzaliYukle(db, depo, DEN, A, x.id, x.surum, { ad: "imzali.pdf", bayt: b(OZGUN.replace("Bordro", "Bordrx") + IMZA) }));
  assert.equal(yanlis.durum, "gecersiz");
  const imzasiz = await a(DEN, (db) => belgeImzaliYukle(db, depo, DEN, A, x.id, x.surum, { ad: "imzali.pdf", bayt: b(OZGUN) }));
  assert.equal(imzasiz.durum, "gecersiz", "imza eklenmemiş");
  assert.equal((await a(DEN, (db) => belgeImzaliYukle(db, depo, DEN, A, x.id, x.surum + 1, { ad: "imzali.pdf", bayt: b(OZGUN + IMZA) }))).durum, "cakisma");
  tamam(await a(DEN, (db) => belgeImzaliYukle(db, depo, DEN, A, x.id, x.surum, { ad: "imzali.pdf", bayt: b(OZGUN + IMZA) })));
  const y = (await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler[0];
  assert.deepEqual([y.durum, !!y.karar, !!y.imzaliDosya, (await a(DEN, (db) => bekleyenBelgeSayisi(db, DEN)))], ["imzali", true, true, 0]);
  assert.deepEqual(await a(DEN, (db) => belgeGeriGonder(db, DEN, y.id, y.surum)), { durum: "red", neden: "Belge zaten imzalandı." });
  assert.ok(await a(YON, (db) => dosyaIndirilebilir(db, YON, y.imzaliDosya!, DOSYA_ERISIMI)), "gönderen imzalı PDF'i görür");
  assert.equal((await a(YON, (db) => personelDosyasi(db, YON, denP)))!.bordrolar![0].onay?.durum, "imzali");
});

test("Muhasebe › Maaş bordrosu gönder: yalnız Muhasebe 'yaz'; dosyası olan seçililere gider, Personel kartına yazılır; uygunsuz PDF hiçbirini yazdırmaz; geri gönderilen yeniden gönderilir", async () => {
  const [, gecen, onceki] = bordroAylari();
  assert.equal(await a(DEN, (db) => bordroGonderimi(db, DEN, gecen)), null);
  assert.equal((await a(DEN, (db) => bordroGonder(db, depo, DEN, A, gecen, [denP], new Map([[denP, PDF]])))).durum, "yetkisiz");
  const v = (await a(MUH, (db) => bordroGonderimi(db, MUH, null)))!;
  assert.equal(v.ay, gecen, "varsayılan geçen ay");
  assert.deepEqual(v.kisiler.map((k) => k.ad), ["Deneme Denetçi", "Deneme Hesapsız", "Deneme Muhasebe", "Deneme Öteki", "Deneme Yönetici"]);
  /* biri uygunsuzsa hiçbiri yazılmaz */
  const kotu = await a(MUH, (db) => bordroGonder(db, depo, MUH, A, gecen, [denP, muhP], new Map([[denP, PDF], [muhP, NESNE_AKISLI]])));
  assert.equal(kotu.durum === "gecersiz" && Object.keys(kotu.hatalar).join(), muhP);
  assert.equal((await a(DEN, (db) => digerBelgeler(db, DEN))).bekleyen, 0);
  /* dönem dışı ve başka firmanın kişisi: yok sayılır */
  assert.equal((await a(MUH, (db) => bordroGonder(db, depo, MUH, A, "2020-01", [denP], new Map([[denP, PDF]])))).durum, "gecersiz");
  const r = tamam(await a(MUH, (db) => bordroGonder(db, depo, MUH, A, gecen, [denP, muhP, hesapsizP, yonP], new Map([[denP, PDF], [muhP, PDF], [hesapsizP, PDF]]))));
  assert.match(r.bildirim, /^3 kişinin .+ bordrosu imzaya gönderildi; 1 kişinin bordrosu olmadığı için gönderilmedi\./);
  const w = (await a(MUH, (db) => bordroGonderimi(db, MUH, gecen)))!;
  assert.deepEqual(w.kisiler.map((k) => [k.ad, k.belge]), [["Deneme Denetçi", "bekliyor"], ["Deneme Hesapsız", "bekliyor"], ["Deneme Muhasebe", "bekliyor"],
    ["Deneme Öteki", null], ["Deneme Yönetici", null]]);
  /* denetçinin dönem bordrosu son bordronun tutarlarıyla Personel kartına yazıldı; muhasebecinin önceki bordrosu yok — kart değişmez */
  const kart = (await a(YON, (db) => personelDosyasi(db, YON, denP)))!.bordrolar!;
  assert.deepEqual(kart.map((x) => [x.ay, x.brut, x.onay?.durum]).find((x) => x[0] === gecen), [gecen, 5_000_000, "bekliyor"]);
  assert.deepEqual((await a(YON, (db) => personelDosyasi(db, YON, muhP)))!.bordrolar, []);
  /* muhasebeci kendi bordrosunu Onaylar'ı görmeden imzalar (Diğer belgeler kişisel) */
  const m = (await a(MUH, (db) => digerBelgeler(db, MUH))).belgeler[0];
  assert.equal(m.gonderen, "Deneme Muhasebe");
  /* ikinci kez aynı dönem: atlanır; geri gönderilen yeniden gönderilir */
  assert.deepEqual(await a(MUH, (db) => bordroGonder(db, depo, MUH, A, gecen, [denP, muhP], new Map([[denP, PDF]]))),
    { durum: "gecersiz", hatalar: {}, genel: "Gönderilecek bordro yok: seçili kişilere bordro dosyası yükleyin." });
  tamam(await a(MUH, (db) => belgeGeriGonder(db, MUH, m.id, m.surum)));
  tamam(await a(MUH, (db) => bordroGonder(db, depo, MUH, A, gecen, [muhP], new Map([[muhP, PDF]]))));
  assert.deepEqual((await a(MUH, (db) => digerBelgeler(db, MUH))).belgeler.map((x) => x.durum), ["bekliyor", "geri"]);
  /* önceki ay da gönderilebilir */
  tamam(await a(MUH, (db) => bordroGonder(db, depo, MUH, A, onceki, [denP], new Map([[denP, PDF]]))));
});

test("333 incelemesi: durum bordro KAYDINA bağlı — aynı dönem yeniden yüklenince bekleyen imza iptal, imzalı kalır, yenisi gönderilir; kaldırılan bordronun bekleyeni iptal", async () => {
  const yukle = async () => tamam(await a(YON, (db) => bordroYukle(db, depo, YON, A, denP, { ay: "2026-06", brut: "50.000", net: "38.000", maliyet: "60.000" }, PDF)));
  const satir = async () => (await a(YON, (db) => personelDosyasi(db, YON, denP)))!.bordrolar!.find((x) => x.ay === "2026-06")!;
  const ilk = await yukle();
  tamam(await a(YON, (db) => bordroOnayaGonder(db, depo, YON, A, ilk.id)));
  assert.equal((await satir()).onay?.durum, "bekliyor");
  /* bekleyen varken yeni bordro: eski belge iptal, kişi eski PDF'i imzalayamaz; yeni satır "Gönderilmedi" */
  const ikinci = await yukle();
  assert.match(ikinci.bildirim ?? "", /bekleyen onayı iptal edildi/);
  const eski = (await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler.find((x) => x.ad === "Haziran 2026 maaş bordrosu")!;
  assert.equal(eski.durum, "iptal");
  assert.equal((await a(DEN, (db) => belgeImzaliYukle(db, depo, DEN, A, eski.id, eski.surum, { ad: "i.pdf", bayt: b(OZGUN + IMZA) }))).durum, "red");
  assert.equal((await satir()).onay, null);
  /* yenisi gönderilir ve imzalanır; sonra üçüncü yükleme imzalıyı bozmaz, üçüncü yeniden gönderilir */
  tamam(await a(YON, (db) => bordroOnayaGonder(db, depo, YON, A, ikinci.id)));
  const yeni = (await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler.find((x) => x.ad === "Haziran 2026 maaş bordrosu" && x.durum === "bekliyor")!;
  tamam(await a(DEN, (db) => belgeImzaliYukle(db, depo, DEN, A, yeni.id, yeni.surum, { ad: "i.pdf", bayt: b(OZGUN + IMZA) })));
  const ucuncu = await yukle();
  assert.equal(ucuncu.bildirim, undefined, "imzalı belge iptal edilmez");
  assert.equal((await satir()).onay, null);
  tamam(await a(YON, (db) => bordroOnayaGonder(db, depo, YON, A, ucuncu.id)));
  assert.deepEqual((await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler.filter((x) => x.ad === "Haziran 2026 maaş bordrosu").map((x) => x.durum).sort(),
    ["bekliyor", "imzali", "iptal"]);
  /* kaldırılan bordronun bekleyen imzası iptal */
  const s = await satir();
  const k = await a(YON, (db) => bordroKaldir(db, YON, s.id, s.surum));
  assert.match(tamam(k).bildirim ?? "", /iptal edildi/);
  assert.equal((await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler.filter((x) => x.ad === "Haziran 2026 maaş bordrosu" && x.durum === "bekliyor").length, 0);
});

test("veritabanı: belge silinmez; içerik değişmez; kararı yalnız imzacı verir; dosyasız belge kalmaz; imzalı durum belgeye yüklenmiş imzalı PDF ister", async () => {
  const x = (await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler.find((y) => y.durum === "bekliyor")!;
  await assert.rejects(a(DEN, (db) => db.sorgu("DELETE FROM belge_onay WHERE id = $1", [x.id])), /permission denied|silinmez/);
  await assert.rejects(a(YON, (db) => db.sorgu("UPDATE belge_onay SET ad = 'Deneme değişik' WHERE id = $1", [x.id])), /gönderilen belge değişmez/);
  await assert.rejects(a(YON, (db) => db.sorgu("UPDATE belge_onay SET durum = 'geri' WHERE id = $1", [x.id])), /yalnız imzalayacak kişi/);
  await assert.rejects(a(DEN, (db) => db.sorgu("UPDATE belge_onay SET durum = 'imzali', imzali_dosya = dosya WHERE id = $1", [x.id])), /imzalı PDF bu belgeye/);
  /* gönderen hiçbir zaman imzacı değil (DEN): değer gerçekten değişir */
  await assert.rejects(a(DEN, (db) => db.sorgu("UPDATE belge_onay SET gonderen = $2 WHERE id = $1", [x.id, DEN.id])), /gönderilen belge değişmez/);
  await assert.rejects(a(YON, (db) => db.sorgu("INSERT INTO belge_onay (tur, ad, personel_id) VALUES ('egitim', 'Deneme formu', $1)", [denP])), /dosyasız/);
  await assert.rejects(a(YON, (db) => db.sorgu("INSERT INTO belge_onay (tur, ad, personel_id, durum) VALUES ('egitim', 'Deneme formu', $1, 'imzali')", [denP])), /imza bekler/);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO belge_onay (tur, ad, personel_id) VALUES ('egitim', 'Deneme formu', $1)", [denP])), /oturumdaki kişi/);
  /* iptal: yalnız oturumdaki kişi ve yalnız bekleyen belge (333 incelemesi — kaynağı değişen bekleyen belge) */
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE belge_onay SET durum = 'iptal' WHERE id = $1", [x.id])), /oturumdaki kişi/);
  const imzali = (await a(DEN, (db) => digerBelgeler(db, DEN))).belgeler.find((y) => y.durum === "imzali")!;
  await assert.rejects(a(YON, (db) => db.sorgu("UPDATE belge_onay SET durum = 'iptal' WHERE id = $1", [imzali.id])), /karar verilmiş/);
  /* B firması A'nın belgesine dokunamaz (RLS: görünmez) */
  const g = await a(YON_B, (db) => db.sorgu("UPDATE belge_onay SET ad = 'Deneme' WHERE id = $1", [x.id]), B);
  assert.equal(g.rowCount, 0);
});
