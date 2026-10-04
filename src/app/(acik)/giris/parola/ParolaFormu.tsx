"use client";
/* Yeni parola formu — maket metinleri (giris.html #/gecici). Parola alanında sessizlik (anayasa 5.3); göster / gizle alanın yanında. */
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { Ikon } from "../../../../components/ikon/Ikon";
import isaretKoyu from "../../../../components/kabuk/marka/probata-yatay-koyu-zemin.svg";
import logoRenkli from "../../../../components/kabuk/marka/probata-yatay-renkli.svg";
import { Serit } from "../../../../components/serit/Serit";
import { Tus } from "../../../../components/tus/Tus";
import { parolaBelirleEylemi, type ParolaDurumu } from "../../../../server/kimlik/eylemler";
import stil from "../giris.module.css";

function ParolaAlani({ id, etiket, ipucu, hata, goster, degistir }: { id: string; etiket: string; ipucu: string; hata?: string; goster: boolean; degistir: () => void }) {
  return (
    <div className={stil.alan}>
      <label className={stil.etiket} htmlFor={id}>{etiket}</label>
      <div className={stil.parola}>
        <input className={stil.girdi} id={id} name={id.slice(2)} type={goster ? "text" : "password"} autoComplete="new-password" maxLength={200} required
          aria-invalid={hata ? true : undefined} aria-describedby={`${id}-ipucu`} />
        <button className={stil.goster} type="button" onClick={degistir} aria-pressed={goster} aria-label={goster ? "Parolayı gizle" : "Parolayı göster"}>
          <Ikon ad={goster ? "eye-off" : "eye"} />
        </button>
      </div>
      <p className={hata ? `${stil.ipucu} ${stil.ipucuUyari}` : stil.ipucu} id={`${id}-ipucu`}>{hata ?? ipucu}</p>
    </div>
  );
}

export function ParolaFormu({ eposta, adres, donus }: { eposta: string; adres: string; donus?: string }) {
  const [durum, eylem, gonderiyor] = useActionState<ParolaDurumu, FormData>(parolaBelirleEylemi, {});
  const [goster, setGoster] = useState(false);
  useEffect(() => {
    if (durum.yonlendir?.startsWith("/") && !durum.yonlendir.startsWith("//")) window.location.replace(durum.yonlendir);
  }, [durum.yonlendir]);
  useEffect(() => {
    if (durum.hata?.p1) document.getElementById("g-p1")?.focus();
    else if (durum.hata?.p2) document.getElementById("g-p2")?.focus();
  }, [durum.hata]);
  return (
    <main className={stil.giris}>
      <div className={stil.form}>
        <Image className={`${stil.logo} ${stil.acik}`} src={logoRenkli} alt="probata" width={148} height={37} priority unoptimized />
        <Image className={`${stil.logo} ${stil.koyu}`} src={isaretKoyu} alt="probata" width={148} height={37} unoptimized />
        <form className={stil.kart} action={eylem} noValidate>
          <div>
            <h1 className={stil.baslik}>Parolayı değiştir</h1>
            <p className={stil.adres}>{adres}</p>
          </div>
          <Serit tur="bilgi" ikon="key-round">Geçici parolayla giriş yapıldı: <b>{eposta}</b>.</Serit>
          {durum.hata?.genel && <Serit tur="hata" ikon="circle-alert">{durum.hata.genel}</Serit>}
          <ParolaAlani id="g-p1" etiket="Yeni parola" ipucu="En az 10 karakter; harf ve rakam içerir." hata={durum.hata?.p1} goster={goster} degistir={() => setGoster(!goster)} />
          <ParolaAlani id="g-p2" etiket="Yeni parola (tekrar)" ipucu="Aynısını yazın." hata={durum.hata?.p2} goster={goster} degistir={() => setGoster(!goster)} />
          {donus && <input type="hidden" name="donus" value={donus} />}
          <div className={stil.tuslar}>
            <Tus type="submit" ikon="check" disabled={gonderiyor || !!durum.yonlendir} aria-busy={gonderiyor || undefined}>Kaydet ve devam et</Tus>
            <a className={stil.baglanti} href={donus ?? "/"}>Şimdi değil</a>
          </div>
        </form>
      </div>
    </main>
  );
}
