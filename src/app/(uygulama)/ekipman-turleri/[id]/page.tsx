/* TÜR SAYFASI (maket ekipman-turleri.html #/tur/<kod>): başlık + işlemler · yüzler · rapor şablonu (format tanımı; 2026-10-04, 308: sürümler,
   şablondan başlat, önizle, yayınla — RAPOR-FORMAT.md §5) · kullanılacak ölçüm cihazları · kontrol metodu standartları · kontrol kuralları ·
   basılı format PDF'i. 450 (reisim 2026-10-09: "standart olarak pdf formatı yükleyin diyor hala yeni tür ekleyince … default olarak makette
   yaptıklarımız gibi olacak"): rapor yayındaki şablondan yazılır ve belge Bakanlık görünümünde çizilir — PDF İSTEĞE BAĞLI (firmanın kendi basılı
   formatı, başvuru için); yeni türe şablon kendiliğinden gelir. "Rapor formatı" yüzü yayındaki şablonu gösterir. Görmeyen / başka firmanın kaydı:
   bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Yuz, Yuzler } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Bolum, DegerYok, Kirinti, NesneBasi, SeritKap } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { bransAd, grupBul } from "../../../../modules/ekipman-turleri/sema";
import { baglantiSecenekleri, turDegistirir, turKarti, turSilmeDurumu } from "../../../../modules/ekipman-turleri/server/turler";
import { BaglantiTusu } from "../../../../modules/ekipman-turleri/ui/Baglantilar";
import stil from "../../../../modules/ekipman-turleri/ui/turler.module.css";
import { FormatTablosu } from "../../../../modules/ekipman-turleri/ui/FormatTablosu";
import { TurTuslari } from "../../../../modules/ekipman-turleri/ui/KartTuslari";
import { tarihYaz } from "../../../../modules/ekipman-turleri/ui/ortak";
import { modulBul } from "../../../../modules/moduller";
import { SABLONLAR } from "../../../../format/sablonlar";
import { formatDegistirir, formatSurumleri, formatSilebilir } from "../../../../modules/rapor-format/server/formatlar";
import { SablonBaslatTusu, SablonTablosu, SifirdanTusu } from "../../../../modules/rapor-format/ui/SablonBolumu";
import { surumAdi, tarihYaz as sablonTarihi } from "../../../../modules/rapor-format/ui/ortak";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("ekipman-turleri")!;
const SABLON_SECENEKLERI = Object.entries(SABLONLAR).map(([k, s]) => [k, s.ad] as const);
export const metadata: Metadata = { title: "Ekipman türü" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const [t, sec, sablonlar, silme] = await oturumIslemi(o, async (db) => [await turKarti(db, o, id), await baglantiSecenekleri(db, o), await formatSurumleri(db, o, id),
    await turSilmeDurumu(db, o, id)] as const);
  if (!t) notFound();
  const yaz = turDegistirir(o), sablonYaz = formatDegistirir(o);
  const surumler = sablonlar ?? [], yayinda = surumler.find((x) => x.durum === "yayinda"), taslak = surumler.find((x) => x.durum === "taslak");
  const g = grupBul(t.grup), onay = t.brans === "m" ? "Mekanik yönetici" : "Elektrik yönetici", p = t.formatlar[0];
  return (
    <>
      <Kirinti ogeler={[[`Ekipman türleri · ${bransAd(t.brans)}`, t.brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"], [t.ad]]} />
      <NesneBasi baslik={t.ad} altIkon="layers" alt={`Kod ${t.kod} · ${g?.ad ?? t.grup}`}
        tuslar={yaz && <TurTuslari tur={{ id: t.id, surum: t.surum, kod: t.kod, ad: t.ad, grup: t.grup, brans: t.brans, periyot: t.periyot, sure: t.sure }} kullanimda={p?.sira ?? null} sil={silme.sil} />} />
      <Yuzler>
        <Yuz ikon="layout-list" ad="Rapor formatı" sayi={yayinda ? surumAdi(yayinda) : "Yok"} href="#b-sablon" uyari={!yayinda}
          not={yayinda ? `yayınlandı ${sablonTarihi(yayinda.yayin)}${taslak ? " · taslak var" : ""}` : taslak ? "taslak var, yayınlanmadı" : "yayınlanmadı"} />
        <Yuz ikon="badge-check" ad="Onay" sayi={bransAd(t.brans)} not={`${onay} onaylar`} />
        <Yuz ikon="file-text" ad="Basılı format PDF'i" sayi={p ? `Sürüm ${p.sira}` : "Yok"} not={p ? `yüklendi ${tarihYaz(p.olustu)}` : "isteğe bağlı"} />
        <Yuz ikon="alarm-clock" ad="Periyot" sayi={`${t.periyot} ay`} not={t.sure ? `tahmini ${t.sure} dk` : "sonraki kontrol önerisi"} />
      </Yuzler>
      <Bolum id="b-sablon" baslik="Rapor şablonu" sayac={surumler.length ? <><b>{surumler.length}</b> sürüm</> : undefined}
        tuslar={sablonYaz && <>
          <SifirdanTusu turId={t.id} turAd={t.ad} taslak={taslak ? { surum: taslak.surum, degisti: taslak.degisti } : null} />
          <SablonBaslatTusu turId={t.id} turAd={t.ad} taslak={taslak ? { surum: taslak.surum, degisti: taslak.degisti } : null}
            surumler={surumler} sablonlar={SABLON_SECENEKLERI} />
        </>}>
        {surumler.length ? <SablonTablosu turId={t.id} surumler={surumler} yaz={sablonYaz} sil={formatSilebilir(o)} />
          : <SeritKap><Serit tur="uyari" ikon="layout-list">Rapor şablonu yayınlanmadı.</Serit></SeritKap>}
        {surumler.length > 0 && !yayinda && <SeritKap><Serit tur="uyari" ikon="layout-list">Rapor şablonu yayınlanmadı; yayınlanınca bu türde rapor yazılır.</Serit></SeritKap>}
      </Bolum>
      <Bolum id="b-tur-cihaz" baslik="Kullanılacak ölçüm cihazları" sayac={<><b>{t.cihazTurleri.length}</b> cihaz türü</>}
        tuslar={yaz && sec && <BaglantiTusu turId={t.id} surum={t.surum} standartlar={t.standartlar.map((x) => x.no)} cihazTurleri={t.cihazTurleri.map((x) => x.id)} secenekler={sec} brans={t.brans} />}>
        {t.cihazTurleri.length ? <ul className={stil.bagListe}>{t.cihazTurleri.map((c) => <li key={c.id}>{c.ad}</li>)}</ul>
          : <SeritKap><Serit tur="uyari" ikon="gauge">Ölçüm cihazı seçilmemiş; raporda cihaz şartı aranmaz.</Serit></SeritKap>}
      </Bolum>
      <Bolum id="b-tur-std" baslik="Kontrol metodu standartları" sayac={<><b>{t.standartlar.length}</b> standart</>}>
        {t.standartlar.length ? <ul className={stil.bagListe}>{t.standartlar.map((s) => <li key={s.no}><span>{s.id ? `${s.no}:${s.surumAdi}` : s.no}
          <span className={stil.altMetin}>{s.konu ?? "Kütüphanede güncel sürüm yok — Dökümanlar › Standartlar’dan yüklenir"}</span></span></li>)}</ul>
          : <SeritKap><Serit tur="uyari" ikon="triangle-alert">Standart seçilmemiş; raporda kontrol metodu “Üretici talimatı” yazar.</Serit></SeritKap>}
      </Bolum>
      <Bolum id="b-format" baslik="Basılı format PDF'i" sayac={p ? <><b>{t.formatlar.length}</b> sürüm</> : undefined}>
        {p ? <FormatTablosu formatlar={t.formatlar} kaldirabilir={yaz} />
          : <SeritKap><Serit tur="bilgi" ikon="info">İsteğe bağlı. Raporlar yukarıdaki rapor şablonundan, Bakanlık rapor görünümünde çizilir; PDF gerekmez.
            Firmanın kendi basılı formatı varsa başvuru için buraya yüklenir.</Serit></SeritKap>}
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
