"use client";
/* UYGUNSUZLUKLAR (320; maket musteri.html #/uygunsuz — U_SUTUN, suzgecTanimla "u"; pkproje §1.1 reisim: "uygunsuzları indir seçeneği olacak ve tüm
   uygunsuz raporları excel olarak indirip görebilecek ve exceldeki ilgili yere tıklayınca rapora gidebilecek … önceliğimiz müşteri kolaylığı"; Ö3:
   "excel de link olmalı … "rapor" yazsın"). Görebildiği imzalı raporların uygunsuzlukları (ayrı kayıt, PDF'ten okunmaz — §3.2 madde 6), en yeni
   tespit üstte. Sütunlar Ekipman · Kusur · Rapor · Tespit · Durum (giderildiyse gideren kontrolün tarihi). Çipler Açık / Giderildi (aynı grup) ve
   Ağır; seçici Tesis. "Uygunsuzları indir": açık uygunsuzlukların önizlemesi (pencere) → .xlsx (satır başında "Rapor" bağlantısı; tarayıcıda,
   panelin zaten aldığı veriden — yeni sunucu ucu yok). 321: "Uygunsuz raporlar (ZIP)" — süzgeçteki uygunsuzlukların raporları (imzalı PDF,
   tesis klasörlü). Görme sunucuda (müşteri rolü, veritabanı politikası). */
import Link from "next/link";
import { useState } from "react";
import { baytIndir, dosyaGunu } from "../../../components/disa/indir";
import { XLSX_TURU, xlsxBayt } from "../../../components/disa/xlsx";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { tarihNo } from "../../../components/secim/tarih";
import { Tus } from "../../../components/tus/Tus";
import type { MusteriUygunsuzlukSatiri } from "../../raporlar/server/musteri-baglanti";
import type { PanelUygunsuzluklari } from "../server/panel";
import { adParcasi } from "./ad";
import { kusurParcala } from "./kusur";
import { useTopluIndir, type ZipRaporu } from "./topluIndir";
import { PanelSekmeleri, raporAdresi } from "./ortak";
import stil from "./panel.module.css";

const sinif = (u: MusteriUygunsuzlukSatiri) => (u.agir ? "Ağır kusur" : "Kusur");

const SUTUNLAR: Sutun<MusteriUygunsuzlukSatiri>[] = [
  { k: "ekipman", genislik: "22%", baslik: "Ekipman", kart: "ust", sira: 1, hucre: (u) => (
    <><span className={stil.kod}>{u.ekipmanKod}</span><AltSatir><Kirp>{`${u.turAd} · ${u.tesis}`}</Kirp></AltSatir></>
  ) },
  { k: "kusur", genislik: "34%", baslik: "Kusur", kart: "govde", sira: 2, hucre: (u) => {
    const k = kusurParcala(u.metin, u.kriter);
    return <><KartEtiket>Kusur</KartEtiket><span><span className={u.agir ? stil.agir : undefined}>{u.agir ? "Ağır · " : ""}</span>{k.kriter}{k.aciklama && <AltSatir>{k.aciklama}</AltSatir>}</span></>;
  } },
  { k: "rapor", genislik: "16%", baslik: "Rapor", kart: "govde", sira: 3, hucre: (u) => (
    <><KartEtiket>Rapor</KartEtiket><Link className={stil.kod} href={`/portal/r/${u.raporId}`}>{u.raporNo}</Link></>
  ) },
  { k: "tarih", genislik: "12%", baslik: "Tespit", kart: "govde", sira: 4, hucre: (u) => <><KartEtiket>Tespit</KartEtiket>{u.tarih ? tarihNo(u.tarih) : "—"}</> },
  { k: "durum", genislik: "16%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (u) => (
    <span>{u.acik ? <Rozet tur="red">Açık</Rozet> : <Rozet tur="tamam">Giderildi</Rozet>}{u.giderildi && <AltSatir>{tarihNo(u.giderildi)} kontrolünde</AltSatir>}</span>
  ) },
];

function tanim(tesisler: PanelUygunsuzluklari["tesisler"]): SuzgecTanimi<MusteriUygunsuzlukSatiri> {
  return {
    ad: "Uygunsuzluklarda ara", ipucu: "Ekipman, kriter, rapor no", birim: "uygunsuzluk", sayfa: 20, imkansiz: "Bir uygunsuzluk hem açık hem giderilmiş olamaz",
    metin: (u) => [u.ekipmanKod, u.turAd, u.tesis, u.metin, u.raporNo].join(" "),
    cipler: [
      { k: "acik", ad: "Açık", grup: "durum", test: (u) => u.acik },
      { k: "giderildi", ad: "Giderildi", grup: "durum", test: (u) => !u.acik },
      { k: "agir", ad: "Ağır kusur", test: (u) => u.agir },
    ],
    seciciler: [
      { k: "tesis", ad: "Tesis", secenek: () => [["tumu", "Tümü"], ...tesisler.map((t) => [t.id, t.ad] as const)], gecer: (u, v) => v === "tumu" || u.tesisId === v },
    ],
  };
}

