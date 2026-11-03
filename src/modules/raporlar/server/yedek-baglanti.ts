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
