"use server";
/* MÜŞTERİLER SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama ve uyarı modül işlevinde (musteriler.ts). İstemciden gelen kimlik /
   sürüm / onay yalnız "hangi kayıt, hangi sürümü gördüm, uyarıyı gördüm" bilgisidir; yetkiyi değiştirmez. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { musteriKaydet, musteriPasif, tesisKaydet, tesisPasif, type Yazma } from "../server/musteriler";

export interface PencereDurumu { tamam?: boolean; id?: string; bildirim?: string; hatalar?: Record<string, string>; uyarilar?: Record<string, string>; genel?: string }

const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu kayıt siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Kayıt bulunamadı.",
} as const;
const MUSTERI_ALAN = ["unvan", "kisa", "vd", "vno", "eposta", "tel", "ilgili"] as const;
const TESIS_ALAN = ["ad", "adres", "il", "ilce", "sgk"] as const;

const metinler = (g: unknown, alanlar: readonly string[]) => {
  const o = (g && typeof g === "object" ? g : {}) as Record<string, unknown>;
  return Object.fromEntries(alanlar.map((k) => [k, typeof o[k] === "string" ? o[k] : ""]));
};
const cevir = (r: Yazma): PencereDurumu =>
  r.durum === "tamam" ? { tamam: true, id: r.id, ...(r.bildirim ? { bildirim: r.bildirim } : {}) } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "uyari" ? { uyarilar: r.uyarilar }
    : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };

async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<Yazma>): Promise<PencereDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return cevir(await is(o));
}
const id = (v: unknown) => (typeof v === "string" && v ? v : null);

export async function musteriKaydetEylemi(musteriId: string | null, surum: number, girdi: unknown, onay: boolean): Promise<PencereDurumu> {
  return islem((o) => oturumIslemi(o, (db) => musteriKaydet(db, o, id(musteriId), Number(surum), metinler(girdi, MUSTERI_ALAN), onay === true)));
}
export async function tesisKaydetEylemi(musteriId: string, tesisId: string | null, surum: number, girdi: unknown, onay: boolean): Promise<PencereDurumu> {
  return islem((o) => oturumIslemi(o, (db) => tesisKaydet(db, o, String(musteriId), id(tesisId), Number(surum), metinler(girdi, TESIS_ALAN), onay === true)));
}
export async function musteriPasifEylemi(musteriId: string, surum: number, pasif: boolean): Promise<PencereDurumu> {
  return islem((o) => oturumIslemi(o, (db) => musteriPasif(db, o, String(musteriId), Number(surum), pasif === true)));
}
export async function tesisPasifEylemi(tesisId: string, surum: number, pasif: boolean): Promise<PencereDurumu> {
  return islem((o) => oturumIslemi(o, (db) => tesisPasif(db, o, String(tesisId), Number(surum), pasif === true)));
}
