/* TÜR SAYFASI (maket ekipman-turleri.html #/tur/<kod>): başlık + işlemler · yüzler · rapor formatı sürümleri · kontrol kuralları. Kullanılacak
   ölçüm cihazları, standartlar ve rapor bölümleri o modüllerin kalemiyle gelir. Görmeyen / başka firmanın kaydı: bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Bolum, DegerYok, Kirinti, NesneBasi, SeritKap } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { bransAd, grupBul } from "../../../../modules/ekipman-turleri/sema";
import { turDegistirir, turKarti } from "../../../../modules/ekipman-turleri/server/turler";
import { FormatTablosu } from "../../../../modules/ekipman-turleri/ui/FormatTablosu";
import { TurTuslari } from "../../../../modules/ekipman-turleri/ui/KartTuslari";
import { tarihYaz } from "../../../../modules/ekipman-turleri/ui/ortak";
import { modulBul } from "../../../../modules/moduller";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: "Ekipman türü" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const t = await oturumIslemi(o, (db) => turKarti(db, o, id));
  if (!t) notFound();
  const yaz = turDegistirir(o);
  const g = grupBul(t.grup), onay = t.brans === "m" ? "Mekanik yönetici" : "Elektrik yönetici", p = t.formatlar[0];
  return (
    <>
      <Kirinti ogeler={[[`Ekipman türleri · ${bransAd(t.brans)}`, t.brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"], [t.ad]]} />
      <NesneBasi baslik={t.ad} altIkon="layers" alt={`Kod ${t.kod} · ${g?.ad ?? t.grup}`}
        tuslar={yaz && <TurTuslari tur={{ id: t.id, surum: t.surum, kod: t.kod, ad: t.ad, grup: t.grup, brans: t.brans, periyot: t.periyot, sure: t.sure }} kullanimda={p?.sira ?? null} />} />
      <Yuzler>
        <Yuz ikon="file-text" ad="Rapor formatı" sayi={p ? `Sürüm ${p.sira}` : "Yok"} not={p ? `yüklendi ${tarihYaz(p.olustu)}` : "PDF yüklenmedi"} uyari={!p} />
        <Yuz ikon="badge-check" ad="Onay" sayi={bransAd(t.brans)} not={`${onay} onaylar`} />
        <Yuz ikon="alarm-clock" ad="Periyot" sayi={`${t.periyot} ay`} not={t.sure ? `tahmini ${t.sure} dk` : "sonraki kontrol önerisi"} />
      </Yuzler>
      <Bolum id="b-format" baslik="Rapor formatı" sayac={p ? <><b>{t.formatlar.length}</b> sürüm</> : undefined}>
        {p ? <FormatTablosu formatlar={t.formatlar} kaldirabilir={yaz} />
          : <SeritKap><Serit tur="uyari" ikon="file-plus">Bu türün rapor formatı yüklenmedi. PDF yüklenince bu türde rapor oluşturulur.</Serit></SeritKap>}
      </Bolum>
      <Bolum id="b-kural" baslik="Kontrol kuralları">
        <BilgiListesi>
          <Bilgi etiket="Ek-III grubu" genis>{g?.ad ?? t.grup}</Bilgi>
          <Bilgi etiket="Branş">{bransAd(t.brans)} · onay {onay.toLocaleLowerCase("tr")}</Bilgi>
          <Bilgi etiket="Periyot">{t.periyot} ay</Bilgi>
          <Bilgi etiket="Tahmini kontrol süresi">{t.sure ? `${t.sure} dk` : <DegerYok>Girilmedi</DegerYok>}</Bilgi>
        </BilgiListesi>
      </Bolum>
    </>
  );
}
