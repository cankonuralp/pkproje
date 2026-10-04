"use server";
/* GİRİŞ / ÇIKIŞ SUNUCU EYLEMLERİ (09-E1–E3). Next sunucu eylemleri kökeni (Origin ↔ Host) zaten denetler; burada AYRICA denetlenir (CSRF iki
   katman). Girdi ortak şemayla doğrulanır; yanıt hesabın var olup olmadığını söylemez. Başarılı girişte çerez yazılır ve yalnız site içi
   dönüş adresine gidilir (açık yönlendirme yok). */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "../../sema/ortak.ts";
import { havuz } from "../db/havuz.ts";
import { anaAlan, istekKiracisi } from "../kiraci/istek.ts";
import { kiraciAdiCoz } from "../kiraci/coz.ts";
import { CEREZ, cerezAyari, guvenliDonus } from "./istek.ts";
import { cikisYap, girisYap } from "./oturum.ts";

export interface GirisDurumu { hata?: string; eposta?: string; yonlendir?: string }

const GirisSemasi = z.object({
  eposta: z.string().trim().toLowerCase().max(254),
  parola: z.string().max(200),
  donus: z.string().max(200).optional(),
});

/** aynı köken: Origin başlığının alt alanı isteğin alt alanıyla aynı olmalı (kiracılar arası sahte form da reddedilir) */
async function ayniKoken(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin"), host = h.get("host");
  if (!origin || !host) return false;
  try {
    const o = new URL(origin);
    return o.host === host && kiraciAdiCoz(o.host, anaAlan()) === kiraciAdiCoz(host, anaAlan());
  } catch { return false; }
}

/** istemcinin IP'si: barındırmanın koyduğu ilk X-Forwarded-For değeri (yayında platform yazar); yoksa "yerel". Yalnız IP kilidi için. */
async function istemciIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "yerel").slice(0, 64);
}

export async function girisEylemi(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  if (!(await ayniKoken())) return { hata: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const kiraci = await istekKiracisi();
  if (!kiraci) return { hata: "Bu adreste kayıtlı bir firma yok." };
  const g = GirisSemasi.safeParse({ eposta: form.get("eposta"), parola: form.get("parola"), donus: form.get("donus") || undefined });
  if (!g.success || !g.data.eposta || !g.data.parola) return { hata: "E-posta ve parola yazılmalı.", eposta: String(form.get("eposta") ?? "").slice(0, 254) };
  const h = await headers();
  const sonuc = await girisYap(havuz(), kiraci.firmaId, {
    eposta: g.data.eposta, parola: g.data.parola, ip: await istemciIp(), tarayici: h.get("user-agent") ?? undefined,
  });
  if (!sonuc.tamam) {
    return {
      eposta: g.data.eposta,
      hata: sonuc.neden === "kilitli"
        ? "Çok sayıda hatalı deneme yapıldı; giriş 15 dakika kilitlendi. Daha sonra yeniden deneyin."
        : "E-posta ya da parola yanlış. 5 hatalı denemeden sonra giriş 15 dakika kilitlenir.",
    };
  }
  (await cookies()).set(CEREZ, sonuc.belirtec, cerezAyari(sonuc.bitis));
  /* yönlendirme istemcide TAM sayfa geçişiyle (eylem içinden yönlendirilen sayfa yeni çerezi aynı istekte görmüyor — 2026-10-04 e2e yakaladı) */
  return { yonlendir: guvenliDonus(g.data.donus) ? g.data.donus : "/" };
}

export async function cikisEylemi(): Promise<void> {
  if (!(await ayniKoken())) redirect("/");
  const kiraci = await istekKiracisi();
  const c = await cookies();
  if (kiraci) await cikisYap(havuz(), kiraci.firmaId, c.get(CEREZ)?.value);
  c.delete(CEREZ);
  redirect("/giris?neden=cikis");
}
