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
import { sayfaSahibi, sayfaSayisi } from "./depo";
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

/* ── ÖNCEDEN İNDİRME (396; ARKA-UC §4.2, maket "Çevrimdışı hazır: 3 plan · son eşitleme 08:42") ── bağlantı varken kişinin önümüzdeki 7 gündeki
   planlarının ve Yeni raporlarının sayfaları arka planda açılır; servis çalışanı şifreli saklar. Açılıştan 3 sn sonra, bağlantı gelince ve 30
   dakikada bir; son indirmeden 30 dakika geçmediyse yapılmaz (sunucuyu boşuna yormasın). Son durum bu cihazda (tarayıcı deposu yoksa yalnız bu sayfada). */
export type PaketEylemi = () => Promise<{ planlar: { id: string }[]; raporlar: { id: string }[] } | null>;
interface Hazir { plan: number; zaman: string }
const HAZIR = "probata-cevrimdisi-hazir";
const ARALIK = 30 * 60_000;
const hazirOku = (): Hazir | null => { try { return JSON.parse(localStorage.getItem(HAZIR) ?? "null") as Hazir | null; } catch { return null; } };
const hazirYaz = (h: Hazir) => { try { localStorage.setItem(HAZIR, JSON.stringify(h)); } catch { /* depo yok: yalnız bu sayfada */ } };
const hazirDinleyen = new Set<() => void>();
let hazirSon: Hazir | null | undefined;
const hazirAbone = (f: () => void) => { hazirDinleyen.add(f); return () => { hazirDinleyen.delete(f); }; };
const hazirAnlik = () => (hazirSon === undefined ? (hazirSon = hazirOku()) : hazirSon);
let indiriliyor = false;
const bagliMi = () => navigator.onLine !== false;
async function onceIndir(paket: PaketEylemi): Promise<void> {
  if (indiriliyor || !bagliMi() || !("serviceWorker" in navigator)) return;
  const son = hazirAnlik();
  if (son && Date.now() - Date.parse(son.zaman) < ARALIK) return;
  indiriliyor = true;
  try {
    /* çalışan devrede değilse sayfalar saklanmaz: en çok 10 sn bekle */
    const hazirCalisan = await Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise<boolean>((c) => setTimeout(() => c(false), 10_000))]);
    if (!hazirCalisan) return;
    const p = await paket();
    if (!p) return;
    for (const a of ["/planlar", ...p.planlar.map((x) => `/planlar/${x.id}`), ...p.raporlar.map((x) => `/raporlar/${x.id}`)]) {
      if (!bagliMi()) return;
      /* gövde sonuna kadar okunur: servis çalışanı kopyasını sayfa tam gelince saklar */
      await fetch(a, { headers: { "x-probata-onindirme": "1", accept: "text/html" }, credentials: "same-origin", cache: "no-store" })
        .then((y) => y.arrayBuffer()).catch(() => undefined);
    }
    hazirSon = { plan: p.planlar.length, zaman: new Date().toISOString() };
    hazirYaz(hazirSon);
    document.documentElement.setAttribute("data-cevrimdisi-hazir", String(hazirSon.plan));
    for (const f of hazirDinleyen) f();
  } catch { /* bağlantı koptu: sonra */ } finally { indiriliyor = false; }
}

/** `yazan`: oturumdaki kişinin etiketi (sunucudan; kimlik değil) · `paket`: önceden indirilecek sayfaları veren sunucu eylemi (396) — yalnız
    SAHADA çalışana verilir (düzen karar verir); verilmezse servis çalışanı kurulmaz, önceden indirme olmaz (402: ofiste cihaz ve sunucu boşuna
    yorulmaz; kuyruk yine çalışır) */
