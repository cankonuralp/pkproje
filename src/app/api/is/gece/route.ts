/* GECE İŞLERİ UCU (378) — zamanlayıcı (Vercel Cron, vercel.json "crons") günde bir çağırır. Yalnız CRON_SECRET'i taşıyan istek (Vercel kendisi
   "Authorization: Bearer <sır>" ekler); sır yoksa / yanlışsa 401, iş koşmaz. Oturum ve kiracı yok: iş her firmayı kendi işleminde dolaşır
   (src/server/is/gece.ts). Sırayla: çöp temizliği, saklama süresi (387; Raporlar modülü — süresi dolan imzalı rapor PDF'leri; kalan süreyle),
   bekleyen e-postalar (432; yeniden deneme), depo taşıması (568; Supabase Storage'a — yalnız PROBATA_DEPO=supabase).
   Yanıt yalnız sayılar (firma adı / kimliği yok); çöp sayıları üst düzeyde, saklamanınkiler "saklama"da. Önbellek yok.
   FIRMA-VT FV6 (2026-10-16): firma listesi ve iş kaydı merkezde (merkezHavuzu); her firmanın adımı o firmanın havuzunda (firmaHavuzuKimlikle — ortak
   firmaya merkez, kendi projeliye kendi veritabanı); ulaşılamayan firma "ulasilamayan" sayılır, iş "hata" (500). */
import { firmaHavuzuKimlikle } from "../../../../server/db/firma-havuzu";
import { merkezHavuzu } from "../../../../server/db/havuz";
import { depo } from "../../../../server/dosya/depo";
import { saklamaIsi } from "../../../../modules/raporlar/server/saklama";
import { depoTasimaIsi, epostaIsi, GECE_SURE, geceIsleri, sayKapanisIsi, sayOgrenmeIsi } from "../../../../server/is/gece";
import { zamanliYetkili } from "../../../../server/is/yetki";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASLIK = { "Cache-Control": "no-store" };

export async function GET(istek: Request) {
  if (!zamanliYetkili(istek.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ hata: "Yetkisiz." }, { status: 401, headers: BASLIK });
  }
  const bas = Date.now();
  const o = await geceIsleri(merkezHavuzu(), depo(), GECE_SURE, firmaHavuzuKimlikle);
  /* saklama süresi işi kalan sürede (en az 5 sn); ayrı iş kaydı, ayrı kilit */
  const saklama = await saklamaIsi(merkezHavuzu(), depo(), Math.max(5_000, GECE_SURE - (Date.now() - bas)), firmaHavuzuKimlikle);
  const eposta = await epostaIsi(merkezHavuzu(), Math.max(5_000, GECE_SURE - (Date.now() - bas)), firmaHavuzuKimlikle);
  const tasima = await depoTasimaIsi(merkezHavuzu(), depo(), Math.max(5_000, GECE_SURE - (Date.now() - bas)), firmaHavuzuKimlikle);
  /* 2026-11-02 (göç 0116): 60 dakikayı geçmiş S.A.Y konuşmaları (pg_cron'un yedeği) + hizmetteki ek dosyaları */
  const kapanis = await sayKapanisIsi(merkezHavuzu(), Math.max(5_000, GECE_SURE - (Date.now() - bas)), firmaHavuzuKimlikle);
  /* 2026-11-05 (göç 0121): S.A.Y'ın öğrenmesi — puan + hafıza (kapanıştan sonra: kapanan konuşmaların işleri de sayılır) */
  const ogrenme = await sayOgrenmeIsi(merkezHavuzu(), Math.max(5_000, GECE_SURE - (Date.now() - bas)), firmaHavuzuKimlikle);
  const hata = o.durum === "hata" || saklama.durum === "hata" || eposta.durum === "hata" || tasima?.durum === "hata" || kapanis.durum === "hata"
    || ogrenme.durum === "hata";
  return Response.json({ ...o, saklama, eposta, ...(tasima ? { tasima } : {}), kapanis, ogrenme }, { status: hata ? 500 : 200, headers: BASLIK });
}
