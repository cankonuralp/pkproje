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
import { epostaOrtami, kurulumOrtami, yonetimCalistirici } from "../server/calistirici";
import { gonderimAlaniEkle, gonderimDogrula, gonderimOrtakAc, type EpostaOrtami, type GonderimGorunumu } from "../server/eposta";
import { argeKaydiYonet, firmaDurumuYonet, geciciParolaYonet, yzAnahtariYonet, yzAyarYonet } from "../server/firma-tarafi";
import { kurulumBaslat, kurulumBastan, kurulumGorunumu, kurulumIlerlet, kurulumSurdur, type KurulumGorunumu } from "../server/kurulum";
import { firma, firmaAc, type YonetimSonucu } from "../server/yonetim";
import { yedekDenemeYonet, yedekDogrulaYonet, yedekGeriDonYonet, yedekGeriYukleYonet } from "../server/yedek";
import { signBaglantisiYonet, signDene } from "../server/sign";

export interface YonetimYaniti {
  tamam?: boolean; id?: string; parola?: string; eposta?: string; ad?: string; alt?: string; son4?: string | null; hatalar?: Record<string, string>; genel?: string;
  /** FV10: kendi projeli firmanın kurulumu başladı (Firma aç) / kurulumun şu anki görünümü */
  kurulum?: KurulumGorunumu | true;
  /** FV11: e-posta gönderiminin güncel görünümü (ekle / doğrula) */
  gorunum?: GonderimGorunumu;
}
type Alanlar = Partial<Pick<YonetimYaniti, "id" | "parola" | "eposta" | "ad" | "alt" | "son4" | "gorunum">>;

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
  /* FV10: "Kendi Supabase projesi" — kayıt açılır, kurulum firma sayfasında ilerler (geçici parola kurulum bitince) */
  if (yazi(form.get("vt")) === "kendi") {
    return unut(await islem(async (o) => {
      const k = kurulumOrtami(o);
      if (!k) return { durum: "red", neden: "Kendi Supabase projesi şu an açılamaz: Supabase yönetim anahtarı ya da örgütü tanımlı değil." } as const;
      const r = await kurulumBaslat(k, girdi, yonetimEtiketi(yonetimAlani(), anaAlan()), anaAlan(), yazi(form.get("yz")) || null);
      return r.durum === "tamam" ? { ...r, kurulum: true as const } : r;
    }));
  }
  return unut(await islem((o) => yonetimIslemi(o, (db) => firmaAc(db, girdi, yonetimEtiketi(yonetimAlani(), anaAlan()), anaAlan()))));
}

