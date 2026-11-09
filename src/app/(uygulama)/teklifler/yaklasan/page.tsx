/* YAKLAŞAN MUAYENELER (2026-11-09; reisim: "senesi yaklaşan aranması gereken müşteriler için teklifler de teklif hazırla tuşunun yanına yaklaşan muayeneler
   tuşu olsun") — muayenesine son 2 ay kalan müşteriler / tesisler. Kapı sunucuda (modül 11): "gör" düzeyi görür, "yaz" düzeyi teklif hazırlar. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { teklifDegistirir } from "../../../../modules/teklifler/server/teklifler";
import { yaklasanSayfasi } from "../../../../modules/teklifler/server/yaklasan";
import { YaklasanListesi } from "../../../../modules/teklifler/ui/YaklasanListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("teklifler")!;
export const metadata: Metadata = { title: "Yaklaşan muayeneler" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const ilk = await oturumIslemi(o, (db) => yaklasanSayfasi(db, o, {}));
  if (!ilk) return <Yetkisiz />;
  return <YaklasanListesi ilk={ilk} yaz={teklifDegistirir(o)} />;
}
