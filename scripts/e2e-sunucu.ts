/* Uçtan uca test sunucusu (playwright.config.ts webServer): GEÇİCİ gömülü PostgreSQL açar (durunca silinir), göçleri uygular, uydurma iki firma
   ve rol başına hesap ekler (e2e/hesaplar.ts), sonra Next'i geliştirme kipinde 127.0.0.1:3100'de başlatır. Firma adresi http://deneme.localhost:3100
   (ikinci firma "baska": kiracılar arası denemeler için). Bağlantı bilgisi yalnız alt sürece ortam değişkeniyle geçer.
   311 saha raporu: Saha Tesisi + HT-0201, cihaz türü Manometre + MN-01 (geçerli kalibrasyon, denetçinin zimmetinde), HT'nin gerekli cihaz türü
   Manometre, HT'nin rapor formatı hazır şablon KOMPRESOR'dan yayında — format modülün kendi işlevleriyle (yönetici adına, denetim izi ve yayın
   damgasıyla); öteki tohumlar ham SQL (geçici veritabanı, yalnız bu betik). */
import { randomBytes } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { E2E_FIRMA, E2E_HESAPLAR, E2E_ILK, E2E_KAPI, E2E_MUHASEBE, E2E_PAROLA, E2E_PLAN, E2E_SAHA } from "../e2e/hesaplar.ts";
import { taslakBaslat, yayinla, type Kisi } from "../src/modules/rapor-format/server/formatlar.ts";
import { gomuluBaslat } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../src/server/db/kiraci.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { bosKapi } from "../tests/yardimci/kume.ts";
import { nextCalistir } from "./next.ts";

const kume = await gomuluBaslat({ klasor: join(mkdtempSync(join(tmpdir(), "probata-e2e-")), "pg"), port: await bosKapi(), kalici: false });
const sahip = kume.sahipIstemci();
await sahip.connect();
const firmalar = (await sahip.query<{ id: string; kisa_ad: string }>(
  "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ($1, $2, $3), ($4, 'Başka Muayene', 'BM') RETURNING id, kisa_ad",
  [E2E_FIRMA.kisaAd, E2E_FIRMA.ad, E2E_FIRMA.raporKodu, E2E_FIRMA.baskaKisaAd])).rows;
