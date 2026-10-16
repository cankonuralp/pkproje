/* PROJE SAĞLIĞI UCU (FIRMA-VT FV7, 2026-10-15; §5.5) — yalnız iki sırdan birini taşıyan istek ("Authorization: Bearer <sır>"): PROBATA_SAGLIK_SIR (duman
   testi tools/duman.mjs PROBATA_DUMAN_SIR ile — YALNIZ bu ucu açar) ya da CRON_SECRET (zamanlayıcı — saatlik yoklama FV14). Sır yoksa / yanlışsa 401,
   iş koşmaz (gece ucunun deseni). 2026-10-15 (FV7 incelemesi, en az yetki): önce yalnız CRON_SECRET'le açılıyordu; duman testinin makinesine konan
   sır gece işlerini de (çöp temizliği, saklama süresi dolan PDF silme, depo taşıma, e-posta) tetikleyebiliyordu. Oturum ve kiracı yok: merkezdeki
   goc_hedefleri()'ndeki her kendi projeli firmanın veritabanı yoklanır (src/server/saglik.ts projeleriYokla: 4 aynı anda, proje başına 5 sn, uç en çok
   45 sn). Yanıt YALNIZ sayılar {toplam, tamam, sorunlu} — firma adı / kimliği / nedeni yok (proje başına sonuç merkezde firma_vt.son_saglik'te).
   Sorunlu proje varsa 503; merkez okunamaz / yazılamazsa 503 + kısa ileti. Önbellek yok. maxDuration 50: PDF uçlarının (60 — Chromium paketli işlev)
   grubuna girmesin. */
import { projeSagligi } from "../../../../server/saglik";
import { zamanliYetkili } from "../../../../server/is/yetki";

export const dynamic = "force-dynamic";
export const maxDuration = 50;

const BASLIK = { "Cache-Control": "no-store" };

export async function GET(istek: Request) {
  const yetki = istek.headers.get("authorization");
  if (!zamanliYetkili(yetki, process.env.PROBATA_SAGLIK_SIR) && !zamanliYetkili(yetki, process.env.CRON_SECRET)) {
    return Response.json({ hata: "Yetkisiz." }, { status: 401, headers: BASLIK });
  }
  const o = await projeSagligi();
  if (!o) return Response.json({ hata: "Merkez okunamadı ya da yazılamadı." }, { status: 503, headers: BASLIK });
  return Response.json({ toplam: o.toplam, tamam: o.tamam, sorunlu: o.sorunlu }, { status: o.sorunlu ? 503 : 200, headers: BASLIK });
}
