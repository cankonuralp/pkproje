/* SAKLAMA SÜRESİ (387; KOD-GECIS ENGEL 11 "bizim kod imzalı rapor PDF'lerini saklama süresi (en az 5 yıl; firma 6–20 yıla uzatabilir) dolmadan
   silmez; süre dolunca depodan siler (30 gün önce firma yöneticisine liste)", ARKA-UC §7; göç 0073). Silinme zamanı ve koruma VERİTABANINDA
   (saklama_bitisi, saklama_sil, dosya_saklama_koru): burada yalnız adayları bulmak, gece işini koşturmak ve listelemek var.
   · Gece işi (saklamaIsi): süresi dolan her imzalı sürümün imzalı PDF'i ve imzaya hazırlanan PDF'i silinir — dosya satırı (saklama_sil) ve
     depodaki nesne; sürümün kaydı (künye, içerik, uygunsuzluklar) kalır, silme saklama_silme'ye yazılır. En eski önce, koşu başına sınırlı.
   · Liste (saklamaListesi): süresi SAKLAMA_ONCE_GUN içinde dolacaklar (firma yöneticisine — yetki çağıranda: Firma ayarları, Uyarılar).
   Aylık arşiv yedeği henüz yok (yedek işi firmanın deposuyla, K7) — gelince aynı süreyle buraya eklenir. */
