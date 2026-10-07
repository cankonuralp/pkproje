"use server";
/* MÜŞTERİ GİRİŞİ SUNUCU EYLEMLERİ (0030) — kişi ve kiracı oturumdan; yetki ve kurallar modül işlevinde (girisler.ts). İstemciden gelen kimlik /
   sürüm yalnız "hangi giriş, hangi sürümü gördüm" bilgisidir; yetki vermez. Geçici parola yalnız bu yanıtta bir kez döner. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { anaGeciciParola, ekGeciciParola, ekGirisEkle, girisPasif, girisSil, type GirisYazma } from "../server/girisler";

export interface GirisYaniti { tamam?: boolean; parola?: string; hatalar?: Record<string, string>; genel?: string }
const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu giriş siz açtıktan sonra değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Giriş bulunamadı.",
} as const;
const cevir = (r: GirisYazma): GirisYaniti =>
  r.durum === "tamam" ? { tamam: true, parola: r.parola } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<GirisYazma>): Promise<GirisYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return cevir(await is(o));
}
const metin = (v: unknown) => (typeof v === "string" ? v : "");

export async function anaGeciciParolaEylemi(musteriId: string): Promise<GirisYaniti> {
  return islem((o) => oturumIslemi(o, (db) => anaGeciciParola(db, o, metin(musteriId))));
}
export async function ekGirisEkleEylemi(musteriId: string, girdi: unknown): Promise<GirisYaniti> {
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  const tesisler = g.tesisler === "hepsi" ? "hepsi" : Array.isArray(g.tesisler) ? g.tesisler.filter((x): x is string => typeof x === "string") : undefined;
  return islem((o) => oturumIslemi(o, (db) => ekGirisEkle(db, o, metin(musteriId), { ad: metin(g.ad), eposta: metin(g.eposta), tesisler })));
}
export async function ekGeciciParolaEylemi(id: string, surum: number): Promise<GirisYaniti> {
  return islem((o) => oturumIslemi(o, (db) => ekGeciciParola(db, o, metin(id), Number(surum))));
}
export async function girisPasifEylemi(id: string, surum: number, pasif: boolean): Promise<GirisYaniti> {
  return islem((o) => oturumIslemi(o, (db) => girisPasif(db, o, metin(id), Number(surum), pasif === true)));
}
/** 367: hiç girilmemiş ek giriş kesin silinir (yalnız yönetici; karar girisler.ts / veritabanında) */
export async function girisSilEylemi(id: string): Promise<GirisYaniti> {
  return islem((o) => oturumIslemi(o, (db) => girisSil(db, o, metin(id))));
}
