/* FİRMANIN GÖNDERİM AYARI (536; reisim 2026-10-13: "A seçeneğini kabul ediyorum" — her firma kendi Resend hesabı): Resend anahtarı (şifreli sır
   "eposta_anahtari", YALNIZ burada, kullanılacağı an çözülür), gönderen alan adı ve gizli kopya (ayar "eposta"), genel adres = Firma bilgileri ›
   Rapor e-postası, görünen firma adı. Anahtar ya da alan adı yoksa (ya da sır çözülemiyorsa) null: e-postalar bekler (SAGLAYICI_YOK). Kiracı
   bağlamında (çağıranın işlemi); yetki ÇAĞIRANDA. */
import { ayarOku, firmaBelgeKunyesi } from "../ayar/ayar.ts";
import { sirKullan } from "../ayar/sir.ts";
import type { Sorgulayici } from "../db/kiraci.ts";
import type { FirmaGonderimi } from "./kimden.ts";
import { epostaSaglayicisi, type EpostaSaglayici } from "./saglayici.ts";

export interface FirmaGonderimAyari { saglayici: EpostaSaglayici; firma: FirmaGonderimi }

export async function firmaGonderimi(db: Sorgulayici): Promise<FirmaGonderimAyari | null> {
  const a = (await ayarOku(db, "eposta")).deger;
  if (!a.alan) return null;
  let anahtar: string | null;
  /* sunucuda sır şifreleme anahtarı yoksa ya da sır bozuksa gönderilmez — e-posta bekler (düz metne düşülmez) */
  try { anahtar = await sirKullan(db, "eposta_anahtari"); } catch { return null; }
  const saglayici = epostaSaglayicisi(anahtar);
  if (!saglayici) return null;
  const k = await firmaBelgeKunyesi(db, null);
  return { saglayici, firma: { alan: a.alan, genel: k.eposta, firmaAd: k.ad, kopya: a.kopya } };
}
