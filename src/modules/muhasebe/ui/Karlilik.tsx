"use client";
/* KÂRLILIK VE GELİR-GİDER (maket muhasebe.html karlilikHtml, KAR_SUTUN, ggCiz / ggToplamCiz — AY_SUTUN, GG_SUTUN; 328). Hesap karlilik.ts'te (saf),
   veri sunucuda; burada yalnız çizim. Dönem seçimi adres parametresi (?ay=YYYY-AA, varsayılan "Toplam"). Bilanço (varlık / borç) firmanın muhasebe
   programında (VARSAYIM, maket). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Yuz, Yuzler } from "../../../components/bilgi/Bilgi";
import { Alan } from "../../../components/form/Form";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, Bolum, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { ayAd, type AyGelirGider, type IsKarlilik } from "../karlilik";
import { para } from "../sema";
import type { GelirGider } from "../server/muhasebe";
import { MuhasebeSekmeleri, yuzde } from "./ortak";
import stil from "./muhasebe.module.css";

interface KarSatiri { ad: string; ayrinti: string; tutar: number; eksi?: boolean; toplam?: boolean }
const KAR_SUTUN: Sutun<KarSatiri>[] = [
  { k: "ad", genislik: "28%", baslik: "Kalem", kart: "ust", sira: 1, hucre: (s) => (s.toplam ? <b>{s.ad}</b> : <Kirp>{s.ad}</Kirp>) },
  { k: "ayrinti", genislik: "50%", baslik: "Ayrıntı", kart: "govde", sira: 2, hucre: (s) => <span className={stil.altSatir}>{s.ayrinti}</span> },
  { k: "tutar", genislik: "22%", baslik: "Tutar", kart: "govde", sira: 3, hucre: (s) => (
    <><KartEtiket>Tutar</KartEtiket><span className={s.toplam && s.tutar < 0 ? `${stil.sayi} ${stil.uyari}` : stil.sayi}>{s.eksi ? "− " : ""}{para(s.tutar)}</span></>
  ) },
];
const KarTablosu = ({ baslik, satirlar }: { baslik: string; satirlar: KarSatiri[] }) => <Liste baslik={baslik} sutunlar={KAR_SUTUN} kayitlar={satirlar} anahtar={(s) => s.ad} />;
const sayiTr = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

/** kâr hücresi (İşler listesi, işlerin kârı): tutar + oran; eksiyse uyarı rengi */
export const KarHucre = ({ kar, oran }: { kar: number; oran: number }) => (
  <span><span className={kar < 0 ? `${stil.sayi} ${stil.uyari}` : stil.sayi}>{para(kar)}</span><AltSatir>{yuzde(oran)}</AltSatir></span>
);

/** iş sayfasının "Kârlılık" bölümü */
export function IsKarliligi({ k }: { k: IsKarlilik }) {
  return (
    <Bolum id="b-is-kar" baslik="Kârlılık" sayac={<><b>{yuzde(k.oran)}</b> kâr</>}>
      {k.tahmini && <SeritKap><Serit tur="bilgi" ikon="history">{ayAd(k.ay)} bordroları yüklenmedi; denetçi maliyeti son bordrodan tahmini.</Serit></SeritKap>}
      <KarTablosu baslik="Kârlılık" satirlar={[
        { ad: "Gelir", ayrinti: `${k.rapor} rapor · raporlanan, KDV hariç`, tutar: k.gelir },
        { ad: "İşe bağlı masraflar", ayrinti: "KDV hariç, reddedilen hariç", tutar: k.dogrudan, eksi: true },
        { ad: "Denetçi maliyeti", ayrinti: k.kisiler.length ? k.kisiler.map((x) => `${x.ad} ${sayiTr(x.gun)} gün × ${para(x.gunluk)}`).join(" · ") : "rapor yok", tutar: k.personel, eksi: true },
        { ad: "Genel gider payı", ayrinti: `${sayiTr(k.gun)} kişi-gün × ${para(k.gunPay)} (sabit giderler, genel masraf, diğer personel)`, tutar: k.genel, eksi: true },
        { ad: "Kâr", ayrinti: `${yuzde(k.oran)} · KDV hariç`, tutar: k.kar, toplam: true },
      ]} />
    </Bolum>
  );
}

