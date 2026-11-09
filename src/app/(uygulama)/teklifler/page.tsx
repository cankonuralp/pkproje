/* TEKLİFLER (maket teklifler.html #/) — teklif listesi. Kapı sunucuda (modül 11): "gör" düzeyi görür, "yaz" düzeyi hazırlar. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { teklifDegistirir, teklifSayfasi } from "../../../modules/teklifler/server/teklifler";
import { yaklasanSayisi } from "../../../modules/teklifler/server/yaklasan";
import { TeklifListesi } from "../../../modules/teklifler/ui/TeklifListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("teklifler")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  /* 570: liste SUNUCUDA sayfalı (teklifSayfasi — ilk sayfa burada, sonrakiler eylemle) */
  const v = await oturumIslemi(o, async (db) => ({ ilk: await teklifSayfasi(db, o, {}), yaklasan: await yaklasanSayisi(db, o) }));
  if (!v.ilk) return <Yetkisiz />;
  return <TeklifListesi ilk={v.ilk} yaz={teklifDegistirir(o)} yaklasan={v.yaklasan} />;
}
