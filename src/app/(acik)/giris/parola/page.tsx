/* GEÇİCİ PAROLAYLA İLK GİRİŞ (maket giris.html #/gecici · karar 34): yeni parola önerilir, "Şimdi değil" ile geçilebilir. Yalnız oturumu olan
   ve hesabı "ilk giriş bekleniyor" durumundaki kişi görür; öteki herkes ana sayfaya ya da girişe. Müşteri girişi de aynı ekranı kullanır (0030):
   personel oturumu yoksa müşteri oturumuna bakılır, kaydedince / "Şimdi değil" panele döner. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { guvenliDonus, istekOturumu, musteriIstekOturumu } from "../../../../server/kimlik/istek";
import { headers } from "next/headers";
import { ParolaFormu } from "./ParolaFormu";

export const metadata: Metadata = { title: { absolute: "Parolayı değiştir · probata" } };

export default async function ParolaSayfasi({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const donus = typeof q.donus === "string" && guvenliDonus(q.donus) ? q.donus : undefined;
  const o = await istekOturumu();
  const adres = ((await headers()).get("host") ?? "").replace(/:\d+$/, "");
  if (!o) {
    const m = await musteriIstekOturumu();
    if (!m) redirect("/giris");
    const md = donus?.startsWith("/portal") ? donus : "/portal";
    if (m.durum !== "ilk") redirect(md);
    return <ParolaFormu eposta={m.eposta} adres={adres} donus={md} musteri />;
  }
  if (o.durum !== "ilk") redirect(donus ?? "/");
  return <ParolaFormu eposta={o.eposta} adres={adres} donus={donus} />;
}
