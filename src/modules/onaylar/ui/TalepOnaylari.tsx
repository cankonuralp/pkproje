"use client";
/* ONAYLAR › TALEPLER (477; reisim 2026-10-10, Talepler–Onaylar sunumu ve maketi — karar formu T1 "evet": onay bekleyen her şey Onaylar'da, T2 "hayır":
   onaylayan talebi değiştirmez). Kişinin karar verebildiği bekleyen izin talepleri (firma yöneticisi) ve masraf formları (Muhasebe'yi değiştiren),
   eski önce; satır ayrıntıyı açar (?sec=<tip>-<kimlik>; masaüstünde listenin yanında, dar ekranda listenin üstünde, telefonda listenin yerine).
   Ayrıntı SALT OKUNUR: Onayla · Düzeltmeye geri gönder (gerekçe ≥ 10, talep eden düzeltip yeniden gönderir) · Reddet (gerekçe ≥ 10) · PDF; belge /
   fiş tek uçtan. Yetki ve kurallar sunucuda (talepler/server/talepler.ts talepKarar) ve veritabanında (0079). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { BosDurum } from "../../../components/bos/BosDurum";
import { Alan, ipucuId } from "../../../components/form/Form";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, Rozet, SayfaBasi, Sekmeler, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti, tusSinifi } from "../../../components/tus/Tus";
import type { OnayListeleri, OnayTalebiSatiri } from "../server/onaylar";
import { talepKararEylemi } from "./eylemler";
import { onaySekmeleri, zamanYaz } from "./OnayListesi";
import stil from "./onaylar.module.css";

const ADRES = "/onaylar/talepler";
const anahtar = (t: Pick<OnayTalebiSatiri, "tip" | "id">) => `${t.tip}-${t.id}`;
const GID = "w-talep-gerekce";

const SUTUNLAR: Sutun<OnayTalebiSatiri>[] = [
  { k: "tur", genislik: "24%", baslik: "Tür", kart: "ust", sira: 1, hucre: (t) => (
    <span><Rozet tur="kabul">{t.tip === "izin" ? "İzin talebi" : "Masraf formu"}</Rozet><AltSatir>{t.baslik.replace(/^Masraf formu · /, "")}</AltSatir></span>
  ) },
  { k: "konu", genislik: "30%", baslik: "Konu", kart: "govde", sira: 2, hucre: (t) => (
    <><KartEtiket>Konu</KartEtiket><span><b className={stil.sayi}>{t.ozet}</b><AltSatir><Link className={stil.no} href={`${ADRES}?sec=${anahtar(t)}`}>{t.no}</Link></AltSatir></span></>
  ) },
  { k: "kisi", genislik: "20%", baslik: "Gönderen", kart: "govde", sira: 3, hucre: (t) => <><KartEtiket>Gönderen</KartEtiket><Kirp>{t.kisi}</Kirp></> },
  { k: "tarih", genislik: "26%", baslik: "Gönderildi", kart: "govde", sira: 4, hucre: (t) => (
    <><KartEtiket>Gönderildi</KartEtiket><span><span className={stil.sayi}>{zamanYaz(t.gonderildi)}</span>
      {t.bekleme && <span className={t.eski ? stil.eski : stil.bekleme}>{t.bekleme} bekliyor</span>}</span></>
  ) },
];

export function TalepOnaylari({ v, sec }: { v: OnayListeleri; sec: string | null }) {
  const secili = sec ? v.talepler.find((t) => anahtar(t) === sec) ?? null : null;
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<span className={stil.sayi}><b>{v.talepler.length}</b> talep</span>} />
      <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(v, ADRES)} secili={ADRES} />
      {sec && !secili && <SeritKap><Serit tur="bilgi" ikon="info">Bu talep artık karar bekleyenler arasında değil (karar verilmiş, düzeltmede ya da geri çekilmiş).</Serit></SeritKap>}
      {v.talepler.length ? (
        <div className={stil.talepSahne} data-secili={secili ? "" : undefined}>
          {secili && <TalepAyrinti key={anahtar(secili)} t={secili} />}
          <div className={stil.talepListe}>
            <Liste baslik="Karar bekleyen talepler" sutunlar={SUTUNLAR} kayitlar={v.talepler} anahtar={anahtar} href={(t) => `${ADRES}?sec=${anahtar(t)}`} />
          </div>
        </div>
      ) : <BosDurum ikon="circle-check" baslik="Karar bekleyen talep yok" metin="İzin talebi ya da masraf formu gönderilince burada görünür." />}
    </>
  );
}

function TalepAyrinti({ t }: { t: OnayTalebiSatiri }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [kip, setKip] = useState<null | "geri" | "red">(null);
  const [gerekce, setGerekce] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [genel, setGenel] = useState<string | null>(null);
  const karar = (k: "onayla" | "geri" | "red") => baslat(async () => {
    const r = await talepKararEylemi(t.tip, t.id, t.surum, k, k === "onayla" ? {} : { gerekce });
    setHata(r.hatalar?.gerekce ?? null); setGenel(r.genel ?? null);
    if (!r.tamam) { if (r.hatalar?.gerekce) requestAnimationFrame(() => document.getElementById(GID)?.focus()); return; }
    bildir(r.bildirim ?? "Karar kaydedildi."); router.push(ADRES); router.refresh();
  });
  const ac = (k: "geri" | "red") => { setKip(k); setGerekce(""); setHata(null); setGenel(null); requestAnimationFrame(() => document.getElementById(GID)?.focus()); };
  return (
    <section className={stil.talepAyrinti} aria-labelledby="talep-ayrinti-b">
      <h2 className={stil.talepBaslik} id="talep-ayrinti-b" tabIndex={-1}>{t.baslik} · <span className={stil.sayi}>{t.no}</span></h2>
      {(t.uyari || t.geri || genel) && <div className={stil.talepSeritler}>
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        {t.uyari && <Serit tur="uyari" ikon="triangle-alert">{t.uyari}</Serit>}
        {t.geri && <Serit tur="bilgi" ikon="undo-2">Düzeltilip yeniden gönderildi. Önceki düzeltme isteği: “{t.geri}”</Serit>}
      </div>}
      <BilgiListesi>
        {t.alanlar.map(([ad, deger]) => <Bilgi key={ad} etiket={ad}>{deger}</Bilgi>)}
        <Bilgi etiket={t.tip === "izin" ? "Belge" : "Fiş"}>{t.belge ? <DosyaAcTusu dosyaId={t.belge} ikon="file-text">{t.tip === "izin" ? "Belge" : "Fiş"}</DosyaAcTusu> : "Yok"}</Bilgi>
      </BilgiListesi>
      <p className={stil.talepNot}>Talep salt okunur: değiştirilmesi gerekiyorsa “Düzeltmeye geri gönder”.</p>
      {kip ? (
        <div className={stil.talepGerekce}>
          <Alan id={GID} etiket={kip === "geri" ? "Düzeltme isteği" : "Ret gerekçesi"} zorunlu hata={hata ?? undefined}
            sonuc={hata ? undefined : "En az 10 karakter; talep eden Talepler'inde görür."}>
            <textarea id={GID} className={stil.gerekce} maxLength={200} value={gerekce} aria-invalid={!!hata || undefined} aria-describedby={ipucuId(GID)}
              onChange={(e) => setGerekce(e.target.value)} />
          </Alan>
          <div className={stil.eylemTuslar}>
            <Tus tur="ikincil" disabled={bekliyor} onClick={() => setKip(null)}>Vazgeç</Tus>
            <Tus ikon={kip === "geri" ? "undo-2" : "ban"} disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={() => karar(kip)}>
              {kip === "geri" ? "Geri gönder" : "Reddet"}</Tus>
          </div>
        </div>
      ) : (
        <div className={stil.talepTuslar}>
          <Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={() => karar("onayla")}>Onayla</Tus>
          <Tus tur="ikincil" ikon="undo-2" disabled={bekliyor} onClick={() => ac("geri")}>Düzeltmeye geri gönder</Tus>
          <Tus tur="ikincil" ikon="ban" className={stil.reddetTus} disabled={bekliyor} onClick={() => ac("red")}>Reddet</Tus>
          <a className={tusSinifi("ikincil")} href={`/talepler/pdf/${t.tip}/${t.id}`} download aria-label={`${t.no} formu PDF`}><Ikon ad="file-text" kucuk />PDF</a>
          <span className={stil.yalnizTelefon}><TusBaglanti tur="ikincil" ikon="arrow-left" href={ADRES}>Listeye dön</TusBaglanti></span>
        </div>
      )}
    </section>
  );
}
