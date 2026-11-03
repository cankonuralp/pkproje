/* FİRMA AYARLARI (modül 22; maket firma-ayarlari.html — 334): kapı ve yetki sunucuda (Firma ayarları "gör"; değiştirmek "yaz"). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { firmaAyarlari } from "../../../modules/firma-ayarlari/server/ayarlar";
import { FirmaAyarlari } from "../../../modules/firma-ayarlari/ui/FirmaAyarlari";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("firma-ayarlari")!;
export const metadata: Metadata = { title: MODUL.ad };
/* 2026-11-03: "Şimdi yedekle" yanıttan sonra 45 sn gönderir (src/server/yedek/sonra.ts) */
export const maxDuration = 60;

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ yedek?: string | string[] }> }) {
  const { yedek } = await searchParams;
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => firmaAyarlari(db, o));
  if (!v) return <Yetkisiz />;
  /* FIRMA-VT FV10 (K3): Depolama yalnız bilgi — kiracının projesi (kendi / ortak) isteğin kiracısından */
  /* 2026-11-03: Google / Microsoft izin ekranından dönüşün sonucu (kısa kod; pencere tanımadığı kodu göstermez) */
  return <FirmaAyarlari v={{ ...v, depolama: { ...v.depolama, proje: o.kiraci.vt ? "kendi" : "ortak" } }} yedekSonuc={typeof yedek === "string" ? yedek : null} />;
}
