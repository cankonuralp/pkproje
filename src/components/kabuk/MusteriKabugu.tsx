/* MÜŞTERİ PANELİ KABUĞU (maket maket-ortak.js o.musteri — 2026-09-24 M11; reisim 112: üst çubukta muayene firmasının logosu + adı, probata logosu
   yok; S1: kullanıcı menüsünde yalnız Çıkış yap). Firmanın modül menüsü yok; aynı üst çubuk ögeleri (tema, kullanıcı) firma kabuğundan. Logo
   yükleme Firma ayarları kalemiyle gelir; şimdilik logo yeri firmanın baş harfleri. */
import type { ReactNode } from "react";
import { KullaniciMenusu, TemaTusu, type KabukKullanicisi } from "./Kabuk";
import stil from "./MusteriKabugu.module.css";

const basHarfler = (ad: string) => ad.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toLocaleUpperCase("tr")).join("");

export function MusteriKabugu({ children, firma, kullanici }: { children: ReactNode; firma: string; kullanici: KabukKullanicisi }) {
  return (
    <div className={stil.kabuk}>
      <header className={stil.ust}>
        <span className={stil.logo} role="img" aria-label={`${firma} logosu`}>{basHarfler(firma)}</span>
        <span className={stil.firma}>{firma}</span>
        <div className={stil.bosluk} />
        <TemaTusu />
        <KullaniciMenusu kullanici={kullanici} />
      </header>
      <main className={stil.icerik}>{children}</main>
    </div>
  );
}