export function CevrimdisiGosterge({ yazan, paket }: { yazan: string; paket?: PaketEylemi }) {
  const cevrimdisi = useSyncExternalStore(baglantiAbone, cevrimdisiMi, () => false);
  const k = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const [acik, setAcik] = useState(false);
  const saha = !!paket;
  useEffect(() => {
    kuyrukYazani(yazan);
    /* 395: saklanan sayfalar bu kişinin değilse silinir; servis çalışanı (bağlantısız açılan saha sayfaları) yalnız sahada çalışanda */
    void sayfaSahibi(yazan).catch(() => undefined);
    if (saha && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    return kuyrukBaslat();
  }, [yazan, saha]);
  /* son önceden indirmenin sonucu sayfanın kökünde (yenilenen sayfada da) — uçtan uca test ve ölçüm bekler */
  const hazir = useSyncExternalStore(hazirAbone, hazirAnlik, () => null);
  useEffect(() => { if (hazir) document.documentElement.setAttribute("data-cevrimdisi-hazir", String(hazir.plan)); }, [hazir]);
  useEffect(() => {
    if (!paket) return;
    const indir = () => { void onceIndir(paket); };
    const ilk = window.setTimeout(indir, 3_000);
    const tekrar = window.setInterval(indir, ARALIK);
    window.addEventListener("online", indir);
    return () => { window.clearTimeout(ilk); window.clearInterval(tekrar); window.removeEventListener("online", indir); };
  }, [paket]);
  const goster = cevrimdisi || k.isler.length > 0;
  /* telefonda şerit içeriğin üstüne binmesin (temel.css) */
  useEffect(() => {
    if (goster) document.documentElement.setAttribute("data-cevrimdisi", "var"); else document.documentElement.removeAttribute("data-cevrimdisi");
    return () => document.documentElement.removeAttribute("data-cevrimdisi");
  }, [goster]);
  if (!goster) return null;
  const bekleyen = k.isler.filter((x) => x.durum === "bekliyor").length, sorunlu = k.isler.length - bekleyen;
  /* ARKA-UC §4.3 "2 rapor, 14 fotoğraf gönderilmeyi bekliyor" (398) */
  const foto = k.isler.filter((x) => x.durum === "bekliyor" && x.tur === "rapor.foto").length;
  const neler = [bekleyen - foto ? `${bekleyen - foto} işlem` : "", foto ? `${foto} fotoğraf` : ""].filter(Boolean).join(" ve ");
  const etiket = cevrimdisi
    ? `Çevrimdışı${bekleyen ? `, ${neler} gönderilmeyi bekliyor` : ""}; ayrıntı`
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
  /* bu cihazda bağlantısız açılabilen sayfa sayısı (395; maket "Çevrimdışı hazır") — pencere açılınca */
  const [sayfa, setSayfa] = useState<number | null>(null);
  const hazir = useSyncExternalStore(hazirAbone, hazirAnlik, () => null);
  useEffect(() => { if (acik) void sayfaSayisi().then(setSayfa).catch(() => setSayfa(null)); }, [acik]);
  const bekleyen = k.isler.filter((x) => x.durum === "bekliyor").length;
  const gonder = async () => {
    const n = await kuyrukGonder();
    bildir(n ? `${n} işlem gönderildi.` : bekleyen ? "Gönderilemedi; bağlantı gelince yeniden denenecek." : "Gönderilecek işlem yok.");
  };
  const kaldir = async (x: KuyrukIsi, veriGider: boolean, soru?: { baslik: string; metin: string; tus: string }) => {
    if (veriGider && !(await onayla({ ...(soru ?? { baslik: "Listeden kaldırılsın mı?", metin: `${x.ad}: bu cihazda yazılan ve gönderilemeyen içerik silinir; geri alınamaz.`, tus: "Kaldır" }), tehlike: true }))) return;
    await kuyruktanCikar(x.id);
    bildir(`${x.ad} listeden kaldırıldı.`);
    /* kaldırılan fotoğrafı bekleyen Onaya gönder varsa artık gidebilir (398) */
    void kuyrukGonder();
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
      {hazir && <p className={stil.ipucu}>Çevrimdışı hazır: <b>{hazir.plan} plan</b> · son eşitleme {ZAMAN.format(new Date(hazir.zaman)).replace(",", "")}</p>}
      {sayfa !== null && <p className={stil.ipucu}>Bu cihazda bağlantısız açılabilen sayfa: <b>{sayfa}</b> (Planlar, plan içi ve raporlar).</p>}
      {cevrimdisi && <p className={stil.ipucu}>Bağlantı gerektirenler: son imza, onay, fotoğraftan okuma, S.A.Y. Fotoğraflar cihaza kaydedilir, rapordan önce gider.</p>}
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
                    {(x.durum === "baska_hesap" || (x.durum === "hata" && x.tur === "rapor.foto")) && <Tus tur="ikincil" onClick={() => void yenidenDene(x.id)}>Yeniden dene</Tus>}
                    {(x.durum === "eksik" || x.durum === "hata" || x.durum === "cakisma") && x.tur.startsWith("rapor.") &&
                      <Link className={stil.baglanti} href={`/raporlar/${x.kayit}`} onClick={kapat}>Raporu aç</Link>}
                    {(x.durum === "hata" || x.durum === "cakisma") && x.tur.startsWith("plan.") &&
                      <Link className={stil.baglanti} href={`/planlar/${x.kayit}`} onClick={kapat}>Planı aç</Link>}
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
