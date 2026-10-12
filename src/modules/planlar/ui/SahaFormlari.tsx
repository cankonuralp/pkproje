"use client";
/* SAHA FORMLARI (2026-10-12; reisim: "görselde saha takip formu üretme işi yok ? neden ? geri gelsin." — maket planlarim.html sahaListe, 197):
   plan içinde Tamamlama adımının altında oluşturulan formlar, en yeni üstte: numara · oluşturan ve zaman · müşterinin imzalı taraması (yüklü / yok)
   · "PDF indir" (yazdırılıp müşteriye imzalatılır, kaşelenir) · tarama: "İmzalı taramayı yükle" ya da "Taramayı aç" + "Değiştir" + "Kaldır"
   (sorulur). "Saha formu oluştur" tuşu Tamamlama adımında (PlanIciEkrani). Yetki ve dosya türü sunucuda; buradaki tuşlar yalnız izinli olana. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../components/ikon/Ikon";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, Kod, Rozet } from "../../../components/sayfa/Sayfa";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import type { SahaFormuSatiri } from "../server/plan-ici";
import { sahaTaramaKaldirEylemi, sahaTaramaYukleEylemi } from "./eylemler";
import stil from "./planlar.module.css";

const zamanYaz = (iso: string) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
};

export function SahaFormlari({ planId, formlar, yaz }: { planId: string; formlar: SahaFormuSatiri[]; yaz: boolean }) {
  if (!formlar.length) return null;
  return (
    <ul className={stil.sahaListe} aria-label="Saha formları">
      {formlar.map((f) => <SahaFormu key={f.id} planId={planId} f={f} yaz={yaz} />)}
    </ul>
  );
}

function SahaFormu({ planId, f, yaz }: { planId: string; f: SahaFormuSatiri; yaz: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const hataId = `saha-hata-${f.id}`;
  const yukle = (d: File) => baslat(async () => {
    const form = new FormData();
    form.set("plan", planId); form.set("form", f.id); form.set("surum", String(f.surum)); form.set("dosya", d);
    const r = await sahaTaramaYukleEylemi(form);
    if (r.tamam) { setHata(null); bildir(r.bildirim ?? "Tarama yüklendi."); router.refresh(); return; }
    setHata(r.hatalar?.dosya ?? r.genel ?? "Yüklenemedi.");
  });
  const kaldir = async () => {
    if (!(await onayla({ baslik: "Taramayı kaldır", metin: `${f.no} saha formunun imzalı taraması kaldırılır. Form kalır; yeni tarama yüklenebilir.`, tus: "Kaldır", tehlike: true }))) return;
    baslat(async () => {
      const r = await sahaTaramaKaldirEylemi(planId, f.id, f.surum);
      if (r.tamam) { setHata(null); bildir(r.bildirim ?? "Tarama kaldırıldı."); router.refresh(); return; }
      setHata(r.genel ?? "Kaldırılamadı.");
    });
  };
  const dosyaTusu = (ad: string, ikon: string, etiket: string) => (
    <label className={`${tusSinifi("ikincil")} ${stil.sahaDosya}`} aria-disabled={bekliyor || undefined}>
      <input type="file" accept="application/pdf,image/jpeg,image/png" className="gizli" disabled={bekliyor} aria-label={etiket}
        aria-describedby={hata ? hataId : undefined} onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) yukle(d); }} />
      <Ikon ad={ikon} kucuk />{ad}
    </label>
  );
  return (
    <li className={stil.sahaSatir}>
      <span className={stil.sahaBilgi}>
        <span><Ikon ad="file-text" kucuk /> <Kod>{f.no}</Kod></span>
        <AltSatir>{f.olusturan} · {zamanYaz(f.zaman)}</AltSatir>
      </span>
      {f.tarama ? <Rozet tur="tamam">Müşteri imzalı tarama yüklü</Rozet> : <Rozet tur="bekliyor">Müşteri taraması yok</Rozet>}
      <span className={stil.sahaTuslar}>
        <a className={tusSinifi("ikincil")} href={`/planlar/${planId}/saha-formu/${f.id}/pdf`} download aria-label={`${f.no} PDF indir`}><Ikon ad="download" kucuk />PDF indir</a>
        {f.tarama && <DosyaAcTusu dosyaId={f.tarama} etiket={`${f.no} imzalı taramayı aç`}>Taramayı aç</DosyaAcTusu>}
        {yaz && (f.tarama
          ? <>{dosyaTusu("Değiştir", "upload", `${f.no} imzalı taramayı değiştir`)}
            <Tus tur="ikincil" ikon="trash-2" disabled={bekliyor} onClick={kaldir} aria-label={`${f.no} taramayı kaldır`}>Kaldır</Tus></>
          : dosyaTusu("İmzalı taramayı yükle", "upload", `${f.no} imzalı taramayı yükle`))}
      </span>
      {hata && <p className={stil.sahaHata} id={hataId} role="alert">{hata}</p>}
    </li>
  );
}
