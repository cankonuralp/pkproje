/* SAĞLIK DENETİMİ OKUYUCUSU (350; 09-G5) — saglik_denetimi() (0051, ikinci hâli 0053): yalnız sayılar ve son göçün adı (firma verisi yok). Uygulama rolüyle, kiracı
   bağlamı gerekmez (işlev tanımlayıcının haklarıyla şema bilgisini okur). pg yalnız src/server/db'de.
   FIRMA-VT FV7 (2026-10-15, "sağlık her projede"):
   · firmaSaglikOku: aynı denetim FİRMANIN veritabanında — kiracı işleminde (kiraciIcinde: vt_firma_dogrula ayarla aynı sorguda; bağlanılan veritabanı
     bu firmanın değilse 42501 — yanlış veritabanının göçü "güncel" sayılmaz), SALT OKUNUR, sorgu sunucuda süre sınırlı (statement_timeout, işlemle düşer);
   · projeHedefleri: kendi projeli firmaların bağlantı kayıtları (goc_hedefleri, 0096) — merkezOku içinde (READ ONLY + vt_merkez_dogrula: havuz merkezi
     göstermiyorsa RED), işlev yalnız yönetim rolünde çağrılabildiği için işlem içinde yönetim rolüne geçilir (0050; yönetici gerekmez). Şifreli parola
     ŞİFRELİ gelir, çözme src/server/db/baglanti.ts kayittanBaglanti'da. Sorgu sunucuda süre sınırlı (statement_timeout, işlemle düşer);
   · baglantidanSaglikOku: kayıttan kurulan bağlantıyla (yalnız uygulama rolü) kısa ömürlü tek bağlantılı havuz, işi bitince kapanır — istek havuzlarını
     (firma-havuzu.ts) yoklama için büyütmez;
   · sonSaglikYaz: yoklamanın sonucu merkezde firma_vt.son_saglik / son_saglik_zaman; sorgu sunucuda süre sınırlı. Yönetim rolü firma_vt'yi OKUR (bütün
     sütunlar — 0096 GRANT SELECT) ve UPDATE hakkı yalnız son_goc / goc_sayisi / son_saglik / son_saglik_zaman sütunlarındadır; bu modül yalnız
     son_saglik / son_saglik_zaman yazar (2026-10-15, FV7 incelemesi: önceki yorum "yalnız bu iki sütuna hakkı var" diyordu — yanlıştı). Sonuç sırsız
     nesne (src/server/saglik.ts FirmaSagligi). */
import pg from "pg";
import { havuzHatasiniDinle, havuzSecenekleri, kiraciIcinde, yonetimIcinde, type Havuz, type UygulamaBaglantisi } from "./kiraci.ts";
import type { FirmaVtKaydi } from "./baglanti.ts";
import { merkezOku } from "./merkez.ts";

export interface SaglikVerisi {
  son_goc: string | null;
  /** uygulanmış göç sayısı (0053) */
  goc_sayisi: number;
  kiraci_tablo: number;
  rls_eksik: number;
  politikasiz: number;
  api_sema: boolean;
  uygulama_ayricalikli: boolean;
  /** 1 saatten uzun "çalışıyor"da kalan arka plan işi (383; 0072 is_denetimi) */
  takili_is: number;
}

const SAGLIK_SQL = "SELECT saglik_denetimi() || is_denetimi() AS s";

export async function saglikOku(havuz: Havuz): Promise<SaglikVerisi> {
  return (await havuz.query<{ s: SaglikVerisi }>(SAGLIK_SQL)).rows[0].s;
}

/** sorgunun sunucudaki süre sınırı (ms; tam sayı, 100–60 000) — set_config'in metin değeri */
const sureMetni = (ms: number): string => String(Math.min(60_000, Math.max(100, Math.floor(ms))));

/** FV7: firmanın veritabanında sağlık — kiracı işleminde (vt_firma_dogrula: veritabanı bu firmanın değilse 42501), salt okunur, sunucuda süre sınırlı */
export async function firmaSaglikOku(havuz: Havuz, firmaId: string, sureMs: number): Promise<SaglikVerisi> {
  return kiraciIcinde(havuz, firmaId, async (db) => {
    await db.sorgu("SET TRANSACTION READ ONLY");
    await db.sorgu("SELECT set_config('statement_timeout', $1, true)", [sureMetni(sureMs)]);
    return (await db.sorgu<{ s: SaglikVerisi }>(SAGLIK_SQL)).rows[0]!.s;
  });
}

