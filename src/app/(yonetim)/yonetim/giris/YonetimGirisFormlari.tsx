"use client";
/* YÖNETİM GİRİŞ FORMLARI (348) — firma girişiyle aynı kart (giris.module.css, maket giris.html AA1). Üç adım: parola · doğrulama kodu · ilk
   kurulum (anahtar + kod + yeni parola). Parola alanında sessizlik (anayasa 5.3); gönderirken tuş kilitli. Başarılı adımda sunucunun verdiği sabit
   site içi adrese tam sayfa geçiş (çerez kesin gider). */
import Image from "next/image";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Ikon } from "../../../../components/ikon/Ikon";
import { TemaTusu } from "../../../../components/kabuk/Kabuk";
import logoKoyu from "../../../../components/kabuk/marka/probata-yatay-koyu-zemin.svg";
import logoRenkli from "../../../../components/kabuk/marka/probata-yatay-renkli.svg";
import { useKopyala } from "../../../../components/pencere/Kopyala";
import { Serit } from "../../../../components/serit/Serit";
import { Tus } from "../../../../components/tus/Tus";
import {
  yonetimGirisEylemi, yonetimKodEylemi, yonetimKurulumEylemi, type YGirisDurumu, type YKodDurumu, type YKurulumDurumu,
} from "../../../../server/yonetim/eylemler";
import stil from "../../../(acik)/giris/giris.module.css";

const yonlendir = (y?: string) => { if (y?.startsWith("/yonetim") && !y.startsWith("//")) window.location.replace(y); };

/** `cikis`: kartın altında "Girişe dön"ün gönderdiği ayrı çıkış formu (355: düz form isteği /yonetim/cikis; tuş `form="yg-cikis"` ile bağlanır) */
function Kart({ baslik, alt, children, action, cikis = false }: { baslik: string; alt: string; children: ReactNode; action: (f: FormData) => void; cikis?: boolean }) {
  return (
    <main className={stil.giris}>
      <TemaTusu sinif={stil.tema} />
      <div className={stil.form}>
        <Image className={`${stil.logo} ${stil.acik}`} src={logoRenkli} alt="probata" width={148} height={37} priority unoptimized />
        <Image className={`${stil.logo} ${stil.koyu}`} src={logoKoyu} alt="probata" width={148} height={37} unoptimized />
        <form className={stil.kart} action={action} noValidate>
          <div>
            <h1 className={stil.baslik}>{baslik}</h1>
            <p className={stil.adres}>{alt}</p>
          </div>
          {children}
        </form>
        {cikis && <form id="yg-cikis" action="/yonetim/cikis" method="post" hidden />}
      </div>
    </main>
  );
}

/** `gecersiz`: ileti alanın altında değil kartın başında (giriş adımı) — alan yalnız işaretlenir */
function ParolaAlani({ id, ad, etiket, otomatik, hata, ipucu, gecersiz = false }: {
  id: string; ad: string; etiket: string; otomatik: string; hata?: string; ipucu?: string; gecersiz?: boolean;
}) {
  const [goster, setGoster] = useState(false);
  return (
    <div className={stil.alan}>
      <label className={stil.etiket} htmlFor={id}>{etiket}</label>
      <div className={stil.parola}>
        <input className={stil.girdi} id={id} name={ad} type={goster ? "text" : "password"} autoComplete={otomatik} maxLength={200} required
          aria-invalid={hata || gecersiz ? true : undefined} aria-describedby={hata || ipucu ? `${id}-ipucu` : undefined} />
        <button className={stil.goster} type="button" onClick={() => setGoster(!goster)} aria-pressed={goster} aria-label={goster ? "Parolayı gizle" : "Parolayı göster"}>
          <Ikon ad={goster ? "eye-off" : "eye"} />
        </button>
      </div>
      {(hata || ipucu) && <p className={hata ? `${stil.ipucu} ${stil.ipucuUyari}` : stil.ipucu} id={`${id}-ipucu`}>{hata ?? ipucu}</p>}
    </div>
  );
}

function KodAlani({ hata }: { hata?: string }) {
  /* hata yoksa ipucu, varsa ileti (role="alert" değil — odak alana gelir, aria-describedby okunur) */
  return (
    <div className={stil.alan}>
      <label className={stil.etiket} htmlFor="y-kod">Doğrulama kodu</label>
      <input className={stil.girdi} id="y-kod" name="kod" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required
        aria-invalid={hata ? true : undefined} aria-describedby="y-kod-ipucu" />
      <p className={hata ? `${stil.ipucu} ${stil.ipucuUyari}` : stil.ipucu} id="y-kod-ipucu">
        {hata ?? "Doğrulama uygulamasında “probata yönetim” için gösterilen 6 haneli kod."}
      </p>
    </div>
  );
}

