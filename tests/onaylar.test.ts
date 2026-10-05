/* NEREDEN GELDİ: maket onaylar.html M9 (kuyruk branşın onaydaki raporları, en yeni üstte; onay ekranı gözden geçirme; Onayla → sıradaki rapor;
   Geri gönder gerekçe ≥ 10, denetçi raporun üstünde görür; Onayı geri al 102; Tüm raporlar ve Durumu değiştir 190, Onaylandı'ya almak onay 191;
   N7 vekil yok) · KOD-GECIS §4 (rapor_onayla / rapor_geri_gonder / rapor_durum_degistir; Onaylar düzeyi: branş yöneticisi branşı, firma
   yöneticisi görür, denetçi / planlama / muhasebe yok) · pkproje §1 (reisim: "hazırlayanın kendi raporunu onaylaması da engellenmez" — C1) ·
   reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (314; göç 0026).
   Olumsuz kanıt: tests/bozan/onaylar.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { MATRIS_ONERI } from "../src/server/yetki/tanim.ts";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { raporKaydet, raporOlustur, sahaRaporu } from "../src/modules/raporlar/server/raporlar.ts";
import { durumDegistir, geriGonder, onayEkrani, onayGeriAl, onayla, onayListeleri, type OnayYazma } from "../src/modules/onaylar/server/onaylar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "onaylar-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

interface Firma { den: Kisi; mekDen: Kisi; mek: Kisi; elk: Kisi; yon: Kisi; plan: Kisi; muh: Kisi; denP: string; mekP: string; tesis: string; ekp: Record<string, string> }
let FA: Firma, FB: Firma;

async function firmaKur(firma: string, ek: string): Promise<Firma> {
  const f = await kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Sanayi A.Ş.', 'Deneme') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m]);
    const per = (ad: string) => q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ($1, '2024-01-01', 'mak-muh', '123') RETURNING id::text", [ad]);
    const k = async (e: string, roller: string[], personel: string | null = null) => ({ ...kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text",
      [`${e}@${ek}.example`, `Deneme ${e}`, roller, personel]), ...roller), ad: `Deneme ${e}` });
    const denP = await per("Deneme Bir"), mekP = await per("Deneme Mekanik");
    const den = await k("den", ["denetci"], denP), mekDen = await k("mekden", ["mekanik_yonetici", "denetci"], mekP);
    const mek = await k("mek", ["mekanik_yonetici"]), elk = await k("elk", ["elektrik_yonetici"]), yon = await k("yon", ["firma_yoneticisi"]);
    const plan = await k("plan", ["planlama"]), muh = await k("muh", ["muhasebe"]);
    const ht = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
    const ep = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text");
    for (const [t, kod] of [[ht, "HT-1"], [ht, "HT-2"], [ht, "HT-3"], [ht, "HT-4"], [ep, "EP-1"]]) {
      await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [tesis, t, kod]);
    }
    const ekp = Object.fromEntries((await db.sorgu<{ kod: string; id: string }>("SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
    return { den, mekDen, mek, elk, yon, plan, muh, denP, mekP, tesis, ekp, ht, ep };
  });
  /* iki türe de yayında format (yayınlayan hesap veritabanında damgalanır → yöneticinin bağlamıyla) */
  await kiraciIcinde(havuz, firma, async (db) => {
    for (const tur of [f.ht, f.ep]) {
      const t = tamam(await taslakBaslat(db, f.yon, tur, "sablon:KOMPRESOR", null));
      tamam(await yayinla(db, f.yon, t.id, t.surum, ""));
    }
  }, { hesapId: f.yon.id });
  return f;
}

const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const b = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p), hesapId ? { hesapId } : {});
const satir = async (id: string) => (await sql<{ durum: string; surum: number; gonderildi: Date | null; ilk_gonderim: Date | null; onay: Date | null; onay_hesap: string | null }>(A,
  "SELECT durum, surum, gonderildi, ilk_gonderim, onay, onay_hesap::text FROM rapor WHERE id = $1", [id])).rows[0];