await sahip.end();
const havuz = havuzKur(kume.uygulama);
const ozet = await parolaOzeti(E2E_PAROLA);
for (const f of firmalar) {
  const tohum = await kiraciIcinde(havuz, f.id, async (db) => {
    /* her hesap bir personele bağlı (karar 33): uydurma personel kaydı + hesabı */
    const kisiler: Partial<Record<keyof typeof E2E_HESAPLAR, { personel: string; hesap: string }>> = {};
    for (const k of Object.keys(E2E_HESAPLAR) as (keyof typeof E2E_HESAPLAR)[]) {
      const h = E2E_HESAPLAR[k];
      const p = (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, eposta, basla, meslek) VALUES ($1, $2, '2024-01-15', 'mak-muh') RETURNING id::text", [h.ad, h.eposta])).rows[0].id;
      const hs = (await db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, parola_ozeti, roller, durum, personel_id) VALUES ($1, $2, $3, $4, 'etkin', $5) RETURNING id::text",
        [h.eposta, h.ad, ozet, h.roller, p])).rows[0].id;
      kisiler[k] = { personel: p, hesap: hs };
    }
    for (const h of E2E_ILK) {
      await db.sorgu("INSERT INTO hesap (eposta, ad, parola_ozeti, roller, durum) VALUES ($1, $2, $3, $4, 'ilk')", [h.eposta, h.ad, ozet, h.roller]);
    }
    /* plan aç (309): uydurma müşteri + tesis + bir tür ve iki ekipman (e2e/planlar.spec); plan içi (310) için ayrı tesis + iki ekipman */
    const m = (await db.sorgu<{ id: string }>("INSERT INTO musteri (unvan, kisa, eposta) VALUES ($1, 'Plan Deneme', $2) RETURNING id::text", [E2E_PLAN.musteri, E2E_PLAN.musteriEposta])).rows[0].id;
    const t = (await db.sorgu<{ id: string }>("INSERT INTO tesis (musteri_id, ad, adres, il, ilce) VALUES ($1, $2, 'Deneme Cad. No 1', 'Kocaeli', 'Gebze') RETURNING id::text", [m, E2E_PLAN.tesis])).rows[0].id;
    const u = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text")).rows[0].id;
    for (const kod of ["HT-0001", "HT-0002"]) await db.sorgu("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'Deneme')", [t, u, kod]);
    const ti = (await db.sorgu<{ id: string }>("INSERT INTO tesis (musteri_id, ad, adres, il, ilce) VALUES ($1, $2, 'Deneme Cad. No 2', 'Kocaeli', 'Gebze') RETURNING id::text", [m, E2E_PLAN.tesisIci])).rows[0].id;
    for (const kod of ["HT-0101", "HT-0102"]) await db.sorgu("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'Deneme')", [ti, u, kod]);
    /* saha raporu (311): üçüncü tesis + tek ekipman; türün gerekli ölçüm cihazı türü, geçerli kalibrasyonlu cihaz, denetçinin zimmetinde (depodan) */
    const ts = (await db.sorgu<{ id: string }>("INSERT INTO tesis (musteri_id, ad, adres, il, ilce) VALUES ($1, $2, 'Deneme Cad. No 3', 'Kocaeli', 'Gebze') RETURNING id::text",
      [m, E2E_PLAN.tesisSaha])).rows[0].id;
    await db.sorgu("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'Deneme')", [ts, u, E2E_SAHA.ekipman]);
    const ct = (await db.sorgu<{ id: string }>("INSERT INTO cihaz_turu (ad) VALUES ($1) RETURNING id::text", [E2E_SAHA.cihazTuru])).rows[0].id;
    const c = (await db.sorgu<{ id: string }>("INSERT INTO olcum_cihazi (kod, tur_id, marka, model, seri) VALUES ($1, $2, $3, $4, $5) RETURNING id::text",
      [E2E_SAHA.cihaz, ct, E2E_SAHA.marka, E2E_SAHA.model, E2E_SAHA.seri])).rows[0].id;
    await db.sorgu("INSERT INTO kalibrasyon (cihaz_id, tarih, bitis, lab, sertifika, sonuc) VALUES ($1, CURRENT_DATE, CURRENT_DATE + 365, 'Deneme Kalibrasyon Lab.', 'KL-0001', 'uygun')", [c]);
    await db.sorgu("INSERT INTO zimmet_hareket (cihaz_id, alan_personel, zaman) VALUES ($1, $2, now())", [c, kisiler.denetci!.personel]);
    await db.sorgu("UPDATE ekipman_turu SET cihaz_turleri = ARRAY[$1::uuid] WHERE id = $2", [ct, u]);
    /* muhasebe (327): fiyat listesinde HT; ayrı tesis (her projenin imzalı raporu aşağıda, süper kullanıcıyla) */
    await db.sorgu("INSERT INTO fiyat_listesi (tur_id, fiyat) VALUES ($1, 90000)", [u]);
    const tm = (await db.sorgu<{ id: string }>("INSERT INTO tesis (musteri_id, ad, adres, il, ilce) VALUES ($1, $2, 'Deneme Cad. No 4', 'Kocaeli', 'Gebze') RETURNING id::text",
      [m, E2E_MUHASEBE.tesis])).rows[0].id;
    return { yonetici: kisiler.yonetici!.hesap, tur: u, musteri: m, tesisMuhasebe: tm, denetciPersonel: kisiler.denetci!.personel };
  });
  /* HT'nin rapor formatı: hazır şablon KOMPRESOR → taslak → yayında (Rapor formatı modülünün işlevleri; yayınlayan yönetici, veritabanı damgası) */
  await kiraciIcinde(havuz, f.id, async (db) => {
    const kim: Kisi = { id: tohum.yonetici, ad: E2E_HESAPLAR.yonetici.ad, roller: E2E_HESAPLAR.yonetici.roller };
    const t = await taslakBaslat(db, kim, tohum.tur, "sablon:KOMPRESOR", null);
    if (t.durum !== "tamam") throw new Error(`HT rapor formatı taslağı açılamadı: ${t.durum}`);
    const y = await yayinla(db, kim, t.id, t.surum, "");
    if (y.durum !== "tamam") throw new Error(`HT rapor formatı yayınlanamadı: ${y.durum}`);
  }, { hesapId: tohum.yonetici });
  /* muhasebe (327): her proje için tamamlanmış bir plan ve imzalı raporu (imza zinciri e2e/saha-raporu'nda denenir; burada yalnız muhasebenin
     başlangıç durumu) — süper kullanıcıyla, tetiksiz, geçici veritabanı */
  if (f.kisa_ad !== E2E_FIRMA.kisaAd) continue;
  const s2 = kume.sahipIstemci();
  await s2.connect();
  try {
    await s2.query("SET session_replication_role = replica");
    const format = (await s2.query<{ id: string }>("SELECT id::text FROM rapor_format WHERE firma_id = $1 AND tur_id = $2 AND durum = 'yayinda'", [f.id, tohum.tur])).rows[0].id;
    for (const [i, proje] of (["masaustu", "tablet", "telefon"] as const).entries()) {
      const q = async (sql: string, p: unknown[]) => (await s2.query<{ id: string }>(sql, p)).rows[0].id;
      const e = await q("INSERT INTO ekipman (firma_id, tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, $4, 'Deneme') RETURNING id::text",
        [f.id, tohum.tesisMuhasebe, tohum.tur, `HT-090${i + 1}`]);
      /* tamamlanmış plan: kabul (beyanla), kontrol listesi ve bitiş damgalı (0024 plan_kabul_tutarli, plan_bitis_tutarli — tetikler kapalıyken de denetlenir) */
      const pl = await q(`INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, durum, firma_adi, acan, kabul, kabul_eden, beyan, kontrol_tamam, bitti)
        VALUES ($1, $2, $3, current_date, current_date, 'tamamlandi', $4, 'Deneme', now(), 'Deneme Denetçi', 'Deneme tarafsızlık beyanı metni.', now(), now())
        RETURNING id::text`, [f.id, E2E_MUHASEBE.plan[proje], tohum.tesisMuhasebe, E2E_PLAN.musteri]);
      const no = `${E2E_FIRMA.raporKodu}-0125-90${i + 1}-0000${i + 1}`;
      /* imzalı rapor onay damgalı (0026 rapor_onay_tutarli) */
      const r = await q(`INSERT INTO rapor (firma_id, no, plan_id, ekipman_id, tur_id, format_id, personel_id, durum, kunye, rapor_tarihi, sonuc, onay)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'imzali', '{}', current_date, 'uygun', now()) RETURNING id::text`, [f.id, no, pl, e, tohum.tur, format, tohum.denetciPersonel]);
      await s2.query(`INSERT INTO rapor_surumu (firma_id, rapor_id, revizyon, no, plan_id, ekipman_id, tur_id, format_id, tesis_id, musteri_id, imzasiz_dosya, imzali_dosya,
        imzali_sha256, imza_yontem, sonuc, kontrol_tarihi, kunye, personel, icerik) VALUES ($1, $2, 0, $3, $4, $5, $6, $7, $8, $9, gen_random_uuid(), gen_random_uuid(),
        repeat('0', 64), 'dosya', 'uygun', current_date, '{}', '{}', '{}')`, [f.id, r, no, pl, e, tohum.tur, format, tohum.tesisMuhasebe, tohum.musteri]);
    }
  } finally { await s2.end(); }
}
await havuz.end();

