/* NEREDEN GELDİ: maket onaylar.html M9 (kuyruk branşın onaydaki raporları, en yeni üstte; onay ekranı gözden geçirme; Onayla → sıradaki rapor;
   Geri gönder gerekçe ≥ 10, denetçi raporun üstünde görür; Onayı geri al 102; Tüm raporlar ve Durumu değiştir 190, Onaylandı'ya almak onay 191;
   N7 vekil yok) · KOD-GECIS §4 (rapor_onayla / rapor_geri_gonder / rapor_durum_degistir; Onaylar düzeyi: branş yöneticisi branşı, firma
   yöneticisi görür, denetçi / planlama / muhasebe yok) · pkproje §1 (reisim: "hazırlayanın kendi raporunu onaylaması da engellenmez" — C1) ·
   reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (314; göç 0026).
   Olumsuz kanıt: tests/bozan/onaylar.bozan.ts.
   317 SON İMZA (aynı kurulum): indir-imzala-yükle (araştırma §8; karar 99, 104, 114, 187; 09-F1) — imzasız kesin PDF bir kez, imzalı PDF'in öneki
   ve imza sözlüğü, imzalı sürüm değişmez ve kopyalarla, uygunsuzluk açılır / sonraki sürümle kapanır, dosyayı raporu gören indirir.
   318 REVİZYON (göç 0029; pkproje §11 131 V1, 141 W4, 142 W5; KOD-GECIS §4 rapor_revize_iste / rapor_revizeye_gonder): Revize iste (yazan) · geri çek ·
   Reddet · Revizeye gönder (türün branş yöneticisi) → R1 Yeni, imzalı sürüm saklı, yeniden onay ve imzayla no-R1. */
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
import {
  IMZALI_MODULU, imzaHazirla, imzaliYukle, raporKaydet, raporListesi, raporOlustur, raporSil, revizeIste, revizeIstegiGeriCek, sahaRaporu,
} from "../src/modules/raporlar/server/raporlar.ts";
import { dosyaIndirilebilir, dosyaYukle } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import {
  durumDegistir, geriGonder, onayEkrani, onayGeriAl, onayla, onayListeleri, revizeIstegiReddet, revizeyeGonder, type OnayYazma,
} from "../src/modules/onaylar/server/onaylar.ts";
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
    for (const [t, kod] of [[ht, "HT-1"], [ht, "HT-2"], [ht, "HT-3"], [ht, "HT-4"], [ep, "EP-1"], [ep, "EP-2"], [ep, "EP-3"]]) {
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

test("kuyruk: branş yöneticisi yalnız kendi branşının onaydaki raporlarını görür, en yeni üstte; firma yöneticisi hepsini görür ama onaylamaz; denetçi kuyruğu görmez (yalnız imzasını bekleyenler); planlama, muhasebe ve başka firma görmez", async () => {
  const [h1, h2, e1] = await raporlar([[FA.den, "HT-1"], [FA.den, "HT-2"], [FA.den, "EP-1"]]);
  const mek = (await a(FA.mek, (db) => onayListeleri(db, FA.mek)))!;
  const benim = mek.kuyruk.filter((r) => [h1, h2, e1].includes(r.id));
  assert.deepEqual(benim.map((r) => r.id), [h2, h1], "mekanik: yalnız mekanik, en yeni üstte");
  assert.deepEqual([benim[0].ekipmanKod, benim[0].turAd, benim[0].denetci, benim[0].durum, benim[0].bekleme], ["HT-2", "Hava tankı", "Deneme Bir", "onayda", "az önce"]);
  /* 2026-10-05 (318): izne "revize" eklendi (Revizeye gönder — yalnız tamamlanan raporda) */
  assert.deepEqual(benim[0].izin, { onayla: true, geriGonder: true, onayGeriAl: false, durumDegistir: true, revize: false });
  assert.equal("hesapId" in benim[0], false, "yazan hesabın kimliği ekrana gitmez");
  assert.deepEqual(mek.branslar, ["m"]);
  const elk = (await a(FA.elk, (db) => onayListeleri(db, FA.elk)))!;
  assert.deepEqual(elk.kuyruk.filter((r) => [h1, h2, e1].includes(r.id)).map((r) => r.id), [e1], "elektrik: yalnız elektrik");
  const yon = (await a(FA.yon, (db) => onayListeleri(db, FA.yon)))!;
  const yonun = yon.kuyruk.filter((r) => [h1, h2, e1].includes(r.id));
  assert.equal(yonun.length, 3, "firma yöneticisi görür");
  assert.ok(yonun.every((r) => !r.izin.onayla && !r.izin.geriGonder && !r.izin.durumDegistir), "firma yöneticisi onaylamaz (branş yöneticisi değil)");
  /* 2026-10-05 (318, C5): denetçinin Onaylar düzeyi "kendi" — imzanın tek merkezi Onaylar (pkproje §11 264; maket onaylar.html BB4). Önceki
     "denetçi Onaylar'ı görmez" beklentisi bu kararla değişti; denetçi yine kuyruğu, tüm raporları ve onay ekranını görmez. */
  const den = (await a(FA.den, (db) => onayListeleri(db, FA.den)))!;
  assert.deepEqual([den.yonetici, den.kuyruk, den.tumu, den.branslar, den.imzaBekleyen], [false, [], [], [], []], "denetçi: kuyruk ve tüm raporlar yok");
  for (const k of [FA.plan, FA.muh]) assert.equal(await a(k, (db) => onayListeleri(db, k)), null, `${k.roller[0]} Onaylar'ı görmez`);
  assert.equal(await a(FA.den, (db) => onayEkrani(db, FA.den, h1)), null, "denetçi onay ekranını açamaz");
  assert.equal((await a(FA.den, (db) => onayla(db, FA.den, h1, 1))).durum, "yok", "denetçi onaylayamaz");
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
  /* 2026-10-05 (çapraz inceleme): karakter veritabanı gibi kod noktasıyla sayılır — UTF-16'da 11, gerçekte 9 karakter: sunucu reddeder (yakalanmamış
     veritabanı hatası yerine) */
  assert.deepEqual(await a(FA.mek, (db) => geriGonder(db, FA.mek, h1, 1, { gerekce: "Fotoyok\u{1F4F7}\u{1F4F7}" })),
    { durum: "gecersiz", hatalar: { gerekce: "Gerekçe en az 10 karakter olmalı: denetçi neyi düzelteceğini bilmeli." } });
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

/* ── 317 SON İMZA ───────────────────────────────────────────────────────────────────────────────────────────────── */
/** uydurma "kesin PDF" üretici (Chromium'suz; gerçek motor tests/pdf.test.ts'te): her çağrı ayrı bayt, sayılır */
let uretilen = 0;
const uret = async () => new TextEncoder().encode(`%PDF-1.4\n% deneme belge ${++uretilen}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`);
/** imzasız PDF + artımlı imza bölümü (PAdES gibi: özgün baytlar korunur, sonuna imza sözlüğü eklenir) */
const imzala = (b: Uint8Array) => Buffer.concat([Buffer.from(b),
  Buffer.from("\n2 0 obj << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n", "latin1")]);
const IMZA_GECERSIZ = "Yüklenen PDF bu raporun imzaya hazırlanan PDF'i değil ya da imza taşımıyor.";
const imzasizBayt = async (raporId: string) => {
  const x = (await sql<{ anahtar: string }>(A, "SELECT d.anahtar FROM imza_istegi i JOIN dosya d ON d.id = i.pdf_dosya WHERE i.rapor_id = $1 AND i.durum = 'bekliyor'", [raporId])).rows[0];
  return depo.oku(x.anahtar);
};
const hazirla = (k: Kisi, id: string) => a(k, (db) => imzaHazirla(db, depo, k, A, id, uret));
const yukle = (k: Kisi, id: string, surum: number, bayt: Uint8Array) => a(k, (db) => imzaliYukle(db, depo, k, A, id, surum, { ad: "imzali.pdf", bayt }));
/** onaydaki rapora "Uygun değil" madde ve sonuç yazar (tetiksiz değil: taslakken yazılır, sonra gönderilir) — uygunsuzluk denemesi için */
async function kusurluRapor(kod: string): Promise<string> {
  const bas = bugunTr();
  const id = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis, baslangic: bas, bitis: bas,
    ekip: [FA.denP, FA.mekP].map((p, i) => ({ personel: p, isgNo: `ISG-K${planSira++}-${i}`, kaydet: false })) }))).id;
  tamam(await a(FA.den, async (db) => planKabul(db, FA.den, id, (await planIci(db, FA.den, id))!.surum, true)));
  const r = tamam(await a(FA.den, (db) => raporOlustur(db, FA.den, id, FA.ekp[kod])));
  await sql(A, `UPDATE rapor SET cevaplar = jsonb_set(cevaplar, '{madde,k1}', '{"c": "Uygun değil", "not": "Korozyon"}'::jsonb), sonuc = 'uygun_degil', surum = surum + 1
    WHERE id = $1`, [r.id], FA.den.id);
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [r.id], FA.den.id);
  return r.id;
}

