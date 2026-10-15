"use client";
/* PLANLAR LİSTESİ (referans ekran; maket planlarim.html #/ — 2. tur sütunları, 2026-09-26 "Görüntüle", 2026-09-28 süzgeç): Proje no · Proje adı ·
   Müşteri · Adres · Denetçi · Başlangıç · Durum · Görüntüle. Süzgeç: proje adı ve proje no ayrı kutular; seçiciler Durum, Tarih, Müşteri, Branş;
   sıralama sütun başlığından (kartta "Sıralama"); varsayılan en yeni tarih üstte, aynı günde en son açılan üstte. "Plan aç" yalnız yetkisi olana.
   566 (09-B3): süzgeç, sıralama ve sayfa SUNUCUDA (server/liste.ts planSayfasi — aynı anahtarlar); ekrana yalnız sayfanın 20 satırı ve sayılar. */
import Link from "next/link";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe } from "../../../components/liste/SuzgecliListe";
import { useSunucuSuzgec } from "../../../components/liste/SunucuSuzgec";
import type { Secenek, SunucuListe, SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { TusBaglanti } from "../../../components/tus/Tus";
import { PLAN_DURUM, tarihNo, type PlanDurumu } from "../sema";
import type { PlanSatir } from "../server/plan-ici";
import { planSayfasiEylemi } from "./eylemler";
import stil from "./planlar.module.css";

const adres = (p: PlanSatir) => [p.adres, [p.ilce, p.il].filter(Boolean).join(" / ")].filter(Boolean).join(", ");
const SIRA_AD: Record<string, string> = { no: "Proje no", ad: "Proje adı", musteri: "Müşteri", adres: "Adres", ekip: "Denetçi", baslangic: "Başlangıç", durum: "Durum" };
function siraEtiket(v: string) {
  if (v === "varsayilan") return "En yeni tarih önce";
  const [s, y] = v.split("-"), artan = y === "artan";
  const yon = s === "baslangic" ? (artan ? "yakın → uzak" : "uzak → yakın") : s === "no" ? (artan ? "küçükten büyüğe" : "büyükten küçüğe")
    : s === "durum" ? (artan ? "akış sırası" : "ters akış") : artan ? "A → Z" : "Z → A";
  return `${SIRA_AD[s] ?? s}: ${yon}`;
}

/* süzgeç tanımı: anahtarlar sunucudakiyle aynı (server/liste.ts planKaynagi); süzme, sıralama ve tarih pencereleri SUNUCUDA — burada yalnız ekranın
   çizimi (ad, seçenek; müşteri seçenekleri sunucudan). Sıralanabilir sütunlar: siraAnahtari'nın anahtarları (değerleri sunucuda). */
const hep = () => true;
const sifir = () => 0;
function tanim(sec: Record<string, Secenek[]>): SuzgecTanimi<PlanSatir> {
  return {
    ad: "Planlarda ara", ipucu: "Proje, müşteri, il", birim: "plan", sayfa: 20, imkansiz: "Bir plan aynı anda iki durumda olamaz",
    metin: () => "",
    alanlar: [
      { k: "ad", ad: "Proje adı", ipucu: "ör. fabrika", metin: () => "" },
      { k: "no", ad: "Proje no", ipucu: "ör. P-0926-03", metin: () => "" },
    ],
    cipler: [],
    seciciler: [
      { k: "durum", ad: "Durum", secenek: () => [["tumu", "Tümü"], ...(Object.keys(PLAN_DURUM) as PlanDurumu[]).map((k) => [k, PLAN_DURUM[k][0]] as const)], gecer: hep },
      { k: "tarih", ad: "Tarih", secenek: () => [["tumu", "Tümü"], ["bugun", "Bugün"], ["hafta", "Bu hafta"], ["yedi", "Önümüzdeki 7 gün"]], gecer: hep },
      { k: "musteri", ad: "Müşteri", secenek: () => [["tumu", "Tümü"], ...(sec.musteri ?? [])], gecer: hep },
      { k: "brans", ad: "Branş", secenek: () => [["tumu", "Tümü"], ["m", "Mekanik"], ["e", "Elektrik"]], gecer: hep },
      { k: "sira", ad: "Sıralama", siralama: true, secenek: () => ["varsayilan", "baslangic-artan", "baslangic-azalan", "musteri-artan", "no-artan"].map((x) => [x, siraEtiket(x)] as const),
        gecer: hep },
    ],
    siraAnahtari: { no: sifir, ad: sifir, musteri: sifir, adres: sifir, ekip: sifir, baslangic: sifir, durum: sifir },
  };
}

/* kartta (telefon) müşteri adı en üstte ve kalın, proje adı altında normal (reisim 2026-09-28, 2026-09-29) */
const SUTUNLAR: Sutun<PlanSatir>[] = [
  { k: "no", genislik: "11.25%", baslik: "Proje no", kart: "ust", sira: 1, hucre: (p) => <Link className={stil.no} href={`/planlar/${p.id}`}>{p.no}</Link> },
  { k: "ad", genislik: "12.5%", baslik: "Proje adı", kart: "govde", sira: 3, hucre: (p) => <Kirp>{p.ad}</Kirp> },
  { k: "musteri", genislik: "12.5%", baslik: "Müşteri", kart: "govde", sira: 2, hucre: (p) => (
    <span className={stil.hucreSatir}><Ikon ad="building-2" kucuk /><Kirp baslik={p.musteri}><b>{p.musteri}</b></Kirp></span>
  ) },
  { k: "adres", genislik: "12.75%", baslik: "Adres", kart: "govde", sira: 5, hucre: (p) => (
    <span className={stil.hucreSatir}><Ikon ad="map-pin" kucuk /><span className={stil.esnek}><Kirp baslik={adres(p)}>{p.adres ?? "—"}</Kirp>
      {(p.il || p.ilce) && <AltSatir>{[p.ilce, p.il].filter(Boolean).join(" / ")}</AltSatir>}</span></span>
  ) },
  { k: "ekip", genislik: "10.25%", baslik: "Denetçi", kart: "govde", sira: 6, hucre: (p) => (
    <span className={stil.hucreSatir} title={p.ekip.join(" · ")}><Ikon ad="users" kucuk />
      <span className={stil.esnek}>{p.ekip.slice(0, 2).join(", ")}{p.ekip.length > 2 && <span className={stil.altInline}> +{p.ekip.length - 2}</span>}</span></span>
  ) },
  { k: "baslangic", genislik: "12%", baslik: "Başlangıç", kart: "govde", sira: 4, hucre: (p) => (
    <><KartEtiket>Başlangıç</KartEtiket><span className={stil.sayi}>{tarihNo(p.baslangic)}</span>{p.bitis !== p.baslangic && <AltSatir>– {tarihNo(p.bitis)}</AltSatir>}</>
  ) },
  { k: "durum", genislik: "11%", sikisik: "13.5%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (p) => <Rozet tur={PLAN_DURUM[p.durum][1]}>{PLAN_DURUM[p.durum][0]}</Rozet> },
  { k: "eylem", genislik: "17.75%", sikisik: "15.25%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (p) => (
    <div className={stil.eylemTuslar}><TusBaglanti ikon="eye" href={`/planlar/${p.id}`}>Görüntüle</TusBaglanti></div>
  ) },
];

export function PlanListesi({ ilk, acabilir }: { ilk: SunucuListe<PlanSatir>; acabilir: boolean }) {
  const s = useSunucuSuzgec(tanim, ilk, planSayfasiEylemi);
  return (
    <>
      <SayfaBasi baslik="Planlar" sayac={<Sayac s={s} />} tuslar={acabilir && <TusBaglanti tur="birincil" ikon="plus" href="/planlar/ac">Plan aç</TusBaglanti>} />
      <SuzgecliListe s={s} on="l" baslik="Planlar" sutunlar={SUTUNLAR} anahtar={(p) => p.id} href={(p) => `/planlar/${p.id}`} siralanir
        bosVeri={acabilir ? { ikon: "inbox", baslik: "Plan yok", metin: "“Plan aç” ile ilk plan açılır; denetçinin Planlar ekranına düşer." }
          : { ikon: "inbox", baslik: "Atanmış plan yok", metin: "Planlama ekibi plan açınca burada görünür." }} />
    </>
  );
}
