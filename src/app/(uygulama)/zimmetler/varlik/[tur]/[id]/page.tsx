/* VARLIK SAYFASI (maket zimmetler.html #/v/<id>): başlık + durum · Teslim et · kalibrasyon şeridi · yüzler (kimde, hareket, fotoğraf) · teslim
   geçmişi. Adres /zimmetler/varlik/c/<id> (ölçüm cihazı) ya da /d/<id> (diğer). Görmeyen ("kendi" düzeyinde başkasının zimmeti): bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yuz, Yuzler } from "../../../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../../../components/hata/Hata";
import { Bolum, Kirinti, NesneBasi, SeritKap } from "../../../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../../../components/serit/Serit";
import { TusBaglanti } from "../../../../../../components/tus/Tus";
import { modulBul } from "../../../../../../modules/moduller";
import { bugunTr } from "../../../../../../modules/olcum-cihazlari/server/cihazlar";
import { varlikKarti, zimmetDegistirir, zimmetListeleri } from "../../../../../../modules/zimmetler/server/zimmet";
import { DurumRozeti, kalGecti, kimdeAd, TUR_AD, TUR_IKON } from "../../../../../../modules/zimmetler/ui/ortak";
import { TeslimGecmisi, TeslimTusu } from "../../../../../../modules/zimmetler/ui/VarlikParcalari";
import { modulOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

const MODUL = modulBul("zimmetler")!;
export const metadata: Metadata = { title: "Varlık" };

export default async function Sayfa({ params }: { params: Promise<{ tur: string; id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { tur, id } = await params;
  const yaz = zimmetDegistirir(o);
  const [v, l] = await oturumIslemi(o, async (db) => [await varlikKarti(db, o, `${tur}:${id}`), yaz ? await zimmetListeleri(db, o) : null] as const);
  if (!v) notFound();
  const bugun = bugunTr();
  const fotoSayisi = v.hareketler.reduce((n, h) => n + h.fotolar.length, 0);
  return (
    <>
      <Kirinti ogeler={[["Zimmetler", "/zimmetler"], [v.kod]]} />
      <NesneBasi baslik={`${v.kod} · ${v.ad}`} rozet={<DurumRozeti v={v} bugun={bugun} />} altIkon={TUR_IKON[v.tur]} alt={TUR_AD[v.tur]}
        tuslar={<>
          {v.tur === "c" && <TusBaglanti href={`/olcum-cihazlari/${v.id}`} ikon="gauge">Cihaz ve kalibrasyon</TusBaglanti>}
          {yaz && v.kimde.tip !== "lab" && l && <TeslimTusu varlik={v.anahtar} varliklar={l.varliklar} kisiler={l.kisiler} bugun={bugun} />}
        </>} />
      {kalGecti(v, bugun) && v.kimde.tip === "kisi" &&
        <SeritKap><Serit tur="hata" ikon="circle-x">Kalibrasyonu geçmiş cihaz {v.kimde.ad} zimmetinde: raporları onaya gönderilemez. Depoya alın ya da kalibrasyona gönderin.</Serit></SeritKap>}
      <Yuzler>
        <Yuz ikon={v.kimde.tip === "depo" ? "warehouse" : v.kimde.tip === "lab" ? "flask-conical" : "user"} ad="Kimde" sayi={kimdeAd(v.kimde)}
          href={v.kimde.tip === "kisi" ? `/personel/${v.kimde.id}` : undefined} not={v.son ? `son hareket ${v.son.zaman.slice(0, 10).split("-").reverse().join(".")}` : "hareket yok"} />
        <Yuz ikon="arrow-right-left" ad="Hareket" sayi={v.hareketler.length} />
        <Yuz ikon="camera" ad="Fotoğraf" sayi={fotoSayisi} />
      </Yuzler>
      <Bolum id="b-gecmis" baslik="Teslim geçmişi" sayac={<><b>{v.hareketler.length}</b> hareket</>}>
        <TeslimGecmisi hareketler={v.hareketler} ad={v.kod} />
      </Bolum>
    </>
  );
}
