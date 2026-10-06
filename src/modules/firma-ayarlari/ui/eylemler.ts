"use server";
/* FİRMA AYARLARI SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki ve doğrulama modül işlevinde (ayarlar.ts). İstemciden gelen sürüm yalnız
   "hangi sürümü gördüm" bilgisidir; yetki vermez. */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { ayarDosyasiYaz, ayarKaydet, belgeTuruEkle, belgeTuruKaldir, firmaKoduKaydet, type AyarYazma } from "../server/ayarlar";

export interface AyarYaniti { tamam?: boolean; bildirim?: string; hatalar?: Record<string, string>; genel?: string }
const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", cakisma: "Bu bölüm siz açtıktan sonra değiştirildi. Sayfayı yenileyip yeniden deneyin." } as const;
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<AyarYazma>): Promise<AyarYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await is(o);
  return r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim } : r.durum === "gecersiz" ? { hatalar: r.hatalar, genel: r.hatalar.genel }
    : r.durum === "red" ? { genel: r.neden } : { genel: SONUC[r.durum] };
}

export async function ayarKaydetEylemi(kesim: string, surum: number, girdi: unknown): Promise<AyarYaniti> {
  return islem((o) => oturumIslemi(o, (db) => ayarKaydet(db, o, typeof kesim === "string" ? kesim : "", Number(surum), girdi)));
}
export async function firmaKoduKaydetEylemi(girdi: unknown): Promise<AyarYaniti> {
  return islem((o) => oturumIslemi(o, (db) => firmaKoduKaydet(db, o, girdi)));
}
export async function belgeTuruEkleEylemi(girdi: unknown): Promise<AyarYaniti> {
  return islem((o) => oturumIslemi(o, (db) => belgeTuruEkle(db, o, girdi)));
}
export async function belgeTuruKaldirEylemi(k: string): Promise<AyarYaniti> {
  return islem((o) => oturumIslemi(o, (db) => belgeTuruKaldir(db, o, typeof k === "string" ? k : "")));
}
/** form: ne (logo | on_bilgi | bordro_format), surum, dosya (yoksa kaldır) */
export async function ayarDosyasiEylemi(form: FormData): Promise<AyarYaniti> {
  const f = form.get("dosya");
  let belge: { ad: string; bayt: Uint8Array } | null = null;
  if (f instanceof File && f.size > 0) {
    if (f.size > 10 << 20) return { hatalar: { dosya: "En çok 10 MB." } };
    belge = { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
  }
  const ne = form.get("ne");
  return islem((o) => oturumIslemi(o, (db) => ayarDosyasiYaz(db, depo(), o, o.kiraci.firmaId, typeof ne === "string" ? ne : "", Number(form.get("surum")), belge)));
}
