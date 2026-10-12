/* NEREDEN GELDİ: 525 — S.A.Y Chat "Bekleyenler için rapor yaz" (pkproje §3.10 m.7, m.12, m.19, m.21–22; maket 521 ekran 10 — reisim 2026-10-13
   "onayılıyorum, yap bitir"). GERÇEK PostgreSQL, iki firma (göç 0086 rapor_oneri):
   · kayıt rapor taslağı olur: mesajın değerleri raporun alanlarına (biçime uymayan yazılmaz, adı söylenir), "-" boş kalır, not + fazla satır uzman
     yorumuna; ekipman fotoğrafı raporun genel fotoğraf bölümüne, okunacak fotoğraf o bölüme OKUMA fotoğrafı olarak; etiket fotoğrafı rapora KONMAZ;
     kayıt silinir, fotoğrafları çöpe; raporda "S.A.Y Chat kaydından oluşturuldu" bilgisi;
   · "Yeni ekle": kod bu anda istenir (boş / biçimsiz / kullanılmış red), ekipman plana eklenir, kullanım yeri mesajdan;
   · ekipman fotoğrafsız kayıt rapora dönüşmez; tamamlanmış planda rapor yok (519) — koşullarda söylenir;
   · bekleyen öneri kişiye özel (yazan görür, başkası görmez), raporun verisinde görünür, kapatılınca kalkar. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { raporOneriSil, raporOneriYaz, raporOnerileri } from "../src/modules/raporlar/server/oneri.ts";
import { sahaRaporu } from "../src/modules/raporlar/server/raporlar.ts";
import { chatFoto, chatKaydet, sayChatPaneli } from "../src/modules/say-chat/server/kayitlar.ts";
import { chatRaporYaz, raporKosullari } from "../src/modules/say-chat/server/rapor-yaz.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, A = "";
const klasor = mkdtempSync(join(tmpdir(), "say-chat-rapor-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, rol: string): Kisi => ({ id, ad: "Deneme Kişi", roller: [rol] as Kisi["roller"] });
let PLN: Kisi, ELK: Kisi, YON: Kisi, PLAN = "", EIT = "", E1 = "";
const ile = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]).toString("base64");

before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { [A] = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('scr-a', 'Deneme A', 'RA') RETURNING id::text")).rows.map((r) => r.id); }
  finally { await s.end(); }
  const f = await kiraciIcinde(havuz, A, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Deneme Sanayi A.Ş.', 'Deneme', 'iletisim@scr-a.example', '0312 000 00 00') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Deneme Tesis', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "4".repeat(26)]);
    const pe = await q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Elektrik Denetçi', '2024-01-01', 'elk-muh', '21') RETURNING id::text");
    const h = async (eposta: string, rol: string, per: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme Kişi', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@scr-a.example`, [rol], per]), rol);
    return { tesis, pe, pln: await h("pln", "planlama"), elk: await h("elk", "denetci", pe), yon: await h("yon", "firma_yoneticisi") };
  });
  PLN = f.pln; ELK = f.elk; YON = f.yon;
  const t = await ile(YON, async (db) => {
    const id = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EIT', 'Elektrik iç tesisatı', 'elektrik', 'e', 12) RETURNING id::text")).rows[0].id;
    const x = tamam(await taslakBaslat(db, YON, id, "sablon:ZPKR02", null));
    tamam(await yayinla(db, YON, x.id, x.surum, ""));
    const e1 = (await db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen, konum) VALUES ($1, $2, 'EP-11', 'x', 'Eski yer') RETURNING id::text", [f.tesis, id])).rows[0].id;
    return { id, e1 };
  });
  EIT = t.id; E1 = t.e1;
  const g = bugunTr();
  PLAN = tamam(await ile(PLN, (db) => planAc(db, depo, PLN, A, { tesis: f.tesis, baslangic: g, bitis: g, ekip: [{ personel: f.pe, isgNo: "ISG-1", kaydet: false }] }))).id;
  const v = (await ile(ELK, (db) => planIci(db, ELK, PLAN)))!;
  tamam(await ile(ELK, (db) => planKabul(db, ELK, PLAN, v.surum, true)));
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

async function kayitKur(ekipman: unknown, mesaj: string[], fotolar: ("ekipman" | "etiket" | "linye")[]) {
  const tanim = (await ile(ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.turler[EIT].tanim, id = randomUUID();
  for (const r of fotolar) {
    tamam(await ile(ELK, (db) => chatFoto(db, depo, ELK, A, id, { plan: PLAN, rol: r === "linye" ? "okunacak" : r, k: r === "linye" ? "linye" : null, ad: `${r}.jpg`, veri: JPEG })));
  }
  tamam(await ile(ELK, (db) => chatKaydet(db, ELK, id, fotolar.length, { plan: PLAN, ekipman, mesaj, tanim, tanimSurum: 0, kaldir: [] })));
  return id;
}

test("plandaki ekipman: değerler alanlara (biçimsiz yazılmaz), not + fazla satır yoruma, fotoğraflar rapora (etiket hariç), kayıt silinir, bilgi şeridi", async () => {
  /* ZPKR02 hazır satırları: Marka, Model, Seri no, İmal yılı, Kullanım yeri, Not */
  const k = await kayitKur({ tip: "plan", id: E1 }, ["Örnek Marka", "-", "SN-9", "19x9", "Bakım binası", "pano kapağı kilitsiz", "iç kapak yok"], ["ekipman", "etiket", "linye"]);
  const kayitDosyalari = (await ile(ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.kayitlar.find((x) => x.id === k)!.fotolar.map((f) => f.dosya);
  const r = await ile(ELK, (db) => chatRaporYaz(db, depo, ELK, A, PLAN, { kayit: k, kod: null }));
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  if (r.durum !== "tamam") return;
  assert.deepEqual(r.okumalar, [], "firmada yapay zekâ kapalı: okuma eylemi yok");
  const v = (await ile(ELK, (db) => sahaRaporu(db, ELK, r.rapor.id)))!;
  assert.deepEqual([v.ekipmanBilgi.marka, v.ekipmanBilgi.model, v.ekipmanBilgi.seri, v.ekipmanBilgi.imal, v.ekipmanBilgi.konum], ["Örnek Marka", null, "SN-9", null, "Bakım binası"]);
  assert.equal(v.cevaplar.yorum, "pano kapağı kilitsiz\niç kapak yok");
  assert.deepEqual(v.fotolar.map((f) => [f.bolum, !!f.okuma]), [["foto", false], ["linye", true]], "ekipman fotoğrafı genel bölüme, okunacak okuma fotoğrafı; etiket yok");
  const bilgi = v.oneriler.find((o) => o.tur === "bilgi");
  assert.match(String((bilgi?.okunan as { metin?: string })?.metin), /Mesajdan 4 bilgi geldi, 1 ekipman fotoğrafı rapora geçti\. Biçime uymadığı için yazılmayan: İmal yılı\. Okunacak fotoğraflar \(.*\) okuma fotoğrafı olarak saklandı/);
  /* kayıt silindi, kaydın fotoğrafları çöpte (kopyaları raporda) */
  assert.ok(!(await ile(ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.kayitlar.some((x) => x.id === k));
  for (const d of kayitDosyalari) assert.equal(await ile(ELK, (db) => dosyaIndirilebilir(db, ELK, d, DOSYA_ERISIMI)), null);
  /* aynı kayıt ikinci kez yazılamaz */
  assert.equal((await ile(ELK, (db) => chatRaporYaz(db, depo, ELK, A, PLAN, { kayit: k, kod: null }))).durum, "hata");
});

test("yeni ekipman: kod şart, biçim ve eşsizlik; plana eklenir; fotoğrafsız kayıt rapora dönüşmez", async () => {
  const k = await kayitKur({ tip: "yeni", tur: EIT }, ["Yeni Marka", "", "", "", "Kazan dairesi"], ["ekipman"]);
  const bos = await ile(ELK, (db) => chatRaporYaz(db, depo, ELK, A, PLAN, { kayit: k, kod: null }));
  assert.ok(bos.durum === "hata" && bos.alan === "kod");
  const kullanilmis = await ile(ELK, (db) => chatRaporYaz(db, depo, ELK, A, PLAN, { kayit: k, kod: "EP-11" }));
  assert.ok(kullanilmis.durum === "hata" && kullanilmis.alan === "kod", JSON.stringify(kullanilmis));
  const r = await ile(ELK, (db) => chatRaporYaz(db, depo, ELK, A, PLAN, { kayit: k, kod: "ep-77" }));
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  const p = (await ile(ELK, (db) => planIci(db, ELK, PLAN)))!;
  const e = p.ekipman.find((x) => x.kod === "EP-77");
  assert.ok(e && e.sonradan && e.konum === "Kazan dairesi", "plana yeni ekipman, kullanım yeri mesajdan");
  const fotosuz = await kayitKur({ tip: "yeni", tur: EIT }, ["X"], []);
  const h = await ile(ELK, (db) => chatRaporYaz(db, depo, ELK, A, PLAN, { kayit: fotosuz, kod: "EP-78" }));
  assert.ok(h.durum === "hata" && /ekipman fotoğrafı yok/.test(h.neden));
});

test("bekleyen öneri kişiye özel, raporun verisinde, kapatılınca kalkar; tamamlanmış planda rapor yok", async () => {
  const k = await kayitKur({ tip: "yeni", tur: EIT }, ["Öneri Marka"], ["ekipman"]);
  const r = tamam(await ile(ELK, (db) => chatRaporYaz(db, depo, ELK, A, PLAN, { kayit: k, kod: "EP-90" })));
  await ile(ELK, (db) => raporOneriYaz(db, ELK, r.rapor.id, "linye", "tablo", [{ degerler: { no: "F1" }, guven: "yuksek" }]));
  await ile(ELK, (db) => raporOneriYaz(db, ELK, r.rapor.id, "linye", "tablo", [{ degerler: { no: "F2" }, guven: "orta" }]));
  const l = await ile(ELK, (db) => raporOnerileri(db, r.rapor.id));
  assert.deepEqual(l.find((o) => o.bolum === "linye")?.okunan, [{ degerler: { no: "F1" }, guven: "yuksek" }, { degerler: { no: "F2" }, guven: "orta" }], "bölüm başına birleşir");
  assert.deepEqual(await ile(YON, (db) => raporOnerileri(db, r.rapor.id)), [], "başkası görmez");
  assert.equal(await ile(YON, (db) => raporOneriSil(db, YON, r.rapor.id, "linye")), 0, "başkası silemez");
  assert.equal(await ile(ELK, (db) => raporOneriSil(db, ELK, r.rapor.id, "linye")), 2);
  assert.ok(!(await ile(ELK, (db) => raporOnerileri(db, r.rapor.id))).some((o) => o.bolum === "linye"));
  /* öneri değişmez: uygulama rolünün UPDATE hakkı yok (tetik de durdurur) */
  await assert.rejects(ile(ELK, (db) => db.sorgu("UPDATE rapor_oneri SET bolum = 'x'")), /permission denied|değişmez/);
  /* tamamlanmış plan: koşulda engel, rapor açılmaz (tetikler kapalı — yalnız test kurulumu) */
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("SET session_replication_role = replica"); await s.query("UPDATE plan SET durum = 'tamamlandi', kontrol_tamam = now(), bitti = now() WHERE id = $1", [PLAN]); }
  finally { await s.end(); }
  const kos = await ile(ELK, (db) => raporKosullari(db, { durum: "tamamlandi", baslangic: bugunTr(), personelId: null }));
  assert.match(kos.engel ?? "", /tamamlan/i);
  assert.equal((await ile(ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.rapor.engel, kos.engel);
  const k2 = randomUUID();
  tamam(await ile(ELK, (db) => chatFoto(db, depo, ELK, A, k2, { plan: PLAN, rol: "ekipman", k: null, ad: "e.jpg", veri: JPEG })));
  const tanim = (await ile(ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.turler[EIT].tanim;
  tamam(await ile(ELK, (db) => chatKaydet(db, ELK, k2, 1, { plan: PLAN, ekipman: { tip: "yeni", tur: EIT }, mesaj: [], tanim, tanimSurum: 0, kaldir: [] })));
  const h = await ile(ELK, (db) => chatRaporYaz(db, depo, ELK, A, PLAN, { kayit: k2, kod: "EP-91" }));
  assert.equal(h.durum, "hata", "tamamlanmış planda rapor açılmaz; kayıt bekler");
  assert.ok((await ile(ELK, (db) => sayChatPaneli(db, ELK, PLAN)))!.kayitlar.some((x) => x.id === k2));
});
