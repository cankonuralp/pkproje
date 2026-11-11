"use client";
/* YÖNETİM › FİRMA (348; maket yonetim.html firmaCiz): kimlik + durum rozeti + adres; "Yöneticiye yeni geçici parola" (önce sorulur; dondurulmuşta
   kapalı) ve Dondur (önce sorulur; veri silinmez) / Etkinleştir. Yeni geçici parola YALNIZ bu ekranda bir kez gösterilir. Karar sunucuda.
   FV9 (2026-10-16, K4) → 2026-10-25 (göç 0106): "Yapay zekâ" bölümü — aç / kapa, sınır, anahtar, kullanım (YapayZekaBolumu). Kullanıcı ve yönetici bilgisi özetten (kendi projeli firmada firmanın veritabanından); özet okunamazsa söylenir.
   2026-11-11 KURULUM LİSTESİ (maket claude.ai FR9FbBjtoiKBmXpQ1yUT4K — reisim: "Onaylıyorum, yaz"; "yönetim kısmında firmaya tıklayınca çıkan ekran çok
   dağınık", "maketi hazırla, açıklamalar da olsun"): sayfa altı adım — 1 Firma açıldı · 2 İlk giriş bilgisi · 3 Yapay zekâ · 4 E-posta gönderimi ·
   5 E-imza (probata sign) · 6 Yedek. Her adım açılır kutu: numara, ad, bir satır açıklama, durum; tamamlanmamış İLK adım açık gelir. Eski bölüm
   bileşenleri adımların içinde (çıplak). "Yöneticiye yeni geçici parola" tuşu 2. adıma taşındı. Altta kapalı: S.A.Y ölçümü, firmanın kendi sitesinde
   yapacakları. Bu ekranda açıklama cümleleri reisim'in isteğiyle var (genel "açıklama yazma" kuralının istisnası). */
import { useState, useTransition, type ReactNode } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { BosDurum } from "../../../components/bos/BosDurum";
import { useKopyala } from "../../../components/pencere/Kopyala";
import { useOnayla } from "../../../components/pencere/Onay";
import { AltSatir, Bolum, Kirinti, Kod, NesneBasi, Rozet, SeritKap, type RozetTuru } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import type { FirmaOzeti, SayOlcumu } from "../server/firma-tarafi";
import type { GonderimGorunumu } from "../server/eposta";
import type { KurulumGorunumu } from "../server/kurulum";
import { GonderimBolumu } from "./GonderimBolumu";
import { KurulumPaneli } from "./KurulumPaneli";
import type { FirmaSatiri } from "../server/yonetim";
import { firmaDondurEylemi, firmaEtkinlestirEylemi, geciciParolaVerEylemi } from "./eylemler";
import { DEPO_AD, DEPO_NOT, DurumRozeti, firmaAdresi, tarihYaz, type DepoTuru } from "./ortak";
import { SonrasiAdimlar } from "./SonrasiAdimlar";
import { YapayZekaBolumu } from "./YapayZekaBolumu";
import { SignBolumu } from "./SignBolumu";
import type { SignBaglantisi } from "../server/sign";
import { YedekBolumu } from "./YedekBolumu";
import type { YedekYonetimGorunumu } from "../server/yedek";
import { SayOlcumBolumu } from "./SayOlcumBolumu";
import stil from "./yonetim.module.css";

const YON_DURUM = { ilk: "geçici parolayla ilk giriş bekleniyor", etkin: "etkin", pasif: "hesap kapalı" } as const;

/** firma bilgileri bölümü (kurulum sürerken de, bitince de aynı kimlik — ikisi aynı anda çizilmez) */
const BILGI = "y-b-bilgi";

/* KURULUM ADIMI (2026-11-11): açılır kutu — özet her zaman görünür (numara · ad + açıklama · durum), gövde adın bölgesi (ekran okuyucu ve testler
   bölgeyi adımın adıyla bulur). Açık / kapalı kullanıcının bıraktığı gibi kalır (sunucudan yenilenince de). */
