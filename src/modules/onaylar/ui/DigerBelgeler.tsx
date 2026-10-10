"use client";
/* ONAYLAR › DİĞER BELGELER (333; maket onaylar.html #/diger — DIGER_SUTUN, BDURUM, belge-goster / belge-geri / belge-imzala): kişinin imzasına
   gönderilen bordro, eğitim formu, zimmet formu, araç teslim tutanağı. Bekleyenler üstte. Görüntüle · Geri gönder (önce sorulur) · Onayla ve
   imzala (pencere: PDF'i indir → e-imza aracınızla imzalayın → imzalı PDF'i yükleyin; her belge ayrı). Karar ve kural sunucuda (belgeler.ts). */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere, pencereMetinSinifi } from "../../../components/pencere/Pencere";
import { AltSatir, Rozet, SayfaBasi, SeritKap, Sekmeler } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import { BELGE_DURUM, BELGE_TUR, type BelgeDurumu } from "../sema";
import type { BelgeSatiri, DigerBelgeler as Veri } from "../server/belgeler";
import type { OnayListeleri } from "../server/onaylar";
import { belgeGeriGonderEylemi, belgeImzaliYukleEylemi } from "./eylemler";
import { onaySekmeleri } from "./OnayListesi";
import stil from "./onaylar.module.css";

const TR = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const zamanYaz = (iso: string) => TR.format(new Date(iso)).replace(",", "");
const IMZA_HATA = "w-belge-imza-hata";
/* karar sonrası satırın tuşları kalkar: odak "Diğer belgeler" sekmesine, yoksa başlığa (maket digerCiz odak; 333 incelemesi) */
const odakla = () => setTimeout(() => {
  const h = document.querySelector<HTMLElement>('nav[aria-label="Onaylar bölümleri"] [aria-current="page"]') ?? document.querySelector<HTMLElement>("main h1");
  if (h) { if (h.tagName === "H1") h.tabIndex = -1; h.focus(); }
}, 50);

/** 481 (site taraması, kalıp 14–15): Diğer belgeler süzgeçli — arama · durum çipleri · ve/veya · Tür · Gönderen; boşken de görünür */
function belgeTanimi(l: readonly BelgeSatiri[]): SuzgecTanimi<BelgeSatiri> {
  const tekil = (x: string[]) => [...new Set(x)].sort((a, b) => a.localeCompare(b, "tr")).map((k) => [k, k] as const);
  const durum = (d: BelgeDurumu) => ({ k: d, ad: BELGE_DURUM[d][0], grup: "durum", test: (x: BelgeSatiri) => x.durum === d });
  return {
    ad: "Belgelerde ara", ipucu: "Belge, gönderen", birim: "belge", sayfa: 20, imkansiz: "Bir belge aynı anda iki durumda olamaz",
    metin: (x) => `${x.ad} ${x.gonderen} ${BELGE_TUR[x.tur]}`,
    cipler: [durum("bekliyor"), durum("imzali"), durum("geri")],
    seciciler: [
      { k: "tur", ad: "Tür", secenek: () => [["tumu", "Tümü"], ...[...new Set(l.map((x) => x.tur))].map((t) => [t, BELGE_TUR[t]] as const)], gecer: (x, s) => s === "tumu" || x.tur === s },
      { k: "gonderen", ad: "Gönderen", secenek: () => [["tumu", "Tümü"], ...tekil(l.map((x) => x.gonderen))], gecer: (x, s) => s === "tumu" || x.gonderen === s },
    ],
  };
}

