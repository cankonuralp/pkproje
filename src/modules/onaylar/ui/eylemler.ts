"use server";
/* ONAYLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki ve kurallar modül işlevinde (onaylar.ts), geçiş kuralları veritabanında (0026).
   İstemciden gelen kimlik ve sürüm yalnız "hangi rapor, hangi sürümü gördüm" bilgisidir; yetki vermez. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { durumDegistir, geriGonder, onayGeriAl, onayla, type OnayYazma } from "../server/onaylar";

export interface OnayYaniti { tamam?: boolean; bildirim?: string; sonraki?: string | null; hatalar?: Record<string, string>; genel?: string }
const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Rapor siz açtıktan sonra değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Rapor bulunamadı.",
} as const;
const yanit = (r: OnayYazma): OnayYaniti =>
  r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim, sonraki: r.sonraki } : r.durum === "gecersiz" ? { hatalar: r.hatalar }
    : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<OnayYazma>): Promise<OnayYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return yanit(await is(o));
}
const metin = (v: unknown) => (typeof v === "string" ? v : "");

export async function onaylaEylemi(id: string, surum: number): Promise<OnayYaniti> {
  return islem((o) => oturumIslemi(o, (db) => onayla(db, o, metin(id), Number(surum))));
}
export async function geriGonderEylemi(id: string, surum: number, girdi: unknown): Promise<OnayYaniti> {
  return islem((o) => oturumIslemi(o, (db) => geriGonder(db, o, metin(id), Number(surum), girdi)));
}
export async function onayGeriAlEylemi(id: string, surum: number): Promise<OnayYaniti> {
  return islem((o) => oturumIslemi(o, (db) => onayGeriAl(db, o, metin(id), Number(surum))));
}
export async function durumDegistirEylemi(id: string, surum: number, girdi: unknown): Promise<OnayYaniti> {
  return islem((o) => oturumIslemi(o, (db) => durumDegistir(db, o, metin(id), Number(surum), girdi)));
}
