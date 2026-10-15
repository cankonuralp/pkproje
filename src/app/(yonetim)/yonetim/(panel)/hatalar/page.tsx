/* YÖNETİM › HATA KAYDI (567; 06-HATA-TAKIBI) — tarayıcı ve sunucu hataları, en son görülen üstte; yalnız probata ekibine (yönetim oturumu + yönetim
   rolü). Kişi adı yok (oturumlu mu), sayfa yalnız yol, mesaj maskeli. */
import type { Metadata } from "next";
import { hatalar } from "../../../../../modules/yonetim/server/hatalar";
import { HataListesi } from "../../../../../modules/yonetim/ui/HataListesi";
import { yonetimIslemi, yonetimOturumGerekli } from "../../../../../server/yonetim/istek";

export const metadata: Metadata = { title: "Hata kaydı" };

export default async function HatalarSayfasi() {
  const o = await yonetimOturumGerekli();
  const kayitlar = await yonetimIslemi(o, (db) => hatalar(db));
  return <HataListesi kayitlar={kayitlar} />;
}
