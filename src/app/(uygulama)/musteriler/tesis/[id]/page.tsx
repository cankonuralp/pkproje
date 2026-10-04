/* TESİS SAYFASI (maket musteriler.html #/t/<id>): başlıkta müşteri, altında tesis (L7) · pasif / eksik bilgi şeridi · tesis bilgileri. Ekipmanlar,
   İSG-KATİP ID'leri ve planlar kendi kalemlerinde. Görmeyen / başka firmanın kaydı: bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi } from "../../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { AltSatir, Bolum, DegerYok, Kirinti, Kod, NesneBasi, SeritKap } from "../../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../../components/serit/Serit";
import { modulBul } from "../../../../../modules/moduller";
import { eksikTesis } from "../../../../../modules/musteriler/sema";
import { musteriDegistirir, tesisKarti } from "../../../../../modules/musteriler/server/musteriler";
import { TesisTuslari } from "../../../../../modules/musteriler/ui/KartTuslari";
import { PasifRozeti, tarihYaz } from "../../../../../modules/musteriler/ui/ortak";
import stil from "../../../../../modules/musteriler/ui/musteriler.module.css";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("musteriler")!;
export const metadata: Metadata = { title: "Tesis" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const t = await oturumIslemi(o, (db) => tesisKarti(db, o, id));
  if (!t) notFound();
  const e = eksikTesis(t);
  return (
    <>
      <Kirinti ogeler={[["Müşteriler", "/musteriler"], [t.musteri.kisa, `/musteriler/${t.musteri.id}`], [t.ad]]} />
      <NesneBasi baslik={t.musteri.unvan} rozet={t.pasif ? <PasifRozeti /> : undefined} altIkon="map-pin" alt={<>Tesis: <b>{t.ad}</b></>}
        tuslar={musteriDegistirir(o) && <TesisTuslari tesis={{ id: t.id, surum: t.surum, ad: t.ad, adres: t.adres, il: t.il, ilce: t.ilce, sgk: t.sgk }}
          musteriId={t.musteri.id} unvan={t.musteri.unvan} ad={`${t.musteri.kisa} / ${t.ad}`} pasif={!!t.pasif} />} />
      {t.pasif && <SeritKap><Serit tur="bilgi" ikon="ban"><b>Pasif</b> · {tarihYaz(t.pasif)} · Tesis listelerden kalktı; raporları ve arşivi duruyor.{t.musteri.pasif ? " Müşteri pasif; önce müşteri yeniden etkinleştirilir." : " “Yeniden etkinleştir” ile geri gelir."}</Serit></SeritKap>}
      {e.length > 0 && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Eksik bilgi: {e.join(" · ")}. Kayıt engellenmez; raporun işyeri bölümünde gerekir, rapor imzalanırken yeniden hatırlatılır.</Serit></SeritKap>}
      <Bolum id="b-tbilgi" baslik="Tesis bilgileri">
        <BilgiListesi>
          <Bilgi etiket="İşyeri ünvanı" genis>{t.musteri.unvan}</Bilgi>
          <Bilgi etiket="Adres" genis>{t.adres ?? <AltSatir uyari>Boş</AltSatir>}</Bilgi>
          <Bilgi etiket="SGK DETSİS NO" genis="cift">{t.sgk ? <span className={stil.kodUzun}><Kod>{t.sgk}</Kod></span> : <AltSatir uyari>Boş</AltSatir>}</Bilgi>
          <Bilgi etiket="İl">{t.il ?? <DegerYok />}</Bilgi>
          <Bilgi etiket="İlçe">{t.ilce ?? <DegerYok />}</Bilgi>
        </BilgiListesi>
      </Bolum>
    </>
  );
}
