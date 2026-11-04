/* YEDEĞİN RAPORLARA BAKTIĞI TEK YER (2026-11-03; firmanın kendi yedeği — src/server/yedek/). Salt okuma, yetkisiz (gece işi ve firma yöneticisinin
   "Şimdi yedekle"si firmanın kendi işleminde çağırır; kişiye göre süzülmez — yedek firmanın bütün imzalı raporlarıdır). Verilen andan SONRA imzalanan
   sürümler: imzalı PDF + raporda GÖRÜNMEYEN dosyalar (fotoğraftan okuma için çekilen fotoğraflar, işaretli formun görüntüsü — sunum fotoğraf düzeni A:
   raporda görünen fotoğraf zaten PDF'in içinde, ayrıca gitmez). Müşteri / tesis adları Müşteriler'in okuma parçasından. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { TESIS_YER_SQL } from "../../musteriler/server/musteriler.ts";
import { FORM_DOSYA } from "./form-dosya.ts";

export interface YedekRaporu {
  surum: string; imzalandi: Date; no: string; gorunenNo: string; yil: number; musteri: string; tesis: string;
  /** imzalı PDF + raporda görünmeyen dosyalar (dosya kimliği, ne olduğu, dosya türü) */
  dosyalar: { id: string; ne: "pdf" | "okuma" | "form"; tur: string }[];
}

const ayir = (l: string[] | null, ne: "okuma" | "form") => (l ?? []).map((v) => { const [id, tur] = v.split("|") as [string, string]; return { id, ne, tur }; });

/** imzalanma anı `sonra`dan büyük sürümler, eskiden yeniye; en çok `enCok` */
export async function yedekRaporlari(db: Sorgulayici, sonra: Date | null, enCok: number): Promise<YedekRaporu[]> {
  const l = (await db.sorgu<{ id: string; rapor_id: string; no: string; revizyon: number; imzalandi: Date; yil: number; musteri: string | null; unvan: string | null;
    tesis: string | null; imzali: string; okuma: string[] | null; form: string[] | null }>(
    `SELECT s.id::text, s.rapor_id::text, s.no, s.revizyon, s.imzalandi,
       extract(year FROM coalesce(s.kontrol_tarihi, (s.imzalandi AT TIME ZONE 'Europe/Istanbul')::date))::int AS yil,
       ty.musteri, ty.unvan, ty.tesis, s.imzali_dosya::text AS imzali,
       (SELECT array_agg(d.id::text || '|' || d.tur ORDER BY f.o) FROM jsonb_array_elements(r.fotolar) WITH ORDINALITY AS f(x, o)
          JOIN dosya d ON d.id::text = f.x ->> 'dosya' WHERE (f.x ->> 'okuma')::boolean IS TRUE AND d.cop IS NULL) AS okuma,
       (SELECT array_agg(d.id::text || '|' || d.tur ORDER BY d.olustu) FROM dosya d WHERE d.modul = $3 AND d.kayit_id = s.rapor_id AND d.cop IS NULL) AS form
     FROM rapor_surumu s JOIN rapor r ON r.firma_id = s.firma_id AND r.id = s.rapor_id
       LEFT JOIN ${TESIS_YER_SQL} ty ON ty.firma_id = s.firma_id AND ty.id = s.tesis_id
     WHERE s.imzalandi > coalesce($1::timestamptz, '-infinity') ORDER BY s.imzalandi, s.id LIMIT $2`,
    [sonra, enCok, FORM_DOSYA])).rows;
  return l.map((x) => ({
    /* sürümün numarası revizyonu taşır (0027: "<no>-R<n>") — klasör raporun numarasıyla, dosya sürümünkiyle */
    surum: x.id, imzalandi: x.imzalandi, no: x.revizyon > 0 ? x.no.replace(/-R\d+$/, "") : x.no, gorunenNo: x.no, yil: x.yil,
    musteri: x.musteri || x.unvan || "Müşteri", tesis: x.tesis || "Tesis",
    dosyalar: [{ id: x.imzali, ne: "pdf" as const, tur: "application/pdf" }, ...ayir(x.okuma, "okuma"), ...ayir(x.form, "form")],
  }));
}

/** 2026-11-04 (göç 0118; reisim: "supabase de sadece 1 yıllık … rapor için gerekli eski bilgiler silinmesin"): dosyaları Supabase'ten Drive'a
    taşınabilecek raporlar — son imzası 1 yıldan eski, ekipmanın güncel raporu (ve onun takipleri) değil, dosyaları henüz taşınmamış. Her raporun
    Drive'da bulunması gereken dosyaları: sürümlerin imzalı PDF'leri + raporda görünmeyen dosyalar (okuma fotoğrafı, işaretli form). Kesin karar
    veritabanında (bekletme_sil — drive_tasinabilir); burada yalnız aday ve denetlenecek dosyalar. En eski önce, en çok `enCok`. */
export async function driveAdaylari(db: Sorgulayici, enCok: number): Promise<{ rapor: string; dosyalar: string[] }[]> {
  return (await db.sorgu<{ rapor: string; dosyalar: string[] }>(
    `WITH a AS (
       SELECT s.rapor_id, max(s.imzalandi) AS son FROM rapor_surumu s
       WHERE NOT EXISTS (SELECT 1 FROM saklama_silme k WHERE k.firma_id = s.firma_id AND k.surum_id = s.id)
       GROUP BY s.rapor_id
       HAVING (SELECT max(z.imzalandi) FROM rapor_surumu z WHERE z.firma_id = gecerli_firma() AND z.rapor_id = s.rapor_id) < now() - interval '1 year'
       ORDER BY 2 LIMIT $1 * 4)
     SELECT a.rapor_id::text AS rapor,
       (SELECT array_agg(s.imzali_dosya::text) FROM rapor_surumu s WHERE s.rapor_id = a.rapor_id
          AND NOT EXISTS (SELECT 1 FROM saklama_silme k WHERE k.firma_id = s.firma_id AND k.surum_id = s.id))
       || coalesce((SELECT array_agg(d.id::text) FROM rapor r CROSS JOIN LATERAL jsonb_array_elements(r.fotolar) AS f(x)
            JOIN dosya d ON d.id::text = f.x ->> 'dosya' WHERE r.id = a.rapor_id AND (f.x ->> 'okuma')::boolean IS TRUE AND d.cop IS NULL), '{}')
       || coalesce((SELECT array_agg(d.id::text) FROM dosya d WHERE d.modul = $2 AND d.kayit_id = a.rapor_id AND d.cop IS NULL), '{}') AS dosyalar
     FROM a
     WHERE NOT EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.rapor_id = a.rapor_id AND rapor_guncel_mu(s.id))
     ORDER BY a.son LIMIT $1`, [enCok, FORM_DOSYA])).rows;
}