type AdimDurumu = "tamam" | "bekliyor" | "eksik";
const ROZET: Record<AdimDurumu, RozetTuru> = { tamam: "tamam", bekliyor: "bekliyor", eksik: "notr" };
function Adim({ no, ad, aciklama, durum, durumAd, ilkAcik, children }: {
  no: number; ad: string; aciklama: string; durum: AdimDurumu; durumAd: string; ilkAcik: boolean; children: ReactNode;
}) {
  const [acik, setAcik] = useState(ilkAcik);
  const id = `y-adim-${no}`;
  return (
    <details className={stil.adim} data-durum={durum} open={acik} onToggle={(e) => setAcik(e.currentTarget.open)}>
      <summary className={stil.adimBas}>
        <span className={stil.adimNo} aria-hidden="true">{no}</span>
        <span className={stil.adimYazi}>
          <h3 className={stil.adimAd} id={id}>{ad}</h3>
          <span className={stil.adimAciklama}>{aciklama}</span>
        </span>
        <span className={stil.adimRozet}><Rozet tur={ROZET[durum]}>{durumAd}</Rozet></span>
      </summary>
      <div className={stil.adimGovde} role="region" aria-labelledby={id}>{children}</div>
    </details>
  );
}
/** kapalı ayrıntı kutusu (kurulum adımı değil: numarasız, durumsuz) */
function Ayrinti({ id, ad, children }: { id: string; ad: string; children: ReactNode }) {
  return (
    <details className={stil.adim}>
      <summary className={stil.adimBas}><span className={stil.adimYazi}><h3 className={stil.adimAd} id={id}>{ad}</h3></span></summary>
      <div className={stil.adimGovde} role="region" aria-labelledby={id}>{children}</div>
    </details>
  );
}

