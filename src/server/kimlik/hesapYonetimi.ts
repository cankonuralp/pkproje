/* GİRİŞ HESABI YÖNETİMİ (maket personel.html "Giriş hesabı ve roller", karar 33–34): hesap personele bağlı açılır, geçici parola YALNIZ BİR KEZ
   döner (veritabanında yalnız özeti; ize yazılmaz), kişi ilk girişte değiştirebilir. Yetki: canDoEylem — hesap aç / kapat, geçici parola, roller
   yalnız firma yöneticisi. Kural (reisim karar 32 "yönetici kendini kilitleyemesin" + ENGEL 8): ayrılan personele hesap açılmaz; firmada etkin
   en az bir firma yöneticisi kalır (son yönetici rolünü bırakamaz, hesabı kapatılamaz). Rol / durum / parola değişince oturumlar düşer (0002 tetiği). */
import { randomInt } from "node:crypto";
import type { Sorgulayici } from "../db/kiraci.ts";
import { izYaz } from "../db/yazici.ts";
import { canDoEylem, type YetkiHesabi } from "../yetki/canDo.ts";
import { ROLLER, type Rol } from "../yetki/tanim.ts";
import { parolaOzeti } from "./parola.ts";

export interface Yonetici extends YetkiHesabi { ad: string }
export type HesapSonucu<T = Record<never, never>> = ({ durum: "tamam" } & T) | { durum: "yetkisiz" } | { durum: "yok" } | { durum: "red"; neden: string } | { durum: "gecersiz"; hatalar: Record<string, string> };

/** geçici parola: üç öbek, karışabilen harfler yok (I, l, O, 0, 1); harf + rakam içerir (karar 37) — maketteki biçim */
export function geciciParolaUret(): string {
  const A = "ABCDEFGHJKMNPRSTUVYZ", a = "abcdefghjkmnprstuvyz", d = "23456789";
  const al = (k: string) => k[randomInt(k.length)];
  return [[A, a, d, a, a], [A, d, a, a, d], [d, A, a, d, a]].map((g) => g.map(al).join("")).join("-");
}

const rolGecerli = (r: unknown): r is Rol => typeof r === "string" && (ROLLER as readonly string[]).includes(r);

interface PersonelHesabi { pid: string; ad: string; durum: "etkin" | "ayrildi"; eposta: string | null; hid: string | null; hdurum: "ilk" | "etkin" | "pasif" | null; roller: Rol[] | null }
async function oku(db: Sorgulayici, personelId: string): Promise<PersonelHesabi | null> {
  if (!/^[0-9a-f-]{36}$/.test(personelId)) return null;
  return (await db.sorgu<PersonelHesabi>(
    `SELECT p.id::text AS pid, p.ad, p.durum, p.eposta, h.id::text AS hid, h.durum AS hdurum, h.roller
     FROM personel p LEFT JOIN hesap h ON h.personel_id = p.id WHERE p.id = $1 FOR UPDATE OF p`, [personelId])).rows[0] ?? null;
}

/** bu değişiklikten sonra firmada etkin (pasif olmayan) firma yöneticisi kalıyor mu */
async function yoneticiKalir(db: Sorgulayici, haricHesap: string): Promise<boolean> {
  /* iki yönetici aynı anda birbirinin rolünü alırsa ikisi de "öteki kalıyor" görmesin: firma başına işlem kilidi (işlem bitince bırakılır) */
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtext('probata:son_yonetici:' || gecerli_firma()::text))");
  const r = await db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM hesap WHERE durum <> 'pasif' AND 'firma_yoneticisi' = ANY(roller) AND id <> $1", [haricHesap]);
  return r.rows[0].n > 0;
}
const SON_YONETICI = "Firmada en az bir firma yöneticisi kalmalı; önce başka birine bu rolü verin.";

export async function hesapAc(db: Sorgulayici, kim: Yonetici, personelId: string, g: { eposta: unknown; roller: unknown }): Promise<HesapSonucu<{ parola: string }>> {
  if (!canDoEylem(kim, "hesap_ac_kapat")) return { durum: "yetkisiz" };
  const p = await oku(db, personelId);
  if (!p) return { durum: "yok" };
  if (p.durum !== "etkin") return { durum: "red", neden: "Ayrılan personele hesap açılmaz." };
  if (p.hid) return { durum: "red", neden: "Bu kişinin giriş hesabı var." };
  const eposta = typeof g.eposta === "string" ? g.eposta.trim().toLowerCase() : "";
  const roller = Array.isArray(g.roller) ? [...new Set(g.roller)] : [];
  const h: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta) || eposta.length > 254) h.eposta = "E-posta biçimi geçersiz.";
  if (!roller.length || !roller.every(rolGecerli)) h.roller = "En az bir rol seçilmeli.";
  if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
  const parola = geciciParolaUret();
  try {
    const r = await db.sorgu<{ id: string }>(
      "INSERT INTO hesap (eposta, ad, parola_ozeti, roller, durum, personel_id) VALUES ($1, $2, $3, $4, 'ilk', $5) RETURNING id::text",
      [eposta, p.ad, await parolaOzeti(parola), roller, p.pid]);
    if (p.eposta !== eposta) await db.sorgu("UPDATE personel SET eposta = $2, surum = surum + 1, degisti = now() WHERE id = $1", [p.pid, eposta]);
    await izYaz(db, { kim: kim.ad, ne: "hesap.ac", nesne: "hesap", nesneId: r.rows[0].id, yeni: { eposta, roller, durum: "ilk" } });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { durum: "gecersiz", hatalar: { eposta: "Bu e-posta başka bir hesapta kayıtlı." } };
    throw e;
  }
  return { durum: "tamam", parola };
}

