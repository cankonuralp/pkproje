/* MÜŞTERİ SAYFASI (maket musteriler.html #/m/<id>; anayasa 2.7 nesne sayfası): başlık + işlemler · pasif / eksik bilgi şeridi · yüzler · müşteri
   bilgileri · tesisler · müşteri girişi (319, 0030: ana + ek girişler, geçici parola). Teklif / sözleşme / alacak yüzleri, bulut klasörü kendi
   kalemlerinde. Görmeyen / başka firmanın kaydı: bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { AltSatir, Bolum, DegerYok, Kirinti, Kod, NesneBasi, SeritKap } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { modulBul } from "../../../../modules/moduller";
import { eksikMusteri, eksikTesis } from "../../../../modules/musteriler/sema";
import { girisBilgisi } from "../../../../modules/musteriler/server/girisler";
import { kullanimMetni } from "../../../../components/sil/metin";
import { musteriDegistirir, musteriKarti, silmeDurumu } from "../../../../modules/musteriler/server/musteriler";
import { GirisBolumu } from "../../../../modules/musteriler/ui/GirisBolumu";
import { MusteriTuslari, TesisEkleTusu } from "../../../../modules/musteriler/ui/KartTuslari";
import { PasifRozeti, tarihYaz } from "../../../../modules/musteriler/ui/ortak";
import { TesisTablosu } from "../../../../modules/musteriler/ui/TesisTablosu";
import stil from "../../../../modules/musteriler/ui/musteriler.module.css";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("musteriler")!;
export const metadata: Metadata = { title: "Müşteri" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const v = await oturumIslemi(o, async (db) => {
    const k = await musteriKarti(db, o, id);
    return k ? { m: k, giris: await girisBilgisi(db, o, id), silme: await silmeDurumu(db, o, "musteri", id) } : null;
  });
  if (!v) notFound();
  const { m, giris, silme } = v;
  const yaz = musteriDegistirir(o);
  const et = m.tesisler.filter((t) => !t.pasif), e = eksikMusteri(m);
  const iller = [...new Set(et.map((t) => t.il).filter(Boolean))].join(" · ");
  const eksikTesisSayisi = et.filter((t) => eksikTesis(t).length).length;
  return (
    <>
      <Kirinti ogeler={[["Müşteriler", "/musteriler"], [m.kisa]]} />
      <NesneBasi baslik={m.unvan} rozet={m.pasif ? <PasifRozeti /> : undefined} altIkon="building-2"
        /* 482: eksik vergi no şeritte ve Müşteri bilgileri'nde söylenir — başlığın altında üçüncü kez yazılmaz (kalıp 10: tekrar göz karmaşası) */
        alt={[m.vd && `${m.vd} VD`, m.vno && `VKN ${m.vno}`].filter(Boolean).join(" · ") || undefined}
        tuslar={yaz && <MusteriTuslari pasif={!!m.pasif} sil={silme.sil} kullanim={silme.kullanim ? kullanimMetni(silme.kullanim) : null} musteri={{ id: m.id, surum: m.surum, unvan: m.unvan, kisa: m.kisa, vd: m.vd, vno: m.vno, eposta: m.eposta, tel: m.tel, ilgili: m.ilgili }} />} />
      {m.pasif && <SeritKap><Serit tur="bilgi" ikon="ban"><b>Pasif</b> · {tarihYaz(m.pasif)} · Müşteri listelerden kalktı; raporları ve arşivi duruyor. “Etkinleştir” ile geri gelir.</Serit></SeritKap>}
      {e.length > 0 && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Eksik bilgi: {e.join(" · ")}.</Serit></SeritKap>}
      <Yuzler>
        <Yuz ikon="map-pin" ad="Tesis" sayi={et.length} not={iller || "tesis yok"} />
        <Yuz ikon="triangle-alert" ad="Bilgisi eksik tesis" sayi={eksikTesisSayisi} uyari={eksikTesisSayisi > 0} not={eksikTesisSayisi ? "SGK no, adres, il / ilçe" : "yok"} />
        <Yuz ikon="calendar" ad="Müşteri olduğu tarih" sayi={tarihYaz(m.acilis)} />
      </Yuzler>
      <Bolum id="b-bilgi" baslik="Müşteri bilgileri">
        <BilgiListesi>
          <Bilgi etiket="Ünvan" genis>{m.unvan}</Bilgi>
          <Bilgi etiket="Kısa ad">{m.kisa}</Bilgi>
          <Bilgi etiket="Vergi dairesi">{m.vd ?? <DegerYok />}</Bilgi>
          <Bilgi etiket="Vergi no">{m.vno ? <Kod>{m.vno}</Kod> : <AltSatir uyari>Boş</AltSatir>}</Bilgi>
          <Bilgi etiket="E-posta" genis>{m.eposta ?? <AltSatir uyari>Boş</AltSatir>}</Bilgi>
          <Bilgi etiket="Telefon">{m.tel ?? <DegerYok />}</Bilgi>
          <Bilgi etiket="İlgili kişi" genis>{m.ilgili ?? <DegerYok />}</Bilgi>
        </BilgiListesi>
      </Bolum>
      <Bolum id="b-tesis" baslik="Tesisler" sayac={<><b>{et.length}</b> tesis{m.tesisler.length > et.length ? ` · ${m.tesisler.length - et.length} pasif` : ""}</>}
        tuslar={yaz && !m.pasif && <TesisEkleTusu musteriId={m.id} unvan={m.unvan} />}>
        {m.tesisler.length
          ? <TesisTablosu tesisler={m.tesisler} />
          : <p className={stil.bosSatir}>Bu müşterinin tesisi yok.</p>}
      </Bolum>
      {giris && <GirisBolumu musteriId={m.id} kisa={m.kisa} b={giris} />}
    </>
  );
}
