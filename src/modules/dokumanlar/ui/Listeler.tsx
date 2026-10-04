"use client";
/* DÖKÜMANLAR LİSTELERİ (maket standartlar.html #/ · #/kriterler · #/diger): standartlar (süzgeç: Görünüm güncel / önceki / hepsi), muayene
   kriterleri (koddaki belgeler), diğer dökümanlar (aç · değiştir · kaldır). Yükleme tuşları yalnız "değiştirir" düzeyine; karar sunucuda. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, Kod, Rozet, SayfaBasi, Sekmeler } from "../../../components/sayfa/Sayfa";
import { BosDurum } from "../../../components/bos/BosDurum";
import { Tus } from "../../../components/tus/Tus";
import type { KriterBelgesi } from "../../../tanim/kriterler";
import type { DokumanSatiri, StandartSatiri } from "../server/dokumanlar";
import { dokumanKaldirEylemi, standartKaldirEylemi } from "./eylemler";
import { DOKUMAN_SEKMELERI, tarihYaz } from "./ortak";
import { DokumanPenceresi, StandartPenceresi } from "./Pencereler";
import stil from "./dokumanlar.module.css";

function stdTanim(): SuzgecTanimi<StandartSatiri> {
  return {
    ad: "Standartlarda ara", ipucu: "No, konu, sürüm", birim: "standart", imkansiz: "Bir standart aynı anda iki durumda olamaz",
    metin: (s) => `${s.no} ${s.konu} ${s.surumAdi}`,
    cipler: [],
    seciciler: [{ k: "gorunum", ad: "Görünüm", bas: "guncel", secenek: () => [["guncel", "Güncel sürümler"], ["onceki", "Önceki sürümler"], ["hepsi", "Hepsi"]],
      gecer: (s, v) => v === "hepsi" || (v === "guncel" ? s.guncel : !s.guncel) }],
  };
}

export function StandartListesi({ standartlar, yaz }: { standartlar: StandartSatiri[]; yaz: boolean }) {
  const s = useSuzgec(stdTanim(), standartlar);
  const [acik, setAcik] = useState(false);
  const sutunlar: Sutun<StandartSatiri>[] = [
    { k: "std", genislik: "44%", baslik: "Standart", kart: "ust", sira: 1, hucre: (x) => <span><Link className={stil.no} href={`/dokumanlar/standart/${x.id}`}>{x.no}</Link><AltSatir><Kirp>{x.konu}</Kirp></AltSatir></span> },
    { k: "surum", genislik: "16%", baslik: "Sürüm", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Sürüm</KartEtiket><Kod>{x.surumAdi}</Kod></> },
    { k: "yuklendi", genislik: "22%", baslik: "Yüklendi", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Yüklendi</KartEtiket><span>{tarihYaz(x.tarih)}<AltSatir><Kirp>{x.yukleyen}</Kirp></AltSatir></span></> },
    { k: "durum", genislik: "18%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => x.guncel ? <Rozet tur="tamam">Güncel</Rozet>
      : <span><Rozet tur="notr">Önceki sürüm</Rozet><AltSatir>{tarihYaz(x.bitti)} tarihine kadar</AltSatir></span> },
  ];
  return (
    <>
      <SayfaBasi baslik="Dökümanlar" sayac={<Sayac s={s} />} tuslar={yaz && <Tus ikon="file-plus" onClick={() => setAcik(true)}>Standart yükle</Tus>} />
      <Sekmeler ad="Döküman bölümleri" ogeler={DOKUMAN_SEKMELERI} secili="/dokumanlar" />
      <SuzgecliListe s={s} on="std" baslik="Standartlar" sutunlar={sutunlar} anahtar={(x) => x.id} href={(x) => `/dokumanlar/standart/${x.id}`}
        bosVeri={{ ikon: "book-open", baslik: "Kütüphane boş", metin: "“Standart yükle” ile firmanın standart kopyası (PDF) eklenir; ekipman türlerinde kontrol metodu buradan seçilir." }} />
      {acik && <StandartPenceresi kapat={() => setAcik(false)} guncelListe={standartlar} />}
    </>
  );
}

export function KriterListesi({ belgeler }: { belgeler: readonly KriterBelgesi[] }) {
  const sutunlar: Sutun<KriterBelgesi>[] = [
    { k: "kod", genislik: "46%", baslik: "Belge", kart: "ust", sira: 1, hucre: (x) => <span><Link className={stil.no} href={`/dokumanlar/kriterler/${x.kod}`}>{x.kod}</Link><AltSatir><Kirp>{x.ad}</Kirp></AltSatir></span> },
    { k: "rapor", genislik: "16%", baslik: "Rapor formatı", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Rapor formatı</KartEtiket><Kod>{x.rapor}</Kod></> },
    { k: "madde", genislik: "12%", baslik: "Madde", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Madde</KartEtiket>{x.maddeler.length}</> },
    { k: "yururluk", genislik: "26%", baslik: "Yürürlük", kart: "govde", sira: 4, hucre: (x) => <><KartEtiket>Yürürlük</KartEtiket><span>{tarihYaz(x.yururluk)}<AltSatir>yayım {tarihYaz(x.yayim)}</AltSatir></span></> },
  ];
  return (
    <>
      <SayfaBasi baslik="Dökümanlar" sayac={<><b>{belgeler.length}</b> belge</>} />
      <Sekmeler ad="Döküman bölümleri" ogeler={DOKUMAN_SEKMELERI} secili="/dokumanlar/kriterler" />
      <Liste baslik="Muayene kriterleri" sutunlar={sutunlar} kayitlar={belgeler} anahtar={(x) => x.kod} href={(x) => `/dokumanlar/kriterler/${x.kod}`} />
    </>
  );
}

function DokumanTuslari({ d, yaz }: { d: DokumanSatiri; yaz: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [acik, setAcik] = useState(false);
  return (
    <span className={stil.tuslar}>
      <DosyaAcTusu dosyaId={d.dosyaId}>Aç</DosyaAcTusu>
      {yaz && <Tus tur="ikincil" ikon="upload" onClick={() => setAcik(true)}>Değiştir</Tus>}
      {yaz && <Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={async () => {
        if (!(await onayla({ baslik: "Dökümanı kaldır", metin: `${d.ad} listeden kalkar.`, tus: "Kaldır", tehlike: true }))) return;
        baslat(async () => { const r = await dokumanKaldirEylemi(d.id, d.surum); bildir(r.tamam ? `${d.ad} kaldırıldı.` : r.genel ?? "Kaldırılamadı."); router.refresh(); });
      }}>Kaldır</Tus>}
      {acik && <DokumanPenceresi kapat={() => setAcik(false)} dokuman={d} />}
    </span>
  );
}

export function DokumanListesi({ dokumanlar, yaz }: { dokumanlar: DokumanSatiri[]; yaz: boolean }) {
  const [acik, setAcik] = useState(false);
  const sutunlar: Sutun<DokumanSatiri>[] = [
    { k: "ad", genislik: "34%", baslik: "Döküman", kart: "ust", sira: 1, hucre: (d) => <span><b>{d.ad}</b>{d.kod && <AltSatir>{d.kod}</AltSatir>}</span> },
    { k: "tur", genislik: "16%", baslik: "Tür", kart: "govde", sira: 2, hucre: (d) => <><KartEtiket>Tür</KartEtiket>{d.tur}</> },
    { k: "rev", genislik: "12%", baslik: "Revizyon", kart: "govde", sira: 3, hucre: (d) => <><KartEtiket>Revizyon</KartEtiket>{d.rev ?? "—"}</> },
    { k: "tarih", genislik: "12%", baslik: "Yayım", kart: "govde", sira: 4, hucre: (d) => <><KartEtiket>Yayım</KartEtiket>{tarihYaz(d.tarih)}</> },
    { k: "eylem", genislik: "26%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (d) => <DokumanTuslari d={d} yaz={yaz} /> },
  ];
  return (
    <>
      <SayfaBasi baslik="Dökümanlar" sayac={<><b>{dokumanlar.length}</b> döküman</>} tuslar={yaz && <Tus ikon="file-plus" onClick={() => setAcik(true)}>Döküman yükle</Tus>} />
      <Sekmeler ad="Döküman bölümleri" ogeler={DOKUMAN_SEKMELERI} secili="/dokumanlar/diger" />
      {dokumanlar.length ? <Liste baslik="Diğer dökümanlar" sutunlar={sutunlar} kayitlar={dokumanlar} anahtar={(d) => d.id} />
        : <BosDurum ikon="file-text" baslik="Döküman yok" metin="Kalite el kitabı, prosedür, talimat gibi firma belgeleri burada tutulur." />}
      {acik && <DokumanPenceresi kapat={() => setAcik(false)} />}
    </>
  );
}

export function StandartTuslari({ s, yaz, guncelListe }: { s: StandartSatiri; yaz: boolean; guncelListe: StandartSatiri[] }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [acik, setAcik] = useState(false);
  const ayniNo = guncelListe.filter((x) => x.no === s.no && x.id !== s.id), onceki = ayniNo.filter((x) => !x.guncel);
  return (
    <>
      <DosyaAcTusu dosyaId={s.dosyaId}>Oku</DosyaAcTusu>
      {yaz && s.guncel && <Tus ikon="refresh-cw" onClick={() => setAcik(true)}>Yeni sürüm yükle</Tus>}
      {yaz && <Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={async () => {
        const metin = !s.guncel ? `${s.no}:${s.surumAdi} (önceki sürüm) kaldırılır.` : onceki.length ? `${s.no}:${s.surumAdi} kaldırılır; bir önceki sürüm yeniden güncel olur.`
          : `${s.no}:${s.surumAdi} kütüphaneden kaldırılır.`;
        if (!(await onayla({ baslik: "Standardı kaldır", metin, tus: "Kaldır", tehlike: true }))) return;
        baslat(async () => {
          const r = await standartKaldirEylemi(s.id, s.surum);
          bildir(r.tamam ? "Standart kaldırıldı." : r.genel ?? "Kaldırılamadı.");
          const hedef = r.guncel ?? ayniNo.find((x) => x.guncel)?.id;
          if (r.tamam) router.push(hedef ? `/dokumanlar/standart/${hedef}` : "/dokumanlar");
          router.refresh();
        });
      }}>Kaldır</Tus>}
      {acik && <StandartPenceresi kapat={() => setAcik(false)} guncel={s} guncelListe={guncelListe} />}
    </>
  );
}