export async function yeniGeciciParola(db: Sorgulayici, kim: Yonetici, personelId: string): Promise<HesapSonucu<{ parola: string }>> {
  if (!canDoEylem(kim, "gecici_parola")) return { durum: "yetkisiz" };
  const p = await oku(db, personelId);
  if (!p?.hid) return { durum: "yok" };
  if (p.hdurum === "pasif") return { durum: "red", neden: "Hesap kapalı: önce yeniden açın." };
  const parola = geciciParolaUret();
  await db.sorgu("UPDATE hesap SET parola_ozeti = $2, durum = 'ilk', hatali_deneme = 0, kilit_bitis = NULL, surum = surum + 1 WHERE id = $1", [p.hid, await parolaOzeti(parola)]);
  await izYaz(db, { kim: kim.ad, ne: "hesap.gecici_parola", nesne: "hesap", nesneId: p.hid });
  return { durum: "tamam", parola };
}

export async function hesapKapat(db: Sorgulayici, kim: Yonetici, personelId: string): Promise<HesapSonucu> {
  if (!canDoEylem(kim, "hesap_ac_kapat")) return { durum: "yetkisiz" };
  const p = await oku(db, personelId);
  if (!p?.hid) return { durum: "yok" };
  if (p.hdurum === "pasif") return { durum: "tamam" };
  if (p.roller?.includes("firma_yoneticisi") && !(await yoneticiKalir(db, p.hid))) return { durum: "red", neden: SON_YONETICI };
  await db.sorgu("UPDATE hesap SET durum = 'pasif', surum = surum + 1 WHERE id = $1", [p.hid]);
  await izYaz(db, { kim: kim.ad, ne: "hesap.kapat", nesne: "hesap", nesneId: p.hid, eski: { durum: p.hdurum }, yeni: { durum: "pasif" } });
  return { durum: "tamam" };
}

/** kapalı hesabı yeniden açar (parola aynı); ayrılan personelde açılmaz */
export async function hesapYenidenAc(db: Sorgulayici, kim: Yonetici, personelId: string): Promise<HesapSonucu> {
  if (!canDoEylem(kim, "hesap_ac_kapat")) return { durum: "yetkisiz" };
  const p = await oku(db, personelId);
  if (!p?.hid) return { durum: "yok" };
  if (p.durum !== "etkin") return { durum: "red", neden: "Ayrılan personele hesap açılmaz." };
  if (p.hdurum !== "pasif") return { durum: "tamam" };
  await db.sorgu("UPDATE hesap SET durum = 'etkin', hatali_deneme = 0, kilit_bitis = NULL, surum = surum + 1 WHERE id = $1", [p.hid]);
  await izYaz(db, { kim: kim.ad, ne: "hesap.yeniden_ac", nesne: "hesap", nesneId: p.hid, eski: { durum: "pasif" }, yeni: { durum: "etkin" } });
  return { durum: "tamam" };
}

/** rolleri kaydeder: en az bir rol, yalnız tanımlı roller; son firma yöneticisi rolünü bırakamaz */
export async function rolleriKaydet(db: Sorgulayici, kim: Yonetici, personelId: string, rollerGirdi: unknown): Promise<HesapSonucu> {
  if (!canDoEylem(kim, "hesap_ac_kapat")) return { durum: "yetkisiz" };
  const roller = Array.isArray(rollerGirdi) ? [...new Set(rollerGirdi)] : [];
  if (!roller.length || !roller.every(rolGecerli)) return { durum: "gecersiz", hatalar: { roller: "En az bir rol seçilmeli." } };
  const p = await oku(db, personelId);
  if (!p?.hid) return { durum: "yok" };
  if (p.hdurum === "pasif") return { durum: "red", neden: "Hesap kapalı: roller değiştirilemez." };
  if (p.roller?.includes("firma_yoneticisi") && !roller.includes("firma_yoneticisi") && !(await yoneticiKalir(db, p.hid))) return { durum: "red", neden: SON_YONETICI };
  const sirali = ROLLER.filter((r) => roller.includes(r));
  if (JSON.stringify(sirali) === JSON.stringify(ROLLER.filter((r) => p.roller?.includes(r)))) return { durum: "tamam" };
  await db.sorgu("UPDATE hesap SET roller = $2, surum = surum + 1 WHERE id = $1", [p.hid, sirali]);
  await izYaz(db, { kim: kim.ad, ne: "hesap.roller", nesne: "hesap", nesneId: p.hid, eski: { roller: p.roller }, yeni: { roller: sirali } });
  return { durum: "tamam" };
}
