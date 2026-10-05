/* MÜŞTERİ PANELİNİN RAPORA BAKTIĞI YER (modül 17 → 14; 0030). Müşteri paneli rapor tablolarına dokunmaz: imzalı sürümleri buradan okur.
   YALNIZ müşteri işleminde çağrılır (src/server/kimlik/istek.ts musteriIslemi → veritabanında probata_musteri): hangi satırın döneceğine
   veritabanının kısıtlayıcı politikaları karar verir — kendi müşterisi, kendi tesis kapsamı, raporun SON imzalı sürümü (193), revizyonla kapanan
   uygunsuzluk değil. Burada ayrıca süzgeç yok (unutulsa da sızmaz); imzasız rapor müşteriye hiç görünmez (rapor_surumu yalnız imzalı). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekipmanlar } from "../../ekipman/server/ekipman.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface MusteriRaporu {
  /** raporun kimliği (adres; sürüm değişse de aynı) */
  id: string;
  /** imzalı sürümün numarası (revizyonda "-R1" ekiyle) */
  no: string; revizyon: number;
  /** revizyonsa yerine geçtiği önceki sürümün numarası */
  yerine: string | null;
  /** ekipmanPasif: ekipman pasife alınmış — planlanan kontrolde sonraki tarihi sayılmaz (firma tarafındaki kapsam hesabı gibi) */
  ekipmanId: string; ekipmanKod: string; ekipmanPasif: boolean; turAd: string; tesisId: string; tesis: string;
  kontrol: string | null; sonraki: string | null; sonuc: "uygun" | "uygun_degil" | null; imzalandi: string;
  /** imza günü — Türkiye takvimi (gece imzalanan rapor bir gün önce görünmesin — 319 incelemesi) */
  imzaGunu: string;
  /** imzalı PDF dosyasının kimliği (tek indirme ucundan, müşteri rolünde — kendi raporu); boyut: bayt (toplu indirmenin sınırı) */
  dosya: string; boyut: number;
}
/** kriter: kusurun ölçütü (metnin başı; 0036 — eski kayıtta null) */
export interface MusteriUygunsuzlugu { id: string; raporId: string; kaynak: string; kriter: string | null; metin: string; agir: boolean; tarih: string | null; acik: boolean }

const yerine = (no: string, revizyon: number) => (revizyon <= 0 ? null : revizyon === 1 ? no.replace(/-R\d+$/, "") : no.replace(/-R\d+$/, `-R${revizyon - 1}`));

/** müşterinin görebildiği raporlar (son imzalı sürümleri), en yeni imza üstte */
export async function musteriRaporlari(db: Sorgulayici, s: { id?: string } = {}): Promise<MusteriRaporu[]> {
  if (s.id !== undefined && !UUID.test(s.id)) return [];
  const l = (await db.sorgu<{
    rapor_id: string; no: string; revizyon: number; ekipman_id: string; tur_id: string; tesis_id: string; kontrol_tarihi: string | null; sonraki: string | null;
    sonuc: MusteriRaporu["sonuc"]; imzalandi: Date; imza_gunu: string; imzali_dosya: string; boyut: string | null;
  }>(`SELECT s.rapor_id::text, s.no, s.revizyon, s.ekipman_id::text, s.tur_id::text, s.tesis_id::text, s.kontrol_tarihi, s.sonraki, s.sonuc, s.imzalandi,
        (s.imzalandi AT TIME ZONE 'Europe/Istanbul')::date::text AS imza_gunu, s.imzali_dosya::text, d.boyut::text AS boyut
      FROM rapor_surumu s LEFT JOIN dosya d ON d.firma_id = s.firma_id AND d.id = s.imzali_dosya
      ${s.id ? "WHERE s.rapor_id = $1 " : ""}ORDER BY s.imzalandi DESC`, s.id ? [s.id] : [])).rows;
  if (!l.length) return [];
  const ek = new Map((await ekipmanlar(db, [...new Set(l.map((x) => x.ekipman_id))])).map((e) => [e.id, e]));
  const tur = new Map((await turOzetleri(db)).map((t) => [t.id, t.ad]));
  const tesis = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, t.ad] as const)));
  return l.map((x) => ({
    id: x.rapor_id, no: x.no, revizyon: x.revizyon, yerine: yerine(x.no, x.revizyon),
    ekipmanId: x.ekipman_id, ekipmanKod: ek.get(x.ekipman_id)?.kod ?? "—", ekipmanPasif: ek.get(x.ekipman_id)?.pasif ?? false, turAd: tur.get(x.tur_id) ?? "—",
    tesisId: x.tesis_id, tesis: tesis.get(x.tesis_id) ?? "—",
    kontrol: x.kontrol_tarihi, sonraki: x.sonraki, sonuc: x.sonuc, imzalandi: x.imzalandi.toISOString(), imzaGunu: x.imza_gunu, dosya: x.imzali_dosya,
    boyut: Number(x.boyut ?? 0),
  }));
}

