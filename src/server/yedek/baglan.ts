/* HESABI BAĞLAMA / KESME VE EKRANIN BİLGİSİ (2026-11-03) — çağıranın kiracı işleminde; YETKİ ÇAĞIRANDA (Firma ayarları "yaz" — firma yöneticisi).
   Bağlama: tek kullanımlık durum kodu + PKCE doğrulayıcısı veritabanına (15 dk), tarayıcı hizmetin izin ekranına gider. Durum "<firma kısa adı>.<kod>":
   dönüş adresi tek (hizmette kayıtlı), oraya gelen istek firmanın adresine yönlenir (src/app/api/bulut/donus). Dönüşte kod bir kez kullanılır,
   başlatan kişiyle aynı oturum ister; yenileme anahtarı şifreli sırra, hesap adresi bağlantıya yazılır. */
import { createHash, randomBytes } from "node:crypto";
import type { Sorgulayici } from "../db/kiraci.ts";
import { BulutKopuk, type BulutSaglayici } from "../dis/bulut.ts";
import { hizmetHazir, ortamHizmeti, type HizmetBul } from "./calis.ts";
import { baglantiKesYaz, baglantiOku, baglantiYaz, izinAl, izinYaz, kuyrukSayilari, yenilemeAnahtari, yenilemeYaz, type BaglantiDurumu } from "./kayit.ts";

export type BaglanSonucu = "bagli" | "suresi" | "baskasi" | "hizmet" | "izin";

export async function baglanBaslat(db: Sorgulayici, s: { saglayici: BulutSaglayici; hesapId: string; kisaAd: string },
  hizmetBul: HizmetBul = ortamHizmeti): Promise<{ adres: string } | null> {
  const hz = hizmetBul(s.saglayici);
  if (!hz) return null;
  const kod = randomBytes(32).toString("base64url"), dogrulayici = randomBytes(48).toString("base64url");
  await izinYaz(db, { kod, dogrulayici, saglayici: s.saglayici, hesapId: s.hesapId });
  return { adres: hz.izinAdresi(`${s.kisaAd}.${kod}`, createHash("sha256").update(dogrulayici).digest("base64url")) };
}

/** dönüşteki "state" → firma kısa adı + kod (biçimsizse null) */
export function durumCoz(durum: string): { kisaAd: string; kod: string } | null {
  const m = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.([A-Za-z0-9_-]{32,64})$/.exec(durum);
  return m ? { kisaAd: m[1]!, kod: m[2]! } : null;
}

export async function baglanBitir(db: Sorgulayici, s: { kod: string; yetkiKodu: string; hesapId: string; kim: string },
  hizmetBul: HizmetBul = ortamHizmeti): Promise<BaglanSonucu> {
  const i = await izinAl(db, s.kod);
  if (!i || !i.gecerli) return "suresi";
  if (i.hesap_id !== s.hesapId) return "baskasi";
  const hz = hizmetBul(i.saglayici);
  if (!hz) return "hizmet";
  let anahtar: { erisim: string; yenileme: string }, hesap: string;
  try {
    anahtar = await hz.kodTakas(s.yetkiKodu, i.dogrulayici);
    hesap = await hz.hesap(anahtar.erisim);
  } catch (e) {
    return e instanceof BulutKopuk ? "izin" : "hizmet";
  }
  await yenilemeYaz(db, anahtar.yenileme);
  await baglantiYaz(db, { saglayici: i.saglayici, hesap, kim: s.kim });
  return "bagli";
}

export async function baglantiKes(db: Sorgulayici, kim: string, hizmetBul: HizmetBul = ortamHizmeti): Promise<boolean> {
  const b = await baglantiOku(db);
  if (!b || b.durum === "kesildi") return false;
  const y = await yenilemeAnahtari(db);
  if (y) await hizmetBul(b.saglayici)?.birak(y);
  await baglantiKesYaz(db, kim);
  return true;
}

export interface YedekGorunumu {
  baglanti: { saglayici: BulutSaglayici; hesap: string; durum: BaglantiDurumu; neden: string | null; baglandi: string; sonKopya: string | null;
    sonDosya: string | null; tamKopya: string | null; ayGonderim: string | null } | null;
  kuyruk: { gonderildi: number; bekliyor: number; bayt: number };
  arsiv: { sonAy: string | null; tamYil: string | null };
  hazir: Record<BulutSaglayici, boolean>;
}

const iso = (t: Date | null) => (t ? t.toISOString() : null);
export async function yedekGorunumu(db: Sorgulayici): Promise<YedekGorunumu> {
  const b = await baglantiOku(db);
  const a = (await db.sorgu<{ ay: string | null; tam: string | null }>(
    "SELECT max(donem) FILTER (WHERE tur = 'ay') AS ay, max(donem) FILTER (WHERE tur = 'tam') AS tam FROM yedek_arsiv")).rows[0];
  return {
    baglanti: b ? { saglayici: b.saglayici, hesap: b.hesap, durum: b.durum, neden: b.neden, baglandi: b.baglandi.toISOString(), sonKopya: iso(b.son_kopya),
      sonDosya: b.son_dosya, tamKopya: iso(b.tam_kopya), ayGonderim: iso(b.ay_gonderim) } : null,
    kuyruk: await kuyrukSayilari(db),
    arsiv: { sonAy: a?.ay ?? null, tamYil: a?.tam ?? null },
    hazir: { gdrive: hizmetHazir("gdrive"), onedrive: hizmetHazir("onedrive") },
  };
}

/** yan menü balonu (Firma ayarları): bağlantı koptu ya da hesap doldu */
export async function yedekSorunu(db: Sorgulayici): Promise<boolean> {
  const b = await baglantiOku(db);
  return !!b && (b.durum === "kopuk" || b.durum === "dolu");
}
