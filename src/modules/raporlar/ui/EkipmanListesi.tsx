"use client";
/* RAPORLAR › EKİPMANLAR SEKMESİ (2026-11-16; reisim: "teknik yönetici tarafında gözüksün, o silebilsin sadece", "herkesinkini raporlar ekranında bir
   sekme de görsün"). Teknik yönetici firmanın bütün ekipmanlarını (kendi branşı) görür; hiç kullanılmamış olanın satırında Sil. Süzgeç ve sayfa
   SUNUCUDA (server/ekipmanlar.ts ekipmanSayfasi — aynı anahtarlar); ekrana yalnız sayfanın 20 satırı. */
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe } from "../../../components/liste/SuzgecliListe";
import { useSunucuSuzgec } from "../../../components/liste/SunucuSuzgec";
import type { Secenek, SunucuListe, SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi, Sekmeler } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { kullanimMetni } from "../../../components/sil/metin";
import { SilTusu } from "../../../components/sil/SilTusu";
import type { EkipmanListeSatiri } from "../server/ekipmanlar";
import { ekipmanKesinSilEylemi, ekipmanSayfasiEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

/** Raporlar ekranının sekmeleri (yalnız teknik yöneticiye çizilir) */
export const RAPOR_SEKMELERI = [["Raporlar", "/raporlar"], ["Ekipmanlar", "/raporlar/ekipmanlar"]] as const;

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const hep = () => true;
const SIRALAR: Secenek[] = [
  ["varsayilan", "En son eklenen üstte"], ["olustu-artan", "Eklenme · eskiden yeniye"],
  ["kod-artan", "Kod · A–Z"], ["kod-azalan", "Kod · Z–A"], ["tur-artan", "Tür · A–Z"], ["tur-azalan", "Tür · Z–A"],
  ["tesis-artan", "Müşteri / tesis · A–Z"], ["tesis-azalan", "Müşteri / tesis · Z–A"], ["ekleyen-artan", "Ekleyen · A–Z"], ["ekleyen-azalan", "Ekleyen · Z–A"],
];
/* süzgeç tanımı: anahtarlar sunucudakiyle aynı (ekipmanKaynagi); test / gecer / metin SUNUCUDA uygulanır — burada yalnız çizim için */
function tanim(sec: Record<string, Secenek[]>): SuzgecTanimi<EkipmanListeSatiri> {
  const tumu: Secenek = ["tumu", "Tümü"];
  return {
    ad: "Ekipmanlarda ara", ipucu: "Hepsinde ara", birim: "ekipman", sayfa: 20, imkansiz: "", izgara: true,
    metin: () => "",
    alanlar: [
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. HT-10", metin: () => "" },
      { k: "tesis", ad: "Tesis", ipucu: "ör. fabrika", metin: () => "" },
    ],
    cipler: [],
    seciciler: [
      { k: "tur", ad: "Ekipman türü", secenek: () => [tumu, ...(sec.tur ?? [])], gecer: hep },
      { k: "musteri", ad: "Müşteri", secenek: () => [tumu, ...(sec.musteri ?? [])], gecer: hep },
      { k: "ekleyen", ad: "Ekleyen", secenek: () => [tumu, ...(sec.ekleyen ?? [])], gecer: hep },
      { k: "sira", ad: "Sıralama", siralama: true, secenek: () => SIRALAR, gecer: hep },
    ],
  };
}

export function EkipmanListesi({ ilk }: { ilk: SunucuListe<EkipmanListeSatiri> }) {
  const s = useSunucuSuzgec(tanim, ilk, ekipmanSayfasiEylemi);
  const sutunlar: Sutun<EkipmanListeSatiri>[] = [
    { k: "kod", genislik: "13%", baslik: "Kod", kart: "ust", sira: 1, hucre: (e) => <span className={stil.kod}>{e.kod}</span> },
    { k: "tur", genislik: "19%", baslik: "Tür", kart: "govde", sira: 2, hucre: (e) => <><KartEtiket>Tür</KartEtiket><Kirp>{e.tur}</Kirp></> },
    { k: "tesis", genislik: "22%", baslik: "Müşteri / tesis", kart: "govde", sira: 3, hucre: (e) => (
      <span><Kirp>{e.tesis}</Kirp><AltSatir><Kirp>{e.musteri}</Kirp></AltSatir></span>
    ) },
    { k: "konum", genislik: "12%", baslik: "Konum", kart: "govde", sira: 4, siralanmaz: true,
      hucre: (e) => <><KartEtiket>Konum</KartEtiket>{e.konum ? <Kirp>{e.konum}</Kirp> : <span className={stil.bosSatir}>—</span>}</> },
    { k: "ekleyen", genislik: "12%", baslik: "Ekleyen", kart: "govde", sira: 5, hucre: (e) => <><KartEtiket>Ekleyen</KartEtiket><Kirp>{e.ekleyen}</Kirp></> },
    { k: "olustu", genislik: "10%", baslik: "Eklendi", kart: "govde", sira: 6, hucre: (e) => <><KartEtiket>Eklendi</KartEtiket>{tarihNo(GUN.format(new Date(e.olustu)))}</> },
    { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, siralanmaz: true, hucre: (e) => (
      <span>
        <Rozet tur={e.pasif ? "notr" : e.kullanim ? "kabul" : "bekliyor"}>{e.pasif ? "Pasif" : e.kullanim ? "Kullanıldı" : "Kullanılmadı"}</Rozet>
        {e.kullanim && <AltSatir><Kirp>{kullanimMetni(e.kullanim)}</Kirp></AltSatir>}
      </span>
    ) },
    { k: "sil", genislik: "60px", baslik: "Sil", kart: "govde", sira: 7, siralanmaz: true,
      hucre: (e) => (e.kullanim ? null
        : <SilTusu kucuk ikon="trash-2" ad={e.kod} erisimAdi={`${e.kod} · Sil`} baslik="Ekipmanı sil" yanEtki="açık planlardaki satırları da silinir" sil={() => ekipmanKesinSilEylemi(e.id)} />) },
  ];
  return (
    <>
      <SayfaBasi baslik="Raporlar" sayac={<Sayac s={s} />} />
      <Sekmeler ad="Raporlar" ogeler={RAPOR_SEKMELERI} secili="/raporlar/ekipmanlar" />
      <SuzgecliListe s={s} on="e" baslik="Ekipmanlar" sutunlar={sutunlar} anahtar={(e) => e.id} siralanir bosVeri={{ ikon: "package", baslik: "Ekipman yok" }} />
    </>
  );
}