const hareketler = async (id: string) => (await sql<{ ne: string; gerekce: string | null; h: string | null }>(A,
  "SELECT ne, gerekce, hesap_id::text AS h FROM rapor_hareket WHERE rapor_id = $1 ORDER BY zaman, ne", [id])).rows.map((x) => [x.ne, x.gerekce, x.h]);

/** planlamacı plan açar (ekipte den ve mekDen), den kabul eder; verilen ekipmanlara rapor açılır ve yazanı onaya gönderir (taslak → onayda,
    tetiğin açtığı geçiş — gönderim kuralları 311'in testinde) */
let planSira = 0;
async function raporlar(liste: [Kisi, string][]): Promise<string[]> {
  const bas = bugunTr();
  const id = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis, baslangic: bas, bitis: bas,
    ekip: [FA.denP, FA.mekP].map((p, i) => ({ personel: p, isgNo: `ISG-${planSira++}-${i}`, kaydet: false })) }))).id;
  tamam(await a(FA.den, async (db) => planKabul(db, FA.den, id, (await planIci(db, FA.den, id))!.surum, true)));
  const l: string[] = [];
  for (const [k, kod] of liste) {
    const r = tamam(await a(k, (db) => raporOlustur(db, k, id, FA.ekp[kod])));
    await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [r.id], k.id);   // güvenli yazıcı gibi sürüm artar
    l.push(r.id);
  }
  return l;
}
const surum = async (id: string) => (await satir(id)).surum;

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "deneme-a");
  FB = await firmaKur(B, "deneme-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("kuyruk: branş yöneticisi yalnız kendi branşının onaydaki raporlarını görür, en yeni üstte; firma yöneticisi hepsini görür ama onaylamaz; denetçi, planlama, muhasebe ve başka firma görmez", async () => {
  const [h1, h2, e1] = await raporlar([[FA.den, "HT-1"], [FA.den, "HT-2"], [FA.den, "EP-1"]]);
  const mek = (await a(FA.mek, (db) => onayListeleri(db, FA.mek)))!;
  const benim = mek.kuyruk.filter((r) => [h1, h2, e1].includes(r.id));
  assert.deepEqual(benim.map((r) => r.id), [h2, h1], "mekanik: yalnız mekanik, en yeni üstte");
  assert.deepEqual([benim[0].ekipmanKod, benim[0].turAd, benim[0].denetci, benim[0].durum, benim[0].bekleme], ["HT-2", "Hava tankı", "Deneme Bir", "onayda", "az önce"]);
  assert.deepEqual(benim[0].izin, { onayla: true, geriGonder: true, onayGeriAl: false, durumDegistir: true });
  assert.equal("hesapId" in benim[0], false, "yazan hesabın kimliği ekrana gitmez");
  assert.deepEqual(mek.branslar, ["m"]);
  const elk = (await a(FA.elk, (db) => onayListeleri(db, FA.elk)))!;
  assert.deepEqual(elk.kuyruk.filter((r) => [h1, h2, e1].includes(r.id)).map((r) => r.id), [e1], "elektrik: yalnız elektrik");
  const yon = (await a(FA.yon, (db) => onayListeleri(db, FA.yon)))!;
  const yonun = yon.kuyruk.filter((r) => [h1, h2, e1].includes(r.id));
  assert.equal(yonun.length, 3, "firma yöneticisi görür");
  assert.ok(yonun.every((r) => !r.izin.onayla && !r.izin.geriGonder && !r.izin.durumDegistir), "firma yöneticisi onaylamaz (branş yöneticisi değil)");
  for (const k of [FA.den, FA.plan, FA.muh]) assert.equal(await a(k, (db) => onayListeleri(db, k)), null, `${k.roller[0]} Onaylar'ı görmez`);
  assert.equal(await a(FA.den, (db) => onayEkrani(db, FA.den, h1)), null);
  assert.equal(await a(FA.elk, (db) => onayEkrani(db, FA.elk, h1)), null, "öteki branşın raporu");
  assert.deepEqual((await b(FB.mek, (db) => onayListeleri(db, FB.mek)))!.kuyruk.filter((r) => [h1, h2, e1].includes(r.id)), [], "başka firma");
  assert.equal(await b(FB.mek, (db) => onayEkrani(db, FB.mek, h1)), null);
  /* onay ekranı: gözden geçirme + sıra */
  const v = (await a(FA.mek, (db) => onayEkrani(db, FA.mek, h1)))!;
  assert.equal(v.r.no.startsWith("DA-"), true);
  assert.ok(v.sira! >= 1 && v.kuyrukBoyu >= 2);
  assert.ok(v.ozet.some((x) => x.metin.startsWith("İSG-KATİP ISG-") && x.tamam), "İSG-KATİP kaydı");
  assert.ok(v.ozet.some((x) => x.metin === "0 fotoğraf"));
  assert.ok(v.ozet.some((x) => x.metin === "Sonuç: seçilmedi"));
});

