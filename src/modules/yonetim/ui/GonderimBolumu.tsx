"use client";
/* YÖNETİM › FİRMA › E-POSTA GÖNDERİMİ (FIRMA-VT §5.8; FV11 — 2026-10-16, K2). Reisim (579): "resend için tek seçenek var ve o da firmaların kendi mail
   adresleri ile mail atılması". Alan adı + genel adresin yerel kısmı → "Alan adını ekle" (probata'nın Resend hesabına); Resend'in DNS kayıtları tabloda
   (her değer kopyalanır — firmanın alan adı yönetimine girilir); "Doğrula" Resend'e denetletir, doğrulanınca gönderme anahtarı firmaya kilitli yazılır
   (Firma ayarlarında değiştirilmez — K3). Alan adı değiştirilebilir (yeni alan doğrulanana dek e-postalar bekler). Resend anahtarı sunucuda yoksa kapalı.
   2026-11-11 (göç 0126; maket onaylı — reisim: "Onaylıyorum, yaz"): İKİ YOL — "probata.com.tr üzerinden" (probata'nın ortak alan adı: adres
   <kısa ad>@<ortak alan>, tek tuş, firmanın DNS'i yok) ya da "Firmanın kendi alan adından" (yukarıdaki akış). Ortak alan adı tanımlı değilse (yerel
   geliştirme) yalnız ikinci yol görünür. Ortak yolda DNS kayıtları gösterilmez (probata'nın kendi kayıtları). */
