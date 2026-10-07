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
import { createServer } from "node:http";
import { ornekSayfa } from "../e2e/duyuru-ornek.ts";
import { E2E_FIRMA, E2E_HESAPLAR, E2E_ILK, E2E_KAPI, E2E_MUHASEBE, E2E_PAROLA, E2E_PLAN, E2E_SAHA, E2E_YONETIM, E2E_YONETIM_PROJELER, E2E_YZ, E2E_ZAMANLI_SIR } from "../e2e/hesaplar.ts";
import { planKabul, planIci } from "../src/modules/planlar/server/plan-ici.ts";
import { planAc } from "../src/modules/planlar/server/planlar.ts";
import { raporOlustur } from "../src/modules/raporlar/server/raporlar.ts";
import { ayarOku, ayarYaz } from "../src/server/ayar/ayar.ts";
import { sirYaz } from "../src/server/ayar/sir.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { taslakBaslat, yayinla, type Kisi } from "../src/modules/rapor-format/server/formatlar.ts";
import { sifrele } from "../src/server/ayar/sir.ts";
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
    /* uyarılar (331, 329–332 incelemesi): depoda, kalibrasyonu 10 gün sonra biten cihaz — Uyarılar'da "Yaklaşıyor" satırı (başka türde: saha raporunu etkilemez) */
    const uct = (await db.sorgu<{ id: string }>("INSERT INTO cihaz_turu (ad) VALUES ('Deneme Ölçer') RETURNING id::text")).rows[0].id;
    const uc = (await db.sorgu<{ id: string }>("INSERT INTO olcum_cihazi (kod, tur_id, marka, model, seri) VALUES ('UY-01', $1, 'Deneme', 'U1', 'S-UY1') RETURNING id::text", [uct])).rows[0].id;
    await db.sorgu("INSERT INTO kalibrasyon (cihaz_id, tarih, bitis, lab, sertifika, sonuc) VALUES ($1, CURRENT_DATE - 355, CURRENT_DATE + 10, 'Deneme Kalibrasyon Lab.', 'KL-0002', 'uygun')", [uc]);
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
/* fotoğraftan okuma (351): ayrı uydurma firma — yönetici, planlama, denetçi; Elektrik panosu türü ZPKR02 formatıyla yayında; tesiste proje başına bir
   ekipman, bir plan (denetçi kabul etti) ve denetçinin Yeni raporu; yapay zekâ açık, anahtar uydurma (ana anahtar bu sunucunun). Hepsi modülün
   kendi işlevleriyle (yetki, numara, denetim izi) — ham SQL yalnız kayıt tohumu. */
