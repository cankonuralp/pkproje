/* DÖKÜMANLAR › Muayene kriterleri (maket standartlar.html #/kriterler) — Bakanlığın kontrol kriterleri belgeleri (kodda; düzenlenmez). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { KriterListesi } from "../../../../modules/dokumanlar/ui/Listeler";
import { modulOturumu } from "../../../../server/kimlik/istek";
import { KRITER_BELGELERI } from "../../../../tanim/kriterler";

const MODUL = modulBul("dokumanlar")!;
export const metadata: Metadata = { title: "Muayene kriterleri" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  return <KriterListesi belgeler={KRITER_BELGELERI} />;
}
