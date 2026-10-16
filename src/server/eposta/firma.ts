/* FİRMANIN GÖNDERİM AYARI (536; FIRMA-VT §5.8, FV11 — 2026-10-16, K2 + K3): probata'nın TEK Resend hesabında firmanın alan adı — Yönetim ekler ve
   doğrular; firma tarafında KİLİTLİ kopya (firma_gonderim: alan, genel adres, doğrulandı mı) ve o alan adına bağlı gönderme anahtarı (şifreli sır
   "eposta_anahtari", YALNIZ burada, kullanılacağı an çözülür; uygulama rolü yazamaz — 0099). Gizli kopya firmanın ayarı ("eposta"), otomatik cevap
   Firma bilgileri › Rapor e-postası, görünen ad firma adı. Gönderim kaydı ya da anahtar yoksa (ya da sır çözülemiyorsa) null: e-postalar bekler
   (SAGLAYICI_YOK); alan adı doğrulanmadıysa kimden.ts bekletir. Kiracı bağlamında (çağıranın işlemi); yetki ÇAĞIRANDA. */
import { ayarOku, firmaBelgeKunyesi } from "../ayar/ayar.ts";
import { sirKullan } from "../ayar/sir.ts";
import type { Sorgulayici } from "../db/kiraci.ts";
import type { FirmaGonderimi } from "./kimden.ts";
import { epostaSaglayicisi, type EpostaSaglayici } from "./saglayici.ts";

export interface FirmaGonderimAyari { saglayici: EpostaSaglayici; firma: FirmaGonderimi }

/** firma tarafındaki kilitli gönderim kaydı (yoksa null) — Firma ayarları da buradan gösterir */
export async function gonderimKaydi(db: Sorgulayici): Promise<{ alan: string; genel: string; dogrulandi: boolean } | null> {
  return (await db.sorgu<{ alan: string; genel: string; dogrulandi: boolean }>("SELECT alan, genel, dogrulandi FROM firma_gonderim")).rows[0] ?? null;
}

export async function firmaGonderimi(db: Sorgulayici): Promise<FirmaGonderimAyari | null> {
  const g = await gonderimKaydi(db);
  if (!g) return null;
  let anahtar: string | null;
  /* sunucuda sır şifreleme anahtarı yoksa ya da sır bozuksa gönderilmez — e-posta bekler (düz metne düşülmez) */
  try { anahtar = await sirKullan(db, "eposta_anahtari"); } catch { return null; }
  const saglayici = epostaSaglayicisi(anahtar);
  if (!saglayici) return null;
  const a = (await ayarOku(db, "eposta")).deger;
  const k = await firmaBelgeKunyesi(db, null);
  return { saglayici, firma: { alan: g.alan, genel: g.genel, dogrulandi: g.dogrulandi, firmaAd: k.ad, kopya: a.kopya, rapor: k.eposta } };
}
