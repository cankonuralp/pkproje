"use client";
/* PROBATA SIGN İMZA ŞERİDİ (2026-11-05, göç 0122; tasarım 59EF1ZZAJZdg6BztvuiWbr — rapor ekranı 3): firmada probata sign açıkken imza buradan başlar.
   · Bekliyor → İmza ekranını aç · Durumu yenile · İptal et. sign webhook'u gelince rapor kendiliğinden ilerler; gecikirse "Durumu yenile".
   · Reddedildi / iptal / denetimden geçmedi → nedeni şeritte, "İmzala" yeniden.
   · K2: "PDF ile imzala" yedek yolu (bugünkü indir / yükle) — elle verilirse görünür. Muayene uzmanı (uzman) ve teknik yönetici (teknik) aynı şerit.
   2026-11-07 GÖMÜLÜ İMZA (reisim: "imza ekranı yeni sekmede değil, probata'nın kendi sayfasında bir iframe içinde açılacak"; sign bağlantı rehberi §4,
   §7): "İmzala" ve toplu imza yeni sekme açmaz — SignPenceresi probata'nın içinde iframe'li pencere (allow GOMULU_IZIN aynen; sandbox yok). sign'ın
   haberleri (window "message") YALNIZ açılan adresin kökeninden ve çerçevenin kendisinden alınır (signHaberi); haber yalnız ekranı günceller —
   raporun durumu webhook / Durumu yenile ile değişir. Gömülü adres yoksa (sign'da firmanın web adresi tanımlı değil) yedek: aynı pencerede
   "İmza ekranını yeni sekmede aç" (kişinin kendi tıklaması — açılır pencere engeline takılmaz). Kilit tests/sign-gomulu.test.ts.
   2026-11-10 (rehber §4): bitiş haberinde (imzalandi · reddedildi · toplu_bitti) pencere KAPANIS_MS sonra kendiliğinden kapanır, "kapat" haberinde
   hemen (sign-haber.ts kapanis); her kapanışta liste tazelenir, IKINCI_TAZELEME_MS sonra — tek imzada durum hâlâ "bekliyor"sa — bir kez daha. */
import { useEffect, useId, useRef, useState, useTransition, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Ikon } from "../../../components/ikon/Ikon";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import { GOMULU_IZIN, IKINCI_TAZELEME_MS, KAPANIS_MS, kapanis, kokeni, signHaberi, type SignHaberi } from "../sign-haber";
import type { SignEkrani } from "../server/sign";
import { signImzalaEylemi, signIptalEylemi, signTopluAdresiEylemi, signTopluEylemi, signYenileEylemi } from "./eylemler";
import stil from "./sign.module.css";

const AG = "Bağlantı ya da sunucu hatası; yeniden deneyin.";

/** açık pencere: gömülü adres (iframe) ve yeni sekme yedeği; ikisi de yoksa hazırlanıyor */
interface Acik { gomulu: string | null; yedek: string | null }

/** sign'ın imza ekranı probata'nın içinde: iframe (allow aynen), haberler yalnız açılan adresin kökeninden ve bu çerçeveden. Bitiş haberinde
    pencere KAPANIS_MS sonra, "kapat" haberinde hemen kapanır (kapat — listeyi tazeleyen çağıranın işlevi); haber çağırana yalnız bildirim için gider */
