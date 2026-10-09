/* E-POSTA KUYRUĞU (432; göç 0077) — sistemden giden her e-posta önce buraya yazılır (alıcı başına bir satır: alıcılar birbirini görmez), sonra
   gönderilir (gonder.ts: yanıttan sonra; gece işi bekleyenleri yeniden dener). Modüller e-postayı YALNIZ buradan yazar; gönderimi çekirdek yapar.
   Bildirim yalnız reisim'in açtığı yerde (anayasa 1.3): 2026-10-09 plan açılınca ekip + bilgilendirme listesi. */
import type { Sorgulayici } from "../db/kiraci.ts";
import { ekle, tablo, type Iz } from "../db/yazici.ts";

export const EPOSTA = tablo({ ad: "eposta", sutunlar: ["kime", "konu", "govde", "kaynak", "kaynak_id", "durum", "deneme", "son_hata", "gonderildi"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** sade e-posta biçimi (boşluk yok, tek @, noktalı alan adı); veritabanı CHECK'i küçük harf ve uzunluğu ayrıca denetler */
export const EPOSTA_BICIMI = /^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]{2,}$/;

/** adresleri küçük harfe çevirir, biçimi bozukları ve tekrarları atar (sıra korunur) */
export function adresler(l: readonly (string | null | undefined)[]): string[] {
  const g = new Set<string>();
  for (const x of l) {
    const a = (x ?? "").trim().toLowerCase();
    if (a.length <= 254 && EPOSTA_BICIMI.test(a)) g.add(a);
  }
  return [...g];
}

export interface EpostaGirdisi { kime: readonly string[]; konu: string; govde: string; kaynak: string; kaynakId: string | null }

/** alıcı başına bir kayıt yazar ("bekliyor"); yazılanların kimlikleri döner. Geçersiz adres yazılmaz. */
export async function epostaKuyruga(db: Sorgulayici, e: EpostaGirdisi, iz: Iz): Promise<string[]> {
  const l = adresler(e.kime);
  const idler: string[] = [];
  for (const kime of l) {
    const r = await ekle(db, EPOSTA, { kime, konu: e.konu.slice(0, 300), govde: e.govde.slice(0, 20000), kaynak: e.kaynak, kaynak_id: e.kaynakId && UUID.test(e.kaynakId) ? e.kaynakId : null }, iz);
    idler.push(r.id);
  }
  return idler;
}

export interface EpostaDurumu { id: string; kime: string; durum: "bekliyor" | "gonderildi" | "hata"; deneme: number; sonHata: string | null; gonderildi: string | null; olustu: string }

/** bir kaydın (plan …) e-postaları, yazılış sırasıyla (yetki ÇAĞIRANDA) */
export async function kaynakEpostalari(db: Sorgulayici, kaynak: string, kaynakId: string): Promise<EpostaDurumu[]> {
  if (!UUID.test(kaynakId)) return [];
  return (await db.sorgu<{ id: string; kime: string; durum: EpostaDurumu["durum"]; deneme: number; son_hata: string | null; gonderildi: Date | null; olustu: Date }>(
    "SELECT id::text, kime, durum, deneme, son_hata, gonderildi, olustu FROM eposta WHERE kaynak = $1 AND kaynak_id = $2 ORDER BY olustu, kime", [kaynak, kaynakId])).rows
    .map((x) => ({ id: x.id, kime: x.kime, durum: x.durum, deneme: x.deneme, sonHata: x.son_hata, gonderildi: x.gonderildi?.toISOString() ?? null, olustu: x.olustu.toISOString() }));
}
