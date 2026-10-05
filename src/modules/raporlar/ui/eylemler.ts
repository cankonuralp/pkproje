"use server";
/* RAPORLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, kurallar ve ENGEL'ler modül işlevinde (raporlar.ts). İstemciden gelen kimlik ve sürüm
   yalnız "hangi rapor, hangi sürümü gördüm" bilgisidir; yetki vermez. Cihaz / fotoğraf sayısı istemciden alınmaz. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { cihazEkle, cihazKaldir, onayaGonder, raporKaydet, raporKunyeGuncelle, raporOlustur, raporSil, type RaporYazma } from "../server/raporlar";

export interface RaporYaniti {
  tamam?: boolean; id?: string; bildirim?: string; hatalar?: Record<string, string>; eksikler?: { bolum: string; alan: string; ad: string }[]; genel?: string;
}
const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Rapor siz açtıktan sonra değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Rapor bulunamadı.",
} as const;
const yanit = (r: RaporYazma): RaporYaniti =>
  r.durum === "tamam" ? { tamam: true, id: r.id, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "eksik" ? { eksikler: r.eksikler }
    : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<RaporYazma>): Promise<RaporYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return yanit(await is(o));
}
const metin = (v: unknown) => (typeof v === "string" ? v : "");

export async function raporOlusturEylemi(planId: string, ekipmanId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporOlustur(db, o, metin(planId), metin(ekipmanId))));
}
export async function raporKaydetEylemi(id: string, surum: number, girdi: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporKaydet(db, o, metin(id), Number(surum), girdi)));
}
export async function onayaGonderEylemi(id: string, surum: number, girdi: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => onayaGonder(db, o, metin(id), Number(surum), girdi)));
}
export async function raporSilEylemi(id: string, surum: number): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporSil(db, o, metin(id), Number(surum))));
}
export async function cihazEkleEylemi(id: string, surum: number, turId: string, cihazId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => cihazEkle(db, o, metin(id), Number(surum), metin(turId), metin(cihazId))));
}
export async function cihazKaldirEylemi(id: string, surum: number, turId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => cihazKaldir(db, o, metin(id), Number(surum), metin(turId))));
}
export async function raporKunyeGuncelleEylemi(id: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporKunyeGuncelle(db, o, metin(id))));
}
