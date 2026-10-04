/* KONTROL KRİTERLERİ BELGESİ (maket standartlar.html #/k/<kod>): belge bilgileri · maddeler (no, başlık, içerik, standart / yönetmelik) · notlar. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi } from "../../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { Bolum, Kirinti, Kod, NesneBasi, Rozet } from "../../../../../components/sayfa/Sayfa";
import { modulBul } from "../../../../../modules/moduller";
import { tarihYaz } from "../../../../../modules/dokumanlar/ui/ortak";
import stil from "../../../../../modules/dokumanlar/ui/dokumanlar.module.css";
import { modulOturumu } from "../../../../../server/kimlik/istek";
import { kriterBelgesi } from "../../../../../tanim/kriterler";

const MODUL = modulBul("dokumanlar")!;
export const metadata: Metadata = { title: "Muayene kriterleri" };

export default async function Sayfa({ params }: { params: Promise<{ kod: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const x = kriterBelgesi((await params).kod);
  if (!x) notFound();
  return (
    <>
      <Kirinti ogeler={[["Muayene kriterleri", "/dokumanlar/kriterler"], [x.kod]]} />
      <NesneBasi baslik={x.kod} rozet={<Rozet tur="tamam">Yürürlükte</Rozet>} altIkon="list-checks" alt={x.ad} />
      <Bolum id="b-krt-belge" baslik="Belge">
        <BilgiListesi>
          <Bilgi etiket="Doküman kodu"><Kod>{x.kod}</Kod></Bilgi>
          <Bilgi etiket="Yayım tarihi">{tarihYaz(x.yayim)}</Bilgi>
          <Bilgi etiket="Yürürlük tarihi">{tarihYaz(x.yururluk)}</Bilgi>
          <Bilgi etiket="Rapor formatı"><Kod>{x.rapor}</Kod></Bilgi>
          <Bilgi etiket="Kapsam" genis="tam">{x.kapsam}</Bilgi>
        </BilgiListesi>
      </Bolum>
      <Bolum id="b-krt-madde" baslik="Kontrol kriterleri" sayac={<><b>{x.maddeler.length}</b> madde</>}>
        <BilgiListesi>{x.maddeler.map((m) => (
          <Bilgi key={m.no} etiket={`${m.no} · ${m.baslik}`} genis="tam"><span className={stil.madde}><span>{m.icerik}</span><span className={stil.kaynak}>{m.kaynak}</span></span></Bilgi>
        ))}</BilgiListesi>
      </Bolum>
      <Bolum id="b-krt-not" baslik="Notlar">
        <ol className={stil.notlar}>{x.notlar.map((n, i) => <li key={i}>{n}</li>)}</ol>
      </Bolum>
    </>
  );
}
