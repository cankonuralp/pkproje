/* HAZIR RAPOR FORMATI ÖNİZLEMESİ (436; reisim 2026-10-09: "EKİPMAN TÜRLERİNDE BAKANLIK FORMATLARINI DA GÖREMEDİM") — probata kitaplığındaki bir şablon
   (src/format/sablonlar.ts): başlık, form kodu, Bakanlık formatı mı, kriter belgesi bağlantısı · yüzler (bölüm, madde, kilitli öğe) · görünüm
   (dayanak) · saha ekranı önizlemesi (FormatOnizleme). "Tür olarak ekle" yalnız tür ve format değiştirebilene; karar sunucuda. Kitaplıkta olmayan
   anahtar: bulunamadı. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { Bolum, DegerYok, Kirinti, NesneBasi, Rozet } from "../../../../../components/sayfa/Sayfa";
import { kilitliKimlikler } from "../../../../../format/motor";
import { bransAd, grupBul } from "../../../../../modules/ekipman-turleri/sema";
import { turDegistirir } from "../../../../../modules/ekipman-turleri/server/turler";
import { SablonTurEkleTusu } from "../../../../../modules/ekipman-turleri/ui/HazirFormatlar";
import { modulBul } from "../../../../../modules/moduller";
import { formatDegistirir } from "../../../../../modules/rapor-format/server/formatlar";
import { sablonBul } from "../../../../../modules/rapor-format/sema";
import { FormatOnizleme } from "../../../../../modules/rapor-format/ui/FormatOnizleme";
import stil from "../../../../../modules/rapor-format/ui/format.module.css";
import { modulOturumu } from "../../../../../server/kimlik/istek";
import { kriterBelgesi } from "../../../../../tanim/kriterler";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: "Hazır rapor formatı" };

export default async function Sayfa({ params }: { params: Promise<{ anahtar: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { anahtar } = await params;
  const s = sablonBul(anahtar);
  if (!s) notFound();
  const t = s.tanim, brans = grupBul(s.tur.grup)?.b ?? "e", kriter = s.kriter ? kriterBelgesi(s.kriter) : null;
  const madde = t.bolumler.reduce((n, b) => n + (b.blok === "liste" ? b.gruplar.reduce((k, g) => k + g.maddeler.length, 0) : 0), 0);
  const kilit = kilitliKimlikler(t).size;
  return (
    <>
      <Kirinti ogeler={[[`Ekipman türleri · ${bransAd(brans)}`, brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"], [t.gorunum.formKodu || s.ad]]} />
      <NesneBasi baslik={t.gorunum.baslik || s.ad} altIkon="layout-list"
        rozet={s.bakanlik ? <Rozet tur="kabul">Bakanlık formatı</Rozet> : <Rozet tur="notr">Hazır şablon</Rozet>}
        alt={<>{t.gorunum.formKodu ? `${t.gorunum.formKodu} · ` : ""}{kriter ? <Link href={`/dokumanlar/kriterler/${kriter.kod}`}>{kriter.kod} kontrol kriterleri</Link> : s.ad}</>}
        tuslar={turDegistirir(o) && formatDegistirir(o) && <SablonTurEkleTusu sablon={{ anahtar, ad: t.gorunum.formKodu || s.ad, tur: s.tur }} />} />
      <Yuzler>
        <Yuz ikon="list" ad="Bölüm" sayi={t.bolumler.length} />
        <Yuz ikon="list-checks" ad="Kontrol maddesi" sayi={madde} />
        <Yuz ikon="lock" ad="Bakanlık alanı" sayi={kilit || "Yok"} not={kilit ? "kilitli öğe" : undefined} />
        <Yuz ikon="layers" ad="Önerilen tür" sayi={s.tur.kod} not={`${s.tur.ad} · ${s.tur.periyot} ay`} />
      </Yuzler>
      <Bolum id="b-hazir-gorunum" baslik="Görünüm">
        <BilgiListesi>
          <Bilgi etiket="Form kodu">{t.gorunum.formKodu || <DegerYok>Firma kodundan üretilir</DegerYok>}</Bilgi>
          <Bilgi etiket="Kusur derecesi sorulur">{t.kurallar.derece ? "Evet" : "Hayır"}</Bilgi>
          {t.gorunum.dayanak.length > 0 && <Bilgi etiket="Dayanak" genis="tam"><ol className={stil.dayanak}>{t.gorunum.dayanak.map((d, i) => <li key={i}>{d}</li>)}</ol></Bilgi>}
        </BilgiListesi>
      </Bolum>
      <Bolum id="b-hazir-onizleme" baslik="Saha ekranı önizlemesi" sayac={<><b>{t.bolumler.length}</b> bölüm</>}>
        <FormatOnizleme tanim={t} />
      </Bolum>
    </>
  );
}
