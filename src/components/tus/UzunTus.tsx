"use client";
/* UZUN TUŞ — tek mekanizma (kalıp 12). Uzun süren iş (PDF üret, toplu indir, yedek al, gönder): basılınca tuşun üstünde dönen simge +
   etiket; iş adımını ilerle("…") ile yazar; 3 sn sonra geçen süre görünür; iş sürerken ikinci basış yok sayılır (uzunIsKilidi), tuş
   odağını korur (disabled değil, aria-busy). Bitince ya da hata olunca tuş eski hâline döner; hata SESSİZCE YUTULMAZ: hata işleyicisi
   verilmediyse bildirimle söylenir (anayasa 2.8). */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useBildir } from "../bildirim/Bildirim";
import { Ikon } from "../ikon/Ikon";
import { tusSinifi, type TusTuru } from "./Tus";
import { uzunIsKilidi, type UzunIs } from "./uzunIs";
import stil from "./Tus.module.css";

const SURE_GOSTER_MS = 3000;

export function UzunTus<T>({ tur = "birincil", ikon, children, is, hata, ...veri }: {
  tur?: TusTuru;
  ikon?: string;
  children: ReactNode;
  is: UzunIs<T>;
  hata?: (e: unknown) => void;
} & { [k: `data-${string}`]: string | undefined }) {
  const kilit = useRef(uzunIsKilidi());
  const [adim, setAdim] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [sn, setSn] = useState(0);
  const bildir = useBildir();

  useEffect(() => {
    if (!mesgul) return;
    const bas = Date.now();
    const zaman = setInterval(() => setSn(Math.floor((Date.now() - bas) / 1000)), 500);
    return () => { clearInterval(zaman); setSn(0); };
  }, [mesgul]);

  const bas = () => {
    const soz = kilit.current.calistir(is, (a) => setAdim(a));
    if (!soz) return;
    setMesgul(true);
    soz.catch((e) => (hata ? hata(e) : bildir(`İşlem tamamlanamadı: ${e instanceof Error ? e.message : String(e)}`)))
      .finally(() => { setMesgul(false); setAdim(null); });
  };

  return (
    <button type="button" className={tusSinifi(tur, mesgul ? stil.mesgul : undefined)} aria-busy={mesgul || undefined} onClick={bas} {...veri}>
      {mesgul ? <span className={stil.donen} aria-hidden="true" /> : ikon && <Ikon ad={ikon} kucuk />}
      <span>{mesgul && adim ? adim : children}</span>
      {mesgul && sn * 1000 >= SURE_GOSTER_MS && <span className={stil.sure}>{sn} sn</span>}
    </button>
  );
}