test("imzaya hazırla: yalnız raporu yazan, yalnız onaylanmış raporda; kesin PDF bir kez üretilir ve saklanır (SHA-256 istekte)", async () => {
  const [h1] = await raporlar([[FA.den, "HT-4"]]);
  assert.deepEqual(await hazirla(FA.den, h1), { durum: "red", neden: "Rapor imzaya hazır değil (şu an: Teknik yönetici onayında)." });
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h1, 1)));
  assert.equal((await hazirla(FA.mek, h1)).durum, "yetkisiz", "yönetici görür, imzalamaz (yazan değil)");
  assert.equal((await hazirla(FA.elk, h1)).durum, "yok");
  assert.equal((await b(FB.den, (db) => imzaHazirla(db, depo, FB.den, B, h1, uret))).durum, "yok", "başka firma");
  const once = uretilen;
  assert.deepEqual(await hazirla(FA.den, h1), { durum: "tamam", id: h1, bildirim: "İmzasız PDF hazır; indirip imzalayın, imzalı PDF'i yükleyin." });
  tamam(await hazirla(FA.den, h1));
  assert.equal(uretilen - once, 1, "ikinci İmzala yeniden üretmez (imzalanacak bayt değişmesin)");
  /* C5: İmzamı bekleyen raporlar — yalnız yazanın; yöneticinin sekmesinde başkasının raporu yok, öteki firma görmez */
  const bekleyen = async (k: Kisi) => ((await a(k, (db) => onayListeleri(db, k)))?.imzaBekleyen ?? []).map((r) => r.id);
  assert.ok((await bekleyen(FA.den)).includes(h1), "yazan imzasını bekleyeni görür");
  for (const k of [FA.mek, FA.mekDen, FA.yon]) assert.equal((await bekleyen(k)).includes(h1), false, `${k.roller.join("+")} başkasının imzasını beklemez`);
  assert.deepEqual((await b(FB.den, (db) => onayListeleri(db, FB.den)))!.imzaBekleyen, [], "başka firma");
  const i = (await sql<{ durum: string; h: string; sha: string; dsha: string; modul: string }>(A, `SELECT i.durum, i.hesap_id::text AS h, i.pdf_sha256 AS sha, d.sha256 AS dsha, d.modul
    FROM imza_istegi i JOIN dosya d ON d.id = i.pdf_dosya WHERE i.rapor_id = $1`, [h1])).rows;
  assert.equal(i.length, 1);
  assert.deepEqual([i[0].durum, i[0].h, i[0].sha === i[0].dsha, i[0].modul], ["bekliyor", FA.den.id, true, "rapor_pdf"]);
  const v = (await a(FA.den, (db) => sahaRaporu(db, FA.den, h1)))!;
  assert.equal(v.imza?.hazir, true);
  assert.ok(v.imza?.pdf);
  assert.equal((await a(FA.mek, (db) => sahaRaporu(db, FA.mek, h1)))!.imza, null, "yönetici ekranında imza adımı yok");
});