/* FV10: kurulum — sayfa açıkken 3 sn'de bir ilerletir (40 sn bütçe, kira 90 sn — aynı anda tek ilerleten); bitince sayfa yenilenir (firma etkin) */
async function kurulumIslemi(is: (k: NonNullable<ReturnType<typeof kurulumOrtami>>, id: string) => Promise<KurulumGorunumu | null>, id: string): Promise<YonetimYaniti> {
  if (!(await yonetimAdresinde()) || !(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await yonetimIstekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const k = kurulumOrtami(o);
  if (!k) return { genel: "Supabase yönetim anahtarı ya da örgütü tanımlı değil; kurulum ilerleyemez.", kurulum: (await kurulumGorunumu(yonetimCalistirici(o), yazi(id))) ?? undefined };
  const g = await is(k, yazi(id));
  if (!g) return { genel: "Kurulum bulunamadı." };
  if (g.durum === "tamam") { firmaKayitlariniUnut(); refresh(); }
  return { tamam: true, kurulum: g };
}
export async function kurulumIlerletEylemi(id: string): Promise<YonetimYaniti> {
  return kurulumIslemi((k, i) => kurulumIlerlet(k, i), id);
}
export async function kurulumSurdurEylemi(id: string): Promise<YonetimYaniti> {
  return kurulumIslemi((k, i) => kurulumSurdur(k, i), id);
}
export async function kurulumBastanEylemi(id: string): Promise<YonetimYaniti> {
  return kurulumIslemi((k, i) => kurulumBastan(k, i), id);
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

/** 2026-10-25 (göç 0106): yapay zekâ aç / kapa ve kişi başı aylık sınır — girdi { acik, sinir } (sinir metin; boş = sınırsız) */
export async function yzAyarKaydetEylemi(id: string, girdi: { acik: unknown; sinir: unknown }): Promise<YonetimYaniti> {
  return yenileyerek(await islem((o) => yzAyarYonet(yonetimCalistirici(o), yazi(id), { acik: girdi?.acik, sinir: girdi?.sinir })));
}

/* FV11 (K2): firmanın e-posta gönderimi — alan adı ekle / değiştir (form: alan, yerel) ve "Doğrula" (Resend'e denetletir; doğrulanınca gönderme anahtarı
   firma tarafına kilitli yazılır). probata'nın Resend anahtarı ortamda yoksa kapalı. */
async function gonderimIslemi(is: (k: EpostaOrtami) => Promise<YonetimSonucu<Alanlar>>): Promise<YonetimYaniti> {
  return yenileyerek(await islem(async (o) => {
    const k = epostaOrtami(o);
    return k ? is(k) : ({ durum: "red", neden: "probata'nın Resend anahtarı bu sunucuda tanımlı değil; e-posta gönderimi kurulamaz." } as const);
  }));
}
export async function gonderimAlaniEkleEylemi(id: string, form: FormData): Promise<YonetimYaniti> {
  return gonderimIslemi((k) => gonderimAlaniEkle(k, yazi(id), { alan: yazi(form.get("alan")), yerel: yazi(form.get("yerel")) }));
}
export async function gonderimDogrulaEylemi(id: string): Promise<YonetimYaniti> {
  return gonderimIslemi((k) => gonderimDogrula(k, yazi(id)));
}
/** 2026-11-11 (göç 0126): gönderimi probata'nın ortak alan adından aç — form: yerel (boşsa firmanın kısa adı); firmanın DNS'i gerekmez */
export async function gonderimOrtakAcEylemi(id: string, form: FormData): Promise<YonetimYaniti> {
  return gonderimIslemi(async (k) => {
    const f = await k.merkez((db) => firma(db, yazi(id)));
    return f ? gonderimOrtakAc(k, f.id, yazi(form.get("yerel")), f.kisaAd) : ({ durum: "yok" } as const);
  });
}

/** 2026-10-31 (L8): S.A.Y Ar-Ge kaydının metni (JSON) — yalnız yönetim; tarayıcı dosya olarak indirir */
export async function argeKaydiEylemi(id: string, kayit: string): Promise<{ metin?: string; genel?: string }> {
  if (!(await yonetimAdresinde()) || !(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await yonetimIstekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const r = await argeKaydiYonet(yonetimCalistirici(o), yazi(id), yazi(kayit));
  return r ? { metin: JSON.stringify(r, null, 1) } : { genel: "Kayıt bulunamadı (30 günü geçmiş olabilir)." };
}

/* 2026-11-04 YEDEK (maket THfrK3AzKkg9S7DiRVKKF4 ekran 2–3; yalnız Yönetim — sunum K1): doğrula, geri yükleme denemesi, geri yükle, önceki hâle
   dön. Geri yükleme ve dönüş firmanın kısa adı yazılmadan yapılmaz (sunucuda da). Yanıt sonucu taşır; hata metni sırsız. */
export type YedekYaniti<T> = { tamam: true; deger: T } | { tamam: false; genel: string };
async function yedekIslem<T>(id: string, is: (o: NonNullable<Awaited<ReturnType<typeof yonetimIstekOturumu>>>, kisaAd: string) =>
  Promise<{ durum: "tamam"; deger: T } | { durum: "red"; neden: string }>): Promise<YedekYaniti<T>> {
  if (!(await yonetimAdresinde()) || !(await ayniKoken())) return { tamam: false, genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await yonetimIstekOturumu();
  if (!o) return { tamam: false, genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  const f = await yonetimIslemi(o, (db) => firma(db, yazi(id)));
  if (!f) return { tamam: false, genel: "Firma bulunamadı." };
  if (f.durum === "kurulum") return { tamam: false, genel: "Firmanın kurulumu bitmedi." };
  const r = await is(o, f.kisaAd);
  refresh();
  return r.durum === "tamam" ? { tamam: true, deger: r.deger } : { tamam: false, genel: r.neden };
}
const yoneten = (o: { eposta: string }) => `probata yönetim: ${o.eposta}`;
export async function yedekDogrulaEylemi(id: string) {
  return yedekIslem(id, () => yedekDogrulaYonet(yazi(id)));
}
export async function yedekDenemeEylemi(id: string, kaynak: string) {
  return yedekIslem(id, () => yedekDenemeYonet(yazi(id), yazi(kaynak)));
}
export async function yedekGeriYukleEylemi(id: string, kaynak: string, onay: string) {
  return yedekIslem(id, (o, kisaAd) => yedekGeriYukleYonet(yazi(id), { kaynak: yazi(kaynak), onay: yazi(onay), kisaAd, kim: yoneten(o) }));
}
export async function yedekGeriDonEylemi(id: string, geriYukleme: string, onay: string) {
  return yedekIslem(id, (o, kisaAd) => yedekGeriDonYonet(yazi(id), { geriYukleme: yazi(geriYukleme), onay: yazi(onay), kisaAd, kim: yoneten(o) }));
}

/** 2026-11-05 (göç 0122): probata sign — form: anahtar (psk_…), sir (sign'ın webhook sırrı). Önce sign'a denenir; düz değerler yalnız bu istekte,
    sunucuda şifrelenir. Kaydedilince firma sign ile imzalar */
export async function signKaydetEylemi(id: string, form: FormData): Promise<YonetimYaniti> {
  return yenileyerek(await islem((o) => signBaglantisiYonet(yonetimCalistirici(o), yazi(id), { anahtar: yazi(form.get("anahtar")), sir: yazi(form.get("sir")) }, anaAnahtar())));
}
/** yalnız dener (kayıt yok): form: anahtar */
export async function signDeneEylemi(id: string, form: FormData): Promise<YonetimYaniti> {
  return islem(async () => {
    if (!/^[0-9a-f-]{36}$/.test(yazi(id))) return { durum: "yok" } as const;
    const n = await signDene(yazi(form.get("anahtar")).trim());
    return n ? { durum: "gecersiz" as const, hatalar: { anahtar: n } } : { durum: "tamam" as const };
  });
}
export async function signKaldirEylemi(id: string): Promise<YonetimYaniti> {
  return yenileyerek(await islem((o) => signBaglantisiYonet(yonetimCalistirici(o), yazi(id), null, anaAnahtar())));
}
