"use server";
/* ÖLÇÜM CİHAZLARI SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama ve dosya denetimi modül işlevinde (cihazlar.ts). İstemciden gelen
   kimlik / sürüm yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir; sertifikanın türü adından değil baytlarından anlaşılır. */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { cihazKaydet, cihazKonum, cihazSil, kalibrasyonEkle, kalibrasyonKaldir, type Yazma } from "../server/cihazlar";

export interface PencereDurumu { tamam?: boolean; id?: string; hatalar?: Record<string, string>; genel?: string }

const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu kayıt siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Kayıt bulunamadı.",
} as const;
const CIHAZ_ALAN = ["kod", "tur", "yeniTur", "marka", "model", "seri", "aralik"] as const;
const KAL_ALAN = ["tarih", "bitis", "lab", "sertifika", "sonuc"] as const;

/** oturumdaki kişi ya da kullanıcıya söylenecek ileti */
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const cevir = (r: Yazma): PencereDurumu =>
  r.durum === "tamam" ? { tamam: true, id: r.id } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : { genel: SONUC[r.durum] };
const metinler = (g: unknown, alanlar: readonly string[]) => {
  const o = (g && typeof g === "object" ? g : {}) as Record<string, unknown>;
  return Object.fromEntries(alanlar.map((k) => [k, typeof o[k] === "string" ? o[k] : ""]));
};

export async function cihazKaydetEylemi(cihazId: string | null, surum: number, girdi: unknown): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => cihazKaydet(db, o, typeof cihazId === "string" && cihazId ? cihazId : null, Number(surum), metinler(girdi, CIHAZ_ALAN))));
}

export async function cihazKonumEylemi(cihazId: string, surum: number, konum: string): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => cihazKonum(db, o, String(cihazId), Number(surum), konum === "lab" ? "lab" : "depo")));
}

export async function kalibrasyonEkleEylemi(form: FormData): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const dosya = form.get("dosya");
  let sertifika: { ad: string; bayt: Uint8Array } | undefined;
  if (dosya instanceof File && dosya.size > 0) {
    if (dosya.size > 25 << 20) return { hatalar: { dosya: "PDF en çok 25 MB." } };
    sertifika = { ad: dosya.name, bayt: new Uint8Array(await dosya.arrayBuffer()) };
  }
  const girdi = Object.fromEntries(KAL_ALAN.map((k) => [k, String(form.get(k) ?? "")]));
  return cevir(await oturumIslemi(o, (db) => kalibrasyonEkle(db, depo(), o, o.kiraci.firmaId, String(form.get("cihaz") ?? ""), girdi, sertifika)));
}

export async function kalibrasyonKaldirEylemi(kayitId: string, surum: number): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  return cevir(await oturumIslemi(o, (db) => kalibrasyonKaldir(db, o, String(kayitId), Number(surum))));
}

/** kesin sil (357): yalnız yönetici, yalnız kullanılmamış cihaz — karar modül işlevinde */
export async function cihazSilEylemi(cihazId: string): Promise<PencereDurumu> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => cihazSil(db, o, String(cihazId)));
  return r.durum === "tamam" ? { tamam: true } : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
}
