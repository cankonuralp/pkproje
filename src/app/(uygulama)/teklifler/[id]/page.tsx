/* TEKLİF SAYFASI (maket teklifler.html #/t/<no> — teklifCiz): başlık (no, durum; eylemler başlık satırında), müşteri (kayıtlı değilse işaretli) ·
   yer; red / süresi doldu / kabul şeritleri; Hazırlanan · Gönderildi · Geçerlilik · İlgili kişi; kayıtlı olmayan müşterinin bilgileri; Kalemler
   (tür × adet × birim fiyat × tutar; kabul edilmişte "Raporlanan" — her rapor tek teklife bağlanır, §3.2 madde 5), ara toplam, KDV, genel toplam,
   raporlanan tutar. PDF (teklif belgesi, sunucuda — 325) ve "Excel'e aktar" (yüklenen liste, yoksa tesislerin kayıtlı ekipmanı). Görmeyen:
   bulunamadı. Kalem tablosu istemci bileşeninde (sütun işlevleri sunucudan geçirilemez — 324 incelemesi). */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { AltSatir, Bolum, DegerYok, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../../components/secim/tarih";
import { Serit } from "../../../../components/serit/Serit";
import { modulBul } from "../../../../modules/moduller";
import { kdvli, para, TEKLIF_DURUM } from "../../../../modules/teklifler/sema";
import { teklifExcelVerisi, teklifKarti, teklifSecenekleri } from "../../../../modules/teklifler/server/teklifler";
import { ExcelAktar } from "../../../../modules/teklifler/ui/EkipmanExcel";
import { KalemTablosu } from "../../../../modules/teklifler/ui/KalemTablosu";
import { TeklifEylemleri, type BaglaMusterisi } from "../../../../modules/teklifler/ui/TeklifEylemleri";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("teklifler")!;
export const metadata: Metadata = { title: "Teklif" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const v = await oturumIslemi(o, async (db) => {
    const t = await teklifKarti(db, o, id);
    if (!t) return null;
    /* "Var olan müşteriye bağla"nın seçenekleri: yalnız bağlayabilene, etkin müşteriler ve tesisleri */
    const bagla: BaglaMusterisi[] = t.izin.bagla ? ((await teklifSecenekleri(db, o))?.musteriler ?? []).map((m) => ({
      id: m.id, kisa: m.kisa, tesisler: m.tesisler.map((y) => ({ id: y.id, ad: y.ad, yer: [y.ilce, y.il].filter(Boolean).join(" / ") })),
    })) : [];
    return { t, excel: await teklifExcelVerisi(db, o, t), bagla };
  });
  if (!v) notFound();
  const { t, excel, bagla } = v;
  const kabul = t.durum === "kabul";
  return (
    <>
      <Kirinti ogeler={[["Teklifler", "/teklifler"], [t.no]]} />
      <NesneBasi baslik={t.no} rozet={<Rozet tur={TEKLIF_DURUM[t.durum][1]}>{TEKLIF_DURUM[t.durum][0]}</Rozet>} altIkon="building-2"
        alt={<>{t.musteriKart ? <Link href={`/musteriler/${t.musteriKart.id}`}>{t.musteriKart.unvan}</Link> : <>{t.aday?.unvan ?? "—"} <Rozet tur="bekliyor">Kayıtlı değil</Rozet></>}
          {" · "}{t.musteriKart ? t.tesis : [t.aday?.ilce, t.aday?.il].filter(Boolean).join(" / ")}</>}
        tuslar={<TeklifEylemleri t={t} pdf={`/teklifler/${t.id}/pdf`} musteriler={bagla} />} />
      {(t.durum === "red" || t.durum === "suresi" || kabul || t.kopyaKaynak) && (
        <SeritKap>
          {t.durum === "red" && t.sonuc && <Serit tur="hata" ikon="ban">Reddedildi {tarihNo(t.sonuc)}: “{t.gerekce}”</Serit>}
          {t.durum === "suresi" && t.bitis && <Serit tur="uyari" ikon="clock">Geçerlilik {tarihNo(t.bitis)} tarihinde doldu.</Serit>}
          {kabul && t.sonuc && <Serit tur="onay" ikon="circle-check">Kabul edildi {tarihNo(t.sonuc)}.{t.musteriKart ? "" : " Müşteri kayıtlı değil: “Müşteri olarak kaydet” ile müşteri ve tesis açılır (ya da “Var olan müşteriye bağla”), sonra iş sözleşmesi ve plan."}</Serit>}
          {t.kopyaKaynak && <Serit tur="bilgi" ikon="copy">{t.kopyaKaynak} teklifinden kopyalandı.</Serit>}
        </SeritKap>
      )}
      <Bolum id="b-tk-ozet" baslik="Teklif">
        <BilgiListesi>
          <Bilgi etiket="Hazırlanan">{tarihNo(t.tarih)}<AltSatir>{t.hazirlayan}</AltSatir></Bilgi>
          <Bilgi etiket="Gönderildi">{t.gonderildi ? tarihNo(t.gonderildi) : <DegerYok>Henüz değil</DegerYok>}</Bilgi>
          <Bilgi etiket="Geçerlilik">{t.gecerlilik} gün{t.bitis && <AltSatir>{tarihNo(t.bitis)} tarihine kadar</AltSatir>}</Bilgi>
          <Bilgi etiket="İlgili kişi">{t.ilgili ?? "—"}</Bilgi>
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
            <Bilgi etiket="Yetkili">{t.aday.yetkili ?? "—"}</Bilgi>
          </BilgiListesi>
        </Bolum>
      )}
      <Bolum id="b-tk-kalem" baslik="Kalemler" sayac={<><b>{t.kalemSayisi}</b> tür{t.ekipmanlar.length ? <> · <b>{t.ekipmanlar.length}</b> ekipman (Excel&apos;den)</> : null}</>}
        tuslar={excel && excel.liste.length > 0 ? <ExcelAktar turler={excel.turler} fiyat={excel.fiyat} ad={`${t.no}-ekipmanlar.xlsx`} ne={excel.ne} liste={excel.liste} /> : undefined}>
        <KalemTablosu kalemler={t.kalemler} kabul={kabul} />
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