test("imzalı PDF: önek ve imza sözlüğü şart; tamamlanınca imzalı sürüm kopyalarla, uygunsuzluk, hareket; dosyayı raporu gören indirir", async () => {
  const h1 = await kusurluRapor("HT-2");
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h1, 2)));
  const s0 = (await satir(h1)).surum;
  assert.deepEqual(await yukle(FA.den, h1, s0, imzala(await uret())), { durum: "red", neden: "Önce imzasız PDF'i hazırlayıp indirin; imzalı PDF onun imzalanmış hâli olmalı." });
  tamam(await hazirla(FA.den, h1));
  const ham = await imzasizBayt(h1);
  assert.deepEqual(await yukle(FA.den, h1, s0, imzala(await uret())), { durum: "gecersiz", hatalar: { dosya: IMZA_GECERSIZ } }, "başka PDF'in imzalısı");
  assert.deepEqual(await yukle(FA.den, h1, s0, Buffer.concat([Buffer.from(ham), Buffer.from("\n% imzasız ek\n")])), { durum: "gecersiz", hatalar: { dosya: IMZA_GECERSIZ } }, "imza sözlüğü yok");
  assert.deepEqual(await yukle(FA.den, h1, s0, ham), { durum: "gecersiz", hatalar: { dosya: IMZA_GECERSIZ } }, "imzasız PDF'in kendisi");
  assert.equal((await yukle(FA.mek, h1, s0, imzala(ham))).durum, "yetkisiz");
  assert.equal((await yukle(FA.den, h1, s0 - 1, imzala(ham))).durum, "cakisma");
  assert.equal((await satir(h1)).durum, "onaylandi", "reddedilenler hiçbir şey yazmadı");
  /* doğru imzalı PDF */
  const r = tamam(await yukle(FA.den, h1, s0, imzala(ham)));
  assert.match(r.bildirim, /^DA-\S+ imzalandı, tamamlandı ve müşteriye açıldı\.$/);
  assert.equal((await satir(h1)).durum, "imzali");
  assert.deepEqual((await hareketler(h1)).at(-1)?.[0], "imza");
  assert.equal((await a(FA.den, (db) => onayListeleri(db, FA.den)))!.imzaBekleyen.some((x) => x.id === h1), false, "imzalanan bekleyenlerden düşer");
  const sr = (await sql<{ no: string; rno: string; tesis: string; sonuc: string; imzalayan: string; firma: string; personel: { ad: string }; icerik: { format_sira: number } }>(A,
    `SELECT s.no, r.no AS rno, s.tesis_id::text AS tesis, s.sonuc, s.imzalayan_hesap::text AS imzalayan, s.kunye->>'firma_adi' AS firma, s.personel, s.icerik
     FROM rapor_surumu s JOIN rapor r ON r.id = s.rapor_id WHERE s.rapor_id = $1`, [h1])).rows;
  assert.equal(sr.length, 1);
  assert.deepEqual([sr[0].no, sr[0].tesis, sr[0].sonuc, sr[0].imzalayan, sr[0].personel.ad, sr[0].icerik.format_sira], [sr[0].rno, FA.tesis, "uygun_degil", FA.den.id, "Deneme Bir", 1]);
  const u = (await sql<{ kaynak: string; metin: string; kapanis: string | null }>(A, "SELECT kaynak, metin, kapanis FROM uygunsuzluk WHERE rapor_id = $1", [h1])).rows;
  assert.ok(u.length >= 1 && u.some((x) => x.kaynak === "madde" && /Korozyon/.test(x.metin)) && u.every((x) => x.kapanis === null), JSON.stringify(u));
  assert.equal((await sql<{ d: string }>(A, "SELECT durum AS d FROM imza_istegi WHERE rapor_id = $1", [h1])).rows[0].d, "tamam");
  /* rapor ekranı: tamamlandı, imzalı PDF; içerik değişmez */
  const v = (await a(FA.den, (db) => sahaRaporu(db, FA.den, h1)))!;
  assert.deepEqual([v.durum, v.imza, !!v.imzali?.dosya], ["imzali", null, true]);
  const pdf = v.imzali!.dosya!;   // 387: null yalnız saklama süresi dolup silinince
  const indir = (k: Kisi) => a(k, (db) => dosyaIndirilebilir(db, k, pdf, DOSYA_ERISIMI));
  assert.ok(await indir(FA.den)); assert.ok(await indir(FA.mek)); assert.ok(await indir(FA.yon));
  assert.equal(await indir(FA.elk), null); assert.equal(await indir(FA.muh), null);
  assert.equal(await b(FB.den, (db) => dosyaIndirilebilir(db, FB.den, pdf, DOSYA_ERISIMI)), null);
  assert.equal((await yukle(FA.den, h1, (await satir(h1)).surum, imzala(ham))).durum, "red", "tamamlanan rapor yeniden imzalanmaz");
});

test("veritabanı: imzalı sürüm değişmez; imzalı sürüm olmadan tamamlanmaz; başka raporun dosyasıyla istek ve sürüm yazılmaz; yeni imzalı sürüm öncekinin uygunsuzluğunu kapatır", async () => {
  /* önceki testin imzalı raporu (HT-2) — uygunsuzluğu açık */
  const s1 = (await sql<{ id: string; rapor: string }>(A, "SELECT s.id::text, s.rapor_id::text AS rapor FROM rapor_surumu s JOIN ekipman e ON e.id = s.ekipman_id WHERE e.kod = 'HT-2'")).rows[0];
  await assert.rejects(sql(A, "UPDATE rapor_surumu SET sonuc = 'uygun' WHERE id = $1", [s1.id]), /permission denied|değişmez/);
  await assert.rejects(sql(A, "DELETE FROM rapor_surumu WHERE id = $1", [s1.id]), /permission denied|değişmez/);
  await assert.rejects(sql(A, "UPDATE uygunsuzluk SET metin = 'sahte' WHERE rapor_id = $1", [s1.rapor]), /içeriği değişmez/);
  await assert.rejects(sql(A, "DELETE FROM uygunsuzluk WHERE rapor_id = $1", [s1.rapor]), /permission denied/);
  await assert.rejects(sql(A, "INSERT INTO uygunsuzluk (surum_id, kaynak, ref, metin) VALUES ($1, 'madde', 'k1', 'sahte')", [s1.id]), /yalnız imzalanan sürümle/);
  /* onaylanmış rapor imzalı sürüm olmadan tamamlanmaz */
  const [h3] = await raporlar([[FA.den, "HT-3"]]);
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h3, 1)));
  await assert.rejects(sql(A, "UPDATE rapor SET durum = 'imzali' WHERE id = $1", [h3], FA.den.id), /imzalı sürüm olmadan/);
  /* başka raporun PDF'iyle istek / sürüm */
  const baska = (await sql<{ id: string; sha: string }>(A, "SELECT id::text, sha256 AS sha FROM dosya WHERE modul = 'rapor_imzali' AND kayit_id = $1", [s1.rapor])).rows[0];
  await assert.rejects(sql(A, "INSERT INTO imza_istegi (rapor_id, pdf_dosya, pdf_sha256) VALUES ($1, $2, $3)", [h3, baska.id, baska.sha], FA.den.id), /bu raporun değil/);
  await assert.rejects(sql(A, `INSERT INTO rapor_surumu (rapor_id, no, imzasiz_dosya, imzali_dosya, imzali_sha256, imza_yontem, kunye, personel, icerik)
    VALUES ($1, 'x', $2, $2, $3, 'dosya', '{}', '{}', '{}')`, [h3, baska.id, baska.sha], FA.den.id), /bu raporun değil/);
  /* aynı ekipmanın (HT-2) yeni imzalı raporu öncekinin açık uygunsuzluğunu kapatır (114) */
  const [h4] = await raporlar([[FA.den, "HT-2"]]);
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h4, 1)));
  tamam(await hazirla(FA.den, h4));
  tamam(await yukle(FA.den, h4, (await satir(h4)).surum, imzala(await imzasizBayt(h4))));
  const k = (await sql<{ kapanis: string; kapatan: string }>(A, "SELECT kapanis, kapatan_surum::text AS kapatan FROM uygunsuzluk WHERE rapor_id = $1", [s1.rapor])).rows;
  const yeni = (await sql<{ id: string }>(A, "SELECT id::text FROM rapor_surumu WHERE rapor_id = $1", [h4])).rows[0].id;
  assert.ok(k.length >= 1 && k.every((x) => x.kapanis === "giderildi" && x.kapatan === yeni), JSON.stringify(k));
  assert.equal((await sql(A, "SELECT 1 FROM uygunsuzluk WHERE rapor_id = $1", [h4])).rowCount, 0, "Uygun rapor uygunsuzluk açmaz");
  /* başka firma hiçbirini görmez */
  assert.equal((await sql(B, "SELECT 1 FROM rapor_surumu")).rowCount, 0);
  assert.equal((await sql(B, "SELECT 1 FROM uygunsuzluk")).rowCount, 0);
  assert.equal((await sql(B, "SELECT 1 FROM imza_istegi")).rowCount, 0);
});