export function SignPenceresi({ acik, baslik, haber, kapat }: { acik: Acik; baslik: string; haber: (h: SignHaberi) => void; kapat: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const cerceve = useRef<HTMLIFrameElement>(null);
  const baslikId = useId();
  const [hazir, setHazir] = useState(false);
  const haberRef = useRef(haber), kapatRef = useRef(kapat);
  useEffect(() => { haberRef.current = haber; kapatRef.current = kapat; }, [haber, kapat]);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => { if (d?.open) d.close(); };
  }, []);
  useEffect(() => {
    const koken = kokeni(acik.gomulu);
    let sayac: number | undefined;
    const dinle = (e: MessageEvent) => {
      if (!cerceve.current || e.source !== cerceve.current.contentWindow) return;
      const h = signHaberi(e, koken);
      if (!h) return;
      if (h.tur === "hazir") { setHazir(true); return; }
      haberRef.current(h);
      const k = kapanis(h.tur);
      if (k === "hemen") { window.clearTimeout(sayac); kapatRef.current(); }
      else if (k === "gecikmeli" && sayac === undefined) sayac = window.setTimeout(() => kapatRef.current(), KAPANIS_MS);
    };
    window.addEventListener("message", dinle);
    return () => { window.removeEventListener("message", dinle); window.clearTimeout(sayac); };
  }, [acik.gomulu]);
  return (
    <dialog ref={ref} className={stil.pencere} aria-labelledby={baslikId} data-sign-hazir={hazir ? "" : undefined}
      onCancel={(e) => { e.preventDefault(); kapat(); }}>
      <div className={stil.bas}>
        <h2 id={baslikId}>{baslik}</h2>
        {acik.gomulu && acik.yedek && <TusBaglanti href={acik.yedek} yeniSekme>Yeni sekmede aç</TusBaglanti>}
        <Tus tur="ikincil" aria-label="Kapat" title="Kapat" onClick={kapat}><Ikon ad="x" kucuk /></Tus>
      </div>
      {acik.gomulu ? (
        <iframe ref={cerceve} className={stil.cerceve} src={acik.gomulu} title="probata sign imza ekranı" allow={GOMULU_IZIN} />
      ) : acik.yedek ? (
        <div className={stil.yedek}>
          <TusBaglanti tur="birincil" ikon="file-signature" href={acik.yedek} yeniSekme>İmza ekranını yeni sekmede aç</TusBaglanti>
        </div>
      ) : (
        <div className={stil.yedek} role="status">Hazırlanıyor…</div>
      )}
    </dialog>
  );
}

