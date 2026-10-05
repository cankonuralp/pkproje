/* MÜŞTERİ PANELİNİN SÖZLEŞMEYE BAKTIĞI YER (modül 17 → 12; 0034). Müşteri paneli sözleşme tablolarına dokunmaz: sözleşmeleri buradan okur.
   YALNIZ müşteri işleminde çağrılır (src/server/kimlik/istek.ts musteriIslemi → veritabanında probata_musteri): müşteri rolü sözleşmenin yalnız
   numara, dönem, müşteri imza tarihi ve imzalı PDF sütunlarını okuyabilir; hangi sözleşmenin ve kapsamdaki hangi tesislerin döneceğine
   veritabanı politikası karar verir (kendi müşterisi, tesis kapsamı). Panelden imza atılmaz (karar 134). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** durum (maket SOZ_DURUM): imza bekliyor · yürürlükte · süresi doldu */
export type MusteriSozlesmeDurumu = "imza" | "yururlukte" | "suresi";
export interface MusteriSozlesmesi {
  id: string; no: string; baslangic: string; bitis: string; musteriImza: string | null; dosya: string | null; tesisler: string[]; durum: MusteriSozlesmeDurumu;
}

/** müşterinin görebildiği sözleşmeler (kapsamdaki tesisleri yalnız görebildikleri), en yeni başlangıç üstte; id verilirse yalnız o */
export async function musteriSozlesmeleri(db: Sorgulayici, bugun: string, s: { id?: string } = {}): Promise<MusteriSozlesmesi[]> {
  if (s.id !== undefined && !UUID.test(s.id)) return [];
  const l = (await db.sorgu<{ id: string; no: string; baslangic: string; bitis: string; musteri_imza: string | null; imzali_dosya: string | null }>(
    `SELECT id::text, no, baslangic::text, bitis::text, musteri_imza::text, imzali_dosya::text FROM is_sozlesmesi${s.id ? " WHERE id = $1" : ""}
     ORDER BY baslangic DESC, no DESC`, s.id ? [s.id] : [])).rows;
  if (!l.length) return [];
  const kapsam = (await db.sorgu<{ sozlesme_id: string; tesis_id: string }>("SELECT sozlesme_id::text, tesis_id::text FROM is_sozlesmesi_tesis WHERE sozlesme_id = ANY ($1::uuid[])",
    [l.map((x) => x.id)])).rows;
  return l.map((x) => ({
    id: x.id, no: x.no, baslangic: x.baslangic, bitis: x.bitis, musteriImza: x.musteri_imza, dosya: x.imzali_dosya,
    tesisler: kapsam.filter((k) => k.sozlesme_id === x.id).map((k) => k.tesis_id),
    durum: !x.musteri_imza ? "imza" : x.bitis < bugun ? "suresi" : "yururlukte",
  }));
}
