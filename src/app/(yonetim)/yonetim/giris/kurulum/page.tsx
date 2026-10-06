/* YÖNETİM GİRİŞİ › İLK KURULUM (348) — geçici parolayla ilk girişte: doğrulama uygulamasının anahtarı (yalnız bu bekleyen oturumda gösterilir),
   kod ve yeni parola. Kurulmuş yönetici kod adımına gider. */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { yonetimAdresinde, yonetimBekleyen, yonetimIstekOturumu, yonetimKurulumu } from "../../../../../server/yonetim/istek";
import { YonetimKurulumFormu } from "../YonetimGirisFormlari";

export const metadata: Metadata = { title: { absolute: "İki adımlı giriş kurulumu · probata yönetim" } };

export default async function YonetimKurulumSayfasi() {
  if (!(await yonetimAdresinde())) notFound();
  if (await yonetimIstekOturumu()) redirect("/yonetim");
  const k = await yonetimKurulumu();
  if (!k) redirect((await yonetimBekleyen())?.durum === "etkin" ? "/yonetim/giris/kod" : "/yonetim/giris?neden=oturum");
  return <YonetimKurulumFormu eposta={k.eposta} anahtar={k.anahtar} adres={k.adres} />;
}