export function DigerBelgeler({ v, sekmeler }: { v: Veri; sekmeler: OnayListeleri | null }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyorMu, baslat] = useTransition();
  const [imza, setImza] = useState<null | { x: BelgeSatiri; hata: string | null }>(null);
  const girdi = useRef<HTMLInputElement>(null);
  const geri = async (x: BelgeSatiri) => {
    if (!(await onayla({ baslik: "Belgeyi geri gönder", metin: <><b>{x.ad}</b> imzalanmadan {x.gonderen} kişisine geri gider.</>, tus: "Geri gönder" }))) return;
    baslat(async () => {
      const r = await belgeGeriGonderEylemi(x.id, x.surum);
      if (!r.tamam) { bildir(r.genel ?? "Geri gönderilemedi."); return; }
      bildir(r.bildirim ?? "Geri gönderildi."); router.refresh(); odakla();
    });
  };
  const yukle = (dosya: File) => baslat(async () => {
    if (!imza) return;
    const f = new FormData();
    f.set("id", imza.x.id); f.set("surum", String(imza.x.surum)); f.set("dosya", dosya);
    try {
      const r = await belgeImzaliYukleEylemi(f);
      if (r.tamam) { setImza(null); bildir(r.bildirim ?? "Belge imzalandı."); router.refresh(); odakla(); return; }
      setImza({ ...imza, hata: r.hatalar?.dosya ?? r.genel ?? "İmzalı PDF yüklenemedi." });
    } catch { setImza({ ...imza, hata: "Bağlantı ya da sunucu hatası; yeniden deneyin." }); } finally { if (girdi.current) girdi.current.value = ""; }
  });
  const s = useSuzgec(belgeTanimi(v.belgeler), v.belgeler);
  const sutunlar: Sutun<BelgeSatiri>[] = [
    { k: "belge", genislik: "30%", baslik: "Belge", kart: "ust", sira: 1, hucre: (x) => <span><Kirp>{x.ad}</Kirp><AltSatir>{BELGE_TUR[x.tur]}</AltSatir></span> },
    { k: "gonderen", genislik: "16%", baslik: "Gönderen", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Gönderen</KartEtiket><Kirp>{x.gonderen}</Kirp></> },
    { k: "zaman", genislik: "16%", baslik: "Gönderildi", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Gönderildi</KartEtiket><span className={stil.sayi}>{zamanYaz(x.gonderildi)}</span></> },
    { k: "durum", genislik: "14%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => (
      <span><Rozet tur={BELGE_DURUM[x.durum][1]}>{BELGE_DURUM[x.durum][0]}</Rozet>{x.karar && <AltSatir>{zamanYaz(x.karar)}</AltSatir>}</span>
    ) },
    { k: "eylem", genislik: "24%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (x) => (
      <div className={stil.eylemTuslar}>
        <DosyaAcTusu dosyaId={x.imzaliDosya ?? x.dosya} etiket={`${x.ad} görüntüle`}>Görüntüle</DosyaAcTusu>
        {x.durum === "bekliyor" && <>
          <Tus tur="ikincil" disabled={bekliyorMu} aria-label={`${x.ad} geri gönder`} onClick={() => geri(x)}>Geri gönder</Tus>
          <Tus ikon="file-signature" disabled={bekliyorMu} aria-label={`${x.ad} onayla ve imzala`} onClick={() => setImza({ x, hata: null })}>Onayla ve imzala</Tus>
        </>}
      </div>
    ) },
  ];
  return (
    <>
      <SayfaBasi baslik="Onaylar" sayac={<span className={stil.sayi}><b>{v.bekleyen}</b> bekliyor</span>} />
      {sekmeler && <Sekmeler ad="Onaylar bölümleri" ogeler={onaySekmeleri(sekmeler, "/onaylar/diger")} secili="/onaylar/diger" />}
      {!v.personel && <SeritKap><Serit tur="bilgi" ikon="info">Hesabınız bir personel kaydına bağlı değil; size belge gönderilemez.</Serit></SeritKap>}
      {v.bekleyen > 0 && <SeritKap><Serit tur="uyari" ikon="file-signature"><b>{v.bekleyen} belge imzanızı bekliyor</b> · her belge ayrı imzalanır.</Serit></SeritKap>}
      <SuzgecliListe s={s} on="dgr" baslik="Diğer belgeler" sutunlar={sutunlar} anahtar={(x) => x.id}
        bosVeri={{ ikon: "circle-check", baslik: "Onayınızı bekleyen belge yok", metin: "Bordro, eğitim ve zimmet formları onayınıza gönderildikçe burada görünür." }} />
      {imza && <Pencere acik baslik="Onayla ve imzala" onKapat={() => { if (!bekliyorMu) setImza(null); }} odak="[data-belge-indir] a"
        alt={<>
          <Tus tur="ikincil" disabled={bekliyorMu} onClick={() => setImza(null)}>Vazgeç</Tus>
          <label className={`${tusSinifi("birincil")} ${stil.dosyaSec}`} aria-disabled={bekliyorMu || undefined}>
            <input ref={girdi} type="file" accept="application/pdf" className="gizli" disabled={bekliyorMu} aria-label="İmzalı PDF'i yükle"
              aria-describedby={imza.hata ? IMZA_HATA : undefined} onChange={(e) => { const d = e.target.files?.[0]; if (d) yukle(d); }} />
            İmzalı PDF&apos;i yükle
          </label>
        </>}>
        <p className={pencereMetinSinifi}><b>{imza.x.ad}</b> · {imza.x.gonderen} gönderdi.</p>
        <ol className={stil.adimlar}>
          <li>PDF&apos;i indirin.</li>
          <li>E-imza aracınızla imzalayın (PDF&apos;in kendisi değişmeden imza eklenir).</li>
          <li>İmzalı PDF&apos;i yükleyin; gönderen imzalandığını görür.</li>
        </ol>
        <div className={stil.indir} data-belge-indir>
          <DosyaAcTusu dosyaId={imza.x.dosya} ikon="download" indir>PDF&apos;i indir</DosyaAcTusu>
        </div>
        {imza.hata && <p className={stil.hata} id={IMZA_HATA} role="alert">{imza.hata}</p>}
      </Pencere>}
    </>
  );
}
