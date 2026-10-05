/* TEKLİFLER ↔ SÖZLEŞMELER BAĞLANTISI (modül 12 → 11; 326 — maket sozlesmeler.html "Dayanak teklif — kabul edilen teklif; fiyatlar oradan").
   Sözleşmeler teklif tablolarına dokunmaz; kabul edilmiş teklifleri (müşterisi, tesisleri) ve bir teklifin numarasını buradan okur. Yetki
   ÇAĞIRANDA. Ayrı dosya: teklifler.ts Sözleşmeler'in yetkisini içe aktarır (döngü olmasın). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface KabulTeklifi { id: string; no: string; musteriId: string; tarih: string; tesisler: string[] }

/** kayıtlı müşterili kabul edilmiş teklifler (en yeni üstte); id verilirse yalnız o */
export async function kabulTeklifleri(db: Sorgulayici, id?: string): Promise<KabulTeklifi[]> {
  if (id !== undefined && !UUID.test(id)) return [];
  const l = (await db.sorgu<{ id: string; no: string; musteri_id: string; tarih: string; tesisler: string[] | null }>(
    `SELECT t.id::text, t.no, t.musteri_id::text, t.tarih::text,
        (SELECT array_agg(s.tesis_id::text ORDER BY s.sira) FROM teklif_tesis s WHERE s.firma_id = t.firma_id AND s.teklif_id = t.id) AS tesisler
     FROM teklif t WHERE t.durum = 'kabul' AND t.musteri_id IS NOT NULL${id ? " AND t.id = $1" : ""} ORDER BY t.tarih DESC, t.no DESC`, id ? [id] : [])).rows;
  return l.map((x) => ({ id: x.id, no: x.no, musteriId: x.musteri_id, tarih: x.tarih, tesisler: x.tesisler ?? [] }));
}

/** teklif numaraları (sözleşme sayfası / listesi "Dayanak teklif") */
export async function teklifNumaralari(db: Sorgulayici, idler: readonly string[]): Promise<Map<string, string>> {
  const l = [...new Set(idler.filter((x) => UUID.test(x)))];
  if (!l.length) return new Map();
  return new Map((await db.sorgu<{ id: string; no: string }>("SELECT id::text, no FROM teklif WHERE id = ANY ($1::uuid[])", [l])).rows.map((x) => [x.id, x.no]));
}
