"use client";
/* TÜR SAYFASI › RAPOR ŞABLONU (RAPOR-FORMAT.md §4–5; maket ekipman-turleri.html Format kurucu: "Taslak · vN" / "Yayında · vN", Yayınla onaylı,
   yayın öncesi denetim). Sürüm tablosu (taslak üstte, sonra yeniden eskiye) · Şablondan başlat penceresi (hazır şablon ya da yayınlanmış sürüm;
   varsa taslağın yerine geçer) · Yayınla penceresi (engeller + uyarılar sunucudan, sürüm notu). Tuşlar yalnız "değiştirir" düzeyine çizilir;
   karar ve denetim yine sunucuda. Taslak Format kurucuda düzenlenir (…/sablon/<sürüm>/kurucu, K4). */
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Kosullar } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, FormIzgara, Girdi, ipucuId } from "../../../components/form/Form";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, Rozet } from "../../../components/sayfa/Sayfa";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import type { FormatOzeti } from "../server/formatlar";
import { taslakBaslatEylemi, yayinDenetleEylemi, yayinlaEylemi } from "./eylemler";
import { DURUM_ROZET, surumAdi, tarihYaz } from "./ortak";
import stil from "./format.module.css";

const BASLA_ID = "sb-baslangic", NOT_ID = "sb-not";

export function SablonTablosu({ turId, surumler, yaz }: { turId: string; surumler: FormatOzeti[]; yaz: boolean }) {
  const sutunlar: Sutun<FormatOzeti>[] = [
    { k: "surum", genislik: "26%", baslik: "Sürüm", kart: "ust", sira: 1, hucre: (x) => <><b>{surumAdi(x)}</b><AltSatir>{x.kaynakAd ?? "Firma formatı"} · {x.bolum} bölüm</AltSatir></> },
    { k: "tarih", genislik: "24%", baslik: "Tarih", kart: "govde", sira: 2, hucre: (x) => <>
      <KartEtiket>{x.yayin ? "Yayınlandı" : "Son değişiklik"}</KartEtiket>{tarihYaz(x.yayin ?? x.degisti)}{x.notu && <AltSatir>{x.notu}</AltSatir>}</> },
    { k: "kisi", genislik: "20%", baslik: "Kişi", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>{x.yayinlayan ? "Yayınlayan" : "Hazırlayan"}</KartEtiket>{x.yayinlayan ?? x.olusturan}</> },
    { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <Rozet tur={DURUM_ROZET[x.durum][0]}>{DURUM_ROZET[x.durum][1]}</Rozet> },
    { k: "eylem", genislik: "18%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (x) => (
      <span className={stil.tuslar}>
        <TusBaglanti ikon="eye" href={`/ekipman-turleri/${turId}/sablon/${x.id}`}>Önizle</TusBaglanti>
        {yaz && x.durum === "taslak" && <TusBaglanti ikon="pencil" href={`/ekipman-turleri/${turId}/sablon/${x.id}/kurucu`}>Düzenle</TusBaglanti>}
        {yaz && x.durum === "taslak" && <YayinlaTusu format={x} />}
      </span>
    ) },
  ];
  return <Liste baslik="Rapor şablonu sürümleri" sutunlar={sutunlar} kayitlar={surumler} anahtar={(x) => x.id} />;
}

