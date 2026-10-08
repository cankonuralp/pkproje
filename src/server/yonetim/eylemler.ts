"use server";
/* YÖNETİM GİRİŞ / ÇIKIŞ EYLEMLERİ (348). Yalnız yönetim adresinde; köken iki katman (Next + ayniKoken). Belirteç yalnız çerezde (HttpOnly,
   SameSite=Strict); yönetici kimliği istemciden alınmaz. Yanıt hesabın var olup olmadığını söylemez. Başarılı adımdan sonra yalnız sabit site içi
   adrese gidilir (açık yönlendirme yok). */
import { cookies } from "next/headers";
import { parola as parolaSemasi, z } from "../../sema/ortak.ts";
import { havuz } from "../db/havuz.ts";
import { ayniKoken, istemciIp } from "../kimlik/koken.ts";
import { bekleyenOturum, ikiAdimAcik, kodDogrula, kurulumTamamla, yoneticiGiris } from "./giris.ts";
import { yonetimAdresinde, yonetimCerezAyari, YONETIM_CEREZ } from "./istek.ts";

export interface YGirisDurumu { hata?: string; eposta?: string; yonlendir?: string }
export interface YKodDurumu { hata?: string; yonlendir?: string }
export interface YKurulumDurumu { hata?: { kod?: string; p1?: string; p2?: string; genel?: string }; yonlendir?: string }

const REDDEDILDI = "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
const KILITLI = "Çok sayıda hatalı deneme yapıldı; giriş 15 dakika kilitlendi. Daha sonra yeniden deneyin.";
const OTURUM = "/yonetim/giris?neden=oturum";

const GirisSemasi = z.object({ eposta: z.string().trim().toLowerCase().max(254), parola: z.string().max(200) });
const kodTemiz = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\s/g, "").slice(0, 12);

export async function yonetimGirisEylemi(_onceki: YGirisDurumu, form: FormData): Promise<YGirisDurumu> {
  if (!(await yonetimAdresinde()) || !(await ayniKoken())) return { hata: REDDEDILDI };
  const g = GirisSemasi.safeParse({ eposta: form.get("eposta"), parola: form.get("parola") });
  if (!g.success || !g.data.eposta || !g.data.parola) return { hata: "E-posta ve parola yazılmalı.", eposta: String(form.get("eposta") ?? "").slice(0, 254) };
  const r = await yoneticiGiris(havuz(), { eposta: g.data.eposta, parola: g.data.parola, ip: await istemciIp() });
  if (!r.tamam) {
    return { eposta: g.data.eposta, hata: r.neden === "kilitli" ? KILITLI : "E-posta ya da parola yanlış. 5 hatalı denemeden sonra giriş 15 dakika kilitlenir." };
  }
  (await cookies()).set(YONETIM_CEREZ, r.belirtec, yonetimCerezAyari());
  /* 393: iki adım kapalıyken belirteç yönetim oturumunun kendisi → doğrudan panele */
  return { yonlendir: r.sonraki === "tamam" ? "/yonetim" : r.sonraki === "kurulum" ? "/yonetim/giris/kurulum" : "/yonetim/giris/kod" };
}

export async function yonetimKodEylemi(_onceki: YKodDurumu, form: FormData): Promise<YKodDurumu> {
  if (!(await yonetimAdresinde()) || !(await ayniKoken())) return { hata: REDDEDILDI };
  if (!(await ikiAdimAcik(havuz()))) return { yonlendir: "/yonetim/giris" };   // 393: iki adım kapalı — kod adımı yok
  const c = await cookies();
  const belirtec = c.get(YONETIM_CEREZ)?.value;
  const kod = kodTemiz(form.get("kod"));
  if (!/^\d{6}$/.test(kod)) return { hata: "Uygulamadaki 6 haneli kodu yazın." };
  const r = await kodDogrula(havuz(), { belirtec, kod, ip: await istemciIp() });
  if (!r.tamam) {
    if (r.neden === "oturum") {
      /* ilk kurulumu yapılmamış yönetici kod adımına gelemez: kuruluma */
      return { yonlendir: (await bekleyenOturum(havuz(), belirtec))?.durum === "ilk" ? "/yonetim/giris/kurulum" : OTURUM };
    }
    return { hata: r.neden === "kilitli" ? KILITLI : "Kod yanlış ya da süresi geçti. Uygulamadaki güncel kodu yazın." };
  }
  c.set(YONETIM_CEREZ, r.belirtec, yonetimCerezAyari());
  return { yonlendir: "/yonetim" };
}

export async function yonetimKurulumEylemi(_onceki: YKurulumDurumu, form: FormData): Promise<YKurulumDurumu> {
  if (!(await yonetimAdresinde()) || !(await ayniKoken())) return { hata: { genel: REDDEDILDI } };
  if (!(await ikiAdimAcik(havuz()))) return { yonlendir: "/yonetim/giris" };   // 393: iki adım kapalı — kurulum yok
  const kod = kodTemiz(form.get("kod"));
  const p1 = String(form.get("p1") ?? ""), p2 = String(form.get("p2") ?? "");
  const hata: NonNullable<YKurulumDurumu["hata"]> = {};
  if (!/^\d{6}$/.test(kod)) hata.kod = "Uygulamadaki 6 haneli kodu yazın.";
  const s = parolaSemasi.safeParse(p1);
  if (!s.success) hata.p1 = s.error.issues[0]?.message ?? "En az 10 karakter; harf ve rakam içermeli.";
  else if (p1 !== p2) hata.p2 = "İki parola aynı değil.";
  if (Object.keys(hata).length) return { hata };
  const c = await cookies();
  const r = await kurulumTamamla(havuz(), { belirtec: c.get(YONETIM_CEREZ)?.value, kod, yeni: p1, ip: await istemciIp() });
  if (!r.tamam) {
    if (r.neden === "oturum") return { yonlendir: OTURUM };
    if (r.neden === "ayni") return { hata: { p1: "Yeni parola geçici parolayla aynı olamaz." } };
    return { hata: r.neden === "kilitli" ? { genel: KILITLI } : { kod: "Kod yanlış ya da süresi geçti. Uygulamadaki güncel kodu yazın." } };
  }
  c.set(YONETIM_CEREZ, r.belirtec, yonetimCerezAyari());
  return { yonlendir: "/yonetim" };
}

/* çıkış sunucu eylemi DEĞİL (355): düz form isteği — src/app/(yonetim)/yonetim/cikis/route.ts (istek.ts yonetimOturumunuKapat) */
