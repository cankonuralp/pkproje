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
import { E2E_FIRMA, E2E_HESAPLAR, E2E_ILK, E2E_KAPI, E2E_PAROLA, E2E_PLAN, E2E_SAHA } from "../e2e/hesaplar.ts";
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
    return { yonetici: kisiler.yonetici!.hesap, tur: u };
  });
  /* HT'nin rapor formatı: hazır şablon KOMPRESOR → taslak → yayında (Rapor formatı modülünün işlevleri; yayınlayan yönetici, veritabanı damgası) */
  await kiraciIcinde(havuz, f.id, async (db) => {
    const kim: Kisi = { id: tohum.yonetici, ad: E2E_HESAPLAR.yonetici.ad, roller: E2E_HESAPLAR.yonetici.roller };
    const t = await taslakBaslat(db, kim, tohum.tur, "sablon:KOMPRESOR", null);
    if (t.durum !== "tamam") throw new Error(`HT rapor formatı taslağı açılamadı: ${t.durum}`);
    const y = await yayinla(db, kim, t.id, t.surum, "");
    if (y.durum !== "tamam") throw new Error(`HT rapor formatı yayınlanamadı: ${y.durum}`);
  }, { hesapId: tohum.yonetici });
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
