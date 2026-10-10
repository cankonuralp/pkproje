/* ÇERÇEVE DÜZENİ (472; reisim 2026-10-10, maket kararları k1–k4) — kabuksuz sayfa: yalnız başka bir sayfamızın içindeki çerçevede (iframe)
   açılır — format kurucusunun ve sürüm sayfasının "Saha ekranı" görünümü, denetçinin tablet / telefon genişliğinde göreceği ekran. Menü ve üst
   çubuk yok; oturum ve yetki sayfanın kendisinde (modulOturumu). Gömülmesine yalnız kendi kökenimiz izin verir (src/proxy.ts frame-ancestors
   'self' — yalnız bu yollarda; öteki her sayfa 'none'). */
import type { ReactNode } from "react";
import stil from "./cerceve.module.css";

export default function CerceveDuzeni({ children }: { children: ReactNode }) {
  return <main className={stil.icerik}>{children}</main>;
}