/** yoklanacak proje: kendi projeli firma (goc_hedefleri — göç dışı olanlar yok); kayıt yalnız bağlantı alanları tamsa */
export interface ProjeHedefi {
  firmaId: string;
  /** kurulum "tamam" mı (değilse yoklanmaz: uygulama parolası / havuzcu henüz yok — FV10) */
  kurulumTamam: boolean;
  /** bağlantı kaydı (parola ŞİFRELİ); sunucu / kapı / ad / kullanıcı / parola eksikse null */
  kayit: FirmaVtKaydi | null;
}

interface HedefSatiri {
  firma_id: string; ref: string | null; sunucu: string | null; kapi: number | null; vt_ad: string | null; kullanici: string | null;
  parola_sifreli: string | null; surum: number; kurulum_durum: string | null;
}
const HEDEFLER_SQL = `SELECT firma_id::text, ref, sunucu, kapi, vt_ad, kullanici, parola_sifreli, surum, kurulum_durum
  FROM goc_hedefleri()`;

/** FV7: yoklanacak projeler — merkezde (vt_merkez_dogrula), salt okunur, işlem içinde yönetim rolüyle (goc_hedefleri yalnız onda), sunucuda süre sınırlı */
export async function projeHedefleri(merkez: Havuz, sureMs: number): Promise<ProjeHedefi[]> {
  const satirlar = await merkezOku(merkez, async (db) => {
    await db.sorgu("SET LOCAL ROLE probata_yonetim");
    await db.sorgu("SELECT set_config('statement_timeout', $1, true)", [sureMetni(sureMs)]);
    return (await db.sorgu<HedefSatiri>(HEDEFLER_SQL)).rows;
  });
  return satirlar.map((h) => ({
    firmaId: h.firma_id,
    kurulumTamam: h.kurulum_durum === "tamam",
    kayit: h.sunucu && h.kapi !== null && h.vt_ad && h.kullanici && h.parola_sifreli
      ? { firmaId: h.firma_id, ref: h.ref, sunucu: h.sunucu, kapi: h.kapi, vtAd: h.vt_ad, kullanici: h.kullanici, parolaSifreli: h.parola_sifreli, depo: null, surum: h.surum }
      : null,
  }));
}

/** FV7: denetlenmiş bağlantı ayarıyla (baglanti.ts kayittanBaglanti — izin listesi, TLS, yalnız uygulama rolü) firmanın veritabanında sağlık: tek
    bağlantılı kısa ömürlü havuz; bağlanma ve sorgu istemcide de süre sınırlı (ağ asılırsa); havuz iş bitince kapanır (kapanışı en çok 1 sn beklenir —
    süre sınırı sorguyu zaten bitirir). */
export async function baglantidanSaglikOku(ayar: UygulamaBaglantisi, firmaId: string, sureMs: number): Promise<SaglikVerisi> {
  const ms = Math.max(100, Math.floor(sureMs));
  const havuz = new pg.Pool({ ...havuzSecenekleri({ ...ayar, enCok: 1 }), connectionTimeoutMillis: ms, query_timeout: ms });
  havuzHatasiniDinle(havuz);
  try {
    return await firmaSaglikOku(havuz, firmaId, ms);
  } finally {
    await Promise.race([havuz.end().catch(() => {}), new Promise((coz) => setTimeout(coz, 1_000).unref())]);
  }
}

/** FV7: yoklama sonuçları merkezde firma_vt.son_saglik / son_saglik_zaman (tek işlem; yönetim rolü, yöneticisiz; sunucuda süre sınırlı). Dönen:
    güncellenen satır sayısı. */
export async function sonSaglikYaz(merkez: Havuz, sonuclar: readonly { firmaId: string; son: Record<string, unknown> }[], sureMs: number): Promise<number> {
  if (!sonuclar.length) return 0;
  const veri = JSON.stringify(sonuclar.map((s) => ({ firma_id: s.firmaId, s: s.son })));
  return yonetimIcinde(merkez, async (db) => {
    await db.sorgu("SELECT set_config('statement_timeout', $1, true)", [sureMetni(sureMs)]);
    return (await db.sorgu(
      `UPDATE firma_vt v SET son_saglik = x.s, son_saglik_zaman = now()
         FROM jsonb_to_recordset($1::jsonb) AS x(firma_id uuid, s jsonb)
        WHERE v.firma_id = x.firma_id`, [veri])).rowCount ?? 0;
  });
}
