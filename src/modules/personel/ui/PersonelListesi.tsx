"use client";
/* Personel listesi (maket personel.html #/): süzgeç (kalıp 15), çipler ve / veya, Görünüm seçicisi (Çalışanlar varsayılan), tablo ↔ kart.
   Veri sunucudan, yalnız listenin sütunları (09-B3); süzgeç istemcide (liste firmanın personeli kadar küçük). */
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, DegerYok, Kod, Rozetler, SayfaBasi, Sekmeler } from "../../../components/sayfa/Sayfa";
import type { ReactNode } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { ROL_ADI, ROLLER } from "../../../server/yetki/tanim";
import type { PersonelSatiri } from "../server/personel";
import { bransAd, bransi, DurumRozeti, HESAP_DURUM, meslekAdi, RolRozeti, tarihYaz } from "./ortak";
import stil from "./personel.module.css";

export type ListeSatiri = PersonelSatiri & { eksik: string[] };

const denetci = (p: ListeSatiri) => !!p.hesap?.roller.includes("denetci");

function tanim(kayitlar: readonly ListeSatiri[]): SuzgecTanimi<ListeSatiri> {
  return {
    ad: "Personelde ara", ipucu: "Ad, meslek, EKİPNET", birim: "kişi", imkansiz: "Bir kişinin branşı hem mekanik hem elektrik olamaz",
    metin: (p) => [p.ad, meslekAdi(p), p.ekipnet ?? "", p.eposta ?? ""].join(" "),
    cipler: [
      { k: "inspector", ad: "Denetçi", test: denetci },
      { k: "eksik", ad: "Bilgisi eksik", test: (p) => p.eksik.length > 0 },
      { k: "m", ad: "Mekanik", grup: "brans", test: (p) => bransi(p.meslek) === "m" },
      { k: "e", ad: "Elektrik", grup: "brans", test: (p) => bransi(p.meslek) === "e" },
      { k: "hesapsiz", ad: "Giriş hesabı yok", test: (p) => !p.hesap },
    ],
    seciciler: [
      { k: "rol", ad: "Rol", secenek: () => [["tumu", "Tümü"], ...ROLLER.map((r) => [r, ROL_ADI[r]] as const)], gecer: (p, v) => v === "tumu" || !!p.hesap?.roller.includes(v as never) },
      { k: "meslek", ad: "Meslek", secenek: () => [["tumu", "Tümü"], ...[...new Set(kayitlar.map(meslekAdi))].sort((a, b) => a.localeCompare(b, "tr")).map((m) => [m, m] as const)],
        gecer: (p, v) => v === "tumu" || meslekAdi(p) === v },
      { k: "durum", ad: "Görünüm", bas: "calisan", secenek: () => [["calisan", "Çalışanlar"], ["ayrilan", "Ayrılanlar"], ["hepsi", "Hepsi"]],
        gecer: (p, v) => v === "hepsi" || (v === "calisan" ? p.durum === "etkin" : p.durum === "ayrildi") },
    ],
  };
}

const SUTUNLAR: Sutun<ListeSatiri>[] = [
  { k: "ad", genislik: "19%", baslik: "Ad soyad", kart: "ust", sira: 1, hucre: (p) => <><a className={stil.ad} href={`/personel/${p.id}`}>{p.ad}</a>{p.eposta ? <AltSatir><Kirp>{p.eposta}</Kirp></AltSatir> : <AltSatir>E-posta yok</AltSatir>}</> },
  { k: "meslek", genislik: "20%", baslik: "Meslek", kart: "govde", sira: 2, hucre: (p) => <Kirp>{meslekAdi(p)}</Kirp> },
  { k: "brans", genislik: "10%", baslik: "Branş", kart: "govde", sira: 3, hucre: (p) => { const b = bransi(p.meslek); return b ? <span className={stil.hucreSatir}><Ikon ad={b === "m" ? "cog" : "zap"} kucuk />{bransAd(b)}</span> : <DegerYok />; } },
  { k: "ekipnet", genislik: "12%", baslik: "EKİPNET no", kart: "govde", sira: 4, hucre: (p) => <><KartEtiket>EKİPNET no</KartEtiket>{p.ekipnet ? <Kod>{p.ekipnet}</Kod> : denetci(p) ? <AltSatir uyari>Boş</AltSatir> : <DegerYok />}</> },
  { k: "roller", genislik: "22%", baslik: "Giriş hesabı ve roller", kart: "govde", sira: 5, hucre: (p) => (
    <>
      {p.hesap ? <><Rozetler>{p.hesap.roller.map((r) => <RolRozeti key={r} r={r} />)}</Rozetler>{p.hesap.durum !== "etkin" && <AltSatir>{HESAP_DURUM[p.hesap.durum].ad}</AltSatir>}</> : <DegerYok>Giriş hesabı yok</DegerYok>}
      {p.eksik.length > 0 && <span title={p.eksik.join(" · ")}><AltSatir uyari>Eksik: {p.eksik[0]}{p.eksik.length > 1 ? ` +${p.eksik.length - 1}` : ""}</AltSatir></span>}
    </>
  ) },
  { k: "durum", genislik: "17%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (p) => <><DurumRozeti d={p.durum} />{p.durum === "ayrildi" && <AltSatir>{tarihYaz(p.ayrildi)}</AltSatir>}</> },
];

export function PersonelListesi({ kayitlar, tuslar }: { kayitlar: ListeSatiri[]; tuslar?: ReactNode }) {
  const s = useSuzgec(tanim(kayitlar), kayitlar);
  return (
    <>
      <SayfaBasi baslik="Personel" sayac={<Sayac s={s} />} tuslar={tuslar} />
      <Sekmeler ad="Personel bölümleri" ogeler={[["Personel", "/personel"], ["Rol yetkileri", "/personel/roller"]]} secili="/personel" />
      <SuzgecliListe s={s} on="p" baslik="Personel" sutunlar={SUTUNLAR} anahtar={(p) => p.id} href={(p) => `/personel/${p.id}`}
        bosVeri={{ ikon: "users", baslik: "Personel kaydı yok", metin: "“Personel ekle” ile ilk kişi kaydedilir." }} />
    </>
  );
}
