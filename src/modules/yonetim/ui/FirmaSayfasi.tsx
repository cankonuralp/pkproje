"use client";
/* YÖNETİM › FİRMA (348; maket yonetim.html firmaCiz): kimlik + durum rozeti + adres; "Yöneticiye yeni geçici parola" (önce sorulur; dondurulmuşta
   kapalı) ve Dondur (önce sorulur; veri silinmez) / Etkinleştir. Yeni geçici parola YALNIZ bu ekranda bir kez gösterilir. Karar sunucuda.
   FV9 (2026-10-16, K4) → 2026-10-25 (göç 0106): "Yapay zekâ" bölümü — aç / kapa, sınır, anahtar, kullanım (YapayZekaBolumu). Kullanıcı ve yönetici bilgisi özetten (kendi projeli firmada firmanın veritabanından); özet okunamazsa söylenir. */
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { BosDurum } from "../../../components/bos/BosDurum";
import { useKopyala } from "../../../components/pencere/Kopyala";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, Bolum, Kirinti, Kod, NesneBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { FirmaOzeti } from "../server/firma-tarafi";
import type { GonderimGorunumu } from "../server/eposta";
import type { KurulumGorunumu } from "../server/kurulum";
import { GonderimBolumu } from "./GonderimBolumu";
import { KurulumPaneli } from "./KurulumPaneli";
import type { FirmaSatiri } from "../server/yonetim";
import { firmaDondurEylemi, firmaEtkinlestirEylemi, geciciParolaVerEylemi } from "./eylemler";
import { DEPO_AD, DEPO_NOT, DurumRozeti, firmaAdresi, tarihYaz, type DepoTuru } from "./ortak";
import { SonrasiAdimlar } from "./SonrasiAdimlar";
import { YapayZekaBolumu } from "./YapayZekaBolumu";
import stil from "./yonetim.module.css";

const YON_DURUM = { ilk: "geçici parolayla ilk giriş bekleniyor", etkin: "etkin", pasif: "hesap kapalı" } as const;

/** firma bilgileri bölümü (kurulum sürerken de, bitince de aynı kimlik — ikisi aynı anda çizilmez) */
const BILGI = "y-b-bilgi";

