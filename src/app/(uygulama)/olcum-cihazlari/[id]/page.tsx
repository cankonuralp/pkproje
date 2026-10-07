/* CİHAZ SAYFASI (maket olcum-cihazlari.html #/c/<id>): başlık (kod · tür, kalibrasyon rozeti) + işlemler (357: Sil — yönetici, kullanılmamış cihaz) · kalibrasyon şeridi · yüzler (konum,
   kalibrasyon bitişi) · cihaz bilgileri · kalibrasyon kayıtları. Zimmet geçmişi ve ara kontrol kendi kalemlerinde. Görmeyen: bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Bolum, DegerYok, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../components/sayfa/Sayfa";
import { kullanimMetni } from "../../../../components/sil/metin";
import { Serit } from "../../../../components/serit/Serit";
import { modulBul } from "../../../../modules/moduller";
import { kalanGun } from "../../../../modules/olcum-cihazlari/sema";
import { bugunTr, cihazDegistirir, cihazKarti, cihazSilmeDurumu, cihazTurleri } from "../../../../modules/olcum-cihazlari/server/cihazlar";
import { CihazTuslari, KalibrasyonTablosu } from "../../../../modules/olcum-cihazlari/ui/KartParcalari";
import { KalRozeti, KONUM_AD, tarihYaz } from "../../../../modules/olcum-cihazlari/ui/ortak";
import stil from "../../../../modules/olcum-cihazlari/ui/cihazlar.module.css";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("olcum-cihazlari")!;
export const metadata: Metadata = { title: "Ölçüm cihazı" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const [c, turler, silme] = await oturumIslemi(o, async (db) => [await cihazKarti(db, o, id), await cihazTurleri(db, o), await cihazSilmeDurumu(db, o, id)] as const);
  if (!c) notFound();
  const yaz = cihazDegistirir(o), bugun = bugunTr(), k = c.bitis ? kalanGun(c.bitis, bugun) : null;
  const baslik = `${c.kod} · ${c.tur}`;
  return (
    <>
      <Kirinti ogeler={[["Ölçüm cihazları", "/olcum-cihazlari"], [c.kod]]} />
      <NesneBasi baslik={baslik} rozet={c.pasif ? <Rozet tur="notr">Pasif</Rozet> : <KalRozeti d={c.durum} esik={c.esik} />} altIkon="gauge"
        alt={[[c.marka, c.model].filter(Boolean).join(" "), c.seri && `seri ${c.seri}`].filter(Boolean).join(" · ") || "Marka / model girilmedi"}
        tuslar={yaz && <CihazTuslari cihaz={{ id: c.id, surum: c.surum, kod: c.kod, turId: c.turId, marka: c.marka, model: c.model, seri: c.seri, aralik: c.aralik }} turler={turler} konum={c.konum} baslik={baslik} sil={silme.sil}
          pasif={!!c.pasif} kullanim={silme.kullanim ? kullanimMetni(silme.kullanim) : null} />} />
      {c.pasif && <SeritKap><Serit tur="bilgi" ikon="ban">Pasif ({tarihYaz(c.pasif)}): listeden, rapor seçiminden, Zimmetler&apos;den ve uyarılardan kalktı; kalibrasyon geçmişi ve raporları duruyor.</Serit></SeritKap>}
      {!c.pasif && c.durum === "gecti" && <SeritKap><Serit tur="hata" ikon="circle-x">{c.bitis ? `Kalibrasyonu ${tarihYaz(c.bitis)} tarihinde bitti.` : "Geçerli kalibrasyon kaydı yok."} Bu cihazla hazırlanan raporlar yönetici onayına gönderilemez.</Serit></SeritKap>}
      {!c.pasif && c.durum === "yakin" && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Kalibrasyon {tarihYaz(c.bitis)} tarihinde bitiyor ({k} gün). Bitince bu cihazla hazırlanan raporlar onaya gönderilemez.</Serit></SeritKap>}
      {!c.pasif && c.durum === "lab" && <SeritKap><Serit tur="bilgi" ikon="flask-conical">Kalibrasyonda. Yeni sertifika gelince kalibrasyon kaydı eklenir, cihaz depoya döner.</Serit></SeritKap>}
      <Yuzler>
        <Yuz ikon={c.konum === "lab" ? "flask-conical" : "warehouse"} ad="Konum" sayi={KONUM_AD[c.konum]} not="kişi zimmeti Zimmetler'de" />
        <Yuz ikon="alarm-clock" ad="Kalibrasyon bitişi" sayi={tarihYaz(c.bitis)} uyari={c.durum === "gecti" || c.durum === "yakin"}
          not={k === null ? "kayıt yok" : k < 0 ? `${-k} gün geçti` : k === 0 ? "bugün bitiyor" : `${k} gün sonra`} />
        <Yuz ikon="file-text" ad="Kalibrasyon kaydı" sayi={c.kalibrasyonlar.length} />
      </Yuzler>
      <Bolum id="b-cihaz" baslik="Cihaz bilgileri">
        <BilgiListesi>
          <Bilgi etiket="Cihaz kodu">{c.kod}</Bilgi>
          <Bilgi etiket="Tür" genis>{c.tur}</Bilgi>
          <Bilgi etiket="Marka">{c.marka ?? <DegerYok />}</Bilgi>
          <Bilgi etiket="Model">{c.model ?? <DegerYok />}</Bilgi>
          <Bilgi etiket="Seri no">{c.seri ?? <DegerYok />}</Bilgi>
          <Bilgi etiket="Ölçüm aralığı" genis>{c.aralik ?? <DegerYok />}</Bilgi>
        </BilgiListesi>
      </Bolum>
      <Bolum id="b-kal" baslik="Kalibrasyon kayıtları" sayac={<><b>{c.kalibrasyonlar.length}</b> kayıt</>}>
        {c.kalibrasyonlar.length ? <KalibrasyonTablosu kayitlar={c.kalibrasyonlar} kaldirabilir={yaz} /> : <p className={stil.bosSatir}>Kalibrasyon kaydı yok.</p>}
      </Bolum>
    </>
  );
}
