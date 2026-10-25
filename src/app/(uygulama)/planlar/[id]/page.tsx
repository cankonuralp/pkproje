/* PLAN İÇİ (maket planlarim.html #/plan/<id>; donmuş referans ekran): kırıntı Planlar › proje no · başlıkta firma adı (künyeden; L7 "firma ismi önde"),
   altında tesis · durum rozeti · açık planda denetçi başına uyarılar (engel değil) · akış (PlanIciEkrani). Görmeyen / başka firmanın planı: bulunamadı.
   524: S.A.Y Chat (plan ekibindeki kişi, plan kabul / denetimde / tamamlandı) — veri sayfayla gelir (çevrimdışı açılan sayfada da hazır).
   2026-10-25 (belge doldurma): ön bilgilendirme / saha formunun elle doldurulan yerleri ve "Ön bilgilendirme formunu gönder" (planBelgeleri) —
   gönderim eylemi PDF'i bu sayfanın işlevinde basar: Chromium ve maxDuration 60 (next.config.ts, tests/pdf-paket.test.ts). */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { Kirinti, NesneBasi, Rozet, SeritKap } from "../../../../components/sayfa/Sayfa";
import { Serit } from "../../../../components/serit/Serit";
import { TusBaglanti } from "../../../../components/tus/Tus";
import { modulBul } from "../../../../modules/moduller";
import { PLAN_DURUM, tarihNo } from "../../../../modules/planlar/sema";
import { planBelgeleri, planIci } from "../../../../modules/planlar/server/plan-ici";
import { planAcabilir } from "../../../../modules/planlar/server/planlar";
import { PlanIciEkrani } from "../../../../modules/planlar/ui/PlanIciEkrani";
import { PlanSilTusu } from "../../../../modules/planlar/ui/PlanSilTusu";
import { sayChatPaneli } from "../../../../modules/say-chat/server/kayitlar";
import { SayChat } from "../../../../modules/say-chat/ui/SayChat";
import { depo } from "../../../../server/dosya/depo";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("planlar")!;
export const metadata: Metadata = { title: "Plan" };
export const maxDuration = 60;

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const [v, chat, belgeler] = await oturumIslemi(o, async (db) => [await planIci(db, o, id), await sayChatPaneli(db, o, id), await planBelgeleri(db, o, id, depo())] as const);
  if (!v) notFound();
  const p = v.kart;
  const [durumAd, rozet] = PLAN_DURUM[v.durum];
  const acik = v.durum === "bekliyor" || v.durum === "kabul" || v.durum === "denetimde";
  const uyarili = acik ? p.ekip.filter((e) => e.uyarilar.length || e.cakisma.length) : [];
  return (
    <>
      <Kirinti ogeler={[["Planlar", "/planlar"], [p.no]]} />
      <NesneBasi baslik={v.kunye.firmaAdi} rozet={<Rozet tur={rozet}>{durumAd}</Rozet>} altIkon="map-pin" alt={p.tesis.ad}
        tuslar={<>
          {v.planSil && <PlanSilTusu id={v.kart.id} no={v.kart.no} />}
          {planAcabilir(o) && <TusBaglanti ikon="plus" href="/planlar/ac">Yeni plan aç</TusBaglanti>}
        </>} />
      {acik && (uyarili.length > 0 || p.gecmis || p.sozlesmeUyarisi) && <SeritKap>
        {p.gecmis && v.durum === "bekliyor" && <Serit tur="uyari" ikon="triangle-alert">Plan günü geçmiş bir tarih: {tarihNo(p.baslangic)}.</Serit>}
        {p.sozlesmeUyarisi && <Serit tur="uyari" ikon="triangle-alert">{p.sozlesmeUyarisi}</Serit>}
        {uyarili.map((e) => (
          <Serit key={e.personelId} tur="uyari" ikon="triangle-alert">
            <b>{e.ad}</b> — uyarı: {[...e.uyarilar, ...e.cakisma.map((c) => `aynı günlerde ${c.no} planında · ${tarihNo(c.baslangic)}`)].join(" · ")}.
          </Serit>
        ))}
      </SeritKap>}
      <PlanIciEkrani v={v} belgeler={belgeler} />
      {chat && <SayChat veri={chat} />}
    </>
  );
}