export function SignImzaSeridi({ raporId, asama, sign, baslik, mesgul, baslat, yenile, hata, elle }: {
  raporId: string; asama: "uzman" | "teknik"; sign: SignEkrani; baslik: string; mesgul: boolean; baslat: TransitionStartFunction;
  yenile: () => void; hata: (m: string | null) => void; elle?: () => void;
}) {
  const bildir = useBildir();
  const [pen, setPen] = useState<Acik | null>(null);
  const durum = useRef(sign.durum), ikinci = useRef<number | undefined>(undefined);
  useEffect(() => { durum.current = sign.durum; }, [sign.durum]);
  useEffect(() => () => window.clearTimeout(ikinci.current), []);
  /* pencere kapandı (haberle ya da elle): liste tazelenir; webhook gecikmişse — durum hâlâ "bekliyor" — kısa süre sonra bir kez daha */
  const penKapat = () => {
    setPen(null);
    yenile();
    window.clearTimeout(ikinci.current);
    ikinci.current = window.setTimeout(() => { if (durum.current === "bekliyor") yenile(); }, IKINCI_TAZELEME_MS);
  };
  const imzala = () => {
    setPen({ gomulu: null, yedek: null });
    baslat(async () => {
      try {
        const r = await signImzalaEylemi(raporId, asama);
        if (r.tamam && (r.gomulu || r.baglanti)) { hata(null); setPen({ gomulu: r.gomulu ?? null, yedek: r.baglanti ?? null }); yenile(); }
        else { setPen(null); hata(r.genel ?? "probata sign'da imza başlatılamadı."); }
      } catch { setPen(null); hata(AG); }
    });
  };
  /* sign'ın haberi: yalnız bildirim — pencereyi SignPenceresi kapatır (penKapat), kesin sonuç webhook'tan */
  const haber = (h: SignHaberi) => {
    if (h.tur === "imzalandi") bildir("İmza atıldı; rapor birkaç saniye içinde ilerler.");
    else if (h.tur === "reddedildi") hata("probata sign'da imza reddedildi.");
  };
  const yenileSor = () => baslat(async () => {
    try {
      const r = await signYenileEylemi(raporId, asama);
      if (r.tamam) { hata(null); bildir(r.bildirim ?? "Güncellendi."); yenile(); } else { hata(r.genel ?? "Durum alınamadı."); yenile(); }
    } catch { hata(AG); }
  });
  const iptal = () => baslat(async () => {
    try {
      const r = await signIptalEylemi(raporId, asama);
      if (r.tamam) { hata(null); bildir(r.bildirim ?? "İptal edildi."); yenile(); } else hata(r.genel ?? "İptal edilemedi.");
    } catch { hata(AG); }
  });
  const pencere = pen && <SignPenceresi acik={pen} baslik={`${baslik} · probata sign`} haber={haber} kapat={penKapat} />;
  if (sign.durum === "bekliyor") {
    return (
      <>
        <Serit tur="bilgi" ikon="clock" eylem={<>
          <Tus ikon="file-signature" disabled={mesgul} onClick={imzala}>İmza ekranını aç</Tus>
          <Tus tur="ikincil" ikon="refresh-cw" disabled={mesgul} onClick={yenileSor}>Durumu yenile</Tus>
          <Tus tur="ikincil" ikon="circle-x" disabled={mesgul} onClick={iptal}>İptal et</Tus>
        </>}>
          {baslik} · probata sign&apos;da imza bekliyor
        </Serit>
        {pencere}
      </>
    );
  }
  return (
    <>
      <Serit tur="uyari" ikon="file-signature" eylem={<>
        <Tus ikon="file-signature" disabled={mesgul} onClick={imzala}>İmzala</Tus>
        {elle && <Tus tur="ikincil" disabled={mesgul} onClick={elle}>PDF ile imzala</Tus>}
      </>}>
        {baslik} · probata sign · e-imza{sign.neden ? <> · {sign.neden}</> : null}
      </Serit>
      {pencere}
    </>
  );
}

/** TOPLU İMZA (sign; sınır 200 — sign kurallar.ts TOPLU_EN_COK): seçilen raporlar 10'ar 10'ar sign'a gönderilir (her biri için imzasız PDF bir kez
    üretilir), istekler imzalayanın sign üyeliğine bağlanır; sonra sign'ın toplu imzası (adres sign'dan, imzalayanın e-postasıyla — 60 dk geçerli)
    probata'nın içinde gömülü pencerede açılır (PIN bir kez). İmzalanan her rapor sign'ın bildirimiyle kendiliğinden ilerler; "toplu_bitti" haberi
    yalnız ekranı tazeler. Üyeliği bulunmayan raporlar rapor rapor "İmzala" ile açılır. */