export function FirmaSayfasi({ firma: f, ozet, kurulum = null, gonderim = null, epostaAcik = false, ortakAlan = null, anaAlan, depo, olcum = null, yedek = null, sign = null }: {
  firma: FirmaSatiri | null; ozet: FirmaOzeti | null; kurulum?: KurulumGorunumu | null; gonderim?: GonderimGorunumu | null; epostaAcik?: boolean; olcum?: SayOlcumu | null;
  /** 2026-11-11 (göç 0126): probata'nın ortak gönderen alan adı (yerelde null) */
  ortakAlan?: string | null;
  /** 2026-11-04: Yedek bölümü (okunamazsa null — bölüm söyler) */
  yedek?: YedekYonetimGorunumu | null;
  /** 2026-11-05 (göç 0122): probata sign bağlantısı (okunamazsa null — bölüm söyler) */
  sign?: SignBaglantisi | null;
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
  /* KURULUM ADIMLARI: durumlar kayıtlardan; tamamlanmamış ilk adım açık gelir */
  const yz = ozet?.yz ?? null;
  const yb = yedek?.baglanti ?? null;
  const adimlar: { ad: string; aciklama: string; durum: AdimDurumu; durumAd: string; govde: ReactNode }[] = [
    { ad: "Firma açıldı", aciklama: "Firmanın adresi ve veritabanındaki yeri hazır. Hazır ekipman türleri ve rapor formatları firma ilk girişte kendiliğinden kurulur.",
      durum: "tamam", durumAd: "Tamam", govde: (
        <BilgiListesi>
          <Bilgi etiket="Ticari ünvan" genis="cift">{f.ad}</Bilgi>
          <Bilgi etiket="Adres" genis="cift"><span className={stil.adresKod}>{adres}</span></Bilgi>
          <Bilgi etiket="Kısa kod"><Kod>{f.kod}</Kod></Bilgi>
          <Bilgi etiket="Açılış">{tarihYaz(f.acilis)}</Bilgi>
          <Bilgi etiket="Kullanıcı">{String(ozet?.kullanici ?? f.kullanici)}</Bilgi>
          <Bilgi etiket="Veritabanı" genis="cift">{f.vt === "kendi" ? "Firmanın kendi Supabase projesi (Frankfurt)" : DEPO_AD[depo]}<AltSatir>{DEPO_NOT}</AltSatir></Bilgi>
        </BilgiListesi>
      ) },
    { ad: "İlk giriş bilgisi firmaya iletildi", aciklama: "Firma yöneticisi bu bilgilerle girer ve ilk girişte kendi parolasını belirler. Geçici parolayı firmaya siz iletirsiniz.",
      durum: yonetici?.durum === "etkin" ? "tamam" : yonetici?.durum === "ilk" ? "bekliyor" : "eksik",
      durumAd: yonetici?.durum === "etkin" ? "Giriş yaptı" : yonetici?.durum === "ilk" ? "Henüz giriş yapmadı" : yonetici ? "Hesap kapalı" : "Yönetici yok",
      govde: (
        <>
          <BilgiListesi>
            <Bilgi etiket="Giriş adresi" genis="cift"><span className={stil.adresKod}>{`https://${adres}/giris`}</span></Bilgi>
            <Bilgi etiket="Firma yöneticisi">{yonetici ? <>{yonetici.ad}<AltSatir>{YON_DURUM[yonetici.durum]}</AltSatir></> : "—"}</Bilgi>
            <Bilgi etiket="Giriş adı">{yonetici?.eposta ?? "—"}</Bilgi>
          </BilgiListesi>
          {parola && (
            <>
              <SeritKap><Serit tur="uyari" ikon="triangle-alert">Geçici parola yalnız şimdi görünür.</Serit></SeritKap>
              <p className={stil.etiketUst}>Geçici parola</p>
              <p className={stil.geciciParola} id="yf-parola"><Kod>{parola.deger}</Kod></p>
              {kopya.durum}
              <div className={stil.eylemSol}>{kopya.tus}</div>
            </>
          )}
          <p className={stil.adimNot}>Parolayı kaçırdıysanız ya da firma unuttuysa yenisini üretin; eskisi geçersiz olur. Firma yöneticisi giriş yapınca bu adım kendiliğinden tamamlanır.</p>
          <div className={stil.eylemSol}>
            <Tus tur="ikincil" ikon="key-round" disabled={dondu || bekliyor || !yonetici} onClick={() => void yeniParola()}>Yeni geçici parola üret</Tus>
          </div>
        </>
      ) },
    { ad: "Yapay zekâ", aciklama: "S.A.Y ve fotoğraftan okuma bu anahtarla çalışır; ücreti anahtarın sahibine yazılır. Anahtarın süresi biterse yalnız buradan değiştirirsiniz.",
      durum: yz?.tanimli && yz.acik ? "tamam" : yz?.tanimli ? "bekliyor" : "eksik",
      durumAd: !yz ? "Okunamadı" : yz.tanimli && yz.acik ? `Açık · ••••${yz.son4 ?? ""}` : yz.tanimli ? "Anahtar var · kapalı" : "Eksik",
      govde: <YapayZekaBolumu ciplak id={f.id} firmaAd={f.ad} yz={yz} /> },
    { ad: "E-posta gönderimi", aciklama: "Teklif, sözleşme ve plan e-postaları firmanın adıyla gider. Kurulana kadar e-postalar sırada bekler.",
      durum: gonderim?.durum === "dogrulandi" ? "tamam" : gonderim ? "bekliyor" : "eksik",
      durumAd: gonderim?.durum === "dogrulandi" ? "Açık" : gonderim ? "Doğrulanmadı" : "Eksik",
      govde: <GonderimBolumu ciplak id={f.id} g={gonderim} acik={epostaAcik} ortakAlan={ortakAlan} kisaAd={f.kisaAd} firmaAd={f.ad} /> },
    { ad: "E-imza (probata sign)", aciklama: "Raporlar ve belgeler probata'nın içinden e-imzayla imzalanır. Bağlanana kadar firma PDF indirip imzalar ve yükler. Bu adımın yarısı sign'ın kendi panelinde yapılır.",
      durum: sign?.etkin ? "tamam" : "eksik", durumAd: sign?.etkin ? "Bağlı" : sign ? "Eksik" : "Okunamadı",
      govde: <SignBolumu ciplak id={f.id} s={sign} /> },
    { ad: "Yedek", aciklama: "İmzalı raporlar ve veriler firmanın kendi Google Drive ya da OneDrive hesabına kopyalanır. Firma kendi hesabıyla bağladığı için bu adımı yalnız firma yapabilir.",
      durum: yb?.durum === "bagli" ? "tamam" : "bekliyor",
      durumAd: yb?.durum === "bagli" ? "Bağlı" : yb?.durum === "kopuk" ? "Bağlantı koptu" : yb?.durum === "dolu" ? "Alan doldu" : "Firma bağlamadı",
      govde: (
        <>
          <p className={stil.adimNot}>Firmaya söyleyeceğiniz yol: Firma ayarları › Yedek › Google Drive&apos;ı bağla. Bağlanana kadar veriler probata&apos;nın arşivinde durur; kayıp olmaz. Firma bağlayınca bu adım kendiliğinden tamamlanır.</p>
          <YedekBolumu ciplak id={f.id} kisaAd={f.kisaAd} y={yedek} />
        </>
      ) },
  ];
  const tamam = adimlar.filter((a) => a.durum === "tamam").length;
  const ilkEksik = adimlar.findIndex((a) => a.durum !== "tamam");
  return (
    <>
      <Kirinti ogeler={[["Firmalar", "/yonetim"], [f.ad]]} />
      <NesneBasi baslik={f.ad} rozet={<DurumRozeti durum={f.durum} />} alt={<span className={stil.adresKod}>{adres}</span>} altIkon="building-2" tuslar={<>
        {anaAlan !== "localhost" && !dondu && <TusBaglanti href={`https://${adres}`} yeniSekme>Firmanın sitesini aç</TusBaglanti>}
        {dondu
          ? <Tus ikon="circle-check" disabled={bekliyor} onClick={etkinlestir}>Etkinleştir</Tus>
          : <Tus tur="ikincil" ikon="ban" disabled={bekliyor} onClick={() => void dondur()}>Dondur</Tus>}
      </>} />
      {hata && <SeritKap><Serit tur="hata" ikon="circle-alert">{hata}</Serit></SeritKap>}
      {dondu && <SeritKap><Serit tur="uyari" ikon="triangle-alert">Dondurulmuş: giriş kapalı.</Serit></SeritKap>}
      <Bolum id="y-b-adimlar" baslik="Kurulum" sayac={<span className={stil.sayacEk}>{`${adimlar.length} adımdan ${tamam}'i tamam`}</span>}>
        <div className={stil.adimListe}>
          {adimlar.map((a, i) => (
            <Adim key={a.ad} no={i + 1} ad={a.ad} aciklama={a.aciklama} durum={a.durum} durumAd={a.durumAd} ilkAcik={i === ilkEksik}>{a.govde}</Adim>
          ))}
        </div>
      </Bolum>
      <Bolum id="y-b-ayrinti" baslik="Ayrıntılar">
        <div className={stil.adimListe}>
          <Ayrinti id="y-ayr-say" ad="S.A.Y işleri ve öğrenme (son 30 gün)"><SayOlcumBolumu ciplak id={f.id} firmaKod={f.kisaAd} olcum={olcum} /></Ayrinti>
          <Ayrinti id="y-ayr-sonra" ad="Sonrası firmanın kendi sitesinde"><SonrasiAdimlar ciplak /></Ayrinti>
        </div>
      </Bolum>
    </>
  );
}
