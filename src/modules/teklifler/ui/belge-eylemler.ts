"use server";
/* TEKLİFİ E-POSTAYLA GÖNDER — sunucu eylemi (2026-11-09; reisim: "teklif gönderme işi de mail ile olsun"). Kişi ve kiracı oturumdan; yetki, doğrulama ve durum
   modülde (server/gonderim.ts). PDF başsız Chromium'la basılır: bu dosya yalnız teklif sayfasında (/teklifler/[id] — maxDuration 60, next.config.ts PDF listesi);
   öteki Teklifler sayfaları ./eylemler.ts'i kullanır. Kuyruğa yazılan e-postalar yanıttan sonra gönderilir (src/server/eposta/sonra.ts). */
import { teklifPdf } from "../../../belge/pdf";
import { depo } from "../../../server/dosya/depo";
import { epostalariSonraGonder } from "../../../server/eposta/sonra";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { ayniKoken } from "../../../server/kimlik/koken";
import { teklifEpostaGonder, TeklifPdfHatasi } from "../server/gonderim";
import type { TeklifYaniti } from "./eylemler";

const SONUC = { yetkisiz: "Bu işlem için yetkiniz yok.", yok: "Teklif bulunamadı.", cakisma: "Teklif bu arada değişti. Sayfayı yenileyip yeniden deneyin." } as const;

export async function teklifEpostaGonderEylemi(id: string, surum: number, girdi: unknown): Promise<TeklifYaniti> {
  if (!(await ayniKoken())) return { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { genel: "Oturumunuz kapandı. Yeniden giriş yapın." };
  try {
    const r = await oturumIslemi(o, (db) => teklifEpostaGonder(db, depo(), o, o.kiraci.firmaId, typeof id === "string" ? id : "", Number.isSafeInteger(surum) ? surum : -1, girdi, teklifPdf));
    if (r.durum === "tamam") {
      epostalariSonraGonder(o.kiraci, "teklif", r.id);
      return { tamam: true, id: r.id, no: r.no, bildirim: r.bildirim };
    }
    return r.durum === "gecersiz" ? { hatalar: r.hatalar } : r.durum === "red" ? { genel: r.neden } : r.durum === "uyari" ? { uyarilar: r.uyarilar } : { genel: SONUC[r.durum] };
  } catch (h) {
    if (h instanceof TeklifPdfHatasi) return { genel: h.message };
    throw h;
  }
}