export function YonetimGirisFormu({ neden, adres }: { neden?: "oturum" | "cikis"; adres: string }) {
  const [durum, eylem, gonderiyor] = useActionState<YGirisDurumu, FormData>(yonetimGirisEylemi, {});
  useEffect(() => yonlendir(durum.yonlendir), [durum.yonlendir]);
  /* hata dönünce odak alana (firma girişiyle aynı — 2026-10-08 canlı denetim): e-posta boşsa oraya, yoksa parolaya */
  useEffect(() => {
    if (!durum.hata) return;
    const e = document.getElementById("y-eposta") as HTMLInputElement | null;
    (e && !e.value ? e : document.getElementById("yg-parola"))?.focus();
  }, [durum]);
  return (
    <Kart baslik="Yönetim girişi" alt={adres} action={eylem}>
      {neden === "oturum" && !durum.hata && <Serit tur="bilgi" ikon="clock">Oturumunuz kapandı. Devam etmek için yeniden giriş yapın.</Serit>}
      {neden === "cikis" && !durum.hata && <Serit tur="onay">Çıkış yaptınız; oturumunuz kapatıldı.</Serit>}
      {durum.hata && <Serit tur="hata" ikon="circle-alert">{durum.hata}</Serit>}
      <div className={stil.alan}>
        <label className={stil.etiket} htmlFor="y-eposta">E-posta</label>
        <input className={stil.girdi} id="y-eposta" name="eposta" type="email" inputMode="email" autoComplete="username" maxLength={254}
          defaultValue={durum.eposta ?? ""} required aria-invalid={durum.hata ? true : undefined} />
      </div>
      <ParolaAlani id="yg-parola" ad="parola" etiket="Parola" otomatik="current-password" gecersiz={!!durum.hata} />
      <div className={stil.tuslar}>
        <Tus type="submit" ikon="log-in" disabled={gonderiyor || !!durum.yonlendir} aria-busy={gonderiyor || undefined}>Devam</Tus>
      </div>
      <p className={stil.ayrac}>Bu sayfa yalnız probata ekibine açık; giriş iki adımlıdır (parola + doğrulama kodu).</p>
    </Kart>
  );
}

export function YonetimKodFormu({ eposta }: { eposta: string }) {
  const [durum, eylem, gonderiyor] = useActionState<YKodDurumu, FormData>(yonetimKodEylemi, {});
  useEffect(() => yonlendir(durum.yonlendir), [durum.yonlendir]);
  /* hata dönünce kod alanına odak (form eylem bitince alanları boşaltır; hatalı alan aranmasın) */
  useEffect(() => { if (durum.hata) document.getElementById("y-kod")?.focus(); }, [durum]);
  return (
    <Kart baslik="Doğrulama kodu" alt={eposta} action={eylem} cikis>
      {durum.hata && <Serit tur="hata" ikon="circle-alert">{durum.hata}</Serit>}
      <KodAlani />
      <div className={stil.tuslar}>
        <Tus type="submit" ikon="shield-check" disabled={gonderiyor || !!durum.yonlendir} aria-busy={gonderiyor || undefined}>Doğrula</Tus>
        <button className={stil.baglanti} type="submit" form="yg-cikis">Girişe dön</button>
      </div>
    </Kart>
  );
}

export function YonetimKurulumFormu({ eposta, anahtar, adres }: { eposta: string; anahtar: string; adres: string }) {
  const [durum, eylem, gonderiyor] = useActionState<YKurulumDurumu, FormData>(yonetimKurulumEylemi, {});
  useEffect(() => yonlendir(durum.yonlendir), [durum.yonlendir]);
  /* sunucudan dönen ilk hatalı alana odak; ileti alana aria-describedby ile bağlı, odakla okunur (347–348 incelemesi) */
  useEffect(() => {
    const h = durum.hata;
    const k = h?.kod ? "y-kod" : h?.p1 ? "y-p1" : h?.p2 ? "y-p2" : null;
    if (k) document.getElementById(k)?.focus();
  }, [durum]);
  const kopya = useKopyala(anahtar, "y-anahtar");
  const h = durum.hata ?? {};
  return (
    <Kart baslik="İki adımlı giriş kurulumu" alt={eposta} action={eylem}>
      <Serit tur="bilgi" ikon="shield-check">İlk girişiniz: telefonunuzdaki doğrulama uygulamasını bağlayın ve kendi parolanızı belirleyin.</Serit>
      {h.genel && <Serit tur="hata" ikon="circle-alert">{h.genel}</Serit>}
      <div className={stil.alan}>
        <p className={stil.etiket}>1. Anahtarı uygulamaya ekleyin</p>
        <p className={stil.ipucu}>Google Authenticator, Microsoft Authenticator ya da benzeri bir uygulamada “anahtar gir” ile ekleyin (hesap adı: probata yönetim).</p>
        <p className={stil.adres} id="y-anahtar" translate="no">{anahtar.match(/.{1,4}/g)?.join(" ")}</p>
        <div className={stil.tuslar}>
          {kopya.tus}
          <a className={stil.baglanti} href={adres}>Bu cihazdaki uygulamada aç</a>
        </div>
        {kopya.durum}
      </div>
      <KodAlani hata={h.kod} />
      <ParolaAlani id="y-p1" ad="p1" etiket="Yeni parola" otomatik="new-password" hata={h.p1} ipucu="En az 10 karakter; harf ve rakam içermeli." />
      <ParolaAlani id="y-p2" ad="p2" etiket="Yeni parola (tekrar)" otomatik="new-password" hata={h.p2} />
      <div className={stil.tuslar}>
        <Tus type="submit" ikon="check" disabled={gonderiyor || !!durum.yonlendir} aria-busy={gonderiyor || undefined}>Kurulumu tamamla</Tus>
      </div>
    </Kart>
  );
}
