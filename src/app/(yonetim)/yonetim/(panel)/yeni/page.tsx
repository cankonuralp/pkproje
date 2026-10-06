/* YÖNETİM › FİRMA AÇ (348; maket yonetim.html #/yeni) — form ve sonuç (geçici parola yalnız bir kez) istemci bileşeninde; karar sunucuda. */
import type { Metadata } from "next";
import { FirmaAcFormu } from "../../../../../modules/yonetim/ui/FirmaAcFormu";
import { anaAlan } from "../../../../../server/kiraci/istek";
import { yonetimOturumGerekli } from "../../../../../server/yonetim/istek";

export const metadata: Metadata = { title: "Firma aç" };

export default async function FirmaAcSayfasi() {
  await yonetimOturumGerekli();
  return <FirmaAcFormu anaAlan={anaAlan()} depo={process.env.PROBATA_DEPO === "vt" ? "vt" : "klasor"} />;
}
