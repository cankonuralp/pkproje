/* probata YÖNETİM KABUĞU (348; maket maket-ortak.js o.yonetim — 2026-10-03): firmaların görmediği, yalnız probata ekibinin sayfası. Menüsüz;
   solda probata logosu + "Yönetim", sağda tema ve kullanıcı (yalnız Çıkış yap — yönetim çıkışı). */
import Image from "next/image";
import type { ReactNode } from "react";
import { yonetimCikisEylemi } from "../../server/yonetim/eylemler";
import { KullaniciMenusu, TemaTusu, type KabukKullanicisi } from "./Kabuk";
import logoKoyu from "./marka/probata-yatay-koyu-zemin.svg";
import logoRenkli from "./marka/probata-yatay-renkli.svg";
import stil from "./YonetimKabugu.module.css";

export function YonetimKabugu({ children, kullanici }: { children: ReactNode; kullanici: KabukKullanicisi }) {
  return (
    <div className={stil.kabuk}>
      <header className={stil.ust}>
        <Image className={`${stil.logo} ${stil.acik}`} src={logoRenkli} alt="probata" width={112} height={28} priority unoptimized />
        <Image className={`${stil.logo} ${stil.koyu}`} src={logoKoyu} alt="probata" width={112} height={28} unoptimized />
        <span className={stil.panel}>Yönetim</span>
        <div className={stil.bosluk} />
        <TemaTusu />
        <KullaniciMenusu kullanici={kullanici} cikis={yonetimCikisEylemi} />
      </header>
      <main className={stil.icerik}>{children}</main>
    </div>
  );
}
