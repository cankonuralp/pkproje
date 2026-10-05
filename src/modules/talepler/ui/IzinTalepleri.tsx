"use client";
/* PERSONEL › İZİN TALEPLERİ (maket personel.html #/izinler — IZIN_SUTUN, izinCiz, izinRedCiz; 2026-09-28 reisim: izin onayı firma yöneticisinde,
   Personel'de; 330). Talepler'den gelen izin talepleri, bekleyen üstte; yıllık izinde kişinin kalan hakkı yanında (aşıyorsa uyarı, engel değil).
   Onayla ya da gerekçeyle reddet; karar talep edenin Talepler'inde. Karar sunucuda (Talepler "değiştirir" — firma yöneticisi). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { BosDurum } from "../../../components/bos/BosDurum";
import { PersonelSekmeleri } from "../../personel/ui/ortak";
import { IZIN_DURUM, IZIN_TUR } from "../sema";
import type { IzinSatiri } from "../server/talepler";
import { izinOnaylaEylemi, izinReddetEylemi } from "./eylemler";
import stil from "./talepler.module.css";

const aralik = (x: { bas: string; bit: string }) => `${tarihNo(x.bas)}${x.bit !== x.bas ? ` – ${tarihNo(x.bit)}` : ""}`;
const GID = "w-izin-gerekce";

export function IzinTalepleri({ l }: { l: IzinSatiri[] }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyorMu, baslat] = useTransition();
  const [red, setRed] = useState<null | { x: IzinSatiri; gerekce: string; hata: string | null }>(null);
  const bek = l.filter((x) => x.durum === "bekliyor").length;
  const onayla = (x: IzinSatiri) => baslat(async () => {
    const r = await izinOnaylaEylemi(x.id, x.surum);
    if (!r.tamam) { bildir(r.genel ?? "Onaylanamadı."); return; }
    bildir(r.bildirim ?? "Onaylandı."); router.refresh();
  });
  const reddet = () => baslat(async () => {
    if (!red) return;
    const r = await izinReddetEylemi(red.x.id, red.x.surum, { gerekce: red.gerekce });
    if (!r.tamam) { setRed({ ...red, hata: r.hatalar?.gerekce ?? r.genel ?? "Reddedilemedi." }); requestAnimationFrame(() => document.getElementById(GID)?.focus()); return; }
    setRed(null); bildir(r.bildirim ?? "Reddedildi."); router.refresh();
  });
  const sutunlar: Sutun<IzinSatiri>[] = [
    { k: "no", genislik: "16%", baslik: "Talep no", kart: "ust", sira: 1, hucre: (x) => <><span className={stil.sayi}>{x.no}</span><AltSatir>{tarihNo(x.gonderildi.slice(0, 10))}</AltSatir></> },
    { k: "kisi", genislik: "26%", baslik: "Personel / izin", kart: "govde", sira: 2, hucre: (x) => (
      <span><Link href={`/personel/${x.personelId}`}>{x.personel}</Link><AltSatir><Kirp>{`${IZIN_TUR[x.tur]}${x.aciklama ? ` · ${x.aciklama}` : ""}`}</Kirp></AltSatir></span>
    ) },
    { k: "tarih", genislik: "24%", baslik: "Tarih", kart: "govde", sira: 3, hucre: (x) => {
      const asim = x.tur === "yillik" && x.durum === "bekliyor" && x.gun > x.ozet.kalan;
      return <><KartEtiket>Tarih</KartEtiket><span>{aralik(x)}<AltSatir uyari={asim}>{x.gun} iş günü{x.tur === "yillik" ? ` · kalan yıllık izin ${x.ozet.kalan} gün` : ""}</AltSatir></span></>;
    } },
    { k: "durum", genislik: "14%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => (
      <span><Rozet tur={IZIN_DURUM[x.durum][1]}>{IZIN_DURUM[x.durum][0]}</Rozet>{x.red && <AltSatir><Kirp>{x.red}</Kirp></AltSatir>}</span>
    ) },
    { k: "eylem", genislik: "20%", baslik: "İşlem", kart: "eylem", sira: 9, hucre: (x) => (
      <div className={stil.tuslar}>
        {x.belge && <DosyaAcTusu dosyaId={x.belge} ikon="file-text" etiket={`${x.no} belgesi`}>Belge</DosyaAcTusu>}
        {x.durum === "bekliyor" && <>
          <Tus tur="ikincil" ikon="x" disabled={bekliyorMu} aria-label={`${x.no} reddet`} onClick={() => { setRed({ x, gerekce: "", hata: null }); }}>Reddet</Tus>
          <Tus ikon="check" disabled={bekliyorMu} aria-label={`${x.no} onayla`} onClick={() => onayla(x)}>Onayla</Tus>
        </>}
      </div>
    ) },
  ];
  return (
    <>
      <SayfaBasi baslik="Personel" sayac={<span className={stil.sayi}><b>{l.length}</b> talep</span>} />
      <PersonelSekmeleri secili="/personel/izinler" izinler />
      {bek > 0 && <SeritKap><Serit tur="uyari" ikon="inbox"><b>{bek} izin talebi onayınızı bekliyor.</b></Serit></SeritKap>}
      {l.length ? <Liste baslik="İzin talepleri" sutunlar={sutunlar} kayitlar={l} anahtar={(x) => x.id} />
        : <BosDurum ikon="inbox" baslik="İzin talebi yok" metin="Personel izin talebini Talepler'den gönderir." />}
      {red && <Pencere acik baslik={`İzin talebini reddet · ${red.x.no}`} onKapat={() => { if (!bekliyorMu) setRed(null); }} odak={`#${GID}`}
        alt={<><Tus tur="ikincil" disabled={bekliyorMu} onClick={() => setRed(null)}>Vazgeç</Tus>
          <Tus ikon="x" disabled={bekliyorMu} aria-busy={bekliyorMu || undefined} onClick={reddet}>Reddet</Tus></>}>
        <p className={pencereMetinSinifi}><b>{red.x.personel}</b> · {IZIN_TUR[red.x.tur]} · {aralik(red.x)}</p>
        <Alan id={GID} etiket="Red gerekçesi" zorunlu hata={red.hata ?? undefined} sonuc={red.hata ? undefined : "En az 5 karakter; talep eden Talepler'inde görür."}>
          <textarea id={GID} className={stil.metin} maxLength={200} value={red.gerekce} aria-invalid={!!red.hata || undefined} aria-describedby={ipucuId(GID)}
            onChange={(e) => setRed({ ...red, gerekce: e.target.value })} />
        </Alan>
      </Pencere>}
    </>
  );
}