/* ── 2026-10-05 · 315–317 ÇAPRAZ İNCELEME DÜZELTMELERİ (göç 0028) ──────────────────────────────────────────────────────────────── */
test("imza isteği: onay geri alınınca bekleyen istek iptal olur; yeniden onayda İmzala yeni PDF üretir, eski PDF'in imzalısı ve iptal edilen PDF'le sürüm reddedilir", async () => {
  const [h] = await raporlar([[FA.den, "HT-4"]]);
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h, 1)));
  tamam(await hazirla(FA.den, h));
  const eski = await imzasizBayt(h);
  const eskiDosya = (await sql<{ d: string }>(A, "SELECT pdf_dosya::text AS d FROM imza_istegi WHERE rapor_id = $1 AND durum = 'bekliyor'", [h])).rows[0].d;
  tamam(await a(FA.mek, (db) => onayGeriAl(db, FA.mek, h, 2)));
  assert.deepEqual((await sql<{ d: string }>(A, "SELECT durum AS d FROM imza_istegi WHERE rapor_id = $1", [h])).rows.map((x) => x.d), ["iptal"], "bekleyen istek iptal");
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h, 3)));
  assert.equal((await a(FA.den, (db) => sahaRaporu(db, FA.den, h)))!.imza?.pdf, null, "yeniden onaylanan raporda hazır PDF yok");
  const once = uretilen;
  tamam(await hazirla(FA.den, h));
  assert.equal(uretilen - once, 1, "yeni PDF üretildi");
  assert.deepEqual(await yukle(FA.den, h, await surum(h), imzala(eski)), { durum: "gecersiz", hatalar: { dosya: IMZA_GECERSIZ } }, "eski PDF'in imzalısı");
  /* veritabanı: iptal edilen isteğin PDF'iyle imzalı sürüm yazılmaz — imzalı dosya BU raporun (dosya kuralı geçer), yalnız "bekleyen isteğin
     PDF'i" kuralı reddeder (318 incelemesi; olumsuz kanıt tests/bozan/onaylar.bozan.ts) */
  const y = await a(FA.den, (db) => dosyaYukle(db, depo, { firmaId: A, modul: IMZALI_MODULU, kayitId: h, ad: "imzali.pdf", bayt: imzala(eski), izinli: ["pdf"], kim: "Deneme", yukleyen: FA.den.id }));
  assert.ok(y.tamam, JSON.stringify(y));
  const sha = (await sql<{ sha: string }>(A, "SELECT sha256 AS sha FROM dosya WHERE id = $1", [y.id])).rows[0].sha;
  await assert.rejects(sql(A, `INSERT INTO rapor_surumu (rapor_id, no, imzasiz_dosya, imzali_dosya, imzali_sha256, imza_yontem, kunye, personel, icerik)
    VALUES ($1, 'x', $2, $3, $4, 'dosya', '{}', '{}', '{}')`, [h, eskiDosya, y.id, sha], FA.den.id), /yalnız bekleyen imza isteğinin/);
  tamam(await yukle(FA.den, h, await surum(h), imzala(await imzasizBayt(h))));
});

test("imzalı sürüm: yazan ve cihazlar PDF'in hazırlandığı andan (isteğin kopyası, değişmez) — arada değişen kayıt imzalı sürüme geçmez", async () => {
  const [h] = await raporlar([[FA.den, "HT-3"]]);
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h, 1)));
  tamam(await hazirla(FA.den, h));
  const k = (await sql<{ id: string; kopya: { yazan: { ad: string } } }>(A, "SELECT id::text, kopya FROM imza_istegi WHERE rapor_id = $1 AND durum = 'bekliyor'", [h])).rows[0];
  assert.equal(k.kopya.yazan.ad, "Deneme Bir");
  await assert.rejects(sql(A, "UPDATE imza_istegi SET kopya = '{}' WHERE id = $1", [k.id], FA.den.id), /değişmez/);
  await sql(A, "UPDATE personel SET ad = 'Deneme Yeni Ad', surum = surum + 1 WHERE id = $1", [FA.denP], FA.yon.id);
  try {
    tamam(await yukle(FA.den, h, await surum(h), imzala(await imzasizBayt(h))));
    const p = (await sql<{ ad: string }>(A, "SELECT personel->>'ad' AS ad FROM rapor_surumu WHERE rapor_id = $1", [h])).rows[0];
    assert.equal(p.ad, "Deneme Bir", "imzalanan PDF'teki ad");
  } finally {
    await sql(A, "UPDATE personel SET ad = 'Deneme Bir', surum = surum + 1 WHERE id = $1", [FA.denP], FA.yon.id);
  }
});

/** tarihli rapor: taslakken rapor tarihi (ve kusurluysa "Uygun değil" madde + sonuç) yazılır, gönderilir, türün yöneticisi onaylar, imzaya
    hazırlanır; raporun kimliği döner */
