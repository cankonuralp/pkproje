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
import { musteriOturumOku, type MusteriOturumHesabi } from "./musteri.ts";
import { oturumOku, type OturumHesabi } from "./oturum.ts";

const YAYIN = process.env.NODE_ENV === "production";
export const CEREZ = YAYIN ? "__Host-probata" : "probata-oturum";
/** müşteri paneli oturumu ayrı çerezde (0030): personel çerezi müşteri oturumu sayılmaz, tersi de */
export const MUSTERI_CEREZ = YAYIN ? "__Host-probata-m" : "probata-musteri";
/** "Beni hatırla" işaretsizse çerez oturumluktur (tarayıcı kapanınca silinir); işaretliyse oturumun mutlak bitişine kadar kalır */
export const cerezAyari = (bitis: Date, hatirla = true) => ({ httpOnly: true, secure: YAYIN, sameSite: "lax" as const, path: "/", ...(hatirla ? { expires: bitis } : {}) });

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
  /* müşteri kullanıcısı firmanın ekranına giremez: kendi paneline */
  if (await musteriIstekOturumu()) redirect("/portal");
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

/** modül sayfasının kapısı: oturum ister (yoksa girişe), modülü göremiyorsa null (sayfa Yetkisiz çizer). Ekranı yapılan modül sayfaları bunu çağırır. */
export async function modulOturumu(no: number): Promise<IstekOturumu | null> {
  const o = await oturumGerekli();
  return modulGorur(o, no as ModulAnahtari) ? o : null;
}

/* ── MÜŞTERİ PANELİ (0030; modül 17) ─────────────────────────────────────────────────────────────────────────────────────────────────── */
export type MusteriIstekOturumu = MusteriOturumHesabi & { kiraci: IstekKiracisi };

export const musteriIstekOturumu = cache(async (): Promise<MusteriIstekOturumu | null> => {
  const kiraci = await istekKiracisi();
  if (!kiraci) return null;
  const belirtec = (await cookies()).get(MUSTERI_CEREZ)?.value;
  const h = await musteriOturumOku(havuz(), kiraci.firmaId, belirtec);
  return h && h.firmaId === kiraci.firmaId ? { ...h, kiraci } : null;
});

/** müşteri oturumu yoksa girişe (dönüş adresi panel içindeyse korunur) */
export async function musteriOturumGerekli(): Promise<MusteriIstekOturumu> {
  const o = await musteriIstekOturumu();
  if (o) return o;
  /* firma kullanıcısı müşteri paneline giremez: kendi ana sayfasına (girişe gönderilseydi giriş onu dönüş adresine, panele geri yollardı —
     döngü; 319 e2e yakaladı) */
  if (await istekOturumu()) redirect("/");
  const donus = (await headers()).get("x-probata-yol") ?? undefined;
  const q = new URLSearchParams();
  if ((await cookies()).get(MUSTERI_CEREZ)) q.set("neden", "oturum");
  if (donus && donus.startsWith("/portal") && guvenliDonus(donus)) q.set("donus", donus);
  redirect(`/giris${q.size ? `?${q}` : ""}`);
}

/** müşterinin VERİ işlemi: kiracı isteğin alt alan adından, müşteri ve tesis kapsamı oturumdan (istemciden değil); işlem veritabanında müşteri
    rolüne geçer (kısıtlayıcı politikalar — 0030) */
export function musteriIslemi<T>(o: MusteriIstekOturumu, is: (db: Sorgulayici) => Promise<T>): Promise<T> {
  return kiraciIcinde(havuz(), o.kiraci.firmaId, is, { musteri: { id: o.musteriId, tesisler: o.tesisler } });
}
