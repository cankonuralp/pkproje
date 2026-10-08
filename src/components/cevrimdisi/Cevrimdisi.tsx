"use client";
/* ÇEVRİMDIŞI GÖSTERGESİ (394; maket Z4 maket-ortak.js "Çevrimdışı · n bekliyor" + "Çevrimdışı" penceresi, ARKA-UC §4.3) — üst çubukta:
   · bağlantı yokken "Çevrimdışı" (bekleyen varsa "· n bekliyor"); bağlantı varken yalnız bekleyen ya da sonuç bekleyen iş varsa "Bekleyen işlem · n";
   · tıklayınca pencere: ne olduğunu söyleyen şerit, bekleyen işler (ad, zaman, durum, ileti) ve iş başına seçim — çakışmada "Benimkini yaz" /
     "Sunucudakini kullan", eksik / hatada "Raporu aç" / "Listeden kaldır"; veri kaybettiren seçim önce sorar;
   · telefonda (< 600) üst çubuğa sığmaz → üst çubuğun hemen altında tam genişlik şerit (maket), içerik şerit kadar aşağı iner (temel.css).
   Kuyruk ve gönderme kuyruk.ts'te; bu bileşen yalnız gösterir ve seçimi iletir. */
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useBildir } from "../bildirim/Bildirim";
import { Ikon } from "../ikon/Ikon";
import { useOnayla } from "../pencere/Onay";
import { Pencere } from "../pencere/Pencere";
import { Rozet, type RozetTuru } from "../sayfa/Sayfa";
import { Serit } from "../serit/Serit";
import { Tus } from "../tus/Tus";
import {
  benimkiniYaz, kuyrukAbone, kuyrukAnlik, kuyrukBaslat, kuyrukGonder, kuyrukSunucuAnlik, kuyruktanCikar, kuyrukYazani, yenidenDene, type IsDurumu, type KuyrukIsi,
} from "./kuyruk";
import stil from "./Cevrimdisi.module.css";

const baglantiAbone = (f: () => void) => {
  window.addEventListener("online", f); window.addEventListener("offline", f);
  return () => { window.removeEventListener("online", f); window.removeEventListener("offline", f); };
};
const cevrimdisiMi = () => navigator.onLine === false;

const ZAMAN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const DURUM: Record<IsDurumu, [RozetTuru, string]> = {
  bekliyor: ["bekliyor", "Gönderilmeyi bekliyor"], cakisma: ["red", "Çakışma"], eksik: ["bekliyor", "Gönderilmedi"], hata: ["red", "Yapılamadı"],
  baska_hesap: ["notr", "Başka hesap"],
};

/** `yazan`: oturumdaki kişinin etiketi (sunucudan; kimlik değil) */
export function CevrimdisiGosterge({ yazan }: { yazan: string }) {
  const cevrimdisi = useSyncExternalStore(baglantiAbone, cevrimdisiMi, () => false);
  const k = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const [acik, setAcik] = useState(false);
  useEffect(() => { kuyrukYazani(yazan); return kuyrukBaslat(); }, [yazan]);
  const goster = cevrimdisi || k.isler.length > 0;
  /* telefonda şerit içeriğin üstüne binmesin (temel.css) */
  useEffect(() => {
    if (goster) document.documentElement.setAttribute("data-cevrimdisi", "var"); else document.documentElement.removeAttribute("data-cevrimdisi");
    return () => document.documentElement.removeAttribute("data-cevrimdisi");
  }, [goster]);
  if (!goster) return null;
  const bekleyen = k.isler.filter((x) => x.durum === "bekliyor").length, sorunlu = k.isler.length - bekleyen;
  const etiket = cevrimdisi
    ? `Çevrimdışı${bekleyen ? `, ${bekleyen} işlem gönderilmeyi bekliyor` : ""}; ayrıntı`
    : `${k.isler.length} bekleyen işlem${sorunlu ? `, ${sorunlu} tanesi sizi bekliyor` : ""}; ayrıntı`;
  return (
    <>
      <button className={`${stil.cip} ${cevrimdisi || sorunlu ? stil.uyari : ""}`} type="button" aria-haspopup="dialog" aria-label={etiket} onClick={() => setAcik(true)}>
        <Ikon ad={cevrimdisi ? "wifi-off" : "cloud-upload"} kucuk />
        <span>{cevrimdisi ? "Çevrimdışı" : "Bekleyen işlem"}</span>
        {(cevrimdisi ? bekleyen : k.isler.length) > 0 && <span className={stil.sayi}>{cevrimdisi ? bekleyen : k.isler.length}<span className={stil.en}>{cevrimdisi ? " bekliyor" : ""}</span></span>}
      </button>
      <KuyrukPenceresi acik={acik} kapat={() => setAcik(false)} cevrimdisi={cevrimdisi} />
    </>
  );
}