async function tarihliOnayli(kod: string, tarih: string, kusurlu: boolean, onaylayan: Kisi): Promise<string> {
  const bas = bugunTr();
  const p = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis, baslangic: bas, bitis: bas,
    ekip: [FA.denP, FA.mekP].map((x, i) => ({ personel: x, isgNo: `ISG-T${planSira++}-${i}`, kaydet: false })) }))).id;
  tamam(await a(FA.den, async (db) => planKabul(db, FA.den, p, (await planIci(db, FA.den, p))!.surum, true)));
  const h = tamam(await a(FA.den, (db) => raporOlustur(db, FA.den, p, FA.ekp[kod]))).id;
  await sql(A, kusurlu
    ? `UPDATE rapor SET rapor_tarihi = $2, cevaplar = jsonb_set(cevaplar, '{madde,k1}', '{"c": "Uygun değil", "not": "Yalıtım hasarlı"}'::jsonb), sonuc = 'uygun_degil',
       surum = surum + 1 WHERE id = $1`
    : "UPDATE rapor SET rapor_tarihi = $2, sonuc = 'uygun', surum = surum + 1 WHERE id = $1", [h, tarih], FA.den.id);
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [h], FA.den.id);
  tamam(await a(onaylayan, async (db) => onayla(db, onaylayan, h, await surum(h))));
  tamam(await hazirla(FA.den, h));
  return h;
}
/** imzalar; raporun son imzalı sürümünün kimliği döner */
async function imzalaSon(h: string): Promise<string> {
  tamam(await yukle(FA.den, h, await surum(h), imzala(await imzasizBayt(h))));
  return (await sql<{ id: string }>(A, "SELECT id::text FROM rapor_surumu WHERE rapor_id = $1 ORDER BY revizyon DESC LIMIT 1", [h])).rows[0].id;
}
const tarihliImzali = async (kod: string, tarih: string, kusurlu: boolean, onaylayan: Kisi) => imzalaSon(await tarihliOnayli(kod, tarih, kusurlu, onaylayan));

test("uygunsuzluk: muayene tarihine göre kapanır — sonradan imzalanan eski muayene yenisinin kusurunu kapatmaz, kendi kusuru giderilmiş doğar; daha yeni muayene kapatır; elle kapatılmaz", async () => {
  const uyg = async (s: string) => (await sql<{ kapanis: string | null; kapatan: string | null }>(A,
    "SELECT kapanis, kapatan_surum::text AS kapatan FROM uygunsuzluk WHERE surum_id = $1", [s])).rows;
  const yeni = await tarihliImzali("EP-1", "2026-03-01", true, FA.elk);
  assert.ok((await uyg(yeni)).length >= 1 && (await uyg(yeni)).every((x) => x.kapanis === null));
  /* elle kapatma: uygulama rolüyle, kapatan sürümle bile */
  await assert.rejects(sql(A, "UPDATE uygunsuzluk SET kapanis = 'giderildi', kapatan_surum = surum_id WHERE surum_id = $1", [yeni], FA.elk.id), /yalnız sonraki imzalı sürümle/);
  const eskiUygun = await tarihliImzali("EP-1", "2026-01-01", false, FA.elk);
  assert.ok((await uyg(yeni)).every((x) => x.kapanis === null), "eski tarihli Uygun muayene yeni muayenenin kusurunu kapatmaz");
  assert.equal((await uyg(eskiUygun)).length, 0, "Uygun sürüm uygunsuzluk açmaz");
  const eskiKusurlu = await tarihliImzali("EP-1", "2026-02-01", true, FA.elk);
  const ek = await uyg(eskiKusurlu);
  assert.ok(ek.length >= 1 && ek.every((x) => x.kapanis === "giderildi" && x.kapatan === yeni), `daha yeni muayene varken kusur giderilmiş doğar: ${JSON.stringify(ek)}`);
  const sonraki = await tarihliImzali("EP-1", "2026-04-01", false, FA.elk);
  assert.ok((await uyg(yeni)).every((x) => x.kapanis === "giderildi" && x.kapatan === sonraki), "daha yeni muayene kapatır");
});

/* ── 2026-10-05 · 318 ÇAPRAZ İNCELEME DÜZELTMELERİ (göç 0031) ──────────────────────────────────────────────────────────────── */
const uygunsuzluklar = async (s: string) => (await sql<{ kapanis: string | null; kapatan: string | null }>(A,
  "SELECT kapanis, kapatan_surum::text AS kapatan FROM uygunsuzluk WHERE surum_id = $1", [s])).rows;

