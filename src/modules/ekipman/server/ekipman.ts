/* EKİPMAN — tesisin KALICI ekipman kaydı (modül 7; ayrı ekran değil, planın içinde — reisim 2026-09-26; göç 0023). Kod firmada eşsiz, eski kod
   başkasına verilmez (veritabanı). Bu modül öteki modüllere OKUMA ve YAZMA işlevi açar; yetki ÇAĞIRANDA (Planlar: plan içinde ekle / pasife al).
   Yazmalar güvenli yazıcıdan, denetim izine. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type GuncelleSonucu, type Iz } from "../../../server/db/yazici.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EKIPMAN = tablo({ ad: "ekipman", sutunlar: ["tesis_id", "tur_id", "kod", "konum", "marka", "model", "seri", "imal", "dis_kontrol", "dis_sonuc", "pasif", "ekleyen"] });

export interface EkipmanOzeti {
  id: string; kod: string; turId: string; tesisId: string; konum: string | null; seri: string | null;
  /** sistem öncesi son kontrol (Excel'den); sistemdeki son rapor Raporlar kalemiyle eklenir */
  disKontrol: string | null; disSonuc: string | null; pasif: boolean; surum: number;
}
type Satir = { id: string; kod: string; tur_id: string; tesis_id: string; konum: string | null; seri: string | null; dis_kontrol: string | null; dis_sonuc: string | null; pasif: Date | null; surum: number };
const SEC = "SELECT id::text, kod, tur_id::text, tesis_id::text, konum, seri, dis_kontrol::text, dis_sonuc, pasif, surum FROM ekipman";
const ozet = (x: Satir): EkipmanOzeti => ({ id: x.id, kod: x.kod, turId: x.tur_id, tesisId: x.tesis_id, konum: x.konum, seri: x.seri, disKontrol: x.dis_kontrol, disSonuc: x.dis_sonuc, pasif: !!x.pasif, surum: x.surum });

/** tesisin ekipmanları (pasifler dahil, işaretli). Yetki ÇAĞIRANDA. */
export async function tesisEkipmanlari(db: Sorgulayici, tesisId: string): Promise<EkipmanOzeti[]> {
  if (!UUID.test(tesisId)) return [];
  return (await db.sorgu<Satir>(`${SEC} WHERE tesis_id = $1 ORDER BY kod`, [tesisId])).rows.map(ozet);
}

/** kimlikleri verilen ekipmanlar (bu firmada olmayan görünmez). Yetki ÇAĞIRANDA. */
export async function ekipmanlar(db: Sorgulayici, idler: readonly string[]): Promise<EkipmanOzeti[]> {
  const l = idler.filter((x) => UUID.test(x));
  if (!l.length) return [];
  return (await db.sorgu<Satir>(`${SEC} WHERE id = ANY ($1::uuid[]) ORDER BY kod`, [l])).rows.map(ozet);
}

/** kodun firmadaki sahibi: şu anki kodu ya da eski kodu (geçmiş) olan ekipman; yoksa null. Yetki ÇAĞIRANDA. */
export async function koduKullanan(db: Sorgulayici, kod: string): Promise<{ ekipman: EkipmanOzeti; eski: boolean } | null> {
  const simdiki = (await db.sorgu<Satir>(`${SEC} WHERE kod = $1`, [kod])).rows[0];
  if (simdiki) return { ekipman: ozet(simdiki), eski: false };
  const g = (await db.sorgu<Satir>(`${SEC} WHERE id = (SELECT ekipman_id FROM ekipman_kodu WHERE kod = $1)`, [kod])).rows[0];
  return g ? { ekipman: ozet(g), eski: true } : null;
}

/** yeni ekipman (kod ve biçim çağıranda doğrulanmış; eşsizlik veritabanında da). Yetki ÇAĞIRANDA. */
export async function ekipmanEkle(db: Sorgulayici, iz: Iz, e: { tesisId: string; turId: string; kod: string; seri: string | null; konum: string | null }): Promise<string> {
  const r = await ekle(db, EKIPMAN, { tesis_id: e.tesisId, tur_id: e.turId, kod: e.kod, seri: e.seri, konum: e.konum, ekleyen: iz.kim }, iz);
  return r.id;
}

/** pasife al / etkinleştir (silinmez; geri alınabilir). Yetki ÇAĞIRANDA. */
export async function ekipmanPasif(db: Sorgulayici, iz: Iz, id: string, surum: number, pasif: boolean): Promise<GuncelleSonucu> {
  return guncelle(db, EKIPMAN, id, surum, { pasif: pasif ? new Date() : null }, iz);
}

/** Raporlar için: ekipmanın etiket bilgileri (raporun ekipman bölümünün başlangıç değeri); yoksa null. Yetki ÇAĞIRANDA. */
export async function ekipmanEtiketi(db: Sorgulayici, id: string): Promise<{ id: string; kod: string; turId: string; tesisId: string; pasif: boolean; marka: string | null;
  model: string | null; seri: string | null; imal: number | null; konum: string | null; disKontrol: string | null; disSonuc: string | null } | null> {
  if (!UUID.test(id)) return null;
  const x = (await db.sorgu<{ id: string; kod: string; tur_id: string; tesis_id: string; pasif: Date | null; marka: string | null; model: string | null; seri: string | null;
    imal: number | null; konum: string | null; dis_kontrol: string | null; dis_sonuc: string | null }>(
    "SELECT id::text, kod, tur_id::text, tesis_id::text, pasif, marka, model, seri, imal, konum, dis_kontrol::text, dis_sonuc FROM ekipman WHERE id = $1", [id])).rows[0];
  return x ? { id: x.id, kod: x.kod, turId: x.tur_id, tesisId: x.tesis_id, pasif: !!x.pasif, marka: x.marka, model: x.model, seri: x.seri, imal: x.imal, konum: x.konum,
    disKontrol: x.dis_kontrol, disSonuc: x.dis_sonuc } : null;
}

/** ekipmanın satırını işlem sonuna dek kilitler: pasife alma ile rapor oluşturma sıraya girer (biri ötekinin sonucunu görür). Yetki ÇAĞIRANDA. */
export async function ekipmanKilitle(db: Sorgulayici, id: string): Promise<void> {
  if (UUID.test(id)) await db.sorgu("SELECT 1 FROM ekipman WHERE id = $1 FOR UPDATE", [id]);
}

/** Teklifler için ("tesisteki ekipmandan doldur" — maket teklifler.html doldur): tesis × tür başına ETKİN ekipman sayısı. Yetki ÇAĞIRANDA. */
export async function tesisTurSayilari(db: Sorgulayici, tesisler: readonly string[]): Promise<{ tesisId: string; turId: string; adet: number }[]> {
  const l = tesisler.filter((x) => UUID.test(x));
  if (!l.length) return [];
  return (await db.sorgu<{ tesis_id: string; tur_id: string; adet: number }>(
    "SELECT tesis_id::text, tur_id::text, count(*)::int AS adet FROM ekipman WHERE pasif IS NULL AND tesis_id = ANY ($1::uuid[]) GROUP BY 1, 2", [l])).rows
    .map((x) => ({ tesisId: x.tesis_id, turId: x.tur_id, adet: x.adet }));
}
