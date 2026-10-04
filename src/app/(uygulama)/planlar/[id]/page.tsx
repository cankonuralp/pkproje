/* PLAN SAYFASI (maket plan-ac.html "plan açıldı" ekranı; L7 başlıkta firma önde, tesis altında): proje no · müşteri ünvanı + durum · denetçi başına
   uyarılar (engel değil) · plan bilgisi (künye, ekip, İSG-KATİP SÖZLEŞME ID, ekipman) · tesisteki ekipman tür başına. Plan içi akışı (kabul, denetim,
   ekipman ve raporlar, tamamlama) Planlar kaleminde bu sayfaya eklenir. Görmeyen / başka firmanın planı: bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bilgi, BilgiListesi, Kosullar } from "../../../../components/bilgi/Bilgi";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Bolum, DegerYok, Kirinti, Kod, NesneBasi, Rozet, SeritKap } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { TusBaglanti } from "../../../../components/tus/Tus";
import { modulBul } from "../../../../modules/moduller";
import { PLAN_DURUM, tarihNo } from "../../../../modules/planlar/sema";
import { planAcabilir, planKarti } from "../../../../modules/planlar/server/planlar";
import { KapsamTablosu } from "../../../../modules/planlar/ui/KapsamTablosu";
import stil from "../../../../modules/planlar/ui/planlar.module.css";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("planlar")!;
export const metadata: Metadata = { title: "Plan" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const p = await oturumIslemi(o, (db) => planKarti(db, o, id));
  if (!p) notFound();
  const [durumAd, rozet] = PLAN_DURUM[p.durum];
  const uyarili = p.ekip.filter((e) => e.uyarilar.length || e.cakisma.length);
  return (
    <>
      <Kirinti ogeler={[["Planlar", "/planlar"], [p.no]]} />
      <NesneBasi baslik={`${p.no} · ${p.musteri.unvan}`} rozet={<Rozet tur={rozet}>{durumAd}</Rozet>} altIkon="map-pin" alt={p.tesis.ad}
        tuslar={planAcabilir(o) && <TusBaglanti ikon="plus" href="/planlar/ac">Yeni plan aç</TusBaglanti>} />
      {(uyarili.length > 0 || p.gecmis || p.sozlesmeUyarisi) && <SeritKap>
        {p.gecmis && <Serit tur="uyari" ikon="triangle-alert">Plan günü geçmiş bir tarih: {tarihNo(p.baslangic)}.</Serit>}
        {p.sozlesmeUyarisi && <Serit tur="uyari" ikon="triangle-alert">{p.sozlesmeUyarisi}</Serit>}
        {uyarili.map((e) => (
          <Serit key={e.personelId} tur="uyari" ikon="triangle-alert">
            <b>{e.ad}</b> — uyarı: {[...e.uyarilar, ...e.cakisma.map((c) => `aynı günlerde ${c.no} planında · ${tarihNo(c.baslangic)}`)].join(" · ")}.
          </Serit>
        ))}
      </SeritKap>}
      <Bolum id="b-plan" baslik="Plan bilgisi">
        <BilgiListesi>
          <Bilgi etiket="Proje no"><Kod>{p.no}</Kod></Bilgi>
          <Bilgi etiket="Başlangıç">{tarihNo(p.baslangic)}</Bilgi>
          <Bilgi etiket="Bitiş">{tarihNo(p.bitis)}</Bilgi>
          <Bilgi etiket="Firma adı" genis>{p.firmaAdi}</Bilgi>
          <Bilgi etiket="Adres" genis>{p.adres ?? <DegerYok>Girilmedi</DegerYok>}</Bilgi>
          <Bilgi etiket="SGK DETSİS NO" genis="cift">{p.sgk ? <Kod>{p.sgk}</Kod> : <DegerYok>Girilmedi</DegerYok>}</Bilgi>
          <Bilgi etiket="Ekip" genis>{p.ekip.map((e) => e.ad).join(", ")}</Bilgi>
          <Bilgi etiket="İSG-KATİP SÖZLEŞME ID" genis>
            {p.ekip.map((e) => <span key={e.personelId} className={stil.satir}>{e.ad}: {e.isgNo ? <Kod>{e.isgNo}</Kod> : <DegerYok>yok</DegerYok>}</span>)}
          </Bilgi>
          <Bilgi etiket="Ekipman">{p.ekipman ? `${p.ekipman} ekipman · ${p.kapsam.length} tür` : <DegerYok>Tesiste kayıtlı ekipman yok</DegerYok>}</Bilgi>
          <Bilgi etiket="Açıklama" genis>{p.aciklama ?? <DegerYok>Yok</DegerYok>}</Bilgi>
        </BilgiListesi>
      </Bolum>
      {p.kapsam.length > 0 && <Bolum id="b-kapsam" baslik="Tesisteki ekipman tür başına">
        <KapsamTablosu kapsam={p.kapsam} ekip={p.ekip} />
        {p.turUyarilari.length > 0 && <Kosullar ogeler={p.turUyarilari.map((metin) => ({ tur: "eksik" as const, metin }))} />}
      </Bolum>}
    </>
  );
}