import type { Havuz, Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { firmalardaKos, type IsOzeti } from "../../../server/is/firmalar.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";

/** silinecekler bu kadar gün önce listelenir */
export const SAKLAMA_ONCE_GUN = 30;
/** gece işi koşu başına en çok bu kadar sürüm siler (kalan sonraki gece) */
export const SAKLAMA_ADET = 200;

interface Aday { surum: string; rapor: string; no: string; musteri: string; tesis: string; dosya: string; imza_gunu: string; bitis: Date; bitis_gunu: string; gecti: boolean }

/** süresi şu andan $1 gün sonrasına kadar dolan, silinmemiş imzalı sürümler. Ön süzgeç dizinle: süre en az 5 yıl olduğundan imzası bu sınırdan
    (artık gün payıyla) yeni olan aday olamaz; kesin karar saklama_bitisi'nde (silme de aynı işlevle karar verir) */
const ADAY = `FROM rapor_surumu s CROSS JOIN LATERAL (SELECT saklama_bitisi(s.firma_id, s.imzalandi) AS bitis) b
  WHERE s.imzalandi <= now() + make_interval(days => $1) - interval '5 years' + interval '2 days'
    AND b.bitis <= now() + make_interval(days => $1)
    AND NOT EXISTS (SELECT 1 FROM saklama_silme k WHERE k.firma_id = s.firma_id AND k.surum_id = s.id)`;
const GUN = (x: string) => `(${x} AT TIME ZONE 'Europe/Istanbul')::date::text`;

/** en erken dolan önce */
async function adaylar(db: Sorgulayici, gun: number, adet: number): Promise<Aday[]> {
  return (await db.sorgu<Aday>(
    `SELECT s.id::text AS surum, s.rapor_id::text AS rapor, s.no, s.musteri_id::text AS musteri, s.tesis_id::text AS tesis, s.imzali_dosya::text AS dosya,
       ${GUN("s.imzalandi")} AS imza_gunu, b.bitis, ${GUN("b.bitis")} AS bitis_gunu, b.bitis <= now() AS gecti
     ${ADAY} ORDER BY b.bitis, s.no LIMIT $2`, [gun, adet])).rows;
}

export interface SaklamaTemizligi { silinen: number; dosya: number; bayt: number; kalan: boolean }

/** oturumdaki firmada süresi dolanları siler (gece işinin firma adımı) */
export async function saklamaTemizle(db: Sorgulayici, depo: Depo, adet = SAKLAMA_ADET): Promise<SaklamaTemizligi> {
  const l = await adaylar(db, 0, adet + 1);
  const s: SaklamaTemizligi = { silinen: 0, dosya: 0, bayt: 0, kalan: l.length > adet };
  for (const x of l.slice(0, adet)) {
    const anahtarlar = (await db.sorgu<{ a: string[] | null }>("SELECT saklama_sil($1) AS a", [x.surum])).rows[0].a;
    if (!anahtarlar) continue;   // bu arada süre uzatıldı
    for (const k of anahtarlar) await depo.copSil(k, db);
    s.silinen++;
    s.dosya += anahtarlar.length;
    s.bayt += Number((await db.sorgu<{ b: string }>("SELECT bayt::text AS b FROM saklama_silme WHERE surum_id = $1", [x.surum])).rows[0]?.b ?? 0);
  }
  return s;
}

export type SaklamaOzeti = IsOzeti<{ silinen: number; dosya: number; bayt: number }>;

/** gece işi: bütün etkin firmalarda (her biri kendi işleminde), iş kaydı "saklama_silme" */
export async function saklamaIsi(havuz: Havuz, depo: Depo, sure: number): Promise<SaklamaOzeti> {
  return firmalardaKos(havuz, "saklama_silme", sure, { silinen: 0, dosya: 0, bayt: 0 }, async (db) => {
    const r = await saklamaTemizle(db, depo);
    return { sayilar: { silinen: r.silinen, dosya: r.dosya, bayt: r.bayt }, kalan: r.kalan };
  });
}

export interface SaklamaSatiri {
  surumId: string; raporId: string; no: string; musteri: string; tesis: string;
  /** imzalı PDF (silinmeden önce indirilebilir) */
  dosya: string;
  imzaGunu: string;
  /** süre dolan an (ISO) ve Türkiye takvimiyle günü; geçtiyse ilk gece işinde silinir */
  bitis: string; bitisGunu: string; gecti: boolean;
}

/** liste sınırı (ekranda; daha fazlası "ilk n" diye söylenir) */
export const SAKLAMA_LISTE_SINIR = 2000;

/** süresi SAKLAMA_ONCE_GUN içinde dolacak imzalı sürümler. Yetki ÇAĞIRANDA (firma yöneticisi). */
export async function saklamaListesi(db: Sorgulayici, sinir = SAKLAMA_LISTE_SINIR): Promise<{ yil: number; liste: SaklamaSatiri[]; fazla: boolean }> {
  const yil = (await db.sorgu<{ y: number }>("SELECT saklama_yili(gecerli_firma()) AS y")).rows[0].y;
  const l = await adaylar(db, SAKLAMA_ONCE_GUN, sinir + 1);
  if (!l.length) return { yil, liste: [], fazla: false };
  const m = await musteriOzetleri(db);
  const mad = new Map(m.map((x) => [x.id, x.kisa]));
  const tad = new Map(m.flatMap((x) => x.tesisler.map((t) => [t.id, t.ad] as const)));
  return {
    yil, fazla: l.length > sinir,
    liste: l.slice(0, sinir).map((x) => ({
      surumId: x.surum, raporId: x.rapor, no: x.no, musteri: mad.get(x.musteri) ?? "—", tesis: tad.get(x.tesis) ?? "—", dosya: x.dosya,
      imzaGunu: x.imza_gunu, bitis: x.bitis.toISOString(), bitisGunu: x.bitis_gunu, gecti: x.gecti,
    })),
  };
}

/** Uyarılar için: silinecekler süre dolan güne göre toplanmış (gün, rapor sayısı, hepsinin süresi geçti mi). Yetki ÇAĞIRANDA. */
export async function saklamaGunleri(db: Sorgulayici): Promise<{ gun: string; adet: number; gecti: boolean }[]> {
  return (await db.sorgu<{ gun: string; adet: number; gecti: boolean }>(
    `SELECT ${GUN("b.bitis")} AS gun, count(*)::int AS adet, bool_and(b.bitis <= now()) AS gecti ${ADAY} GROUP BY 1 ORDER BY 1`, [SAKLAMA_ONCE_GUN])).rows;
}

/** rapor ekranı için: imzalı sürümün PDF'i saklama süresi dolduğu için silindiyse silinme zamanı (ISO), değilse null */
export async function saklamaSilindi(db: Sorgulayici, surumId: string): Promise<string | null> {
  const x = (await db.sorgu<{ silindi: Date }>("SELECT silindi FROM saklama_silme WHERE surum_id = $1", [surumId])).rows[0];
  return x ? x.silindi.toISOString() : null;
}
