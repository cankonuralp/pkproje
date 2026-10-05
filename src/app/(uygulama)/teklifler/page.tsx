/* TEKLİFLER (maket teklifler.html #/) — teklif listesi. Kapı sunucuda (modül 11): "gör" düzeyi görür, "yaz" düzeyi hazırlar. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { teklifDegistirir, teklifListesi } from "../../../modules/teklifler/server/teklifler";
import { TeklifListesi } from "../../../modules/teklifler/ui/TeklifListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("teklifler")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => teklifListesi(db, o));
  if (!l) return <Yetkisiz />;
  return <TeklifListesi teklifler={l} yaz={teklifDegistirir(o)} />;
}