const TOPLU_EN_COK = 200, PARCA = 10;
export function SignTopluTus({ idler, asama, bitti }: { idler: readonly string[]; asama: "uzman" | "teknik"; bitti: () => void }) {
  const bildir = useBildir();
  const [mesgul, baslat] = useTransition();
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [pen, setPen] = useState<Acik | null>(null);
  const ikinci = useRef<number | undefined>(undefined);
  /* pencere kapandı (haberle ya da elle): liste tazelenir; imzalanan raporlar webhook'la ilerler — gecikmesine karşı kısa süre sonra bir kez daha
     (sayaç tuş kalkınca TEMİZLENMEZ: ilk tazeleme seçimi boşaltıp tuşu kaldırabilir, ikinci tazeleme listenin işi) */
  const penKapat = () => {
    setPen(null);
    bitti();
    window.clearTimeout(ikinci.current);
    ikinci.current = window.setTimeout(bitti, IKINCI_TAZELEME_MS);
  };
  const tikla = () => {
    const l = idler.slice(0, TOPLU_EN_COK);
    /* 2026-11-09 (reisim: "tek rapor seçipte imzalayabilmeliyim illa içine girmeme gerek kalmaması lazım"): tek rapor, raporun içindeki "İmzala"nın aynısı */
    if (l.length === 1) {
      setPen({ gomulu: null, yedek: null });
      baslat(async () => {
        try {
          const r = await signImzalaEylemi(l[0]!, asama);
          if (r.tamam && (r.gomulu || r.baglanti)) setPen({ gomulu: r.gomulu ?? null, yedek: r.baglanti ?? null });
          else { setPen(null); bildir(r.genel ?? "probata sign'da imza başlatılamadı."); }
        } catch { setPen(null); bildir(AG); }
      });
      return;
    }
    baslat(async () => {
      const belgeler: string[] = [], hatalar: string[] = [];
      let uyeDegil = 0, genel: string | null = null;
      try {
        for (let i = 0; i < l.length; i += PARCA) {
          setIlerleme(`Gönderiliyor ${Math.min(i + PARCA, l.length)} / ${l.length}`);
          const r = await signTopluEylemi(l.slice(i, i + PARCA), asama);
          if (!r.tamam) { genel = r.genel ?? "probata sign'a gönderilemedi."; break; }
          belgeler.push(...(r.belgeler ?? [])); uyeDegil += r.uyeDegil ?? 0; hatalar.push(...(r.hatalar ?? []).map((h) => h.neden));
          if (r.dur) break;
        }
        const t = belgeler.length ? await signTopluAdresiEylemi(belgeler) : null;
        const kabul = t?.tamam ? t.belgeler?.length ?? belgeler.length : 0;
        if (t?.tamam && (t.gomulu || t.baglanti)) setPen({ gomulu: t.gomulu ?? null, yedek: t.baglanti ?? null });
        else if (t && !t.tamam) genel = genel ?? t.genel ?? "probata sign toplu imzayı açamadı.";
        const parca = [
          genel ?? "",
          kabul ? `${kabul} rapor probata sign'ın toplu imzasında; PIN'i bir kez girip imzalayın.` : "",
          kabul && kabul < belgeler.length ? `${belgeler.length - kabul} rapor probata sign'da kabul edilmedi.` : "",
          idler.length > TOPLU_EN_COK ? `Bir seferde en çok ${TOPLU_EN_COK} rapor; kalan ${idler.length - TOPLU_EN_COK} rapor için yeniden seçin.` : "",
          uyeDegil ? `${uyeDegil} raporda sign üyeliğiniz bulunamadı; onları raporun “İmzala” tuşuyla açın.` : "",
          hatalar.length ? `${hatalar.length} rapor gönderilemedi: ${[...new Set(hatalar)].slice(0, 3).join(" · ")}` : "",
        ].filter(Boolean);
        bildir(parca.join(" ") || "Gönderilecek rapor yok.");
      } catch { bildir(AG); } finally { setIlerleme(null); }
    });
  };
  /* sign'ın haberi: yalnız bildirim — pencereyi SignPenceresi kapatır (penKapat); imzalanan raporlar webhook'la ilerler */
  const haber = (h: SignHaberi) => {
    if (h.tur === "toplu_bitti") bildir(`${h.imzalanan.length} rapor imzalandı${h.atlanan.length ? `, ${h.atlanan.length} rapor atlandı` : ""}; raporlar birkaç saniye içinde ilerler.`);
    else if (h.tur === "imzalandi") bildir("İmza atıldı; raporlar birkaç saniye içinde ilerler.");
  };
  return (
    <>
      <Tus ikon="file-signature" disabled={mesgul || !idler.length} aria-busy={mesgul || undefined} onClick={tikla}>{ilerleme ?? "probata sign ile imzala"}</Tus>
      {pen && <SignPenceresi acik={pen} baslik={idler.length === 1 ? "İmza · probata sign" : "Toplu imza · probata sign"} haber={haber} kapat={penKapat} />}
    </>
  );
}
