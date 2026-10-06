/* RAPOR ŞABLONU SÜRÜMÜ (RAPOR-FORMAT.md §5–6; maket ekipman-turleri.html #/tur/<kod>/kurucu — salt okunur önizleme; taslağın düzenleyicisi
   Format kurucu …/kurucu, K4): başlık +
   durum (Taslak / Yayında / Eski) · yüzler · taslakta yayın denetimi (kilitli öğe engeli, uyarılar) · kurallar · görünüm · saha ekranı önizlemesi.
   Görmeyen, başka firmanın ya da başka türün sürümü: bulunamadı. Yayınla yalnız "değiştirir" düzeyine çizilir; karar sunucuda. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Kosullar, Yuz, Yuzler } from "../../../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../../../components/hata/Hata";
import { Bolum, DegerYok, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../../../components/sayfa/Sayfa";
import { TusBaglanti } from "../../../../../../components/tus/Tus";
import { Serit } from "../../../../../../components/serit/Serit";
import { kilitliKimlikler } from "../../../../../../format/motor";
import { bransAd } from "../../../../../../modules/ekipman-turleri/sema";
import { turOzeti } from "../../../../../../modules/ekipman-turleri/server/turler";
import { modulBul } from "../../../../../../modules/moduller";
import { formatAyrintisi, formatDegistirir } from "../../../../../../modules/rapor-format/server/formatlar";
import { FormatOnizleme } from "../../../../../../modules/rapor-format/ui/FormatOnizleme";
import { DURUM_ROZET, surumAdi, tarihYaz } from "../../../../../../modules/rapor-format/ui/ortak";
import { YayinlaTusu } from "../../../../../../modules/rapor-format/ui/SablonBolumu";
import stil from "../../../../../../modules/rapor-format/ui/format.module.css";
import { modulOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: "Rapor şablonu" };
const evet = (b: boolean) => (b ? "Evet" : "Hayır");

export default async function Sayfa({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id, sid } = await params;
  const [f, tur] = await oturumIslemi(o, async (db) => {
    const f = await formatAyrintisi(db, o, sid);
    return [f, f && f.turId === id ? await turOzeti(db, id) : null] as const;
  });
  if (!f || !tur) notFound();
  const t = f.tanim, yaz = formatDegistirir(o) && f.durum === "taslak";
  const madde = t ? t.bolumler.reduce((n, b) => n + (b.blok === "liste" ? b.gruplar.reduce((k, g) => k + g.maddeler.length, 0) : 0), 0) : 0;
  const kilit = t ? kilitliKimlikler(t).size : 0;
  const [rozetTur, rozetAd] = DURUM_ROZET[f.durum];
  return (
    <>
      <Kirinti ogeler={[[`Ekipman türleri · ${bransAd(tur.brans)}`, tur.brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"],
        [tur.ad, `/ekipman-turleri/${tur.id}`], [`Rapor şablonu · ${surumAdi(f)}`]]} />
      <NesneBasi baslik={`Rapor şablonu · ${surumAdi(f)}`} rozet={<Rozet tur={rozetTur}>{rozetAd}</Rozet>} altIkon="layout-list"
        alt={`${tur.ad} · ${f.kaynakAd ?? "Firma formatı"}`} tuslar={yaz && <>
          <TusBaglanti ikon="pencil" href={`/ekipman-turleri/${tur.id}/sablon/${f.id}/kurucu`}>Format kurucu</TusBaglanti>
          <YayinlaTusu format={{ id: f.id, surum: f.surum }} />
        </>} />
      <Yuzler>
        <Yuz ikon="list" ad="Bölüm" sayi={f.bolum} />
        <Yuz ikon="list-checks" ad="Kontrol maddesi" sayi={madde} />
        <Yuz ikon="lock" ad="Bakanlık alanı" sayi={kilit || "Yok"} not={kilit ? "kilitli öğe" : undefined} />
        <Yuz ikon="calendar" ad={f.yayin ? "Yayınlandı" : "Son değişiklik"} sayi={tarihYaz(f.yayin ?? f.degisti)} not={f.yayinlayan ?? f.olusturan} />
      </Yuzler>
      {!t && <SeritKap><Serit tur="hata" ikon="circle-x">Bu sürümün tanımı okunamadı.</Serit></SeritKap>}
      {f.denetim && (f.denetim.engeller.length > 0 || f.denetim.uyarilar.length > 0) && (
        <Bolum id="b-denetim" baslik="Yayın denetimi">
          {f.denetim.engeller.length > 0 && <>
            <SeritKap><Serit tur="hata" ikon="lock">Yayınlanamaz: Bakanlık formatının zorunlu öğeleri korunmalı.</Serit></SeritKap>
            <Kosullar ogeler={f.denetim.engeller.map((m) => ({ tur: "eksik" as const, metin: m }))} />
          </>}
          {f.denetim.uyarilar.length > 0 && <Kosullar ogeler={f.denetim.uyarilar.map((m) => ({ tur: "eksik" as const, metin: m }))} />}
        </Bolum>
      )}
      {t && <>
        <Bolum id="b-kurallar" baslik="Kurallar">
          <BilgiListesi>
            <Bilgi etiket="“Uygun değil” maddede fotoğraf zorunlu">{evet(t.kurallar.foto)}</Bilgi>
            <Bilgi etiket="Kusur derecesi sorulur">{evet(t.kurallar.derece)}</Bilgi>
            <Bilgi etiket="Sonuç önerisi">{t.kurallar.oneri ? "Açık" : "Kapalı"}</Bilgi>
            {f.notu && <Bilgi etiket="Sürüm notu" genis>{f.notu}</Bilgi>}
          </BilgiListesi>
        </Bolum>
        <Bolum id="b-gorunum" baslik="Görünüm">
          <BilgiListesi>
            <Bilgi etiket="Form kodu">{t.gorunum.formKodu || <DegerYok>Girilmedi</DegerYok>}</Bilgi>
            <Bilgi etiket="Başlık" genis>{t.gorunum.baslik || <DegerYok>Girilmedi</DegerYok>}</Bilgi>
            {t.gorunum.dayanak.length > 0 && <Bilgi etiket="Dayanak" genis="tam"><ol className={stil.dayanak}>{t.gorunum.dayanak.map((d, i) => <li key={i}>{d}</li>)}</ol></Bilgi>}
          </BilgiListesi>
        </Bolum>
        <Bolum id="b-onizleme" baslik="Saha ekranı önizlemesi" sayac={<><b>{t.bolumler.length}</b> bölüm</>}>
          <FormatOnizleme tanim={t} />
        </Bolum>
      </>}
    </>
  );
}
