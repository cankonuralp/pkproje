"use client";
/* YÖNETİM › FİRMA (348; maket yonetim.html firmaCiz): kimlik + durum rozeti + adres; "Yöneticiye yeni geçici parola" (önce sorulur; dondurulmuşta
   kapalı) ve Dondur (önce sorulur; veri silinmez) / Etkinleştir. Yeni geçici parola YALNIZ bu ekranda bir kez gösterilir. Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { BosDurum } from "../../../components/bos/BosDurum";
import { useKopyala } from "../../../components/pencere/Kopyala";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, Bolum, Kirinti, Kod, NesneBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { FirmaSatiri } from "../server/yonetim";
import { firmaDondurEylemi, firmaEtkinlestirEylemi, geciciParolaVerEylemi } from "./eylemler";
import { DEPO_AD, DEPO_NOT, DurumRozeti, firmaAdresi, tarihYaz, type DepoTuru } from "./ortak";
import { SonrasiAdimlar } from "./SonrasiAdimlar";
import stil from "./yonetim.module.css";

const YON_DURUM = { ilk: "geçici parolayla ilk giriş bekleniyor", etkin: "etkin", pasif: "hesap kapalı" } as const;

export function FirmaSayfasi({ firma: f, anaAlan, depo }: { firma: FirmaSatiri | null; anaAlan: string; depo: DepoTuru }) {
  const router = useRouter();
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

  const yeniParola = async () => {
    if (!(await onayla({ baslik: "Yeni geçici parola oluşturulsun mu?", metin: `${f.yonetici?.ad ?? "Firma yöneticisi"} şu anki parolasıyla giremez; yeni geçici parolayla girip kendi parolasını belirler.`, tus: "Oluştur" }))) return;
    baslat(async () => {
      const r = await geciciParolaVerEylemi(f.id);
      if (!r.tamam || !r.parola) { setHata(r.genel ?? "Parola oluşturulamadı."); return; }
      setHata(null); kopya.sifirla(); setParola({ deger: r.parola, eposta: r.eposta ?? "" });
      bildir("Yeni geçici parola oluşturuldu.");
      requestAnimationFrame(() => document.getElementById("yf-parola")?.scrollIntoView({ block: "center" }));
      router.refresh();
    });
  };
  const dondur = async () => {
    if (!(await onayla({ baslik: "Firma dondurulsun mu?", metin: `${adres} kapanır: firmanın kullanıcıları ve müşterileri giriş yapamaz, açık oturumları sonlanır. Veriler silinmez; istediğiniz an etkinleştirilir.`, tus: "Dondur", tehlike: true }))) return;
    baslat(async () => {
      const r = await firmaDondurEylemi(f.id);
      if (!r.tamam) { setHata(r.genel ?? "Firma dondurulamadı."); return; }
      setHata(null); setParola(null); bildir(`Firma donduruldu: ${adres}`); router.refresh();
    });
  };
  const etkinlestir = () => baslat(async () => {
    const r = await firmaEtkinlestirEylemi(f.id);
    if (!r.tamam) { setHata(r.genel ?? "Firma etkinleştirilemedi."); return; }
    setHata(null); bildir(`Firma etkinleştirildi: ${adres}`); router.refresh();
  });

  return (
    <>
      <Kirinti ogeler={[["Firmalar", "/yonetim"], [f.ad]]} />
      <NesneBasi baslik={f.ad} rozet={<DurumRozeti durum={f.durum} />} alt={adres} altIkon="building-2" tuslar={<>
        <Tus tur="ikincil" ikon="key-round" disabled={dondu || bekliyor || !f.yonetici} onClick={() => void yeniParola()}>Yöneticiye yeni geçici parola</Tus>
        {dondu
          ? <Tus ikon="circle-check" disabled={bekliyor} onClick={etkinlestir}>Etkinleştir</Tus>
          : <Tus tur="ikincil" ikon="ban" disabled={bekliyor} onClick={() => void dondur()}>Dondur</Tus>}
      </>} />
      {hata && <SeritKap><Serit tur="hata" ikon="circle-alert">{hata}</Serit></SeritKap>}
      {dondu && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Dondurulmuş: firmanın kullanıcıları ve müşterileri giriş yapamaz; veriler silinmedi.</Serit></SeritKap>}
      {parola && (
        <Bolum id="yf-b-giris" baslik="İlk giriş bilgileri">
          <SeritKap><Serit tur="uyari" ikon="triangle-alert">Geçici parola yalnız şimdi görünür; sayfadan çıkınca bir daha gösterilmez. Firma yöneticisine iletin; ilk girişte kendi parolasını belirler.</Serit></SeritKap>
          <BilgiListesi>
            <Bilgi etiket="Adres" genis="cift"><Kod>{`https://${adres}`}</Kod></Bilgi>
            <Bilgi etiket="Giriş adı" genis="cift">{parola.eposta}</Bilgi>
          </BilgiListesi>
          <p className={stil.etiketUst}>Geçici parola</p>
          <p className={stil.geciciParola} id="yf-parola"><Kod>{parola.deger}</Kod></p>
          {kopya.durum}
          <div className={stil.eylemSol}>{kopya.tus}</div>
        </Bolum>
      )}
      <Bolum id="y-b-bilgi" baslik="Firma bilgileri">
        <BilgiListesi>
          <Bilgi etiket="Ticari ünvan" genis="cift">{f.ad}</Bilgi>
          <Bilgi etiket="Adres" genis="cift"><Kod>{adres}</Kod></Bilgi>
          <Bilgi etiket="Kısa kod"><Kod>{f.kod}</Kod></Bilgi>
          <Bilgi etiket="Açılış">{tarihYaz(f.acilis)}</Bilgi>
          <Bilgi etiket="İlk firma yöneticisi">
            {f.yonetici ? <>{f.yonetici.ad}<AltSatir>{f.yonetici.eposta} · {YON_DURUM[f.yonetici.durum]}</AltSatir></> : "—"}
          </Bilgi>
          <Bilgi etiket="Kullanıcı">{String(f.kullanici)}</Bilgi>
          <Bilgi etiket="Depo" genis="cift">{DEPO_AD[depo]}<AltSatir>{DEPO_NOT}</AltSatir></Bilgi>
        </BilgiListesi>
      </Bolum>
      <SonrasiAdimlar />
    </>
  );
}