type GgIs = GelirGider["isler"][number];
const DONEM_ID = "w-gg-donem";
const GG_SUTUN: Sutun<GgIs>[] = [
  { k: "no", genislik: "18%", baslik: "Proje no", kart: "ust", sira: 1, hucre: (x) => <><Link className={stil.no} href={`/muhasebe/is/${x.id}`}>{x.no}</Link><AltSatir>{tarihNo(x.tarih)}</AltSatir></> },
  { k: "musteri", genislik: "28%", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: (x) => <span><Kirp>{x.musteri}</Kirp><AltSatir><Kirp>{x.tesis}</Kirp></AltSatir></span> },
  { k: "gelir", genislik: "18%", baslik: "Gelir", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Gelir</KartEtiket><span className={stil.sayi}>{para(x.karlilik.gelir)}</span></> },
  { k: "gider", genislik: "18%", baslik: "Gider", kart: "govde", sira: 4, hucre: (x) => <><KartEtiket>Gider</KartEtiket><span className={stil.sayi}>{para(x.karlilik.gider)}</span></> },
  { k: "kar", genislik: "18%", baslik: "Kâr", kart: "govde", sira: 5, hucre: (x) => <><KartEtiket>Kâr</KartEtiket><KarHucre kar={x.kar} oran={x.karOran} /></> },
];
type AySatiri = (AyGelirGider & { ay: string; toplam?: false }) | { ay: "toplam"; toplam: true; isler: string[]; gelir: number; gider: number; kar: number };
const tutarHucre = (ad: string, t: number, kar = false) => <><KartEtiket>{ad}</KartEtiket><span className={kar && t < 0 ? `${stil.sayi} ${stil.uyari}` : stil.sayi}>{para(t)}</span></>;

