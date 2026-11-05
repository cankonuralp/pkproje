/* YÖNETİM › FİRMA › PROBATA SIGN (2026-11-05, göç 0122; reisim: "bu api keyi ve webhook kodunu girdiğimde imza sisteminin firma için aktif olacağı …
   ben yönetim kısmından gireyim"; tasarım 59EF1ZZAJZdg6BztvuiWbr). Firmanın sign hesabının API anahtarı ve sign'ın verdiği webhook sırrı yalnız
   burada girilir: önce anahtar sign'a denenir (yanlışsa kayıt yok), sonra ikisi şifreli firma_sir'e (firma_yonetim_sir — uygulama rolü yazamaz, K1).
   İkisi de varsa firma sign ile imzalar (Firma ayarları › İmza yöntemi "probata sign · e-imza"). Kaldır: iki sır silinir, firma bugünkü yola döner.
   Webhook adresi firmanın adresinden: https://<kısa ad>.<ana alan>/api/sign/bildirim (sign'a bu girilir). */
import { z } from "zod";
import { sifrele } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { SignHatasi, signIstemcisi } from "../../../server/dis/sign.ts";
import { firmaAdresi } from "../../../server/kiraci/istek.ts";
import { firmada, yer, type YonetimCalistirici } from "./firma-tarafi.ts";
import type { YonetimSonucu } from "./yonetim.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ULASILAMADI = "Firmanın veritabanına ulaşılamadı; yeniden deneyin.";
export const SignGirdisi = z.object({
  anahtar: z.string().trim().regex(/^psk_[A-Za-z0-9]+_[A-Za-z0-9_-]{8,200}$/, "sign API anahtarı psk_ ile başlar (sign › Geliştirici › API anahtarları)."),
  sir: z.string().trim().min(16, "Webhook sırrı en az 16 karakter (sign › Geliştirici › Webhook eklerken bir kez gösterilir).").max(200, "Webhook sırrı çok uzun."),
});

export interface SignBaglantisi { etkin: boolean; anahtar: string | null; sir: string | null; degisti: string | null; sonBildirim: string | null; webhook: string }
/** firmanın sign bağlantısının görünümü (sırların yalnız son 4 hanesi) */
export async function signBaglantisiOku(c: YonetimCalistirici, id: string): Promise<SignBaglantisi | null> {
  if (!UUID.test(id)) return null;
  const y = await yer(c, id);
  if (!y || y.vt === "kurulum") return null;
  const oku = (db: Sorgulayici) => db.sorgu<{ s: { anahtar: string | null; sir: string | null; degisti: string | null; son_bildirim: string | null; kisa_ad: string | null } }>(
    "SELECT firma_yonetim_sign($1) AS s", [id]).then((r) => r.rows[0]?.s ?? null);
  const s = y.vt === "ortak" ? await c.merkez(oku) : await firmada(c, y.kayit, id, oku);
  if (!s) return null;
  return { etkin: !!s.anahtar && !!s.sir, anahtar: s.anahtar, sir: s.sir, degisti: s.degisti, sonBildirim: s.son_bildirim,
    webhook: s.kisa_ad ? `${firmaAdresi(s.kisa_ad)}/api/sign/bildirim` : "" };
}

/** anahtarı sign'a dener (kayıt yok) */
export async function signDene(duz: string, istemci = signIstemcisi): Promise<string | null> {
  try { await istemci(duz).dene(); return null; } catch (e) { return e instanceof SignHatasi ? e.message : "probata sign'a ulaşılamadı."; }
}

/** kaydet ve etkinleştir (girdi) ya da kaldır (null) */
export async function signBaglantisiYonet(c: YonetimCalistirici, id: string, girdi: { anahtar: string; sir: string } | null, anaAnahtar: Buffer,
  istemci = signIstemcisi): Promise<YonetimSonucu> {
  if (!UUID.test(id)) return { durum: "yok" };
  let v: z.output<typeof SignGirdisi> | null = null;
  if (girdi) {
    const g = SignGirdisi.safeParse(girdi);
    if (!g.success) return { durum: "gecersiz", hatalar: Object.fromEntries(g.error.issues.map((i) => [String(i.path[0]), i.message])) };
    v = g.data;
    const n = await signDene(v.anahtar, istemci);
    if (n) return { durum: "gecersiz", hatalar: { anahtar: n } };
  }
  const y = await yer(c, id);
  if (!y) return { durum: "yok" };
  if (y.vt === "kurulum") return { durum: "red", neden: "Firmanın kurulumu bitmedi." };
  const yaz = async (db: Sorgulayici) => {
    for (const [ad, deger] of [["sign_anahtari", v?.anahtar ?? null], ["sign_webhook_sirri", v?.sir ?? null]] as const) {
      const s = (await db.sorgu<{ s: { durum?: string } }>("SELECT firma_yonetim_sir($1, $2, $3, $4) AS s",
        [id, ad, deger === null ? null : sifrele(deger, id, ad, anaAnahtar), deger === null ? null : deger.slice(-4)])).rows[0]!.s;
      if (s.durum !== "tamam") return false;
    }
    return true;
  };
  const r = y.vt === "ortak" ? await c.merkez(yaz) : await firmada(c, y.kayit, id, yaz);
  if (r === null) return { durum: "red", neden: ULASILAMADI };
  if (!r) return { durum: "red", neden: "Kaydedilemedi." };
  return { durum: "tamam" };
}
