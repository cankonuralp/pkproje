/* İSTEK KÖKENİ — sunucu eylemleri için (09-E3). "use server" dosyasında DEĞİL: oradan dışa açılan her işlev istemciden çağrılabilen uç olur.
   Next sunucu eylemleri kökeni zaten denetler; bu ikinci katman ayrıca kiracıyı da karşılaştırır (başka firmanın sayfasından sahte form reddedilir). */
import "server-only";
import { headers } from "next/headers";
import { kiraciAdiCoz } from "../kiraci/coz.ts";
import { anaAlan } from "../kiraci/istek.ts";

/** aynı köken: Origin başlığının alt alanı isteğin alt alanıyla aynı olmalı (kiracılar arası sahte form da reddedilir) */
export async function ayniKoken(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin"), host = h.get("host");
  if (!origin || !host) return false;
  try {
    const o = new URL(origin);
    return o.host === host && kiraciAdiCoz(o.host, anaAlan()) === kiraciAdiCoz(host, anaAlan());
  } catch { return false; }
}

/** istemcinin IP'si: barındırmanın koyduğu ilk X-Forwarded-For değeri (yayında platform yazar); yoksa "yerel". Yalnız IP kilidi için. */
export async function istemciIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "yerel").slice(0, 64);
}

