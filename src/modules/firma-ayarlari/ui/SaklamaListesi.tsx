"use client";
/* FİRMA AYARLARI › SAKLAMA SÜRESİ DOLACAK RAPORLAR (387; KOD-GECIS ENGEL 11 "30 gün önce firma yöneticisine liste"; Uyarılar listesinin biçimi):
   süresi 30 gün içinde dolacak imzalı raporlar, en erken dolan üstte — rapor, müşteri / tesis, imza günü, süre dolan gün, kalan; PDF indirilebilir
   (silinmeden önce). Süre dolunca PDF'ler ilk gece işinde silinir; rapor kaydı kalır. Yalnız ekranda (anayasa 1.3). */
import Link from "next/link";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Kirinti, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import type { SaklamaSatiri } from "../../raporlar/server/ayar-baglanti";
import type { SaklamaSayfasi } from "../server/saklama";
import stil from "./saklama.module.css";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const kalan = (iso: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${GUN.format(new Date())}T00:00:00Z`)) / 864e5);

const TANIM: SuzgecTanimi<SaklamaSatiri> = {
  ad: "Raporlarda ara", ipucu: "Rapor no, müşteri, tesis", birim: "rapor", sayfa: 20, imkansiz: "Bir raporun süresi ya dolmuştur ya dolmamıştır",
  metin: (x) => [x.no, x.musteri, x.tesis].join(" "),
  cipler: [{ k: "gecti", ad: "Süresi dolmuş", test: (x) => x.gecti }],
  seciciler: [],
};
const SUTUN: Sutun<SaklamaSatiri>[] = [
  { k: "no", genislik: "24%", baslik: "Rapor", kart: "ust", sira: 1, hucre: (x) => (
    <span><Link className={stil.ad} href={`/raporlar/${x.raporId}`}><span className={stil.sayi}>{x.no}</span></Link><AltSatir>imza {tarihNo(x.imzaGunu)}</AltSatir></span>
  ) },
  { k: "musteri", genislik: "28%", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: (x) => (
    <><KartEtiket>Müşteri</KartEtiket><span><Kirp>{x.musteri}</Kirp><AltSatir><Kirp>{x.tesis}</Kirp></AltSatir></span></>
  ) },
  { k: "bitis", genislik: "20%", baslik: "Süre doluyor", kart: "govde", sira: 3, hucre: (x) => {
    const k = kalan(x.bitisGunu);
    return (
      <><KartEtiket>Süre doluyor</KartEtiket><span><span className={stil.sayi}>{tarihNo(x.bitisGunu)}</span>
        <AltSatir><span className={x.gecti ? stil.hata : stil.uyari}>{x.gecti ? "ilk gece işinde silinecek" : k <= 0 ? "bugün" : `${k} gün kaldı`}</span></AltSatir></span></>
    );
  } },
  { k: "durum", genislik: "14%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <Rozet tur={x.gecti ? "red" : "bekliyor"}>{x.gecti ? "Süresi doldu" : "Yaklaşıyor"}</Rozet> },
  { k: "pdf", genislik: "14%", baslik: "PDF", kart: "govde", sira: 4, hucre: (x) => (
    <DosyaAcTusu dosyaId={x.dosya} ikon="download" indir etiket={`${x.no} imzalı PDF indir`}>İndir</DosyaAcTusu>
  ) },
];

export function SaklamaListesi({ v }: { v: SaklamaSayfasi }) {
  const s = useSuzgec(TANIM, v.liste);
  return (
    <>
      <Kirinti ogeler={[["Firma ayarları", "/firma-ayarlari"], ["Saklama süresi dolacak raporlar"]]} />
      <SayfaBasi baslik="Saklama süresi dolacak raporlar" sayac={<Sayac s={s} />} />
      <SeritKap>
        <Serit tur="bilgi" ikon="archive">
          Saklama süresi {v.yil} yıl. Süresi dolan imzalı rapor PDF&apos;leri ilk gece işinde firmanızın deposundan silinir; rapor kayıtları kalır.
          Süresi {v.onceGun} gün içinde dolacaklar burada. Saklamak istediklerinizi önceden indirin ya da <Link href="/firma-ayarlari#ay-b-saklama">süreyi uzatın</Link>.
        </Serit>
        {v.fazla && <Serit tur="uyari" ikon="triangle-alert">Listede en erken dolan {v.liste.length.toLocaleString("tr-TR")} rapor var; ötekiler sırası gelince görünür.</Serit>}
      </SeritKap>
      <SuzgecliListe s={s} on="sk" baslik="Saklama süresi dolacak raporlar" sutunlar={SUTUN} anahtar={(x) => x.surumId}
        bosVeri={{ ikon: "circle-check", baslik: "Silinecek rapor yok", metin: `Saklama süresi ${v.onceGun} gün içinde dolacak imzalı rapor yok.` }} />
    </>
  );
}
