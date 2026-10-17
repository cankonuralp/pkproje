/* MÜŞTERİ PANELİ › RAPOR (maket musteri.html #/r/<no>): imzalı raporun son sürümü — başlıkta numara ve sonuç; altında ekipman · tür · tesis ·
   kontrol; "PDF indir" (imzalı PDF, tek indirme ucu, müşteri rolünde); revizyonsa "… yerine geçer" şeridi (193); uygunsuzlukları.
   2026-10-17 (reisim: "müşteri tıklayınca direk raporu görmeli pdfi aç, tuşu falan ne alaka … burada tıkladığı gibi içeride raporu görmeli"):
   imzalı rapor sayfanın İÇİNDE görünür (components/pdf/PdfGorunumu — pdf.js, telefonda da); "PDF'i aç" tuşu kalktı.
   Başka müşterinin ya da imzasız rapor: "Rapor bulunamadı" — var olduğu bile söylenmez. */
import type { Metadata } from "next";
import { BosDurum } from "../../../../../components/bos/BosDurum";
import { DosyaAcTusu, dosyaCerceveAdresi } from "../../../../../components/gizli-resim/GizliResim";
import { PdfGorunumu } from "../../../../../components/pdf/PdfGorunumu";
import { SayfaliListe } from "../../../../../components/liste/Sayfalayici";
import { Bolum, Kirinti, Kod, NesneBasi, SeritKap } from "../../../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../../../components/secim/tarih";
import { Serit } from "../../../../../components/serit/Serit";
import { panelRaporu } from "../../../../../modules/musteri-paneli/server/panel";
import { SonucYazisi } from "../../../../../modules/musteri-paneli/ui/ortak";
import stil from "../../../../../modules/musteri-paneli/ui/panel.module.css";
import { musteriIslemi, musteriOturumGerekli } from "../../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Rapor" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await musteriOturumGerekli();
  const { id } = await params;
  const v = await musteriIslemi(o, (db) => panelRaporu(db, id));
  if (!v) {
    return (
      <>
        <Kirinti ogeler={[["Raporlarınız", "/portal"]]} />
        <h1 className="gizli">Rapor bulunamadı</h1>
        <BosDurum ikon="circle-alert" baslik="Rapor bulunamadı" metin="Bu adreste size açık bir rapor yok." eylem={{ href: "/portal", etiket: "Raporlara dön", ikon: "arrow-left" }} />
      </>
    );
  }
  const { r, uygunsuzluklar } = v;
  const acik = uygunsuzluklar.filter((u) => u.acik);
  return (
    <>
      <Kirinti ogeler={[["Raporlarınız", "/portal"], [r.no]]} />
      <NesneBasi baslik={r.no} rozet={<SonucYazisi sonuc={r.sonuc} />} altIkon="wrench"
        alt={<><Kod>{r.ekipmanKod}</Kod> · {r.turAd} · {r.tesis}{r.kontrol ? ` · kontrol ${tarihNo(r.kontrol)}` : ""}</>}
        tuslar={r.dosya ? <DosyaAcTusu dosyaId={r.dosya} ikon="download" indir>PDF indir</DosyaAcTusu> : undefined} />
      {(r.yerine || acik.length > 0 || !r.dosya) && (
        <SeritKap>
          {/* 387: saklama süresi dolunca imzalı PDF firmanın deposundan silinir; rapor bilgisi kalır */}
          {!r.dosya && <Serit tur="bilgi" ikon="archive">Bu raporun PDF&apos;i saklama süresi dolduğu için silindi.</Serit>}
          {r.yerine && <Serit tur="bilgi" ikon="file-pen-line">Bu rapor {r.no}, {r.yerine} raporunun yerine geçer.</Serit>}
          {acik.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Açık uygunsuzluk: {acik.length}. Ağır kusurlu ekipman giderilene kadar kullanılamaz; giderilince ikinci kontrol istenir.</Serit>}
        </SeritKap>
      )}
      {r.dosya && dosyaCerceveAdresi(r.dosya) && (
        <Bolum id="p-rapor" baslik="Rapor">
          <PdfGorunumu adres={dosyaCerceveAdresi(r.dosya)!} ad={r.no} />
        </Bolum>
      )}
      <Bolum id="p-ozet" baslik="Özet">
        <ul className={stil.uygunsuzListe}>
          <li>Kontrol tarihi: {r.kontrol ? tarihNo(r.kontrol) : "—"}</li>
          <li>Sonraki kontrol: {r.sonraki ? tarihNo(r.sonraki) : "—"}</li>
          <li>İmza: {tarihNo(r.imzaGunu)} · güvenli elektronik imzalı PDF</li>
        </ul>
      </Bolum>
      {uygunsuzluklar.length > 0 && (
        <Bolum id="p-uygunsuz" baslik="Uygunsuzluklar" sayac={<><b>{acik.length}</b> açık</>}>
          <SayfaliListe ad="Uygunsuzluklar" className={stil.uygunsuzListe} ogeler={uygunsuzluklar.map((u) => (
              <li key={u.id}><span className={u.agir ? stil.agir : undefined}>{u.agir ? "Ağır · " : ""}</span>{u.metin}{u.acik ? "" : " — giderildi"}</li>
            ))} />
        </Bolum>
      )}
    </>
  );
}
