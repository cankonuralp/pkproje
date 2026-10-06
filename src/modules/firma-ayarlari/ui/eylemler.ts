"use server";
/* FİRMA AYARLARI SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki ve doğrulama modül işlevinde (ayarlar.ts). İstemciden gelen sürüm yalnız
   "hangi sürümü gördüm" bilgisidir; yetki vermez. */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { AYAR_DOSYASI } from "../sema";
import { iceAktar, iceAktarDenetle, iceAktarimGeriAl, type IaSatirOzeti, type IaSonuc } from "../server/ice-aktar";
import { ayarDosyasiYaz, ayarKaydet, belgeTuruEkle, belgeTuruKaldir, firmaKoduKaydet, yzAnahtarYaz, type AyarYazma } from "../server/ayarlar";

export interface AyarYaniti { tamam?: boolean; bildirim?: string; hatalar?: Record<string, string>; genel?: string; degismedi?: boolean }
const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", cakisma: "Bu bölüm siz açtıktan sonra değiştirildi. Sayfayı yenileyip yeniden deneyin." } as const;
async function islem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<AyarYazma>): Promise<AyarYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await is(o);
  return r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim, degismedi: r.degismedi } : r.durum === "gecersiz" ? { hatalar: r.hatalar, genel: r.hatalar.genel }
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
/** API anahtarı: girdi { anahtar } ya da null (kaldır); anahtar yanıta konmaz. ac: ekranda "Açık" seçiliyse bölümün gördüğü sürüm */
export async function yzAnahtarEylemi(girdi: unknown | null, ac: number | null = null): Promise<AyarYaniti> {
  return islem((o) => oturumIslemi(o, (db) => yzAnahtarYaz(db, o, girdi === null ? null : girdi, typeof ac === "number" ? ac : null)));
}
/** form: ne (logo | on_bilgi | bordro_format), surum, dosya (yoksa kaldır) */
export async function ayarDosyasiEylemi(form: FormData): Promise<AyarYaniti> {
  const f = form.get("dosya"), ne = form.get("ne");
  let belge: { ad: string; bayt: Uint8Array } | null = null;
  if (f instanceof File && f.size > 0) {
    const mb = typeof ne === "string" && Object.hasOwn(AYAR_DOSYASI, ne) ? AYAR_DOSYASI[ne as keyof typeof AYAR_DOSYASI].mb : 10;
    if (f.size > mb << 20) return { hatalar: { dosya: `En çok ${mb} MB.` } };
    belge = { ad: f.name, bayt: new Uint8Array(await f.arrayBuffer()) };
  }
  return islem((o) => oturumIslemi(o, (db) => ayarDosyasiYaz(db, depo(), o, o.kiraci.firmaId, typeof ne === "string" ? ne : "", Number(form.get("surum")), belge)));
}

/* ── TOPLU İÇE AKTARMA (337): girdi { tur, dosya, satirlar } — satırlar sunucuda yeniden denetlenir ── */
export interface IaYaniti { tamam?: boolean; satirlar?: IaSatirOzeti[]; bildirim?: string; genel?: string }
async function iaIslem(is: (o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>) => Promise<IaSonuc>): Promise<IaYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  try {
    const r = await is(o);
    return r.durum === "tamam" ? { tamam: true, satirlar: r.satirlar } : r.durum === "aktarildi" ? { tamam: true, bildirim: r.bildirim }
      : r.durum === "yetkisiz" ? { genel: SONUC.yetkisiz } : { genel: r.neden };
  } catch (h) {
    /* aynı anda başka biri aynı kodu / plakayı / e-postayı kaydetti: hiçbir satır girmedi (tek işlem) */
    if ((h as { code?: string }).code === "23505") return { genel: "İçe aktarılamadı: bazı kayıtlar bu arada eklendi. Dosyayı yeniden seçip denetleyin; hiçbir satır eklenmedi." };
    throw h;
  }
}
export async function iceAktarDenetleEylemi(girdi: unknown): Promise<IaYaniti> {
  return iaIslem((o) => oturumIslemi(o, (db) => iceAktarDenetle(db, o, girdi)));
}
export async function iceAktarEylemi(girdi: unknown): Promise<IaYaniti> {
  return iaIslem((o) => oturumIslemi(o, (db) => iceAktar(db, o, girdi)));
}
/** dene: yalnız "geri alınabilir mi" (silmez) */
export async function iceAktarimGeriAlEylemi(id: string, dene: boolean): Promise<IaYaniti> {
  return iaIslem((o) => oturumIslemi(o, (db) => iceAktarimGeriAl(db, o, typeof id === "string" ? id : "", dene === true)));
}
