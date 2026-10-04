/* PERSONEL KARTI (maket personel.html #/p/<id>; anayasa 2.7 nesne sayfası). Bu kalemde: kimlik ve sicil + giriş hesabı ve roller (görünüm).
   Hesap işlemleri, rol yetkileri, maaş, atama, zimmet, eğitim, özlük bölümleri kendi kalemlerinde (K2). Görmeyen / başka firmanın kaydı: bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { AltSatir, Bolum, DegerYok, Kirinti, Kod, NesneBasi, SeritKap } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { TusBaglanti } from "../../../../components/tus/Tus";
import { MODULLER, modulBul } from "../../../../modules/moduller";
import { eksikBilgi, personelKarti } from "../../../../modules/personel/server/personel";
import { yetkiliOlabilir } from "../../../../modules/personel/sema";
import { HesapBolumu } from "../../../../modules/personel/ui/HesapBolumu";
import { bransAd, bransi, DurumRozeti, meslekAdi, tarihYaz } from "../../../../modules/personel/ui/ortak";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";
import { canDo, canDoEylem, duzey } from "../../../../server/yetki/canDo";
import type { ModulAnahtari } from "../../../../server/yetki/tanim";

const MODUL = modulBul("personel")!;
export const metadata: Metadata = { title: "Personel kartı" };

const zamanYaz = (d: Date | null) => (d ? new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d) : "—");

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const p = await oturumIslemi(o, (db) => personelKarti(db, o, id));
  if (!p) notFound();
  const yaz = duzey(o, MODUL.no as ModulAnahtari) === "yaz";
  const b = bransi(p.meslek), e = eksikBilgi(p), h = p.hesapAyrinti;
  const denetci = !!h?.roller.includes("denetci");
  /* görebildiği modül: rollerin birleşimi (maket "Görebildiği modül N / M") */
  const gorulen = h ? MODULLER.filter((m) => canDo({ id: h.id, roller: h.roller }, m.no as ModulAnahtari, "gor")).length : 0;
  return (
    <>
      <Kirinti ogeler={[["Personel", "/personel"], [p.ad]]} />
      <NesneBasi baslik={p.ad} rozet={<DurumRozeti d={p.durum} />} altIkon="id-card" alt={`${meslekAdi(p)}${b ? ` · ${bransAd(b)}` : ""}`}
        tuslar={yaz && <TusBaglanti tur="birincil" href={`/personel/${p.id}/duzenle`} ikon="pencil">Düzenle</TusBaglanti>} />
      {e.length > 0 && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Eksik bilgi: {e.join(" · ")}.</Serit></SeritKap>}
      <Bolum id="b-kimlik" baslik="Kimlik ve sicil">
        <BilgiListesi>
          <Bilgi etiket="Meslek">{meslekAdi(p)}</Bilgi>
          <Bilgi etiket="Branş">{bransAd(b)}</Bilgi>
          <Bilgi etiket="Diploma no">{p.diploma ? <Kod>{p.diploma}</Kod> : <DegerYok />}</Bilgi>
          <Bilgi etiket="Oda sicil no">{p.oda ? <Kod>{p.oda}</Kod> : <DegerYok />}</Bilgi>
          <Bilgi etiket="EKİPNET kayıt no">{p.ekipnet ? <Kod>{p.ekipnet}</Kod> : denetci ? <AltSatir uyari>Boş</AltSatir> : <DegerYok />}</Bilgi>
          <Bilgi etiket="E-posta" genis>{p.eposta ?? <DegerYok />}</Bilgi>
          <Bilgi etiket="Mobil imza telefonu">{p.imzaTel ? <Kod>{p.imzaTel.replace(/^(\d{4})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4")}</Kod> : <DegerYok />}</Bilgi>
          <Bilgi etiket="İşe başlama">{tarihYaz(p.basla)}</Bilgi>
          {p.durum === "ayrildi" && <Bilgi etiket="Ayrılış">{tarihYaz(p.ayrildi)}</Bilgi>}
        </BilgiListesi>
      </Bolum>
      <HesapBolumu personelId={p.id} ad={p.ad} meslekAdi={meslekAdi(p)} eposta={p.eposta} personelEtkin={p.durum === "etkin"}
        yonetebilir={canDoEylem(o, "hesap_ac_kapat")} yetkiliOlabilir={yetkiliOlabilir(p.meslek)}
        hesap={h && { durum: h.durum, roller: h.roller, eposta: h.eposta, zaman: zamanYaz(h.durum === "ilk" ? h.olustu : h.sonGiris), gorulen: `${gorulen} / ${MODULLER.length}` }} />
    </>
  );
}