/** şablondan başlat: hazır şablon ya da yayınlanmış sürüm; taslak varsa onun yerine geçer (onun sürümüyle — görmediği taslağı ezmez) */
export function SablonBaslatTusu({ turId, turAd, taslak, surumler, sablonlar }:
  { turId: string; turAd: string; taslak: { surum: number; degisti: string } | null; surumler: FormatOzeti[]; sablonlar: readonly (readonly [string, string])[] }) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [secim, setSecim] = useState("");
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const secenekler = [
    ...sablonlar.map(([k, ad]) => [`sablon:${k}`, ad, "Hazır şablon"] as const),
    ...surumler.filter((x) => x.durum !== "taslak").map((x) => [`surum:${x.id}`, `${surumAdi(x)} · ${x.durum === "yayinda" ? "yayında" : "eski"}`, x.kaynakAd ?? "Firma formatı"] as const),
  ];
  const tamam = () => baslat(async () => {
    const r = await taslakBaslatEylemi(turId, taslak?.surum ?? null, secim);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (!r.tamam) return;
    setAcik(false); bildir("Taslak hazırlandı; Format kurucuda düzenleyin."); router.push(`/ekipman-turleri/${turId}/sablon/${r.id}/kurucu`);
  });
  return (
    <>
      <Tus tur="ikincil" ikon="layout-list" onClick={() => { setSecim(""); setH({}); setGenel(null); setAcik(true); }}>Şablondan başlat</Tus>
      {acik && <Pencere acik baslik="Şablondan başlat" onKapat={() => setAcik(false)} odak={`#${BASLA_ID}`}
        alt={<><Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus><Tus ikon="check" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={tamam}>Başlat</Tus></>}>
        <p className={pencereMetinSinifi}><b>{turAd}</b></p>
        {taslak && <Serit tur="uyari" ikon="triangle-alert">Taslak ({tarihYaz(taslak.degisti)}) bu başlangıçla değiştirilir.</Serit>}
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        <FormIzgara>
          <Alan id={BASLA_ID} etiket="Başlangıç" zorunlu genis hata={h.baslangic}>
            <SecimAlani id={BASLA_ID} ad="Başlangıç" deger={secim} secenekler={secenekler} ipucu="Şablon ya da sürüm seçin" gecersiz={!!h.baslangic}
              tanim={ipucuId(BASLA_ID)} degistir={setSecim} />
          </Alan>
        </FormIzgara>
      </Pencere>}
    </>
  );
}

/** yayınla: engeller (kilitli öğe) ve uyarılar pencere açılınca sunucudan; Yayınla hep basılır, yayınlanamıyorsa nedenini söyler */
export function YayinlaTusu({ format }: { format: Pick<FormatOzeti, "id" | "surum"> }) {
  const router = useRouter();
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [bekliyor, baslat] = useTransition();
  const [denetim, setDenetim] = useState<{ engeller: string[]; uyarilar: string[] } | null>(null);
  const [notu, setNotu] = useState("");
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  useEffect(() => {
    if (!acik) return;
    let iptal = false;
    void yayinDenetleEylemi(format.id).then((r) => {
      if (iptal) return;
      if (r.tamam) setDenetim({ engeller: r.engeller ?? [], uyarilar: r.uyarilar ?? [] }); else setGenel(r.genel ?? "Denetlenemedi.");
    });
    return () => { iptal = true; };
  }, [acik, format.id]);
  const yayinla = () => baslat(async () => {
    const r = await yayinlaEylemi(format.id, format.surum, notu);
    setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
    if (r.engeller) { setDenetim((d) => ({ engeller: r.engeller!, uyarilar: d?.uyarilar ?? [] })); return; }
    if (!r.tamam) return;
    setAcik(false); bildir(`Rapor şablonu sürüm ${r.sira} yayınlandı.`); router.refresh();
  });
  return (
    <>
      <Tus ikon="upload" onClick={() => { setDenetim(null); setNotu(""); setH({}); setGenel(null); setAcik(true); }}>Yayınla</Tus>
      {acik && <Pencere acik baslik="Rapor şablonunu yayınla" onKapat={() => setAcik(false)} odak={`#${NOT_ID}`}
        alt={<><Tus tur="ikincil" onClick={() => setAcik(false)}>Vazgeç</Tus><Tus ikon="upload" disabled={bekliyor || !denetim} aria-busy={bekliyor || !denetim || undefined} onClick={yayinla}>Yayınla</Tus></>}>
        <p className={pencereMetinSinifi}>Yeni raporlar bu sürümle açılır; açık raporlar kendi sürümünde kalır.</p>
        {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
        {denetim && denetim.engeller.length > 0 && <>
          <Serit tur="hata" ikon="lock">Yayınlanamaz: Bakanlık formatının zorunlu öğeleri korunmalı.</Serit>
          <Kosullar ogeler={denetim.engeller.map((m) => ({ tur: "eksik" as const, metin: m }))} />
        </>}
        {denetim && denetim.uyarilar.length > 0 && <>
          <p className={stil.etiket}>Yayından önce bakılacak</p>
          <Kosullar ogeler={denetim.uyarilar.map((m) => ({ tur: "eksik" as const, metin: m }))} />
        </>}
        <FormIzgara>
          <Alan id={NOT_ID} etiket="Sürüm notu" genis hata={h.notu}>
            <Girdi id={NOT_ID} value={notu} onChange={(e) => setNotu(e.target.value)} maxLength={200} hata={!!h.notu} />
          </Alan>
        </FormIzgara>
      </Pencere>}
    </>
  );
}