test("onayla: yalnız türün branş yöneticisi; kendi raporunu da onaylar (C1); onay damgası ve hareket veritabanından; sıradaki rapor; onayda olmayan ve eski sürüm reddedilir", async () => {
  const [h1, h2, e1, kendi] = await raporlar([[FA.den, "HT-1"], [FA.den, "HT-2"], [FA.den, "EP-1"], [FA.mekDen, "HT-3"]]);
  /* yetki sunucuda */
  assert.equal((await a(FA.elk, (db) => onayla(db, FA.elk, h1, 1))).durum, "yok", "öteki branş raporu göremez");
  assert.equal((await a(FA.yon, (db) => onayla(db, FA.yon, h1, 1))).durum, "yetkisiz", "firma yöneticisi görür, onaylamaz");
  assert.equal((await a(FA.den, (db) => onayla(db, FA.den, h1, 1))).durum, "yok");
  assert.equal((await b(FB.mek, (db) => onayla(db, FB.mek, h1, 1))).durum, "yok", "başka firma");
  assert.equal((await a(FA.mek, (db) => onayla(db, FA.mek, h1, 0))).durum, "cakisma", "eski sürüm");
  assert.deepEqual((await satir(h1)).durum, "onayda", "hiçbir şey yazılmadı");
  /* onay: sıradaki rapor (kuyrukta bundan sonraki) */
  const s2 = await surum(h2);
  const r = tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h2, s2)));
  assert.match(r.bildirim, /^DA-\S+ onaylandı; muayene uzmanı imzasında, Deneme Bir imzalayınca tamamlanır\. Sıradaki rapor açıldı\.$/);
  assert.ok(r.sonraki && r.sonraki !== h2 && r.sonraki !== e1, "sıradaki aynı branştan");
  const s = await satir(h2);
  assert.equal(s.durum, "onaylandi");
  assert.ok(s.onay, "onay zamanı veritabanından");
  assert.equal(s.onay_hesap, FA.mek.id, "onaylayan hesap veritabanından");
  assert.deepEqual((await hareketler(h2)).map((x) => [x[0], x[2]]), [["olustur", FA.den.id], ["gonder", FA.den.id], ["onay", FA.mek.id]]);
  assert.deepEqual(await a(FA.mek, (db) => onayla(db, FA.mek, h2, s.surum)), { durum: "red", neden: "Rapor onay kuyruğunda değil (şu an: Muayene uzmanı imzası)." });
  /* C1: yönetici kendi yazdığı raporu onaylar (reisim kararı) */
  tamam(await a(FA.mekDen, (db) => onayla(db, FA.mekDen, kendi, 1)));
  assert.equal((await satir(kendi)).onay_hesap, FA.mekDen.id);
  /* elektrik yöneticisi elektriği onaylar */
  tamam(await a(FA.elk, (db) => onayla(db, FA.elk, e1, 1)));
  /* onaylanan rapor denetçinin ekranında salt okunur */
  const d = (await a(FA.den, (db) => sahaRaporu(db, FA.den, h2)))!;
  assert.deepEqual([d.durum, d.izin.duzenle], ["onaylandi", false]);
});