let kapaniyor = false;
const kapat = async (kod: number) => { if (kapaniyor) return; kapaniyor = true; await kume.durdur(); process.exit(kod); };
process.on("SIGINT", () => { void kapat(0); });
process.on("SIGTERM", () => { void kapat(0); });

const u = kume.uygulama;
/* 2026-10-05 (CI kayıtları): 180 testlik koşunun sonuna doğru geliştirme sunucusunun yığını, Next'in kendi eşiğine (bellek sınırının %80'i; sınır
   varsayılan olarak makine belleğinin yarısı) dayanıp sunucu test ortasında kendini yeniden başlatıyordu ("Server is approaching the used memory
   threshold, restarting...") — o anda koşan test düşüyordu (telefon saha raporu, tür bağlantısı). Uçtan uca sunucusuna daha geniş yığın (12 GB;
   CI makinesi 16 GB) ve webpack bellek iyileştirmesi (yalnız bu sunucu: PROBATA_WEBPACK_BELLEK, next.config.ts) */
const kod = await nextCalistir("dev", {
  NODE_OPTIONS: [process.env.NODE_OPTIONS, "--max-old-space-size=12288"].filter(Boolean).join(" "), PROBATA_WEBPACK_BELLEK: "1",
  PROBATA_VT_SUNUCU: u.host, PROBATA_VT_KAPI: String(u.port), PROBATA_VT_AD: u.database, PROBATA_VT_KULLANICI: u.user, PROBATA_VT_PAROLA: u.password,
  PROBATA_ANA_ALAN: "localhost", NEXT_TELEMETRY_DISABLED: "1", PROBATA_DEPO_KLASOR: mkdtempSync(join(tmpdir(), "probata-e2e-depo-")),
  PROBATA_SIR_ANAHTARI: randomBytes(32).toString("base64"),
}, ["--hostname", "127.0.0.1", "--port", String(E2E_KAPI)]);
await kapat(kod);
