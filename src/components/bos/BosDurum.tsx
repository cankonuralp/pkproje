/* BOŞ DURUM — tek üretici (CLAUDE.md §3 "src/components/: TEK ÜRETİCİLER"). Maketteki .a-bos ile aynı görünüm.
   Kalıp 14: boş durum süzgecin ALTINDA çıkar; süzgeç içerik yokken de görünür (süzgeç gelince).
   Eylem (varsa) ikincil tuş görünümünde, içerik kadar geniş (kalıp 1), dokunma hedefi denetim yüksekliğinde. */
import Link from "next/link";
import { Ikon } from "../ikon/Ikon";
import stil from "./BosDurum.module.css";

export interface BosDurumEylemi { href: string; etiket: string; ikon?: string }

export function BosDurum({ ikon, baslik, metin, eylem }: { ikon: string; baslik: string; metin: string; eylem?: BosDurumEylemi }) {
  return (
    <div className={stil.bos} role="status">
      <div className={stil.ikon}><Ikon ad={ikon} /></div>
      <p className={stil.baslik}>{baslik}</p>
      <p className={stil.metin}>{metin}</p>
      {eylem && (
        <Link className={stil.eylem} href={eylem.href}>
          {eylem.ikon && <Ikon ad={eylem.ikon} kucuk />}
          {eylem.etiket}
        </Link>
      )}
    </div>
  );
}
