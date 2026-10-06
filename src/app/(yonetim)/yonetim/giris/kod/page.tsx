/* YÖNETİM GİRİŞİ › DOĞRULAMA KODU (348) — yalnız parola adımı geçilmiş (bekleyen) oturumla; ilk girişte kuruluma. */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { yonetimAdresinde, yonetimBekleyen, yonetimIstekOturumu } from "../../../../../server/yonetim/istek";
import { YonetimKodFormu } from "../YonetimGirisFormlari";

export const metadata: Metadata = { title: { absolute: "Doğrulama kodu · probata yönetim" } };

export default async function YonetimKodSayfasi() {
  if (!(await yonetimAdresinde())) notFound();
  if (await yonetimIstekOturumu()) redirect("/yonetim");
  const b = await yonetimBekleyen();
  if (!b) redirect("/yonetim/giris?neden=oturum");
  if (b.durum === "ilk") redirect("/yonetim/giris/kurulum");
  return <YonetimKodFormu eposta={b.eposta} />;
}
