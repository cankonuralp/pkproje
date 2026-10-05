/* MÜŞTERİ PANELİ › RAPOR (maket musteri.html #/r/<no>): imzalı raporun son sürümü — başlıkta numara ve sonuç; altında ekipman · tür · tesis ·
   kontrol; "PDF indir" ve "PDF'i aç" (imzalı PDF, tek indirme ucu, müşteri rolünde); revizyonsa "… yerine geçer" şeridi (193); uygunsuzlukları.
   Başka müşterinin ya da imzasız rapor: "Rapor bulunamadı" — var olduğu bile söylenmez. */
import type { Metadata } from "next";
import { BosDurum } from "../../../../../components/bos/BosDurum";
import { DosyaAcTusu } from "../../../../../components/gizli-resim/GizliResim";
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
        tuslar={<>
          <DosyaAcTusu dosyaId={r.dosya} ikon="eye">PDF&apos;i aç</DosyaAcTusu>
          <DosyaAcTusu dosyaId={r.dosya} ikon="download" indir>PDF indir</DosyaAcTusu>
        </>} />
      {(r.yerine || acik.length > 0) && (
        <SeritKap>
          {r.yerine && <Serit tur="bilgi" ikon="file-pen-line">Bu rapor {r.no}, {r.yerine} raporunun yerine geçer.</Serit>}
          {acik.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Açık uygunsuzluk: {acik.length}. Ağır kusurlu ekipman giderilene kadar kullanılamaz; giderilince ikinci kontrol istenir.</Serit>}
        </SeritKap>
      )}
      <Bolum id="p-ozet" baslik="Rapor">
        <ul className={stil.uygunsuzListe}>
          <li>Kontrol tarihi: {r.kontrol ? tarihNo(r.kontrol) : "—"}</li>
          <li>Sonraki kontrol: {r.sonraki ? tarihNo(r.sonraki) : "—"}</li>
          <li>İmza: {tarihNo(r.imzalandi.slice(0, 10))} · güvenli elektronik imzalı PDF</li>
        </ul>
      </Bolum>
      {uygunsuzluklar.length > 0 && (
        <Bolum id="p-uygunsuz" baslik="Uygunsuzluklar" sayac={<><b>{acik.length}</b> açık</>}>
          <ul className={stil.uygunsuzListe}>
            {uygunsuzluklar.map((u) => (
              <li key={u.id}><span className={u.agir ? stil.agir : undefined}>{u.agir ? "Ağır · " : ""}</span>{u.metin}{u.acik ? "" : " — giderildi"}</li>
            ))}
          </ul>
        </Bolum>
      )}
    </>
  );
}
