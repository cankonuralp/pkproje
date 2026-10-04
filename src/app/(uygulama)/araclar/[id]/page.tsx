/* ARAÇ SAYFASI (maket araclar.html #/a/<id>): başlık (plaka · tür, durum) + işlemler · belge şeritleri · yüzler (kimde, kilometre, belgeler) ·
   araç bilgileri · haftalık kilometre (giriş + geçmiş) · teslim tutanakları. Sürücü yalnız kendi zimmetindeki aracı görür; başkasınınki: bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Bolum, Kirinti, NesneBasi, SeritKap } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { TusBaglanti } from "../../../../components/tus/Tus";
import { modulBul } from "../../../../modules/moduller";
import { kmYaz, yakitAd } from "../../../../modules/araclar/sema";
import { aracDegistirir, aracKarti, aracListesi } from "../../../../modules/araclar/server/araclar";
import { KmFormu, KmGecmisi, TutanakTablosu } from "../../../../modules/araclar/ui/AracListesi";
import { AracTuslari } from "../../../../modules/araclar/ui/KartParcalari";
import { AracDurumu, kimdeAd, KmRozeti, tarihYaz } from "../../../../modules/araclar/ui/ortak";
import stil from "../../../../modules/araclar/ui/araclar.module.css";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("araclar")!;
export const metadata: Metadata = { title: "Araç" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const [v, l] = await oturumIslemi(o, async (db) => [await aracKarti(db, o, id), await aracListesi(db, o)] as const);
  if (!v || !l) notFound();
  const yaz = aracDegistirir(o);
  const sonTeslim = v.tutanaklar[0]?.zaman;
  const bakimYakin = v.km != null && v.bakimKm != null && v.km >= v.bakimKm - 1000;
  return (
    <>
      <Kirinti ogeler={[[l.kendi ? "Aracım" : "Araçlar", "/araclar"], [v.plaka]]} />
      <NesneBasi baslik={`${v.plaka} · ${v.tur}`} rozet={<AracDurumu v={v} />} altIkon="car" alt={`${v.marka} ${v.model} · ${v.yil} · ${yakitAd(v.yakit)}`}
        tuslar={<>
          {!l.kendi && <TusBaglanti href={`/zimmetler/varlik/a/${v.id}`} ikon="package">Zimmet kaydı</TusBaglanti>}
          {(yaz || v.benim) && <AracTuslari arac={v} yaz={yaz} araclar={l.araclar} kisiler={l.kisiler}
            deger={{ id: v.id, surum: v.surum, plaka: v.plaka, tur: v.tur, marka: v.marka, model: v.model, yil: v.yil, yakit: v.yakit, bakimKm: v.bakimKm, muayene: v.muayene, sigorta: v.sigorta, kasko: v.kasko }} />}
        </>} />
      {v.belgeler.some((b) => b.durum === "gecti" || b.durum === "yakin") && <SeritKap>{v.belgeler.filter((b) => b.durum === "gecti" || b.durum === "yakin").map((b) =>
        b.durum === "gecti"
          ? <Serit key={b.ad} tur="hata" ikon="circle-x">{b.ad} süresi geçti ({tarihYaz(b.tarih)}); araç bu hâliyle trafiğe çıkmamalı.</Serit>
          : <Serit key={b.ad} tur="uyari" ikon="triangle-alert">{b.ad} bitiyor ({tarihYaz(b.tarih)}).</Serit>)}</SeritKap>}
      <Yuzler>
        <Yuz ikon={v.kimde.tip === "depo" ? "warehouse" : "user"} ad="Kimde" sayi={kimdeAd(v.kimde)} not={sonTeslim ? `teslim ${tarihYaz(sonTeslim)}` : "hareket yok"} />
        <Yuz ikon="gauge" ad="Kilometre" sayi={v.km != null ? kmYaz(v.km) : "—"} uyari={bakimYakin}
          not={v.bakimKm != null ? `bakım ${kmYaz(v.bakimKm)} km${bakimYakin ? " · yaklaştı" : ""}` : undefined} />
        {v.belgeler.map((b) => <Yuz key={b.ad} ikon="calendar" ad={b.ad} sayi={tarihYaz(b.tarih)} uyari={b.durum === "gecti" || b.durum === "yakin"}
          not={b.durum === "gecti" ? "geçti" : b.durum === "yakin" ? "yaklaşıyor" : undefined} />)}
      </Yuzler>
      <Bolum id="b-arac-bilgi" baslik="Araç bilgileri">
        <BilgiListesi>
          <Bilgi etiket="Plaka">{v.plaka}</Bilgi>
          <Bilgi etiket="Araç türü">{v.tur}</Bilgi>
          <Bilgi etiket="Marka">{v.marka}</Bilgi>
          <Bilgi etiket="Model">{v.model}</Bilgi>
          <Bilgi etiket="Model yılı">{v.yil}</Bilgi>
          <Bilgi etiket="Yakıt">{yakitAd(v.yakit)}</Bilgi>
          {v.ilkKm != null && <Bilgi etiket="Kayıttaki kilometre">{kmYaz(v.ilkKm)} km</Bilgi>}
        </BilgiListesi>
      </Bolum>
      <Bolum id="b-arac-km" baslik="Haftalık kilometre" sayac={<KmRozeti d={v.kmDurum} />}>
        {v.kimde.tip === "kisi" && (yaz || v.benim) && <KmFormu arac={v} buHafta={v.buHafta?.km ?? null} oncekiKm={v.oncekiKm} />}
        <KmGecmisi satirlar={v.kmGecmisi} />
      </Bolum>
      <Bolum id="b-arac-tutanak" baslik="Teslim tutanakları" sayac={<><b>{v.tutanaklar.length}</b> tutanak</>}>
        {v.tutanaklar.length ? <TutanakTablosu tutanaklar={v.tutanaklar} aracli={false} /> : <p className={stil.bosSatir}>Bu aracın tutanağı yok; depoda.</p>}
      </Bolum>
    </>
  );
}
