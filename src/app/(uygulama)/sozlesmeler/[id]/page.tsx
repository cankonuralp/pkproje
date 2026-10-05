/* SÖZLEŞME SAYFASI (maket sozlesmeler.html #/s/<no>): başlık (no, durum) + imzalı sözleşme tuşları · taraflar ve koşullar · kapsam · İSG-KATİP
   (tesis başına denetçi → ID) · geçmiş. Dayanak teklif (326: teklif sayfasına bağlantı; yoksa "Sistem öncesi"). Hizmet sözleşmesi için uyarı yok; yalnız "Müşteri imzası bekleniyor" bilgisi. Görmeyen: bulunamadı. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { AltSatir, Bolum, DegerYok, Kirinti, NesneBasi, SeritKap } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { modulBul } from "../../../../modules/moduller";
import { sozlesmeDegistirir, sozlesmeKarti, sozlesmeSecenekleri } from "../../../../modules/sozlesmeler/server/sozlesmeler";
import { ImzaliTuslari, IsgBolumu } from "../../../../modules/sozlesmeler/ui/KartParcalari";
import { DurumRozeti, tarihYaz } from "../../../../modules/sozlesmeler/ui/ortak";
import { modulGorur, modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("sozlesmeler")!;
export const metadata: Metadata = { title: "Sözleşme" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const [x, sec] = await oturumIslemi(o, async (db) => [await sozlesmeKarti(db, o, id), await sozlesmeSecenekleri(db, o)] as const);
  if (!x) notFound();
  const yaz = sozlesmeDegistirir(o);
  const gecmis: [string, string, string][] = [[x.firmaImza, "Firma imzaladı", x.firma]];
  if (x.musteriImza) gecmis.push([x.musteriImza, "Müşteri imzaladı · imzalı sözleşme yüklendi", x.unvan]);
  if (x.durum === "suresi") gecmis.push([x.bitis, "Süresi doldu", ""]);
  gecmis.sort((a, b) => (a[0] < b[0] ? 1 : -1));
  return (
    <>
      <Kirinti ogeler={[["Sözleşmeler", "/sozlesmeler"], [x.no]]} />
      <NesneBasi baslik={x.no} rozet={<DurumRozeti d={x.durum} />} altIkon="building-2" alt={x.unvan}
        tuslar={<ImzaliTuslari id={x.id} surum={x.surum} no={x.no} dosya={x.imzaliDosya} yaz={yaz} />} />
      {x.durum === "imza" && <SeritKap><Serit tur="bilgi" ikon="file-signature">Müşteri imzası bekleniyor.</Serit></SeritKap>}
      <Bolum id="b-soz-taraf" baslik="Taraflar ve koşullar">
        <BilgiListesi>
          <Bilgi etiket="Hizmet veren" genis>{x.firma}</Bilgi>
          <Bilgi etiket="Hizmet alan" genis>{x.unvan}{(x.vd || x.vno) && <AltSatir>{[x.vd && `${x.vd} VD`, x.vno].filter(Boolean).join(" · ")}</AltSatir>}</Bilgi>
          <Bilgi etiket="Başlangıç">{tarihYaz(x.baslangic)}</Bilgi>
          <Bilgi etiket="Bitiş">{tarihYaz(x.bitis)}{x.durum === "yururlukte" && <AltSatir>{x.kalan} gün kaldı</AltSatir>}</Bilgi>
          <Bilgi etiket="Ödeme vadesi">{x.vade} gün</Bilgi>
          <Bilgi etiket="Yenileme">{x.yenileme === "otomatik" ? "Kendiliğinden (fesih yoksa)" : "Yok · yeni teklif"}</Bilgi>
          <Bilgi etiket="İmzalı belge">{x.imzaliDosya ? `${x.no}.pdf` : <DegerYok>Yüklenmedi</DegerYok>}</Bilgi>
          {/* 324–327 incelemesi: Teklifler'i göremeyene (ör. "kendi" düzeyindeki denetçi) numara düz metin */}
          <Bilgi etiket="Dayanak teklif">{x.teklif ? (modulGorur(o, 11) ? <Link href={`/teklifler/${x.teklif.id}`}>{x.teklif.no}</Link> : x.teklif.no)
            : <DegerYok>Sistem öncesi</DegerYok>}</Bilgi>
        </BilgiListesi>
      </Bolum>
      <Bolum id="b-soz-kapsam" baslik="Kapsam" sayac={<><b>{x.kapsam.length}</b> tesis</>}>
        <BilgiListesi>{x.kapsam.map((t) => <Bilgi key={t.id} etiket={t.ad} genis>{[t.ilce, t.il].filter(Boolean).join(" / ") || "—"}</Bilgi>)}</BilgiListesi>
      </Bolum>
      <Bolum id="b-soz-isg" baslik="İSG-KATİP" sayac={<><b>{x.isgSayisi}</b> ID</>}>
        <IsgBolumu sozlesme={x.id} sozNo={x.no} kapsam={x.kapsam} kisiler={sec?.kisiler ?? []} yaz={yaz} />
      </Bolum>
      <Bolum id="b-soz-gecmis" baslik="Geçmiş">
        <BilgiListesi>{gecmis.map((g, i) => <Bilgi key={i} etiket={tarihYaz(g[0])} genis>{g[1]}{g[2] && <AltSatir>{g[2]}</AltSatir>}</Bilgi>)}</BilgiListesi>
      </Bolum>
    </>
  );
}
