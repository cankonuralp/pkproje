/* TEKLİF SAYFASI (maket teklifler.html #/t/<no> — teklifCiz): başlık (no, durum), müşteri (kayıtlı değilse işaretli) · yer; duruma göre eylemler;
   red / süresi doldu / kabul şeritleri; Hazırlanan · Gönderildi · Geçerlilik · İlgili kişi; kayıtlı olmayan müşterinin bilgileri; Kalemler (tür ×
   adet × birim fiyat × tutar; kabul edilmişte "Raporlanan" — kabulden sonra imzalanan raporlar türüyle bağlanır, §3.2 madde 5), ara toplam, KDV,
   genel toplam, raporlanan tutar. Görmeyen: bulunamadı. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../../components/liste/Liste";
import { AltSatir, Bolum, DegerYok, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../../components/secim/tarih";
import { Serit } from "../../../../components/serit/Serit";
import { modulBul } from "../../../../modules/moduller";
import { kdvli, para, TEKLIF_DURUM } from "../../../../modules/teklifler/sema";
import { teklifKarti, type TeklifKalemi } from "../../../../modules/teklifler/server/teklifler";
import { TeklifEylemleri } from "../../../../modules/teklifler/ui/TeklifEylemleri";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("teklifler")!;
export const metadata: Metadata = { title: "Teklif" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const t = await oturumIslemi(o, (db) => teklifKarti(db, o, id));
  if (!t) notFound();
  const kabul = t.durum === "kabul";
  const sutunlar: Sutun<TeklifKalemi>[] = [
    { k: "tur", genislik: kabul ? "34%" : "40%", baslik: "Ekipman türü", kart: "ust", sira: 1, hucre: (k) => (
      <><Kirp>{k.turAd}</Kirp>{k.brans && <AltSatir>{k.brans === "m" ? "Mekanik" : "Elektrik"}{k.periyot ? ` · periyot ${k.periyot} ay` : ""}</AltSatir>}</>
    ) },
    { k: "adet", genislik: "14%", baslik: "Adet", kart: "govde", sira: 2, hucre: (k) => <><KartEtiket>Adet</KartEtiket>{k.adet}</> },
    { k: "fiyat", genislik: "20%", baslik: "Birim fiyat", kart: "govde", sira: 3, hucre: (k) => <><KartEtiket>Birim fiyat</KartEtiket>{para(k.fiyat)}</> },
    { k: "tutar", genislik: "20%", baslik: "Tutar", kart: "govde", sira: 4, hucre: (k) => <><KartEtiket>Tutar</KartEtiket>{para(k.adet * k.fiyat)}</> },
    ...(kabul ? [{ k: "rapor", genislik: "12%", baslik: "Raporlanan", kart: "rozet" as const, sira: 1, hucre: (k: TeklifKalemi) => {
      const n = k.raporlanan ?? 0;
      return <Rozet tur={n >= k.adet ? "tamam" : n ? "kabul" : "notr"}>{`${n} / ${k.adet}`}</Rozet>;
    } }] : []),
  ];
  const ilgili = t.aday?.yetkili ?? null;
  return (
    <>
      <Kirinti ogeler={[["Teklifler", "/teklifler"], [t.no]]} />
      <NesneBasi baslik={t.no} rozet={<Rozet tur={TEKLIF_DURUM[t.durum][1]}>{TEKLIF_DURUM[t.durum][0]}</Rozet>} altIkon="building-2"
        alt={<>{t.musteriKart ? <Link href={`/musteriler/${t.musteriKart.id}`}>{t.musteriKart.unvan}</Link> : <>{t.aday?.unvan ?? "—"} <Rozet tur="bekliyor">Kayıtlı değil</Rozet></>}
          {" · "}{t.musteriKart ? t.tesis : [t.aday?.ilce, t.aday?.il].filter(Boolean).join(" / ")}</>} />
      <TeklifEylemleri t={t} />
      {(t.durum === "red" || t.durum === "suresi" || kabul || t.kopyaKaynak) && (
        <SeritKap>
          {t.durum === "red" && t.sonuc && <Serit tur="hata" ikon="ban">Reddedildi {tarihNo(t.sonuc)}: “{t.gerekce}”</Serit>}
          {t.durum === "suresi" && t.bitis && <Serit tur="uyari" ikon="clock">Geçerlilik {tarihNo(t.bitis)} tarihinde doldu.</Serit>}
          {kabul && t.sonuc && <Serit tur="onay" ikon="circle-check">Kabul edildi {tarihNo(t.sonuc)}.{t.musteriKart ? "" : " Müşteri kayıtlı değil: “Müşteri olarak kaydet” ile müşteri ve tesis açılır, sonra iş sözleşmesi ve plan."}</Serit>}
          {t.kopyaKaynak && <Serit tur="bilgi" ikon="copy">{t.kopyaKaynak} teklifinden kopyalandı.</Serit>}
        </SeritKap>
      )}
      <Bolum id="b-tk-ozet" baslik="Teklif">
        <BilgiListesi>
          <Bilgi etiket="Hazırlanan">{tarihNo(t.tarih)}<AltSatir>{t.hazirlayan}</AltSatir></Bilgi>
          <Bilgi etiket="Gönderildi">{t.gonderildi ? tarihNo(t.gonderildi) : <DegerYok>Henüz değil</DegerYok>}</Bilgi>
          <Bilgi etiket="Geçerlilik">{t.gecerlilik} gün{t.bitis && <AltSatir>{tarihNo(t.bitis)} tarihine kadar</AltSatir>}</Bilgi>
          <Bilgi etiket="İlgili kişi">{ilgili ?? "—"}</Bilgi>
          {t.notlar && <Bilgi etiket="Not" genis>{t.notlar}</Bilgi>}
        </BilgiListesi>
      </Bolum>
      {!t.musteriKart && t.aday && (
        <Bolum id="b-tk-aday" baslik="Müşteri bilgileri">
          <BilgiListesi>
            <Bilgi etiket="Ünvan" genis>{t.aday.unvan}</Bilgi>
            <Bilgi etiket="Vergi dairesi / no">{[t.aday.vd, t.aday.vno].filter(Boolean).join(" · ") || "—"}</Bilgi>
            <Bilgi etiket="Adres" genis>{[t.aday.adres, [t.aday.ilce, t.aday.il].filter(Boolean).join(" / ")].filter(Boolean).join(", ")}</Bilgi>
            <Bilgi etiket="E-posta">{t.aday.eposta ?? "—"}</Bilgi>
            <Bilgi etiket="Telefon">{t.aday.tel ?? "—"}</Bilgi>
          </BilgiListesi>
        </Bolum>
      )}
      <Bolum id="b-tk-kalem" baslik="Kalemler" sayac={<><b>{t.kalemSayisi}</b> tür{t.ekipmanlar.length ? <> · <b>{t.ekipmanlar.length}</b> ekipman (Excel&apos;den)</> : null}</>}>
        <Liste baslik="Teklif kalemleri" sutunlar={sutunlar} kayitlar={t.kalemler} anahtar={(k) => k.turId} />
        <BilgiListesi>
          <Bilgi etiket="Ara toplam">{para(t.tutar)}</Bilgi>
          <Bilgi etiket={`KDV %${t.kdv}`}>{para(kdvli(t.tutar, t.kdv) - t.tutar)}</Bilgi>
          <Bilgi etiket="Genel toplam"><b>{para(kdvli(t.tutar, t.kdv))}</b></Bilgi>
          {t.raporlananTutar !== null && <Bilgi etiket="Raporlanan tutar">{para(t.raporlananTutar)}</Bilgi>}
        </BilgiListesi>
      </Bolum>
    </>
  );
}
