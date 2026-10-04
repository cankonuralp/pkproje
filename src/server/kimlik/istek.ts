/* İSTEĞİN OTURUMU — sayfalar ve sunucu eylemleri yalnız buradan sorar (09-E2, E4).
   · Çerez: HttpOnly · SameSite=Lax · yayında Secure ve "__Host-" önekli (alan adı yazılamaz → yalnız o firmanın alt alan adına gider, üst alana
     sızmaz). Geliştirmede (http://<firma>.localhost) önek ve Secure yok.
   · Oturum, isteğin kiracısında okunur: başka firmanın adresinde aynı çerez geçersizdir (oturum tablosu RLS).
   · Rol ve durum her istekte veritabanından (oturumOku). */
import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { havuz } from "../db/havuz.ts";
import { kiraciIcinde, type Sorgulayici } from "../db/kiraci.ts";
import { istekKiracisi, type IstekKiracisi } from "../kiraci/istek.ts";
import { canDo } from "../yetki/canDo.ts";
import type { ModulAnahtari } from "../yetki/tanim.ts";
import { oturumOku, type OturumHesabi } from "./oturum.ts";

const YAYIN = process.env.NODE_ENV === "production";
export const CEREZ = YAYIN ? "__Host-probata" : "probata-oturum";
export const cerezAyari = (bitis: Date) => ({ httpOnly: true, secure: YAYIN, sameSite: "lax" as const, path: "/", expires: bitis });

export type IstekOturumu = OturumHesabi & { kiraci: IstekKiracisi };

export const istekOturumu = cache(async (): Promise<IstekOturumu | null> => {
  const kiraci = await istekKiracisi();
  if (!kiraci) return null;
  const belirtec = (await cookies()).get(CEREZ)?.value;
  const h = await oturumOku(havuz(), kiraci.firmaId, belirtec);
  return h && h.firmaId === kiraci.firmaId ? { ...h, kiraci } : null;
});

/** oturum yoksa girişe; çerez vardı ama geçersizse "oturum süresi doldu" nedeniyle (S2). Dönüş adresi yalnız site içi yol. */
export async function oturumGerekli(): Promise<IstekOturumu> {
  const o = await istekOturumu();
  if (o) return o;
  const donus = (await headers()).get("x-probata-yol") ?? undefined;
  const cerezVar = !!(await cookies()).get(CEREZ);
  const q = new URLSearchParams();
  if (cerezVar) q.set("neden", "oturum");
  if (donus && donus !== "/" && guvenliDonus(donus)) q.set("donus", donus);
  redirect(`/giris${q.size ? `?${q}` : ""}`);
}

/** açık yönlendirme (open redirect) olmasın: yalnız "/" ile başlayan, "//" ve "/\" ile başlamayan site içi yol */
export function guvenliDonus(yol: string | null | undefined): yol is string {
  return !!yol && /^\/(?![/\\])[\w\-./?=&%]*$/.test(yol) && yol.length <= 200;
}

/** modüle girebilir mi (sayfa düzeyi) — kayıt düzeyi denetimi modül işlevinde ayrıca */
export function modulGorur(o: IstekOturumu, modul: ModulAnahtari): boolean {
  return canDo(o, modul, "gor");
}

/** Oturumdaki kişinin işlemi: kiracı isteğin alt alan adından, hesap oturumdan (denetim izinin "kim"i — 0003). Modül yazıcıları buradan koşar;
    kiracı ya da hesap kimliği istemciden alınmaz (09-E2). */
export function oturumIslemi<T>(o: IstekOturumu, is: (db: Sorgulayici) => Promise<T>): Promise<T> {
  return kiraciIcinde(havuz(), o.kiraci.firmaId, is, { hesapId: o.id });
}