import { useState, useTransition } from "react";
import { Bilgi, BilgiListesi } from "../../../components/bilgi/Bilgi";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Alan, Girdi } from "../../../components/form/Form";
import { Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, Kod, Rozet, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { DnsKaydi, GonderimGorunumu } from "../server/eposta";
import { gonderimAlaniEkleEylemi, gonderimDogrulaEylemi, gonderimOrtakAcEylemi } from "./eylemler";
import { Cerceve } from "./ortak";
import stil from "./yonetim.module.css";

const ALAN = "y-ep-alan", YEREL = "y-ep-yerel", ORTAK_YEREL = "y-ep-ortak-yerel";
const DURUM = { bekliyor: { ad: "Doğrulanmadı", tur: "bekliyor" }, dogrulandi: { ad: "Doğrulandı", tur: "tamam" }, hata: { ad: "Doğrulanamadı", tur: "red" } } as const;
type Yol = "ortak" | "kendi";

/** tek değerin kopyalama tuşu (pano reddedilirse değer seçilir) */
function KopyalaTus({ deger, ad }: { deger: string; ad: string }) {
  const [s, setS] = useState<"tamam" | "hata" | null>(null);
  return (
    <Tus tur="ikincil" ikon={s === "tamam" ? "check" : "copy"} aria-label={`${ad} değerini kopyala`} onClick={() => {
      navigator.clipboard.writeText(deger).then(() => setS("tamam"), () => setS("hata"));
    }}>{s === "tamam" ? "Kopyalandı" : s === "hata" ? "Elle kopyalayın" : "Kopyala"}</Tus>
  );
}
const sutunlar: Sutun<DnsKaydi & { i: number }>[] = [
  { k: "tur", genislik: "10%", baslik: "Tür", kart: "rozet", sira: 1, siralanmaz: true, hucre: (x) => <Kod>{x.tur}</Kod> },
  { k: "ad", genislik: "22%", baslik: "Ad", kart: "ust", sira: 1, siralanmaz: true, hucre: (x) => <><span className={stil.dnsDeger}>{x.ad}</span>{x.kayit && <AltSatir>{x.kayit}</AltSatir>}</> },
  { k: "deger", genislik: "40%", baslik: "Değer", kart: "govde", sira: 2, siralanmaz: true,
    hucre: (x) => <><span className={stil.dnsDeger}>{x.deger}</span>{x.oncelik !== null && <AltSatir>{`öncelik ${x.oncelik}`}</AltSatir>}</> },
  { k: "durum", genislik: "12%", baslik: "Durum", kart: "govde", sira: 3, siralanmaz: true, hucre: (x) => x.durum === "verified" ? <Rozet tur="tamam">Tamam</Rozet> : <Rozet tur="bekliyor">Bekliyor</Rozet> },
  { k: "kopya", genislik: "16%", baslik: "Kopyala", gizliBaslik: true, kart: "eylem", sira: 4, siralanmaz: true, hucre: (x) => <KopyalaTus deger={x.deger} ad={`${x.tur} ${x.ad}`} /> },
];

export function GonderimBolumu({ id, g, acik, ortakAlan = null, kisaAd = "", firmaAd = "", ciplak = false }: {
  id: string; g: GonderimGorunumu | null; acik: boolean;
  /** probata'nın ortak gönderen alan adı (yoksa null — yalnız "kendi alan adı" yolu) */
  ortakAlan?: string | null;
  /** ortak yolda adresin önerilen yerel kısmı ve gönderen önizlemesi */
  kisaAd?: string; firmaAd?: string;
  /** kurulum adımının içinde: başlıksız */
  ciplak?: boolean;
}) {
  const [duzenle, setDuzenle] = useState(!g);
  const [yol, setYol] = useState<Yol>(g ? (g.ortak ? "ortak" : "kendi") : ortakAlan ? "ortak" : "kendi");
  const [alan, setAlan] = useState(g && !g.ortak ? g.alan : "");
  const [yerel, setYerel] = useState(g && !g.ortak ? g.genel.split("@")[0]! : "bilgi");
  const [ortakYerel, setOrtakYerel] = useState(g?.ortak ? g.genel.split("@")[0]! : kisaAd);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();
  const bildir = useBildir();
  const ekle = () => baslat(async () => {
    const f = new FormData();
    f.set("alan", alan);
    f.set("yerel", yerel);
    const r = await gonderimAlaniEkleEylemi(id, f);
    if (r.hatalar) {
      setHatalar(r.hatalar);
      requestAnimationFrame(() => document.getElementById(r.hatalar!.alan ? ALAN : YEREL)?.focus());
      return;
    }
    if (!r.tamam) { setGenel(r.genel ?? "Alan adı eklenemedi."); return; }
    setHatalar({}); setGenel(null); setDuzenle(false);
    bildir(r.gorunum?.durum === "dogrulandi" ? `Alan adı kaydedildi: ${r.gorunum.alan} (doğrulanmış).` : "Alan adı eklendi: DNS kayıtlarını alan adı yönetimine girip “Doğrula”ya basın.");
  });
  const ortakAc = () => baslat(async () => {
    const f = new FormData();
    f.set("yerel", ortakYerel);
    const r = await gonderimOrtakAcEylemi(id, f);
    if (r.hatalar) {
      setHatalar(r.hatalar);
      requestAnimationFrame(() => document.getElementById(ORTAK_YEREL)?.focus());
      return;
    }
    if (!r.tamam) { setGenel(r.genel ?? "Gönderim açılamadı."); return; }
    setHatalar({}); setGenel(null); setDuzenle(false);
    bildir(r.gorunum?.durum === "dogrulandi" ? `E-posta gönderimi açıldı: ${r.gorunum.genel}` : "Adres kaydedildi; gönderim henüz açılmadı — “Doğrula”ya basın.");
  });
  const dogrula = () => baslat(async () => {
    const r = await gonderimDogrulaEylemi(id);
    if (!r.tamam) { setGenel(r.genel ?? "Doğrulanamadı."); return; }
    setGenel(null);
    bildir(r.gorunum?.durum === "dogrulandi" ? "Alan adı doğrulandı; firmanın e-postaları artık gönderilir."
      : "Henüz doğrulanmadı: DNS kayıtları yayılınca (birkaç dakika – birkaç saat) yeniden deneyin.");
  });
  const vazgec = () => {
    if (!g) return;
    setDuzenle(false); setHatalar({});
    setYol(g.ortak ? "ortak" : "kendi");
    setAlan(g.ortak ? "" : g.alan); setYerel(g.ortak ? "bilgi" : g.genel.split("@")[0]!); setOrtakYerel(g.ortak ? g.genel.split("@")[0]! : kisaAd);
  };
  const ortakAdres = `${ortakYerel.trim() || kisaAd}@${ortakAlan ?? ""}`;

  return (
    <Cerceve ciplak={ciplak} id="y-b-eposta" baslik="E-posta gönderimi">
      {!acik && <SeritKap><Serit tur="bilgi" ikon="info">Şu an kapalı: Resend anahtarı tanımlı değil.</Serit></SeritKap>}
      {genel && <SeritKap><Serit tur="hata" ikon="circle-alert">{genel}</Serit></SeritKap>}
      {g && (
        <BilgiListesi>
          <Bilgi etiket="Gönderen alan adı">{g.alan}<AltSatir><Rozet tur={DURUM[g.durum].tur}>{DURUM[g.durum].ad}</Rozet></AltSatir></Bilgi>
          <Bilgi etiket="Genel adres">{g.genel}</Bilgi>
          {g.ortak && <Bilgi etiket="Yol" genis="cift">probata&apos;nın alan adı üzerinden<AltSatir>Alıcı gönderende kişinin ve firmanın adını görür; cevaplar e-postayı gönderen kişiye gider.</AltSatir></Bilgi>}
        </BilgiListesi>
      )}
      {g && !g.ortak && g.kayitlar.length > 0 && (
        <>
          <p className={stil.etiketUst}>DNS kayıtları — firmanın alan adı yönetimine (alan adının alındığı firma) girilir:</p>
          <Liste baslik="DNS kayıtları" sutunlar={sutunlar} kayitlar={g.kayitlar.map((x, i) => ({ ...x, i }))} anahtar={(x) => `${x.i}`} />
        </>
      )}
      {g && !duzenle && (
        <div className={stil.eylemSol}>
          {(!g.ortak || g.durum !== "dogrulandi") && <Tus ikon="circle-check" disabled={!acik || bekliyor} aria-busy={bekliyor || undefined} onClick={dogrula}>Doğrula</Tus>}
          <Tus tur="ikincil" ikon="pencil" disabled={!acik || bekliyor} onClick={() => setDuzenle(true)}>{g.ortak ? "Adresi ya da yolu değiştir" : "Alan adını değiştir"}</Tus>
        </div>
      )}
      {duzenle && (
        <>
          {ortakAlan && (
            <div className={stil.yolSecim} role="group" aria-label="Gönderim yolu">
              <button type="button" className={stil.yol} aria-pressed={yol === "ortak"} disabled={bekliyor} onClick={() => { setYol("ortak"); setHatalar({}); }}>
                <span className={stil.yolAd}>{ortakAlan} üzerinden</span>
                <span className={stil.yolAciklama}>Hemen çalışır, firmanın yapacağı bir şey yok. Alıcı gönderende firmanın adını görür; cevaplar e-postayı gönderen kişiye gider.</span>
              </button>
              <button type="button" className={stil.yol} aria-pressed={yol === "kendi"} disabled={bekliyor} onClick={() => { setYol("kendi"); setHatalar({}); }}>
                <span className={stil.yolAd}>Firmanın kendi alan adından</span>
                <span className={stil.yolAciklama}>Firma, alan adının ayarlarına buradaki kayıtları ekler; siz doğrularsınız. İkinci alan adı için Resend&apos;in ücretli planı gerekir.</span>
              </button>
            </div>
          )}
          {ortakAlan && yol === "ortak" ? (
            <>
              <Alan id={ORTAK_YEREL} etiket="Adres (@ öncesi)" hata={hatalar.yerel} sonuc={hatalar.yerel ? undefined : ortakAdres}>
                <Girdi id={ORTAK_YEREL} value={ortakYerel} disabled={!acik} maxLength={64} spellCheck={false} placeholder={kisaAd} hata={!!hatalar.yerel} mesajli
                  onChange={(e) => { setOrtakYerel(e.target.value); setHatalar({}); }} />
              </Alan>
              <BilgiListesi>
                <Bilgi etiket="Alıcının göreceği gönderen" genis="cift"><span className={stil.dnsDeger}>{`"Ad Soyad · ${firmaAd}" <${ortakAdres}>`}</span></Bilgi>
                <Bilgi etiket="Cevaplar" genis="cift">E-postayı gönderen kişinin kendi adresine</Bilgi>
              </BilgiListesi>
              <div className={stil.eylemSol}>
                <Tus ikon="check" disabled={!acik || bekliyor} aria-busy={bekliyor || undefined} onClick={ortakAc}>Bu yolla aç</Tus>
                {g && <Tus tur="ikincil" disabled={bekliyor} onClick={vazgec}>Vazgeç</Tus>}
              </div>
            </>
          ) : (
            <>
              <Alan id={ALAN} etiket="Gönderen alan adı" hata={hatalar.alan}>
                <Girdi id={ALAN} value={alan} disabled={!acik} maxLength={100} spellCheck={false} placeholder="firmaniz.com.tr" inputMode="url" hata={!!hatalar.alan}
                  mesajli={!!hatalar.alan} onChange={(e) => { setAlan(e.target.value); setHatalar({}); }} />
              </Alan>
              <Alan id={YEREL} etiket="Genel adres (@ öncesi)" hata={hatalar.yerel} sonuc={hatalar.yerel ? undefined : `${yerel || "bilgi"}@${alan || "firmaniz.com.tr"}`}>
                <Girdi id={YEREL} value={yerel} disabled={!acik} maxLength={64} spellCheck={false} placeholder="bilgi" hata={!!hatalar.yerel} mesajli
                  onChange={(e) => { setYerel(e.target.value); setHatalar({}); }} />
              </Alan>
              <div className={stil.eylemSol}>
                <Tus ikon="check" disabled={!acik || bekliyor || !alan.trim()} aria-busy={bekliyor || undefined} onClick={ekle}>{g && !g.ortak ? "Kaydet" : "Alan adını ekle"}</Tus>
                {g && <Tus tur="ikincil" disabled={bekliyor} onClick={vazgec}>Vazgeç</Tus>}
              </div>
            </>
          )}
        </>
      )}
    </Cerceve>
  );
}
