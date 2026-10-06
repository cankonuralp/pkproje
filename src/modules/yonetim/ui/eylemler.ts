"use server";
/* YÖNETİM SUNUCU EYLEMLERİ (348) — yalnız yönetim adresinde ve yönetim oturumuyla (yönetici istemciden alınmaz); işlem veritabanında yönetim
   rolünde (yonetimIslemi). Köken iki katman. Geçici parola yalnız bu yanıtta döner (kaydedilmez, sayfa yenilenince yoktur). */
import { ayniKoken } from "../../../server/kimlik/koken";
import { anaAlan } from "../../../server/kiraci/istek";
import { yonetimAlani } from "../../../server/yonetim/adres";
import { yonetimAdresinde, yonetimIslemi, yonetimIstekOturumu } from "../../../server/yonetim/istek";
import { yonetimEtiketi } from "../sema";
import { firmaAc, firmaDurumu, yoneticiyeGeciciParola, type YonetimSonucu } from "../server/yonetim";

export interface YonetimYaniti { tamam?: boolean; id?: string; parola?: string; eposta?: string; ad?: string; alt?: string; hatalar?: Record<string, string>; genel?: string }

const cevir = (r: YonetimSonucu<Partial<Pick<YonetimYaniti, "id" | "parola" | "eposta" | "ad" | "alt">>>): YonetimYaniti =>
  r.durum === "tamam" ? { ...r, tamam: true } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden } : { genel: "Firma bulunamadı." };

async function islem<T extends YonetimSonucu<Partial<Pick<YonetimYaniti, "id" | "parola" | "eposta" | "ad" | "alt">>>>(
  is: (o: NonNullable<Awaited<ReturnType<typeof yonetimIstekOturumu>>>) => Promise<T>): Promise<YonetimYaniti> {
  if (!(await yonetimAdresinde()) || !(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await yonetimIstekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return cevir(await is(o));
}
const yazi = (v: unknown) => (typeof v === "string" ? v : "");

export async function firmaAcEylemi(form: FormData): Promise<YonetimYaniti> {
  const girdi = { unvan: yazi(form.get("unvan")), alt: yazi(form.get("alt")), kod: yazi(form.get("kod")), yon: yazi(form.get("yon")), eposta: yazi(form.get("eposta")) };
  return islem((o) => yonetimIslemi(o, (db) => firmaAc(db, girdi, yonetimEtiketi(yonetimAlani(), anaAlan()), anaAlan())));
}

export async function firmaDondurEylemi(id: string): Promise<YonetimYaniti> {
  return islem((o) => yonetimIslemi(o, (db) => firmaDurumu(db, yazi(id), "dondu")));
}

export async function firmaEtkinlestirEylemi(id: string): Promise<YonetimYaniti> {
  return islem((o) => yonetimIslemi(o, (db) => firmaDurumu(db, yazi(id), "etkin")));
}

export async function geciciParolaVerEylemi(id: string): Promise<YonetimYaniti> {
  return islem((o) => yonetimIslemi(o, (db) => yoneticiyeGeciciParola(db, yazi(id))));
}
