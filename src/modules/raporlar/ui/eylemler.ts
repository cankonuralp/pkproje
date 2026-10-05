"use server";
/* RAPORLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, kurallar ve ENGEL'ler modül işlevinde (raporlar.ts). İstemciden gelen kimlik ve sürüm
   yalnız "hangi rapor, hangi sürümü gördüm" bilgisidir; yetki vermez. Cihaz / fotoğraf sayısı istemciden alınmaz. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { depo } from "../../../server/dosya/depo";
import { belgePdf } from "../../../belge/pdf";
import {
  cihazEkle, cihazKaldir, fotoEkle, fotoSil, imzaHazirla, imzaliYukle, onayaGonder, raporFormatGuncelle, raporKaydet, raporKopyala, raporKunyeGuncelle, raporOlustur,
  raporSil, revizeIste, revizeIstegiGeriCek, type RaporYazma,
} from "../server/raporlar";

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
/** fotoğraf ekle (form: id, surum, bolum, madde?, dosya); tür, boyut ve yer sunucuda denetlenir */
export async function fotoEkleEylemi(form: FormData): Promise<RaporYaniti> {
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { foto: "Fotoğraf seçilmeli." } };
  if (dosya.size > 8 << 20) return { hatalar: { foto: "Fotoğraf çok büyük (en çok 8 MB)." } };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  const madde = metin(form.get("madde"));
  return islem((o) => oturumIslemi(o, (db) => fotoEkle(db, depo(), o, o.kiraci.firmaId, metin(form.get("id")), Number(form.get("surum")),
    { bolum: metin(form.get("bolum")), madde: madde || null }, { ad: dosya.name, bayt })));
}
export async function fotoSilEylemi(id: string, surum: number, dosyaId: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => fotoSil(db, o, metin(id), Number(surum), metin(dosyaId))));
}
/** Kaydet ve kopyala (kayit: ekranın son hâli) / Kopyala (gönderilmiş rapor, kayit null); başarıda id yeni raporun */
export async function raporKopyalaEylemi(id: string, surum: number, girdi: unknown, kayit: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporKopyala(db, o, metin(id), Number(surum), girdi, kayit ?? null)));
}
export async function raporFormatGuncelleEylemi(id: string, surum: number, kayit: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => raporFormatGuncelle(db, o, metin(id), Number(surum), kayit)));
}
/** İmzala (317): onaylanmış raporun kesin imzasız PDF'i sunucuda bir kez üretilir (başsız Chromium) ve saklanır */
export async function imzaHazirlaEylemi(id: string): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => imzaHazirla(db, depo(), o, o.kiraci.firmaId, metin(id), belgePdf)));
}
/** imzalı PDF yükle (form: id, surum, dosya); önek, imza sözlüğü, yetki ve durum sunucuda */
export async function imzaliYukleEylemi(form: FormData): Promise<RaporYaniti> {
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { dosya: "İmzalı PDF seçilmeli." } };
  if (dosya.size > 25 << 20) return { hatalar: { dosya: "PDF çok büyük (en çok 25 MB)." } };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  return islem((o) => oturumIslemi(o, (db) => imzaliYukle(db, depo(), o, o.kiraci.firmaId, metin(form.get("id")), Number(form.get("surum")), { ad: dosya.name, bayt })));
}
/* revize isteği (318): yalnız raporu yazan, tamamlanan raporda */
export async function revizeIsteEylemi(id: string, girdi: unknown): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => revizeIste(db, o, metin(id), girdi)));
}
export async function revizeIstegiGeriCekEylemi(id: string, surum: number): Promise<RaporYaniti> {
  return islem((o) => oturumIslemi(o, (db) => revizeIstegiGeriCek(db, o, metin(id), Number(surum))));
}
