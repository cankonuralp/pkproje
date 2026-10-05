"use server";
/* MUHASEBE SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama ve kurallar modül işlevinde (muhasebe.ts) ve veritabanında (0039).
   İstemciden gelen kimlik yalnız "hangi iş / fatura" bilgisidir; yetki vermez. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { faturaKaydet, tahsilatKaydet, type Yazma } from "../server/muhasebe";

export interface MuhasebeYaniti { tamam?: boolean; id?: string; no?: string; bildirim?: string; hatalar?: Record<string, string>; genel?: string }

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
const cevir = (r: Yazma): MuhasebeYaniti =>
  r.durum === "tamam" ? { tamam: true, id: r.id, no: r.no, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden }
    : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<Yazma>): Promise<MuhasebeYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return cevir(await is(o));
}
const yazi = (v: unknown) => (typeof v === "string" ? v : "");

export async function faturaKaydetEylemi(planId: string, girdi: unknown): Promise<MuhasebeYaniti> {
  return islem((o) => oturumIslemi(o, (db) => faturaKaydet(db, o, yazi(planId), girdi)));
}
export async function tahsilatKaydetEylemi(faturaId: string, girdi: unknown): Promise<MuhasebeYaniti> {
  return islem((o) => oturumIslemi(o, (db) => tahsilatKaydet(db, o, yazi(faturaId), girdi)));
}
