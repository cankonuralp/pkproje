"use server";
/* RAPOR FORMATI SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama, kilitli öğe denetimi modül işlevinde (formatlar.ts). İstemciden
   gelen kimlik / sürüm yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir; yayının engeli ve uyarıları sunucuda yeniden hesaplanır. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { taslakBaslat, taslakKaydet, yayinDenetle, yayinla } from "../server/formatlar";

export interface FormatDurumuYaniti { tamam?: boolean; id?: string; sira?: number; uyarilar?: string[]; engeller?: string[]; hatalar?: Record<string, string>; genel?: string }

const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu şablon siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Kayıt bulunamadı.",
  kilitli: "Yayınlanmış sürüm değiştirilemez.",
} as const;

/** oturumdaki kişi ya da kullanıcıya söylenecek ileti */
async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}
const metin = (x: unknown) => (typeof x === "string" ? x : "");

export async function taslakBaslatEylemi(turId: string, taslakSurumu: number | null, baslangic: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const ts = taslakSurumu === null ? null : Number(taslakSurumu);
  const r = await oturumIslemi(o, (db) => taslakBaslat(db, o, metin(turId), metin(baslangic), ts));
  if (r.durum === "tamam") return { tamam: true, id: r.id };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

export async function yayinDenetleEylemi(formatId: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const d = await oturumIslemi(o, (db) => yayinDenetle(db, o, metin(formatId)));
  return d ? { tamam: true, engeller: d.engeller, uyarilar: d.uyarilar } : { genel: SONUC.yok };
}

export async function yayinlaEylemi(formatId: string, surum: number, notu: string): Promise<FormatDurumuYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => yayinla(db, o, metin(formatId), Number(surum), metin(notu)));
  if (r.durum === "tamam") return { tamam: true, sira: r.sira, uyarilar: r.uyarilar };
  if (r.durum === "engel") return { engeller: r.engeller };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}

/** Format kurucu (K4): taslağın tanımını kaydet — şemadan geçmeyen ya da çok büyük tanım yazılmaz; yayınlanmış sürüm değişmez */
export async function taslakKaydetEylemi(formatId: string, surum: number, tanim: unknown): Promise<FormatDurumuYaniti & { surum?: number }> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => taslakKaydet(db, o, metin(formatId), Number(surum), tanim));
  if (r.durum === "tamam") return { tamam: true, id: r.id, surum: r.surum };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}
