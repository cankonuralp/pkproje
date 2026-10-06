/* YÖNETİM GİRİŞİ (348; KOD-GECIS Y1) — yalnız yönetim adresinde (başka adreste 404). Oturum varsa Firmalar'a. Nedenler: oturum doldu · çıkış. */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { yonetimAdresinde, yonetimIstekOturumu } from "../../../../server/yonetim/istek";
import { YonetimGirisFormu } from "./YonetimGirisFormlari";

export const metadata: Metadata = { title: { absolute: "Yönetim girişi · probata" } };

export default async function YonetimGirisSayfasi({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await yonetimAdresinde())) notFound();
  if (await yonetimIstekOturumu()) redirect("/yonetim");
  const q = await searchParams;
  const neden = q.neden === "oturum" || q.neden === "cikis" ? q.neden : undefined;
  const adres = ((await headers()).get("host") ?? "").replace(/:\d+$/, "");
  return <YonetimGirisFormu neden={neden} adres={adres} />;
}
