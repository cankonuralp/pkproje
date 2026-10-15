/* YÖNETİM › FİRMA (348; maket yonetim.html #/f/<id>) — bilgiler, dondur / etkinleştir, ilk firma yöneticisine yeni geçici parola. */
import type { Metadata } from "next";
import { depoTuru } from "../../../../../../modules/yonetim/ui/ortak";
import { firma } from "../../../../../../modules/yonetim/server/yonetim";
import { FirmaSayfasi } from "../../../../../../modules/yonetim/ui/FirmaSayfasi";
import { anaAlan } from "../../../../../../server/kiraci/istek";
import { yonetimIslemi, yonetimOturumGerekli } from "../../../../../../server/yonetim/istek";

export const metadata: Metadata = { title: "Firma" };

export default async function YonetimFirmaSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const o = await yonetimOturumGerekli();
  const { id } = await params;
  const f = await yonetimIslemi(o, (db) => firma(db, id));
  return <FirmaSayfasi firma={f} anaAlan={anaAlan()} depo={depoTuru(process.env.PROBATA_DEPO)} />;
}