test("geri gönder: gerekçe ≥ 10 (sunucu ve veritabanı); rapor Yeni'ye döner, gönderim zamanı boşalır, ilk gönderim kalır; hareket gerekçesiyle; denetçi raporun üstünde görür ve yeniden düzenler", async () => {
  const [h1] = await raporlar([[FA.den, "HT-1"]]);
  const ilk = (await satir(h1)).ilk_gonderim;
  assert.deepEqual(await a(FA.mek, (db) => geriGonder(db, FA.mek, h1, 1, { gerekce: "kısa" })),
    { durum: "gecersiz", hatalar: { gerekce: "Gerekçe en az 10 karakter olmalı: denetçi neyi düzelteceğini bilmeli." } });
  assert.equal((await a(FA.mek, (db) => geriGonder(db, FA.mek, h1, 1, { gerekce: "         x          " }))).durum, "gecersiz", "boşluklar sayılmaz");
  assert.equal((await a(FA.yon, (db) => geriGonder(db, FA.yon, h1, 1, { gerekce: "Test değerleri eksik" }))).durum, "yetkisiz");
  const r = tamam(await a(FA.mek, (db) => geriGonder(db, FA.mek, h1, 1, { gerekce: "  Test değerleri   eksik  " })));
  assert.match(r.bildirim, /^DA-\S+ geri gönderildi; Deneme Bir raporun üstünde gerekçeyi görür\.$/);
  const s = await satir(h1);
  assert.deepEqual([s.durum, s.gonderildi, s.onay], ["taslak", null, null]);
  assert.deepEqual(s.ilk_gonderim, ilk, "ilk gönderim korunur (performans: yazım süresi)");
  assert.deepEqual((await hareketler(h1)).at(-1), ["geri", "Test değerleri eksik", FA.mek.id]);
  /* denetçi: gerekçe raporun üstünde; Yeni rapor yeniden düzenlenir */
  const d = (await a(FA.den, (db) => sahaRaporu(db, FA.den, h1)))!;
  assert.equal(d.izin.duzenle, true);
  assert.equal(d.geri?.kim, "Deneme mek");
  assert.equal(d.geri?.gerekce, "Test değerleri eksik");
  assert.equal((await a(FA.den, (db) => raporKaydet(db, FA.den, h1, s.surum, {
    ekipman: { marka: "Deneme", model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
    tarih: { bas: `${bugunTr()}T09:00`, bit: null, sonraki: null, takip: null, rapor: null }, cevaplar: {},
  }))).durum, "tamam");
  /* veritabanı da ister: kısa gerekçeyle doğrudan geri gönderilemez */
  await sql(A, "UPDATE rapor SET durum = 'onayda' WHERE id = $1", [h1], FA.den.id);
  await assert.rejects(sql(A, "UPDATE rapor SET durum = 'taslak' WHERE id = $1", [h1], FA.mek.id), /gerekçe en az 10/);
  await assert.rejects(kiraciIcinde(havuz, A, async (db) => {
    await db.sorgu("SELECT set_config('app.gerekce', 'kısa', true)");
    await db.sorgu("UPDATE rapor SET durum = 'taslak' WHERE id = $1", [h1]);
  }), /gerekçe en az 10/);
});

test("onayı geri al ve durumu değiştir: onaylandı → onayda; Yeni / onayda / onaylandı arası; Yeni'ye gerekçe zorunlu; Onaylandı'ya almak onay sayılır; aynı durum ve imzalı rapor reddedilir", async () => {
  const [h1, h2] = await raporlar([[FA.den, "HT-1"], [FA.den, "HT-2"]]);
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h1, 1)));
  assert.equal((await a(FA.elk, (db) => onayGeriAl(db, FA.elk, h1, 2))).durum, "yok");
  assert.deepEqual(await a(FA.mek, (db) => onayGeriAl(db, FA.mek, h2, 1)), { durum: "red", neden: "Rapor onaylanmış değil (şu an: Teknik yönetici onayında)." });
  assert.deepEqual(await a(FA.mek, (db) => onayGeriAl(db, FA.mek, h1, 2)), { durum: "tamam", sonraki: null, bildirim: `${(await a(FA.mek, (db) => onayEkrani(db, FA.mek, h1)))!.r.no} onayı geri alındı; rapor yeniden kuyrukta.` });
  let s = await satir(h1);
  assert.deepEqual([s.durum, s.onay, s.onay_hesap], ["onayda", null, null], "onay damgası kalkar");
  /* durumu değiştir */
  assert.deepEqual(await a(FA.mek, (db) => durumDegistir(db, FA.mek, h1, s.surum, { hedef: "onayda", gerekce: "" })), { durum: "gecersiz", hatalar: { hedef: "Rapor zaten bu durumda." } });
  assert.deepEqual(await a(FA.mek, (db) => durumDegistir(db, FA.mek, h1, s.surum, {})), { durum: "gecersiz", hatalar: { hedef: "Yeni durumu seçin." } });
  assert.deepEqual(await a(FA.mek, (db) => durumDegistir(db, FA.mek, h1, s.surum, { hedef: "taslak", gerekce: "kısa" })),
    { durum: "gecersiz", hatalar: { gerekce: "Yeni'ye alınan rapor denetçiye döner: gerekçe en az 10 karakter olmalı." } });
  assert.equal((await a(FA.mek, (db) => durumDegistir(db, FA.mek, h1, s.surum, { hedef: "imzali", gerekce: "" }))).durum, "gecersiz", "Tamamlandı'ya yalnız imzayla");
  assert.equal((await a(FA.yon, (db) => durumDegistir(db, FA.yon, h1, s.surum, { hedef: "onaylandi", gerekce: "" }))).durum, "yetkisiz");
  const r = tamam(await a(FA.mek, (db) => durumDegistir(db, FA.mek, h1, s.surum, { hedef: "onaylandi", gerekce: "" })));
  assert.match(r.bildirim, /: Teknik yönetici onayında → Muayene uzmanı imzası\.$/);
  s = await satir(h1);
  assert.equal(s.onay_hesap, FA.mek.id, "Onaylandı'ya almak onay sayılır (191)");
  tamam(await a(FA.mek, (db) => durumDegistir(db, FA.mek, h1, s.surum, { hedef: "taslak", gerekce: "Kriterler yeniden bakılmalı" })));
  s = await satir(h1);
  assert.deepEqual([s.durum, s.onay, s.gonderildi], ["taslak", null, null]);
  tamam(await a(FA.mek, (db) => durumDegistir(db, FA.mek, h1, s.surum, { hedef: "onayda", gerekce: "" })));
  s = await satir(h1);
  assert.ok(s.gonderildi, "Yeni'den onaya alınınca gönderim zamanı yazılır");
  assert.deepEqual((await hareketler(h1)).map((x) => x[0]), ["olustur", "gonder", "onay", "onay_geri", "onay", "geri", "gonder"]);
  /* imzalı rapor (imza kalemi gelene kadar elle): durumu değişmez — sunucu ve veritabanı */
  const sahip = kume.sahipIstemci(); await sahip.connect();
  try {
    await sahip.query("ALTER TABLE rapor DISABLE TRIGGER rapor_akis");
    await sahip.query("UPDATE rapor SET durum = 'imzali', onay = now() WHERE id = $1", [h2]);
    await sahip.query("ALTER TABLE rapor ENABLE TRIGGER rapor_akis");
  } finally { await sahip.end(); }
  const sh2 = await surum(h2);
  assert.deepEqual(await a(FA.mek, (db) => durumDegistir(db, FA.mek, h2, sh2, { hedef: "onaylandi", gerekce: "" })),
    { durum: "red", neden: "Tamamlanan raporun durumu değişmez; düzeltme revizyonla." });
  await assert.rejects(sql(A, "UPDATE rapor SET durum = 'onaylandi' WHERE id = $1", [h2], FA.mek.id), /tamamlanan rapor değişmez/);
});

