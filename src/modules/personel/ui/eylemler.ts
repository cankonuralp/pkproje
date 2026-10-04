"use server";
/* PERSONEL SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki ve doğrulama modül işlevinde (personel.ts). İstemciden gelen kimlik / sürüm
   yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir; yetkiyi değiştirmez. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { personelEkle, personelGuncelle } from "../server/personel";

export interface FormDurumu { hatalar?: Record<string, string>; genel?: string; yonlendir?: string }

const ALANLAR = ["ad", "eposta", "imzaTel", "basla", "meslek", "meslekMetin", "diploma", "oda", "ekipnet"] as const;
const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Bu kayıt siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Kayıt bulunamadı.",
} as const;

export async function personelKaydetEylemi(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { yonlendir: "/giris?neden=oturum" };
  const girdi = Object.fromEntries(ALANLAR.map((k) => [k, String(form.get(k) ?? "")]));
  const id = String(form.get("id") ?? "");
  const surum = Number(form.get("surum") ?? -1);
  const r = await oturumIslemi(o, (db) => (id ? personelGuncelle(db, o, id, surum, girdi) : personelEkle(db, o, girdi)));
  if (r.durum === "tamam") return { yonlendir: `/personel/${r.id}` };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: SONUC[r.durum] };
}
