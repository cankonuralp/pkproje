"use client";
/* Giriş formu — maketle aynı metinler. Parola alanında sessizlik (anayasa 5.3): sayfa geneli tuş dinleyicisi parolaya dokunmaz; göster / gizle
   tuşu alanın YANINDA. Hata iletisi hesabın var olup olmadığını söylemez. Gönderirken tuş kilitli (çift gönderim yok). */
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { TemaTusu } from "../../../components/kabuk/Kabuk";
import isaretKoyu from "../../../components/kabuk/marka/probata-yatay-koyu-zemin.svg";
import logoRenkli from "../../../components/kabuk/marka/probata-yatay-renkli.svg";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { girisEylemi, type GirisDurumu } from "../../../server/kimlik/eylemler";
import stil from "./giris.module.css";

export function GirisFormu({ neden, donus, adres, firmaVar }: { neden?: "oturum" | "cikis"; donus?: string; adres: string; firmaVar: boolean }) {
  const [durum, eylem, gonderiyor] = useActionState<GirisDurumu, FormData>(girisEylemi, {});
  const [goster, setGoster] = useState(false);
  /* React eylem bitince formu sıfırlar → işaret durumda tutulur (hatalı denemeden sonra kaybolmasın) */
  const [hatirla, setHatirla] = useState(false);
  /* başarılı giriş: sunucunun verdiği site içi adrese tam geçiş (çerez kesin gider); yalnız "/" ile başlayan yol (sunucu da süzdü) */
  useEffect(() => {
    if (durum.yonlendir?.startsWith("/") && !durum.yonlendir.startsWith("//")) window.location.replace(durum.yonlendir);
  }, [durum.yonlendir]);
  return (
    <main className={stil.giris}>
      <TemaTusu sinif={stil.tema} />
      <div className={stil.form}>
        <Image className={`${stil.logo} ${stil.acik}`} src={logoRenkli} alt="probata" width={148} height={37} priority unoptimized />
        <Image className={`${stil.logo} ${stil.koyu}`} src={isaretKoyu} alt="probata" width={148} height={37} unoptimized />
        <form className={stil.kart} action={eylem} noValidate>
          <div>
            <h1 className={stil.baslik}>Giriş</h1>
            <p className={stil.adres}>{adres}</p>
          </div>
          {!firmaVar && <Serit tur="hata">Bu adreste kayıtlı bir firma yok. Firmanızın adresini kontrol edin.</Serit>}
          {neden === "oturum" && !durum.hata && <Serit tur="bilgi" ikon="clock">Uzun süre işlem yapılmadığı için oturumunuz kapandı. Devam etmek için yeniden giriş yapın.</Serit>}
          {neden === "cikis" && !durum.hata && <Serit tur="onay">Çıkış yaptınız; oturumunuz kapatıldı.</Serit>}
          {durum.hata && <Serit tur="hata" ikon="circle-alert">{durum.hata}</Serit>}
          <div className={stil.alan}>
            <label className={stil.etiket} htmlFor="g-eposta">E-posta</label>
            <input className={stil.girdi} id="g-eposta" name="eposta" type="email" inputMode="email" autoComplete="username" maxLength={254}
              defaultValue={durum.eposta ?? ""} required aria-invalid={durum.hata ? true : undefined} />
          </div>
          <div className={stil.alan}>
            <label className={stil.etiket} htmlFor="g-parola">Parola</label>
            <div className={stil.parola}>
              <input className={stil.girdi} id="g-parola" name="parola" type={goster ? "text" : "password"} autoComplete="current-password" maxLength={200} required
                aria-invalid={durum.hata ? true : undefined} />
              <button className={stil.goster} type="button" onClick={() => setGoster(!goster)} aria-pressed={goster} aria-label={goster ? "Parolayı gizle" : "Parolayı göster"}>
                <Ikon ad={goster ? "eye-off" : "eye"} />
              </button>
            </div>
          </div>
          <label className={stil.hatirla}>
            <input type="checkbox" name="hatirla" value="1" checked={hatirla} onChange={(e) => setHatirla(e.target.checked)} />
            <span>Beni hatırla</span>
          </label>
          <p className={stil.ipucu} id="g-hatirla-ipucu">{hatirla ? "Bu cihazda 14 güne kadar açık kalır. Ortak bilgisayarda işaretlemeyin." : "Tarayıcı kapanınca oturum kapanır."}</p>
          {donus && <input type="hidden" name="donus" value={donus} />}
          <div className={stil.tuslar}>
            <Tus type="submit" ikon="log-in" disabled={gonderiyor || !firmaVar || !!durum.yonlendir} aria-busy={gonderiyor || undefined}>Giriş yap</Tus>
          </div>
          <p className={stil.ayrac}>Müşteriler de aynı adresten girer; parolaları sistemde kayıtlı e-postalarına gönderilir.</p>
        </form>
      </div>
    </main>
  );
}
