"use client";
/* PLANLANAN KONTROLLER (321; maket musteri.html #/plan — planCiz; karar 81 "müşteri panelinde planlanan kontrol"): görebildiği her tesis — açık
   planın tarihi (yoksa "Yok"; aynı tesiste başka açık plan da varsa sayısı), sonraki kontrol (tesisteki ekipmanların son raporlarından en yakını;
   60 gün içindeyse uyarı) ve planın durumu. Salt görüntü; planı firma açar. Görme sunucuda (müşteri rolü — planın yalnız tarih ve durum
   sütunları, 0032). 481 (site taraması, kalıp 14–15): süzgeç — arama · Planlı / Planı yok / 60 gün içinde çipleri; boşken de görünür. */
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, DegerYok, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { PLAN_DURUM } from "../../planlar/sema";
import type { PanelPlanlari, PanelPlanSatiri } from "../server/panel";
import { gunFarki, PanelSekmeleri } from "./ortak";
import stil from "./panel.module.css";

const YAKIN = 60;
const SUTUNLAR: Sutun<PanelPlanSatiri>[] = [
  { k: "tesis", genislik: "34%", baslik: "Tesis", kart: "ust", sira: 1, hucre: (x) => <><Kirp>{x.tesis}</Kirp>{x.yer && <AltSatir>{x.yer}</AltSatir>}</> },
  { k: "plan", genislik: "26%", baslik: "Planlanan kontrol", kart: "govde", sira: 2, hucre: (x) => (
    <><KartEtiket>Planlanan kontrol</KartEtiket>{x.plan
      ? <span className={stil.sayi}>{tarihNo(x.plan.baslangic)}{x.plan.bitis !== x.plan.baslangic && ` – ${tarihNo(x.plan.bitis)}`}{x.digerPlan > 0 && <AltSatir>{`+${x.digerPlan} plan daha`}</AltSatir>}</span>
      : <DegerYok>Yok</DegerYok>}</>
  ) },
  { k: "sonraki", genislik: "22%", baslik: "Sonraki kontrol", kart: "govde", sira: 3, hucre: (x) => {
    const k = x.sonraki ? gunFarki(x.sonraki) : null;
    return <><KartEtiket>Sonraki kontrol</KartEtiket><span>{x.sonraki ? tarihNo(x.sonraki) : "—"}{k !== null && k <= YAKIN && <AltSatir uyari>{k < 0 ? `${-k} gün geçti` : `${k} gün`}</AltSatir>}</span></>;
  } },
  { k: "durum", genislik: "18%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => x.plan
    ? <Rozet tur={PLAN_DURUM[x.plan.durum][1]}>{PLAN_DURUM[x.plan.durum][0]}</Rozet> : <DegerYok /> },
];

const TANIM: SuzgecTanimi<PanelPlanSatiri> = {
  ad: "Tesislerde ara", ipucu: "Tesis, yer", birim: "tesis", sayfa: 20, imkansiz: "Bir tesis aynı anda planlı ve plansız olamaz",
  metin: (x) => `${x.tesis} ${x.yer ?? ""}`,
  cipler: [
    { k: "planli", ad: "Planlı", grup: "plan", test: (x) => !!x.plan },
    { k: "plansiz", ad: "Planı yok", grup: "plan", test: (x) => !x.plan },
    { k: "yakin", ad: `Sonraki kontrol ${YAKIN} gün içinde`, test: (x) => !!x.sonraki && gunFarki(x.sonraki) <= YAKIN },
  ],
  seciciler: [],
};

export function PanelPlanListesi({ v }: { v: PanelPlanlari }) {
  const planli = v.satirlar.filter((x) => x.plan).length;
  const s = useSuzgec(TANIM, v.satirlar);
  return (
    <>
      <SayfaBasi baslik="Planlanan kontroller" sayac={<span className={stil.sayac} role="status"><b>{planli}</b> planlı</span>} />
      <p className={stil.alt}>{v.musteri?.unvan ?? "—"}</p>
      <PanelSekmeleri acikUygunsuz={v.acikUygunsuz} secili="/portal/plan" />
      <SuzgecliListe s={s} on="ppl" baslik="Planlanan kontroller" sutunlar={SUTUNLAR} anahtar={(x) => x.tesisId}
        bosVeri={{ ikon: "calendar", baslik: "Planlanan kontrol yok", metin: "Tesisleriniz eklendiğinde planlanan kontroller burada görünür." }} />
    </>
  );
}
