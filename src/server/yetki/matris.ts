/* FİRMANIN ROL YETKİLERİ (maket personel.html #/roller; reisim 32: "başlangıç olarak uygun ama admin istediği gibi rollerin yetkilerini
   değiştirebilmeli"). Firma ayarlarında "rol_yetki" bölümünde durur; oturum her okunduğunda yüklenir ve canDo'ya hesapla birlikte gider
   (src/server/kimlik/oturum.ts) — değişiklik o rollerdeki herkes için BİR SONRAKİ istekte geçerli.
   Kurallar: yalnız firma yöneticisi değiştirir (canDoEylem rol_yetki_degistir); yalnız tanımlı modül ve düzeyler; firma yöneticisinin
   Personel / Firma ayarları / Hareket kaydı satırı (SABIT) ne gelirse gelsin sabit kalır — yönetici kendini kilitleyemez. */
import type { Sorgulayici } from "../db/kiraci.ts";
import { ayarOku, ayarYaz, type AyarYazSonucu } from "../ayar/ayar.ts";
import { canDoEylem, type YetkiHesabi } from "./canDo.ts";
import { DUZEYLER, MATRIS_ONERI, ROLLER, SABIT, type Duzey, type Matris, type ModulAnahtari } from "./tanim.ts";

export const MATRIS_ANAHTARLARI = Object.keys(MATRIS_ONERI).map((k) => (k === "hareket" ? k : Number(k))) as ModulAnahtari[];
const gecerli = (d: unknown): d is Duzey => typeof d === "string" && (DUZEYLER as readonly string[]).includes(d);

/** gelen değeri tam ve geçerli matrise çevirir: bilinmeyen modül atılır, eksik / bozuk satır önerilen düzenden, sabit hücreler zorlanır */
export function matrisTemizle(girdi: unknown): Matris {
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  const sonuc = {} as Record<string, Duzey[]>;
  for (const k of MATRIS_ANAHTARLARI) {
    const satir = g[String(k)];
    const oneri = MATRIS_ONERI[k];
    const temiz = Array.isArray(satir) && satir.length === ROLLER.length && satir.every(gecerli) ? [...satir] : [...oneri];
    for (const [rol, d] of Object.entries(SABIT[k] ?? {})) temiz[ROLLER.indexOf(rol as (typeof ROLLER)[number])] = d!;
    sonuc[String(k)] = temiz;
  }
  return sonuc as unknown as Matris;
}

export const oneriMi = (m: Matris) => MATRIS_ANAHTARLARI.every((k) => m[k].every((d, i) => d === MATRIS_ONERI[k][i]));

/** firmanın matrisi (kaydedilmemişse önerilen düzen) + sürüm (kaydedilmemişse -1) */
export async function matrisOku(db: Sorgulayici): Promise<{ matris: Matris; surum: number }> {
  const a = await ayarOku(db, "rol_yetki");
  return { matris: matrisTemizle(Object.keys(a.deger.matris).length ? a.deger.matris : MATRIS_ONERI), surum: a.surum };
}

export type MatrisSonucu = AyarYazSonucu | { durum: "yetkisiz" };

/** kaydeder (yalnız firma yöneticisi); istemcinin gördüğü sürümle — araya başkası girdiyse çakışma */
export async function matrisKaydet(db: Sorgulayici, kim: YetkiHesabi & { ad: string }, surum: number, girdi: unknown): Promise<MatrisSonucu> {
  if (!canDoEylem(kim, "rol_yetki_degistir")) return { durum: "yetkisiz" };
  const matris = matrisTemizle(girdi);
  return ayarYaz(db, "rol_yetki", surum, { matris }, { kim: kim.ad, ne: "rol_yetki.kaydet" });
}