test("veritabanı: tanımsız geçiş reddedilir; durum değişirken içerik değişmez; onay damgası elle yazılamaz; gerekçe ayarı sonraki geçişe taşınmaz; hareket elle yazılmaz; B göremez", async () => {
  const [h1, h2] = await raporlar([[FA.den, "HT-1"], [FA.den, "HT-2"]]);
  const yaz = (metin: string, p: unknown[] = [h1]) => sql(A, metin, p, FA.mek.id);
  await assert.rejects(yaz("UPDATE rapor SET durum = 'imzali' WHERE id = $1"), /geçemez/, "onayda → imzalı (imza kalemi)");
  await assert.rejects(yaz("UPDATE rapor SET durum = 'imzada' WHERE id = $1"), /geçemez/);
  await assert.rejects(yaz(`UPDATE rapor SET durum = 'onaylandi', cevaplar = '{"sonuc": "uygun"}'::jsonb WHERE id = $1`), /yalnız Yeni rapor düzenlenir|içeriği değişmez/);
  /* onay damgası: elle yazılan değer yok sayılır, tetik yazar */
  await yaz("UPDATE rapor SET onay = '2020-01-01', onay_hesap = $2 WHERE id = $1", [h1, FA.den.id]);
  assert.deepEqual([(await satir(h1)).onay, (await satir(h1)).onay_hesap], [null, null]);
  await yaz("UPDATE rapor SET durum = 'onaylandi', onay = '2020-01-01', onay_hesap = $2 WHERE id = $1", [h1, FA.den.id]);
  const s = await satir(h1);
  assert.equal(s.onay_hesap, FA.mek.id, "onaylayan bağlamdaki hesap");
  assert.ok(s.onay!.getTime() > Date.parse("2025-01-01"), "onay zamanı veritabanından");
  /* aynı işlemde: gerekçeli geri gönderme ayarı silinir, sonraki gerekçesiz geçişe taşınmaz */
  await assert.rejects(kiraciIcinde(havuz, A, async (db) => {
    await db.sorgu("SELECT set_config('app.gerekce', 'Kriterler yeniden bakılmalı', true)");
    await db.sorgu("UPDATE rapor SET durum = 'taslak' WHERE id = $1", [h1]);
    await db.sorgu("UPDATE rapor SET durum = 'onayda' WHERE id = $1", [h1]);
    await db.sorgu("UPDATE rapor SET durum = 'taslak' WHERE id = $1", [h1]);
  }, { hesapId: FA.mek.id }), /gerekçe en az 10/);
  /* hareket elle yazılmaz */
  await assert.rejects(yaz("INSERT INTO rapor_hareket (rapor_id, ne, gerekce) VALUES ($1, 'onay', 'sahte')"), /elle yazılmaz/);
  /* başka firma */
  const bs = await b(FB.mek, (db) => db.sorgu("UPDATE rapor SET durum = 'onaylandi' WHERE id = $1", [h2]));
  assert.equal(bs.rowCount, 0, "B'nin bağlamında A'nın satırı görünmez");
  assert.equal((await satir(h2)).durum, "onayda");
});

