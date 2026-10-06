/* TEKLİFLER ↔ FİRMA AYARLARI BAĞLANTISI (335; maket firma-ayarlari "Fiyat listesi": "KDV hariç birim fiyat. Yeni teklif bu listeden dolar; teklif
   dışı rapor bu fiyatla faturalanır. Kabul edilmiş tekliflerin fiyatı değişmez."). Firma ayarları fiyat_listesi tablosuna dokunmaz; buradan
   okur / yazar (güvenli yazıcı: sürüm, denetim izi). Tutarlar KURUŞ. Yetki ÇAĞIRANDA (Firma ayarları "değiştirir"). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";

const FIYAT = tablo({ ad: "fiyat_listesi", sutunlar: ["tur_id", "fiyat"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** tür → birim fiyat (kuruş) */
export async function fiyatListesi(db: Sorgulayici): Promise<Map<string, number>> {
  return new Map((await db.sorgu<{ tur_id: string; fiyat: string }>("SELECT tur_id::text, fiyat::text FROM fiyat_listesi")).rows.map((x) => [x.tur_id, Number(x.fiyat)]));
}
/** verilen türlerin fiyatını yazar (yoksa ekler, değiştiyse günceller); dönen: değişen tür sayısı. gorulen: ekranın gördüğü fiyat (yoksa null) —
    biri bu arada değiştiyse HİÇBİRİ yazılmaz, "cakisma" (335 incelemesi: eski ekran başkasının fiyatını sessizce eziyordu). Firma başına danışma
    kilidi: aynı türe aynı anda ilk fiyatı giren ikinci kişi benzersizlik hatası değil çakışma alır. */
export async function fiyatlariYaz(db: Sorgulayici, kim: { ad: string }, fiyatlar: ReadonlyMap<string, { fiyat: number; gorulen: number | null }>): Promise<number | "cakisma"> {
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended('fiyat_listesi:' || gecerli_firma()::text, 0))");
  const eski = new Map((await db.sorgu<{ id: string; tur_id: string; fiyat: string; surum: number }>(
    "SELECT id::text, tur_id::text, fiyat::text, surum FROM fiyat_listesi FOR UPDATE")).rows.map((x) => [x.tur_id, x]));
  for (const [tur, { fiyat, gorulen }] of fiyatlar) {
    if (!UUID.test(tur) || !Number.isSafeInteger(fiyat) || fiyat < 0) throw new Error("geçersiz fiyat");
    const e = eski.get(tur);
    if ((e ? Number(e.fiyat) : null) !== gorulen) return "cakisma";
  }
  let n = 0;
  for (const [tur, { fiyat }] of fiyatlar) {
    const e = eski.get(tur), iz = { kim: kim.ad, ne: "fiyat_listesi.kaydet" };
    if (!e) { await ekle(db, FIYAT, { tur_id: tur, fiyat }, iz); n++; continue; }
    if (Number(e.fiyat) === fiyat) continue;
    const g = await guncelle(db, FIYAT, e.id, e.surum, { fiyat }, iz);
    if (g.durum !== "tamam") throw new Error("fiyat yazılamadı");
    n++;
  }
  return n;
}
