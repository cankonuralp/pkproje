/* YÖNETİM › FİRMALAR (348; maket yonetim.html #/) — açılış tarihine göre en yeni üstte; adres, kısa kod, durum, depo, açılış, kullanıcı. */
import type { Metadata } from "next";
import { firmalar } from "../../../../modules/yonetim/server/yonetim";
import { FirmaListesi } from "../../../../modules/yonetim/ui/FirmaListesi";
import { anaAlan } from "../../../../server/kiraci/istek";
import { yonetimIslemi, yonetimOturumGerekli } from "../../../../server/yonetim/istek";

export const metadata: Metadata = { title: "Firmalar" };

export default async function FirmalarSayfasi() {
  const o = await yonetimOturumGerekli();
  const kayitlar = await yonetimIslemi(o, (db) => firmalar(db));
  return <FirmaListesi kayitlar={kayitlar} anaAlan={anaAlan()} depo={depoTuru()} />;
}

function depoTuru(): "vt" | "klasor" {
  return process.env.PROBATA_DEPO === "vt" ? "vt" : "klasor";
}
