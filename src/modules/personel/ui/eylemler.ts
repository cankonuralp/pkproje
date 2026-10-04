"use server";
/* PERSONEL SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki ve doğrulama modül işlevinde (personel.ts). İstemciden gelen kimlik / sürüm
   yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir; yetkiyi değiştirmez. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { personelEkle, personelGuncelle } from "../server/personel";
import { matrisKaydet } from "../../../server/yetki/matris";
import { hesapAc, hesapKapat, hesapYenidenAc, rolleriKaydet, yeniGeciciParola, type HesapSonucu } from "../../../server/kimlik/hesapYonetimi";

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

/* ── giriş hesabı (karar 33–34): yetki ve kurallar src/server/kimlik/hesapYonetimi.ts içinde ── */
export interface HesapDurumu { tamam?: boolean; parola?: string; hatalar?: Record<string, string>; genel?: string }

async function hesapIslemi(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<HesapSonucu<{ parola?: string }>>): Promise<HesapDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await is(o);
  if (r.durum === "tamam") return { tamam: true, parola: r.parola };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  if (r.durum === "red") return { genel: r.neden };
  return { genel: r.durum === "yetkisiz" ? SONUC.yetkisiz : SONUC.yok };
}

export async function hesapAcEylemi(personelId: string, eposta: string, roller: string[]): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => hesapAc(db, o, personelId, { eposta, roller })));
}
export async function geciciParolaEylemi(personelId: string): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => yeniGeciciParola(db, o, personelId)));
}
export async function hesapKapatEylemi(personelId: string): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => hesapKapat(db, o, personelId)));
}
export async function hesapYenidenAcEylemi(personelId: string): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => hesapYenidenAc(db, o, personelId)));
}
export async function rolleriKaydetEylemi(personelId: string, roller: string[]): Promise<HesapDurumu> {
  return hesapIslemi((o) => oturumIslemi(o, (db) => rolleriKaydet(db, o, personelId, roller)));
}

/* ── rol yetkileri (maket personel.html #/roller; reisim 32): yetki ve temizleme src/server/yetki/matris.ts içinde ── */
export interface MatrisDurumu { tamam?: boolean; surum?: number; genel?: string }
export async function rolYetkiKaydetEylemi(surum: number, matris: unknown): Promise<MatrisDurumu> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await oturumIslemi(o, (db) => matrisKaydet(db, o, Number(surum), matris));
  if (r.durum === "tamam" || r.durum === "degisiklik_yok") return { tamam: true, surum: r.surum };
  if (r.durum === "yetkisiz") return { genel: SONUC.yetkisiz };
  if (r.durum === "cakisma") return { genel: SONUC.cakisma };
  return { genel: "Rol yetkileri kaydedilemedi: geçersiz değer." };
}
