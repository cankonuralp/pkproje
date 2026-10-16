/* DUYURU OKUMASINI YANITTAN SONRA BAŞLAT (379) — Ana sayfa yanıtı beklemez (Next after: yanıt gittikten sonra, sayfanın süre sınırı içinde).
   Okuma düşerse kayda geçer (is_calisma "hata"), sayfa etkilenmez.
   FIRMA-VT FV6 (§5.9, 2026-10-16): Ana sayfanın duyuru bölümü de MERKEZDEN okunur (duyuruBolumuMerkezden — salt okunur merkez işlemi; duyurular firmaya
   ait değil): kendi veritabanlı firmanın veritabanında duyuru / iş kaydı yok — kiracı işleminde okununca "tazele" hep doğru çıkıyor, her açılış
   Bakanlığa üç istek başlatıyordu. Merkez okunamazsa bölüm "alınamadı" görünür, sayfa düşmez. */
import { after } from "next/server";
import { merkezHavuzu } from "../db/havuz.ts";
import { merkezOku } from "../db/merkez.ts";
import { duyuruBolumu, duyurulariOku, type DuyuruBolumu } from "./okuma.ts";

/** Ana sayfanın duyuru bölümü, merkezden (salt okunur) */
export async function duyuruBolumuMerkezden(): Promise<DuyuruBolumu> {
  try {
    return await merkezOku(merkezHavuzu(), (db) => duyuruBolumu(db));
  } catch (h) {
    console.error("[duyuru] merkezden okunamadı:", (h as Error).message);
    return { liste: [], guncellendi: null, hata: true, hatali: [], tazele: false };
  }
}

export function duyuruTazeleSonra(): void {
  after(async () => {
    try { await duyurulariOku(merkezHavuzu()); } catch (h) { console.error("[duyuru] okuma düştü:", (h as Error).message); }
  });
}
