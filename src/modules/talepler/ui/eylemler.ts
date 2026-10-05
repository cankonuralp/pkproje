"use server";
/* TALEPLER SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; talep kimin adına olduğu istemciden ALINMAZ (oturumun personeli). Yetki, doğrulama ve
   kurallar modül işlevinde (talepler.ts, muhasebe talep-baglanti.ts) ve veritabanında (0040, 0042). */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { BelgeHatasi } from "../../muhasebe/server/giderler";
import {
  izinBelgesi, izinGeriCek, izinGonder, izinOnayla, izinReddet, masrafFormuBelgesi, masrafFormuGeriCek, masrafFormuGonder, TalepBelgeHatasi,
  type TalepBelgesi, type Yazma,
} from "../server/talepler";

export interface TalepYaniti { tamam?: boolean; id?: string; no?: string; bildirim?: string; hatalar?: Record<string, string>; genel?: string }
const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Kayıt bulunamadı.", cakisma: "Kayıt bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;
const cevir = (r: Yazma): TalepYaniti =>
  r.durum === "tamam" ? { tamam: true, id: r.id, no: r.no, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden }
    : { genel: SONUC[r.durum] };
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<Yazma>): Promise<TalepYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  try {
    return cevir(await is(o));
  } catch (h) {
    if (h instanceof TalepBelgeHatasi || h instanceof BelgeHatasi) return { hatalar: { belge: h.message } };
    throw h;
  }
}
const yazi = (v: unknown) => (typeof v === "string" ? v : "");
async function belgeOku(form: FormData): Promise<TalepBelgesi | "buyuk"> {
  if (form.get("belgeKaldir") === "1") return "kaldir";
  const f = form.get("belge");
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > 25 << 20) return "buyuk";
  return { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
}
const BUYUK = { hatalar: { belge: "Belge çok büyük (PDF 25 MB, fotoğraf 8 MB)." } };

export async function izinGonderEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  const girdi = { tur: yazi(form.get("tur")), bas: yazi(form.get("bas")), bit: yazi(form.get("bit")), aciklama: yazi(form.get("aciklama")) };
  return islem((o) => oturumIslemi(o, (db) => izinGonder(db, depo(), o, o.kiraci.firmaId, girdi, b)));
}
export async function izinGeriCekEylemi(id: string): Promise<TalepYaniti> {
  return islem((o) => oturumIslemi(o, (db) => izinGeriCek(db, o, yazi(id))));
}
export async function izinBelgesiEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  return islem((o) => oturumIslemi(o, (db) => izinBelgesi(db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), b)));
}
export async function masrafGonderEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  const girdi = { is: yazi(form.get("is")), tarih: yazi(form.get("tarih")), tur: yazi(form.get("tur")), tutar: yazi(form.get("tutar")), oran: yazi(form.get("oran")),
    aciklama: yazi(form.get("aciklama")) };
  return islem((o) => oturumIslemi(o, (db) => masrafFormuGonder(db, depo(), o, o.kiraci.firmaId, girdi, b)));
}
export async function masrafGeriCekEylemi(id: string): Promise<TalepYaniti> {
  return islem((o) => oturumIslemi(o, (db) => masrafFormuGeriCek(db, o, yazi(id))));
}
export async function masrafBelgesiEylemi(form: FormData): Promise<TalepYaniti> {
  const b = await belgeOku(form);
  if (b === "buyuk") return BUYUK;
  return islem((o) => oturumIslemi(o, (db) => masrafFormuBelgesi(db, depo(), o, o.kiraci.firmaId, yazi(form.get("id")), Number(form.get("surum")), b)));
}
export async function izinOnaylaEylemi(id: string, surum: number): Promise<TalepYaniti> {
  return islem((o) => oturumIslemi(o, (db) => izinOnayla(db, o, yazi(id), Number(surum))));
}
export async function izinReddetEylemi(id: string, surum: number, girdi: unknown): Promise<TalepYaniti> {
  return islem((o) => oturumIslemi(o, (db) => izinReddet(db, o, yazi(id), Number(surum), girdi)));
}
