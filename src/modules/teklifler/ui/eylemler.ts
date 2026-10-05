"use server";
/* TEKLİFLER SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama ve durum kuralları modül işlevinde (teklifler.ts) ve veritabanı
   tetiğinde (0037). İstemciden gelen kimlik / sürüm yalnız "hangi teklif, hangi sürümü gördüm" bilgisidir; yetki vermez. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import type { TeklifEkipmani } from "../excel";
import { teklifEkipmanListesi, teklifGonder, teklifKabul, teklifKaydet, teklifMusteriKaydet, teklifReddet, type Yazma } from "../server/teklifler";

export interface TeklifYaniti { tamam?: boolean; id?: string; no?: string; bildirim?: string; hatalar?: Record<string, string>; genel?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Teklif bulunamadı.", cakisma: "Teklif bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
const cevir = (r: Yazma): TeklifYaniti =>
  r.durum === "tamam" ? { tamam: true, id: r.id, no: r.no, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden }
    : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<Yazma>): Promise<TeklifYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return cevir(await is(o));
}
const yazi = (v: unknown) => (typeof v === "string" ? v : "");
const kimlikMi = (v: unknown) => (typeof v === "string" && v ? v : null);

export async function teklifKaydetEylemi(id: string | null, surum: number, girdi: unknown, kopyaKaynak: string | null): Promise<TeklifYaniti> {
  return islem((o) => oturumIslemi(o, (db) => teklifKaydet(db, o, kimlikMi(id), Number(surum), girdi, kimlikMi(kopyaKaynak))));
}
export async function teklifGonderEylemi(id: string, surum: number): Promise<TeklifYaniti> {
  return islem((o) => oturumIslemi(o, (db) => teklifGonder(db, o, yazi(id), Number(surum))));
}
export async function teklifKabulEylemi(id: string, surum: number): Promise<TeklifYaniti> {
  return islem((o) => oturumIslemi(o, (db) => teklifKabul(db, o, yazi(id), Number(surum))));
}
export async function teklifReddetEylemi(id: string, surum: number, girdi: unknown): Promise<TeklifYaniti> {
  return islem((o) => oturumIslemi(o, (db) => teklifReddet(db, o, yazi(id), Number(surum), girdi)));
}
export async function teklifMusteriKaydetEylemi(id: string, surum: number): Promise<TeklifYaniti> {
  return islem((o) => oturumIslemi(o, (db) => teklifMusteriKaydet(db, o, yazi(id), Number(surum))));
}
/** formun "Excel'e aktar"ı: seçili tesislerin kayıtlı etkin ekipmanı (yetki ve tesis kimlikleri sunucuda denetlenir) */
export async function teklifEkipmanlariEylemi(tesisler: unknown): Promise<{ liste?: TeklifEkipmani[]; genel?: string }> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const l = await oturumIslemi(o, (db) => teklifEkipmanListesi(db, o, tesisler));
  return l ? { liste: l } : { genel: SONUC.yetkisiz };
}