export function FirmaSayfasi({ firma: f, ozet, kurulum = null, gonderim = null, epostaAcik = false, anaAlan, depo }: {
  firma: FirmaSatiri | null; ozet: FirmaOzeti | null; kurulum?: KurulumGorunumu | null; gonderim?: GonderimGorunumu | null; epostaAcik?: boolean;
  anaAlan: string; depo: DepoTuru;
}) {
  const onayla = useOnayla();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [parola, setParola] = useState<{ deger: string; eposta: string } | null>(null);
  const kopya = useKopyala(parola?.deger ?? null, "yf-parola");

  if (!f) {
    return (
      <>
        <Kirinti ogeler={[["Firmalar", "/yonetim"]]} />
        <h1 className="gizli" tabIndex={-1}>Firma bulunamadı</h1>
        <BosDurum ikon="circle-alert" baslik="Firma bulunamadı" metin="Bu adreste kayıtlı firma yok." eylem={{ href: "/yonetim", etiket: "Firmalara dön", ikon: "arrow-left" }} />
      </>
    );
  }
  const adres = firmaAdresi(f.kisaAd, anaAlan);
  const dondu = f.durum === "dondu";
  /* FV10: kendi projeli firmanın kurulumu sürüyor — yalnız kurulum ve kimlik (dondur / parola / anahtar kurulum bitince) */
  if (f.durum === "kurulum") {
    return (
      <>
        <Kirinti ogeler={[["Firmalar", "/yonetim"], [f.ad]]} />
        <NesneBasi baslik={f.ad} rozet={<DurumRozeti durum={f.durum} />} alt={<span className={stil.adresKod}>{adres}</span>} altIkon="building-2" />
        <KurulumPaneli id={f.id} ilk={kurulum} />
        <Bolum id={BILGI} baslik="Firma bilgileri">
          <BilgiListesi>
            <Bilgi etiket="Ticari ünvan" genis="cift">{f.ad}</Bilgi>
            <Bilgi etiket="Adres" genis="cift"><span className={stil.adresKod}>{adres}</span></Bilgi>
            <Bilgi etiket="Kısa kod"><Kod>{f.kod}</Kod></Bilgi>
            <Bilgi etiket="Veritabanı" genis="cift">Firmanın kendi Supabase projesi (Frankfurt) — kuruluyor</Bilgi>
          </BilgiListesi>
        </Bolum>
      </>
    );
  }

  /* FV10 (2026-10-16): kendi projeli firmanın yöneticisi merkezde değil, firmanın veritabanında (özet) — tuş ve metin ondan (önce f.yonetici'ye
     bakıyordu: kendi projeli firmada tuş hep kapalıydı) */
  const yonetici = ozet?.yonetici ?? f.yonetici;
  const yeniParola = async () => {
    if (!(await onayla({ baslik: "Yeni geçici parola oluşturulsun mu?", metin: `${yonetici?.ad ?? "Firma yöneticisi"} şu anki parolasıyla giremez; yeni geçici parolayla girip kendi parolasını belirler.`, tus: "Oluştur" }))) return;
    baslat(async () => {
      const r = await geciciParolaVerEylemi(f.id);
      if (!r.tamam || !r.parola) { setHata(r.genel ?? "Parola oluşturulamadı."); return; }
      setHata(null); kopya.sifirla(); setParola({ deger: r.parola, eposta: r.eposta ?? "" });
      bildir("Yeni geçici parola oluşturuldu.");
      requestAnimationFrame(() => document.getElementById("yf-parola")?.scrollIntoView({ block: "center" }));
    });
  };
  const dondur = async () => {
    if (!(await onayla({ baslik: "Firma dondurulsun mu?", metin: `${adres} kapanır: firmanın kullanıcıları ve müşterileri giriş yapamaz, açık oturumları sonlanır. Veriler silinmez; istediğiniz an etkinleştirilir.`, tus: "Dondur", tehlike: true }))) return;
    baslat(async () => {
      const r = await firmaDondurEylemi(f.id);
      if (!r.tamam) { setHata(r.genel ?? "Firma dondurulamadı."); return; }
      setHata(null); setParola(null); bildir(`Firma donduruldu: ${adres}`);
    });
  };
  const etkinlestir = () => baslat(async () => {
    const r = await firmaEtkinlestirEylemi(f.id);
    if (!r.tamam) { setHata(r.genel ?? "Firma etkinleştirilemedi."); return; }
    setHata(null); bildir(`Firma etkinleştirildi: ${adres}`);
  });
  return (
    <>
      <Kirinti ogeler={[["Firmalar", "/yonetim"], [f.ad]]} />
      <NesneBasi baslik={f.ad} rozet={<DurumRozeti durum={f.durum} />} alt={<span className={stil.adresKod}>{adres}</span>} altIkon="building-2" tuslar={<>
        <Tus tur="ikincil" ikon="key-round" disabled={dondu || bekliyor || !yonetici} onClick={() => void yeniParola()}>Yöneticiye yeni geçici parola</Tus>
        {dondu
          ? <Tus ikon="circle-check" disabled={bekliyor} onClick={etkinlestir}>Etkinleştir</Tus>
          : <Tus tur="ikincil" ikon="ban" disabled={bekliyor} onClick={() => void dondur()}>Dondur</Tus>}
      </>} />
      {hata && <SeritKap><Serit tur="hata" ikon="circle-alert">{hata}</Serit></SeritKap>}
      {dondu && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Dondurulmuş: giriş kapalı.</Serit></SeritKap>}
      {parola && (
        <Bolum id="yf-b-giris" baslik="İlk giriş bilgileri">
          <SeritKap><Serit tur="uyari" ikon="triangle-alert">Geçici parola yalnız şimdi görünür.</Serit></SeritKap>
          <BilgiListesi>
            <Bilgi etiket="Adres" genis="cift"><span className={stil.adresKod}>{`https://${adres}`}</span></Bilgi>
            <Bilgi etiket="Giriş adı" genis="cift">{parola.eposta}</Bilgi>
          </BilgiListesi>
          <p className={stil.etiketUst}>Geçici parola</p>
          <p className={stil.geciciParola} id="yf-parola"><Kod>{parola.deger}</Kod></p>
          {kopya.durum}
          <div className={stil.eylemSol}>{kopya.tus}</div>
        </Bolum>
      )}
      <Bolum id={BILGI} baslik="Firma bilgileri">
        <BilgiListesi>
          <Bilgi etiket="Ticari ünvan" genis="cift">{f.ad}</Bilgi>
          <Bilgi etiket="Adres" genis="cift"><span className={stil.adresKod}>{adres}</span></Bilgi>
          <Bilgi etiket="Kısa kod"><Kod>{f.kod}</Kod></Bilgi>
          <Bilgi etiket="Açılış">{tarihYaz(f.acilis)}</Bilgi>
          <Bilgi etiket="Firma yöneticisi">
            {yonetici ? <>{yonetici.ad}<AltSatir>{yonetici.eposta} · {YON_DURUM[yonetici.durum]}</AltSatir></> : "—"}
          </Bilgi>
          <Bilgi etiket="Kullanıcı">{String(ozet?.kullanici ?? f.kullanici)}</Bilgi>
          <Bilgi etiket="Veritabanı" genis="cift">{f.vt === "kendi" ? "Firmanın kendi Supabase projesi (Frankfurt)" : DEPO_AD[depo]}<AltSatir>{DEPO_NOT}</AltSatir></Bilgi>
        </BilgiListesi>
      </Bolum>
      <YapayZekaBolumu id={f.id} firmaAd={f.ad} yz={ozet?.yz ?? null} />
      <GonderimBolumu id={f.id} g={gonderim} acik={epostaAcik} />
      <SonrasiAdimlar />
    </>
  );
}
