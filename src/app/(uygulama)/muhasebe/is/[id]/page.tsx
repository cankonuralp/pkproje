/* MUHASEBE › İŞ SAYFASI (maket muhasebe.html #/is/<proje no> — isCiz; 327): başlık (proje no, durum; Plan · Tahsilat ekle · Toplu fatura · Fatura
   kaydet), şeritler (vadesi geçti, faturaya hazır, imza süreci, kapandı), yüzler (raporlanan, faturalanan, tahsil edilen, açık alacak), iş
   (denetim, birim fiyatın dayanağı, iş sözleşmesi, ödeme vadesi), raporlar (birim fiyat ve kaynağı, fatura, durum), faturalar, giderler ve
   kârlılık (328: gelir − işe bağlı masraf − denetçi maliyeti − genel gider payı), geçmiş. Görmeyen ya da raporu olmayan plan: bulunamadı. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { AltSatir, Bolum, DegerYok, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../../../components/secim/tarih";
import { Serit } from "../../../../../components/serit/Serit";
import { TusBaglanti } from "../../../../../components/tus/Tus";
import { modulBul } from "../../../../../modules/moduller";
import { IS_DURUM, para } from "../../../../../modules/muhasebe/sema";
import { giderSecenekleri, isGiderleri } from "../../../../../modules/muhasebe/server/giderler";
import { bugunTr, isKarti } from "../../../../../modules/muhasebe/server/muhasebe";
import { IsGiderleri } from "../../../../../modules/muhasebe/ui/Giderler";
import { FaturaKaydet, IsFaturalari, IsRaporlari, TahsilatEkle } from "../../../../../modules/muhasebe/ui/IsParcalari";
import { IsKarliligi } from "../../../../../modules/muhasebe/ui/Karlilik";
import { yuzde } from "../../../../../modules/muhasebe/ui/ortak";
import { modulGorur, modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: "İş" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const v = await oturumIslemi(o, async (db) => {
    const x = await isKarti(db, o, id);
    return x && { x, giderler: (await isGiderleri(db, o, id)) ?? [], secenekler: x.izin.gider ? await giderSecenekleri(db, o) : null };
  });
  if (!v) notFound();
  const { x } = v;
  const acik = x.faturalar.find((f) => f.id === x.acikFatura);
  /* 324–327 incelemesi: hedef modülü göremeyene bağlantı çizilmez (önerilen düzende muhasebe Planlar'ı ve Raporlar'ı görmez) */
  const gor = { plan: modulGorur(o, 13), rapor: modulGorur(o, 14), musteri: modulGorur(o, 3) };
  const gec = x.faturalar.filter((f) => f.durum === "gecikti");
  return (
    <>
      <Kirinti ogeler={[["Muhasebe", "/muhasebe"], [x.no]]} />
      <NesneBasi baslik={x.no} rozet={<Rozet tur={IS_DURUM[x.durum][1]}>{IS_DURUM[x.durum][0]}</Rozet>} altIkon="building-2"
        alt={<>{gor.musteri && x.musteriId ? <Link href={`/musteriler/${x.musteriId}`}>{x.musteri}</Link> : x.musteri} · {x.tesis}</>}
        tuslar={<>
          {gor.plan && <TusBaglanti ikon="calendar-check" href={`/planlar/${x.id}`}>Plan</TusBaglanti>}
          {x.izin.tahsilat && acik && <TahsilatEkle fatura={{ id: acik.id, no: acik.no, musteri: x.musteri, toplam: acik.toplam, kalan: acik.kalan }} bugun={bugunTr()} birincil={false} />}
          {x.izin.fatura && <FaturaKaydet planId={x.id} isNo={x.no} musteri={x.musteri} tek={x.onizleme.tek} toplu={x.onizleme.toplu} bugun={bugunTr()} />}
        </>} />
      <SeritKap>
        {gec.length > 0 && <Serit tur="uyari" ikon="clock">{gec.map((f) => `${f.no} vadesi geçti; kalan ${para(f.kalan)}.`).join(" ")}</Serit>}
        {x.hazir > 0 && <Serit tur="bilgi" ikon="file-check">{x.hazir} rapor faturaya hazır{x.surec ? ` · ${x.surec} rapor imza sürecinde` : ""}</Serit>}
        {x.durum === "rapor" && !x.hazir && <Serit tur="bilgi" ikon="history">{x.surec ? `${x.surec} rapor imza sürecinde` : "Plan tamamlanmadı"}</Serit>}
        {x.fiyatsiz > 0 && <Serit tur="hata" ikon="circle-alert">{x.fiyatsiz} raporun birim fiyatı yok (teklifte ya da fiyat listesinde değil); fiyat listesine ekleyin.</Serit>}
        {x.durum === "kapandi" && x.kapandi && <Serit tur="onay" ikon="circle-check">İş kapandı {tarihNo(x.kapandi)}: bütün raporlar faturalandı ve tahsil edildi.</Serit>}
      </SeritKap>
      <Yuzler>
        <Yuz ikon="file-text" ad="Raporlanan" sayi={para(x.raporlanan)} not={`KDV hariç · ${x.toplam} rapor`} />
        <Yuz ikon="file-check" ad="Faturalanan" sayi={para(x.faturalanan)} not={`KDV dahil · ${x.faturalar.length} fatura`} />
        <Yuz ikon="wallet" ad="Tahsil edilen" sayi={para(x.tahsil)} />
        <Yuz ikon="clock" ad="Açık alacak" sayi={para(x.kalan)} uyari={x.durum === "gecikti"} not={x.durum === "gecikti" ? "vadesi geçti" : undefined} />
        <Yuz ikon="chart-column" ad="Kâr" sayi={yuzde(x.karlilik.oran)} not={`${para(x.karlilik.kar)} · KDV hariç`} uyari={x.karlilik.kar < 0} />
      </Yuzler>
      <Bolum id="b-is" baslik="İş">
        <BilgiListesi>
          <Bilgi etiket="Denetim">{tarihNo(x.tarih)}<AltSatir>{x.ekip.join(", ") || "—"}</AltSatir></Bilgi>
          <Bilgi etiket="Birim fiyat">{x.teklif ? <><Link href={`/teklifler/${x.teklif.id}`}>{x.teklif.no}</Link><AltSatir>kabul edilen teklif</AltSatir></>
            : <>Fiyat listesi<AltSatir>teklif kaydı yok</AltSatir></>}</Bilgi>
          <Bilgi etiket="İş sözleşmesi">{x.sozlesme ? <Link href={`/sozlesmeler/${x.sozlesme.id}`}>{x.sozlesme.no}</Link> : <DegerYok>Kayıt yok</DegerYok>}</Bilgi>
          <Bilgi etiket="Ödeme vadesi">{x.sozlesme?.vade ?? 30} gün<AltSatir>{x.sozlesme ? "sözleşmeden" : "varsayılan"}</AltSatir></Bilgi>
        </BilgiListesi>
      </Bolum>
      <Bolum id="b-is-rapor" baslik="Raporlar">
        <IsRaporlari raporlar={x.raporlar} raporGor={gor.rapor} />
      </Bolum>
      <Bolum id="b-is-fatura" baslik="Faturalar" sayac={<><b>{x.faturalar.length}</b> fatura</>}>
        {x.faturalar.length ? <IsFaturalari faturalar={x.faturalar} /> : <p>Henüz fatura yok.</p>}
      </Bolum>
      <IsGiderleri giderler={v.giderler} secenekler={v.secenekler} isId={x.id} isNo={x.no} bugun={bugunTr()} />
      <IsKarliligi k={x.karlilik} />
      <Bolum id="b-is-gecmis" baslik="Geçmiş">
        <BilgiListesi>{x.gecmis.map((g, i) => <Bilgi key={i} etiket={tarihNo(g[0])} genis>{g[1]}{g[2] && <AltSatir>{g[2]}</AltSatir>}</Bilgi>)}</BilgiListesi>
      </Bolum>
    </>
  );
}