export function GelirGiderGorunumu({ v }: { v: GelirGider }) {
  const router = useRouter();
  const d = v.donem, toplam = v.secili === "toplam", n = d.ay;
  const tek = !toplam ? d.aylar[0] : null;
  const AY_SUTUN: Sutun<AySatiri>[] = [
    { k: "no", genislik: "28%", baslik: "Dönem", kart: "ust", sira: 1, hucre: (x) => x.toplam ? <b>Toplam</b>
      : <><Link className={stil.no} href={`/muhasebe/gelir-gider?ay=${x.ay}`}>{ayAd(x.ay)}</Link>{!x.am.bordroVar && <AltSatir>maaş tahmini</AltSatir>}</> },
    { k: "is", genislik: "12%", baslik: "İş", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>İş</KartEtiket><span className={stil.sayi}>{x.isler.length}</span></> },
    { k: "gelir", genislik: "20%", baslik: "Gelir", kart: "govde", sira: 3, hucre: (x) => tutarHucre("Gelir", x.gelir) },
    { k: "gider", genislik: "20%", baslik: "Gider", kart: "govde", sira: 4, hucre: (x) => tutarHucre("Gider", x.gider) },
    { k: "kar", genislik: "20%", baslik: "Kâr", kart: "govde", sira: 5, hucre: (x) => tutarHucre("Kâr", x.kar, true) },
  ];
  const maas = tek ? tek.am.maasDenetci + tek.am.maasDiger : d.maas;
  const satirlar: KarSatiri[] = [
    { ad: "Gelir", ayrinti: `${d.isler.length} iş · raporlanan, KDV hariç`, tutar: d.gelir },
    { ad: "Maaşlar", ayrinti: tek ? `${tek.am.kisi} kişi · bordro, işverene maliyet${tek.am.bordroVar ? "" : " · tahmini"}`
      : `${n} ay · bordro, işverene maliyet${d.tahmini ? ` · ${d.tahmini} ay tahmini` : ""}`, tutar: maas, eksi: true },
    { ad: "İşe bağlı masraflar", ayrinti: "KDV hariç", tutar: d.masraf, eksi: true },
    { ad: "Genel masraflar", ayrinti: "işe bağlı olmayan, KDV hariç", tutar: d.genel, eksi: true },
    ...v.sabit.map((x) => ({ ad: x.ad, ayrinti: toplam ? `sabit gider · ${n} ay × ${para(x.aylik)}${x.not ? ` · ${x.not}` : ""}` : `sabit gider${x.not ? ` · ${x.not}` : ""}`,
      tutar: x.aylik * n, eksi: true })),
    { ad: "Kâr", ayrinti: d.oran === null ? "gelir yok" : yuzde(d.oran), tutar: d.kar, toplam: true },
  ];
  const aylar: AySatiri[] = [...d.aylar].reverse();
  aylar.push({ ay: "toplam", toplam: true, isler: d.isler, gelir: d.gelir, gider: d.gider, kar: d.kar });
  const bas = toplam ? <><b>Toplam</b> · {n ? `${ayAd(v.aylar[0])} – ${ayAd(v.aylar[n - 1])}` : ""}</> : <b>{ayAd(v.secili)}</b>;
  return (
    <>
      <SayfaBasi baslik="Muhasebe" sayac={<span className={stil.ozet}>{bas}</span>} />
      <MuhasebeSekmeleri secili="/muhasebe/gelir-gider" />
      <div className={stil.donem}>
        <Alan id={DONEM_ID} etiket="Dönem">
          <SecimAlani id={DONEM_ID} ad="Dönem" deger={v.secili} secenekler={[["toplam", "Toplam"], ...v.secenekler.map((a) => [a, ayAd(a)] as const)]}
            degistir={(x) => router.push(x === "toplam" ? "/muhasebe/gelir-gider" : `/muhasebe/gelir-gider?ay=${x}`)} />
        </Alan>
      </div>
      {(toplam ? d.tahmini > 0 : !!tek && !tek.am.bordroVar) && <SeritKap><Serit tur="bilgi" ikon="history">
        {toplam ? `${d.tahmini} ayın bordroları yüklenmedi; o ayların maaşları son bordrodan tahmini.` : `${ayAd(v.secili)} bordroları yüklenmedi; maaşlar son bordrodan tahmini.`}
      </Serit></SeritKap>}
      <Yuzler>
        <Yuz ikon="file-text" ad={toplam ? "Toplam gelir" : "Gelir"} sayi={para(d.gelir)} not={`KDV hariç · ${d.isler.length} iş`} />
        <Yuz ikon="receipt" ad={toplam ? "Toplam gider" : "Gider"} sayi={para(d.gider)} not={toplam ? `${n} ay · maaş, masraf, sabit` : "maaş, masraf, sabit"} />
        <Yuz ikon="chart-column" ad={toplam ? "Toplam kâr" : "Kâr"} sayi={para(d.kar)} not={d.oran === null ? "gelir yok" : yuzde(d.oran)} uyari={d.kar < 0} />
      </Yuzler>
      <Bolum id="b-gg" baslik={toplam ? "Gelir ve giderler · toplam" : "Gelir ve giderler"}>
        <KarTablosu baslik={toplam ? "Gelir ve giderler, toplam" : "Gelir ve giderler"} satirlar={satirlar} />
      </Bolum>
      {toplam
        ? <Bolum id="b-gg-ay" baslik="Aylara göre" sayac={<><b>{n}</b> ay</>}>
            <Liste baslik="Aylara göre gelir ve gider" sutunlar={AY_SUTUN} kayitlar={aylar} anahtar={(x) => x.ay} />
          </Bolum>
        : <Bolum id="b-gg-is" baslik="İşlerin kârı" sayac={<><b>{v.isler.length}</b> iş</>}>
            {v.isler.length ? <Liste baslik="İşlerin kârı" sutunlar={GG_SUTUN} kayitlar={v.isler} anahtar={(x) => x.id} href={(x) => `/muhasebe/is/${x.id}`} />
              : <p className={stil.ozet}>Bu ay denetlenen iş yok.</p>}
          </Bolum>}
    </>
  );
}