test("KİRACI + ROL: B'nin yöneticisi A'nın raporunda hiçbir şey yapamaz; Onaylar kapatılınca ya da rol düşünce görünmez; sahte rol bir şey vermez", async () => {
  const [h1] = await raporlar([[FA.den, "HT-1"]]);
  const isler: ((db: Sorgulayici, k: Kisi) => Promise<OnayYazma>)[] = [
    (db, k) => onayla(db, k, h1, 1), (db, k) => geriGonder(db, k, h1, 1, { gerekce: "Test değerleri eksik" }), (db, k) => onayGeriAl(db, k, h1, 1),
    (db, k) => durumDegistir(db, k, h1, 1, { hedef: "onaylandi", gerekce: "" }),
  ];
  for (const is of isler) assert.equal((await b(FB.mek, (db) => is(db, FB.mek))).durum, "yok");
  const KAPALI: Kisi = { ...FA.mek, matris: { ...MATRIS_ONERI, 15: ["yok", "yok", "yok", "brans", "gor", "yok"] } as never };
  assert.equal(await a(KAPALI, (db) => onayListeleri(db, KAPALI)), null);
  for (const is of isler) assert.equal((await a(KAPALI, (db) => is(db, KAPALI))).durum, "yok", "Onaylar kapalı");
  const DEN: Kisi = { ...FA.mek, roller: ["denetci"] };
  for (const is of isler) assert.equal((await a(DEN, (db) => is(db, DEN))).durum, "yok", "rol denetçiye düşünce");
  const SAHTE: Kisi = { ...FA.den, roller: ["admin", "mekanik_yonetici_", "__proto__"] as never };
  for (const is of isler) assert.equal((await a(SAHTE, (db) => is(db, SAHTE))).durum, "yok");
  const s = await satir(h1);
  assert.deepEqual([s.durum, s.surum], ["onayda", 1], "hiçbir şey yazılmadı");
});
