/* YÖNETİM İSTEĞİNİN OTURUMU (348) — yönetim sayfaları ve eylemleri yalnız buradan sorar.
   · Yalnız yönetim adresinde (src/server/yonetim/adres.ts); başka adreste yönetim sayfası yoktur (404 — ara katman da keser).
   · Çerez ayrı: HttpOnly · SameSite=Strict · yayında Secure ve "__Host-" önekli; tarayıcı kapanınca silinir (kalıcı çerez yok).
   · Oturum ve yönetici her istekte veritabanından (yonetimOturumOku); kimlik istemciden alınmaz. */
import "server-only";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { havuz } from "../db/havuz.ts";
import { ayniKoken } from "../kimlik/koken.ts";
import { yonetimIcinde, type Sorgulayici } from "../db/kiraci.ts";
import { yonetimAdresiMi } from "./adres.ts";
import { bekleyenOturum, kurulumBilgisi, yonetimCikis, yonetimOturumOku, type YoneticiOturumu } from "./giris.ts";

const YAYIN = process.env.NODE_ENV === "production";
export const YONETIM_CEREZ = YAYIN ? "__Host-probata-y" : "probata-yonetim";
export const yonetimCerezAyari = () => ({ httpOnly: true, secure: YAYIN, sameSite: "strict" as const, path: "/" });

export async function yonetimAdresinde(): Promise<boolean> {
  return yonetimAdresiMi((await headers()).get("host"));
}

export const yonetimIstekOturumu = cache(async (): Promise<YoneticiOturumu | null> => {
  if (!(await yonetimAdresinde())) return null;
  return yonetimOturumOku(havuz(), (await cookies()).get(YONETIM_CEREZ)?.value);
});

/** yönetim sayfasının kapısı: yönetim adresi değilse 404; oturum yoksa yönetim girişine ("oturum doldu" çerez varken) */
export async function yonetimOturumGerekli(): Promise<YoneticiOturumu> {
  if (!(await yonetimAdresinde())) notFound();
  const o = await yonetimIstekOturumu();
  if (o) return o;
  redirect((await cookies()).get(YONETIM_CEREZ) ? "/yonetim/giris?neden=oturum" : "/yonetim/giris");
}

/** oturumdaki yöneticinin işlemi: veritabanında yönetim rolü, yönetici işlemin bağlamında (izin "kim"i, işlevlerin yetki denetimi) */
export function yonetimIslemi<T>(o: YoneticiOturumu, is: (db: Sorgulayici) => Promise<T>): Promise<T> {
  return yonetimIcinde(havuz(), is, { yoneticiId: o.id });
}

/** girişin ikinci adımı / ilk kurulum: çerezdeki bekleyen (parola) oturumun yöneticisi */
export async function yonetimBekleyen(): Promise<{ eposta: string; durum: "ilk" | "etkin" } | null> {
  if (!(await yonetimAdresinde())) return null;
  return bekleyenOturum(havuz(), (await cookies()).get(YONETIM_CEREZ)?.value);
}

/** ilk kurulum ekranının bilgisi (anahtar yalnız bu bekleyen oturumda; ilk çağrıda üretilir) */
export async function yonetimKurulumu(): Promise<{ anahtar: string; adres: string; eposta: string } | null> {
  if (!(await yonetimAdresinde())) return null;
  return kurulumBilgisi(havuz(), (await cookies()).get(YONETIM_CEREZ)?.value);
}

/** çıkış (355; menü "Çıkış yap" ve giriş adımlarında "Girişe dön" — src/app/(yonetim)/yonetim/cikis/route.ts): yalnız yönetim adresinde ("adres"),
    yalnız aynı kökenden ("koken" — başka siteden gönderilen form oturumu kapatmaz); belirtecin oturumu silinir, çerez boşaltılır (yazımdaki niteliklerle) */
export async function yonetimOturumunuKapat(): Promise<"tamam" | "adres" | "koken"> {
  if (!(await yonetimAdresinde())) return "adres";
  if (!(await ayniKoken())) return "koken";
  const c = await cookies();
  await yonetimCikis(havuz(), c.get(YONETIM_CEREZ)?.value);
  c.set(YONETIM_CEREZ, "", { ...yonetimCerezAyari(), maxAge: 0 });
  return "tamam";
}
