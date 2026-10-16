/* YÖNETİM › FİRMA (348; maket yonetim.html #/f/<id>) — bilgiler, dondur / etkinleştir, ilk firma yöneticisine yeni geçici parola; FV9: yapay zekâ
   anahtarı (K4) ve firma özeti — kendi projeli firmada firmanın veritabanından. */
import type { Metadata } from "next";
import { depoTuru } from "../../../../../../modules/yonetim/ui/ortak";
import { yonetimCalistirici } from "../../../../../../modules/yonetim/server/calistirici";
import { firmaOzetiYonet } from "../../../../../../modules/yonetim/server/firma-tarafi";
import { firma } from "../../../../../../modules/yonetim/server/yonetim";
import { FirmaSayfasi } from "../../../../../../modules/yonetim/ui/FirmaSayfasi";
import { anaAlan } from "../../../../../../server/kiraci/istek";
import { yonetimIslemi, yonetimOturumGerekli } from "../../../../../../server/yonetim/istek";

export const metadata: Metadata = { title: "Firma" };

export default async function YonetimFirmaSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const o = await yonetimOturumGerekli();
  const { id } = await params;
  const f = await yonetimIslemi(o, (db) => firma(db, id));
  /* FV9: özet (kullanıcı, yönetici, yapay zekâ anahtarı + bu ay) — kendi projeli firmada firmanın veritabanından; ulaşılamazsa null */
  const ozet = f ? await firmaOzetiYonet(yonetimCalistirici(o), f.id) : null;
  return <FirmaSayfasi firma={f} ozet={ozet} anaAlan={anaAlan()} depo={depoTuru(process.env.PROBATA_DEPO)} />;
}