/** müşterinin görebildiği tek rapor + o sürümün uygunsuzlukları; göremeyene null (var olduğu da söylenmez) */
export async function musteriRaporu(db: Sorgulayici, id: string): Promise<{ r: MusteriRaporu; uygunsuzluklar: MusteriUygunsuzlugu[] } | null> {
  const r = (await musteriRaporlari(db, { id }))[0];
  if (!r) return null;
  const u = (await db.sorgu<{ id: string; kaynak: string; kriter: string | null; metin: string; agir: boolean; tarih: string | null; kapanis: string | null }>(
    `SELECT u.id::text, u.kaynak, u.kriter, u.metin, u.agir, u.tarih, u.kapanis FROM uygunsuzluk u JOIN rapor_surumu s ON s.id = u.surum_id
     WHERE u.rapor_id = $1 ORDER BY u.metin`, [id])).rows;
  return { r, uygunsuzluklar: u.map((x) => ({ id: x.id, raporId: id, kaynak: x.kaynak, kriter: x.kriter, metin: x.metin, agir: x.agir, tarih: x.tarih, acik: x.kapanis === null })) };
}

/** Uygunsuzluklar sekmesinin satırı (320; maket musteri.html #/uygunsuz U_SUTUN): kusurun ekipmanı, tesisi, metni (kriter: açıklama), raporu,
    tespit (kontrol) tarihi, durumu — giderildiyse gideren kontrolün tarihi (kapatan raporun müşteriye açık SON sürümünden — 0036); raporDosya:
    raporun son imzalı PDF'i ve boyutu (toplu indirme — 321) */
export interface MusteriUygunsuzlukSatiri {
  id: string; raporId: string; raporNo: string; raporDosya: string | null; raporBoyut: number; ekipmanKod: string; turAd: string; tesisId: string; tesis: string;
  kriter: string | null; metin: string; agir: boolean; tarih: string | null; acik: boolean; giderildi: string | null;
}

/** müşterinin görebildiği uygunsuzluklar (revizyonla kapananlar hariç — veritabanı politikası), en yeni tespit üstte */
export async function musteriUygunsuzluklari(db: Sorgulayici): Promise<MusteriUygunsuzlukSatiri[]> {
  const l = (await db.sorgu<{ id: string; rapor_id: string; ekipman_id: string; tesis_id: string; kriter: string | null; metin: string; agir: boolean; tarih: string | null;
    kapanis: string | null; surum_no: string | null; kapatan_tarih: string | null }>(
    `SELECT u.id::text, u.rapor_id::text, u.ekipman_id::text, u.tesis_id::text, u.kriter, u.metin, u.agir, u.tarih, u.kapanis, s.no AS surum_no,
        k.kontrol_tarihi AS kapatan_tarih
     FROM uygunsuzluk u LEFT JOIN rapor_surumu s ON s.id = u.surum_id
       LEFT JOIN rapor_surumu k ON u.kapanis = 'giderildi' AND k.rapor_id = musteri_surum_raporu(u.kapatan_surum)
         AND (u.tarih IS NULL OR k.kontrol_tarihi IS NULL OR k.kontrol_tarihi >= u.tarih)
     ORDER BY u.tarih DESC NULLS LAST, u.olustu DESC, u.metin`)).rows;
  if (!l.length) return [];
  /* raporun görünen numarası: uygunsuzluğun kendi sürümü (müşteriye açıksa), yoksa raporun son imzalı sürümü */
  const son = new Map((await db.sorgu<{ rapor_id: string; no: string; dosya: string; boyut: string | null }>(
    `SELECT s.rapor_id::text, s.no, s.imzali_dosya::text AS dosya, d.boyut::text AS boyut
     FROM rapor_surumu s LEFT JOIN dosya d ON d.firma_id = s.firma_id AND d.id = s.imzali_dosya`)).rows.map((x) => [x.rapor_id, x]));
  const ekl = await ekipmanlar(db, [...new Set(l.map((x) => x.ekipman_id))]);
  const ek = new Map(ekl.map((e) => [e.id, e]));
  const tur = new Map((await turOzetleri(db)).map((t) => [t.id, t.ad]));
  const tesis = new Map((await musteriOzetleri(db)).flatMap((m) => m.tesisler.map((t) => [t.id, t.ad] as const)));
  return l.map((x) => {
    const e = ek.get(x.ekipman_id);
    return {
      id: x.id, raporId: x.rapor_id, raporNo: x.surum_no ?? son.get(x.rapor_id)?.no ?? "—", raporDosya: son.get(x.rapor_id)?.dosya ?? null,
      raporBoyut: Number(son.get(x.rapor_id)?.boyut ?? 0), ekipmanKod: e?.kod ?? "—", turAd: e ? tur.get(e.turId) ?? "—" : "—",
      tesisId: x.tesis_id, tesis: tesis.get(x.tesis_id) ?? "—", kriter: x.kriter, metin: x.metin, agir: x.agir, tarih: x.tarih, acik: x.kapanis === null,
      giderildi: x.kapanis === "giderildi" ? x.kapatan_tarih : null,
    };
  });
}

/** açık uygunsuzluk sayısı (panel sekmesi) */
export async function musteriAcikUygunsuzluk(db: Sorgulayici): Promise<number> {
  return (await db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM uygunsuzluk WHERE kapanis IS NULL")).rows[0].n;
}