test("veritabanı: muayene tarihi imza gününden ileri olamaz — ileri tarihli rapor imzalanmaz (ekipmanın sonraki kusurlarını kapatırdı)", async () => {
  const yarin = new Date(Date.parse(`${bugunTr()}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
  const h = await tarihliOnayli("HT-2", yarin, false, FA.mek);
  await assert.rejects(yukle(FA.den, h, await surum(h), imzala(await imzasizBayt(h))), /imza gününden ileri/);
  assert.equal((await satir(h)).durum, "onaylandi", "imzalanmadı");
  assert.equal((await sql(A, "SELECT 1 FROM rapor_surumu WHERE rapor_id = $1", [h])).rowCount, 0);
});

test("uygunsuzluk: yerini revizyona bırakmış imzalı sürümün tarihi başka raporun kusurunu kapatmaz — yalnız raporların son imzalı sürümü sayılır", async () => {
  /* X: yanlış (ileri ama imza gününü geçmeyen) tarihle imzalanır, revizyonla tarih düzeltilir (R1) */
  const x = await tarihliOnayli("EP-2", "2026-06-01", false, FA.elk);
  const x0 = await imzalaSon(x);
  tamam(await a(FA.elk, async (db) => revizeyeGonder(db, FA.elk, x, await surum(x), { gerekce: "Muayene tarihi yanlış yazılmış" })));
  await sql(A, "UPDATE rapor SET rapor_tarihi = '2026-02-15', surum = surum + 1 WHERE id = $1", [x], FA.den.id);
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [x], FA.den.id);
  tamam(await a(FA.elk, async (db) => onayla(db, FA.elk, x, await surum(x))));
  tamam(await hazirla(FA.den, x));
  const x1 = await imzalaSon(x);
  assert.notEqual(x0, x1);
  /* Y: X'in geçerli tarihinden (02-15) sonra, R0'ın yanlış tarihinden (06-01) önce, kusurlu → kusuru AÇIK doğar */
  const y = await tarihliImzali("EP-2", "2026-03-01", true, FA.elk);
  const u = await uygunsuzluklar(y);
  assert.ok(u.length >= 1 && u.every((z) => z.kapanis === null), `eskimiş sürümün tarihi kusuru kapatmadı: ${JSON.stringify(u)}`);
});

test("uygunsuzluk: aynı tarihli iki muayenede son imzalanan geçerli — sonradan imzalanan öncekinin kusurunu kapatır, kendi kusuru açık doğar (iki yön)", async () => {
  const ilk = await tarihliImzali("EP-3", "2026-05-01", true, FA.elk);
  assert.ok((await uygunsuzluklar(ilk)).every((z) => z.kapanis === null));
  const uygun = await tarihliImzali("EP-3", "2026-05-01", false, FA.elk);
  assert.ok((await uygunsuzluklar(ilk)).every((z) => z.kapanis === "giderildi" && z.kapatan === uygun), "aynı gün sonradan imzalanan Uygun muayene kapatır");
  const son = await tarihliImzali("EP-3", "2026-05-01", true, FA.elk);
  const u = await uygunsuzluklar(son);
  assert.ok(u.length >= 1 && u.every((z) => z.kapanis === null), `aynı gün sonradan imzalanan kusurlu muayenenin kusuru açık: ${JSON.stringify(u)}`);
});

/* ── 318 REVİZYON ───────────────────────────────────────────────────────────────────────────────────────────────── */
/** onaylanıp imzalanmış (Tamamlandı) rapor; kusurlu: "Uygun değil" sonuçlu (uygunsuzluk açar) */
async function imzaliRapor(kod: string, kusurlu = false): Promise<string> {
  const h = kusurlu ? await kusurluRapor(kod) : (await raporlar([[FA.den, kod]]))[0];
  const s0 = await surum(h);
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h, s0)));
  tamam(await hazirla(FA.den, h));
  tamam(await yukle(FA.den, h, await surum(h), imzala(await imzasizBayt(h))));
  return h;
}
const revIste = (k: Kisi, id: string, gerekce: string) => a(k, (db) => revizeIste(db, k, id, { gerekce }));
const istekleri = async (k: Kisi, id: string) => ((await a(k, (db) => onayListeleri(db, k)))?.istekler ?? []).filter((x) => x.id === id);
const GEREKCE = "Korozyon notu yanlış maddeye yazıldı";

test("revize iste: yalnız yazan, yalnız tamamlanan raporda, gerekçe ≥ 10, tek bekleyen; branş yöneticisi Revize istekleri'nde görür; geri çek yalnız isteyen; reddin gerekçesi yazanda, yeniden istenir", async () => {
  const [o] = await raporlar([[FA.den, "HT-4"]]);
  assert.deepEqual(await revIste(FA.den, o, "Ölçüm değerleri yanlış yazılmış"), { durum: "red", neden: "Revize yalnız tamamlanan raporda istenir." });
  const h = await imzaliRapor("HT-4");
  assert.equal((await revIste(FA.mek, h, "Ölçüm değerleri yanlış yazılmış")).durum, "yetkisiz", "yazan değil");
  assert.equal((await revIste(FA.elk, h, "Ölçüm değerleri yanlış yazılmış")).durum, "yok");
  assert.equal((await b(FB.den, (db) => revizeIste(db, FB.den, h, { gerekce: "Ölçüm değerleri yanlış yazılmış" }))).durum, "yok", "başka firma");
  assert.deepEqual(await revIste(FA.den, h, "kısa"), { durum: "gecersiz", hatalar: { gerekce: "Gerekçe en az 10 karakter olmalı: neyin düzeltileceği yazılmalı." } });
  assert.match(tamam(await revIste(FA.den, h, "Ölçüm   değerleri yanlış yazılmış")).bildirim, /^DA-\S+ için revize isteği teknik yöneticiye gitti\.$/);
  assert.deepEqual(await revIste(FA.den, h, "İkinci istek denemesi yapılıyor"), { durum: "red", neden: "Bu rapor için bekleyen bir revize isteğiniz var." });
  const v = (await a(FA.den, (db) => sahaRaporu(db, FA.den, h)))!;
  assert.deepEqual([v.revize?.bekleyen?.gerekce, v.revize?.red, v.revize?.iste], ["Ölçüm değerleri yanlış yazılmış", null, false], "boşluklar sadeleşir");
  assert.equal((await a(FA.mek, (db) => sahaRaporu(db, FA.mek, h)))!.revize, null, "yönetici ekranında istek adımı yok");
  /* Onaylar: branş yöneticisi isteyenin adıyla görür, firma yöneticisi görür ama gönderemez; öteki branş, denetçi ve başka firma görmez */
  const m = await istekleri(FA.mek, h);
  assert.deepEqual([m.length, m[0]?.istek.kim, m[0]?.istek.gerekce, m[0]?.izin.revize], [1, "Deneme den", "Ölçüm değerleri yanlış yazılmış", true]);
  assert.equal("hesapId" in m[0], false, "yazan hesabın kimliği ekrana gitmez");
  const y = await istekleri(FA.yon, h);
  assert.deepEqual([y.length, y[0]?.izin.revize], [1, false]);
  assert.deepEqual(await istekleri(FA.elk, h), []);
  assert.deepEqual(await istekleri(FA.den, h), [], "denetçinin Onaylar'ında istek listesi yok");
  assert.deepEqual(await b(FB.mek, async (db) => ((await onayListeleri(db, FB.mek))?.istekler ?? []).filter((x) => x.id === h)), []);
  assert.equal((await a(FA.mek, (db) => onayEkrani(db, FA.mek, h)))!.istek?.gerekce, "Ölçüm değerleri yanlış yazılmış");
  /* geri çek: yalnız isteyen, gördüğü sürümle */
  const is = v.revize!.bekleyen!.surum;
  assert.equal((await a(FA.mek, (db) => revizeIstegiGeriCek(db, FA.mek, h, v.revize!.bekleyen!.id, is))).durum, "yetkisiz");
  assert.equal((await a(FA.den, (db) => revizeIstegiGeriCek(db, FA.den, h, v.revize!.bekleyen!.id, is + 1))).durum, "cakisma");
  assert.match(tamam(await a(FA.den, (db) => revizeIstegiGeriCek(db, FA.den, h, v.revize!.bekleyen!.id, is))).bildirim, /revize isteği geri çekildi\.$/);
  assert.deepEqual(await istekleri(FA.mek, h), [], "geri çekilen istek listeden düşer");
  assert.deepEqual((await a(FA.den, (db) => sahaRaporu(db, FA.den, h)))!.revize, { bekleyen: null, red: null, iste: true });
  /* yeniden iste → yönetici reddeder (gerekçe isteğe bağlı); yazan reddi görür, yeniden isteyebilir */
  tamam(await revIste(FA.den, h, "Sonuç cümlesi eksik kalmış görünüyor"));
  const ist2 = (await istekleri(FA.mek, h))[0].istek, is2 = ist2.surum;
  /* 2026-10-05 (318 incelemesi): eski sayfadaki (geri çekilmiş) isteğin kimliğiyle yeni istek reddedilmez */
  assert.equal((await a(FA.mek, (db) => revizeIstegiReddet(db, FA.mek, h, v.revize!.bekleyen!.id, 0, {}))).durum, "cakisma");
  assert.equal((await istekleri(FA.mek, h))[0].istek.id, ist2.id, "yeni istek bekliyor");
  assert.equal((await a(FA.yon, (db) => revizeIstegiReddet(db, FA.yon, h, ist2.id, is2, {}))).durum, "yetkisiz", "firma yöneticisi reddedemez");
  assert.equal((await a(FA.elk, (db) => revizeIstegiReddet(db, FA.elk, h, ist2.id, is2, {}))).durum, "yok");
  assert.equal((await a(FA.den, (db) => revizeIstegiReddet(db, FA.den, h, ist2.id, is2, {}))).durum, "yok", "denetçi Onaylar'da yönetici değil");
  assert.equal((await b(FB.mek, (db) => revizeIstegiReddet(db, FB.mek, h, ist2.id, is2, {}))).durum, "yok", "başka firma");
  assert.match(tamam(await a(FA.mek, (db) => revizeIstegiReddet(db, FA.mek, h, ist2.id, is2, { gerekce: "Rapor doğru, revize gerekmez" }))).bildirim, /revize isteği reddedildi\.$/);
  const d = (await a(FA.den, (db) => sahaRaporu(db, FA.den, h)))!;
  assert.deepEqual([d.revize?.bekleyen, d.revize?.red?.kim, d.revize?.red?.gerekce, d.revize?.iste], [null, "Deneme mek", "Rapor doğru, revize gerekmez", true]);
  assert.equal((await a(FA.mek, (db) => revizeIstegiReddet(db, FA.mek, h, ist2.id, is2 + 1, {}))).durum, "red", "reddedilmiş istek yeniden reddedilmez");
  assert.equal((await satir(h)).durum, "imzali", "istek raporu değiştirmez");
});

test("revizeye gönder: yalnız türün branş yöneticisi, tamamlanan raporda, gerekçe ≥ 10; rapor R1 olarak Yeni döner, imzalı sürüm ve uygunsuzluğu saklı, bekleyen istek kapanır; yeniden onay ve imzayla R1 sürümü yazılır, öncekinin uygunsuzluğu revizyonla kapanır", async () => {
  const h = await imzaliRapor("HT-1", true);
  tamam(await revIste(FA.den, h, GEREKCE));
  const s0 = await surum(h);
  const gonder = (k: Kisi, s: number, gerekce: string) => a(k, (db) => revizeyeGonder(db, k, h, s, { gerekce }));
  assert.equal((await gonder(FA.yon, s0, GEREKCE)).durum, "yetkisiz", "firma yöneticisi görür, revizeye gönderemez");
  assert.equal((await gonder(FA.elk, s0, GEREKCE)).durum, "yok");
  assert.equal((await gonder(FA.den, s0, GEREKCE)).durum, "yok", "denetçi revizeye gönderemez");
  assert.equal((await b(FB.mek, (db) => revizeyeGonder(db, FB.mek, h, s0, { gerekce: GEREKCE }))).durum, "yok", "başka firma");
  const KAPALI: Kisi = { ...FA.mek, matris: { ...MATRIS_ONERI, 15: ["yok", "yok", "yok", "brans", "gor", "yok"] } as never };
  const DEN: Kisi = { ...FA.mek, roller: ["denetci"] };
  const SAHTE: Kisi = { ...FA.den, roller: ["admin", "mekanik_yonetici_", "__proto__"] as never };
  for (const k of [KAPALI, DEN, SAHTE]) assert.equal((await gonder(k, s0, GEREKCE)).durum, "yok", "Onaylar kapalı / rol düştü / sahte rol");
  assert.equal((await gonder(FA.mek, s0, "kısa")).durum, "gecersiz");
  assert.equal((await gonder(FA.mek, s0 - 1, GEREKCE)).durum, "cakisma");
  assert.equal((await satir(h)).durum, "imzali", "reddedilenler hiçbir şey yazmadı");
  const r = tamam(await gonder(FA.mek, s0, GEREKCE));
  const kok = (await sql<{ no: string }>(A, "SELECT no FROM rapor WHERE id = $1", [h])).rows[0].no;
  assert.equal(r.bildirim, `${kok}-R1 açıldı; Deneme Bir raporun üstünde gerekçeyi görür. Tamamlanan sürüm saklandı.`);
  const x = (await sql<{ durum: string; revizyon: number; onay: Date | null; gonderildi: Date | null }>(A, "SELECT durum, revizyon, onay, gonderildi FROM rapor WHERE id = $1", [h])).rows[0];
  assert.deepEqual([x.durum, x.revizyon, x.onay, x.gonderildi], ["taslak", 1, null, null]);
  assert.deepEqual((await hareketler(h)).at(-1), ["revize", GEREKCE, FA.mek.id]);
  const ist = (await sql<{ durum: string; k: string }>(A, "SELECT durum, kapatan_hesap::text AS k FROM rapor_revize_istegi WHERE rapor_id = $1 ORDER BY olustu DESC LIMIT 1", [h])).rows[0];
  assert.deepEqual([ist.durum, ist.k], ["revize", FA.mek.id], "bekleyen istek yerine geldi");
  assert.equal((await sql(A, "SELECT 1 FROM rapor_surumu WHERE rapor_id = $1 AND revizyon = 0", [h])).rowCount, 1, "tamamlanan sürüm saklı");
  assert.ok(((await sql(A, "SELECT 1 FROM uygunsuzluk WHERE rapor_id = $1 AND kapanis IS NULL", [h])).rowCount ?? 0) >= 1, "uygunsuzluk yeni sürüm imzalanana dek açık");
  /* denetçi: Yeni, R1, gerekçe şeritte, düzenler; listede R1 ve geri dönmüş; Yeni rapor yeniden revizeye gönderilmez */
  const v = (await a(FA.den, (db) => sahaRaporu(db, FA.den, h)))!;
  assert.deepEqual([v.no, v.durum, v.geri?.revize, v.geri?.gerekce, v.izin.duzenle, v.revize, v.imzali], [`${kok}-R1`, "taslak", 1, GEREKCE, true, null, null]);
  assert.deepEqual(await istekleri(FA.mek, h), []);
  const l = (await a(FA.den, (db) => raporListesi(db, FA.den)))!.find((y) => y.id === h)!;
  assert.deepEqual([l.no, l.geri], [`${kok}-R1`, true]);
  /* 318 incelemesi: revizyondaki Yeni rapor silinmez (tamamlanan sürüm saklı) — izin yok, sunucu reddeder; plan içi satır görünen numarayla */
  assert.equal(v.izin.sil, false);
  assert.deepEqual(await a(FA.den, (db) => raporSil(db, FA.den, h, v.surum)), { durum: "red", neden: "Revizyondaki rapor silinmez; tamamlanan sürüm saklıdır." });
  const planId = (await sql<{ p: string }>(A, "SELECT plan_id::text AS p FROM rapor WHERE id = $1", [h])).rows[0].p;
  assert.equal((await a(FA.den, (db) => planIci(db, FA.den, planId)))!.raporlar.find((y) => y.id === h)?.no, `${kok}-R1`);
  assert.equal((await gonder(FA.mek, await surum(h), "İkinci revize denemesi yapılıyor")).durum, "red", "Yeni rapor revizeye gönderilmez");
  /* yeniden onaya, onay, imza → R1 imzalı sürümü; R0'ın uygunsuzluğu "revizyon" ile kapanır, içerik aynı kaldığından R1'inki açık */
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [h], FA.den.id);
  const s1 = await surum(h);
  tamam(await a(FA.mek, (db) => onayla(db, FA.mek, h, s1)));
  tamam(await hazirla(FA.den, h));
  assert.equal(tamam(await yukle(FA.den, h, await surum(h), imzala(await imzasizBayt(h)))).bildirim, `${kok}-R1 imzalandı, tamamlandı ve müşteriye açıldı.`);
  const sr = (await sql<{ no: string; revizyon: number; id: string }>(A, "SELECT no, revizyon, id::text FROM rapor_surumu WHERE rapor_id = $1 ORDER BY revizyon", [h])).rows;
  assert.deepEqual(sr.map((z) => [z.no, z.revizyon]), [[kok, 0], [`${kok}-R1`, 1]]);
  const u = (await sql<{ kapanis: string | null; kapatan: string | null; s: string }>(A,
    "SELECT kapanis, kapatan_surum::text AS kapatan, surum_id::text AS s FROM uygunsuzluk WHERE rapor_id = $1", [h])).rows;
  const eski = u.filter((z) => z.s === sr[0].id), yeni = u.filter((z) => z.s === sr[1].id);
  assert.ok(eski.length >= 1 && eski.every((z) => z.kapanis === "revizyon" && z.kapatan === sr[1].id), JSON.stringify(u));
  assert.ok(yeni.length >= 1 && yeni.every((z) => z.kapanis === null), JSON.stringify(u));
  assert.equal((await a(FA.den, (db) => sahaRaporu(db, FA.den, h)))!.imzali?.no, `${kok}-R1`);
});

test("veritabanı: revizyon yalnız Tamamlandı → Yeni'de bir artar, gerekçeyle; tamamlanan rapor başka yoldan değişmez; revize isteğini yalnız yazan açar ve geri çeker, 'revize' elle yazılamaz, içerik ve kapanış değişmez; B görmez", async () => {
  const h = await imzaliRapor("HT-3");
  const gerekceli = (k: Kisi, metin: string, p: unknown[]) => a(k, async (db) => { await db.sorgu("SELECT set_config('app.gerekce', 'Yeterince uzun bir gerekçe', true)"); return db.sorgu(metin, p); });
  await assert.rejects(gerekceli(FA.mek, "UPDATE rapor SET durum = 'taslak', revizyon = revizyon + 2 WHERE id = $1", [h]), /revizyon yalnız/);
  await assert.rejects(gerekceli(FA.mek, "UPDATE rapor SET revizyon = revizyon + 1 WHERE id = $1", [h]), /revizyon yalnız/);
  await assert.rejects(sql(A, "UPDATE rapor SET durum = 'taslak', revizyon = revizyon + 1 WHERE id = $1", [h], FA.mek.id), /gerekçe en az 10/);
  await assert.rejects(gerekceli(FA.mek, "UPDATE rapor SET durum = 'onayda' WHERE id = $1", [h]), /tamamlanan rapor değişmez/);
  await assert.rejects(gerekceli(FA.mek, "UPDATE rapor SET durum = 'taslak', revizyon = revizyon + 1, sonuc = 'uygun_degil' WHERE id = $1", [h]), /yalnız Yeni rapor düzenlenir/);
  /* revize isteği */
  const istekSql = (k: Kisi, gerekce = "Ölçüm değerleri yanlış yazılmış") =>
    sql<{ id: string }>(A, "INSERT INTO rapor_revize_istegi (rapor_id, revizyon, gerekce) VALUES ($1, 0, $2) RETURNING id::text", [h, gerekce], k.id);
  await assert.rejects(istekSql(FA.mek), /yalnız raporu yazan/);
  await assert.rejects(istekSql(FA.den, "kısa"), /violates check constraint/);
  await assert.rejects(sql(A, "INSERT INTO rapor_revize_istegi (rapor_id, revizyon, gerekce, durum) VALUES ($1, 0, 'Ölçüm değerleri yanlış yazılmış', 'revize')", [h], FA.den.id), /bekliyor açılır/);
  const iid = (await istekSql(FA.den)).rows[0].id;
  await assert.rejects(istekSql(FA.den), /duplicate key/);
  await assert.rejects(sql(A, "UPDATE rapor_revize_istegi SET durum = 'revize' WHERE id = $1", [iid], FA.mek.id), /yalnız rapor revizeye gönderilince/);
  await assert.rejects(sql(A, "UPDATE rapor_revize_istegi SET durum = 'geri_cekildi' WHERE id = $1", [iid], FA.mek.id), /yalnız isteyen/);
  await assert.rejects(sql(A, "UPDATE rapor_revize_istegi SET gerekce = 'Başka bir gerekçe yazıldı' WHERE id = $1", [iid], FA.den.id), /değişmez/);
  await assert.rejects(sql(A, "DELETE FROM rapor_revize_istegi WHERE id = $1", [iid], FA.den.id), /permission denied/);
  assert.equal((await sql(B, "SELECT 1 FROM rapor_revize_istegi")).rowCount, 0, "B görmez");
  /* reddedilen istek kapanır; kapanış zamanı ve kapatan veritabanından; kapanan bir daha değişmez */
  await sql(A, "UPDATE rapor_revize_istegi SET durum = 'reddedildi', kapanis_gerekce = 'Gerek yok', kapandi = '2020-01-01' WHERE id = $1", [iid], FA.mek.id);
  const k = (await sql<{ k: string; z: Date }>(A, "SELECT kapatan_hesap::text AS k, kapandi AS z FROM rapor_revize_istegi WHERE id = $1", [iid])).rows[0];
  assert.equal(k.k, FA.mek.id);
  assert.ok(k.z.getUTCFullYear() > 2020, "kapanış zamanı veritabanından");
  await assert.rejects(sql(A, "UPDATE rapor_revize_istegi SET durum = 'geri_cekildi' WHERE id = $1", [iid], FA.den.id), /kapanmış revize isteği değişmez/);
  /* tamamlanmamış rapora istek açılmaz; Yeni raporun revizyonu değişmez */
  const [o] = await raporlar([[FA.den, "HT-3"]]);
  await assert.rejects(sql(A, "INSERT INTO rapor_revize_istegi (rapor_id, revizyon, gerekce) VALUES ($1, 0, 'Ölçüm değerleri yanlış yazılmış')", [o], FA.den.id), /tamamlanan raporda/);
  await assert.rejects(sql(A, "UPDATE rapor SET revizyon = 1 WHERE id = $1", [o], FA.den.id), /revizyon yalnız/);
});
