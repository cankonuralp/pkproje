/* YÖNETİM › FİRMA (348; maket yonetim.html #/f/<id>) — bilgiler, dondur / etkinleştir, ilk firma yöneticisine yeni geçici parola; FV9: yapay zekâ
   anahtarı (K4) ve firma özeti — kendi projeli firmada firmanın veritabanından. */
import type { Metadata } from "next";
import { depoTuru } from "../../../../../../modules/yonetim/ui/ortak";
import { epostaAcik, yonetimCalistirici } from "../../../../../../modules/yonetim/server/calistirici";
import { gonderimGorunumu } from "../../../../../../modules/yonetim/server/eposta";
import { firmaOzetiYonet } from "../../../../../../modules/yonetim/server/firma-tarafi";
import { kurulumGorunumu } from "../../../../../../modules/yonetim/server/kurulum";
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
  const c = yonetimCalistirici(o);
  /* FV10: kurulum sürüyorsa kurulumun görünümü (özet yok — firmanın veritabanı henüz hazır değil) */
  const kurulum = f?.durum === "kurulum" ? await kurulumGorunumu(c, f.id) : null;
  const ozet = f && f.durum !== "kurulum" ? await firmaOzetiYonet(c, f.id) : null;
  /* FV11: e-posta gönderimi (merkezdeki kayıt) */
  const gonderim = f && f.durum !== "kurulum" ? await gonderimGorunumu(c, f.id) : null;
  return <FirmaSayfasi firma={f} ozet={ozet} kurulum={kurulum} gonderim={gonderim} epostaAcik={epostaAcik()} anaAlan={anaAlan()} depo={depoTuru(process.env.PROBATA_DEPO)} />;
}