const sirAnahtari = randomBytes(32).toString("base64");
process.env.PROBATA_SIR_ANAHTARI = sirAnahtari;
{
  const sz = kume.sahipIstemci();
  await sz.connect();
  let yzFirma = "";
  try {
    yzFirma = (await sz.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ($1, $2, $3) RETURNING id::text",
      [E2E_YZ.firma.kisaAd, E2E_YZ.firma.ad, E2E_YZ.firma.raporKodu])).rows[0].id;
  } finally { await sz.end(); }
  const t = await kiraciIcinde(havuz, yzFirma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const k = async (h: { eposta: string; ad: string }, rol: string) => {
      const p = await q("INSERT INTO personel (ad, eposta, basla, meslek, ekipnet) VALUES ($1, $2, '2024-01-15', 'elk-muh', '123') RETURNING id::text", [h.ad, h.eposta]);
      return { p, h: await q("INSERT INTO hesap (eposta, ad, parola_ozeti, roller, durum, personel_id) VALUES ($1, $2, $3, $4, 'etkin', $5) RETURNING id::text", [h.eposta, h.ad, ozet, [rol], p]) };
    };
    const yon = await k(E2E_YZ.yonetici, "firma_yoneticisi"), pl = await k(E2E_YZ.planlama, "planlama"), den = await k(E2E_YZ.denetci, "denetci");
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta) VALUES ('YZ Deneme Sanayi A.Ş.', 'YZ Deneme', 'yz@deneme-musteri.example') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, $2, 'Deneme Cad. No 9', 'Kocaeli', 'Gebze', $3) RETURNING id::text", [m, E2E_YZ.tesis, "3".repeat(26)]);
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text");
    const ekp: Record<string, string> = {};
    for (const kod of Object.values(E2E_YZ.ekipman)) ekp[kod] = await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'Deneme') RETURNING id::text", [tesis, tur, kod]);
    return { yon, pl, den, tesis, tur, ekp };
  });
  const kim = (h: string, rol: string, ad: string): Kisi => ({ id: h, ad, roller: [rol] as Kisi["roller"] });
  const yon = kim(t.yon.h, "firma_yoneticisi", E2E_YZ.yonetici.ad), pl = kim(t.pl.h, "planlama", E2E_YZ.planlama.ad), den = kim(t.den.h, "denetci", E2E_YZ.denetci.ad);
  const kesin = <R extends { durum: string }>(r: R, ne: string) => { if (r.durum !== "tamam") throw new Error(`${ne}: ${JSON.stringify(r)}`); return r as Extract<R, { durum: "tamam" }>; };
  await kiraciIcinde(havuz, yzFirma, async (db) => {
    const f = kesin(await taslakBaslat(db, yon, t.tur, "sablon:ZPKR02", null), "ZPKR02 taslak");
    kesin(await yayinla(db, yon, f.id, f.surum, ""), "ZPKR02 yayın");
    const y = await ayarOku(db, "yapay_zeka");
    kesin(await ayarYaz(db, "yapay_zeka", y.surum, { ...y.deger, acik: true, sinir: null }, { kim: yon.ad, ne: "ayar.yapay_zeka" }), "yapay zekâ ayarı");
    await sirYaz(db, "yapay_zeka_anahtari", E2E_YZ.anahtar, { kim: yon.ad });
  }, { hesapId: yon.id });
  const bugun = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const depoYz = klasorDepo(mkdtempSync(join(tmpdir(), "probata-e2e-yz-depo-")));
  const plan = kesin(await kiraciIcinde(havuz, yzFirma, (db) => planAc(db, depoYz, pl, yzFirma,
    { tesis: t.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: t.den.p, isgNo: "ISG-YZ-1", kaydet: false }] }), { hesapId: pl.id }), "plan").id;
  const v = (await kiraciIcinde(havuz, yzFirma, (db) => planIci(db, den, plan), { hesapId: den.id }))!;
  kesin(await kiraciIcinde(havuz, yzFirma, (db) => planKabul(db, den, plan, v.surum, true), { hesapId: den.id }), "plan kabul");
  for (const id of Object.values(t.ekp)) kesin(await kiraciIcinde(havuz, yzFirma, (db) => raporOlustur(db, den, plan, id), { hesapId: den.id }), "rapor");
}
await havuz.end();

/* yerel Anthropic taklidi (351; 354): yalnız bu sunucunun uydurma anahtarını kabul eder. Gerçek hizmet gibi (Opus 5.5 / Sonnet 5.5) zorunlu araç
   seçimini (tool_choice "tool" / "any") 400 ile reddeder — 350–351 incelemesi: eski istek canlıda her okumada düşüyordu, taklit bunu görmüyordu.
   Yapılandırılmış çıktı istenmeliyse (output_config.format json_schema) metin bloğunda JSON ile üç satır döner (biri emin değil). */