function KuyrukPenceresi({ acik, kapat, cevrimdisi }: { acik: boolean; kapat: () => void; cevrimdisi: boolean }) {
  const k = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const bildir = useBildir();
  const onayla = useOnayla();
  const bekleyen = k.isler.filter((x) => x.durum === "bekliyor").length;
  const gonder = async () => {
    const n = await kuyrukGonder();
    bildir(n ? `${n} işlem gönderildi.` : bekleyen ? "Gönderilemedi; bağlantı gelince yeniden denenecek." : "Gönderilecek işlem yok.");
  };
  const kaldir = async (x: KuyrukIsi, veriGider: boolean, soru?: { baslik: string; metin: string; tus: string }) => {
    if (veriGider && !(await onayla({ ...(soru ?? { baslik: "Listeden kaldırılsın mı?", metin: `${x.ad}: bu cihazda yazılan ve gönderilemeyen içerik silinir; geri alınamaz.`, tus: "Kaldır" }), tehlike: true }))) return;
    await kuyruktanCikar(x.id);
    bildir(`${x.ad} listeden kaldırıldı.`);
  };
  return (
    <Pencere acik={acik} baslik={cevrimdisi ? "Çevrimdışı" : "Bekleyen işlemler"} onKapat={kapat}
      alt={<>
        {!cevrimdisi && bekleyen > 0 && <Tus ikon="cloud-upload" disabled={k.gonderiliyor} onClick={() => void gonder()}>Şimdi gönder</Tus>}
        <Tus tur="ikincil" data-ilk-odak onClick={kapat}>Kapat</Tus>
      </>}>
      {cevrimdisi && <Serit tur="bilgi" ikon="wifi-off">İnternet yok. Yaptıklarınız bu cihaza kaydedilir (uygulama kapansa da kaybolmaz) ve bağlantı gelince sırayla gönderilir.</Serit>}
      {k.depoYok && <Serit tur="uyari" ikon="triangle-alert">Bu tarayıcı cihaz deposuna izin vermiyor (gizli pencere ya da kapalı site verisi): bekleyenler yalnız bu sayfa açıkken durur.</Serit>}
      {k.oturum && <Serit tur="uyari" ikon="log-in">Oturumunuz kapandı; yeniden giriş yapınca bekleyenler gönderilir.</Serit>}
      {k.saatFarkiDk !== null && <Serit tur="uyari" ikon="clock">Cihazınızın saati sunucudan {Math.abs(k.saatFarkiDk)} dakika {k.saatFarkiDk > 0 ? "ileri" : "geri"}. Rapordaki resmî tarihler sunucu saatinden yazılır; cihaz saatini düzeltin.</Serit>}
      {cevrimdisi && <p className={stil.ipucu}>Bağlantı gerektirenler: son imza, onay, fotoğraftan okuma, S.A.Y.</p>}
      {k.isler.length ? (
        <>
          <p className={stil.baslik}>Bekleyen işler ({k.isler.length})</p>
          <ol className={stil.liste}>
            {k.isler.map((x) => (
              <li key={x.id} className={stil.is}>
                <span className={stil.isBas}><Ikon ad="cloud-upload" kucuk /><b>{x.ad}</b><Rozet tur={DURUM[x.durum][0]}>{DURUM[x.durum][1]}</Rozet></span>
                <span className={stil.alt}>{ZAMAN.format(new Date(x.zaman)).replace(",", "")}{x.ileti ? ` · ${x.ileti}` : ""}</span>
                {x.durum !== "bekliyor" && (
                  <span className={stil.tuslar}>
                    {x.durum === "cakisma" && <>
                      <Tus onClick={() => void benimkiniYaz(x.id).then(() => bildir(`${x.ad}: sizin yazdığınız gönderiliyor.`))}>Benimkini yaz</Tus>
                      <Tus tur="ikincil" onClick={() => void kaldir(x, true, { baslik: "Sunucudaki kullanılsın mı?",
                        metin: `${x.ad}: bu cihazda yazdıklarınız silinir, raporun sunucudaki hâli kalır; geri alınamaz.`, tus: "Sunucudakini kullan" })}>Sunucudakini kullan</Tus>
                    </>}
                    {x.durum === "baska_hesap" && <Tus tur="ikincil" onClick={() => void yenidenDene(x.id)}>Yeniden dene</Tus>}
                    {(x.durum === "eksik" || x.durum === "hata" || x.durum === "cakisma") && x.tur.startsWith("rapor.") &&
                      <Link className={stil.baglanti} href={`/raporlar/${x.kayit}`} onClick={kapat}>Raporu aç</Link>}
                    {x.durum !== "cakisma" && <Tus tur="ikincil" onClick={() => void kaldir(x, x.durum !== "eksik")}>Listeden kaldır</Tus>}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </>
      ) : <p className={stil.bos}>Gönderilmeyi bekleyen işlem yok.</p>}
    </Pencere>
  );
}
