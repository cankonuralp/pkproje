"use client";
/* Sözleşme sayfasının istemci parçaları (maket sozlesmeler.html sozlesmeCiz / isgBolum): imzalı sözleşme tuşları (yükle · aç · değiştir · kaldır;
   yalnız "değiştirir") ve İSG-KATİP bölümü (tesis başına denetçi → ID; ekle / düzenle / kaldır, kullanılmış ID kaldırılmaz). */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, DegerYok, Kod, Rozet, Rozetler } from "../../../components/sayfa/Sayfa";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus } from "../../../components/tus/Tus";
import type { IsgSatiri, KapsamTesisi } from "../server/sozlesmeler";
import { imzaliYukleEylemi, isgKaldirEylemi, sozlesmeSilEylemi } from "./eylemler";
import { tarihYaz } from "./ortak";
import { ImzaliPenceresi, IsgPenceresi } from "./Pencereler";
import stil from "./sozlesmeler.module.css";

/** 369: `sil` — imza bekleyen, hiç kullanılmamış sözleşmede yöneticiye "Sil" (sunucu söyler) */
export function ImzaliTuslari({ id, surum, no, dosya, yaz, sil = false }: { id: string; surum: number; no: string; dosya: string | null; yaz: boolean; sil?: boolean }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  const [acik, setAcik] = useState(false);
  const kaldir = async () => {
    if (!(await onayla({ baslik: "İmzalı sözleşmeyi kaldır", metin: `${no} imzalı taraması kaldırılır; sözleşme imza bekliyor durumuna döner.`, tus: "Kaldır", tehlike: true }))) return;
    baslat(async () => {
      const f = new FormData(); f.set("id", id); f.set("surum", String(surum)); f.set("kaldir", "1");
      const r = await imzaliYukleEylemi(f); bildir(r.tamam ? `${no} imzalı taraması kaldırıldı.` : r.genel ?? "Kaldırılamadı."); router.refresh();
    });
  };
  return (
    <>
      {dosya && <DosyaAcTusu dosyaId={dosya} ikon="file-check">İmzalı sözleşmeyi aç</DosyaAcTusu>}
      {yaz && dosya && <Tus tur="ikincil" ikon="upload" onClick={() => setAcik(true)}>Değiştir</Tus>}
      {yaz && dosya && <Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={kaldir}>Kaldır</Tus>}
      {yaz && !dosya && <Tus ikon="file-check" onClick={() => setAcik(true)}>İmzalı sözleşmeyi yükle</Tus>}
      {sil && !dosya && <SilTusu ad={no} baslik="Sözleşmeyi sil" yanEtki="imza beklerken silinir, kapsam tesisleri de çıkar" sil={() => sozlesmeSilEylemi(id)} donus="/sozlesmeler" />}
      {acik && <ImzaliPenceresi kapat={() => setAcik(false)} id={id} surum={surum} no={no} var={!!dosya} />}
    </>
  );
}

/* İSG ID kaldır (satır saklanır — 373 dil birliği: tuş "Sil" değil "Kaldır", onayıyla aynı) */
function KaldirTusu({ r }: { r: IsgSatiri }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  return (
    <Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={async () => {
      if (!(await onayla({ baslik: "İSG-KATİP ID kaldırılsın mı?", metin: `${r.no} (${r.personel}) hiçbir planda kullanılmadı; listeden kalkar.`, tus: "Kaldır" }))) return;
      baslat(async () => { const x = await isgKaldirEylemi(r.id, r.surum); bildir(x.tamam ? `${r.no} kaldırıldı.` : x.genel ?? "Kaldırılamadı."); router.refresh(); });
    }} aria-label={`${r.no} kaldır`}>Kaldır</Tus>
  );
}

export function IsgBolumu({ sozlesme, sozNo, kapsam, kisiler, yaz }: { sozlesme: string; sozNo: string; kapsam: KapsamTesisi[]; kisiler: { id: string; ad: string }[]; yaz: boolean }) {
  const [p, setP] = useState<null | { tesis: string; kayit?: IsgSatiri }>(null);
  const tumu = kapsam.flatMap((t) => t.isg);
  const sutunlar: Sutun<IsgSatiri>[] = [
    { k: "kisi", genislik: "22%", baslik: "Denetçi", kart: "ust", sira: 1, hucre: (r) => <Kirp>{r.personel}</Kirp> },
    { k: "no", genislik: "18%", baslik: "Sözleşme ID", kart: "govde", sira: 2, hucre: (r) => <><KartEtiket>Sözleşme ID</KartEtiket><Kod>{r.no}</Kod></> },
    { k: "onay", genislik: "18%", baslik: "Onay · bitiş", kart: "govde", sira: 3, hucre: (r) => <><KartEtiket>Onay · bitiş</KartEtiket><span><span className={stil.tarih}>{tarihYaz(r.onay)}</span>
      {r.bitti ? <span className={stil.uyari}>bitiş {tarihYaz(r.bitis)}</span> : <AltSatir>{r.bitis ? `bitiş ${tarihYaz(r.bitis)}` : "bitiş girilmedi"}</AltSatir>}</span></> },
    { k: "durum", genislik: "16%", baslik: "Kullanım", kart: "rozet", sira: 1, hucre: (r) => <Rozetler>{r.bitti && <Rozet tur="bekliyor">Bitmiş</Rozet>}
      {r.kullanildi ? <Rozet tur="kabul">Planda kullanıldı</Rozet> : <Rozet tur="notr">Kullanılmadı</Rozet>}</Rozetler> },
    { k: "eylem", genislik: "26%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (r) => (
      <span className={stil.tuslar}>
        {r.dosyaId ? <DosyaAcTusu dosyaId={r.dosyaId}>PDF</DosyaAcTusu> : <DegerYok>PDF yok</DegerYok>}
        {yaz && <Tus tur="ikincil" ikon="pencil" onClick={() => setP({ tesis: r.tesisId, kayit: r })}>Düzenle</Tus>}
        {yaz && !r.kullanildi && <KaldirTusu r={r} />}
      </span>
    ) },
  ];
  return (
    <>
      {kapsam.map((t) => (
        <div key={t.id}>
          <div className={stil.tesisBas}>
            <h3 className={stil.tesisAd}>{t.ad} <span className={stil.sgk}>SGK DETSİS NO {t.sgk ?? "—"}</span></h3>
            {yaz && <Tus tur="ikincil" ikon="plus" onClick={() => setP({ tesis: t.id })}>ID ekle</Tus>}
          </div>
          {t.isg.length ? <Liste baslik={`İSG-KATİP · ${t.ad}`} sutunlar={sutunlar} kayitlar={t.isg} anahtar={(r) => r.id} /> : <p className={stil.bosSatir}>Bu tesiste ID yok.</p>}
        </div>
      ))}
      {p && <IsgPenceresi kapat={() => setP(null)} sozlesme={sozlesme} sozNo={sozNo} tesisler={kapsam.map((t) => ({ id: t.id, ad: t.ad, sgk: t.sgk }))} kisiler={kisiler}
        mevcutlar={tumu} tesis={p.tesis} kayit={p.kayit} />}
    </>
  );
}
