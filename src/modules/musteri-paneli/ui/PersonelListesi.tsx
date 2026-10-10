"use client";
/* MUAYENE PERSONELİ (323; maket musteri.html #/personel — personelCiz; P3 2026-10-01 reisim: "o müşteriye giden muayene personelinin firmanın
   izin verdiği belgelerini görür (ekipnet belgesi isg belgeleri vs)"): müşterinin tesislerine giden kişiler (son imzalı raporu yazan ya da açık
   planın ekibinde) — ad, meslek; son gidiş ve tesisler; firmanın müşteriye açtığı belgeler (geçerlilik; "Aç" oturumlu tek uçtan). Görme
   veritabanında (müşteri rolü personel tablolarına dokunmaz; iki işlev yalnız gerekeni döndürür — 0035). 481 (site taraması, kalıp 14–15):
   süzgeç — arama · süresi geçen belgesi olan çipi; boşken de görünür. */
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import type { PanelPersoneli, PanelPersonelSatiri } from "../server/panel";
import { gunFarki, PanelSekmeleri } from "./ortak";
import stil from "./panel.module.css";

const SUTUNLAR: Sutun<PanelPersonelSatiri>[] = [
  { k: "kisi", genislik: "26%", baslik: "Muayene personeli", kart: "ust", sira: 1, hucre: (x) => <><b>{x.ad}</b><AltSatir>{x.meslek}</AltSatir></> },
  { k: "son", genislik: "24%", baslik: "Son gidiş", kart: "govde", sira: 2, hucre: (x) => (
    <><KartEtiket>Son gidiş</KartEtiket><span><span className={stil.sayi}>{x.son ? tarihNo(x.son) : "—"}</span><AltSatir><Kirp>{x.tesisAdlari.join(", ")}</Kirp></AltSatir></span></>
  ) },
  { k: "belge", genislik: "50%", baslik: "Belgeler", kart: "govde", sira: 3, hucre: (x) => (
    <><KartEtiket>Belgeler</KartEtiket>{x.belgeler.length
      ? <ul className={stil.belgeler}>{x.belgeler.map((b) => {
          const k = b.gecerli ? gunFarki(b.gecerli) : null;
          return (
            <li key={b.dosya}>
              <span>{b.ad}{b.gecerli
                ? <AltSatir uyari={k !== null && k < 0}>{k !== null && k < 0 ? `süresi geçti: ${tarihNo(b.gecerli)}` : `geçerli: ${tarihNo(b.gecerli)}`}</AltSatir>
                : b.yuklendi && b.tarih && <AltSatir>{`yüklendi: ${tarihNo(b.tarih)}`}</AltSatir>}</span>
              <DosyaAcTusu dosyaId={b.dosya} ikon="eye" etiket={`${x.ad} · ${b.ad} aç`}>Aç</DosyaAcTusu>
            </li>
          );
        })}</ul>
      : <span className={stil.sonucYok}>Paylaşılan belge yok</span>}</>
  ) },
];

const TANIM: SuzgecTanimi<PanelPersonelSatiri> = {
  ad: "Personelde ara", ipucu: "Ad, meslek, tesis", birim: "kişi", sayfa: 20, imkansiz: "",
  metin: (x) => `${x.ad} ${x.meslek} ${x.tesisAdlari.join(" ")}`,
  cipler: [{ k: "gecti", ad: "Süresi geçen belgesi var", test: (x) => x.belgeler.some((b) => !!b.gecerli && gunFarki(b.gecerli) < 0) }],
  seciciler: [],
};

export function PanelPersonelListesi({ v }: { v: PanelPersoneli }) {
  const s = useSuzgec(TANIM, v.kisiler);
  return (
    <>
      <SayfaBasi baslik="Muayene personeli" sayac={<span className={stil.sayac} role="status"><b>{v.kisiler.length}</b> kişi</span>} />
      <p className={stil.alt}>{v.musteri?.unvan ?? "—"}</p>
      <PanelSekmeleri acikUygunsuz={v.acikUygunsuz} secili="/portal/personel" />
      <SuzgecliListe s={s} on="pps" baslik="Muayene personeli" sutunlar={SUTUNLAR} anahtar={(x) => x.id}
        bosVeri={{ ikon: "users", baslik: "Henüz personel yok", metin: "Tesislerinize kontrole gelen muayene personeli burada görünür." }} />
    </>
  );
}
