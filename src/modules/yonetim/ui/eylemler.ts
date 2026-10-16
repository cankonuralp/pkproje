"use server";
/* YÖNETİM SUNUCU EYLEMLERİ (348) — yalnız yönetim adresinde ve yönetim oturumuyla (yönetici istemciden alınmaz); işlem veritabanında yönetim
   rolünde (yonetimIslemi). Köken iki katman. Geçici parola yalnız bu yanıtta döner (kaydedilmez, sayfa yenilenince yoktur). */
import { refresh } from "next/cache";
import { anaAnahtar } from "../../../server/ayar/sir";
import { firmaKayitlariniUnut } from "../../../server/db/firma-havuzu";
import { ayniKoken } from "../../../server/kimlik/koken";
import { anaAlan } from "../../../server/kiraci/istek";
import { yonetimAlani } from "../../../server/yonetim/adres";
import { yonetimAdresinde, yonetimIslemi, yonetimIstekOturumu } from "../../../server/yonetim/istek";
import { yonetimEtiketi } from "../sema";
import { yonetimCalistirici } from "../server/calistirici";
import { firmaDurumuYonet, geciciParolaYonet, yzAnahtariYonet } from "../server/firma-tarafi";
import { firmaAc, type YonetimSonucu } from "../server/yonetim";

export interface YonetimYaniti {
  tamam?: boolean; id?: string; parola?: string; eposta?: string; ad?: string; alt?: string; son4?: string | null; hatalar?: Record<string, string>; genel?: string;
}
type Alanlar = Partial<Pick<YonetimYaniti, "id" | "parola" | "eposta" | "ad" | "alt" | "son4">>;

const cevir = (r: YonetimSonucu<Alanlar>): YonetimYaniti =>
  r.durum === "tamam" ? { ...r, tamam: true } : r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden } : { genel: "Firma bulunamadı." };

async function islem<T extends YonetimSonucu<Alanlar>>(
  is: (o: NonNullable<Awaited<ReturnType<typeof yonetimIstekOturumu>>>) => Promise<T>): Promise<YonetimYaniti> {
  if (!(await yonetimAdresinde()) || !(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await yonetimIstekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  return cevir(await is(o));
}
const yazi = (v: unknown) => (typeof v === "string" ? v : "");
/* FIRMA-VT FV3 (2026-10-15): firma açıldı / durumu değişti → bu örnekteki kiracı kaydı önbelleği HEMEN boşalır (yeni firma 5 sn'lik "yok"
   kaydına, dondurulan firma 15 sn'lik "etkin" kaydına takılmasın). Öteki örneklerde en geç 15 sn; o pencerede dondurulmuş firmaya giriş ve oturum
   yine yok (src/server/kimlik/oturum.ts ETKIN_FIRMA). */
const unut = (y: YonetimYaniti) => { if (y.tamam) firmaKayitlariniUnut(); return y; };

export async function firmaAcEylemi(form: FormData): Promise<YonetimYaniti> {
  const girdi = { unvan: yazi(form.get("unvan")), alt: yazi(form.get("alt")), kod: yazi(form.get("kod")), yon: yazi(form.get("yon")), eposta: yazi(form.get("eposta")) };
  return unut(await islem((o) => yonetimIslemi(o, (db) => firmaAc(db, girdi, yonetimEtiketi(yonetimAlani(), anaAlan()), anaAlan()))));
}

/* durum ve parola eylemleri istemci yönlendiricisini SUNUCUDA yeniler (yeni sayfa eylem yanıtıyla gelir): istemcideki ayrı router.refresh()
   başka bir yönlendirici işiyle çakışınca düşebiliyordu — CI 8dc6d06 tablet: Etkinleştir sonrası sayfa "Dondurulmuş"ta kaldı (raporlar 318 ile aynı)
   FIRMA-VT FV9 (2026-10-16): dondur / etkinleştir / geçici parola / yapay zekâ anahtarı firma-tarafi.ts üzerinden — ortak firmada merkezde (bugünkü gibi),
   kendi projeli firmada firmanın veritabanında, sıra kapalı yönde. */
const yenileyerek = (y: YonetimYaniti) => { if (unut(y).tamam) refresh(); return y; };

export async function firmaDondurEylemi(id: string): Promise<YonetimYaniti> {
  return yenileyerek(await islem((o) => firmaDurumuYonet(yonetimCalistirici(o), yazi(id), "dondu")));
}

export async function firmaEtkinlestirEylemi(id: string): Promise<YonetimYaniti> {
  return yenileyerek(await islem((o) => firmaDurumuYonet(yonetimCalistirici(o), yazi(id), "etkin")));
}

export async function geciciParolaVerEylemi(id: string): Promise<YonetimYaniti> {
  return yenileyerek(await islem((o) => geciciParolaYonet(yonetimCalistirici(o), yazi(id))));
}

/** K4: yapay zekâ anahtarı — form: anahtar (Anthropic). Düz anahtar yalnız bu istekte, sunucuda şifrelenir; yanıtta yalnız son 4. */
export async function yzAnahtariKaydetEylemi(id: string, form: FormData): Promise<YonetimYaniti> {
  return yenileyerek(await islem((o) => yzAnahtariYonet(yonetimCalistirici(o), yazi(id), yazi(form.get("anahtar")), anaAnahtar())));
}

export async function yzAnahtariKaldirEylemi(id: string): Promise<YonetimYaniti> {
  return yenileyerek(await islem((o) => yzAnahtariYonet(yonetimCalistirici(o), yazi(id), null, anaAnahtar())));
}
