/* TASLAK — gönderilmemiş yazı ve seçilmiş fotoğraf cihazda (2026-11-12; reisim: "sahada veri fotoğraf yazı vs kaybolmamalı kesinlikle özellikle
   burada say chat çok önemli"). Telefon, kamera açılırken ya da bellek daralınca sayfayı atar; "Gönder"e basılmamış yazı ve çekilmiş fotoğraf o an
   yalnız ekranın belleğindedir. Taslak onları cihaz deposuna şifreli yazar (depo.ts), ekran yeniden açılınca geri getirir; gönderilince / vazgeçilince
   silinir. Kişiye bağlıdır (kuyruğun yazan etiketi). Adlar: "chat|yazi", "chat|foto|<id>", "rapor|<plan>|form", "rapor|<plan>|foto|<id>",
   "form|<rapor>". */
import { taslakAdlari as adlar, taslakOku, taslakSil as sil, taslakYaz } from "./depo";
import { kuyrukYazaniOku } from "./kuyruk";

/** yazar; yazılamazsa false (yer doldu / depo yok) */
export const taslakKaydet = (ad: string, veri: unknown): Promise<boolean> => taslakYaz(kuyrukYazaniOku(), ad, veri);
export const taslakGetir = <T,>(ad: string): Promise<T | null> => taslakOku<T>(kuyrukYazaniOku(), ad);
export const taslakSil = (ad: string): Promise<void> => sil(ad);
export const taslakAdlari = (onek: string): Promise<string[]> => adlar(onek);

/** taslaktaki fotoğraf (base64) → dosya */
export function taslakDosyasi(veri: string, ad: string, tur = "image/jpeg"): File | null {
  try { return new File([Uint8Array.from(atob(veri), (c) => c.charCodeAt(0))], ad, { type: tur }); } catch { return null; }
}
