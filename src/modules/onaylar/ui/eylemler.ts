"use server";
/* ONAYLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki ve kurallar modül işlevinde (onaylar.ts), geçiş kuralları veritabanında (0026).
   İstemciden gelen kimlik ve sürüm yalnız "hangi rapor, hangi sürümü gördüm" bilgisidir; yetki vermez. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { depo } from "../../../server/dosya/depo";
import { belgeGeriGonder, belgeImzaliYukle, type BelgeYazma } from "../server/belgeler";
import { durumDegistir, geriGonder, onayGeriAl, onayla, revizeIstegiReddet, revizeyeGonder, type OnayYazma } from "../server/onaylar";
import { talepKarar, type Yazma as TalepYazma } from "../../talepler/server/talepler";

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
export async function revizeyeGonderEylemi(id: string, surum: number, girdi: unknown): Promise<OnayYaniti> {
  return islem((o) => oturumIslemi(o, (db) => revizeyeGonder(db, o, metin(id), Number(surum), girdi)));
}
export async function revizeIstegiReddetEylemi(id: string, istekId: string, istekSurum: number, girdi: unknown): Promise<OnayYaniti> {
  return islem((o) => oturumIslemi(o, (db) => revizeIstegiReddet(db, o, metin(id), metin(istekId), Number(istekSurum), girdi)));
}

/* ── DİĞER BELGELER (333): yalnız imzalayacak kişi; karar ve kural sunucuda ve veritabanında (0044) ── */
const BELGE_SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Belge siz açtıktan sonra değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Belge bulunamadı.",
} as const;
async function belgeIslem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<BelgeYazma>): Promise<OnayYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await is(o);
  return r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar }
    : r.durum === "red" ? { genel: r.neden } : { genel: BELGE_SONUC[r.durum] };
}
export async function belgeGeriGonderEylemi(id: string, surum: number): Promise<OnayYaniti> {
  return belgeIslem((o) => oturumIslemi(o, (db) => belgeGeriGonder(db, o, metin(id), Number(surum))));
}
/** imzalı PDF yükle (form: id, surum, dosya); önek ve imza denetimi sunucuda */
export async function belgeImzaliYukleEylemi(form: FormData): Promise<OnayYaniti> {
  const dosya = form.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { hatalar: { dosya: "İmzalı PDF seçilmeli." } };
  if (dosya.size > 25 << 20) return { hatalar: { dosya: "PDF çok büyük (en çok 25 MB)." } };
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  return belgeIslem((o) => oturumIslemi(o, (db) => belgeImzaliYukle(db, depo(), o, o.kiraci.firmaId, metin(form.get("id")), Number(form.get("surum")), { ad: dosya.name, bayt })));
}

/* 477 (reisim 2026-10-10, Talepler–Onaylar kararları T1 · T2): izin talebi ve masraf formunun kararı Onaylar › Talepler'de — talep DEĞİŞTİRİLMEZ;
   yetki Talepler modülünde (izin firma yöneticisi, masraf Muhasebe'yi değiştiren), geçişler veritabanında (0079) */
const TALEP_SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Talep bulunamadı.", cakisma: "Talep siz açtıktan sonra değişti. Sayfayı yenileyip yeniden deneyin." } as const;
export async function talepKararEylemi(tip: string, id: string, surum: number, karar: string, girdi: unknown): Promise<OnayYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r: TalepYazma = await oturumIslemi(o, (db) => talepKarar(db, o, metin(tip), metin(id), Number(surum), metin(karar), girdi));
  return r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim, sonraki: null } : r.durum === "gecersiz" ? { hatalar: r.hatalar }
    : r.durum === "red" ? { genel: r.neden } : { genel: TALEP_SONUC[r.durum] };
}