/** açık uygunsuzluklar → .xlsx (maket excel-indir sütunları; ilk sütun raporu açan bağlantı) */
export function uygunsuzlukExceli(l: readonly MusteriUygunsuzlukSatiri[]): Uint8Array {
  return xlsxBayt("Uygunsuzluklar", [["Rapor", "Ekipman kodu", "Ekipman türü", "Tesis", "Sınıf", "Kriter", "Açıklama", "Rapor no", "Kontrol tarihi"],
    ...l.map((u) => {
      const k = kusurParcala(u.metin, u.kriter);
      return [{ metin: "Rapor", url: raporAdresi(u.raporId) }, u.ekipmanKod, u.turAd, u.tesis, sinif(u), k.kriter, k.aciklama, u.raporNo, u.tarih ? tarihNo(u.tarih) : ""];
    })]);
}

export function PanelUygunsuzlukListesi({ v }: { v: PanelUygunsuzluklari }) {
  const s = useSuzgec(tanim(v.tesisler), v.uygunsuzluklar);
  const [pencere, setPencere] = useState(false);
  const acik = v.uygunsuzluklar.filter((u) => u.acik);
  const indir = () => { baytIndir(`uygunsuzluklar-${dosyaGunu()}.xlsx`, uygunsuzlukExceli(acik), XLSX_TURU); setPencere(false); };
  const zip = useTopluIndir();
  /* süzgeçteki uygunsuzlukların raporları (her rapor bir kez, son imzalı PDF'i) */
  const zipRaporlari = () => {
    const l: ZipRaporu[] = [], gorulen = new Set<string>();
    for (const u of s.sonuc.liste) if (u.raporDosya && !gorulen.has(u.raporId)) { gorulen.add(u.raporId); l.push({ dosya: u.raporDosya, no: u.raporNo, tesis: u.tesis, boyut: u.raporBoyut }); }
    return l;
  };
  const topluIndir = () => zip.indir(zipRaporlari(), `${adParcasi(v.musteri?.kisa ?? "musteri")}-uygunsuz-raporlar-${dosyaGunu()}.zip`);
  return (
    <>
      <SayfaBasi baslik="Uygunsuzluklar" sayac={<Sayac s={s} />}
        tuslar={<>
          <Tus tur="ikincil" ikon="download" onClick={topluIndir} disabled={!s.sonuc.liste.length || !!zip.ilerleme} aria-live="polite">
            {zip.ilerleme ? `İndiriliyor ${zip.ilerleme}` : "Uygunsuz raporlar (ZIP)"}
          </Tus>
          <Tus ikon="file-check" onClick={() => setPencere(true)} disabled={!acik.length}>Uygunsuzları indir</Tus>
        </>} />
      <p className={stil.alt}>{v.musteri?.unvan ?? "—"}</p>
      <PanelSekmeleri acikUygunsuz={v.acikUygunsuz} secili="/portal/uygunsuz" />
      {zip.hata && <SeritKap><Serit tur="hata" ikon="circle-alert">{zip.hata}</Serit></SeritKap>}
      <SuzgecliListe s={s} on="u" baslik="Uygunsuzluklar" sutunlar={SUTUNLAR} anahtar={(u) => u.id} href={(u) => `/portal/r/${u.raporId}`}
        bosVeri={{ ikon: "circle-check", baslik: "Uygunsuzluk yok", metin: "İmzalı raporlarınızda uygunsuz bulunan ekipman yok." }} />
      <Pencere acik={pencere} genis baslik="Uygunsuzları indir (Excel)" onKapat={() => setPencere(false)} odak="#u-excel-indir"
        alt={<>
          <Tus tur="ikincil" onClick={() => setPencere(false)}>Vazgeç</Tus>
          <Tus id="u-excel-indir" ikon="file-check" onClick={indir}>İndir (.xlsx)</Tus>
        </>}>
        <p className={pencereMetinSinifi}><b>{acik.length} açık uygunsuzluk</b> · {v.musteri?.unvan ?? "—"} · {tarihNo(dosyaGunu())}. Dosyada her satırın başındaki
          &quot;Rapor&quot; bağlantısı raporu panelde açar.</p>
        {/* önizleme iki sütun (telefonda da okunur); dosyanın kendisinde her alan ayrı sütun */}
        <table className={stil.onizleme}>
          <thead><tr><th scope="col">Uygunsuzluk</th><th scope="col">Rapor</th></tr></thead>
          <tbody>
            {acik.map((u) => (
              <tr key={u.id}>
                <td><span className={stil.kod}>{u.ekipmanKod}</span> {u.turAd}<AltSatir>{`${u.tesis} · ${sinif(u)} · ${u.metin}`}</AltSatir></td>
                <td><Link className={stil.kod} href={`/portal/r/${u.raporId}`}>{u.raporNo}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Pencere>
    </>
  );
}
