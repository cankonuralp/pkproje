/* YÖNETİM İŞLEMLERİNİN ÇALIŞTIRICISI (FIRMA-VT §5.11, FV9 — 2026-10-16): merkezde yönetim işlemi (yonetimIslemi — yönetim rolü + oturumdaki yönetici),
   kendi projeli firmanın veritabanında yönetim işlemi (yonetimFirmadaIcinde — firmanın havuzu, yöneticinin e-postası, vt_firma_dogrula). Yalnız sunucuda,
   yönetim oturumuyla (yönetici istemciden alınmaz). Sıra ve kurallar firma-tarafi.ts'te. */
import "server-only";
import { anaAnahtar } from "../../../server/ayar/sir";
import { merkezYerelMi } from "../../../server/db/baglanti";
import { firmaHavuzu } from "../../../server/db/firma-havuzu";
import { yonetimFirmadaIcinde } from "../../../server/db/kiraci";
import { resendAyari, resendYonetimi } from "../../../server/dis/resend-yonetim";
import { kurulumAyari, supabaseYonetimi } from "../../../server/dis/supabase-yonetim";
import type { YoneticiOturumu } from "../../../server/yonetim/giris";
import { yonetimGocKilidi, yonetimIslemi } from "../../../server/yonetim/istek";
import type { EpostaOrtami } from "./eposta";
import type { YonetimCalistirici } from "./firma-tarafi";
import type { KurulumOrtami } from "./kurulum";

export function yonetimCalistirici(o: YoneticiOturumu): YonetimCalistirici {
  return {
    merkez: (is) => yonetimIslemi(o, is),
    firmada: (kayit, firmaId, is) => yonetimFirmadaIcinde(firmaHavuzu(kayit), firmaId, is, { yoneticiEposta: o.eposta }),
  };
}

/** FV10: kurulumun ortamı — Yönetim API anahtarı ve örgüt ortamda yoksa null ("Kendi Supabase projesi" seçeneği kapalı, açıklamalı) */
export function kurulumOrtami(o: YoneticiOturumu): KurulumOrtami | null {
  const k = kurulumAyari(process.env);
  if (!k) return null;
  return {
    ...yonetimCalistirici(o), api: supabaseYonetimi(k.yonetim), yerel: k.yonetim.yerel, orgut: k.orgut, anaAnahtar: anaAnahtar(), merkezYerel: merkezYerelMi(),
    depoUc: k.depoUc ?? undefined, firmaHavuzu, gocKilidi: yonetimGocKilidi(),
  };
}
/** "Kendi Supabase projesi" seçeneği açık mı (anahtar + örgüt ortamda) */
export const kendiProjeAcik = (): boolean => kurulumAyari(process.env) !== null;

/** FV11: e-posta gönderiminin ortamı — probata'nın Resend anahtarı ortamda yoksa null ("E-posta gönderimi" bölümü kapalı, açıklamalı) */
export function epostaOrtami(o: YoneticiOturumu): EpostaOrtami | null {
  const a = resendAyari(process.env);
  return a ? { ...yonetimCalistirici(o), resend: resendYonetimi(a), anaAnahtar: anaAnahtar() } : null;
}
/** "E-posta gönderimi" açık mı (Resend anahtarı ortamda) */
export const epostaAcik = (): boolean => { try { return resendAyari(process.env) !== null; } catch { return false; } };