const yzTaklit = createServer((istek, yanit) => {
  /* 379: Bakanlık duyuru sayfalarının UYDURMA taklidi (PROBATA_DUYURU_UC; e2e/duyuru-ornek.ts) — gerçek siteye istek gitmez */
  const duyuruSayfasi = istek.method === "GET" ? ornekSayfa(istek.url ?? "") : null;
  if (duyuruSayfasi) { yanit.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(duyuruSayfasi); return; }
  let govde = ""; istek.on("data", (p) => { govde += p; }).on("end", () => {
    if (istek.url !== "/v1/messages" || istek.headers["x-api-key"] !== E2E_YZ.anahtar) { yanit.writeHead(401).end("{}"); return; }
    let g: { tool_choice?: { type?: string }; output_config?: { format?: { type?: string; schema?: { properties?: { satirlar?: { items?: { properties?: { tip?: { anyOf?: { enum?: string[] }[] } } } } } } } } };
    try { g = JSON.parse(govde); } catch { yanit.writeHead(400).end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "invalid json" } })); return; }
    if (g.tool_choice?.type === "tool" || g.tool_choice?.type === "any") {
      yanit.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: 'tool_choice: type "tool" and "any" are not supported for this model.' } }));
      return;
    }
    if (g.output_config?.format?.type !== "json_schema") {
      yanit.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "taklit: yapılandırılmış çıktı bekleniyor" } }));
      return;
    }
    const tip = g.output_config.format.schema?.properties?.satirlar?.items?.properties?.tip?.anyOf?.[0]?.enum?.[0] ?? "C";
    const satirlar = [
      { no: "F1", devre: "Aydınlatma", tip, akim: 16, kutup: 1, guven: "yuksek" },
      { no: "F2", devre: "Priz", tip, akim: 20, kutup: 3, guven: "yuksek" },
      { no: "F3", devre: "Klima", akim: 25, guven: "dusuk" },
    ];
    yanit.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({
      content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify({ satirlar, not: null }) }],
      stop_reason: "end_turn",
      usage: { input_tokens: 1500, output_tokens: 200 },
    }));
  });
});
const yzKapi = await bosKapi();
await new Promise<void>((coz) => yzTaklit.listen(yzKapi, "127.0.0.1", coz));

/* yönetim (348): ana anahtar bu sunucuya özgü (yukarıda — doğrulama anahtarı onunla şifrelenir); proje (genişlik) başına bir "ilk" yönetici (geçici parola —
   ilk kurulum adımı) ve bir kurulmuş yönetici (doğrulama kodu adımı), hazırlık için ayrı bir kurulmuş yönetici (e2e/hazirla.ts sayfaları derlerken onun kodunu kullanır:
   testteki yöneticinin aynı zaman adımındaki kodu "yeniden oynatma" sayılmasın). Hepsi uydurma, süper kullanıcıyla, geçici veritabanı. */
const sy = kume.sahipIstemci();
await sy.connect();
try {
  const gecici = await parolaOzeti(E2E_YONETIM.geciciParola);
  for (const p of E2E_YONETIM_PROJELER) {
    await sy.query("INSERT INTO yonetici (eposta, ad, parola_ozeti, durum) VALUES ($1, 'Deneme İlk Yönetici', $2, 'ilk')", [E2E_YONETIM.proje(p).ilk, gecici]);
  }
  for (const eposta of [...E2E_YONETIM_PROJELER.map((p) => E2E_YONETIM.proje(p).etkin), E2E_YONETIM.hazirla]) {
    const id = (await sy.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti) VALUES ($1, 'Deneme Yönetici', $2) RETURNING id::text", [eposta, ozet])).rows[0].id;
    await sy.query("UPDATE yonetici SET totp_sir = $2, durum = 'etkin' WHERE id = $1",
      [id, sifrele(E2E_YONETIM.anahtar, "yonetim", `totp:${id}`, Buffer.from(sirAnahtari, "base64"))]);
  }
} finally { await sy.end(); }

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
  PROBATA_DEPO: "vt",   // 347: uçtan uca deneme yayınındaki gibi veritabanı deposuyla
  PROBATA_SIR_ANAHTARI: sirAnahtari,
  PROBATA_YONETIM_ALAN: E2E_YONETIM.alan,   // 348: yönetim sayfası yalnız bu adreste
  PROBATA_YZ_UC: `http://127.0.0.1:${yzKapi}`,   // 351: yerel Anthropic taklidi
  CRON_SECRET: E2E_ZAMANLI_SIR,   // 378: gece işi ucu (uydurma sır)
  PROBATA_DUYURU_UC: `http://127.0.0.1:${yzKapi}`,   // 379: duyuru sayfalarının yerel taklidi
}, ["--hostname", "127.0.0.1", "--port", String(E2E_KAPI)]);
await kapat(kod);
