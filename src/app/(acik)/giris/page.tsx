/* GİRİŞ (maket giris.html, AA1: tek zemin, ortada logo + giriş kartı). Firma alt alan adında açılır; adres kartta yazar. Oturum varsa Ana sayfaya.
   Nedenler (S2 · AA8): oturum süresi doldu · çıkış yapıldı. Dönüş adresi yalnız site içi yol (guvenliDonus). */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { guvenliDonus, istekOturumu } from "../../../server/kimlik/istek";
import { istekKiracisi } from "../../../server/kiraci/istek";
import { headers } from "next/headers";
import { GirisFormu } from "./GirisFormu";

export const metadata: Metadata = { title: { absolute: "Giriş · probata" } };

export default async function GirisSayfasi({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const neden = q.neden === "oturum" || q.neden === "cikis" ? q.neden : undefined;
  const donus = typeof q.donus === "string" && guvenliDonus(q.donus) ? q.donus : undefined;
  /* oturum varsa dönüş adresine (giriş eylemi çerezi yazınca bu sayfa da yeniden çizilir; yönlendirme ikisinde aynı olmalı — 2026-10-04 e2e yakaladı) */
  const o = await istekOturumu();
  if (o?.durum === "ilk") redirect(`/giris/parola${donus ? `?donus=${encodeURIComponent(donus)}` : ""}`);
  if (o) redirect(donus ?? "/");
  const kiraci = await istekKiracisi();
  const adres = ((await headers()).get("host") ?? "").replace(/:\d+$/, "");
  return <GirisFormu neden={neden} donus={donus} adres={adres} firmaVar={!!kiraci} />;
}
