/* MÜŞTERİ PANELİ › SÖZLEŞME (322; maket musteri.html #/s/<no>; karar 134 "görünür, panelden imza atılmaz"): numara ve durum; dönem, müşteri imza
   tarihi, kapsamdaki tesisler (yalnız görebildikleri); imzalıysa "PDF'i aç" / "PDF indir" (tek indirme ucu, müşteri rolünde — şu anki imzalı
   PDF). İmza bekleyen sözleşme panelden imzalanmaz. Başka müşterinin sözleşmesi: "Sözleşme bulunamadı" — var olduğu bile söylenmez. */
import type { Metadata } from "next";
import { Bilgi, BilgiListesi } from "../../../../../components/bilgi/Bilgi";
import { BosDurum } from "../../../../../components/bos/BosDurum";
import { DosyaAcTusu } from "../../../../../components/gizli-resim/GizliResim";
import { Bolum, Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../../../components/secim/tarih";
import { Serit } from "../../../../../components/serit/Serit";
import { panelSozlesmesi } from "../../../../../modules/musteri-paneli/server/panel";
import { SOZ_DURUM } from "../../../../../modules/musteri-paneli/ui/ortak";
import { musteriIslemi, musteriOturumGerekli } from "../../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Sözleşme" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await musteriOturumGerekli();
  const { id } = await params;
  const v = await musteriIslemi(o, (db) => panelSozlesmesi(db, id));
  if (!v) {
    return (
      <>
        <Kirinti ogeler={[["Sözleşmeler", "/portal/sozlesme"]]} />
        <h1 className="gizli">Sözleşme bulunamadı</h1>
        <BosDurum ikon="circle-alert" baslik="Sözleşme bulunamadı" metin="Bu adreste size açık bir sözleşme yok." eylem={{ href: "/portal/sozlesme", etiket: "Sözleşmelere dön", ikon: "arrow-left" }} />
      </>
    );
  }
  const { s } = v;
  return (
    <>
      <Kirinti ogeler={[["Sözleşmeler", "/portal/sozlesme"], [s.no]]} />
      <NesneBasi baslik={s.no} rozet={<Rozet tur={SOZ_DURUM[s.durum][1]}>{SOZ_DURUM[s.durum][0]}</Rozet>} altIkon="scroll-text"
        alt={<>İş sözleşmesi · {tarihNo(s.baslangic)} – {tarihNo(s.bitis)}</>}
        tuslar={s.dosya ? <>
          <DosyaAcTusu dosyaId={s.dosya} ikon="eye">PDF&apos;i aç</DosyaAcTusu>
          <DosyaAcTusu dosyaId={s.dosya} ikon="download" indir>PDF indir</DosyaAcTusu>
        </> : undefined} />
      {s.durum === "imza" && (
        <SeritKap><Serit tur="bilgi" ikon="file-pen-line">Sözleşme imzanızı bekliyor. İmzalı sözleşmeyi muayene firmasına iletin; firma yükleyince burada görünür.</Serit></SeritKap>
      )}
      <Bolum id="s-ozet" baslik="Sözleşme">
        <BilgiListesi>
          <Bilgi etiket="Dönem">{tarihNo(s.baslangic)} – {tarihNo(s.bitis)}</Bilgi>
          <Bilgi etiket="Müşteri imzası">{s.musteriImza ? tarihNo(s.musteriImza) : "Bekliyor"}</Bilgi>
          <Bilgi etiket="Tesisler" genis>{s.tesisAdlari.join(", ")}</Bilgi>
        </BilgiListesi>
      </Bolum>
    </>
  );
}
