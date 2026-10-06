/* MUHASEBE › FATURA SAYFASI (maket muhasebe.html #/f/<no> — faturaCiz; 327): başlık (fatura no, durum; Tahsilat ekle), şeritler (vadesi geçti,
   ödendi), fatura (alıcı, tarih, vade, iş(ler), kaydeden), kalemler (tür × adet × birim fiyat; teklif dışı işaretli), toplamlar, tahsilatlar.
   Fatura özeti (PDF) (340; fatura e-Fatura programında kesilir — bu belge özettir): oturumlu uç …/pdf, dosya iner.
   Görmeyen: bulunamadı. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi } from "../../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { Ikon } from "../../../../../components/ikon/Ikon";
import { tusSinifi } from "../../../../../components/tus/Tus";
import { AltSatir, Bolum, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../../../components/secim/tarih";
import { Serit } from "../../../../../components/serit/Serit";
import { modulBul } from "../../../../../modules/moduller";
import { FATURA_DURUM, para } from "../../../../../modules/muhasebe/sema";
import { bugunTr, faturaKarti } from "../../../../../modules/muhasebe/server/muhasebe";
import { KalemListesi, TahsilatEkle, TahsilatListesi, Toplamlar } from "../../../../../modules/muhasebe/ui/IsParcalari";
import { gunFarki } from "../../../../../modules/muhasebe/ui/ortak";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: "Fatura" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const f = await oturumIslemi(o, (db) => faturaKarti(db, o, id));
  if (!f) notFound();
  return (
    <>
      <Kirinti ogeler={[["Muhasebe", "/muhasebe"], ["Faturalar", "/muhasebe/faturalar"], [f.no]]} />
      <NesneBasi baslik={f.no} rozet={<Rozet tur={FATURA_DURUM[f.durum][1]}>{FATURA_DURUM[f.durum][0]}</Rozet>} altIkon="building-2"
        alt={<>{f.unvan} · {f.isler.map((x, i) => <span key={x.id}>{i > 0 && ", "}<Link href={`/muhasebe/is/${x.id}`}>{x.no}</Link></span>)}</>}
        tuslar={<>
          <a className={tusSinifi("ikincil")} href={`/muhasebe/f/${f.id}/pdf`} download><Ikon ad="file-text" kucuk />Fatura özeti (PDF)</a>
          {f.izin.tahsilat && <TahsilatEkle fatura={{ id: f.id, no: f.no, musteri: f.musteri, toplam: f.toplam, kalan: f.kalan }} bugun={bugunTr()} />}
        </>} />
      {(f.durum === "gecikti" || f.durum === "odendi") && (
        <SeritKap>
          {f.durum === "gecikti" && <Serit tur="uyari" ikon="clock">Vade {tarihNo(f.vade)} tarihinde geçti ({-gunFarki(f.vade)} gün); kalan {para(f.kalan)}.</Serit>}
          {f.durum === "odendi" && f.sonOdeme && <Serit tur="onay" ikon="circle-check">Ödendi {tarihNo(f.sonOdeme)}.</Serit>}
        </SeritKap>
      )}
      <Bolum id="b-f-bilgi" baslik="Fatura">
        <BilgiListesi>
          <Bilgi etiket="Alıcı" genis>{f.unvan}{(f.vd || f.vno) && <AltSatir>{[f.vd && `${f.vd} VD`, f.vno].filter(Boolean).join(" · ")}</AltSatir>}</Bilgi>
          <Bilgi etiket="Fatura tarihi">{tarihNo(f.tarih)}</Bilgi>
          <Bilgi etiket="Vade">{tarihNo(f.vade)}<AltSatir>{f.vadeGun} gün · {f.sozlesme ? `sözleşme ${f.sozlesme.no}` : "varsayılan"}</AltSatir></Bilgi>
          <Bilgi etiket={f.isler.length > 1 ? "İşler" : "İş"}>{f.isler.map((x, i) => <span key={x.id}>{i > 0 && ", "}<Link href={`/muhasebe/is/${x.id}`}>{x.no}</Link></span>)}
            <AltSatir>{f.isler.length === 1 ? `${f.isler[0].tesis} · ` : ""}{f.raporSayisi} rapor</AltSatir></Bilgi>
          <Bilgi etiket="Kaydeden">{f.kaydeden}</Bilgi>
        </BilgiListesi>
      </Bolum>
      <Bolum id="b-f-kalem" baslik="Kalemler" sayac={<><b>{f.kalemler.length}</b> kalem</>}>
        <KalemListesi kalemler={f.kalemler} />
        <Toplamlar ara={f.ara} kdv={f.kdv} kdvTutar={f.kdvTutar} toplam={f.toplam} />
      </Bolum>
      <Bolum id="b-f-tahsilat" baslik="Tahsilatlar" sayac={<><b>{f.tahsilatlar.length}</b> tahsilat</>}>
        {f.tahsilatlar.length ? <TahsilatListesi tahsilatlar={f.tahsilatlar} /> : <p>Henüz tahsilat yok.</p>}
        <BilgiListesi>
          <Bilgi etiket="Tahsil edilen">{para(f.tahsil)}</Bilgi>
          <Bilgi etiket="Kalan"><b>{para(f.kalan)}</b></Bilgi>
        </BilgiListesi>
      </Bolum>
    </>
  );
}
